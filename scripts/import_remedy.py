"""Convert a Remedy XLSX register to monthly aggregates, without exporting tickets.

Uses Python's standard library. The input workbook is never modified.
"""
import argparse
import collections
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import posixpath
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def normalize(value):
    text = unicodedata.normalize("NFKD", str(value or ""))
    return " ".join("".join(c for c in text if not unicodedata.combining(c)).casefold().split())


def month_offset(month, offset):
    year, number = map(int, month.split("-"))
    total = year * 12 + number - 1 + offset
    return f"{total // 12:04d}-{total % 12 + 1:02d}"


def parse_period(value):
    match = re.fullmatch(r"(\d{4})(\d{2})(?:\.0+)?", str(value).strip())
    if not match or not 1 <= int(match[2]) <= 12:
        raise ValueError("Período inválido: se espera AAAAMM, por ejemplo 202602.")
    return f"{match[1]}-{match[2]}"


def read_records(source, sheet_name="Resumen"):
    """Read only the three fields needed for counting from an OOXML workbook."""
    with zipfile.ZipFile(source) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheet = next((s for s in workbook.findall("m:sheets/m:sheet", NS) if s.get("name") == sheet_name), None)
        if sheet is None:
            raise ValueError(f"No se encuentra la hoja {sheet_name}.")
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        relationship = next(r for r in relationships if r.get("Id") == sheet.get(REL))
        if relationship.get("TargetMode") == "External":
            raise ValueError("La hoja debe estar contenida en el archivo.")
        target = relationship.get("Target", "")
        sheet_path = target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join("xl", target))
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        sheet_xml = ET.fromstring(archive.read(sheet_path))

        def cells(row):
            result = {}
            for cell in row.findall("m:c", NS):
                column = re.sub(r"\d", "", cell.get("r", ""))
                if cell.find("m:f", NS) is not None:
                    result[column] = None  # Never execute formulas or trust their cache.
                    continue
                value = cell.find("m:v", NS)
                if cell.get("t") == "s" and value is not None:
                    result[column] = shared[int(value.text)]
                elif cell.get("t") == "inlineStr":
                    result[column] = "".join(cell.find("m:is", NS).itertext())
                else:
                    result[column] = value.text if value is not None else None
            return result

        data_rows = sheet_xml.findall("m:sheetData/m:row", NS)
        if not data_rows:
            raise ValueError("La hoja no contiene registros.")
        headers = {normalize(value): column for column, value in cells(data_rows[0]).items()}
        needed = ("incidente", "periodo", "modulo")
        if any(header not in headers for header in needed):
            raise ValueError("Se requieren las columnas Incidente, Período y Módulo.")
        records = []
        for row in data_rows[1:]:
            values = cells(row)
            if not any(values.values()):
                continue
            record = {header: values.get(headers[header]) for header in needed}
            if any(not str(record[header] or "").strip() for header in needed):
                raise ValueError(f"Faltan datos requeridos en la fila {row.get('r')}.")
            records.append(record)
        return records


def aggregate(records, definitions, as_of):
    categories = [{"id": c["id"], "label": c["label"]} for c in definitions]
    lookup = {normalize(module): c["id"] for c in definitions for module in c["modules"]}
    incidents = {}
    unknown = set()
    unknown_rows = 0
    duplicates = 0
    for record in records:
        identifier = str(record["incidente"]).strip().upper()
        month = parse_period(record["periodo"])
        if month > as_of.strftime("%Y-%m"):
            raise ValueError("Hay registros posteriores al mes de corte. Revisar el período o la fecha de corte.")
        category = lookup.get(normalize(record["modulo"]), "sin-clasificar")
        if category == "sin-clasificar":
            unknown.add(str(record["modulo"]).strip())
            unknown_rows += 1
        entry = (month, category)
        if identifier in incidents:
            if incidents[identifier] != entry:
                raise ValueError("Un ID figura en distintos meses o categorías. Conciliar el registro antes de importar.")
            duplicates += 1
        else:
            incidents[identifier] = entry
    if not incidents:
        raise ValueError("No hay incidentes para contar.")
    if unknown:
        categories.append({"id": "sin-clasificar", "label": "Sin clasificar"})
    monthly = collections.defaultdict(collections.Counter)
    totals = collections.Counter()
    for month, category in incidents.values():
        monthly[month][category] += 1
        totals[category] += 1
    end = as_of.strftime("%Y-%m")
    start = month_offset(end, -11)
    first = min(start, min(monthly))
    months = []
    current = first
    while current <= end:
        loaded = current in monthly
        counts = {c["id"]: monthly[current].get(c["id"], 0) for c in categories} if loaded else None
        months.append({"month": current, "hasData": loaded, "isCurrent": current == end,
                       "total": sum(counts.values()) if loaded else None, "counts": counts})
        current = month_offset(current, 1)
    total = len(incidents)
    assert sum(totals.values()) == total == sum(m["total"] or 0 for m in months)
    return {
        "schemaVersion": 1,
        "asOf": as_of.isoformat(),
        "source": {"type": "Remedy", "label": "Registro de incidencias de analistas técnicos"},
        "window": {"start": start, "end": end},
        "coverage": {"firstReportedMonth": min(monthly), "lastReportedMonth": max(monthly),
                     "completeness": "partial", "reportedMonths": len(monthly)},
        "quality": {"sourceRows": len(records), "uniqueIncidents": total,
                    "duplicateRowsRemoved": duplicates, "unclassifiedIncidents": totals.get("sin-clasificar", 0)},
        "categories": categories,
        "totals": {"all": total, "byCategory": {c["id"]: totals.get(c["id"], 0) for c in categories}},
        "months": months,
    }, {"unknownModuleCount": len(unknown), "unknownRows": unknown_rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--as-of", required=True, type=dt.date.fromisoformat, help="Fecha de referencia AAAA-MM-DD")
    parser.add_argument("--sheet", default="Resumen")
    parser.add_argument("--categories", type=Path, default=Path(__file__).with_name("remedy-categories.json"))
    parser.add_argument("--output", type=Path, default=Path(__file__).parents[1] / "dist" / "data" / "incidents.json")
    args = parser.parse_args()
    if args.input.resolve() == args.output.resolve():
        raise ValueError("La salida debe ser distinta del Excel de origen.")
    source_hash = hashlib.sha256(args.input.read_bytes()).hexdigest()
    definitions = json.loads(args.categories.read_text(encoding="utf-8"))
    result, diagnostics = aggregate(read_records(args.input, args.sheet), definitions, args.as_of)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # Replace only after parsing, validation and reconciliation all succeeded.
    temporary = args.output.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, args.output)
    assert hashlib.sha256(args.input.read_bytes()).hexdigest() == source_hash
    print(json.dumps({**result["quality"], **diagnostics, "output": str(args.output)}, ensure_ascii=True))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, zipfile.BadZipFile, ET.ParseError) as error:
        print(f"No se importó el archivo: {error}", file=sys.stderr)
        sys.exit(1)

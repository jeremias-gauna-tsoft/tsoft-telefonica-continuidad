import datetime as dt
import unittest

from import_remedy import aggregate, parse_period


class ImportRules(unittest.TestCase):
    definitions = [{"id": "pagos", "label": "Pagos", "modules": ["MP", "MP-MASIVO"]}]
    date = dt.date(2026, 10, 26)

    def record(self, identifier="INC1", period="202610", module="MP"):
        return {"incidente": identifier, "periodo": period, "modulo": module}

    def test_duplicate_across_aliases_counts_once(self):
        result, _ = aggregate([self.record(), self.record(" inc1 ", module="MP-MASIVO")], self.definitions, self.date)
        self.assertEqual(result["totals"]["all"], 1)
        self.assertEqual(result["quality"]["duplicateRowsRemoved"], 1)

    def test_missing_month_is_not_zero(self):
        result, _ = aggregate([self.record()], self.definitions, self.date)
        self.assertEqual(result["months"][0]["month"], "2025-11")
        self.assertIsNone(result["months"][0]["total"])
        self.assertIsNone(result["months"][0]["counts"])
        self.assertEqual(result["months"][-1]["total"], 1)

    def test_conflicting_month_does_not_silently_move_incident(self):
        with self.assertRaises(ValueError):
            aggregate([self.record(), self.record(period="202609")], self.definitions, self.date)

    def test_unknown_module_stays_unclassified(self):
        result, _ = aggregate([self.record(module="Nuevo")], self.definitions, self.date)
        self.assertEqual(result["quality"]["unclassifiedIncidents"], 1)
        self.assertEqual(result["totals"]["byCategory"]["sin-clasificar"], 1)

    def test_invalid_or_future_period_rejected(self):
        for value in ("202613", "202600", "2026-02", "", "20260212"):
            with self.assertRaises(ValueError):
                parse_period(value)
        with self.assertRaises(ValueError):
            aggregate([self.record(period="202611")], self.definitions, self.date)

    def test_output_has_no_ticket_identifiers(self):
        import json
        result, _ = aggregate([self.record("INC_PRIVATE")], self.definitions, self.date)
        self.assertNotIn("INC_PRIVATE", json.dumps(result))


if __name__ == "__main__":
    unittest.main()

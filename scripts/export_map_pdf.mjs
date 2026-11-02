// Generates the one-page sales map (16:9 PDF) from the portal data, using a local Chrome or Edge.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const args = process.argv.slice(2);
const option = name => {const i = args.indexOf(name);return i >= 0 ? args[i + 1] : undefined;};
const output = resolve(option('--output') || join(dist, 'assets', 'mapa-ecosistema-tuenti.pdf'));
const keepHtml = option('--html');

const context = {window: {}};
vm.runInNewContext(readFileSync(join(dist, 'content.js'), 'utf8'), context);
const catalog = context.window.TuentiCatalog;
const team = context.window.TuentiTeam;
const development = JSON.parse(readFileSync(join(dist, 'data', 'development.json'), 'utf8'));
const incidents = JSON.parse(readFileSync(join(dist, 'data', 'incidents.json'), 'utf8'));

// Sales copy per node: what it is, in plain words, and what the team delivered there.
const categories = {idp: 'Acceso', channel: 'Canal', oraculo: 'Experiencia', gaming: 'Servicios', gtm: 'Medición', panel: 'Operación', referidos: 'Procesos', dcp: 'Soporte', push: 'Soporte', backoffice: 'Soporte'};
// level: business criticality that colors the node; risk: what the business loses without the team there.
const levels = {critico: 'Crítico', alto: 'Alto', medio: 'Medio'};
const nodes = {
  idp: {level: 'critico', line: 'Ingreso del cliente con su número, código y sesión', proof: '+62 commits TSOFT · «Olvidé mi usuario» en producción', risk: 'Si el login falla, el cliente no puede entrar a la app ni hacer gestiones'},
  channel: {level: 'critico', line: 'La app principal, web y móvil: recargas, packs y gestiones', proof: '+2.191 commits TSOFT en web, app y UI · CI360 y eSIM', risk: 'Se frena la evolución de la app donde el cliente compra recargas, packs y eSIM'},
  oraculo: {level: 'alto', line: 'Ruleta de premios, trivia y canje', proof: 'Migración a React Native 0.78 · +10 correcciones de experiencia', risk: 'Si la ruleta falla, cae la participación y la promoción pierde clientes'},
  gaming: {level: 'alto', line: 'Tiros, premios y canjes detrás del Oráculo', proof: '+13 microservicios nuevos · prueba de estrés', risk: 'Premios y canjes con errores que el cliente ve y termina reclamando'},
  gtm: {level: 'critico', line: 'Medición de cada pantalla y acción del cliente', proof: '+192 tags · +87 pantallas · +10 módulos', risk: 'Sin métricas confiables, campañas y decisiones de negocio van a ciegas'},
  analytics: {line: 'Datos para decidir y evaluar campañas', risk: 'Sin etiquetado confiable, reportes y análisis de campañas pierden base'},
  panel: {level: 'medio', line: 'Configuración y seguimiento de promociones', proof: 'Pase a producción · login y roles', risk: 'Lanzar, configurar y controlar promociones lleva más tiempo y esfuerzo'},
  referidos: {level: 'alto', line: 'Premios automáticos por recomendar a otro cliente', proof: 'Fase 2 con premiación automática', risk: 'Si los premios no se acreditan, se frena la captación por recomendación'},
  dcp: {level: 'critico', line: 'Recarga que se cobra sola cada mes con tarjeta', proof: 'Segundo medio de pago · baja de tarjetas · +134 casos', risk: 'Si la recarga automática falla, el cliente queda sin saldo y Tuenti pierde ingresos'},
  push: {level: 'alto', line: 'Notifican recarga hecha, fallida o próxima y extras', proof: 'Aviso de próxima recarga corregido · mensaje de extras', risk: 'El cliente no sabe si su recarga se hizo o falló: menos recargas, más reclamos'},
  backoffice: {level: 'medio', line: 'El operador cambia el usuario desde backoffice', proof: 'Nuevo servicio ChangeUser · aviso de pasaporte', risk: 'Los cambios de usuario pasan a ser manuales: más demoras y costo de atención'}
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const quarterLabel = quarter => `${quarter.slice(6)}Q ${quarter.slice(0,4)}`;
const loaded = development.quarters.filter(q => q.hasData);
const activity = {};
for(const q of loaded) for(const h of q.highlights) if(h.service) activity[h.service] = (activity[h.service] || 0) + 1;
const reported = incidents.months.filter(m => m.hasData);
const maxMonth = Math.max(...reported.map(m => m.total));
// Sales wording: the portal says "registradas"; the sales sheet speaks of handled incidents.
const factLabels = {'Incidencias registradas': 'Incidencias gestionadas'};
const delivered = loaded.flatMap(q => q.highlights);
const kindLabels = {incidencia: 'Correcciones', mantenimiento: 'Mantenimiento'};
// Each quarterly Jira Feature is one work front, so a front that continues across quarters counts once per quarter.
const fronts = loaded.reduce((sum, q) => sum + q.workstreams.length, 0);
const frontLabels = {
  'Mantenimiento, performance y mejoras internas': 'Mantenimiento y performance',
  'Implementación de desarrollos': 'Desarrollos',
  'DCP · segundo medio de pago': 'DCP · 2.º medio de pago',
  'DCP · segundo medio de pago: implementación': 'DCP · 2.º medio de pago (impl.)',
  'Referidos · Fase 2: implementación': 'Referidos · Fase 2 (impl.)',
  'Mejoras de acceso y medición': 'Acceso y medición',
  'Integración CI360 en la app Tuenti': 'CI360 en la app',
  'Super APP Tuenti + Pegasus': 'Super APP + Pegasus'
};
const byKind = development.kinds.map(k => ({...k, label: kindLabels[k.id] || k.label, count: delivered.filter(h => h.kind === k.id).length})).filter(k => k.count).sort((a, b) => b.count - a.count);
// The peak month is explained by its dominant category, so a spike does not read as a general failure.
const peak = reported.find(m => m.total === maxMonth);
const peakCategory = incidents.categories.map(c => ({...c, count: peak.counts[c.id]})).sort((a, b) => b.count - a.count)[0];
const peakNote = peakCategory.count / peak.total > .5 ? `${months[Number(peak.month.slice(5)) - 1].replace(/^./, c => c.toUpperCase())}: ${peakCategory.count} de ${peak.total} por una afectación masiva de ${peakCategory.label}` : '';
const asOf = development.asOf.split('-').reverse().join('/');

const node = (id, x, y, cls = '') => {
  const item = catalog[id], copy = nodes[id], count = activity[id];
  return `<div class="node ${item.context ? 'is-context' : `lv-${copy.level}`} ${cls}" style="left:${x}px;top:${y}px">${count ? `<span class="badge">${count} entrega${count === 1 ? '' : 's'}</span>` : ''}<span class="category">${copy.level ? `<b class="level">${esc(levels[copy.level])}</b> · ` : ''}${esc(categories[id] || 'Contexto')}</span><strong>${esc(item.short)}</strong><span class="line">${esc(copy.line)}</span>${copy.proof ? `<span class="proof">${esc(copy.proof)}</span>` : ''}<span class="risk"><b>Riesgo:</b>${esc(copy.risk)}</span></div>`;
};

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ecosistema Tuenti · TSOFT</title><style>
@page{size:1280px 720px;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;width:1280px;height:720px;background:#f6f7f9;color:#222126;font-family:'Segoe UI',Arial,sans-serif;overflow:hidden}
.sheet{position:relative;width:1280px;height:720px;padding:30px 40px 0}
header{display:flex;align-items:center;gap:22px;padding-bottom:16px;border-bottom:1px solid #e3e1e8}
header img{width:112px;height:35px;object-fit:contain}
.divider{width:1px;height:38px;background:#dcdae1}
header h1{margin:0;font-size:27px;line-height:1.1;letter-spacing:-.8px;font-weight:700}
header p{margin:4px 0 0;font-size:12.5px;color:#d60027}
.meta{margin-left:auto;text-align:right;font-size:10px;color:#7d7886;line-height:1.5}.meta b{display:block;font-size:11.5px;color:#3a3540}
.body{display:grid;grid-template-columns:858px 1fr;gap:26px;margin-top:20px}
.map{position:relative;height:558px}
.map svg{position:absolute;inset:0;overflow:visible}
.map svg path{fill:none;stroke:#b3adbb;stroke-width:1.2}.map svg .dashed{stroke-dasharray:4 4}
.map svg text{font-size:9.5px;fill:#86808f;font-family:'Segoe UI',Arial,sans-serif}
.node{--c:#d60027;--bg:#fdf3f5;--bd:#f2d3db;--tx:#a01d3c;position:absolute;width:184px;height:184px;background:var(--bg);border:1px solid var(--bd);border-top:4px solid var(--c);border-radius:7px;padding:10px 12px 0;display:flex;flex-direction:column;overflow:hidden}
.lv-alto{--c:#ec7a08;--bg:#fff6ec;--bd:#f6dcbf;--tx:#9a4d00}
.lv-medio{--c:#e3b512;--bg:#fdf9e8;--bd:#efe2b0;--tx:#7a6100}
.node.is-context{--c:#b9bbc5;--bg:#f1f2f5;--bd:#e3e4e9;--tx:#6c6a74}
.node.support{width:276px;height:116px}
.category{font-size:7.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--tx);min-height:11px}
.category .level{display:inline-block;color:#fff;background:var(--c);border-radius:3px;padding:0 4px;letter-spacing:.5px}
.lv-medio .category .level{color:#3d3200}
.node strong{font-size:15.5px;line-height:1.15;letter-spacing:-.4px;margin:5px 0 3px}
.line{font-size:10px;line-height:1.35;color:#6c6474}
.proof{margin-top:auto;font-size:9.5px;line-height:1.35;font-weight:600;color:var(--tx);padding-left:9px;position:relative}
.proof:before{content:'';position:absolute;left:0;top:5px;width:5px;height:5px;border-radius:50%;background:var(--c)}
.support .proof{margin-top:4px}
.risk{margin:7px -12px 0;padding:5px 12px 6px 27px;background:#28242e;color:#fff;font-size:9px;line-height:1.3;font-weight:600;position:relative}
.risk:before{content:'!';position:absolute;left:10px;top:5px;width:11px;height:11px;border-radius:50%;background:var(--c);color:#fff;font-size:8px;font-weight:800;line-height:11px;text-align:center}
.lv-medio .risk:before{color:#3d3200}
.is-context .risk{margin-top:auto}
.support .risk{margin-top:auto}
.risk b{color:#fff;font-weight:800;margin-right:3px}
.badge{position:absolute;right:9px;top:9px;font-size:8.5px;font-weight:700;color:#fff;background:#4a4252;border-radius:9px;padding:1px 7px}
.support-label{position:absolute;left:0;top:425px;font-size:8.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a29ba9}
aside{background:#28242e;color:#fff;border-radius:12px;padding:20px 20px 16px;height:558px;display:flex;flex-direction:column;position:relative;overflow:hidden}
aside:after{content:'';position:absolute;right:-80px;top:-90px;width:230px;height:230px;border:1px solid #8fb3d926;border-radius:50%;box-shadow:0 0 0 40px #8fb3d90b,0 0 0 80px #8fb3d906}
aside>*{position:relative;z-index:1}
.kicker{font-size:8.5px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#9fbbdb}
aside h2{white-space:nowrap;margin:5px 0 10px;font-size:18px;letter-spacing:-.5px;line-height:1.15}
.facts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.facts div{background:#342e3b;border-top:2px solid #5b84b1;border-radius:6px;padding:7px 8px}
.facts strong{display:block;font-size:19px;line-height:1.05;letter-spacing:-.6px}
.facts span{display:block;font-size:8.5px;line-height:1.2;font-weight:600;color:#b9cfe8;margin-top:3px}
.facts small{display:none}
.card{background:#fff;color:#2b2430;border-radius:7px;padding:9px 12px;margin-top:8px}
.card b.title{display:block;font-size:10.5px}.card .note{display:block;font-size:8.5px;color:#75677c;margin-top:1px}
.card .big{font-size:20px;font-weight:700;color:#2d4b73;letter-spacing:-.6px;margin-right:4px}
.fronts{margin-top:5px;display:flex;flex-direction:column;gap:3px}
.fronts>div{display:grid;grid-template-columns:38px 1fr;gap:6px;align-items:start;padding-top:3px;border-top:1px solid #eef0f4}
.fronts .q{font-size:8.5px;font-weight:700;color:#2b2430;line-height:1.2}.fronts .q small{display:block;font-size:7.5px;font-weight:600;color:#75677c}
.fronts .chips{display:flex;flex-wrap:wrap;gap:3px}
.fronts .chips span{font-size:8px;line-height:1.3;padding:1px 5px;border-radius:3px;background:#edf2f8;color:#2d4b73;font-weight:600}
.stack{display:flex;gap:2px;height:6px;border-radius:3px;overflow:hidden;margin-top:7px}.stack i{display:block}
.kinds{display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:6px}
.kinds span{display:flex;align-items:center;gap:6px;font-size:9px;color:#5c5164}.kinds span i{width:7px;height:7px;border-radius:50%;flex:none}.kinds b{font-size:10px;color:#2b2430}
.peak{display:block;margin-top:7px;padding-top:6px;border-top:1px solid #efe9f2;font-size:8.5px;line-height:1.4;color:#5c5164}
.bars{display:flex;align-items:flex-end;gap:4px;height:46px;margin-top:4px}
.bars>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:2px}
.bars i{width:100%;max-width:16px;background:#d60027;border-radius:2px 2px 0 0}.bars em{font-style:normal;font-size:7.5px;color:#5c5164;font-weight:600}.bars small{font-size:7.5px;color:#75677c;text-transform:capitalize}
.kind-desarrollo{background:#2d4b73}.kind-evolucion{background:#5b84b1}.kind-medicion{background:#9fc1e3}.kind-incidencia{background:#6b6577}.kind-mantenimiento{background:#c9c5d1}
footer{position:absolute;left:40px;right:40px;bottom:14px;display:flex;gap:22px;align-items:center;font-size:8.5px;color:#8d8794}
footer i{display:inline-block;vertical-align:middle;margin-right:5px}
.k-red{width:16px;height:4px;background:#d60027}.k-orange{width:16px;height:4px;background:#ec7a08}.k-yellow{width:16px;height:4px;background:#e3b512}.k-grey{width:16px;height:4px;background:#b9bbc5}.k-dash{width:18px;border-top:1px dashed #a7a0ae}.k-badge{width:16px;height:8px;border-radius:4px;background:#4a4252}
.k-risk{width:12px;height:12px;border-radius:50%;background:#28242e;color:#fff;font-style:normal;font-size:8px;font-weight:800;line-height:12px;text-align:center}
footer{gap:14px}footer b{color:#3a3540}
footer .src{margin-left:auto}
</style></head><body><div class="sheet">
<header><img src="${pathToFileURL(join(dist, 'assets', 'tsoft-logo.png')).href}" alt="TSOFT"><span class="divider"></span><div><h1>Ecosistema Tuenti</h1><p>Cómo se conectan sus servicios, qué sostenemos en cada uno y qué está en juego para el negocio</p></div><div class="meta"><b>Equipo de Innovación · TSOFT</b>Octubre 2026</div></header>
<div class="body"><div class="map">
<svg width="858" height="558" aria-hidden="true"><defs><marker id="a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#b3adbb" stroke="none"/></marker></defs>
<path d="M184,58 H222" marker-end="url(#a)"/><text x="187" y="52">Acceso</text>
<path d="M408,58 H446" marker-end="url(#a)"/><text x="408" y="52">Participa</text>
<path d="M632,58 H670" marker-end="url(#a)"/><text x="641" y="52">APIs</text>
<path d="M184,286 H222" marker-end="url(#a)"/><text x="190" y="280">Datos</text>
<path class="dashed" d="M92,184 V226" marker-end="url(#a)"/><path class="dashed" d="M316,184 V198 H92"/><path class="dashed" d="M540,184 V198 H316"/><text x="190" y="193">Pantallas y eventos</text>
<path class="dashed" d="M764,184 V208 H600 V226" marker-end="url(#a)"/><text x="650" y="203">Configura y consulta</text>
<path class="dashed" d="M672,286 H634" marker-end="url(#a)"/><text x="634" y="280">Estados</text>
</svg>
${node('idp',0,0)}${node('channel',224,0)}${node('oraculo',448,0)}${node('gaming',672,0)}
${node('gtm',0,228)}${node('analytics',224,228)}${node('panel',448,228)}${node('referidos',672,228)}
<span class="support-label">Recargas, avisos y backoffice · soporte que ya damos</span>
${node('dcp',0,442,'support')}${node('push',290,442,'support')}${node('backoffice',580,442,'support')}
</div>
<aside><span class="kicker">Lo que aportamos</span><h2>Lo que construimos y sostenemos</h2>
<div class="facts">${team.facts.filter(([, label]) => label !== 'Frentes de trabajo').map(([n, label, detail]) => `<div><strong>${esc(n)}</strong><span>${esc(factLabels[label] || label)}</span><small>${esc(detail)}</small></div>`).join('')}</div>
<div class="card"><b class="title"><span class="big">${fronts}</span>frentes de trabajo · <span class="big">${delivered.length}</span>hitos</b><span class="note">Features trimestrales en Jira · ${esc(quarterLabel(loaded[0].quarter))} — ${esc(quarterLabel(loaded.at(-1).quarter))}</span>
<div class="fronts">${loaded.map(q => `<div><span class="q">${esc(quarterLabel(q.quarter).replace(' 20', ' '))}<small>${q.highlights.length} hito${q.highlights.length === 1 ? '' : 's'}</small></span><span class="chips">${q.workstreams.map(w => `<span>${esc(frontLabels[w.title] || w.title)}</span>`).join('')}</span></div>`).join('')}</div>
<div class="stack">${byKind.map(k => `<i class="kind-${esc(k.id)}" style="flex:${k.count}"></i>`).join('')}</div><div class="kinds">${byKind.map(k => `<span><i class="kind-${esc(k.id)}"></i>${esc(k.label)}<b>${k.count}</b></span>`).join('')}</div></div>
<div class="card"><b class="title">Incidencias gestionadas por mes</b><span class="note">+${incidents.quality.uniqueIncidents} incidencias · ${months[Number(reported[0].month.slice(5)) - 1]} — ${months[Number(reported.at(-1).month.slice(5)) - 1]} ${reported.at(-1).month.slice(0,4)}</span><div class="bars">${reported.map(m => `<div><em>${m.total}</em><i style="height:${Math.max(2, Math.round(m.total / maxMonth * 30))}px"></i><small>${months[Number(m.month.slice(5)) - 1]}</small></div>`).join('')}</div>${peakNote ? `<span class="peak">${esc(peakNote)}</span>` : ''}</div>
</aside></div>
<footer><span><b>Criticidad para el negocio:</b></span><span><i class="k-red"></i>Crítico</span><span><i class="k-orange"></i>Alto</span><span><i class="k-yellow"></i>Medio</span><span><i class="k-grey"></i>Contexto</span><span><i class="k-risk">!</i>Riesgo si el equipo no está</span><span><i class="k-dash"></i>Relación operativa o medición</span><span><i class="k-badge"></i>Entregas del equipo</span><span class="src">Fuentes: Jira, registro Remedy e historial de repositorios · Datos al ${esc(asOf)}</span></footer>
</div></body></html>`;

function findBrowser() {
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.find(path => path && existsSync(path));
  if(!found) throw Error('No se encontró Chrome ni Edge. Definir CHROME_PATH con la ruta del navegador.');
  return found;
}

const work = mkdtempSync(join(tmpdir(), 'tuenti-mapa-'));
try {
  const page = join(work, 'mapa.html');
  writeFileSync(page, html, 'utf8');
  if(keepHtml) writeFileSync(resolve(keepHtml), html, 'utf8');
  execFileSync(findBrowser(), ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${join(work, 'profile')}`, `--print-to-pdf=${output}`, pathToFileURL(page).href], {stdio: 'ignore'});
  if(!existsSync(output)) throw Error('El navegador no generó el PDF.');
  console.log(`PDF generado: ${output}`);
} finally {
  rmSync(work, {recursive: true, force: true});
}

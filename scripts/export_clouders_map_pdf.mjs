// Generates the one-page Clouders ecosystem map (16:9 PDF) with the same layout as the Tuenti sales map.
// Copy and figures come from dist/clouders-content.js; Jira stories from dist/data/clouders-development.json.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = name => {const i = args.indexOf(name);return i >= 0 ? args[i + 1] : undefined;};
const output = resolve(option('--output') || join(root, 'dist', 'assets', 'mapa-ecosistema-clouders.pdf'));
const keepHtml = option('--html');
const context = {window: {}};
vm.runInNewContext(readFileSync(join(root, 'dist', 'clouders-content.js'), 'utf8'), context);
const nodes = context.window.CloudersCatalog;
const team = context.window.CloudersTeam;
const development = JSON.parse(readFileSync(join(root, 'dist', 'data', 'clouders-development.json'), 'utf8'));
const metrics = context.window.CloudersMetrics(development);

const levels = {critico: 'Crítico', alto: 'Alto', medio: 'Medio'};
const number = n => n.toLocaleString('es-AR');
const repoTotal = parts => parts.reduce((sum, [, n]) => sum + n, 0);
const repos = team.repos;
const totalCommits = repos.reduce((sum, [, parts]) => sum + (parts ? repoTotal(parts) : 0), 0);
const maxRepo = Math.max(...repos.filter(([, parts]) => parts).map(([, parts]) => repoTotal(parts)));
const asOf = development.asOf.split('-').reverse().join('/');
// Each closed Jira story counts as one delivery on its node; the quarter in progress shows only closed stories.
const activity = metrics.byService;
const heatMax = Math.max(...team.rows.flatMap(([id]) => metrics.quarters.map(q => metrics.count(id, q))));
const heatCell = n => n ? `<td style="--a:${(.12 + .88 * n / heatMax).toFixed(2)}" class="${n / heatMax > .45 ? 'dark' : ''}">${n}</td>` : '<td class="zero">·</td>';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const node = (id, x, y, cls = '') => {
  const copy = nodes[id], count = activity[id];
  return `<div class="node ${copy.level ? `lv-${copy.level}` : 'is-context'} ${cls}" style="left:${x}px;top:${y}px">${count ? `<span class="badge">${count} entrega${count === 1 ? '' : 's'}</span>` : ''}<span class="category">${copy.level ? `<b class="level">${esc(levels[copy.level])}</b> · ` : ''}${esc(copy.category)}</span><strong>${esc(copy.title)}</strong><span class="line">${esc(copy.line)}</span>${copy.proof ? `<span class="proof">${esc(copy.proof)}</span>` : ''}<span class="risk"><b>Riesgo:</b>${esc(copy.risk)}</span></div>`;
};

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ecosistema Clouders · TSOFT</title><style>
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
.draft{display:inline-block;margin-top:3px;font-size:8.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#7a6100;background:#fdf1d0;border:1px solid #efd98f;border-radius:3px;padding:0 6px}
.body{display:grid;grid-template-columns:858px 1fr;gap:26px;margin-top:20px}
.map{position:relative;height:558px}
.map svg{position:absolute;inset:0;overflow:visible}
.map svg path{fill:none;stroke:#b3adbb;stroke-width:1.2}.map svg .dashed{stroke-dasharray:4 4}
.map svg text{font-size:9.5px;fill:#86808f;font-family:'Segoe UI',Arial,sans-serif}
.node{--c:#d60027;--bg:#fdf3f5;--bd:#f2d3db;--tx:#a01d3c;position:absolute;width:184px;height:184px;background:var(--bg);border:1px solid var(--bd);border-top:4px solid var(--c);border-radius:7px;padding:10px 12px 0;display:flex;flex-direction:column;overflow:hidden}
.lv-alto{--c:#ec7a08;--bg:#fff6ec;--bd:#f6dcbf;--tx:#9a4d00}
.lv-medio{--c:#e3b512;--bg:#fdf9e8;--bd:#efe2b0;--tx:#7a6100}
.node.is-context{--c:#b9bbc5;--bg:#f1f2f5;--bd:#e3e4e9;--tx:#6c6a74}
.node.support{width:276px;height:120px}
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
.risk b{color:#fff;font-weight:800;margin-right:3px}
.lv-medio .risk:before{color:#3d3200}
.node:not(:has(.proof)) .risk{margin-top:auto}
.badge{position:absolute;right:9px;top:9px;font-size:8.5px;font-weight:700;color:#fff;background:#4a4252;border-radius:9px;padding:1px 7px}
.heat{width:100%;border-collapse:separate;border-spacing:2px;margin:5px 0 2px -2px;font-size:8.5px}
.heat th{font-size:7.5px;font-weight:700;color:#75677c;text-align:center;padding:0}
.heat td{height:15px;text-align:center;border-radius:2px;background:rgba(45,75,115,var(--a));color:#2d4b73;font-weight:700}
.heat td.dark{color:#fff}.heat td.zero{background:#f4f5f8;color:#b9b4c0;font-weight:400}
.heat td.name{background:none;text-align:left;font-weight:600;color:#3a3540;white-space:nowrap;padding-right:3px}
.heat td.sum{background:none;color:#2b2430}
.heat tfoot td{background:none;border-top:1px solid #e3e6ec;color:#2b2430;padding-top:1px}
.card .big{font-size:20px;font-weight:700;color:#2d4b73;letter-spacing:-.6px;margin-right:4px}
.stack{display:flex;gap:2px;height:6px;border-radius:3px;overflow:hidden;margin-top:6px}.stack i{display:block}
.kinds{display:flex;flex-wrap:wrap;gap:2px 7px;margin-top:5px}.kinds span{display:flex;align-items:center;gap:4px;font-size:8px;color:#5c5164}.kinds span i{width:7px;height:7px;border-radius:50%;flex:none}.kinds b{font-size:8.5px;color:#2b2430}
.kind-desarrollo{background:#2d4b73}.kind-evolucion{background:#5b84b1}.kind-diseno{background:#9fc1e3}.kind-calidad{background:#8f88a0}.kind-incidencia{background:#6b6577}.kind-mantenimiento{background:#c9c5d1}
.k-badge{width:16px;height:8px;border-radius:4px;background:#4a4252}
.support-label{position:absolute;left:0;top:421px;font-size:8.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a29ba9}
aside{background:#28242e;color:#fff;border-radius:12px;padding:16px 20px 14px;height:558px;display:flex;flex-direction:column;position:relative;overflow:hidden}
aside:after{content:'';position:absolute;right:-80px;top:-90px;width:230px;height:230px;border:1px solid #8fb3d926;border-radius:50%;box-shadow:0 0 0 40px #8fb3d90b,0 0 0 80px #8fb3d906}
aside>*{position:relative;z-index:1}
.kicker{font-size:8.5px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#9fbbdb}
aside h2{white-space:nowrap;margin:4px 0 7px;font-size:18px;letter-spacing:-.5px;line-height:1.15}
.facts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.facts div{background:#342e3b;border-top:2px solid #5b84b1;border-radius:6px;padding:5px 8px}
.facts strong{display:block;font-size:19px;line-height:1.05;letter-spacing:-.6px}
.facts span{display:block;font-size:8.5px;line-height:1.2;font-weight:600;color:#b9cfe8;margin-top:3px}
.card{background:#fff;color:#2b2430;border-radius:7px;padding:7px 12px;margin-top:6px}
.card b.title{display:block;font-size:10.5px}.card .note{display:block;font-size:8.5px;color:#75677c;margin-top:1px}
.repos{margin-top:4px;display:grid;grid-template-columns:1fr 1fr;column-gap:14px}
.repos div{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;padding:3px 0 2px;border-top:1px solid #eef0f4;font-size:9px;line-height:1.2}
.repos div>b{font-size:10px;color:#2d4b73}.repos div>i{display:block;flex-basis:100%;height:3px;margin-top:2px;border-radius:2px;background:linear-gradient(90deg,#5b84b1 var(--w),#e7ecf3 var(--w))}
.repos small{display:block;font-size:7.5px;color:#75677c;line-height:1.2}.repos em{font-style:normal;font-size:9px;font-weight:700;color:#a49cad}
footer{position:absolute;left:40px;right:40px;bottom:14px;display:flex;gap:14px;align-items:center;font-size:8.5px;color:#8d8794}
footer i{display:inline-block;vertical-align:middle;margin-right:5px}footer b{color:#3a3540}
.k-red{width:16px;height:4px;background:#d60027}.k-orange{width:16px;height:4px;background:#ec7a08}.k-yellow{width:16px;height:4px;background:#e3b512}.k-grey{width:16px;height:4px;background:#b9bbc5}.k-dash{width:18px;border-top:1px dashed #a7a0ae}
.k-risk{width:12px;height:12px;border-radius:50%;background:#28242e;color:#fff;font-style:normal;font-size:8px;font-weight:800;line-height:12px;text-align:center}
footer .src{margin-left:auto}
</style></head><body><div class="sheet">
<header><img src="${pathToFileURL(join(root, 'dist', 'assets', 'tsoft-logo.png')).href}" alt="TSOFT"><span class="divider"></span><div><h1>Ecosistema Clouders</h1><p>Las soluciones que usan los colaboradores de Telefónica, qué sostenemos en cada una y qué está en juego</p></div><div class="meta"><b>Equipo de Innovación · TSOFT</b>Noviembre 2026<br><span class="draft">Datos al ${esc(asOf)}</span></div></header>
<div class="body"><div class="map">
<svg width="858" height="558" aria-hidden="true"><defs><marker id="a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#b3adbb" stroke="none"/></marker></defs>
<path d="M184,58 H222" marker-end="url(#a)"/><text x="188" y="52">Incluye</text>
<path class="dashed" d="M92,184 V204 H764 V186" marker-end="url(#a)"/><path class="dashed" d="M540,204 V186" marker-end="url(#a)"/><text x="330" y="199">Incluye reconocimientos y venta de bienes</text>
<path d="M184,286 H222" marker-end="url(#a)"/><text x="190" y="280">Evalúa</text></svg>
${node('beneficios',0,0)}${node('eventos',224,0)}${node('reconocimientos',448,0)}${node('bienes',672,0)}
${node('compliance',0,228)}${node('analisis',224,228)}${node('redactor',448,228)}${node('pronos',672,228)}
<span class="support-label">Base compartida y próximos lanzamientos</span>
${node('ui',0,438,'support')}${node('asistente',290,438,'support')}${node('descuentos',580,438,'support')}
</div>
<aside><span class="kicker">Lo que aportamos</span><h2>Lo que construimos y sostenemos</h2>
<div class="facts"><div><strong>+${number(totalCommits)}</strong><span>Commits con autor TSOFT</span></div>${team.users.slice(0, 2).map(([n, label]) => `<div><strong>${esc(n)}</strong><span>${esc(label)}</span></div>`).join('')}</div>
<div class="card"><b class="title">Commits con autor TSOFT por solución</b><span class="note">Front y back · +${number(totalCommits)} en total${repos.filter(([, parts]) => !parts).map(([name]) => ` · ${esc(name.split(" ")[0])}: por confirmar`).join("")}</span><div class="repos">${repos.filter(([, parts]) => parts).map(([name, parts]) => parts ? `<div><span>${esc(name)}<small>${esc(parts.map(([part, n]) => `${part} ${number(n)}`).join(' · '))}</small></span><b>+${number(repoTotal(parts))}</b><i style="--w:${Math.max(2, Math.round(repoTotal(parts) / maxRepo * 100))}%"></i></div>` : "").join('')}</div></div>
<div class="card"><b class="title"><span class="big">+${metrics.done.length}</span>historias entregadas · <span class="big">${metrics.quarters.length}</span>trimestres</b><span class="note">Jira · ${esc(metrics.period)} · de punta a punta: UX, front, back y QA</span>
<table class="heat"><thead><tr><th></th>${metrics.quarters.map(q => `<th>${esc(metrics.label(q.quarter))}${q.inProgress ? '*' : ''}</th>`).join('')}<th>Total</th></tr></thead><tbody>${team.rows.map(([id, name]) => `<tr><td class="name">${esc(name)}</td>${metrics.quarters.map(q => heatCell(metrics.count(id, q))).join('')}<td class="sum">${activity[id] || 0}</td></tr>`).join('')}</tbody><tfoot><tr><td class="name">Historias</td>${metrics.quarters.map(q => `<td>${q.done.length}</td>`).join('')}<td class="sum">${metrics.done.length}</td></tr></tfoot></table>
${metrics.current ? `<span class="note">* ${esc(metrics.longLabel(metrics.current.quarter))} en curso: ${metrics.current.done.length} cerradas y +${metrics.current.open.length} en curso al ${esc(asOf)}</span>` : ''}<div class="stack">${metrics.byKind.map(k => `<i class="kind-${esc(k.id)}" style="flex:${k.count}"></i>`).join('')}</div><div class="kinds">${metrics.byKind.map(k => `<span><i class="kind-${esc(k.id)}"></i>${esc(k.label)}<b>${k.count}</b></span>`).join('')}</div></div>
</aside></div>
<footer><span><b>Criticidad para el negocio:</b></span><span><i class="k-red"></i>Crítico</span><span><i class="k-orange"></i>Alto</span><span><i class="k-yellow"></i>Medio</span><span><i class="k-grey"></i>En desarrollo</span><span><i class="k-risk">!</i>Riesgo si el equipo no está</span><span><i class="k-dash"></i>Relación entre soluciones</span><span><i class="k-badge"></i>Entregas del equipo</span><span class="src">Fuentes: Jira, repositorios y propuesta de continuidad · Usuarios reportados por el equipo</span></footer>
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

const work = mkdtempSync(join(tmpdir(), 'clouders-mapa-'));
try {
  const page = join(work, 'mapa.html');
  writeFileSync(page, html, 'utf8');
  if(keepHtml) writeFileSync(resolve(keepHtml), html, 'utf8');
  mkdirSync(dirname(output), {recursive: true});
  execFileSync(findBrowser(), ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${join(work, 'profile')}`, `--print-to-pdf=${output}`, pathToFileURL(page).href], {stdio: 'ignore'});
  if(!existsSync(output)) throw Error('El navegador no generó el PDF.');
  console.log(`PDF generado: ${output}`);
} finally {
  rmSync(work, {recursive: true, force: true});
}

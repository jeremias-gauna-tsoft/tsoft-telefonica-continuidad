// Generates the extended Clouders continuity proposal (16:9 PDF, 10 pages), using a local Chrome or Edge.
// It extends the approved 8-page proposal with the team's evidence; page 2 embeds the map from export_clouders_map_pdf.mjs.
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
const output = resolve(option('--output') || join(dist, 'assets', 'propuesta-continuidad-clouders.pdf'));
const keepHtml = option('--html');

const context = {window: {}};
vm.runInNewContext(readFileSync(join(dist, 'clouders-content.js'), 'utf8'), context);
const catalog = context.window.CloudersCatalog;
const team = context.window.CloudersTeam;
const development = JSON.parse(readFileSync(join(dist, 'data', 'clouders-development.json'), 'utf8'));
const metrics = context.window.CloudersMetrics(development);

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset = name => pathToFileURL(join(dist, 'assets', name)).href;
const number = n => n.toLocaleString('es-AR');
const asOf = development.asOf.split('-').reverse().join('/');
const repo = name => team.repos.find(([n]) => n === name)[1];
const repoTotal = parts => parts.reduce((sum, [, n]) => sum + n, 0);
const totalCommits = team.repos.reduce((sum, [, parts]) => sum + (parts ? repoTotal(parts) : 0), 0);
const stories = services => metrics.done.filter(i => services.includes(i.service)).length;

// Jira stories for the given services; pick keeps the first title matching each pattern, in that order.
const picks = (services, patterns) => patterns.map(p => metrics.done.find(i => services.includes(i.service) && p.test(i.title))).filter(Boolean);
const shortTitle = title => title.replace(/ \((FE|BE|FS)(, [^)]*)?\)$/, '');
const proofs = items => `<ul class="proofs">${items.map(i => `<li><span>${esc(shortTitle(i.title))}</span><small>${esc(metrics.longLabel(i.quarter))}</small></li>`).join('')}</ul>`;
const kpis = list => `<div class="kpis">${list.map(([n, label]) => `<div><strong>${esc(n)}</strong><span>${esc(label)}</span></div>`).join('')}</div>`;

const TOTAL = 10;
let pageNumber = 0;
const page = (label, body, {plain = false} = {}) => {
  pageNumber += 1;
  if(plain) return `<section class="page plain">${body}</section>`;
  return `<section class="page"><header><img src="${asset('tsoft-logo.png')}" alt="TSOFT"><span>${esc(label)}</span></header>${body}<footer><span>TSOFT | Clouders | Propuesta de continuidad | Noviembre 2026</span><b>${String(pageNumber).padStart(2,'0')} / ${String(TOTAL).padStart(2,'0')}</b></footer></section>`;
};
// Scenario texts come from the solution in clouders-content.js unless the page overrides them.
const service = ({label, title, subtitle, left, id, texts = {}}) => {
  const item = {...catalog[id], ...texts};
  return page(label, `<h1>${esc(title)}</h1><p class="sub">${esc(subtitle)}</p><div class="cols"><div class="left">${left}</div><div class="right"><span class="kicker">Escenario sin capacidad de respuesta</span><p class="scenario">${esc(item.scenario)}</p><span class="kicker">Impacto operativo</span><p class="effect">${esc(item.impact)}</p><span class="kicker">Respuesta del equipo propuesta</span><p class="response">${esc(item.response)}</p></div></div>`);
};

function mapHtml(work) {
  const file = join(work, 'mapa.html');
  execFileSync(process.execPath, [join(root, 'scripts', 'export_clouders_map_pdf.mjs'), '--output', join(work, 'mapa.pdf'), '--html', file], {stdio: 'ignore'});
  return readFileSync(file, 'utf8');
}

function build(map) {
  const pages = [];
  const facts = [[`+${number(totalCommits)}`, 'Commits con autor TSOFT', 'Front y back de 4 soluciones'], [`+${metrics.done.length}`, 'Historias entregadas', `Jira · ${metrics.quarters.length} trimestres`], ...team.users.slice(0, 2).map(([n, label]) => [n, label, 'Reportado por el equipo'])];
  pages.push(page('Propuesta ejecutiva', `<div class="cover"><h1>Clouders: qué queda expuesto<br>sin continuidad</h1><p class="sub">Riesgos operativos y respuesta propuesta para la nueva organización</p><p class="lead">Nuestro equipo construyó y sostiene las soluciones de gestión interna que usan los colaboradores de Telefónica. Ante una incidencia o un cambio de negocio, perder esa capacidad de respuesta puede demorar gestiones, exigir trabajo manual y prolongar la recuperación.</p>
<div class="facts">${facts.map(([n, label, detail]) => `<div><strong>${esc(n)}</strong><span>${esc(label)}</span><small>${esc(detail)}</small></div>`).join('')}</div>
<div class="axes"><b>Beneficios / Compliance / Redactor de Ofertas / PronosClouders / Clouders UI</b><small>Base: historial de repositorios con autor TSOFT y Jira (${esc(development.source.label)}), datos al ${esc(asOf)}. Usuarios reportados por el equipo. Escenarios a validar con las áreas responsables.</small></div></div>`));

  pages.push(page('', `<iframe title="Mapa del ecosistema" srcdoc="${esc(map)}"></iframe>`, {plain: true}));

  // Overview between quarters: one heatmap row per solution; the quarter in progress counts closed stories only.
  const max = Math.max(...team.rows.flatMap(([id]) => metrics.quarters.map(q => metrics.count(id, q))));
  const cell = n => n ? `<td style="--a:${(.12 + .88 * n / max).toFixed(2)}" class="${n / max > .45 ? 'dark' : ''}">${n}</td>` : '<td class="zero">·</td>';
  const active = id => metrics.quarters.filter(q => metrics.count(id, q)).length;
  const peak = id => metrics.quarters.reduce((best, q) => metrics.count(id, q) > metrics.count(id, best) ? q : best);
  const first = id => metrics.quarters.find(q => metrics.count(id, q) >= 5);
  const notes = [
    `El portal tuvo entregas en los ${active('beneficios')} trimestres: es la base que sostenemos todos los meses.`,
    `PronosClouders llegó a ${metrics.count('pronos', peak('pronos'))} historias en ${metrics.longLabel(peak('pronos').quarter)}, el trimestre del Mundial 2026.`,
    `Gestión de Bienes y la IA de Compliance despegan en ${metrics.longLabel(first('bienes').quarter)}, sin frenar lo existente.`,
    `${metrics.longLabel(peak('beneficios').quarter)} concentró la nueva arquitectura del portal: Supernova, refactor y búsquedas internas.`
  ];
  const topFronts = q => q.fronts.map(f => ({title: f.title, n: q.done.filter(i => f.id ? i.front === f.id : i.service === f.service && !i.front).length})).sort((a, b) => b.n - a.n).slice(0, 3);
  pages.push(page('Trayectoria del equipo', `<h1>Evolución entre trimestres</h1><p class="sub">Dónde puso el equipo su trabajo, trimestre a trimestre</p>
<div class="track"><div><div class="track-head"><strong>+${metrics.done.length}</strong><span>historias entregadas en Jira · ${esc(metrics.period)}</span></div>
<table class="qheat"><thead><tr><th></th>${metrics.quarters.map(q => `<th>${esc(metrics.longLabel(q.quarter))}${q.inProgress ? '<em>en curso</em>' : ''}</th>`).join('')}<th>Total</th></tr></thead><tbody>${team.rows.map(([id, name]) => `<tr><td class="name">${esc(name)}</td>${metrics.quarters.map(q => cell(metrics.count(id, q))).join('')}<td class="sum">${metrics.byService[id] || 0}</td></tr>`).join('')}</tbody><tfoot><tr><td class="name">Historias</td>${metrics.quarters.map(q => `<td>${q.done.length}${q.open.length ? `<small>+${q.open.length} en curso</small>` : ''}</td>`).join('')}<td class="sum">${metrics.done.length}</td></tr></tfoot></table>
<span class="kicker">Historias por tipo de trabajo</span><div class="stack">${metrics.byKind.map(k => `<i class="kind-${esc(k.id)}" style="flex:${k.count}"></i>`).join('')}</div><div class="kinds">${metrics.byKind.map(k => `<span><i class="kind-${esc(k.id)}"></i>${esc(k.label)} <b>${k.count}</b></span>`).join('')}</div></div>
<div class="reading"><span class="kicker">Cómo leerlo</span><ul>${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
<span class="kicker">Frentes principales por trimestre</span><div class="qfronts">${metrics.quarters.map(q => `<div><b>${esc(metrics.longLabel(q.quarter))}</b><span>${topFronts(q).map(f => esc(f.title)).join(' · ')}</span></div>`).join('')}</div></div></div>`));

  const portal = ['beneficios', 'eventos', 'reconocimientos', 'bienes', 'descuentos', 'asistente'];
  const beneficios = repo('Portal Beneficios');
  pages.push(service({id: 'beneficios', label: 'Escenario a validar', title: 'Beneficios', subtitle: 'Campañas y venta de activos necesitan respuesta oportuna',
    texts: {scenario: 'El portal deja de responder, o una falla impide participar en un sorteo o cerrar las ofertas de un bien, y no se resuelve a tiempo.', impact: 'Reclamos y revisión manual. Pueden quedar participaciones sin resolver o demorarse los resultados, los beneficios y la venta de activos.', response: 'Revisar reglas, registros y cierres automáticos. Recuperar y validar el circuito con el área responsable para dar continuidad a las gestiones.'},
    left: `<span class="kicker">Contexto de uso</span><h2>Supernova, el portal del empleado</h2><p class="note">Eventos y sorteos, reconocimientos, Gestión de Bienes y los próximos lanzamientos.</p>
${kpis([[`+${number(repoTotal(beneficios))}`, `commits con autor TSOFT · front ${number(beneficios[0][1])} · back ${number(beneficios[1][1])}`], ['+4.000', 'usuarios en el portal, según el equipo'], [String(stories(portal)), `historias entregadas · ${metrics.period}`]])}
<img class="shot" src="${asset('clouders/beneficios.png')}" alt="">
<span class="kicker">Lo que ya entregamos</span>${proofs(picks(portal, [/^Nueva interfaz del portal$/, /^Módulo de reconocimientos masivos$/, /^Módulo de referidos$/, /^Gestión de rodados y obras de arte \(FE\)$/, /^Búsquedas internas \(FE\)$/, /^Sección Tiempo para Vos \(FE\)$/]))}`}));

  const compliance = repo('Compliance');
  pages.push(service({id: 'compliance', label: 'Escenario a validar', title: 'Compliance', subtitle: 'Una interrupción puede acumular declaraciones y revisiones pendientes',
    left: `<span class="kicker">Contexto de uso</span><h2>+4.000 usuarios de Telefónica</h2><p class="note">Panel administrativo de declaraciones. RAG con puntaje de riesgo de 0 a 100; la decisión permanece en el administrador.</p>
${kpis([[`+${number(repoTotal(compliance))}`, `commits con autor TSOFT · front ${compliance[0][1]} · back ${compliance[1][1]}`], [String(stories(['compliance'])), 'historias de Compliance'], [String(stories(['analisis'])), 'historias de IA y agentes']])}
<img class="shot" src="${asset('clouders/compliance.png')}" alt="">
<span class="kicker">Lo que ya entregamos</span>${proofs(picks(['compliance', 'analisis'], [/^Nueva herramienta de Compliance$/, /^Formulario de declaración jurada: primera parte \(FE\)$/, /^Módulo de feedback de administradores \(BE\)$/, /^Agente de consulta de Compliance \(FE\)$/, /^Formulario 2026/, /^Reportería con IA/]))}`}));

  pages.push(service({id: 'redactor', label: 'Escenario a validar', title: 'Redactor de Ofertas', subtitle: 'Reglas desactualizadas pueden trasladar inconsistencias a las ofertas',
    left: `<span class="kicker">Contexto de uso</span><h2>Generación de ofertas</h2><p class="note">Datos de productos, reglas y documentos. Ofertas listas para revisión, descarga y consulta.</p>
<div class="flow"><span>Productos</span><i>→</i><span>Reglas</span><i>→</i><span>Plantillas y anexos</span><i>→</i><span>Oferta</span></div>
<img class="shot tall" src="${asset('clouders/redactor.png')}" alt="">
<p class="caption">Gestión de recursos: plantillas, anexos y versiones, con auditoría de cambios.</p>`}));

  const pronos = repo('PronosClouders');
  pages.push(service({id: 'pronos', label: 'Escenario a validar', title: 'PronosClouders', subtitle: 'Una incidencia durante el torneo puede afectar resultados y confianza',
    left: `<span class="kicker">Contexto de uso</span><h2>+2.700 usuarios en el Mundial 2026</h2><p class="note">Pronósticos, grupos, puntos y ranking, integrado con el portal. Adaptarlo a otras competencias requiere evaluación.</p>
${kpis([[`+${number(repoTotal(pronos))}`, `commits con autor TSOFT · front ${pronos[0][1]} · back ${pronos[1][1]}`], [String(stories(['pronos'])), 'historias entregadas'], [String(metrics.count('pronos', metrics.quarters.find(q => q.quarter === '2026-Q2'))), 'en el trimestre del Mundial']])}
<img class="shot" src="${asset('clouders/pronos.png')}" alt="">
<span class="kicker">Lo que ya entregamos</span>${proofs(picks(['pronos'], [/^Administración del Prode 2026$/, /^Carga automática de partidos \(BE\)$/, /^Integración de pronósticos con el portal \(FE\)$/, /^Grupos en el Prode \(FE\)$/, /^Simulación con cientos de usuarios$/, /^Pruebas de seguridad del Prode 2026$/]))}`}));

  const ui = repo('Clouders UI');
  pages.push(service({id: 'ui', label: 'Escenario a validar', title: 'Clouders UI', subtitle: 'Una regresión compartida puede afectar más de una aplicación',
    left: `<span class="kicker">Contexto de uso</span><h2>Beneficios y Compliance</h2><p class="note">Consumidores de una base compartida de componentes, con su catálogo en Storybook.</p>
${kpis([[`+${number(repoTotal(ui))}`, 'commits con autor TSOFT en la librería'], ['2', 'aplicaciones que la consumen'], ['+4.000', 'usuarios en cada una de ellas']])}
<img class="shot tall" src="${asset('clouders/ui.png')}" alt="">
<p class="caption">Storybook: plantilla administrativa de Compliance. Un cambio compartido requiere validar a sus consumidores.</p>`}));

  pages.push(page('Curva de aprendizaje y costos', `<h1>El costo de perder capacidad de respuesta</h1><p class="sub">La recuperación exige reconstruir conocimiento técnico y funcional</p>
<div class="costs"><div><span class="kicker">Curva de aprendizaje</span>${[['Reglas y excepciones', 'Entender criterios, validaciones y casos especiales del negocio.'], ['Integraciones y accesos', 'Contar con permisos, entornos y conocimiento de las dependencias.'], ['Validación y liberación', 'Comprobar la corrección, su impacto y la forma de ponerla en servicio.']].map(([t, d], i) => `<div class="cost"><em>${i + 1}</em><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div>
<div><span class="kicker">Costo operativo a dimensionar</span>${[['Trabajo manual y atención', 'Horas para responder reclamos y reconstruir gestiones.'], ['Demoras y correcciones', 'Campañas, declaraciones u ofertas pendientes de resolución.'], ['Diagnóstico y aprendizaje', 'Tiempo del equipo entrante para entender el proceso y recuperar capacidad.']].map(([t, d], i) => `<div class="cost"><em>${i + 1}</em><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div></div>
<p class="record">Lo que habría que reconstruir: <b>+${number(totalCommits)} commits</b> de código propio y <b>+${metrics.done.length} historias</b> de contexto funcional en ${metrics.quarters.length} trimestres.</p>
<p class="legend">Costos y tiempos por estimar con el área responsable; dependen del incidente y del conocimiento transferido.</p>`));

  pages.push(page('Propuesta de continuidad', `<h1>Cómo controlar la exposición</h1><p class="sub">Propuesta de TSOFT: sostener la operación y preparar una transición ordenada</p>
<span class="kicker">Decisión propuesta</span><p class="decision">Acordar cobertura, responsables y prioridades; con preparación y soporte por evento para PronosClouders.</p>
<div class="pillars"><div><span class="kicker">Operación</span><h3>Soporte desde<br>el inicio acordado</h3><p>Definir canal de atención, cobertura y responsable. Priorizar por proceso y calendario de campañas.</p></div><div><span class="kicker">Conocimiento</span><h3>Conocimiento<br>disponible y validado</h3><p>Entregar un mapa de dependencias, accesos y reglas, con recorridos críticos y un registro de riesgos.</p></div><div><span class="kicker">Transición</span><h3>Transición<br>con seguimiento</h3><p>Mantener las evoluciones acordadas y preparar la transferencia si se decide integrar, reemplazar o retirar una solución.</p></div></div>
<p class="record"><b>+${metrics.done.length} historias</b> entregadas desde ${esc(metrics.longLabel(metrics.quarters[0].quarter))} · <b>+${number(totalCommits)} commits</b> con autor TSOFT · <b>+4.000 usuarios</b> en Beneficios y en Compliance</p>
<div class="closing"><span class="kicker">Somos parte del equipo de Innovación</span><p>Aportamos experiencia técnica y funcional, creatividad y compromiso para seguir trabajando con ustedes y acompañarlos en esta nueva etapa.</p></div>`));
  if(pageNumber !== TOTAL) throw Error(`La propuesta tiene ${pageNumber} páginas y el pie indica ${TOTAL}.`);

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Propuesta de continuidad Clouders · TSOFT</title><style>
@page{size:1280px 720px;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;background:#fff;color:#222126;font-family:'Segoe UI',Arial,sans-serif}
.page{position:relative;width:1280px;height:720px;padding:0 64px;overflow:hidden;break-after:page}
.page.plain{padding:0}.page iframe{display:block;width:1280px;height:720px;border:0}
.page>header{display:flex;align-items:center;justify-content:space-between;height:84px;border-bottom:1px solid #e4e2e8}
.page>header img{width:150px;height:44px;object-fit:contain;object-position:left}
.page>header span{font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:#6c6672;margin-right:200px}
.page>footer{position:absolute;left:64px;right:84px;bottom:18px;display:flex;justify-content:space-between;font-size:9.5px;color:#6c6672}.page>footer b{font-size:12px;color:#3a3540}
h1{margin:24px 0 0;font-size:38px;line-height:1.1;letter-spacing:-1px}
.sub{margin:6px 0 0;font-size:20px;color:#d60027;font-weight:400}
.kicker{display:block;font-size:10.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:#d60027;margin:14px 0 6px}
.cols{display:grid;grid-template-columns:560px 1fr;gap:56px;margin-top:2px}
.left h2{margin:0;font-size:21px;color:#d60027;letter-spacing:-.4px}.left .note{margin:2px 0 0;font-size:12px;line-height:1.4;color:#6c6672}
.right .scenario{margin:0;font-size:20px;line-height:1.3;font-weight:700}
.right .effect{margin:0;font-size:17px;line-height:1.4;color:#2b2830}
.right .response{margin:0;font-size:17px;line-height:1.4;color:#6c6672}
.right .kicker{margin-top:22px}
.kpis{display:flex;gap:10px;margin-top:10px}
.kpis div{flex:1;background:#f4f3f6;border-top:3px solid #d60027;border-radius:6px;padding:7px 12px}
.kpis strong{display:block;font-size:22px;line-height:1.1;letter-spacing:-.6px}.kpis span{display:block;font-size:10px;line-height:1.3;color:#5c5664;margin-top:2px}
.shot{display:block;width:100%;height:118px;object-fit:cover;object-position:top;margin-top:10px;border:1px solid #eceaf0;border-radius:6px}
.shot.tall{height:250px}
.caption{margin:6px 0 0;font-size:11px;color:#6c6672}
.proofs{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.proofs li{display:flex;justify-content:space-between;gap:14px;font-size:12px;line-height:1.3;padding-left:13px;position:relative}
.proofs li:before{content:'';position:absolute;left:0;top:6px;width:6px;height:6px;border-radius:50%;background:#d60027}
.proofs small{flex:none;font-size:10.5px;font-weight:600;color:#8a8491;padding-top:1px}
.flow{display:flex;align-items:center;gap:6px;margin-top:12px}.flow span{flex:1;text-align:center;background:#f4f3f6;border-radius:6px;padding:9px 4px;font-size:13px;font-weight:700}.flow i{color:#d60027;font-style:normal}
.track{display:grid;grid-template-columns:640px 1fr;gap:44px;margin-top:14px}
.track-head{display:flex;align-items:baseline;gap:10px}.track-head strong{font-size:34px;letter-spacing:-1px;color:#d60027}.track-head span{font-size:13px;color:#5c5664}
.qheat{width:100%;border-collapse:separate;border-spacing:3px;margin:6px 0 0 -3px;font-size:13px}
.qheat th{font-size:11px;font-weight:700;color:#5c5664;text-align:center;line-height:1.15;padding-bottom:2px}.qheat th em{display:block;font-style:normal;font-weight:600;font-size:9.5px;color:#8a8491}
.qheat td{height:25px;text-align:center;border-radius:3px;background:rgba(45,75,115,var(--a));color:#2d4b73;font-weight:700}
.qheat td.dark{color:#fff}.qheat td.zero{background:#f4f5f8;color:#c3bfca;font-weight:400}
.qheat td.name{background:none;text-align:left;font-weight:600;color:#3a3540;width:150px;font-size:12.5px}
.qheat td.sum{background:none;color:#222126}
.qheat tfoot td{background:none;color:#222126;border-top:1px solid #e4e2e8;border-radius:0;vertical-align:top;padding-top:3px}.qheat tfoot small{display:block;font-size:9.5px;font-weight:600;color:#8a8491}
.stack{display:flex;gap:2px;height:10px;border-radius:4px;overflow:hidden}.stack i{display:block}
.kinds{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:7px}.kinds span{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#5c5664}.kinds span i{width:9px;height:9px;border-radius:50%}.kinds b{color:#222126}
.kind-desarrollo{background:#2d4b73}.kind-evolucion{background:#5b84b1}.kind-diseno{background:#9fc1e3}.kind-calidad{background:#8f88a0}.kind-incidencia{background:#6b6577}.kind-mantenimiento{background:#c9c5d1}
.reading ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.reading li{font-size:13.5px;line-height:1.4;padding-left:14px;position:relative;color:#2b2830}.reading li:before{content:'';position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:50%;background:#d60027}
.qfronts{display:flex;flex-direction:column;gap:6px}.qfronts div{display:grid;grid-template-columns:62px 1fr;gap:8px;font-size:11.5px;line-height:1.35;border-top:1px solid #f0eef3;padding-top:5px}.qfronts b{color:#2d4b73}.qfronts span{color:#5c5664}
.costs{display:grid;grid-template-columns:1fr 1fr;gap:56px;margin-top:6px}
.cost{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid #eceaf0}.cost em{font-style:normal;flex:none;width:30px;height:30px;border-radius:50%;background:#f4f3f6;color:#d60027;font-weight:700;display:flex;align-items:center;justify-content:center}
.cost b{font-size:18px}.cost p{margin:3px 0 0;font-size:14.5px;line-height:1.4;color:#6c6672}
.legend{margin:10px 0 0;font-size:10.5px;color:#6c6672}
.cover h1{margin-top:58px;font-size:46px}.cover .sub{margin-top:14px}
.cover .lead{margin:16px 0 0;font-size:18px;line-height:1.45;color:#3a3540;max-width:1080px}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:32px}
.facts div{background:#28242e;color:#fff;border-radius:8px;padding:12px 16px;border-top:3px solid #d60027}
.facts strong{display:block;font-size:32px;line-height:1.05;letter-spacing:-1px}.facts span{display:block;font-size:12.5px;font-weight:600;margin-top:3px}.facts small{display:block;font-size:10.5px;color:#c9c3d0;margin-top:2px}
.axes{margin-top:30px;padding-top:14px;border-top:1px solid #e4e2e8}.axes b{display:block;font-size:18px}.axes small{display:block;margin-top:6px;font-size:10.5px;color:#6c6672}
.decision{margin:0;font-size:18px;line-height:1.4}
.pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:8px}
.pillars h3{margin:0;font-size:21px;line-height:1.2}.pillars p{margin:8px 0 0;font-size:15px;line-height:1.4;color:#6c6672}
.record{margin:20px 0 0;padding:10px 16px;background:#f4f3f6;border-radius:6px;font-size:14px;color:#3a3540}.record b{color:#d60027}
.closing{margin-top:22px;padding-top:4px;border-top:1px solid #e4e2e8}.closing p{margin:0;font-size:21px;line-height:1.3;font-weight:700;color:#d60027}
</style></head><body>${pages.join('')}</body></html>`;
}

function findBrowser() {
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.find(path => path && existsSync(path));
  if(!found) throw Error('No se encontró Chrome ni Edge. Definir CHROME_PATH con la ruta del navegador.');
  return found;
}

const work = mkdtempSync(join(tmpdir(), 'clouders-propuesta-'));
try {
  const html = build(mapHtml(work));
  const file = join(work, 'propuesta.html');
  writeFileSync(file, html, 'utf8');
  if(keepHtml) writeFileSync(resolve(keepHtml), html, 'utf8');
  execFileSync(findBrowser(), ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files', `--user-data-dir=${join(work, 'profile')}`, `--print-to-pdf=${output}`, pathToFileURL(file).href], {stdio: 'ignore'});
  if(!existsSync(output)) throw Error('El navegador no generó el PDF.');
  console.log(`PDF generado: ${output}`);
} finally {
  rmSync(work, {recursive: true, force: true});
}

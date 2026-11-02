(() => {
  'use strict';
  const catalog = window.CloudersCatalog;
  const team = window.CloudersTeam;
  const main = document.querySelector('main');
  const sidebar = document.querySelector('.sidebar');
  const menu = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const mobileNavigation = window.matchMedia('(max-width:740px)');
  const levels = {critico: 'Crítico', alto: 'Alto', medio: 'Medio'};
  // Repository of each solution in CloudersTeam.repos.
  const repoOf = {beneficios: 'Portal Beneficios', compliance: 'Compliance', pronos: 'PronosClouders', ui: 'Clouders UI', redactor: 'Redactor de Ofertas'};
  let metrics = null;
  let pendingFocus;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = n => n.toLocaleString('es-AR');
  const routeFor = id => `#/servicios/${encodeURIComponent(id)}`;
  const pdf = page => `assets/propuesta-continuidad-clouders.pdf${page ? `#page=${page}` : ''}`;
  const repoTotal = parts => parts.reduce((sum, [, n]) => sum + n, 0);
  const totalCommits = team.repos.reduce((sum, [, parts]) => sum + (parts ? repoTotal(parts) : 0), 0);
  const footer = () => `<footer class="page-footer"><span>TSOFT · Equipo de Innovación · Noviembre 2026</span><a href="assets/mapa-ecosistema-clouders.pdf" target="_blank" rel="noopener">Abrir mapa en PDF ↗</a></footer>`;
  const noData = '<p class="data-note">Las entregas de Jira se leen desde un JSON local: iniciá el portal con <code>npm start</code> para verlas.</p>';

  document.querySelector('#service-nav').innerHTML = team.groups.map(([name, ids]) => `<section class="nav-group"><div class="nav-group-label">${esc(name)}</div>${ids.map(id => `<a href="${routeFor(id)}" class="service-link ${catalog[id].level ? '' : 'context-link'}" data-service="${id}"><span class="nav-dot" aria-hidden="true"></span>${esc(catalog[id].short)}</a>`).join('')}</section>`).join('');

  function toggleMenu(open) {
    const mobile = mobileNavigation.matches;
    sidebar.classList.toggle('is-open', open);
    sidebar.inert = mobile && !open;
    sidebar.setAttribute('aria-hidden', String(mobile && !open));
    document.body.classList.toggle('menu-open', mobile && open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar secciones' : 'Abrir secciones');
    backdrop.hidden = !open;
  }
  menu.addEventListener('click', () => toggleMenu(menu.getAttribute('aria-expanded') !== 'true'));
  mobileNavigation.addEventListener('change', () => toggleMenu(false));
  document.querySelector('.skip-link').addEventListener('click', e => {
    e.preventDefault();
    main.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  });
  backdrop.addEventListener('click', () => { toggleMenu(false); menu.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !backdrop.hidden) { toggleMenu(false); menu.focus(); } });

  const activity = id => metrics?.byService[id] ? `<span class="node-activity is-team">${metrics.byService[id]} entrega${metrics.byService[id] === 1 ? '' : 's'}</span>` : '';
  const category = item => `${item.level ? `<span class="node-level">${esc(levels[item.level])}</span>` : ''}${esc(item.category)}`;

  function mapNode(id) {
    const item = catalog[id];
    return `<a href="${routeFor(id)}" class="map-node ${item.level ? `lv-${item.level}` : 'context'}" data-map-node="${id}" aria-label="Explorar ${esc(item.short)}"><span class="node-arrow" aria-hidden="true">→</span><span class="node-category">${category(item)}</span><strong class="node-title">${esc(item.short)}</strong><span class="node-detail">${esc(item.line)}</span><span class="node-page">Propuesta · pág. ${item.page}</span>${activity(id)}</a>`;
  }

  // Heatmap of closed stories per solution and quarter; the quarter in progress shows how many remain open.
  function heatmap() {
    if (!metrics) return noData;
    const max = Math.max(...team.rows.flatMap(([id]) => metrics.quarters.map(q => metrics.count(id, q))));
    const cell = n => n ? `<td style="--a:${(.12 + .88 * n / max).toFixed(2)}" class="${n / max > .45 ? 'dark' : ''}">${n}</td>` : '<td class="zero">·</td>';
    return `<div class="table-scroll"><table class="qheat"><thead><tr><th scope="col"><span class="sr-only">Solución</span></th>${metrics.quarters.map(q => `<th scope="col">${esc(metrics.longLabel(q.quarter))}${q.inProgress ? '<em>en curso</em>' : ''}</th>`).join('')}<th scope="col">Total</th></tr></thead><tbody>${team.rows.map(([id, name]) => `<tr><td class="name"><a href="${routeFor(id)}">${esc(name)}</a></td>${metrics.quarters.map(q => cell(metrics.count(id, q))).join('')}<td class="sum">${metrics.byService[id] || 0}</td></tr>`).join('')}</tbody><tfoot><tr><td class="name">Historias</td>${metrics.quarters.map(q => `<td>${q.done.length}${q.open.length ? `<small>+${q.open.length} en curso</small>` : ''}</td>`).join('')}<td class="sum">${metrics.done.length}</td></tr></tfoot></table></div>`;
  }
  const kinds = () => metrics ? `<div class="kind-stack" aria-hidden="true">${metrics.byKind.map(k => `<i class="kind-${esc(k.id)}" style="flex:${k.count}"></i>`).join('')}</div><div class="kind-legend">${metrics.byKind.map(k => `<span><i class="kind-${esc(k.id)}"></i>${esc(k.label)} <b>${k.count}</b></span>`).join('')}</div>` : '';

  function renderMap() {
    const facts = [[`+${number(totalCommits)}`, 'Commits con autor TSOFT', 'Front y back de 4 soluciones'], ...(metrics ? [[`+${metrics.done.length}`, 'Historias entregadas', `Jira · ${metrics.period}`]] : []), ...team.users.map(([n, label]) => [n, label, 'Reportado por el equipo'])];
    const support = id => `<a class="support-node" href="${routeFor(id)}" data-map-node="${id}"><div><strong>${esc(catalog[id].short)}</strong><small>${esc(catalog[id].line)}</small></div>${activity(id)}<span aria-hidden="true">→</span></a>`;
    main.innerHTML = `<div class="page"><header class="page-heading"><div><div class="eyebrow">Clouders <span class="accent">/</span> Gestión interna</div><h1>Mapa del ecosistema</h1><p>Las soluciones que usan los colaboradores de Telefónica, qué sostenemos en cada una y qué está en juego.</p></div><div class="heading-meta"><strong>Equipo de Innovación</strong>Beneficios · Compliance · Comercial</div></header>
      <section class="map-panel" aria-label="Mapa del ecosistema Clouders"><div class="panel-toolbar"><div><h2>Once soluciones, un mismo equipo.</h2><p>Elegí una solución para ver su alcance, lo entregado y el riesgo si el equipo no está.</p></div><span class="tiny-label"><span class="red-dot"></span>Mapa navegable</span></div>
      <div class="map-area"><div class="map-board clouders-board">${['beneficios', 'eventos', 'reconocimientos', 'bienes', 'compliance', 'analisis', 'redactor', 'pronos'].map(mapNode).join('')}</div>
      <div class="support-heading">Base compartida y próximos lanzamientos</div><div class="support-grid">${['ui', 'asistente', 'descuentos'].map(support).join('')}</div></div>
      <div class="map-legend criticality-legend"><span class="legend-item"><i class="k-red"></i>Crítico</span><span class="legend-item"><i class="k-orange"></i>Alto</span><span class="legend-item"><i class="k-yellow"></i>Medio</span><span class="legend-item"><i class="k-grey"></i>En desarrollo</span>${metrics ? '<span class="legend-item"><i class="legend-activity" style="background:#4a4252"></i>Historias entregadas en Jira</span>' : ''}</div></section>
      <section class="contribution" aria-labelledby="contribution-title"><header class="contribution-head"><div><div class="section-kicker">Equipo de Innovación · TSOFT</div><h2 id="contribution-title">Lo que construimos y sostenemos</h2><p>UX, front, back y QA · Portal del empleado · Normativa e IA · Prode del Mundial</p></div><a class="button" href="#/evolucion">Ver evolución completa →</a></header>
      <div class="contribution-facts five">${facts.map(([n, label, detail]) => `<div><strong>${esc(n)}</strong><span>${esc(label)}</span><small>${esc(detail)}</small></div>`).join('')}</div>
      <div class="heat-wrap"><h3>Evolución entre trimestres</h3><p>Historias cerradas en Jira por solución. Más oscuro, más trabajo en ese trimestre.</p>${heatmap()}</div><a class="contribution-continuity" href="#/continuidad">Ver propuesta de continuidad →</a></section>${footer()}</div>`;
    if (pendingFocus) {
      const target = main.querySelector(`[data-map-node="${pendingFocus}"]`);
      if (target) { target.classList.add('is-highlighted'); target.focus({preventScroll:true}); }
      pendingFocus = null;
    }
  }

  function deliveries(id) {
    if (!metrics) return noData;
    const quarters = metrics.quarters.map(q => ({q, done: q.done.filter(i => i.service === id), open: q.open.filter(i => i.service === id)})).filter(x => x.done.length || x.open.length).reverse();
    if (!quarters.length) return '<p class="data-note">Todavía no hay historias de Jira cargadas para esta solución.</p>';
    return `<div class="deliveries">${quarters.map(({q, done, open}) => `<section><h3>${esc(metrics.longLabel(q.quarter))}<small>${done.length} entregada${done.length === 1 ? '' : 's'}${open.length ? ` · ${open.length} en curso` : ''}</small></h3><ul>${done.map(i => `<li>${esc(i.title)}</li>`).join('')}${open.map(i => `<li class="open">${esc(i.title)} · en curso</li>`).join('')}</ul></section>`).join('')}</div>`;
  }

  function renderDetail(id) {
    const item = catalog[id];
    const parts = team.repos.find(([name]) => name === repoOf[id])?.[1];
    const users = {beneficios: team.users[0], compliance: team.users[1], pronos: team.users[2]}[id];
    const figures = [parts ? [`+${number(repoTotal(parts))}`, `commits con autor TSOFT · ${parts.map(([p, n]) => `${p} ${number(n)}`).join(' · ')}`] : null, metrics?.byService[id] ? [String(metrics.byService[id]), `historias entregadas en Jira · ${metrics.period}`] : null, users ? [users[0], users[1].replace(/^U/, 'u')] : null].filter(Boolean);
    const visual = item.image ? `<figure class="surface image-card" style="margin:0"><div class="image-window shot"><img src="assets/clouders/${esc(item.image)}" alt="Captura de ${esc(item.short)}"></div><figcaption class="image-caption">Referencia visual de la propuesta de continuidad.</figcaption></figure>` : `<div class="surface"><div class="section-kicker">Recorrido de soporte</div><h2>Atención con contexto</h2><p>La intervención considera el circuito afectado y sus dependencias, y se valida con los responsables de la solución.</p><div class="journey" style="padding:8px 0 0"><div class="journey-step"><span>1</span>Ubicar el caso</div><div class="journey-step"><span>2</span>Revisar sus dependencias</div><div class="journey-step"><span>3</span>Validar el resultado</div></div></div>`;
    main.innerHTML = `<article class="page"><nav class="breadcrumb" aria-label="Ubicación"><a href="#/">Ecosistema</a><span aria-hidden="true">/</span><span>${esc(item.short)}</span></nav><header class="detail-header"><span class="detail-tag ${item.level ? '' : 'is-context'}">${item.level ? `${esc(levels[item.level])} · ` : ''}${esc(item.category)}</span><h1>${esc(item.title)}</h1><p class="detail-lead">${esc(item.summary)}</p><div class="detail-actions"><a class="button button-outline" href="#/" data-focus="${id}">← Ver en el mapa</a><a class="button button-text" href="${pdf(item.page)}" target="_blank" rel="noopener">Ver página ${item.page} de la propuesta ↗</a></div></header>
      ${figures.length ? `<div class="metrics">${figures.map(([n, label]) => `<div class="metric"><strong>${esc(n)}</strong><span>${esc(label)}</span></div>`).join('')}</div><p class="metrics-note">Commits: historial de repositorios con autor TSOFT. Historias: Jira, cerradas. Usuarios: reportados por el equipo.</p>` : ''}
      <div class="detail-intro"><section class="surface"><div class="section-kicker">Alcance de la solución</div><h2>Qué construimos y sostenemos</h2><p>${esc(item.line)}.</p><ul class="scope-list">${item.scope.map(s => `<li>${esc(s)}</li>`).join('')}</ul></section>${visual}</div>
      <div class="risk-grid"><section class="risk-card"><span class="risk-index">01 / ESCENARIO</span><h2>Si ocurre una incidencia</h2><p>${esc(item.scenario)}</p></section><section class="risk-card impact"><span class="risk-index">02 / IMPACTO</span><h2>Qué puede quedar afectado</h2><p>${esc(item.impact)}</p></section><section class="risk-card"><span class="risk-index">03 / RESPUESTA</span><h2>Cómo acompaña el equipo</h2><p>${esc(item.response)}</p></section></div>
      <section class="surface" style="margin-top:22px" aria-labelledby="deliveries-title"><div class="section-kicker">Jira · ${esc(metrics?.period || '')}</div><h2 id="deliveries-title">Lo que ya entregamos</h2>${deliveries(id)}</section>
      ${item.relations.length ? `<section class="relations-section"><div class="relations-head"><h2>Se relaciona con</h2><a href="#/" data-focus="${id}">Volver al contexto →</a></div><div class="relation-list">${item.relations.map(([related, why]) => `<a class="relation-link" href="${routeFor(related)}"><div><strong>${esc(catalog[related].short)}</strong><small>${esc(why)}</small></div><span aria-hidden="true">→</span></a>`).join('')}</div></section>` : ''}${footer()}</article>`;
  }

  function renderEvolution() {
    const count = (q, f) => q.done.filter(i => f.id ? i.front === f.id : i.service === f.service && !i.front).length;
    const cards = metrics ? `<div class="quarter-grid">${metrics.quarters.map(q => `<section class="quarter-card ${q.inProgress ? 'open' : ''}"><h3>${esc(metrics.longLabel(q.quarter))}${q.inProgress ? '<em>en curso</em>' : ''}</h3><span>${q.done.length} historias${q.open.length ? ` · +${q.open.length} en curso` : ''} · ${q.fronts.length} frentes</span><ul>${q.fronts.map(f => ({f, n: count(q, f)})).sort((a, b) => b.n - a.n).map(({f, n}) => `<li><span>${esc(f.title)}</span><b>${n || 'en curso'}</b></li>`).join('')}</ul></section>`).join('')}</div>` : '';
    main.innerHTML = `<div class="page"><a class="back-map" href="#/">← Volver al ecosistema</a><header class="page-heading"><div><div class="eyebrow">Clouders <span class="accent">/</span> Trayectoria del equipo</div><h1>Evolución entre trimestres</h1><p>Dónde puso el equipo su trabajo, trimestre a trimestre. Historias cerradas en Jira, sin las de Tuenti.</p></div><a class="button button-outline" href="${pdf(3)}" target="_blank" rel="noopener">Ver en la propuesta ↗</a></header>
      <section class="surface"><div class="section-kicker">${metrics ? `+${metrics.done.length} historias · ${esc(metrics.period)}` : 'Historias por solución'}</div><h2>Historias por solución y trimestre</h2>${heatmap()}${kinds()}</section>
      ${metrics ? `<section style="margin-top:26px"><div class="section-kicker">Frentes de trabajo</div><h2 style="margin:0">Qué trabajamos cada trimestre</h2>${cards}</section>` : ''}
      <aside class="context-note"><span aria-hidden="true">i</span><div>Cada historia cerrada cuenta una vez, en la solución a la que pertenece. Del trimestre en curso se cuentan solo las cerradas; las abiertas se muestran aparte. Se excluyen las historias de Tuenti y las subtareas de ejemplo. Los frentes agrupan las historias por solución.</div></aside>${footer()}</div>`;
  }

  function renderContinuity() {
    const columns = [['01 / OPERACIÓN', 'Soporte desde el inicio acordado', 'Definir canal de atención, cobertura y responsable. Priorizar por proceso y calendario de campañas.'], ['02 / CONOCIMIENTO', 'Conocimiento disponible y validado', 'Entregar un mapa de dependencias, accesos y reglas, con recorridos críticos y un registro de riesgos.'], ['03 / TRANSICIÓN', 'Transición con seguimiento', 'Mantener las evoluciones acordadas y preparar la transferencia si se decide integrar, reemplazar o retirar una solución.']];
    main.innerHTML = `<div class="page"><a class="back-map" href="#/">← Volver al ecosistema</a><header class="page-heading"><div><div class="eyebrow">Clouders <span class="accent">/</span> Propuesta de TSOFT</div><h1>Cómo controlar<br>la exposición.</h1><p>Sostener la operación y preparar una transición ordenada.</p></div></header><section class="continuity-banner"><div class="section-kicker">Decisión propuesta</div><p>Acordar cobertura, responsables y prioridades, con preparación y soporte por evento para PronosClouders.</p></section><div class="continuity-grid">${columns.map(([n, title, text]) => `<section class="continuity-card"><span>${n}</span><h2>${title}</h2><p>${text}</p></section>`).join('')}</div><div class="detail-actions"><a class="button" href="${pdf(10)}" target="_blank" rel="noopener">Abrir propuesta completa ↗</a><a class="button button-outline" href="assets/propuesta-continuidad-clouders.pdf" download="TSOFT-Propuesta-Clouders.pdf">Descargar PDF ↓</a><a class="button button-text" href="assets/mapa-ecosistema-clouders.pdf" target="_blank" rel="noopener">Ver mapa del ecosistema ↗</a></div><section class="innovation-closing"><h2>Somos parte del equipo de Innovación</h2><p>Aportamos experiencia técnica y funcional, creatividad y compromiso para seguir trabajando con ustedes y acompañarlos en esta nueva etapa.</p></section>${footer()}</div>`;
  }

  function route(initial=false) {
    toggleMenu(false);
    let path;
    try { path = decodeURIComponent(location.hash.slice(1) || '/').replace(/\/$/, '') || '/'; } catch { path = '/no-encontrado'; }
    let active = 'map', id = null, title = 'Ecosistema Clouders';
    if (path === '/') renderMap();
    else if (path === '/evolucion') { active = 'evolution'; title = 'Evolución entre trimestres'; renderEvolution(); }
    else if (path === '/continuidad') { active = 'continuity'; title = 'Continuidad'; renderContinuity(); }
    else if (path.startsWith('/servicios/') && Object.hasOwn(catalog, path.slice(11))) { id = path.slice(11); title = catalog[id].title; renderDetail(id); }
    else { title = 'Sección no encontrada'; main.innerHTML = `<div class="page error-surface"><div class="eyebrow">Ecosistema Clouders</div><h1>Esta sección no está en el mapa.</h1><p>Volvé al ecosistema para encontrar la solución que buscás.</p><a class="button" href="#/">Volver al mapa →</a></div>`; }
    document.querySelectorAll('[data-top]').forEach(a => { const selected = a.dataset.top === active; a.classList.toggle('active', selected); if (selected) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.querySelectorAll('[data-service]').forEach(a => { const selected = a.dataset.service === id; a.classList.toggle('active', selected); if (selected) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = `${title} · Clouders | TSOFT`;
    document.querySelector('#route-status').textContent = title;
    if (!initial) { window.scrollTo({top:0,behavior:'instant'}); main.focus({preventScroll:true}); }
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-focus]');
    if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); pendingFocus = link.dataset.focus; if (location.hash === '#/' || !location.hash) route(); else location.hash = '#/'; }
  });
  window.addEventListener('hashchange', () => route());
  route(true);
  // Jira data needs the local server; without it the portal still shows the map, texts and commits.
  fetch('data/clouders-development.json', {cache: 'no-store'}).then(r => r.ok ? r.json() : Promise.reject()).then(data => { metrics = window.CloudersMetrics(data); route(true); }).catch(() => {});
})();

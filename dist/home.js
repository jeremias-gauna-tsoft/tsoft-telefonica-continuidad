// General view: an overview of both clients. Each client keeps its own units (Tuenti: hitos and Remedy incidents;
// Clouders: Jira stories), so only commits and mapped services are added up.
(() => {
  'use strict';
  const main = document.querySelector('main');
  const tuenti = {catalog: window.TuentiCatalog, team: window.TuentiTeam};
  const clouders = {catalog: window.CloudersCatalog, team: window.CloudersTeam};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = n => n.toLocaleString('es-AR');
  const parse = text => Number(String(text).replace(/[^\d]/g, ''));
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const fact = label => tuenti.team.facts.find(([, l]) => l === label) || ['', label, ''];

  const tuentiCommits = parse(fact('Commits con autor TSOFT')[0]);
  const cloudersCommits = clouders.team.repos.reduce((sum, [, parts]) => sum + (parts ? parts.reduce((s, [, n]) => s + n, 0) : 0), 0);
  const tuentiUsers = tuenti.catalog.analytics.metrics.find(([, label]) => /Usuarios/.test(label));
  const services = Object.keys(tuenti.catalog).length + Object.keys(clouders.catalog).length;

  function render({incidents = null, cloudersMetrics = null} = {}) {
    const incidentFact = fact('Incidencias registradas');
    const reported = incidents?.months.filter(m => m.hasData) || [];
    const maxMonth = Math.max(1, ...reported.map(m => m.total));
    const qMax = cloudersMetrics ? Math.max(...cloudersMetrics.quarters.map(q => q.done.length + q.open.length)) : 1;
    const tuentiBars = reported.length ? `<div class="client-chart"><h3>Incidencias gestionadas por mes</h3><p>Registro Remedy · ${esc(incidentFact[2].replace(/ · Remedy$/, ""))}</p><div class="bars">${reported.map(m => `<div><em>${m.total}</em><i style="height:${Math.max(3, Math.round(m.total / maxMonth * 80))}px"></i><small>${months[Number(m.month.slice(5)) - 1]}</small></div>`).join('')}</div></div>` : '';
    const cloudersBars = cloudersMetrics ? `<div class="client-chart"><h3>Historias entregadas por trimestre</h3><p>Jira · ${esc(cloudersMetrics.period)} · rayado: en curso</p><div class="bars">${cloudersMetrics.quarters.map(q => `<div><em>${q.done.length}${q.open.length ? `+${q.open.length}` : ''}</em>${q.open.length ? `<i class="open" style="height:${Math.round(q.open.length / qMax * 80)}px;border-radius:3px 3px 0 0"></i>` : ''}<i style="height:${Math.max(3, Math.round(q.done.length / qMax * 80))}px;${q.open.length ? 'border-radius:0' : ''}"></i><small>${esc(cloudersMetrics.label(q.quarter))}</small></div>`).join('')}</div></div>` : '';
    const stories = cloudersMetrics ? `+${cloudersMetrics.done.length}` : '';
    const kpi = (n, label, detail) => n ? `<div><strong>${esc(n)}</strong><span>${esc(label)}</span><small>${esc(detail)}</small></div>` : '';
    const rows = [
      ['Qué es', 'El canal digital de la marca para sus clientes: app, login, promociones y medición.', 'Las soluciones de gestión interna que usan los colaboradores de Telefónica.'],
      ['Servicios mapeados', `${Object.keys(tuenti.catalog).length} servicios<small>Acceso, promociones, medición y soporte</small>`, `${Object.keys(clouders.catalog).length} soluciones<small>Portal del empleado, normativa e IA, comercial y lanzamientos</small>`],
      ['Commits con autor TSOFT', `+${number(tuentiCommits)}<small>${esc(fact('Commits con autor TSOFT')[2])}</small>`, `+${number(cloudersCommits)}<small>Front y back de 4 soluciones · Redactor por confirmar</small>`],
      ['Entregas en Jira', `${esc(fact('Frentes de trabajo')[0])} frentes de trabajo<small>Hitos destacados por Feature · ${esc(fact('Frentes de trabajo')[2])}</small>`, cloudersMetrics ? `${stories} historias · ${cloudersMetrics.fronts} frentes<small>Cada historia cerrada · ${esc(cloudersMetrics.period)}</small>` : '<small>Disponible con el portal servido por HTTP</small>'],
      ['Soporte registrado', `${esc(incidentFact[0])} incidencias gestionadas<small>Remedy · ${esc(incidentFact[2].replace(/ · Remedy$/, ''))}</small>`, '<span class="none">Sin registro de incidencias</span><small>La evolución se mide por las historias de Jira</small>'],
      ['Usuarios', `${esc(tuentiUsers[0])} usuarios activos<small>Tuenti Web App · 25/09 al 22/10/2026</small>`, `${clouders.team.users.map(([n, label]) => `${esc(n)} ${esc(label.replace(/^Usuarios /, ''))}`).join(' · ')}<small>Reportado por el equipo</small>`],
      ['Qué queda expuesto', 'El acceso de los clientes, las promociones y la medición de la app.', 'El portal del empleado, las declaraciones juradas y las ofertas comerciales.'],
      ['Propuesta', '<a class="button-text" href="assets/propuesta-continuidad-tuenti.pdf" target="_blank" rel="noopener">Continuidad del acceso, las promociones y la medición ↗</a>', '<a class="button-text" href="assets/propuesta-continuidad-clouders.pdf" target="_blank" rel="noopener">Qué queda expuesto sin continuidad ↗</a>']
    ];
    main.innerHTML = `<div class="page"><header class="page-heading"><div><div class="eyebrow">TSOFT <span class="accent">/</span> Equipo de Innovación</div><h1>Lo que sostenemos en Telefónica</h1><p>Dos clientes, un mismo equipo. Cada portal tiene sus propias métricas, para decidir sobre cada uno por separado.</p></div><div class="heading-meta"><strong>Vista general</strong>Tuenti · Clouders</div></header>
      <section class="contribution" aria-labelledby="overview-title"><header class="contribution-head"><div><div class="section-kicker">Visión general</div><h2 id="overview-title">Un equipo, dos ecosistemas</h2><p>Solo se suman las cifras comparables: commits y servicios mapeados.</p></div></header>
      <div class="contribution-facts" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:0">${[[`+${number(tuentiCommits + cloudersCommits)}`, 'Commits con autor TSOFT', `Tuenti ${number(tuentiCommits)} · Clouders ${number(cloudersCommits)}`], [String(services), 'Servicios y soluciones mapeados', `${Object.keys(tuenti.catalog).length} en Tuenti · ${Object.keys(clouders.catalog).length} en Clouders`], ['2', 'Propuestas de continuidad', 'Una por cliente, con su mapa y sus métricas']].map(([n, label, detail]) => `<div><strong>${esc(n)}</strong><span>${esc(label)}</span><small>${esc(detail)}</small></div>`).join('')}</div></section>
      <div class="client-grid">
        <section class="client-card tuenti" aria-labelledby="tuenti-title"><header><div><h2 id="tuenti-title">Tuenti</h2><small>Canal del cliente</small></div><span class="client-tag">Clientes de la marca</span></header><p class="lead">Login, app, ruleta y referidos, medición GTM y el soporte de recargas, avisos y backoffice.</p>
          <div class="client-kpis">${kpi(`+${number(tuentiCommits)}`, 'Commits con autor TSOFT', fact('Commits con autor TSOFT')[2])}${kpi(fact('Tags GTM en la app')[0], 'Tags GTM en la app', fact('Tags GTM en la app')[2])}${kpi(incidentFact[0], 'Incidencias gestionadas', incidentFact[2])}${kpi(tuentiUsers[0], 'Usuarios activos', 'Tuenti Web App · 28 días')}</div>
          ${tuentiBars}<div class="client-actions"><a class="button" href="tuenti.html">Entrar a Tuenti →</a><a class="button button-outline" href="assets/mapa-ecosistema-tuenti.pdf" target="_blank" rel="noopener">Mapa PDF ↗</a></div></section>
        <section class="client-card clouders" aria-labelledby="clouders-title"><header><div><h2 id="clouders-title">Clouders</h2><small>Gestión interna</small></div><span class="client-tag">Colaboradores de Telefónica</span></header><p class="lead">Portal Beneficios (Supernova), Compliance con IA, Redactor de Ofertas, PronosClouders y Clouders UI.</p>
          <div class="client-kpis">${kpi(`+${number(cloudersCommits)}`, 'Commits con autor TSOFT', 'Front y back de 4 soluciones')}${kpi(stories, 'Historias entregadas', cloudersMetrics ? `Jira · ${cloudersMetrics.quarters.length} trimestres` : '')}${kpi(clouders.team.users[0][0], 'Usuarios en Beneficios', 'Reportado por el equipo')}${kpi(clouders.team.users[1][0], 'Usuarios en Compliance', 'Reportado por el equipo')}</div>
          ${cloudersBars}<div class="client-actions"><a class="button" href="clouders.html">Entrar a Clouders →</a><a class="button button-outline" href="assets/mapa-ecosistema-clouders.pdf" target="_blank" rel="noopener">Mapa PDF ↗</a></div></section>
      </div>
      <section class="compare" aria-labelledby="compare-title"><h2 id="compare-title">Cada cliente, por separado</h2><p>Las mismas preguntas para los dos. Cada uno se mide en su propia unidad: no se suman hitos, historias e incidencias.</p>
      <table><thead><tr><th scope="col"></th><th scope="col">Tuenti</th><th scope="col">Clouders</th></tr></thead><tbody>${rows.map(([label, a, b]) => `<tr><td>${esc(label)}</td><td data-label="Tuenti">${a}</td><td data-label="Clouders">${b}</td></tr>`).join('')}</tbody></table></section>
      <section id="documentos" class="docs" aria-label="Documentos">${[['tuenti', 'assets/propuesta-continuidad-tuenti.pdf', 'Propuesta de continuidad', '10 páginas · 16:9'], ['tuenti', 'assets/mapa-ecosistema-tuenti.pdf', 'Mapa del ecosistema', 'Hoja de ventas · 16:9'], ['clouders', 'assets/propuesta-continuidad-clouders.pdf', 'Propuesta de continuidad', '10 páginas · 16:9'], ['clouders', 'assets/mapa-ecosistema-clouders.pdf', 'Mapa del ecosistema', 'Hoja de ventas · 16:9']].map(([client, href, title, detail]) => `<a class="${client}" href="${href}" target="_blank" rel="noopener"><em>${client === 'tuenti' ? 'Tuenti' : 'Clouders'}</em><b>${title} ↗</b><span>${detail}</span></a>`).join('')}</section>
      <footer class="page-footer"><span>TSOFT · Equipo de Innovación · Noviembre 2026</span><span>Tuenti: datos al 26/10/2026 · Clouders: datos al 02/11/2026</span></footer></div>`;
  }

  render();
  // Monthly incidents and Jira stories come from local JSON files and need the portal served over HTTP.
  const json = url => fetch(url, {cache: 'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null);
  Promise.all([json('data/incidents.json'), json('data/clouders-development.json')]).then(([incidents, development]) => {
    render({incidents, cloudersMetrics: development ? window.CloudersMetrics(development) : null});
  });
})();

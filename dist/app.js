(() => {
  'use strict';
  const catalog = window.TuentiCatalog;
  const impact = window.TuentiImpact;
  const team = window.TuentiTeam;
  const main = document.querySelector('main');
  const sidebar = document.querySelector('.sidebar');
  const menu = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const mobileNavigation = window.matchMedia('(max-width:740px)');
  let mapObserver;
  let pendingFocus;
  let mapFrame;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const routeFor = id => `#/servicios/${encodeURIComponent(id)}`;
  const pdf = page => `assets/propuesta-continuidad-tuenti.pdf${page ? `#page=${page}` : ''}`;
  const footer = () => `<footer class="page-footer"><span>TSOFT · Equipo de Innovación · Octubre 2026</span><a href="assets/mapa-ecosistema-tuenti.pdf" target="_blank" rel="noopener">Abrir mapa en PDF ↗</a></footer>`;
  const groupList = [
    ['Recorrido del cliente', ['idp','channel','oraculo','gaming']],
    ['Operación promocional', ['panel','referidos']],
    ['Instrumentación y datos', ['gtm','analytics']],
    ['Soporte transversal', ['dcp','push','backoffice']]
  ];

  document.querySelector('#service-nav').innerHTML = groupList.map(([name, ids]) => `<section class="nav-group"><div class="nav-group-label">${esc(name)}</div>${ids.map(id => `<a href="${routeFor(id)}" class="service-link ${catalog[id].context ? 'context-link' : ''}" data-service="${id}"><span class="nav-dot" aria-hidden="true"></span>${esc(catalog[id].short)}</a>`).join('')}</section>`).join('');

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

  function mapNode(id, detail) {
    const item = catalog[id];
    return `<a href="${routeFor(id)}" class="map-node ${item.context ? 'context' : ''}" data-map-node="${id}" aria-label="Explorar ${esc(item.short)}"><span class="node-arrow" aria-hidden="true">→</span><span class="node-category">${esc(item.context ? 'Contexto del ecosistema' : item.category)}</span><strong class="node-title">${esc(item.short)}</strong><span class="node-detail">${esc(detail)}</span><span class="node-page">${item.page ? `Propuesta · pág. ${item.page}` : item.context ? 'Contexto del canal' : ''}</span></a>`;
  }

  function renderMap() {
    main.innerHTML = `<div class="page"><header class="page-heading"><div><div class="eyebrow">Tuenti <span class="accent">/</span> Vista general</div><h1>Mapa del ecosistema</h1><p>Explorá cómo se relacionan los servicios y dónde interviene el equipo.</p></div><div class="heading-meta"><strong>Una visión compartida</strong>Acceso · Promociones · Medición</div></header>
      <section class="map-panel" aria-label="Mapa interactivo del ecosistema Tuenti"><div class="panel-toolbar"><div><h2>Todo empieza por entender las conexiones.</h2><p>Elegí un bloque para ver su alcance, impacto y relaciones.</p></div><span class="tiny-label"><span class="red-dot"></span>Mapa navegable</span></div>
      <div class="map-area"><div class="map-board" id="map-board"><svg class="map-lines" aria-hidden="true"></svg>
      ${mapNode('idp','Login, código y sesión')}${mapNode('channel','Web y aplicación móvil')}${mapNode('oraculo','Participación y canje')}${mapNode('gaming','Participantes, tiros y premios')}
      ${mapNode('gtm','Pantallas y eventos')}${mapNode('analytics','Datos para decisiones')}${mapNode('panel','Configuración y seguimiento')}${mapNode('referidos','Archivos, reglas y estados')}
      </div><div class="support-heading">Recargas, avisos y backoffice · soporte que ya damos</div><div class="support-grid">${[['dcp','Se cobran solas cada mes con tarjeta'],['push','Recarga hecha, fallida o próxima'],['backoffice','Gestión del operador en backoffice']].map(([id, note]) => `<a class="support-node" href="${routeFor(id)}" data-map-node="${id}"><div><strong>${esc(catalog[id].short)}</strong><small>${esc(note)}</small></div><span aria-hidden="true">→</span></a>`).join('')}</div>
      </div>
      <div class="map-legend"><span class="legend-item"><i class="legend-swatch"></i>Alcance del equipo</span><span class="legend-item"><i class="legend-swatch context"></i>Contexto</span><span class="legend-item"><i class="legend-swatch dashed"></i>Operación y medición</span><span>Relaciones funcionales del ecosistema.</span></div></section>
      <section class="contribution" aria-labelledby="contribution-title"><header class="contribution-head"><div><div class="section-kicker">Equipo de Innovación · TSOFT</div><h2 id="contribution-title">Nuestra contribución al ecosistema</h2><p>Frontend y backend · Despliegues · Actualización de servicios y AppScan · Medición y evolución</p></div><a class="button" href="#/historico">Ver histórico completo →</a></header>
      <div class="contribution-facts">${team.facts.map(([n,label,detail])=>`<div><strong>${esc(n)}</strong><span>${esc(label)}</span><small>${esc(detail)}</small></div>`).join('')}</div>
      <div class="contribution-previews" id="contribution-previews" hidden></div><a class="contribution-continuity" href="#/continuidad">Ver propuesta de continuidad →</a></section>${footer()}</div>`;
    const board = document.querySelector('#map-board');
    mapObserver = new ResizeObserver(() => { cancelAnimationFrame(mapFrame); mapFrame = requestAnimationFrame(drawMap); });
    mapObserver.observe(board);
    requestAnimationFrame(drawMap);
    window.TuentiHistory?.mountMapPreview(main).catch(()=>{});
    if (pendingFocus) {
      const target = main.querySelector(`[data-map-node="${pendingFocus}"]`);
      if (target) { target.classList.add('is-highlighted'); target.focus({preventScroll:true}); }
      pendingFocus = null;
    }
  }

  function drawMap() {
    const board = document.querySelector('#map-board');
    if (!board) return;
    const svg = board.querySelector('svg');
    if (getComputedStyle(svg).display === 'none') return;
    const box = board.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = '<defs><marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill="#b6b2be"/></marker></defs>';
    const ns = 'http://www.w3.org/2000/svg';
    const pos = id => { const r=board.querySelector(`[data-map-node="${id}"]`).getBoundingClientRect(); return {x:r.left-box.left,y:r.top-box.top,w:r.width,h:r.height}; };
    const path = (points, dashed=false, end=true, start=false) => { const p=document.createElementNS(ns,'path'); p.setAttribute('d',points.map(([x,y],i)=>`${i?'L':'M'} ${x} ${y}`).join(' ')); if(dashed)p.classList.add('dashed'); if(end)p.setAttribute('marker-end','url(#map-arrow)'); if(start)p.setAttribute('marker-start','url(#map-arrow)'); svg.append(p); };
    const label = (text,x,y) => { const t=document.createElementNS(ns,'text'); t.textContent=text; t.setAttribute('x',x); t.setAttribute('y',y); t.setAttribute('text-anchor','middle'); svg.append(t); };
    const idp=pos('idp'), channel=pos('channel'), wheel=pos('oraculo'), gaming=pos('gaming'), gtm=pos('gtm'), analytics=pos('analytics'), panel=pos('panel'), referrals=pos('referidos');
    [[idp,channel,'Acceso'],[channel,wheel,'Participa'],[wheel,gaming,'APIs'],[gtm,analytics,'Datos']].forEach(([a,b,word]) => { path([[a.x+a.w,a.y+a.h/2],[b.x,b.y+b.h/2]]); label(word,(a.x+a.w+b.x)/2,a.y+a.h/2-11); });
    const bus=idp.y+idp.h+(gtm.y-idp.y-idp.h)*.48;
    [idp,channel,wheel].forEach(a=>path([[a.x+a.w/2,a.y+a.h],[a.x+a.w/2,bus]],true,false));
    path([[idp.x+idp.w/2,bus],[wheel.x+wheel.w/2,bus]],true,false);
    path([[idp.x+idp.w/2,bus],[gtm.x+gtm.w/2,gtm.y]],true);
    label('Pantallas y eventos',channel.x+channel.w/2,bus-9);
    const bend=(panel.x+panel.w+referrals.x)/2;
    path([[panel.x+panel.w,panel.y+panel.h*.28],[bend,panel.y+panel.h*.28],[bend,bus-9],[gaming.x+gaming.w/2,bus-9],[gaming.x+gaming.w/2,gaming.y+gaming.h]],true,true,true);
    label('Configura / consulta',(bend+gaming.x+gaming.w/2)/2,bus-19);
    path([[referrals.x,referrals.y+referrals.h*.72],[panel.x+panel.w,panel.y+panel.h*.72]],true);
  }

  function renderVisual(item) {
    if(item.image) return `<figure class="surface image-card" style="margin:0"><div class="image-window ${item.image==='idp-login.png'?'idp':''}"><img src="assets/${item.image}" alt="${esc(item.imageAlt)}"></div><figcaption class="image-caption">Referencia visual compartida por el equipo.</figcaption></figure>`;
    if(item.steps) return `<div class="surface journey"><div class="journey-title">Recorrido funcional</div>${item.steps.map((s,i)=>`<div class="journey-step"><span>${i+1}</span>${esc(s)}</div>`).join('')}</div>`;
    if(item.inventory) return `<div class="surface inventory"><div class="section-kicker">Inventario informado</div>${item.inventory.map(([n,label])=>`<div class="inventory-row"><strong>${n}</strong><span>${esc(label)}</span></div>`).join('')}</div>`;
    if(item.services) return `<div class="surface"><div class="section-kicker">Servicios informados</div><h2>Automatización de referidos</h2>${item.services.map(s=>`<div class="service-code">${esc(s)}</div>`).join('')}</div>`;
    return `<div class="surface"><div class="section-kicker">${item.context?'Relación en el ecosistema':'Recorrido de soporte'}</div><h2>${item.context?'Una capacidad conectada':'Atención con contexto'}</h2><p>${esc(item.context ? 'Este bloque ayuda a ubicar el alcance de la intervención y sus vínculos con otras partes del ecosistema.' : 'La intervención considera el circuito afectado y sus dependencias, y se valida con los responsables del servicio.')}</p><div class="journey" style="padding:8px 0 0"><div class="journey-step"><span>1</span>Ubicar el caso</div><div class="journey-step"><span>2</span>Revisar sus dependencias</div><div class="journey-step"><span>3</span>Validar el resultado</div></div></div>`;
  }

  function renderDetail(id) {
    const item=catalog[id];
    main.innerHTML=`<article class="page"><nav class="breadcrumb" aria-label="Ubicación"><a href="#/">Ecosistema</a><span aria-hidden="true">/</span><span>${esc(item.short)}</span></nav><header class="detail-header"><span class="detail-tag ${item.context?'is-context':''}">${esc(item.category)}</span><h1>${esc(item.title)}</h1><p class="detail-lead">${esc(item.summary)}</p><div class="detail-actions"><a class="button button-outline" href="#/" data-focus="${id}">← Ver en el mapa</a>${item.page?`<a class="button button-text" href="${pdf(item.page)}" target="_blank" rel="noopener">Ver página ${item.page} de la propuesta ↗</a>`:''}</div></header>
      ${item.metrics?`<div class="metrics">${item.metrics.map(([n,label])=>`<div class="metric"><strong>${esc(n)}</strong><span>${esc(label)}</span></div>`).join('')}</div><p class="metrics-note">${esc(item.metricsNote)}</p>`:''}
      <div class="detail-intro"><section class="surface"><div class="section-kicker">${item.context?'Qué representa':'Alcance del servicio'}</div><h2>${item.context?'Su lugar en el ecosistema':'Qué acompaña el equipo'}</h2><p>${esc(item.description)}</p><ul class="scope-list">${item.scope.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></section>${renderVisual(item)}</div>
      ${item.current?`<aside class="current-work"><strong>Trabajo vigente</strong>${esc(item.current)}</aside>`:''}
      <div class="risk-grid"><section class="risk-card"><span class="risk-index">01 / ESCENARIO</span><h2>${item.context?'Punto de atención':'Si ocurre una incidencia'}</h2><p>${esc(item.scenario)}</p></section><section class="risk-card impact"><span class="risk-index">02 / IMPACTO</span><h2>Qué puede quedar afectado</h2><p>${esc(item.impact)}</p></section><section class="risk-card"><span class="risk-index">03 / RESPUESTA</span><h2>Cómo acompaña el equipo</h2><p>${esc(item.response)}</p></section></div>
      ${item.evidence?`<section class="evidence"><div class="evidence-date">${esc(item.evidence.date)}<span>Antecedente verificado</span></div><div><h3>${esc(item.evidence.title)}</h3><p>${esc(item.evidence.text)}</p><small>${esc(item.evidence.source)}</small></div></section>`:''}
      <section class="surface trajectory" id="service-trajectory" aria-labelledby="trajectory-title" hidden></section>
      ${item.note?`<aside class="context-note"><span aria-hidden="true">i</span><div>${esc(item.note)}</div></aside>`:''}
      <section class="relations-section"><div class="relations-head"><h2>Se relaciona con</h2><a href="#/" data-focus="${id}">Volver al contexto →</a></div><div class="relation-list">${item.relations.map(([related,why])=>`<a class="relation-link" href="${routeFor(related)}"><div><strong>${esc(catalog[related].short)}</strong><small>${esc(why)}</small></div><span aria-hidden="true">→</span></a>`).join('')}</div></section>${footer()}</article>`;
    window.TuentiHistory?.mountTrajectory(main.querySelector('#service-trajectory'),id).catch(()=>{});
  }

  function renderImpact() {
    const level=value=>`<span class="level level-${value.toLowerCase()}">${value}</span>`;
    main.innerHTML=`<div class="page"><a class="back-map" href="#/">← Volver al ecosistema</a><header class="page-heading"><div><div class="eyebrow">Tuenti <span class="accent">/</span> Evaluación preliminar</div><h1>Mapa de impacto</h1><p>El efecto potencial de una incidencia sobre clientes, operación y medición.</p></div><a class="button button-outline" href="${pdf(3)}" target="_blank" rel="noopener">Ver en la propuesta ↗</a></header><section class="impact-panel" aria-label="Evaluación preliminar de impacto"><div class="impact-intro">Ante una incidencia sin resolución. La evaluación representa impacto potencial, no probabilidad de falla.</div><div class="table-wrap"><table class="impact-table"><thead><tr><th scope="col">Capacidad</th><th scope="col">Experiencia<br>del cliente</th><th scope="col">Operación<br>y campañas</th><th scope="col">Medición<br>y análisis</th><th scope="col">Motivo principal</th></tr></thead><tbody>${impact.map(([id,name,a,b,c,why])=>`<tr><td><a href="${routeFor(id)}">${esc(name)} ↗</a></td><td>${level(a)}</td><td>${level(b)}</td><td>${level(c)}</td><td>${esc(why)}</td></tr>`).join('')}</tbody></table></div><div class="impact-legend"><span><b>Alto:</b> puede bloquear el proceso.</span><span><b>Medio:</b> limita su ejecución o seguimiento.</span><span><b>Bajo:</b> efecto indirecto en esa dimensión.</span></div></section><aside class="context-note"><span aria-hidden="true">i</span><div>La severidad y el alcance real dependen del incidente. Los costos y tiempos de recuperación requieren medición.</div></aside>${footer()}</div>`;
  }

  function renderContinuity() {
    const columns=[['01 / OPERACIÓN','Recuperar los recorridos críticos','Definir responsables y canales; priorizar incidentes según el recorrido y validar la recuperación.'],['02 / CONOCIMIENTO','Conservar contexto operativo','Mantener reglas, dependencias y tareas programadas documentadas, con decisiones e incidentes registrados.'],['03 / EVOLUCIÓN','Evolucionar con trazabilidad','Acordar prioridades de cambios, remediaciones y Analytics, con validación antes de cada liberación.']];
    main.innerHTML=`<div class="page"><a class="back-map" href="#/">← Volver al ecosistema</a><header class="page-heading"><div><div class="eyebrow">Tuenti <span class="accent">/</span> Propuesta de TSOFT</div><h1>Continuidad con capacidad<br>de respuesta.</h1><p>Acompañar la operación y la evolución con conocimiento del negocio.</p></div></header><section class="continuity-banner"><div class="section-kicker">Decisión propuesta</div><p>Dar continuidad al soporte de identidad, operación promocional y medición, con responsables definidos, atención priorizada de incidentes y un plan de evolución acordado.</p></section><div class="continuity-grid">${columns.map(([n,title,text])=>`<section class="continuity-card"><span>${n}</span><h2>${title}</h2><p>${text}</p></section>`).join('')}</div><div class="detail-actions"><a class="button" href="${pdf(10)}" target="_blank" rel="noopener">Abrir propuesta completa ↗</a><a class="button button-outline" href="assets/propuesta-continuidad-tuenti.pdf" download="TSOFT-Propuesta-Tuenti.pdf">Descargar PDF ↓</a><a class="button button-text" href="assets/mapa-ecosistema-tuenti.pdf" target="_blank" rel="noopener">Ver mapa del ecosistema ↗</a></div><section class="innovation-closing"><h2>Somos parte del equipo de Innovación</h2><p>Aportamos experiencia técnica y funcional, creatividad y compromiso para seguir trabajando con ustedes y acompañarlos en esta nueva etapa.</p></section>${footer()}</div>`;
  }

  function route(initial=false) {
    mapObserver?.disconnect();
    cancelAnimationFrame(mapFrame);
    toggleMenu(false);
    let path;
    try { path=decodeURIComponent(location.hash.slice(1)||'/').replace(/\/$/,'')||'/'; } catch { path='/no-encontrado'; }
    let active='map', id=null, title='Ecosistema de servicios';
    if(path==='/') renderMap();
    else if(path==='/impacto'){active='impact';title='Mapa de impacto';renderImpact();}
    else if(path==='/historico'){active='history';title='Histórico de incidencias';main.innerHTML='<div class="page history-page" id="history-view"></div>';window.TuentiHistory.mount(main.querySelector('#history-view'),footer());}
    else if(path==='/continuidad'){active='continuity';title='Continuidad';renderContinuity();}
    else if(path.startsWith('/servicios/') && Object.hasOwn(catalog,path.slice(11))){id=path.slice(11);title=catalog[id].title;renderDetail(id);}
    else {title='Sección no encontrada';main.innerHTML=`<div class="page error-surface"><div class="eyebrow">Ecosistema Tuenti</div><h1>Esta sección no está en el mapa.</h1><p>Volvé al ecosistema para encontrar el servicio que buscás.</p><a class="button" href="#/">Volver al mapa →</a></div>`;}
    document.querySelectorAll('[data-top]').forEach(a=>{const selected=a.dataset.top===active;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.querySelectorAll('[data-service]').forEach(a=>{const selected=a.dataset.service===id;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.title=`${title} · Tuenti | TSOFT`;
    document.querySelector('#route-status').textContent=title;
    if(!initial){window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
  }
  document.addEventListener('click', e=>{
    const link=e.target.closest('a[data-focus]');
    if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();pendingFocus=link.dataset.focus;if(location.hash==='#/'||!location.hash)route();else location.hash='#/';}
  });
  window.addEventListener('hashchange',()=>route());
  route(true);
})();

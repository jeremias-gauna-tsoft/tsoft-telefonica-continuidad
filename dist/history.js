(() => {
  'use strict';
  const format = new Intl.NumberFormat('es-AR');
  const shortMonths = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const longMonths = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labelMonth = month => `${longMonths[Number(month.slice(5)) - 1]} de ${month.slice(0,4)}`;
  const shortMonth = month => `${shortMonths[Number(month.slice(5)) - 1]} ${month.slice(2,4)}`;
  const quarterLabel = quarter => `${quarter.slice(6)}Q ${quarter.slice(0,4)}`;
  const dayMonth = date => date.split('-').reverse().slice(0,2).join('/');
  let dataPromise, developmentPromise, development;
  let selection = {category:'all',period:'last12'};

  function validate(data) {
    if(data.schemaVersion !== 1 || !Array.isArray(data.categories) || !Array.isArray(data.months) || !data.window || !data.quality || !data.coverage) throw Error('Formato de datos no compatible.');
    const ids = new Set(data.categories.map(c => c.id));
    if(ids.size !== data.categories.length || ids.has('all')) throw Error('Categorías no válidas.');
    const months = new Set();
    let total = 0;
    for(const month of data.months) {
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month.month) || months.has(month.month)) throw Error('Períodos no válidos.');
      months.add(month.month);
      if(month.hasData) {
        const values = data.categories.map(c => month.counts?.[c.id]);
        if(values.some(n => !Number.isSafeInteger(n) || n < 0) || values.reduce((a,b) => a+b,0) !== month.total) throw Error('Los totales del período no coinciden.');
        total += month.total;
      } else if(month.total !== null || month.counts !== null) throw Error('Falta distinguir meses sin datos.');
    }
    if(total !== data.quality.uniqueIncidents) throw Error('El total del registro no coincide.');
    return data;
  }

  function load() {
    if(!dataPromise) dataPromise = fetch('data/incidents.json',{cache:'no-store'})
      .then(response => {if(!response.ok) throw Error('No se pudo leer el registro.');return response.json();})
      .then(validate).catch(error => {dataPromise=null;throw error;});
    return dataPromise;
  }

  function validateDevelopment(data) {
    if(data.schemaVersion !== 1 || !Array.isArray(data.kinds) || !Array.isArray(data.quarters) || !data.quarters.length) throw Error('Formato de desarrollo no compatible.');
    const kinds = new Set(data.kinds.map(k => k.id));
    if(kinds.size !== data.kinds.length) throw Error('Tipos de trabajo no válidos.');
    const date = value => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
    let previous = '';
    for(const quarter of data.quarters) {
      if(!/^\d{4}-Q[1-4]$/.test(quarter.quarter) || quarter.quarter <= previous) throw Error('Trimestres no válidos.');
      previous = quarter.quarter;
      if(quarter.hasData) {
        if(!Array.isArray(quarter.workstreams) || !quarter.workstreams.length || !Array.isArray(quarter.highlights) || !['done','open'].includes(quarter.status) || !date(quarter.start) || !date(quarter.end)) throw Error('Trimestre con datos incompletos.');
        if([...quarter.workstreams,...quarter.highlights].some(item => typeof item.title !== 'string' || !kinds.has(item.kind))) throw Error('Trabajo sin clasificar.');
        if(quarter.highlights.some(h => h.tags !== null && (!Number.isSafeInteger(h.tags) || h.tags <= 0))) throw Error('Cantidad de tags no válida.');
      } else if(quarter.workstreams !== null || quarter.highlights !== null) throw Error('Falta distinguir trimestres sin datos.');
    }
    if(!data.quarters.some(q => q.hasData)) throw Error('No hay trimestres con registro.');
    return data;
  }

  function loadDevelopment() {
    if(!developmentPromise) developmentPromise = fetch('data/development.json',{cache:'no-store'})
      .then(response => {if(!response.ok) throw Error('No se pudo leer el registro de desarrollo.');return response.json();})
      .then(validateDevelopment).catch(error => {developmentPromise=null;throw error;});
    return developmentPromise;
  }

  function developmentSection() {
    const head = text => `<header class="history-section-head"><div><h2 id="development-title">Desarrollo y evolución</h2><p>${text}</p></div><span class="history-chart-unit">Frentes de trabajo por trimestre</span></header>`;
    if(!development || development instanceof Error) return `<section class="surface history-development" aria-labelledby="development-title">${head('No se pudo cargar el registro de desarrollo.')}</section>`;
    const catalog = window.TuentiCatalog || {};
    const kinds = new Map(development.kinds.map(k => [k.id,k.label]));
    const loaded = development.quarters.filter(q => q.hasData);
    const streams = loaded.reduce((sum,q) => sum+q.workstreams.length,0);
    const tags = loaded.reduce((sum,q) => sum+q.highlights.reduce((s,h) => s+(h.tags||0),0),0);
    const service = id => id && catalog[id] ? ` · <a href="#/servicios/${encodeURIComponent(id)}">${esc(catalog[id].short)}</a>` : '';
    const period = q => q.status==='open' ? 'En curso' : q.start && q.end ? `${dayMonth(q.start)} — ${dayMonth(q.end)}` : 'Finalizado';
    const card = q => `<article class="development-quarter ${q.status==='open'?'is-open':''}" role="listitem" aria-label="${esc(quarterLabel(q.quarter))}: ${q.workstreams.length} frentes de trabajo"><header><strong>${esc(quarterLabel(q.quarter))}</strong><span>${esc(period(q))}</span></header><div class="development-blocks" aria-hidden="true">${q.workstreams.map(w => `<i class="kind-${esc(w.kind)}"></i>`).join('')}</div><span class="development-count">${q.workstreams.length} frente${q.workstreams.length===1?'':'s'} de trabajo</span><ul class="development-list">${q.workstreams.map(w => `<li><i class="development-dot kind-${esc(w.kind)}"></i><span>${esc(w.title)}<small>${esc(kinds.get(w.kind))}${service(w.service)}</small></span></li>`).join('')}</ul>${q.highlights.length?`<h3>Hitos</h3><ul class="development-list development-highlights">${q.highlights.map(h => `<li><i class="development-dot kind-${esc(h.kind)}"></i><span>${esc(h.title)}<small>${esc(kinds.get(h.kind))}${service(h.service)}</small></span>${h.tags?`<b>${format.format(h.tags)} tags</b>`:''}</li>`).join('')}</ul>`:''}</article>`;
    return `<section class="surface history-development" aria-labelledby="development-title">${head(`Frentes planificados e hitos entregados · ${esc(quarterLabel(loaded[0].quarter))} — ${esc(quarterLabel(loaded.at(-1).quarter))}`)}
      <div class="development-stats"><div><strong>${format.format(streams)}</strong><span>Frentes de trabajo</span></div><div><strong>${loaded.length}</strong><span>Trimestres con registro</span></div><div><strong>${format.format(tags)}</strong><span>Tags GTM entregados en el período</span></div></div>
      <div class="development-quarters" role="list" aria-label="Frentes de trabajo por trimestre">${loaded.map(card).join('')}</div>
      <div class="history-chart-legend">${development.kinds.map(k => `<span><i class="history-legend-mark kind-${esc(k.id)}"></i>${esc(k.label)}</span>`).join('')}</div></section>`;
  }

  function render(root, data, footer, focusId) {
    const months = selection.period === 'last12'
      ? data.months.filter(m => m.month >= data.window.start && m.month <= data.window.end)
      : data.months.filter(m => m.month >= data.coverage.firstReportedMonth && m.month <= data.coverage.lastReportedMonth);
    const loaded = months.filter(m => m.hasData);
    const selected = data.categories.find(c => c.id === selection.category);
    const count = month => !month.hasData ? null : selected ? month.counts[selected.id] : month.total;
    const total = loaded.reduce((sum,m) => sum+count(m),0);
    const allTotal = loaded.reduce((sum,m) => sum+m.total,0);
    const categoryTotals = data.categories.map(c => ({...c,count:loaded.reduce((sum,m) => sum+m.counts[c.id],0)})).sort((a,b) => b.count-a.count || a.label.localeCompare(b.label,'es'));
    const max = Math.max(1,...loaded.map(count));
    const rangeText = `${shortMonth(months[0].month)} — ${shortMonth(months.at(-1).month)}`;
    const filtered = selected ? selected.label : 'Todas las categorías';
    const firstReported = labelMonth(data.coverage.firstReportedMonth);
    const lastReported = labelMonth(data.coverage.lastReportedMonth);
    root.innerHTML = `<header class="page-heading"><div><div class="eyebrow">Tuenti <span class="accent">/</span> Registro operativo</div><h1>Histórico de incidencias</h1><p>Volumen reportado por mes y categoría para acompañar la lectura del ecosistema.</p></div><span class="history-badge"><span class="red-dot"></span>Datos parciales</span></header>
      <section class="history-filters" aria-label="Filtros del histórico"><div class="history-filter"><label for="history-period">Período</label><select id="history-period"><option value="last12" ${selection.period==='last12'?'selected':''}>Últimos 12 meses</option><option value="available" ${selection.period==='available'?'selected':''}>Todo lo cargado</option></select></div><div class="history-filter category-filter"><label for="history-category">Categoría</label><select id="history-category"><option value="all">Todas las categorías</option>${data.categories.map(c => `<option value="${esc(c.id)}" ${selected?.id===c.id?'selected':''}>${esc(c.label)}</option>`).join('')}</select></div><button class="button button-outline history-reset" type="button" ${!selected&&selection.period==='last12'?'disabled':''}>Restablecer</button><div class="history-range">${esc(rangeText)}<span>Fuente: registro Remedy</span></div></section>
      <div class="history-metrics"><section class="history-metric primary"><span>${selected?'Incidencias de la categoría':'Incidencias registradas'}</span><strong data-history-total>${format.format(total)}</strong><small>${esc(filtered)}</small></section><section class="history-metric"><span>Meses con registros</span><strong>${loaded.length}<i> / ${months.length}</i></strong><small>La carga del período sigue en curso</small></section><section class="history-metric"><span>Categorías del registro</span><strong>${categoryTotals.filter(c=>c.count>0).length}</strong><small>Clasificación por módulo informado</small></section></div>
      <section class="history-chart surface" aria-labelledby="monthly-title"><header class="history-section-head"><div><h2 id="monthly-title">Evolución mensual</h2><p>${esc(filtered)} · ${esc(rangeText)}</p></div><span class="history-chart-unit">Cantidad de incidencias</span></header><span class="history-scroll-hint">Deslizá para ver todos los meses →</span><div class="history-plot-scroll" tabindex="0" role="region" aria-label="Gráfico mensual. Desplazamiento horizontal disponible en pantallas pequeñas"><div class="history-plot" role="list" aria-label="Incidencias por mes">${months.map(month => {
        const value=count(month);
        return `<div class="history-column ${month.hasData?'':'is-missing'} ${month.isCurrent?'is-current':''}" role="listitem" aria-label="${esc(labelMonth(month.month))}: ${value===null?'sin datos cargados':`${value} incidencias registradas`}${month.isCurrent?', mes en curso':''}"><div class="history-bar-space">${month.hasData?`<span class="history-bar-value">${format.format(value)}</span><div class="history-bar ${value===0?'is-zero':''}" style="height:${value/max*100}%"></div>`:'<span class="history-missing-label">Sin<br>datos</span><div class="history-missing-bar"></div>'}</div><span class="history-month">${shortMonths[Number(month.month.slice(5))-1]}<small>${month.month.slice(0,4)}</small></span><span class="history-current-label">${month.isCurrent?'En curso':''}</span></div>`;
      }).join('')}</div></div><div class="history-chart-legend"><span><i class="history-legend-mark reported"></i>Incidencias registradas</span><span><i class="history-legend-mark missing"></i>Sin datos cargados</span><span>${months.some(m=>m.isCurrent)?`${esc(longMonths[Number(data.window.end.slice(5))-1])} se muestra en curso según la fecha de referencia.`:'El registro sigue en proceso de carga.'}</span></div></section>
      <section class="surface history-categories" aria-labelledby="categories-title"><header class="history-section-head"><div><h2 id="categories-title">Distribución por categoría</h2><p>Totales de ${esc(rangeText)}. Elegí una categoría para ver su evolución mensual.</p></div><button class="button button-text history-show-all" type="button" ${!selected?'hidden':''}>Ver todas</button></header><div class="history-category-list">${categoryTotals.map(c => `<button type="button" class="history-category-row ${selected?.id===c.id?'is-selected':''}" data-history-category="${esc(c.id)}" aria-pressed="${selected?.id===c.id}"><span class="history-category-label">${esc(c.label)}</span><span class="history-category-track" aria-hidden="true"><span style="width:${allTotal?c.count/allTotal*100:0}%"></span></span><strong>${format.format(c.count)}</strong><span class="history-percentage">${(allTotal?c.count/allTotal*100:0).toLocaleString('es-AR',{maximumFractionDigits:1})}%</span></button>`).join('')}</div><div class="history-category-total"><span>Total de todas las categorías</span><strong>${format.format(allTotal)}</strong><span>100%</span></div></section>
      ${developmentSection()}
      <aside class="history-method"><h2>Cómo leer este histórico</h2><p>Se cuenta una vez cada ID de incidente y se agrupa por el módulo del registro. El período indica el mes informado; no es una fecha de apertura o cierre.</p><p>Hay registros de ${esc(firstReported)} a ${esc(lastReported)}. Los meses sin carga no equivalen a cero incidencias. El registro todavía se está completando.</p><p>Varios tickets pueden corresponder a un mismo incidente masivo. El volumen no representa cantidad de fallas independientes, usuarios afectados ni tiempos de resolución.</p><p>Desarrollo y evolución agrupa los frentes planificados por trimestre en Jira y sus hitos principales. El etiquetado GTM se cuenta por tag implementado; las correcciones de medición se informan aparte de las incidencias de Remedy.</p><span class="history-source-note">${format.format(data.quality.sourceRows)} registros de origen · ${data.quality.duplicateRowsRemoved} duplicado${data.quality.duplicateRowsRemoved===1?'':'s'} descontado${data.quality.duplicateRowsRemoved===1?'':'s'} · Referencia: ${esc(data.asOf.split('-').reverse().join('/'))}</span></aside>${footer}`;
    root.querySelector('#history-category').addEventListener('change', event => {selection.category=event.target.value;render(root,data,footer,'history-category');announce();});
    root.querySelector('#history-period').addEventListener('change', event => {selection.period=event.target.value;render(root,data,footer,'history-period');announce();});
    const clear = () => {selection={category:'all',period:'last12'};render(root,data,footer,'history-category');announce();};
    root.querySelector('.history-reset').addEventListener('click',clear);
    root.querySelector('.history-show-all').addEventListener('click',() => {selection.category='all';render(root,data,footer,'history-category');announce();});
    root.querySelectorAll('[data-history-category]').forEach(button => button.addEventListener('click',() => {
      selection.category=selection.category===button.dataset.historyCategory?'all':button.dataset.historyCategory;
      render(root,data,footer);root.querySelector(`[data-history-category="${button.dataset.historyCategory}"]`).focus({preventScroll:true});announce();
    }));
    if(focusId) root.querySelector(`#${focusId}`)?.focus({preventScroll:true});
    function announce(){const status=document.querySelector('#route-status');const filter=root.querySelector('#history-category');if(status)status.textContent=`Histórico actualizado. ${filter.selectedOptions[0].textContent}. ${root.querySelector('[data-history-total]').textContent} incidencias.`;}
  }

  async function mountMapPreview(root) {
    const [dev, incidents] = await Promise.all([loadDevelopment().catch(() => null), load().catch(() => null)]);
    if(!root.isConnected) return;
    if(dev) {
      const activity = {};
      for(const q of dev.quarters) for(const h of q.highlights || []) if(h.service) activity[h.service] = (activity[h.service] || 0) + 1;
      root.querySelectorAll('[data-map-node]').forEach(node => {const n = activity[node.dataset.mapNode];if(n) node.insertAdjacentHTML('beforeend',`<span class="node-activity">${n} entrega${n===1?'':'s'}</span>`);});
      root.querySelector('.map-legend')?.insertAdjacentHTML('afterbegin','<span class="legend-item"><i class="legend-activity"></i>Entregas del equipo</span>');
    }
    const previews = root.querySelector('#contribution-previews');
    const loaded = dev ? dev.quarters.filter(q => q.hasData) : [];
    const months = incidents ? incidents.months.filter(m => m.hasData) : [];
    if(!previews || (!loaded.length && !months.length)) return;
    const max = Math.max(1,...months.map(m => m.total));
    previews.innerHTML = (loaded.length ? `<a class="contribution-preview" href="#/historico"><span class="contribution-preview-title">Desarrollo y evolución</span><span class="contribution-preview-note">Frentes de trabajo e hitos entregados por trimestre</span><span class="contribution-quarters">${loaded.map(q => `<span><span class="development-blocks" aria-hidden="true">${q.workstreams.map(w => `<i class="kind-${esc(w.kind)}"></i>`).join('')}</span><b>${q.highlights.length}</b><small>hitos · ${esc(quarterLabel(q.quarter))}</small></span>`).join('')}</span></a>` : '')
      + (months.length ? `<a class="contribution-preview" href="#/historico"><span class="contribution-preview-title">Incidencias registradas</span><span class="contribution-preview-note">${format.format(incidents.quality.uniqueIncidents)} incidencias · ${esc(shortMonth(months[0].month))} — ${esc(shortMonth(months.at(-1).month))}</span><span class="contribution-bars" aria-label="Incidencias por mes">${months.map(m => `<span title="${esc(labelMonth(m.month))}: ${m.total}"><i style="height:${Math.max(2,Math.round(m.total/max*72))}px"></i><small>${shortMonths[Number(m.month.slice(5))-1]}</small></span>`).join('')}</span></a>` : '');
    previews.hidden = false;
  }

  async function mountTrajectory(root, id) {
    const item = (window.TuentiCatalog || {})[id];
    const [dev, incidents] = await Promise.all([loadDevelopment().catch(() => null), item?.incidentCategory ? load().catch(() => null) : null]);
    if(!root?.isConnected || !item) return;
    const kinds = new Map((dev?.kinds || []).map(k => [k.id,k.label]));
    const quarters = (dev?.quarters || []).filter(q => q.hasData).map(q => ({...q,items:q.highlights.filter(h => h.service === id)})).filter(q => q.items.length);
    const category = incidents?.categories.find(c => c.id === item.incidentCategory);
    const incidentCount = category ? incidents.totals.byCategory[category.id] : 0;
    const commits = item.commits || [];
    if(!quarters.length && !incidentCount && !commits.length) return;
    const items = quarters.reduce((sum,q) => sum+q.items.length,0);
    const facts = [
      ...commits.map(c => `${c.count} commits con autor TSOFT · ${c.repo}`),
      ...(items ? [`${items} hito${items===1?'':'s'} en ${quarters.length} trimestre${quarters.length===1?'':'s'}`] : []),
      ...(incidentCount ? [`${format.format(incidentCount)} incidencias registradas en ${category.label} · ${shortMonth(incidents.coverage.firstReportedMonth)} — ${shortMonth(incidents.coverage.lastReportedMonth)}`] : [])
    ];
    const sources = [...(commits.length ? [`historial de ${commits.map(c => c.repo).join(', ')}`] : []), ...(items ? [`Jira (${dev.source.label})`] : []), ...(incidentCount ? ['registro Remedy'] : [])];
    root.innerHTML = `<div class="section-kicker">Trayectoria del equipo</div><h2 id="trajectory-title">Entregas y soporte en este servicio</h2><p class="trajectory-facts">${facts.map(f => `<span>${esc(f)}</span>`).join('')}</p>${quarters.length?`<ol class="trajectory-list">${quarters.map(q => `<li><span class="trajectory-quarter">${esc(quarterLabel(q.quarter))}<small>${q.status==='open'?'En curso':'Finalizado'}</small></span><ul>${q.items.map(h => `<li><i class="development-dot kind-${esc(h.kind)}"></i><span>${esc(h.title)}<small>${esc(kinds.get(h.kind))}</small></span>${h.tags?`<b>${format.format(h.tags)} tags</b>`:''}</li>`).join('')}</ul></li>`).join('')}</ol>`:''}<p class="trajectory-source">Fuentes: ${esc(new Intl.ListFormat('es').format(sources))}. <a href="#/historico">Ver histórico →</a></p>`;
    root.hidden = false;
  }

  async function mount(root, footer) {
    root.innerHTML='<div class="history-loading" role="status">Cargando histórico de incidencias…</div>';
    try {const [data,dev]=await Promise.all([load(),loadDevelopment().catch(error => error)]);development=dev;if(root.isConnected)render(root,data,footer);}
    catch {if(!root.isConnected)return;root.innerHTML='<section class="surface history-error" role="alert"><h1>No se pudo cargar el histórico</h1><p>Comprobá que el portal esté iniciado con npm start y que el archivo de datos esté disponible.</p><button class="button" type="button">Reintentar</button></section>';root.querySelector('button').addEventListener('click',()=>mount(root,footer));}
  }
  window.TuentiHistory={mount,mountTrajectory,mountMapPreview};
})();

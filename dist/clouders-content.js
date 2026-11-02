// Clouders content shared by the portal (clouders.html) and the PDF scripts (map and extended proposal).
// level: business criticality that colors each solution; solutions without level are upcoming launches.
// page: page of the extended proposal (assets/propuesta-continuidad-clouders.pdf) that covers the solution.
// Usage figures were reported by the team; commits count TSOFT-authored commits per repository.
window.CloudersCatalog = {
  beneficios: {
    level: 'critico', category: 'Portal', short: 'Portal Beneficios', title: 'Portal Beneficios', page: 4, image: 'beneficios.png',
    line: 'Portal del empleado: bonos, cursos, colonia, seguros y más', proof: '+4.000 usuarios · +19 secciones para el empleado',
    risk: 'Si el portal falla, los empleados no acceden a sus beneficios ni bonos',
    summary: 'Supernova es el portal del empleado de Telefónica: bonos, cursos, colonia, seguros, familia, salud y más. El equipo lo construyó y lo sigue evolucionando trimestre a trimestre.',
    scope: ['Portal del empleado: front y back', 'Secciones Mi tiempo, Mi salud, Familia y reintegros', 'Búsquedas internas con postulación y auditoría', 'Gamificación, referidos y notificaciones', 'Seguridad: remediación de AppScan y escaneos'],
    scenario: 'El portal o una de sus secciones deja de responder y los empleados no pueden consultar ni gestionar sus beneficios.',
    impact: 'Consultas y reclamos al área responsable, beneficios sin usar y campañas internas que pierden alcance mientras se recupera el servicio.',
    response: 'Revisar front, back e integraciones del portal; recuperar la sección afectada y validar el recorrido con el área responsable.',
    relations: [['eventos', 'Eventos y sorteos funcionan dentro del portal'], ['reconocimientos', 'Los reconocimientos se dan desde el perfil del empleado'], ['bienes', 'La venta de bienes se publica en el portal'], ['ui', 'Usa los componentes compartidos de Clouders UI'], ['asistente', 'El asistente responde consultas sobre sus beneficios']]
  },
  eventos: {
    level: 'alto', category: 'Comunidad', short: 'Eventos y sorteos', title: 'Eventos y sorteos', page: 4, image: 'beneficios.png',
    line: 'Eventos, sorteos y caja navideña para los empleados', proof: 'Entre las funciones más usadas',
    risk: 'Un sorteo o evento sin resolver genera reclamos y revisión manual',
    summary: 'Eventos, sorteos y la caja navideña de los empleados, dentro del portal. Es una de las funciones más usadas.',
    scope: ['Inscripción y participación en eventos y sorteos', 'Eventos privados y anulación de inscripciones', 'Notificaciones de sorteos', 'Rediseño de la sección de sorteos'],
    scenario: 'Una falla impide participar en un evento o sorteo y no se resuelve a tiempo.',
    impact: 'Reclamos y revisión manual. Pueden quedar participaciones sin resolver o demorarse los resultados.',
    response: 'Revisar reglas, registros y cierres automáticos. Recuperar y validar el circuito con el área responsable para dar continuidad a las gestiones.',
    relations: [['beneficios', 'Se publica y se gestiona dentro del portal']]
  },
  reconocimientos: {
    level: 'medio', category: 'Cultura', short: 'Reconocimientos', title: 'Reconocimientos', page: 4, image: 'beneficios.png',
    line: 'Reconocimientos entre colegas, insignias y desafíos', proof: 'Módulo de insignias: empleado, admin y cargas',
    risk: 'Se frenan los reconocimientos que sostienen la cultura interna',
    summary: 'Reconocimientos entre colegas, insignias, empleado del mes y reconocimientos masivos con entrega de vouchers.',
    scope: ['Insignias: empleado, admin y cargas masivas', 'Reconocimientos masivos con entrega de vouchers', 'Empleado del mes y reconocimiento destacado', 'Reportería e histórico de insignias'],
    scenario: 'Un reconocimiento masivo o la entrega de vouchers falla durante una campaña interna.',
    impact: 'Reconocimientos sin entregar, reclamos de los equipos y menor adhesión a las iniciativas de cultura.',
    response: 'Revisar cargas, estados y notificaciones; reprocesar los casos pendientes y validar el resultado con el área responsable.',
    relations: [['beneficios', 'Se dan desde el perfil del empleado en el portal']]
  },
  bienes: {
    level: 'alto', category: 'Activos', short: 'Gestión de Bienes', title: 'Gestión de Bienes', page: 4,
    line: 'Venta de bienes de la empresa a sus empleados', proof: 'Inmuebles, rodados y obras de arte',
    risk: 'Ofertas sin cerrar demoran la venta de activos de la empresa',
    summary: 'Venta de bienes de la empresa a sus empleados: inmuebles, rodados y obras de arte, con referidos y ofertas únicas.',
    scope: ['Gestión inmobiliaria: estados, pedidos y fichas en PDF', 'Rodados y obras de arte', 'Referidos y ofertas únicas', 'Avisos al administrador por nuevos pedidos'],
    scenario: 'Una falla impide cerrar las ofertas de un bien o registrar un pedido, y no se resuelve a tiempo.',
    impact: 'Se demora la venta de activos y aumenta la revisión manual de pedidos y ofertas.',
    response: 'Revisar reglas, registros y cierres automáticos. Recuperar y validar el circuito con el área responsable para dar continuidad a las gestiones.',
    relations: [['beneficios', 'Las ofertas se publican en el portal']]
  },
  compliance: {
    level: 'critico', category: 'Normativa', short: 'Compliance', title: 'Compliance', page: 5, image: 'compliance.png',
    line: 'Declaraciones juradas y su revisión por administradores', proof: '+4.000 usuarios de Telefónica',
    risk: 'Declaraciones sin enviar ni revisar se acumulan y quedan sin control',
    summary: 'Declaraciones juradas de conflicto de intereses, regalos y agasajos, con su revisión por administradores. La usan más de 4.000 colaboradores de Telefónica.',
    scope: ['Formularios de declaración: front, back y full stack', 'Panel administrativo de declaraciones y reportes', 'Feedback entre administradores y usuarios', 'Formulario 2026 con exportación de respuestas'],
    scenario: 'Un error impide enviar declaraciones o actualizar su revisión, y los casos no pueden corregirse oportunamente.',
    impact: 'Se acumulan solicitudes y revisiones pendientes, con reprocesos y menor visibilidad del estado de cada caso.',
    response: 'Revisar permisos, estados e integraciones; recuperar y validar el circuito. Mantener los criterios del análisis asistido bajo revisión del administrador.',
    relations: [['analisis', 'La IA asiste la revisión de cada declaración'], ['ui', 'Usa los componentes compartidos de Clouders UI']]
  },
  analisis: {
    level: 'alto', category: 'IA', short: 'Análisis con IA', title: 'Análisis de riesgo con IA', page: 5,
    line: 'Puntaje de riesgo de 0 a 100; la decisión es del administrador', proof: 'Servicio de IA propio para Compliance',
    risk: 'Sin análisis asistido, cada declaración se revisa a mano desde cero',
    summary: 'Servicio de IA propio de Compliance: un RAG que asigna un puntaje de riesgo de 0 a 100 y agentes de consulta para los administradores. La decisión final es siempre del administrador.',
    scope: ['RAG con puntaje de riesgo de 0 a 100', 'Agente de consulta para administradores', 'Agente que analiza solicitudes de conflicto de interés', 'Reportería con IA'],
    scenario: 'El análisis asistido deja de responder o trabaja con criterios desactualizados.',
    impact: 'Cada declaración vuelve a revisarse a mano desde cero y se demora el cierre de los casos.',
    response: 'Revisar el servicio, sus fuentes y criterios; mantener el análisis bajo revisión del administrador y validar los resultados antes de habilitar cambios.',
    relations: [['compliance', 'Evalúa las declaraciones de Compliance']]
  },
  redactor: {
    level: 'alto', category: 'Comercial', short: 'Redactor de Ofertas', title: 'Redactor de Ofertas', page: 6, image: 'redactor.png',
    line: 'Arma ofertas comerciales con reglas, plantillas y anexos', proof: 'Plantillas y anexos versionados',
    risk: 'Reglas o plantillas viejas llevan errores a las ofertas comerciales',
    summary: 'Genera ofertas comerciales a partir de datos de productos, reglas y documentos, con plantillas y anexos versionados.',
    scope: ['Generación de ofertas con datos de productos y reglas', 'Gestión de recursos: plantillas, anexos y versiones', 'Ofertas listas para revisión, descarga y consulta'],
    scenario: 'Cambian productos o condiciones comerciales y las reglas, plantillas o anexos no se actualizan a tiempo.',
    impact: 'Las ofertas pueden requerir correcciones o armado manual. Aumentan las revisiones y se demora la preparación de propuestas comerciales.',
    response: 'Alinear el cambio con el área comercial, mantener reglas y recursos, y comprobar el documento generado antes de habilitar la nueva versión.',
    relations: []
  },
  pronos: {
    level: 'medio', category: 'Eventos', short: 'PronosClouders', title: 'PronosClouders', page: 7, image: 'pronos.png',
    line: 'Prode del Mundial 2026: pronósticos, puntos y ranking', proof: '+2.700 usuarios en el Mundial 2026',
    risk: 'Si fallan cierres o puntos en el torneo, se pierde confianza en el ranking',
    summary: 'El Prode del Mundial 2026 para los colaboradores de Telefónica: pronósticos, grupos, puntos y ranking. Participaron más de 2.700 usuarios.',
    scope: ['Pronósticos, puntos y ranking', 'Grupos entre colegas', 'Integración con el portal de beneficios', 'Pruebas de carga y de seguridad antes del torneo'],
    scenario: 'Durante el torneo falla el cierre de pronósticos o el cálculo de puntos y no se resuelve dentro de la ventana del evento.',
    impact: 'Reclamos, revisión manual de resultados y pérdida de confianza en el ranking. La exposición se concentra en los días de competencia.',
    response: 'Preparar reglas y calendario, verificar cierres y puntajes, y sostener soporte durante el evento. Adaptar y validar la base antes de una nueva competencia.',
    relations: [['beneficios', 'Integrado con el portal de beneficios']]
  },
  ui: {
    level: 'alto', category: 'Base compartida', short: 'Clouders UI', title: 'Clouders UI', page: 8, image: 'ui.png',
    line: 'Componentes de Beneficios y Compliance', proof: '+275 commits TSOFT · catálogo en Storybook',
    risk: 'Una regresión en un componente afecta a varias aplicaciones a la vez',
    summary: 'La base de componentes que comparten Beneficios y Compliance, con su catálogo en Storybook.',
    scope: ['Componentes y versiones', 'Catálogo en Storybook', 'Validación de las aplicaciones que la consumen'],
    scenario: 'Una modificación en un componente compartido introduce una regresión y no hay un responsable que coordine su corrección.',
    impact: 'Se requiere revisar las interfaces consumidoras y repetir validaciones. Pueden demorarse correcciones y cambios en más de una aplicación.',
    response: 'Mantener componentes y versiones, reproducir el problema en el catálogo y validar los flujos de las aplicaciones afectadas antes de integrar el cambio.',
    relations: [['beneficios', 'Consume los componentes compartidos'], ['compliance', 'Consume los componentes compartidos']]
  },
  asistente: {
    category: 'En desarrollo', short: 'Asistente IA Beneficios', title: 'Asistente IA de Beneficios', page: 4,
    line: 'El empleado consulta sus beneficios en lenguaje natural',
    risk: 'Sin continuidad, el lanzamiento del asistente queda frenado',
    summary: 'Un asistente con IA para que el empleado consulte sus beneficios en lenguaje natural, dentro del portal.',
    scope: ['Bot de consultas del portal', 'Agente para el portal de beneficios'],
    scenario: 'Sin continuidad, el lanzamiento del asistente queda frenado.',
    impact: 'Las consultas siguen llegando por los canales actuales y el portal no suma autoservicio.',
    response: 'Completar el desarrollo, validar las respuestas con el área responsable y acompañar el lanzamiento.',
    relations: [['beneficios', 'Responde sobre los beneficios del portal']]
  },
  descuentos: {
    category: 'En desarrollo', short: 'Descuentos', title: 'Descuentos y Oportunidades', page: 4,
    line: 'Nuevas ofertas y descuentos dentro del portal',
    risk: 'Sin continuidad, la nueva sección no llega a los empleados',
    summary: 'Una nueva sección del portal con descuentos y oportunidades para los empleados.',
    scope: ['Diseño y rediseño de la sección', 'Front y back', 'Pruebas de la sección completa'],
    scenario: 'Sin continuidad, la nueva sección no llega a los empleados.',
    impact: 'Queda sin aprovechar el diseño y el desarrollo ya hechos, y los empleados no acceden a las nuevas ofertas.',
    response: 'Completar el desarrollo, validar la sección con el área responsable y acompañar su lanzamiento.',
    relations: [['beneficios', 'Es una sección nueva del portal']]
  }
};

window.CloudersTeam = {
  // TSOFT-authored commits per repository; null marks a solution still to be loaded.
  repos: [
    ['Portal Beneficios', [['front', 3754], ['back', 1780]]],
    ['Compliance', [['front', 411], ['back', 245]]],
    ['PronosClouders', [['front', 150], ['back', 130]]],
    ['Clouders UI', [['librería', 275]]],
    ['Redactor de Ofertas', null]
  ],
  users: [['+4.000', 'Usuarios en Beneficios'], ['+4.000', 'Usuarios en Compliance'], ['+2.700', 'Usuarios en el Prode 2026']],
  // Heatmap rows: one per solution, in map order.
  rows: [['beneficios', 'Portal Beneficios'], ['pronos', 'PronosClouders'], ['reconocimientos', 'Reconocimientos'], ['compliance', 'Compliance'], ['eventos', 'Eventos y sorteos'], ['bienes', 'Gestión de Bienes'], ['descuentos', 'Descuentos'], ['analisis', 'IA de Compliance'], ['asistente', 'Asistente IA Beneficios']],
  groups: [
    ['Portal del empleado', ['beneficios', 'eventos', 'reconocimientos', 'bienes']],
    ['Normativa e IA', ['compliance', 'analisis']],
    ['Comercial y eventos', ['redactor', 'pronos']],
    ['Base y lanzamientos', ['ui', 'asistente', 'descuentos']]
  ]
};

// Shared calculations over clouders-development.json. Stories of the quarter in progress count only once closed.
window.CloudersMetrics = development => {
  const quarters = development.quarters.filter(q => q.hasData).map(q => ({...q, done: q.items.filter(i => !i.status), open: q.items.filter(i => i.status)}));
  const done = quarters.flatMap(q => q.done.map(i => ({...i, quarter: q.quarter})));
  const label = quarter => `${quarter.slice(6)}Q ${quarter.slice(2, 4)}`;
  const longLabel = quarter => `${quarter.slice(6)}Q ${quarter.slice(0, 4)}`;
  const count = (service, quarter) => quarter.done.filter(i => i.service === service).length;
  const byService = {};
  for (const item of done) byService[item.service] = (byService[item.service] || 0) + 1;
  const byKind = development.kinds.map(k => ({...k, count: done.filter(i => i.kind === k.id).length})).filter(k => k.count).sort((a, b) => b.count - a.count);
  const current = quarters.find(q => q.inProgress);
  const period = `${longLabel(quarters[0].quarter)} — ${longLabel(quarters.at(-1).quarter)}`;
  return {quarters, done, label, longLabel, count, byService, byKind, current, period, fronts: quarters.reduce((sum, q) => sum + q.fronts.length, 0)};
};

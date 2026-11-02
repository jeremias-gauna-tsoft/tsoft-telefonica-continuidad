window.TuentiCatalog = {
  idp: {
    title: 'Identidad y acceso', short: 'Identidad y acceso', category: 'Acceso del cliente', page: 4, incidentCategory: 'identidad', commits: [{ count: '+62', repo: 'tuenti-idp-nodejs' }],
    summary: 'La puerta de entrada a las gestiones del cliente.',
    description: 'El frontend y el backend del login conectan la interfaz de ingreso con la validación de línea, los códigos de acceso y la sesión.',
    scope: ['Pantallas y experiencia de ingreso en web y móvil.', 'Validación de línea y solicitud o reenvío de códigos.', 'Integración de autenticación y mantenimiento de la sesión.'],
    scenario: 'Una incidencia impide solicitar o validar el código de acceso, o completar la autenticación.',
    impact: 'El cliente no puede ingresar y debe postergar sus gestiones. Pueden aumentar el abandono del recorrido y las consultas a soporte.',
    response: 'Seguir el caso desde la pantalla y la validación de línea hasta el código y la sesión; verificar en web y móvil el ingreso y los errores previstos.',
    evidence: { date: 'Septiembre 2026', title: 'Compatibilidad del login en Safari iOS', text: 'El historial registra un ajuste del campo de teléfono para evitar el zoom al enfocar el control.', source: 'Cambio de estilos registrado el 28/09/2026 en tuenti-idp-nodejs. El antecedente acredita un cambio de código; no una medición de su resultado en producción.' },
    image: 'idp-login.png', imageAlt: 'Referencia del login Tuenti con opciones de ingreso por número o correo.',
    relations: [['channel', 'Habilita el acceso al canal'], ['gtm', 'Las pantallas de ingreso generan eventos']]
  },
  channel: {
    title: 'App Tuenti', short: 'App Tuenti', category: 'Canal del cliente', commits: [{ count: '+1.406', repo: 'frontend web' }, { count: '+275', repo: 'app APK' }, { count: '+510', repo: 'tuenti-ui' }],
    summary: 'La app principal de Tuenti, en web y móvil: donde el cliente recarga, compra packs y gestiona su línea.',
    description: 'La web y la aplicación móvil reúnen los recorridos del cliente. El equipo desarrolla sobre el frontend web, la app y tuenti-ui, la librería de componentes visuales que comparten, y suma capacidades como CI360, el pedido de eSIM o la nueva versión iOS.',
    scope: ['Recorrido de acceso e integración con el login.', 'Acceso a la experiencia promocional del Oráculo.', 'Pantallas y eventos que requieren instrumentación.'],
    scenario: 'Una incidencia de acceso, promociones o integración se refleja en el recorrido del cliente.',
    impact: 'El cliente no puede completar sus gestiones en la web o la app, y la falla se percibe como un problema de Tuenti aunque se origine en otro servicio.',
    response: 'Coordinar la intervención entre las capacidades afectadas y los responsables del canal, conservando el contexto funcional del caso.',
    note: 'El equipo aporta al frontend web, la app y tuenti-ui; la ficha no atribuye la propiedad de toda la aplicación.',
    relations: [['idp', 'Acceso y autenticación'], ['oraculo', 'Experiencia promocional'], ['gtm', 'Instrumentación de pantallas y eventos'], ['dcp', 'Recargas automáticas desde la app']]
  },
  oraculo: {
    title: 'Gamificación · Oráculo', short: 'Oráculo / Ruleta', category: 'Experiencia promocional', page: 5,
    summary: 'Participación, tiros, premios y canjes en una misma experiencia.',
    description: 'La ruleta promocional fue desarrollada de punta a punta por el equipo, según el alcance informado. Su experiencia depende de la coordinación entre la aplicación y sus servicios.',
    scope: ['Experiencia móvil de participación y consulta de tiros.', 'Ejecución del juego y presentación del resultado.', 'Integración de participantes, premios y canje de vouchers.'],
    scenario: 'El cliente no puede jugar o un canje queda sin una respuesta clara durante una campaña.',
    impact: 'Reclamos y revisión de participaciones o beneficios. La campaña puede perder efectividad mientras se recupera el circuito.',
    response: 'Revisar el mismo caso en participante, tiros, juego y canje; contrastar estados con el panel y validar el recorrido en la app móvil.',
    steps: ['Participante', 'Tiros disponibles', 'Juego y resultado', 'Premio y canje'],
    evidence: { date: 'Julio 2026', title: 'Adaptación de la experiencia a campañas', text: 'El historial registra la restauración de la temática clásica después de la variante Mundial, con cambios en pantallas, recursos y textos.', source: 'Historial de tuenti_apk_ipa_prod del 20/07/2026. Antecedente de evolución verificado en código.' },
    relations: [['channel', 'Se utiliza desde la app Tuenti'], ['gaming', 'Consume servicios de gamificación'], ['gtm', 'Registra el recorrido promocional']]
  },
  gaming: {
    title: 'Backend de gamificación', short: 'Backend de gamificación', category: 'Servicios e integraciones', page: 5,
    summary: 'La lógica y las integraciones que sostienen el Oráculo.',
    description: 'El ecosistema distribuido contiene capacidades de participantes, tiros, configuración, premios y canjes, junto con procesos programados y componentes de integración.',
    scope: ['Servicios e integraciones consumidos por la aplicación.', 'Reglas y estados de participantes, tiros y beneficios.', 'Mantenimiento, despliegues y atención de hallazgos de seguridad, según el responsable.'],
    scenario: 'Una incidencia en un servicio o proceso automático interrumpe una parte del recorrido promocional.',
    impact: 'Pueden quedar gestiones pendientes o aumentar las revisiones manuales. La recuperación requiere identificar el servicio, las reglas y las dependencias involucradas.',
    response: 'Localizar el punto de falla, revisar estados y ejecuciones y validar el recorrido completo con la aplicación y el área operativa.',
    inventory: [['9', 'Integraciones (ITG)'], ['2', 'Servicios (SVC)'], ['7', 'Fachadas (FCD)']],
    note: 'Inventario informado: 18 componentes de gamificación. Debe conciliarse con lo desplegado; no se revisó el código de todos los componentes.',
    current: 'El responsable informa actualización de servicios y corrección de hallazgos de AppScan en curso.',
    relations: [['oraculo', 'Responde al recorrido del juego'], ['panel', 'Configuración y seguimiento operativo'], ['referidos', 'Otro proceso del ecosistema operativo']]
  },
  panel: {
    title: 'Clouders Panel', short: 'Clouders Panel', category: 'Operación promocional', page: 6,
    summary: 'La operación necesita consultar, configurar y seguir cada caso.',
    description: 'El panel permite administrar configuraciones y vouchers y consultar estados, registros y métricas de gamificación y referidos.',
    scope: ['Configuraciones de gamificación y gestión de vouchers.', 'Consultas de registros, estados, pendientes y fallidos.', 'Métricas de consumos y seguimiento de referidos.'],
    scenario: 'El panel impide consultar casos o ajustar configuraciones necesarias para la operación.',
    impact: 'Menor visibilidad de la campaña, revisión manual y demoras para responder reclamos o continuar gestiones.',
    response: 'Recuperar las consultas y configuraciones afectadas y comprobar su resultado con el área operativa y los servicios relacionados.',
    evidence: { date: 'Marzo 2026', title: 'Más visibilidad sobre tiros y stock', text: 'Se incorporaron consultas de consumos de tiros y stock al backend del panel.', source: 'Cambio registrado el 26/03/2026 en clouderspanel-be. El historial acredita la incorporación de consultas.' },
    relations: [['gaming', 'Configura y consulta gamificación'], ['referidos', 'Consulta sus estados y métricas']]
  },
  referidos: {
    title: 'Referidos automáticos', short: 'Referidos automáticos', category: 'Procesos operativos', page: 6,
    summary: 'Archivos, reglas y estados para acompañar el ciclo de los referidos.',
    description: 'Según el responsable, los procesos automatizan la carga y validación, evitan duplicados, actualizan estados y gestionan archivos durante el ciclo de vida del programa.',
    scope: ['Carga y validación de referidos.', 'Actualización de estados según reglas de negocio.', 'Gestión de archivos y seguimiento de altas, recargas y beneficios.'],
    scenario: 'Una carga, validación o tarea automática deja casos sin actualizar.',
    impact: 'Casos pendientes y conciliación manual, con posibles demoras en beneficios y en la atención de reclamos.',
    response: 'Revisar archivos, tareas y estados; conciliar pendientes con las reglas del programa y validar su recuperación sin duplicar casos.',
    services: ['tuenti-svc-referidosaltas', 'tuenti-svc-referidosloader', 'tuenti-svc-referidosrecargas', 'tuenti-svc-referidosredeem'],
    note: 'Cuatro servicios informados por el responsable, adicionales al inventario de gamificación y pendientes de conciliar con lo desplegado.',
    relations: [['panel', 'Estados y métricas para la operación'], ['gaming', 'Comparte el contexto operativo del ecosistema']]
  },
  gtm: {
    title: 'GTM · Instrumentación', short: 'GTM / etiquetado', category: 'Medición del recorrido', page: 7,
    summary: 'Datos confiables mientras la aplicación sigue cambiando.',
    description: 'El equipo implementó el etiquetado de la aplicación Tuenti y verifica cada cambio solicitado por Analytics: recarga automática, compras, recargas, roaming, configuración, cuenta, medios de pago, activación de SIM y gigas, además de registro, login y cambio de usuario.',
    scope: ['Eventos y vistas de pantalla en web y aplicación móvil.', 'Puente de medición entre WebView y componentes nativos.', 'Verificación de nombres, parámetros y recepción de eventos con el área solicitante.'],
    scenario: 'Un cambio de pantalla o navegación deja de registrar eventos o altera su significado.',
    impact: 'Pueden faltar datos aunque la app siga operativa. La medición incompleta dificulta detectar abandonos y evaluar cambios o campañas.',
    response: 'Seguir el evento desde la pantalla y el puente web-móvil hasta su recepción en Analytics y confirmar nombre y parámetros con el área solicitante.',
    image: 'analytics.png', imageAlt: 'Reporte de páginas y pantallas de la propiedad Tuenti Web App.',
    metrics: [['+192', 'Tags implementados por el equipo'], ['+87', 'Vistas de pantalla etiquetadas'], ['+10', 'Módulos de la app instrumentados']],
    metricsNote: 'Inventario del código de la app Tuenti (utils/gtm/) al 26/10/2026. Cada tag es una función de etiquetado; las que no son vistas de pantalla registran eventos.',
    evidence: { date: 'Julio 2026', title: 'Evolución del etiquetado móvil', text: 'Se incorporaron nuevas propiedades de usuario al etiquetado de la aplicación móvil.', source: 'Cambio del 16/07/2026 verificado en el historial de tuenti_apk_ipa_prod.' },
    relations: [['idp', 'Instrumenta el acceso'], ['channel', 'Instrumenta los recorridos del canal'], ['oraculo', 'Instrumenta la participación'], ['analytics', 'Datos para su evaluación']]
  },
  analytics: {
    title: 'Medición y análisis', short: 'Medición y análisis', category: 'Contexto del ecosistema', context: true, page: 7,
    summary: 'El área de Analytics define necesidades de medición y utiliza los datos.',
    description: 'Este bloque muestra el destino y el uso del etiquetado. El equipo TSOFT implementa y verifica la instrumentación; el análisis se ubica como contexto de esa colaboración.',
    scope: ['Requerimientos de eventos y pantallas para instrumentar.', 'Verificación compartida de los datos recibidos.', 'Información para analizar recorridos y evaluar cambios.'],
    scenario: 'Eventos incompletos o inconsistentes limitan la lectura del recorrido del cliente.',
    impact: 'Se vuelve más difícil comparar resultados, detectar abandonos y evaluar campañas o modificaciones de la aplicación.',
    response: 'Alinear los requerimientos con el área solicitante y verificar que la implementación conserve el significado esperado de los datos.',
    metrics: [['158.815', 'Usuarios activos'], ['2.222.310', 'Visualizaciones'], ['4.842.938', 'Eventos']],
    metricsNote: 'Captura de la propiedad Tuenti Web App · 25/09 al 22/10/2026. Estas cifras no corresponden exclusivamente a IDP ni a gamificación.',
    note: 'El área de Analytics se presenta como contexto. El alcance del equipo es la implementación y verificación del etiquetado.',
    relations: [['gtm', 'Recibe la instrumentación acordada']]
  },
  dcp: {
    title: 'Recargas automáticas · DCP / Recurrencia', short: 'Recargas automáticas (DCP)', category: 'Soporte transversal', page: 8, incidentCategory: 'dcp',
    summary: 'Las recargas automáticas: el cliente recarga una vez y, si lo activa, el mes siguiente la recarga se hace sola.',
    description: 'Recurrencia es el nombre técnico de las recargas automáticas que el cliente programa con una tarjeta guardada. El equipo mantiene las integraciones que hacen funcionar el circuito y lo hizo evolucionar, por ejemplo con la opción de sumar un segundo medio de pago y la baja de tarjetas cuando se da de baja la línea.',
    scope: ['Recargas automáticas programadas por el cliente.', 'Tarjetas guardadas, incluido un segundo medio de pago.', 'Mantenimiento de las integraciones y validación de cada cambio.'],
    scenario: 'Una recarga automática no se procesa o una tarjeta guardada no puede usarse.',
    impact: 'El cliente se queda sin saldo aunque esperaba que la recarga se hiciera sola. Aumentan los reclamos y las consultas a soporte.',
    response: 'Revisar las integraciones y validar los escenarios de uso afectados con los responsables del servicio.',
    note: 'Alcance de soporte vigente confirmado por el equipo. La ficha no atribuye a este servicio el procesamiento completo de los pagos.',
    relations: [['channel', 'Otros recorridos de la app Tuenti'], ['push', 'Avisa al cliente sobre sus recargas automáticas']]
  },
  push: {
    title: 'Avisos al celular · Push FCM', short: 'Avisos al celular (Push)', category: 'Soporte transversal', page: 8,
    summary: 'Los avisos que la aplicación le envía al celular del cliente cuando ocurre algo.',
    description: 'Push FCM son las notificaciones que llegan al celular del cliente; FCM es el servicio de Google que las entrega. Por ejemplo, avisan que se hizo la recarga automática o que hubo un problema con ella, recuerdan un día antes que se va a procesar y acompañan la compra de un extra. El equipo mantiene la integración que las envía.',
    scope: ['Avisos de recarga automática: confirmación, problemas y recordatorio previo.', 'Mensajes asociados a compras, como la de un extra.', 'Mantenimiento de la integración de envío y diagnóstico de avisos que no llegan.'],
    scenario: 'Las notificaciones dejan de llegar o llegan tarde.',
    impact: 'El cliente no se entera de que su recarga se hizo, falló o está por procesarse, y lo descubre cuando ya tiene un problema.',
    response: 'Diagnosticar la integración y comprobar la entrega de las notificaciones involucradas.',
    note: 'Alcance de soporte vigente confirmado por el equipo.',
    relations: [['channel', 'Comunicaciones hacia la aplicación'], ['dcp', 'Avisos sobre las recargas automáticas']]
  },
  backoffice: {
    title: 'Cambio de usuario', short: 'Cambio de usuario', category: 'Soporte transversal', page: 8,
    summary: 'Continuidad de las gestiones realizadas desde backoffice.',
    description: 'El soporte backend del circuito de cambio de usuario de backoffice forma parte del alcance vigente confirmado.',
    scope: ['Mantenimiento del circuito backend.', 'Diagnóstico de errores que impiden completar la gestión.', 'Verificación del resultado para el operador.'],
    scenario: 'El cambio de usuario no puede completarse.',
    impact: 'Gestiones demoradas y necesidad de intervención técnica para continuar.',
    response: 'Recuperar el circuito y comprobar el resultado con el operador y los responsables del servicio.',
    note: 'Alcance de soporte vigente confirmado por el equipo.',
    relations: [['channel', 'Gestiones vinculadas a la app Tuenti']]
  }
};

window.TuentiImpact = [
  ['idp', 'Identidad y login', 'Alto', 'Alto', 'Medio', 'Un error puede impedir el acceso a gestiones.'],
  ['oraculo', 'Ruleta, tiros y canjes', 'Alto', 'Alto', 'Medio', 'Una falla puede bloquear el juego o el canje.'],
  ['referidos', 'Referidos automáticos', 'Medio', 'Alto', 'Medio', 'Estados pendientes pueden demorar beneficios.'],
  ['panel', 'Clouders Panel', 'Medio', 'Alto', 'Medio', 'Limita consultas y ajustes operativos.'],
  ['gtm', 'Etiquetado GTM y eventos', 'Bajo', 'Medio', 'Alto', 'Pueden faltar datos aunque la app siga operativa.'],
  ['dcp', 'Recargas automáticas (DCP)', 'Alto', 'Alto', 'Bajo', 'Afecta las recargas automáticas y las tarjetas guardadas.'],
  ['push', 'Avisos al celular (Push)', 'Medio', 'Medio', 'Medio', 'El cliente puede no enterarse de su recarga o de un problema.'],
  ['backoffice', 'Cambio de usuario', 'Medio', 'Alto', 'Bajo', 'Puede frenar gestiones del operador.']
];

window.TuentiTeam = {
  facts: [['+3.591', 'Commits con autor TSOFT', 'Frontend web, app, UI, login y microservicios'], ['+192', 'Tags GTM en la app', '87 vistas de pantalla · 10 módulos'], ['+13', 'Frentes de trabajo', '3Q 2025 — 3Q 2026 · Jira'], ['+335', 'Incidencias registradas', 'Feb — oct 2026 · Remedy']]
};

# TSOFT · Ecosistemas Tuenti y Clouders

Frontend independiente para presentar los servicios de Tuenti y las soluciones de Clouders a partir de mapas navegables. No requiere instalar dependencias ni conectarse a APIs.

## Iniciar

Con Node.js 18 o posterior:

```powershell
npm start
```

Abrir `http://127.0.0.1:4178`. Para usar otro puerto, definir `PORT` antes de iniciar. Detener con Ctrl+C.

La vista general puede abrirse desde `dist/index.html`; el portal de Tuenti está en `dist/tuenti.html` y el de Clouders en `dist/clouders.html`. Para consultar el histórico, iniciar el servidor con `npm start`, porque sus datos se leen desde un JSON local. Las rutas utilizan fragmentos (`#/...`). Para compartir el frontend, conservar todos los archivos de `dist/` y servirlos por HTTP.

## Estructura

- `dist/index.html`, `dist/home.js` y `dist/home.css`: vista general con los dos clientes.
- `dist/tuenti.html`: estructura de navegación del portal de Tuenti.
- `dist/content.js`: contenido de las once fichas y matriz de impacto.
- `dist/app.js`: mapa interactivo, rutas, navegación entre relaciones y vistas.
- `dist/styles.css`: identidad visual y adaptación a escritorio y móvil.
- `dist/history.js` y `dist/history.css`: histórico mensual, filtros y distribución por categoría.
- `dist/data/incidents.json`: cantidades agregadas, sin IDs ni datos de personas.
- `dist/data/development.json`: frentes de trabajo e hitos por trimestre, curados desde Jira, sin IDs ni datos de personas.
- `scripts/import_remedy.py`: conversión del registro Excel con Python 3, sin paquetes adicionales.
- `scripts/remedy-categories.json`: correspondencia entre módulos del Excel y categorías.
- `dist/assets/`: logo, capturas y copias de referencia de los PDF.
- `server.mjs`: servidor local sin dependencias.

## Recorrido

- `#/`: mapa del ecosistema.
- `#/servicios/idp`: ejemplo de una ficha; los otros identificadores están en `content.js`.
- `#/impacto`: matriz de impacto potencial.
- `#/historico`: cantidades mensuales y por categoría, con cobertura parcial identificada.
- `#/continuidad`: propuesta de continuidad e identidad del equipo de Innovación.

La tarjeta de contexto distingue el área de Analytics del alcance del equipo. La app Tuenti (canal del cliente) se muestra como alcance porque el equipo desarrolla sobre el frontend web, la app y tuenti-ui, sin atribuirse la propiedad de toda la aplicación. Las conexiones describen relaciones funcionales, no topología de despliegue. Los antecedentes corresponden a cambios verificados en código; no acreditan resultados medidos en producción.

Las capturas y el contenido se tomaron de la propuesta aprobada. El proyecto original y los PDF originales no se modifican. La publicación en Sites no está disponible en este espacio; esta entrega funciona localmente y puede servirse como contenido estático.

La propuesta también se conserva en `assets/tsoft_tuenti_propuesta_continuidad.pdf` para que funcionen los enlaces relativos incluidos en el PDF del mapa.

## Actualizar el histórico

Requiere Python 3. El portal no requiere Python para funcionar con los datos ya importados.

Desde la raíz del proyecto, importar la versión completa y actualizada del registro:

```powershell
npm run import:remedy -- "C:\ruta\Resumen_tickets.xlsx" --as-of 2026-10-26
```

Actualizar `--as-of` a la fecha de referencia de la nueva carga. La hoja predeterminada es `Resumen`; las columnas requeridas son `Incidente`, `Período` (AAAAMM) y `Módulo`. Puede elegirse otra hoja con `--sheet`. La importación reemplaza el JSON agregado; no acumula distintas versiones del mismo archivo. Para incorporar más registros, usar un Excel consolidado. La salida predeterminada es `dist/data/incidents.json`.

El ID se utiliza solamente en memoria para descontar duplicados. Si un ID está en distintos módulos que pertenecen a la misma categoría y al mismo mes, se cuenta una vez. Si aparece en meses o categorías diferentes, la importación se detiene para conciliarlo, sin reemplazar la salida anterior. Los módulos nuevos se cuentan en `Sin clasificar`; agregar su correspondencia al archivo de categorías y volver a importar cuando se haya validado su ubicación.

El JSON contiene cantidades por mes y categoría, cobertura y controles de conteo. No contiene IDs, nombres, teléfonos, correos, comentarios, descripciones de tickets, enlaces a Remedy ni rutas del archivo fuente. El Excel no se copia a `dist/`.

La carga inicial tiene 336 filas y 335 IDs distintos entre febrero y octubre de 2026. Noviembre de 2025, diciembre de 2025 y enero de 2026 se muestran sin datos, con valores `null`, no como cero. Octubre está en curso según la referencia 26/10/2026. La presencia de registros en un mes no confirma su completitud. El mes informado no se interpreta como fecha de apertura o cierre.

La clasificación sigue el módulo del registro y no acredita causa raíz ni responsabilidad integral sobre las plataformas. Varios tickets pueden estar vinculados a una misma afectación masiva. Los requerimientos y mejoras de Jira deben distinguirse de las incidencias y conciliarse por referencias antes de sumar otra fuente.

## Actualizar desarrollo y evolución

`dist/data/development.json` se mantiene a mano a partir de las Features trimestrales del proyecto Jira DWC y sus historias. Cada trimestre lista sus frentes de trabajo (una Feature cada uno) y sus hitos (historias destacadas). Los trimestres sin carga usan `hasData: false` y `null`, igual que los meses del registro de incidencias. La sección sólo muestra los trimestres con registro; los vacíos quedan en el JSON como constancia.

Criterios de clasificación (`kind`): `desarrollo` para funcionalidad nueva, `evolucion` para cambios sobre algo existente, `medicion` para etiquetado GTM nuevo o actualizado, `incidencia` para correcciones de medición y `mantenimiento` para performance y mejoras internas. El etiquetado GTM se cuenta por tag implementado (`tags`). Las correcciones de medición no se suman a las incidencias de Remedy. `service` vincula el trabajo con una ficha de `content.js` o queda en `null`.

Cada ficha de servicio muestra su trayectoria: los hitos de `development.json` con ese `service` y, si la ficha define `incidentCategory` en `content.js`, el total de incidencias de esa categoría de Remedy. La sección no se muestra cuando no hay datos o cuando el portal se abre sin servidor.

La sección "Nuestra contribución", debajo del mapa, toma sus cifras de `window.TuentiTeam` en `content.js`: commits con autor TSOFT sumados por repositorio (frontend web: 1.406, de los cuales 1.179 no son merges; app APK: 275, de 4 personas; tuenti-ui: 510, con autor o correo que contiene "tsoft"; tuenti-idp-nodejs: 62; microservicios de backend: 1.338, confirmado por el equipo de backend), definidos en cada ficha cuando corresponde, tags del inventario `utils/gtm/`, frentes de `development.json` e incidencias de `incidents.json`. Se actualizan a mano junto con cada carga. Las métricas se muestran con "+" porque son mínimos que pueden crecer. Las marcas de entregas en los nodos y los adelantos del histórico se calculan desde los JSON y sólo aparecen con el portal servido por HTTP.

## Mapa en PDF para ventas

`dist/assets/mapa-ecosistema-tuenti.pdf` es una hoja 16:9 con el mapa, lo que el equipo entregó en cada servicio y las cifras de contribución. Se genera desde `content.js`, `development.json` e `incidents.json`, así que se regenera después de cada carga:

```powershell
npm run pdf:mapa
```

Requiere Chrome o Edge instalado; si no se encuentra, definir `CHROME_PATH`. Los textos de cada servicio para ventas (qué es, qué se entregó, su criticidad para el negocio y el riesgo si el equipo no está) están en `scripts/export_map_pdf.mjs`. La criticidad (`level`: crítico, alto o medio) colorea cada servicio; el rojo se reserva para "crítico", por eso el panel de cifras usa tonos neutros, salvo el gráfico de incidencias. Los frentes de trabajo se listan por trimestre desde `development.json` (una Feature trimestral de Jira por frente, con nombres cortos en `frontLabels`), así que un frente que continúa en otro trimestre se cuenta una vez por trimestre. El PDF usa lenguaje comercial: habla de incidencias "gestionadas" (el portal dice "registradas"), resume los hitos por tipo de trabajo y explica el mes pico por su categoría dominante. `--output` cambia la ruta del PDF y `--html` guarda además el HTML intermedio. `dist/assets/mapa-tuenti.pdf` es el mapa conceptual anterior, con referencias a la propuesta.

## Propuesta de continuidad en PDF

`dist/assets/propuesta-continuidad-tuenti.pdf` es la propuesta extendida (10 hojas 16:9) que enlaza el portal. Retoma la propuesta aprobada y suma la evidencia del equipo: cifras de contribución en la portada, el mapa de ventas como página 2, la trayectoria por capacidad en el mapa de calor, "Lo que ya entregamos" en cada servicio (hitos de `development.json`), los tags entregados en GTM y una página de trayectoria con los frentes por trimestre y las incidencias por mes. Se regenera después de cada carga, junto con el mapa:

```powershell
npm run pdf:propuesta
```

Los textos de escenario, impacto y respuesta, los hitos elegidos por página y la tabla de soporte están en `scripts/export_proposal_pdf.mjs`. Las fichas del portal enlazan a sus páginas con `page` en `content.js`. `dist/assets/propuesta-tuenti.pdf` y `tsoft_tuenti_propuesta_continuidad.pdf` son la versión preliminar de 8 páginas y se conservan sin cambios.

## Clouders: portal de gestión interna

El selector **General | Tuenti | Clouders** del encabezado lleva a la vista general (`index.html`), al portal de Tuenti (`tuenti.html`, canal del cliente) y al de Clouders (`clouders.html`, gestión interna). La vista general compara los dos clientes y solo suma lo comparable (commits y servicios mapeados); cada portal conserva sus propias métricas, para que TSOFT pueda decidir sobre cada cliente por separado.

- `dist/clouders.html`, `dist/clouders.js` y `dist/clouders.css`: mapa, ficha de cada solución, evolución entre trimestres y continuidad.
- `dist/clouders-content.js`: textos de cada solución (criticidad, riesgo, escenario, respuesta), commits por repositorio y usuarios reportados. Lo leen el portal y los dos PDF.
- `dist/data/clouders-development.json`: historias de Jira por trimestre, curadas a mano, sin IDs ni datos de personas.
- `dist/assets/clouders/`: capturas de la propuesta original, recortadas para no mostrar nombres ni correos.

Criterios de carga de las historias:
- Se excluyen las historias de Tuenti (tags GTM, APK, login, ChangeUser, rueda de premios) y las subtareas de ejemplo.
- La gamificación y los referidos del portal de beneficios son de Clouders.
- En los trimestres cerrados, las historias que quedaron sin cerrar en Jira cuentan como entregadas.
- El trimestre en curso se marca con `inProgress: true`. Sus historias abiertas llevan `status: 'en curso'`: no se suman al total y se muestran aparte.

`service` vincula cada historia con una solución de `clouders-content.js`. Los frentes agrupan las historias por solución. Si dos frentes comparten solución, el frente define `id` y sus historias lo indican en `front`.

No hay registro de incidencias de Clouders. La evolución se muestra con un mapa de calor solución × trimestre, en lugar de un gráfico de totales.

Después de cada carga, regenerar el mapa y la propuesta:

```powershell
npm run pdf:clouders
npm run pdf:clouders-propuesta
```

`dist/assets/mapa-ecosistema-clouders.pdf` es la hoja 16:9 de ventas. `dist/assets/propuesta-continuidad-clouders.pdf` es la propuesta extendida de 10 páginas: amplía la propuesta preliminar de 8 páginas con el mapa, la evolución entre trimestres, "Lo que ya entregamos" en cada solución y las cifras del equipo. Las fichas del portal enlazan a sus páginas con `page` en `clouders-content.js`.

Validar los archivos de JavaScript y las reglas de importación:

```powershell
npm run check
npm run test:import
```

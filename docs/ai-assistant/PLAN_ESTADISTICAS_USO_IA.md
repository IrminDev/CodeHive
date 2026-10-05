# Plan de implementación — Estadísticas de uso del asistente de IA

Fecha de revisión: 2026-10-04. Estado: decisiones aprobadas e implementación entregada; ver [contrato y verificación](AI_USAGE_IMPLEMENTATION.md).

## 1. Objetivo y alcance

Permitir que el profesor conozca el uso de sus alumnos por grupo y asignación; que el administrador consulte consumo general y por usuario; y que el estudiante consulte su consumo total, por grupo y por asignación.

El cambio abarca backend y frontend. No cambia las reglas del asistente, sus límites, los permisos para hacer preguntas ni las condiciones de entrega. No requiere cambios en el worker, RabbitMQ o MinIO.

Separar siempre dos conceptos:

- **Uso educativo:** solicitudes registradas y respuestas entregadas que consumen cuota.
- **Consumo técnico:** llamadas al proveedor y tokens reportados, incluyendo revisiones, regeneraciones y llamadas cuyos resultados nunca se entregaron.

Una respuesta que consume una unidad de cuota puede necesitar varias llamadas al modelo. Un bloqueo o `OUTPUT_REJECTED` puede consumir tokens sin consumir cuota. No llamar «consumo de IA» a un contador de respuestas sin explicar su unidad.

## 2. Inventario real: qué aprovechar y qué falta

### Backend existente

| Pieza | Reutilización | Cambio necesario |
|---|---|---|
| `AssistantConversation` | Relaciona estudiante con asignación; asignación relaciona grupo | Ninguno para agregaciones iniciales |
| `AssistantInteraction` | Ledger con estado, `quotaCharged`, fechas, lenguaje, opt-ins, nivel completado y borrado de contenido | Instrumentación fiable de intentos; no usar campos de tokens actuales como fuente histórica |
| `AssistantInteractionRepository` | Conteo de cuota, idempotencia y purga que conserva filas | Añadir consultas agregadas mediante proyecciones |
| `AssignmentAiPolicy` | Política vigente, cuota por alumno y nivel | Leer para indicadores actuales; nunca reconstruir política histórica con su valor actual |
| `AssistantService`, `AssistantTransactionService` | Reserva, autorización, finalización y cancelación | Propagar identidad de interacción a llamadas; conservar separación entre transacciones cortas y proveedor |
| `AssistantGuardrailService` | Identifica revisión de entrada, generación, revisión de salida y revalidación | Etiquetar cada llamada y registrar intentos incluso si la interacción falla |
| `AssistantModelGateway`, `SpringAiAssistantModelGateway` | Frontera única al proveedor; respuesta Spring AI incluye `Usage` | Capturar metadatos y persistir registro por llamada; hoy gateway devuelve solo `String` |
| `GroupMetricsService`, controladores de métricas | Autorización por propiedad, DTOs, convenciones y proyecciones sobre repositorios | No reutilizar sus filtros académicos como filtros de consumo histórico |
| Administración de usuarios | Consulta paginada por usuario, `ADMIN` y scopes | Definir autorización de estadísticas globales y por usuario |

Hallazgos importantes:

1. `AssistantInteraction` ya declara `providerId`, `modelId`, `inputTokens` y `outputTokens`, pero el flujo inspeccionado no los asigna. Los tokens se escriben en logs del gateway. No hay medición persistida completa.
2. `generationAttempts` se guarda al entregar una respuesta. Un fallo después de dos generaciones puede conservar cero: no sirve hoy como contador fiable de regeneraciones fallidas.
3. Una revisión de entrada bloqueada ya implica una llamada al proveedor. También puede haber revalidaciones por cambio de política.
4. La purga de grupo conserva interacciones y sus asociaciones; permite estadísticas sin conservar texto.
5. Métricas académicas existentes excluyen ciertas tareas y alumnos según su estado actual. Copiar esos filtros haría desaparecer consumo real al salir un alumno o eliminar una tarea.
6. En el árbol revisado, servicios y repositorio usan `AssistantInteractionStatus.CANCELLED`, pero el enum actual no lo declara. Resolver esta inconsistencia antes de instrumentar o verificar el backend; no se modificó en esta planificación.

### Frontend existente

- Profesor: `TeacherAnalyticsPage`, overview, exploradores y drawer; `TeacherShell`, `TeacherUI`, APIs y tipos de métricas.
- Estudiante: `StudentMetricsPage`, APIs de métricas, sidebar/header, cuota e historial del asistente.
- Administrador: `AdminShell`, `AdminUI`, listado y detalle de usuarios, cliente autenticado y navegación por scopes.
- Dependencia `recharts` instalada. Reutilizarla; no incorporar otra librería de gráficas.
- Registro actual de rutas por features: `features/teacher/routes/routes.ts`, `features/student/routes/routes.ts`, `features/admin/routes.ts`, compuesto en `core/router/routes.ts`.

Los documentos de frontend administrativo tienen referencias antiguas a `app/pages/admin`; para cambios nuevos seguir los archivos reales en `app/features/admin`.

## 3. Decisiones aprobadas

Usuario confirmó las cinco propuestas el 2026-10-04:

1. **Costos monetarios:** no agregar dinero, precios ni estimaciones de facturación.
2. **Visibilidad docente:** conteos de bloqueos/fallos por alumno, sin contenido ni clasificación de intención.
3. **Histórico personal:** lectura del consumo propio tras terminar inscripción, archivar o eliminar lógicamente grupo.
4. **Administración:** ADMIN con `CHECK_ANALYTICS`; adicionalmente `VIEW_USERS` para identidades, filtros por usuario y detalles. Scopes efectivos existentes incluyen SUPER_ADMIN; no se conceden permisos automáticamente.
5. **Retención:** solo metadatos técnicos, mismo horizonte del ledger, con alcance limitado a eliminaciones lógicas. Eliminaciones físicas y su política de anonimización/retención quedan fuera de este cambio.

## 4. Catálogo de indicadores y definiciones

### Indicadores comunes

| Indicador | Fuente y definición |
|---|---|
| Solicitudes registradas | Número de interacciones únicas creadas; no número de POST ni lecturas/polling |
| Respuestas que consumen cuota | `count(quotaCharged = true)`; incluye redirecciones educativas entregadas |
| Respuestas educativas / redirecciones | Desglose de entregas por `COMPLETED` y `REDIRECTED` |
| Solicitudes sin respuesta | Desglose `BLOCKED`, `FAILED`, `CANCELLED`; no sumarlas a cuota |
| En curso | `PENDING`; mostrar separado de tasas sobre resultados terminales |
| Usuarios con actividad | Estudiantes distintos con al menos una interacción en el alcance |
| Usuarios con respuesta | Estudiantes distintos con al menos una respuesta cobrada |
| Llamadas iniciadas al proveedor | Registros de invocación realmente iniciada; no reservas ni rechazos locales |
| Tokens conocidos | Sumas de valores reportados; entrada, salida y total separados |
| Cobertura de medición | Llamadas con metadatos completos / llamadas iniciadas, más resultados inciertos e interacciones históricas sin instrumentación |
| Regeneraciones | Interacciones con segunda generación realmente iniciada; las revisiones no son generaciones |
| Latencia educativa | `completedAt - createdAt` para entregas válidas; promedio y número de muestras |
| Latencia del proveedor | Duración por llamada terminada con medición; distinta de la espera de UI |
| Uso por nivel | Nivel de entrega `completedAssistanceLevel`; nivel solicitado solo cuando se haya capturado como snapshot |
| Opt-ins | Conteos de consentimiento solicitado para código y ejecución; no confundir con contexto efectivamente encontrado/enviado |

No sumar tokens de llamadas e interacciones en el mismo total. No convertir `null` en cero. Si un proveedor reporta categorías adicionales, preservar lo disponible sin afirmar que entrada + salida representa necesariamente todos los tokens facturables.

### Profesor

- Grupo: respuestas consumidas, solicitudes, alumnos con actividad y serie temporal.
- Tabla por asignación: título, política actual, respuestas consumidas, alumnos con actividad, solicitudes sin respuesta y regeneraciones.
- Detalle de asignación: tabla por alumno con solicitudes, cuota usada de por vida, cuota máxima actual, remanente disponible y última actividad. Fallos/bloqueos según decisión 2.
- Grupo: tabla por alumno agregando sus asignaciones, con navegación al detalle.
- Incluir alumnos históricos con consumo aunque ya no estén activos; distinguirlos del padrón actual.
- No incluir prompts, respuestas, código, diagnósticos, huellas de solicitud ni secretos del proveedor.
- No inferir dependencia, fraude o aprendizaje a partir de frecuencia de uso. No convertir automáticamente métricas de IA en calificación.

### Administrador

- Consumo general: solicitudes, respuestas, llamadas, tokens conocidos, cobertura y tendencia.
- Tabla paginada por usuario; búsqueda compatible con administración existente, última actividad y navegación al detalle.
- Usuario: desglose por grupo/asignación y tendencia; es el solicitante de IA, no el propietario del grupo.
- Desglose técnico por proveedor, modelo y etapa; llamadas fallidas, timeouts y resultados inciertos.
- Separar fallos de proveedor, rechazo de salida, bloqueo de entrada y cancelación de política; son fenómenos distintos.

### Estudiante

- Total propio: respuestas consumidas, preguntas registradas, tendencia y grupos con actividad.
- Tabla por grupo y detalle por asignación; acceso al historial propio cuando sea permitido.
- Cuota únicamente por asignación: no existe cuota global del estudiante ni bolsa de respuestas por grupo.
- Tokens en sección técnica secundaria con explicación de cobertura; no presentarlos como dinero ni como sanción.
- Lenguaje visible amigable: «Respuestas utilizadas», «Preguntas sin respuesta», «En curso». Códigos internos quedan fuera de la vista cotidiana.

### Cuota y tiempo

- No hay reinicios de cuota. Filtro de fechas nunca cambia el contador de por vida ni el remanente.
- Por fila de alumno/asignación: `usedLifetime` desde ledger; `maximumCurrent` desde política; `pendingReservations` desde interacciones en curso; `remainingNow = max(0, maximumCurrent - usedLifetime - pendingReservations)`.
- Política deshabilitada tiene máximo cero: conservar uso histórico; no mostrar porcentaje infinito ni consumo negativo.
- Si máximo actual es menor que uso histórico, mostrar «Límite actual reducido» sin truncar uso histórico.
- Remanente no garantiza permiso para pedir ayuda: tarea cerrada, grupo archivado u otra restricción puede impedirlo. Mantener `canRequest`/motivo como dato separado, sin duplicar reglas de elegibilidad.
- Inicialmente no mostrar «porcentaje de cuota de todo el grupo»: requiere denominador histórico que hoy no existe. Uso y máximo actual por alumno son suficientes.
- Fechas: instantes UTC, intervalo `[from, to)`, sin usar timezone del servidor para convertirlos. Frontend convierte selección de fechas a instantes y explica zona usada.
- Solicitudes/estados se agrupan por `interaction.createdAt`; llamadas/tokens por inicio de llamada. Una llamada de una solicitud anterior puede caer dentro de un nuevo período. Son cohortes diferentes y deben etiquetarse.
- Estado puede cambiar después de crear una interacción. Este reporte muestra estado actual de solicitudes iniciadas en período, no un log de transiciones históricas.

## 5. Arquitectura recomendada

Mantener dos fuentes normalizadas:

1. `assistant_interactions`: verdad de solicitudes, entregas y cuota; ya existe.
2. `assistant_model_calls`: nueva verdad de invocaciones y medición del proveedor.

Agregar `AssistantUsageService` de solo lectura y repositorios con proyecciones agregadas. Controladores por audiencia aplican autorización antes de ejecutar agregaciones. Frontend consume DTOs por alcance, nunca descarga historiales completos para sumar localmente.

No introducir ahora almacén analítico, nuevas colas, event sourcing ni tablas de acumulados diarios. SQL sobre PostgreSQL con índices y paginación es suficiente para empezar. Considerar rollups solo si las mediciones reales de consultas lo justifican.

No agregar estos cálculos al servicio de generación ni inflar `GroupMetricsService` con consumo técnico. Reutilizar sus convenciones y controles de propiedad, no mezclar dominios académicos e instrumentación.

## 6. Modelo y captura nuevos

### `AssistantModelCall`

Entidad nueva con UUID y relación obligatoria a `AssistantInteraction`:

- `id`, `interaction_id`, `callOrdinal` único dentro de interacción.
- `stage`: `INPUT_REVIEW`, `ANSWER_GENERATION`, `OUTPUT_REVIEW`, `POLICY_REVALIDATION`.
- `generationAttempt`: 1/2 para generación/revisión asociada; nulo si no aplica.
- `providerId`, `configuredModelId`, `reportedModelId` cuando exista, versión de prompt.
- `startedAt`, `finishedAt`, duración medida con reloj monotónico.
- Estado técnico: iniciado, exitoso, fallido o resultado desconocido; código seguro, nunca mensaje crudo del proveedor.
- `callerTimedOutAt`/marca de interrupción separada del resultado de proveedor. Timeout de espera no demuestra que el proveedor no completó ni facturó.
- `inputTokens`, `outputTokens`, `totalTokens`: `Long` anulables; no negativos.
- `usageSource` y disponibilidad de medición. Respuesta ausente o metadatos ausentes no equivalen a cero.

No almacenar prompt, instrucciones, contexto, código, texto generado, cuerpos HTTP ni API keys en esta tabla. No duplicar `studentId`/`groupId`/`assignmentId` inicialmente: obtenerlos por asociaciones existentes para evitar inconsistencias.

Conservar columnas existentes de tokens en `AssistantInteraction` por compatibilidad inicial, pero no alimentarlas ni consultarlas como segunda verdad. Documentar su desuso; decidir su eliminación en limpieza posterior, sin mezclarla con primera entrega.

### Snapshot mínimo en interacción

- Agregar `requestedAssistanceLevel` al reservar. Existe versión solicitada, pero versión sola no permite reconstruir nivel porque no hay historial de todas las políticas.
- Registrar intentos de generación realmente iniciados o derivarlos del ledger de llamadas. Usar una única definición; corregir el campo existente si se mantiene.
- Conservar flags de opt-in como intención. Si se pide métrica de contexto efectivo, capturar flags separados de contenido efectivamente enviado; no deducirlo de la selección del checkbox.

### Cambios de gateway y guardrails

1. Propagar contexto explícito `interactionId`, etapa, intento y versión de prompt. No usar variables globales ni ThreadLocal: gateway usa executor.
2. Evolucionar contrato de gateway hacia resultado estructurado con texto no confiable y metadatos; adaptar dobles de prueba y llamadas existentes.
3. Guardrails etiqueta cada llamada; el texto continúa por los mismos controles y nunca se publica desde instrumentación.
4. Servicio de registro dedicado escribe inicio/resultado con transacciones cortas independientes. Ninguna transacción de cuota permanece abierta durante `ChatModel.call`.
5. Registrar inicio dentro del trabajo admitido, antes de invocar al proveedor. `MODEL_BUSY`, proveedor no configurado o presupuesto local agotado antes de invocación no cuentan como llamada iniciada.
6. Si no puede persistirse registro inicial, no iniciar llamada: evita consumo deliberadamente invisible. Mapear fallo de instrumentación a error seguro sin cobrar cuota.
7. Registrar respuesta y tokens antes de parsing/validación educativa; un JSON rechazado también consumió recursos.
8. Si se agota espera, marcar timeout del solicitante; una respuesta tardía puede completar metadatos de llamada, pero nunca entregar texto ni cobrar una interacción cancelada.
9. Finalización por `callId` idempotente; no duplicar filas ni tokens por retries de escritura. Evitar que timeout posterior sobrescriba éxito ya persistido.
10. Si proceso cae, conservar llamada iniciada y marcar resultado incierto tras ventana segura. Recuperación de metadatos no equivale a recuperación de respuesta educativa ni permite nueva entrega.
11. Si escritura final falla, reportar incidencia operacional sin datos sensibles; fila inicial queda para conciliación. No afirmar consumo exacto ni reenviar llamada para recuperar métricas.

La configuración inspeccionada tiene `spring.ai.retry.max-attempts=1`. Conservar esa frontera de medición. Si se habilitan retries internos del SDK, instrumentar cada intento o declarar que un registro puede envolver varios intentos HTTP; no prometer contador exacto de requests del proveedor sin esa adaptación.

Una solicitud normal suele hacer revisión de entrada, generación y revisión de salida. Una regeneración añade otra generación y posiblemente revisión. Revalidación de política añade llamadas adicionales. No hardcodear «tres llamadas por respuesta».

## 7. Consultas, persistencia y rendimiento

### Repositorios

- `AssistantUsageRepository`: proyecciones de interacciones por alcance, estados, alumno, grupo, asignación y período.
- `AssistantModelCallRepository`: persistencia y proyecciones técnicas por alcance, modelo, etapa y fecha.
- Implementación custom con `EntityManager`/SQL cuando agregaciones o filtros no sean cómodos en JPQL; seguir convenciones de proyecciones existentes, sin añadir framework analítico.
- Agregar primero cada fuente a su grano y unir resultados después. Un join directo interacción × llamadas multiplicaría solicitudes/cuota.
- Tablas por alumno/asignación con cero uso: partir del padrón/asignaciones visibles y combinar resultados; incluir además antiguos participantes con actividad. Definir unión sin duplicar reingresos.
- Totales generales incluyen consumo histórico de tareas/grupos eliminados lógicamente; filtros de estado se aplican solo si usuario los pide y se reflejan en respuesta.
- Totales no dependen de página actual ni de búsquedas sobre etiquetas, salvo cuando contrato declare expresamente «total filtrado».

### Índices propuestos, sujetos a `EXPLAIN ANALYZE`

- Interacciones: `(conversation_id, created_at)`; índice por fecha global si consulta administrativa lo necesita.
- Conversaciones: `(student_id, assignment_id)`; conservar unicidad existente `(assignment_id, student_id)`.
- Llamadas: único `(interaction_id, call_ordinal)`; `(interaction_id, started_at)` y `started_at` para serie general.
- Verificar índices reales sobre asignación/grupo y agregar solo los faltantes útiles. No crear un índice por cada filtro.
- Checks de tokens no negativos, duración no negativa y estados válidos.

### Semántica de respuesta

- `generatedAt`, filtros efectivos y comienzo de instrumentación como metadatos.
- Contadores `long`, tasas `BigDecimal` con dos decimales; cero real separado de ausencia de medición.
- Tokens: `knownInputTokens`, `knownOutputTokens`, `knownTotalTokens`, cobertura y cantidad desconocida. Si no hay medición, valores nulos; si mezcla datos, mostrar «medidos parcialmente».
- Histórico sin registros por llamada: solicitudes/cuota sí disponibles; tokens y llamadas no reconstruibles. Nunca crear llamadas ficticias a partir de `generationAttempts` ni extrapolar costos.
- Paginación `page`, `size` máximo 100, orden estable con UUID como desempate; columnas de orden permitidas explícitamente.
- Series iniciales diarias UTC; rango máximo propuesto 366 días. Resumen de por vida usa endpoint agregado, sin generar miles de puntos. Validar límites y rango invertido con 400.
- Consultas sin efectos secundarios: no invocar recuperación de leases ni escribir metadatos durante GET.
- No prometer snapshot perfecto entre varios endpoints: cada respuesta incluye su hora; permitir actualizar. Si un DTO necesita consistencia interna estricta, usar snapshot transaccional de lectura, no locks de cuota.

### Esquema en desarrollo

Agregar tabla, columnas e índices mediante SQL de desarrollo documentado y verificable; usuario indicó que no necesita Flyway en esta fase. No es necesario borrar base para este cambio aditivo. No ejecutar borrado ni reset como parte de implementación de estadísticas. Crear script nuevo en carpeta del asistente; el anterior `docs/AI_ASSISTANT_DEV_SCHEMA.sql` está eliminado en árbol actual.

## 8. API propuesta

Todos endpoints GET, UUID, `SuccessResponse<T>` y errores existentes. Contratos nuevos aditivos; no cambiar DTOs de métricas académicas obligatoriamente.

| Audiencia | Ruta propuesta | Datos |
|---|---|---|
| Profesor | `/api/groups/{groupId}/assistant-usage` | Resumen y tendencia del grupo |
| Profesor | `/api/groups/{groupId}/assistant-usage/assignments` | Tabla paginada por asignación |
| Profesor | `/api/groups/{groupId}/assistant-usage/students` | Tabla paginada por alumno |
| Profesor | `/api/assignments/{assignmentId}/assistant-usage` | Resumen, política actual y tendencia |
| Profesor | `/api/assignments/{assignmentId}/assistant-usage/students` | Uso por alumno y cuota de por vida |
| Estudiante | `/api/assistant-usage/me` | Total personal y tendencia |
| Estudiante | `/api/assistant-usage/me/groups` | Tabla paginada por grupo |
| Estudiante | `/api/assistant-usage/me/groups/{groupId}` | Resumen personal de grupo |
| Estudiante | `/api/assistant-usage/me/groups/{groupId}/assignments` | Desglose personal por asignación |
| Administrador | `/api/admin/assistant-usage` | Resumen general y tendencia |
| Administrador | `/api/admin/assistant-usage/users` | Tabla paginada por usuario |
| Administrador | `/api/admin/users/{userId}/assistant-usage` | Resumen y tendencia de usuario |
| Administrador | `/api/admin/users/{userId}/assistant-usage/groups` | Desglose paginado por grupo |
| Administrador | `/api/admin/users/{userId}/assistant-usage/groups/{groupId}/assignments` | Desglose paginado por asignación |
| Administrador | `/api/admin/assistant-usage/models` | Totales por proveedor/modelo/etapa |

Filtros comunes: `from`, `to`; tablas admiten búsqueda, paginación y orden documentados. Administración puede filtrar `userId`, `groupId`, `assignmentId`, proveedor y modelo según endpoint. No aceptar dimensiones arbitrarias ni construir SQL desde nombres enviados por cliente.

Mantener DTOs de resumen/serie/desglose compartidos cuando su semántica sea idéntica; DTO docente, personal y administrativo limitan campos por audiencia. El resumen de cuota de por vida queda separado del bloque de estadísticas filtradas por fecha.

### Autorización

- Identidad del solicitante desde principal autenticado; endpoints `me` nunca reciben studentId.
- Profesor: propiedad del grupo, siguiendo métricas existentes; una autoridad de rol no sustituye propiedad.
- Estudiante: `STUDENT`, siempre filtrar por su identidad antes de agregar. Decisión 3 determina acceso histórico; no reutilizar validación de inscripción activa inadvertidamente.
- Administrador: `ADMIN` más scope aprobado. Consulta por usuario exige además permiso para consultar identidades. No conceder acceso global a profesores por reutilizar un scope sin comprobar rol.
- Un filtro de grupo/asignación nunca amplía alcance autorizado. Cruzar IDs de grupos o alumnos debe denegarse, no filtrar solo después de cargar resultados.
- Archivado/deshabilitado impide ayuda nueva, no necesariamente lectura de estadísticas. GET no depende de `ASSISTANT_ENABLED`.
- Estadísticas no permiten consultar conversaciones ajenas. Códigos técnicos se agrupan en categorías seguras; sin texto sensible.

## 9. Frontend: cambios concretos

### Compartido

Crear módulo pequeño `features/assistant-usage` con tipos de estadísticas, componentes presentacionales de resumen, rango, tendencia y cobertura. Clientes por rol reutilizan clientes autenticados existentes; no mover todos los servicios actuales para homogeneizarlos.

- Recharts con leyenda, unidad y tabla/resumen textual accesible; no depender solo de colores.
- Estados loading, vacío, error, retry y datos parciales.
- Filtros relevantes en URL; solicitudes obsoletas se ignoran/cancelan cuando cambia alcance.
- Botón Actualizar, sin polling continuo de estadísticas. Tras pregunta completada, refrescar resumen personal visible; polling actual del asistente no cuenta como uso.
- Etiquetas en idioma de UI existente; documentos en español no implican traducir aplicación completa.

### Profesor

1. Agregar sección/pestaña «Uso de IA» dentro de `/teacher/analytics`; preservar exploradores académicos actuales.
2. Mantener selección de grupo y agregar rango temporal independiente.
3. Resumen compacto, tendencia y tablas «Asignaciones»/«Alumnos».
4. Al seleccionar asignación, abrir detalle con política actual y consumo por alumno. Mostrar consumo de por vida separado de preguntas dentro del rango.
5. En grupo y gestión de asignación, añadir enlace contextual con `groupId`/`assignmentId` a sección IA; no duplicar tablero completo.
6. Si selector existente no ofrece grupos eliminados lógicamente, usar listado autorizado compatible para vista histórica. No ocultar datos existentes por limitaciones del selector.

### Estudiante

1. Página nueva `/ai-usage` con total personal y grupos; enlace «Mi uso de IA» en `StudentSidebar`.
2. Detalle por grupo dentro de misma página con `groupId` en URL y desglose por asignación.
3. En `StudentMetricsPage`, bloque breve y enlace contextual a consumo IA. Esa página sigue con reglas académicas actuales.
4. Vista global IA no depende de `getGroup` ni de endpoints de métricas que exigen inscripción activa; usar respuestas propias para nombres/metadatos históricos según decisión 3.
5. Cuota actual e historial siguen en panel del asistente; agregar enlace a estadísticas sin mostrar tokens en composer.
6. Explicar que redirecciones educativas consumen respuesta y preguntas sin respuesta no consumen cuota, aunque puedan generar trabajo técnico.

### Administrador

1. Página nueva `/admin/ai-usage`; usar `AdminShell`/`AdminUI`, no construir layout alternativo.
2. Añadir navegación según scope aprobado; frontend oculta enlaces, backend valida acceso.
3. Resumen general, tendencia, tabla por usuario y sección técnica por modelo/etapa.
4. En `AdminUserDetailPage`, pestaña/sección «Uso de IA» enlazada a consumo personal administrado; tabla por grupo y asignación.
5. Paginación y búsqueda en servidor. No descargar todos usuarios ni agrupar en navegador.
6. Avisos de medición parcial visibles: «Tokens conocidos», fecha de inicio de medición y resultados inciertos. No mostrar cero como si no hubo consumo.

## 10. Archivos y responsabilidades previstas

Backend:

- Nuevos: entidad/enum `AssistantModelCall`, repositorio de llamadas, repositorio de agregaciones y DTOs bajo `model/dto/assistant/usage`.
- Nuevo servicio de registro bajo `service/assistant`; `AssistantUsageService` de lectura y política de acceso reutilizando repositorios/autorización actuales.
- Nuevos controladores de consumo docente, personal y administrativo, delgados y separados de solicitudes de generación.
- Modificar gateway/interface, guardrails y orquestación para transportar contexto y metadatos; adaptar tests/fakes existentes.
- Modificar reserva solo para snapshots/contadores necesarios; purga conserva registros nuevos y no incorpora contextos.
- Completar documentación de esquema dev y contrato en `llms/backend/metrics` y `llms/backend/service`.

Frontend:

- Nuevos componentes/tipos presentacionales compartidos en `features/assistant-usage`.
- APIs y tipos de consumo por rol, reutilizando clientes existentes.
- Nueva vista personal y administrativa con route modules delgados.
- Modificar analytics docente, detalle administrativo, sidebar/shell, registro de rutas y enlaces contextuales.
- Actualizar documentación de rutas, servicios y features bajo `llms/frontend`.

No modificar ejecución sandbox, calificaciones ni reglas de cuota para habilitar estadísticas.

## 11. Pruebas y aceptación

### Backend

- Autorización: propietario/no propietario, estudiante propio/ajeno, administrador con/sin scope; IDs cruzados y filtros no amplían alcance.
- Conteos: una interacción con varias llamadas sigue siendo una solicitud; replay del mismo `clientRequestId` y polling no duplican uso.
- Cuota: completada/redirección cobran; bloqueada/fallida/cancelada no; rango temporal no cambia remanente de por vida.
- Instrumentación: revisión, primera/segunda generación, salida rechazada, revalidación de política, bloqueo de entrada, vacío, 429, fallo local antes de llamada y timeout.
- Carrera timeout/respuesta tardía: ledger técnico puede completarse; interacción cancelada no se entrega ni se cobra.
- Persistencia: fallo al iniciar impide llamada; fallo al finalizar conserva registro incierto; reintento de escritura no duplica tokens.
- Tokens ausentes, cero reportado, total distinto de suma, modelo ausente y valores mayores que entero de 32 bits.
- Purga/archivo/eliminación lógica/reingreso: sin texto y sin pérdida de consumo; anteriores alumnos permanecen en histórico autorizado.
- Datos previos sin instrumentación: no mostrar cero ni inventar llamadas; cuota histórica sigue correcta.
- Fechas en límites `[from,to)`, medianoche UTC, rango inválido, paginación/orden estable y sumas entre grupos.
- Consultas PostgreSQL sobre fixture determinista: fan-out, joins, índices y concurrencia. Usar UUID fijos según normas del proyecto.

### Frontend

- Carga, vacío, error, cobertura parcial y tokens desconocidos.
- Cambio de grupo/rango no muestra respuesta obsoleta; filtros quedan en URL.
- Vistas por rol/scopes y manejo de 403 sin exponer datos previos de otra sesión.
- Cuota reducida/deshabilitada, consumo histórico y no existencia de cuota global.
- Navegación grupo → asignación → historial propio, drawer docente y detalle administrativo.
- Gráficas legibles en móvil, teclado, tema oscuro y alternativa textual.

### Criterios de salida

1. Profesor obtiene uso real por grupo/asignación y alumnos autorizados sin contenido conversacional.
2. Administrador ve total y consumo por usuario, con cobertura explícita y sin datos técnicos sensibles.
3. Estudiante ve solo consumo propio y cuota por asignación, con alcance histórico aprobado.
4. Consumo fallido se mide sin cambiar qué consume cuota.
5. Ninguna estadística dispara llamadas a IA ni exige worker.
6. Tests relevantes, `./gradlew test`, tareas PostgreSQL específicas, `npm run test`, `npm run typecheck` y `npm run build` pasan en entorno configurado.
7. Consultas se verifican con `EXPLAIN ANALYZE` y datos representativos; fijar objetivo de latencia tras medir, no inventar SLA.

## 12. Etapas de implementación recomendadas

### Etapa 0 — Cerrar contrato y verificar base

- Confirmar decisiones de sección 3 y nombres/unidades del catálogo.
- Resolver inconsistencia `CANCELLED`; ejecutar pruebas base del asistente.
- Revisar scopes, esquema real e índices; fijar DTOs y filtros.
- Salida: contrato aprobado y baseline verificable, sin cambios funcionales de cuota.

### Etapa 1 — Instrumentación técnica y esquema

- Crear registro por llamada, índices/checks y snapshot de nivel solicitado.
- Adaptar gateway/guardrails/orquestación y sus pruebas.
- Implementar registro idempotente, timeout/late result y recuperación de llamadas inciertas sin reenvío al proveedor.
- Salida: toda llamada nueva queda asociada y medible; fallos se conservan; texto no se persiste en telemetría.

### Etapa 2 — Consultas y APIs

- Implementar proyecciones, servicio de lectura, permisos y endpoints por audiencia.
- Primero cuota/solicitudes, luego llamadas/tokens/cobertura; mismas definiciones para todos roles.
- Probar joins, histórico, rangos, paginación y carga representativa.
- Salida: contratos seguros y correctos sin frontend nuevo.

### Etapa 3 — Profesor y estudiante

- Componentes reutilizables, sección docente, página personal y enlaces.
- Pruebas de interacción y accesibilidad; verificar navegación histórica aprobada.
- Salida: uso educativo visible sin confundir filtros con cuota.

### Etapa 4 — Administración

- Tablero global, tabla por usuario, detalle y breakdown técnico.
- Alcance por scopes, cobertura y datos desconocidos visibles.
- Salida: consumo técnico trazable sin presentar estimaciones como facturación.

### Etapa 5 — Verificación y entrega

- Pruebas completas y prueba manual con usuarios sintéticos de tres roles.
- Verificar archivo de grupo y cambios de política mientras request está pendiente.
- Documentar inicio de medición, límites históricos y SQL dev; actualizar grafo mediante `graphify update .` tras cambios de código.
- No reiniciar historial ni cuota; no habilitar automáticamente permisos administrativos nuevos.

No hace falta esperar a medir tokens para mostrar solicitudes/cuota históricas; sí hace falta instrumentación antes de prometer consumo técnico. Entregar ambas capas separadas permite avance sin inventar datos.

## 13. Fuentes revisadas

- [Guía de métricas existentes](../../llms/backend/metrics/README.md).
- [AssistantInteraction](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssistantInteraction.java), [AssistantConversation](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssistantConversation.java) y [AssignmentAiPolicy](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssignmentAiPolicy.java).
- [Repositorio del ledger](../../codehive-backend/src/main/java/com/github/codehive/repository/AssistantInteractionRepository.java).
- [Gateway](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/SpringAiAssistantModelGateway.java), [guardrails](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantGuardrailService.java), [orquestación](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantService.java) y [transacciones](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java).
- [Métricas académicas](../../codehive-backend/src/main/java/com/github/codehive/service/GroupMetricsService.java), [administración de usuarios](../../codehive-backend/src/main/java/com/github/codehive/controller/AdminUserController.java) y [scopes](../../codehive-backend/src/main/java/com/github/codehive/model/enums/Scope.java).
- [Analytics docente](../../codehive-frontend/app/features/teacher/pages/TeacherAnalyticsPage.tsx), [métricas personales](../../codehive-frontend/app/features/student/pages/StudentMetricsPage.tsx), [shell administrativo](../../codehive-frontend/app/features/admin/components/AdminShell.tsx) y [rutas centrales](../../codehive-frontend/app/core/router/routes.ts).

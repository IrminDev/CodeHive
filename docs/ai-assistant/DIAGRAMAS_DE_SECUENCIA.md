# Asistente educativo de IA: especificaciones de diagramas de secuencia

## Propósito

Este documento describe cinco diagramas de secuencia de CodeHive e identifica, para
cada mensaje, su origen, destino, operación, parámetros, resultado y tipo de
sincronización. Sigue la estructura de
[SEQUENCE_DIAGRAM_FLOWS.md](../diagrams/SEQUENCE_DIAGRAM_FLOWS.md) y conserva los
identificadores DS-01 a DS-05.

Revisión: **10 de octubre de 2026**. Las operaciones se contrastaron con el código
actual del backend y del frontend. Relacionar cada secuencia con los
[requerimientos funcionales](REQUERIMIENTOS_FUNCIONALES.md) y las
[reglas de negocio](REGLAS_DE_NEGOCIO_Y_RESTRICCIONES.md).

## Notación compartida

| Notación | Significado |
|---|---|
| `->` | Llamada síncrona; el emisor espera el resultado. |
| `-->` | Mensaje de retorno. |
| `->>` | Evento asíncrono; no implica una respuesta inmediata al emisor. |
| `alt` | Caminos mutuamente excluyentes según una condición. |
| `opt` | Interacción opcional. |
| `loop` | Interacción repetida con una condición y un límite explícitos. |
| `par` | Interacciones concurrentes; no establece un orden entre sus ramas. |
| `ref` | Referencia a otra secuencia o fragmento ya definido. |

Reglas comunes:

- Cada petición HTTP lleva `Authorization: Bearer <JWT>`. Spring Security construye
  `Authentication`; los controladores pasan `authentication.getName()` como `email`.
  La identidad del estudiante se obtiene del usuario autenticado, no del payload.
- Los cuerpos exitosos usan `SuccessResponse<T>` con `success`, `message` y `data`.
  Los errores se traducen mediante `GlobalExceptionHandler`; no continúan por el
  camino exitoso del diagrama.
- Los identificadores de entidades y `clientRequestId` son UUID. Las marcas de
  tiempo del backend son `Instant`.
- Las llamadas HTTP, entre servicios y a repositorios se representan como síncronas.
  El gateway espera el resultado del proveedor con un timeout, aunque utilice un
  executor internamente. La respuesta educativa no se procesa mediante RabbitMQ.
- La línea de vida `PostgreSQL` agrupa repositorios y persistencia JPA. Mantener los
  nombres de métodos en los mensajes; separar repositorios solo si aporta claridad.
- `AssistantService` coordina llamadas sin envolver todo el flujo en una transacción.
  `reserve()`, `markContext()`, `eligibleForModel(interactionId, policyVersion)`,
  `deliver()` y `stop()` tienen transacciones separadas. Las llamadas al proveedor
  quedan fuera de ellas.
- Una reserva `PENDING` no es una respuesta consumida. Solo una entrega aprobada
  guarda la respuesta y `quotaCharged = true` en la misma transacción.
- `200 OK` puede representar una interacción terminada, incluso bloqueada o un
  resultado previo fallido. `202 Accepted` representa una solicitud coincidente
  que sigue pendiente; no indica que se haya publicado un trabajo en una cola.

Participantes recomendados, de izquierda a derecha:

`Actor` | `Frontend/hook` | `Spring Security` | `Controller` | `Servicio coordinador` |
`Servicios de dominio` | `PostgreSQL` | `MinIO` | `Gateway de IA` | `Gemini`.

Agregar únicamente los participantes usados por cada secuencia. El gateway de
producción es `SpringAiAssistantModelGateway`, detrás de `AssistantModelGateway`.
Gemini representa el proveedor configurado; el arranque puede no tener un modelo
habilitado.

---

## DS-01. Solicitar y entregar orientación educativa

### Objetivo y precondiciones

El estudiante solicita orientación y recibe únicamente una respuesta validada y
persistida con su consumo. Corresponde a **RF-06, RF-07, RF-08 y RF-09**.

Para una solicitud nueva, el servicio global y la política de la asignación deben
estar habilitados. El estudiante debe conservar acceso válido, elegir un lenguaje
permitido y disponer de cuota; no puede tener otra pregunta pendiente en la misma
conversación. El frontend exige aceptar el aviso de envío de datos antes de enviar.
Los adjuntos de código y ejecución requieren selecciones independientes.

### Participantes

`Estudiante`, `Interfaz/useAssignmentAssistant`, `AssistantController`,
`AssistantService`, `AssistantTransactionService`, `AssistantContextService`,
`AssistantGuardrailService`, `AssistantHistoryService`, `PostgreSQL`, `MinIO`,
`SpringAiAssistantModelGateway`, `Gemini`.

### Fase HTTP, reserva y contexto

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Estudiante | Interfaz/useAssignmentAssistant | “Ask assistant” / `submit(...)` | Pregunta, lenguaje, código actual y selecciones de contexto | Crea `clientRequestId`, conserva el payload en memoria y muestra la pregunta en espera. |
| 2 | `->` | Interfaz/useAssignmentAssistant | AssistantController | `POST /api/assignments/{assignmentId}/assistant/interactions` / `ask(assignmentId, request, authentication)` | `AssistantMessageRequest`; JWT | Validación del cuerpo, autoridad `STUDENT` y límite de 10 solicitudes por 60 segundos. |
| 3 | `->` | AssistantController | AssistantService | `ask(assignmentId, request, email)` | UUID de asignación, solicitud y correo autenticado | Resuelve el estudiante y comprueba el interruptor global. |
| 4 | `->` | AssistantService | AssistantTransactionService | `reserve(new Request(...))` | Asignación, estudiante, `clientRequestId`, pregunta, lenguaje y selecciones | Inicia una transacción corta de reserva. |
| 5 | `->` | AssistantTransactionService | PostgreSQL | Bloqueo de grupo/conversación; búsqueda por `clientRequestId`; validación de elegibilidad, política y cuota | IDs autenticados y huella del payload | Una solicitud coincidente deriva a DS-03. Para una nueva, guarda pregunta `PENDING` con reserva de tres minutos; no cobra cuota. |
| 6 | `-->` | AssistantTransactionService | AssistantService | `Reservation` | `interactionId`, `conversationId`, estado, `replay`, consumo, máximo y versión | Confirma la transacción de reserva antes del trabajo con el modelo. |
| 7 | `->` | AssistantService | AssistantTransactionService | `policySnapshot(assignmentId)` | UUID de asignación | Lee habilitación, máximo, nivel y versión vigentes. El coordinador exige política habilitada y versión igual a `Reservation.policyVersion`; de lo contrario cancela antes de construir contexto. |
| 8 | `->` | AssistantService | AssistantContextService | `build(assignmentId, studentId, conversationId, includeEditorCode, editorCode, includeExecutionContext, level)` | IDs, selecciones y nivel vigente | Construye una proyección acotada del contexto. |
| 9 | `->` | AssistantContextService | PostgreSQL | Leer asignación pública, historial permitido y, opcionalmente, `findLatestStudentInitiated(...)` | Asignación, estudiante, conversación y nivel | Excluye contexto ajeno, textos borrados y respuestas de niveles más permisivos. |
| 10 | `->` | AssistantContextService | MinIO | `download(reportKey)` en `opt ejecución seleccionada y artefactos vigentes` | Clave del reporte de la última ejecución apta | Lee diagnóstico permitido y acotado. Si el reporte falta o expiró, conserva la proyección disponible sin inventar resultados. |
| 11 | `-->` | AssistantContextService | AssistantService | `Context` | Asignación pública, código autorizado, ejecución e historial | Incluye indicadores de ejecución no disponible e historial truncado. |
| 12 | `->` | AssistantService | AssistantTransactionService | `markContext(interactionId, executionId)` | ID de interacción e ID de ejecución o `null` | Conserva el identificador seleccionado si sigue pendiente, con reserva vigente, acceso, política habilitada y cuota. Si devuelve `false`, el coordinador detiene el flujo. |

`AssistantMessageRequest`:

| Campo | Tipo o restricción |
|---|---|
| `clientRequestId` | UUID obligatorio; reutilizarlo únicamente con el mismo contenido. |
| `message` | Texto obligatorio, no vacío, máximo 2 000 caracteres. |
| `language` | Enum `Language` obligatorio; debe estar permitido por la asignación. |
| `includeEditorCode` | Selección independiente para compartir código del editor. |
| `editorCode` | Código requerido cuando se selecciona compartirlo; máximo 32 768 caracteres. Omitirlo cuando no se comparte. |
| `includeExecutionContext` | Selección independiente para incluir la última ejecución apta propia. No acepta un ID de ejecución elegido por el cliente. |

### Fase de revisión, generación y entrega

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 13 | `->` | AssistantService | AssistantService | Crear `AssistantModelCallBudget` y `beforeModelCall` | Límite de cinco; ID y versión de política reservada | Un contador nuevo para esta interacción, compartido por todas las etapas y ambos intentos de generación. |
| 14 | `->` | AssistantService | AssistantGuardrailService | `generate(context, message, level, beforeModelCall, interactionId)` | Contexto, pregunta, nivel, callback e ID | Valida la entrada local e inicia clasificación y generación protegida. |
| 15 | `->` | AssistantGuardrailService | AssistantService | `beforeModelCall.run()` | ID y versión capturados | Ejecuta los mensajes 16 y 17 antes de cada invocación al gateway. |
| 16 | `->` | AssistantService | AssistantTransactionService | `eligibleForModel(interactionId, policyVersion)` | Versión de `Reservation` | Bajo bloqueo, comprueba pendiente, reserva, acceso, versión, habilitación y cuota. Si no es elegible o cambió la política, detiene el flujo. |
| 17 | `->` | AssistantService | AssistantService | `callBudget.run()` | Contador compartido | Cuenta la invocación permitida; impide superar cinco antes de entrar al gateway. No consume cuota educativa. |
| 18 | `->` | AssistantGuardrailService | SpringAiAssistantModelGateway | `complete(callContext, systemInstruction, payload)` | Etapa `INPUT_REVIEW`, ID y versión del prompt | Solicita clasificación `ALLOW`, `REDIRECT` o `BLOCK`. |
| 19 | `->` | SpringAiAssistantModelGateway | Gemini | `ChatModel.call(Prompt)` mediante Spring AI | Instrucciones, payload y opciones JSON con esquema de la etapa | Una petición, sin reintentos automáticos; el gateway espera dentro del timeout configurado. Aplicar este mensaje a cada etapa. |
| 20 | `-->` | Gemini / SpringAiAssistantModelGateway | AssistantGuardrailService | Resultado de revisión de entrada | Texto estructurado; metadatos técnicos cuando existen | Una entrada bloqueada termina por el fragmento alterno; las demás continúan. |
| 21 | `->` | AssistantGuardrailService | SpringAiAssistantModelGateway | `complete(...)` en `loop attempt = 1..2` | Etapa `ANSWER_GENERATION`, intento, contexto y nivel | Repite el callback de los mensajes 15–17 y solicita un candidato. En la regeneración añade el motivo de rechazo anterior. |
| 22 | `->` | AssistantGuardrailService | AssistantGuardrailService | `parseAnswer()` / `deterministicIssue()` | Candidato y nivel | Comprueba JSON, tamaño, fragmentos y contenido localmente. Un rechazo omite la revisión externa de ese candidato y pasa al siguiente intento si queda uno. |
| 23 | `->` | AssistantGuardrailService | SpringAiAssistantModelGateway | `complete(...)` en `opt candidato localmente válido` | Etapa `OUTPUT_REVIEW`, intento y proyección de revisión | Repite el callback de los mensajes 15–17 y llama a Gemini para revisión educativa. Solo un candidato aprobado sale del bucle como válido. |
| 24 | `-->` | AssistantGuardrailService | AssistantService | `Decision` | `COMPLETED` o `REDIRECTED`, JSON validado, intentos y versión del prompt | Devuelve una respuesta candidata aprobada; todavía no se ha consumido cuota. |
| 25 | `->` | AssistantService | AssistantTransactionService | `deliver(interactionId, policyVersion, status, validatedResponseJson, generationAttempts)` | Respuesta aprobada y versión de política reservada | Realiza el único intento de entrega en otra transacción corta; revisa reserva, elegibilidad, política y cuota bajo bloqueo. |
| 26 | `->` | AssistantTransactionService | PostgreSQL | Persistir finalización | Respuesta, estado, nivel/versión finales, intentos, `quotaCharged = true`, fin de reserva | Guarda entrega y consumo juntos. |
| 27 | `-->` | AssistantTransactionService | AssistantService | `Completion.DELIVERED` | Resultado de finalización | Confirma la transacción antes de devolver la respuesta al estudiante. |
| 28 | `->` | AssistantService | AssistantHistoryService / AssistantTransactionService | `get(assignmentId, interactionId, email)` / `availability(assignmentId, studentId)` | IDs propios y correo autenticado | Recupera el resultado persistido y la disponibilidad actual. |
| 29 | `-->` | AssistantService | AssistantController | `AssistantMessageResultDTO` | Interacción, disponibilidad e indicadores de contexto | El resultado incluye si se pidió/incluyó ejecución y si se truncó historial. |
| 30 | `-->` | AssistantController | Interfaz/useAssignmentAssistant | `200 OK` | `SuccessResponse<AssistantMessageResultDTO>` | Termina la espera; la interfaz revela localmente la respuesta. |

El presupuesto se representa como una operación interna del coordinador. Si se
necesita detalle, agregar `AssistantModelCallBudget` como línea de vida y dirigirle
el mensaje 17. Los mensajes 15–17 se repiten antes de **cada** revisión o generación;
ninguna llamada a Gemini ocurre dentro de esas transacciones.

### Presupuesto de llamadas y salida estructurada

| Camino de una interacción nueva | Llamadas a Gemini | Consumo educativo |
|---|---:|---|
| Entrada clasificada `BLOCK` | 1 | Ninguno. |
| Primer candidato aprobado, incluido `REDIRECT` | 3: entrada + generación + salida | Una respuesta al confirmar entrega. |
| Primer candidato rechazado localmente; segundo aprobado | 4: entrada + dos generaciones + una revisión de salida | Una respuesta al confirmar entrega. |
| Primer candidato rechazado en revisión de salida; segundo aprobado | 5: entrada + dos generaciones + dos revisiones de salida | Una respuesta al confirmar entrega. |
| Ambos candidatos rechazados en revisión de salida | 5 | Ninguno; `FAILED / OUTPUT_REJECTED`. |
| Reenvío idempotente o consulta de historial | 0 adicionales | Conserva el consumo previo. |

Los conteos presuponen que las etapas indicadas alcanzan al proveedor. Una
cancelación, un fallo o una restricción previa puede reducirlos. El contador limita
invocaciones al gateway; una invocación puede contarse aunque el gateway rechace
antes de transmitir. El máximo de cinco es por interacción, no por conversación
ni por petición HTTP de recuperación.

El gateway configura `GoogleGenAiChatOptions` con `responseMimeType = application/json`,
`responseSchema = AssistantResponseSchemas.forStage(stage)` y `candidateCount = 1`.
Deshabilita búsqueda de Google y ejecución interna de herramientas.

| Etapa | Campos requeridos por el esquema |
|---|---|
| `INPUT_REVIEW` | `decision`: `ALLOW`, `REDIRECT` o `BLOCK`. |
| `ANSWER_GENERATION` | `explanation`, `snippets` y `followUpQuestion`; hasta dos fragmentos con `language` y `code`. |
| `OUTPUT_REVIEW` | `approved`: booleano. |

El esquema orienta la forma del resultado; la aprobación exige además validación
local y revisión educativa independiente. `POLICY_REVALIDATION` se conserva para
registros históricos, pero no se ejecuta en el flujo actual.

`AssistantGoogleGenAiConfiguration` fija un solo intento tanto en `RetryTemplate`
de Spring como en `HttpRetryOptions` del SDK. El transporte HTTP desactiva reintentos
de conexión y redirecciones, y marca el cuerpo como `isOneShot = true` para impedir
reenvíos automáticos. Un fallo del proveedor termina el intento; no inicia una
regeneración. Así las capas de transporte no multiplican las cinco llamadas.

### Fragmentos requeridos

- `alt solicitud inválida`: validación del cuerpo o contexto -> `400`; no se inicia
  generación. Falta de autoridad -> `403`; asignación no encontrada -> `404`.
- `alt servicio o política deshabilitados`: `GLOBAL_DISABLED` -> `503`;
  `ASSISTANT_DISABLED` o `ASSISTANCE_UNAVAILABLE` -> `403`.
- `alt cuota agotada / frecuencia excedida`: `429`. Otra pregunta pendiente en la
  conversación -> `409 REQUEST_PENDING`.
- `alt solicitud coincidente`: `Reservation.replay = true` -> `ref DS-03`; no
  repetir revisión, generación ni consumo.
- `alt entrada bloqueada`: la revisión de entrada ya llamó al proveedor. El coordinador
  vuelve a comprobar elegibilidad y versión mediante `ensureBeforeModel()`, sin
  incrementar el presupuesto ni llamar al modelo. Si sigue vigente,
  `stop(interactionId, BLOCKED, "INPUT_BLOCKED")` conserva la pregunta sin respuesta
  ni cobro. Devuelve `200` con la interacción bloqueada si no fue cancelada entretanto.
- `alt redirección educativa`: genera orientación permitida y entrega `REDIRECTED`
  con un consumo, después de las mismas comprobaciones que una respuesta normal.
- `loop máximo dos generaciones`: un candidato rechazado puede regenerarse una vez.
  Si ninguno supera las comprobaciones, `OUTPUT_REJECTED` termina la interacción en
  `FAILED`, sin cobro, y responde `502`.
- `alt fallo del proveedor`: `stop(..., FAILED, safeCode)`; timeout/interrupción ->
  `504`; indisponibilidad, saturación o fallo -> `503`. No entregar ni cobrar.
- `alt política cambió`: cualquier cambio de versión de política reservada, incluido
  un cambio de cuota, cancela al leer el snapshot, antes de la siguiente llamada,
  después de una revisión de entrada bloqueada o al entregar.
  `stop(..., CANCELLED, "POLICY_CHANGED")` -> `409 POLICY_CHANGED`, sin respuesta ni
  cobro. No reconstruir contexto, revalidar ni volver a intentar la entrega.
- `alt presupuesto agotado`: el callback impide una sexta llamada y finaliza en
  `FAILED`, sin cobro -> `503 MODEL_CALL_BUDGET_EXCEEDED`. Es un límite defensivo;
  el bucle actual de dos generaciones ya alcanza como máximo cinco llamadas.
- `alt reserva vencida / acceso perdido / cancelación previa`: no entregar respuesta.
  El coordinador responde `409 REQUEST_CANCELLED`; el estado persistido puede ser
  `FAILED` por vencimiento o pérdida de elegibilidad, o `CANCELLED` por cancelación
  explícita. No confundir `Completion.CANCELLED` con un único estado de interacción.

---

## DS-02. Guardar la configuración del docente

### Objetivo y precondiciones

El propietario cambia inmediatamente habilitación, cuota o nivel de ayuda de una
asignación. Corresponde a **RF-02**. El grupo debe permitir modificaciones y el
usuario debe tener autorización sobre él.

La cuota habilitada es de 1 a 10 respuestas por estudiante y asignación. Cuando se
deshabilita, el valor debe ser cero. La política tiene su propia versión y no cambia
el consumo de respuestas ya entregadas.

### Participantes

`Docente`, `Página de edición`, `AssignmentController`, `AssignmentAiPolicyService`,
`GroupService`, `AiPolicyRules`, `PostgreSQL`.

### Secuencia principal

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Docente | Página de edición | “Save AI policy now” | Habilitación, cuota y nivel | Comprueba la cuota y normaliza a cero al deshabilitar. |
| 2 | `->` | Página de edición | AssignmentController | `PUT /api/assignments/{id}/ai-policy` / `updateAiPolicy(id, request, authentication)` | `UpdateAiPolicyRequest`; JWT | Valida el cuerpo antes de delegar. |
| 3 | `->` | AssignmentController | AssignmentAiPolicyService | `update(assignmentId, request, email)` | ID, configuración y correo autenticado | Inicia la transacción de actualización. |
| 4 | `->` | AssignmentAiPolicyService | PostgreSQL | `findByEmail(email)` / `findById(assignmentId)` | Usuario y asignación | Resuelve propietario y asignación o devuelve `404`. |
| 5 | `->` | AssignmentAiPolicyService | GroupService | `requireOwnedWritableGroupForUpdate(groupId, owner)` | Grupo y usuario resueltos | Comprueba propiedad y posibilidad de modificación bajo bloqueo. |
| 6 | `->` | AssignmentAiPolicyService | PostgreSQL | `findByIdForUpdate(assignmentId)` | ID de asignación | Bloquea la política existente o prepara una nueva. |
| 7 | `->` | AssignmentAiPolicyService | AiPolicyRules | `apply(policy, enabled, maximum, level)` | Política y valores solicitados | Valida habilitación/cuota/nivel y aplica los valores. |
| 8 | `->` | AssignmentAiPolicyService | PostgreSQL | `saveAndFlush(policy)` | Política modificada | Persiste la política con su versión independiente. |
| 9 | `-->` | AssignmentAiPolicyService | AssignmentController | `AiPolicyDTO` | Habilitación, cuota, nivel y versión | Confirma la transacción. |
| 10 | `-->` | AssignmentController | Página de edición | `200 OK` | `SuccessResponse<AiPolicyDTO>` | Actualiza controles y muestra confirmación inmediata. |

`UpdateAiPolicyRequest` contiene `aiAssistanceEnabled: Boolean`,
`maxAiRequests: Integer` y `aiAssistanceLevel: AiAssistanceLevel`; los tres son
obligatorios. La validación del DTO admite 0..10, y `AiPolicyRules` exige 1..10 cuando
está habilitada y exactamente cero cuando está deshabilitada.

### Fragmentos requeridos

- `alt formulario inválido`: el frontend no envía; validación del backend -> `400`.
- `alt no propietario / grupo no modificable`: rechaza con `403` / `400` sin guardar.
- `alt usuario o asignación inexistentes`: `404`.
- `alt error de persistencia`: revierte la transacción; la interfaz muestra el error
  y no comunica un guardado exitoso.
- `opt respuesta en curso`: `ref DS-01`, fragmento de cancelación ante cambio de
  política. Guardar la política no espera a esa respuesta.
- `ref creación o clonación`: la política inicial forma parte del formulario de la
  asignación; no dibujar una llamada obligatoria adicional a este endpoint.

---

## DS-03. Recuperar una solicitud pendiente o interrumpida

### Objetivo y precondiciones

El estudiante recupera el estado de un intento sin duplicar generación ni consumo.
Corresponde a **RF-11**. Para “Retry same request”, el hook debe conservar el payload
original en memoria, incluidos `clientRequestId` y selecciones de contexto. El
reenvío sigue sujeto a autenticación, límite HTTP e interruptor global.

### Participantes

`Estudiante`, `useAssignmentAssistant`, `AssistantController`, `AssistantService`,
`AssistantTransactionService`, `AssistantHistoryController`, `AssistantHistoryService`,
`AssistantLeaseRecoveryJob`, `PostgreSQL`.

### Fase de reenvío idempotente

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Estudiante | useAssignmentAssistant | “Retry same request” / `retry()` | Payload original conservado | Selecciona el mismo intento; no crea otro UUID. |
| 2 | `->` | useAssignmentAssistant | AssistantController | `POST /api/assignments/{assignmentId}/assistant/interactions` | Mismo `AssistantMessageRequest`; JWT | Aplica las comprobaciones de la frontera HTTP. |
| 3 | `->` | AssistantController | AssistantService | `ask(assignmentId, request, email)` | Misma solicitud y usuario | Resuelve estudiante e interruptor global. |
| 4 | `->` | AssistantService | AssistantTransactionService | `reserve(Request)` | Asignación, estudiante, ID y contenido originales | Bloquea grupo/conversación y busca el intento previo. |
| 5 | `->` | AssistantTransactionService | PostgreSQL | `findByConversationIdAndClientRequestId(...)` y comparación de huella | ID de conversación, `clientRequestId` y fingerprint | Si coincide, devuelve `Reservation.replay = true` antes de reservar otro intento. |
| 6 | `->` | AssistantService | AssistantHistoryService / AssistantTransactionService | Recuperar interacción y disponibilidad | ID previo, asignación y usuario | Retorna antes de crear otro presupuesto; no llama a guardrails ni al proveedor. |
| 7 | `-->` | AssistantController | useAssignmentAssistant | `200 OK` o `202 Accepted` | `SuccessResponse<AssistantMessageResultDTO>` | `200` si terminó; `202` únicamente si sigue `PENDING`. |
| 8 | `->` | useAssignmentAssistant | useAssignmentAssistant | Actualizar interacción o `refresh()` | Resultado previo y disponibilidad | Si sigue pendiente, actualiza disponibilidad/historial e inicia recuperación por lectura. |

### Fase de consulta y recuperación de reserva

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 9 | `->` | useAssignmentAssistant | AssistantHistoryController | `GET /api/assignments/{assignmentId}/assistant/interactions/{interactionId}` en `loop cada tres segundos mientras haya un pendiente` | `pendingInteractionId`; JWT | Consulta el estado sin volver a generar. |
| 10 | `->` | AssistantHistoryController | AssistantHistoryService | `get(assignmentId, interactionId, email)` | IDs y correo autenticado | Verifica propiedad de la conversación y obtiene el registro. |
| 11 | `-->` | AssistantHistoryController | useAssignmentAssistant | `200 OK` | `SuccessResponse<AssistantInteractionDTO>` | Al terminar, revela la interacción y ejecuta `refresh()` de disponibilidad/historial. |
| 12 | `->` | AssistantLeaseRecoveryJob | AssistantTransactionService | `expiredIds()` / `recoverOne(interactionId)` en `opt reserva vencida` | IDs de pendientes vencidos | Tarea periódica, por defecto cada 60 segundos; procesa hasta 100 IDs por barrido. |
| 13 | `->` | AssistantTransactionService | PostgreSQL | Bloquear y volver a comprobar estado/fecha | ID de interacción, estado `PENDING`, `leaseExpiresAt` | En una transacción `REQUIRES_NEW`, marca `FAILED` con `LEASE_EXPIRED` si aún corresponde. Libera el pendiente sin llamar al modelo ni cobrar. |

### Fragmentos requeridos

- `alt mismo ID con contenido distinto`: `IDEMPOTENCY_CONFLICT` -> `409`; no modifica
  ni sustituye el intento existente.
- `alt resultado terminado`: devuelve el resultado guardado. Un estado previo
  `FAILED`, `BLOCKED` o `CANCELLED` no genera otra respuesta mediante el mismo ID.
- `alt sin payload en memoria`: `retry()` utiliza `refresh()`; “Refresh history”
  consulta registros sin reenvío. El payload local no sobrevive al desmontaje o a la
  recarga de la interfaz.
- `opt nuevo intento`: un `clientRequestId` nuevo vuelve a DS-01 y debe pasar las
  comprobaciones de una solicitud nueva. Crea otra interacción con su propio límite
  de cinco llamadas; el mismo ID nunca reinicia el trabajo ni el presupuesto original.
- `par procesamiento original / consultas de estado`: la solicitud original puede
  seguir trabajando mientras el navegador recupera el estado. El polling no inicia
  un trabajo de IA ni una cola.
- `alt lectura interrumpida`: el polling puede intentar la siguiente consulta; sigue
  disponible la actualización manual. Un registro ajeno o inexistente -> `404`.
- `opt respuesta entregada recuperada`: el frontend emite el evento local
  `assistant-usage-changed` para actualizar vistas de consumo; no es un mensaje de
  RabbitMQ ni una nueva llamada al proveedor.

---

## DS-04. Consultar historial propio

### Objetivo y precondiciones

El estudiante consulta y pagina su conversación, aunque ya no pueda solicitar nueva
ayuda. Corresponde a **RF-04 y RF-10**. La consulta exige identidad de estudiante y
propiedad de la conversación; no depende de la elegibilidad para una pregunta nueva.

### Participantes

`Estudiante`, `Panel/AssistantHistoryPage`, `AssistantController`, `AssistantService`,
`AssistantTransactionService`, `AssistantHistoryController`, `AssistantHistoryService`,
`PostgreSQL`.

### Secuencia principal

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Estudiante | Panel/AssistantHistoryPage | Abrir “AI help” o “Full history” | ID de asignación | Inicia carga de disponibilidad e historial en paralelo. |
| 2 | `->` | Panel/AssistantHistoryPage | AssistantController | `GET /api/assignments/{assignmentId}/assistant` en rama `par disponibilidad` | ID de asignación; JWT | Pide cuota y motivo de indisponibilidad. |
| 3 | `->` | AssistantController | AssistantService / AssistantTransactionService | `availability(assignmentId, email)` / `availability(assignmentId, studentId)` | Asignación y estudiante autenticado | Lee máximo, consumo, reservas, saldo, nivel, versión y pendiente. |
| 4 | `-->` | AssistantController | Panel/AssistantHistoryPage | `200 OK` | `SuccessResponse<AssistantAvailabilityDTO>` | `available = false` informa que no hay nueva ayuda; no implica por sí solo pérdida del historial. |
| 5 | `->` | Panel/AssistantHistoryPage | AssistantHistoryController | `GET /api/assignments/{assignmentId}/assistant/interactions?page=0&size=20` en rama `par historial` | Asignación, página, tamaño y JWT | Pide la página más reciente. |
| 6 | `->` | AssistantHistoryController | AssistantHistoryService | `history(assignmentId, page, size, email)` | IDs, paginación y correo | Valida `page >= 0`, tamaño 1..50, rol y propiedad. |
| 7 | `->` | AssistantHistoryService | PostgreSQL | `findByAssignmentIdAndStudentId(...)` / `findByConversationIdOrderBySequenceDesc(...)` | Asignación, estudiante y `PageRequest` | Recupera registros propios del más reciente al más antiguo en transacción de lectura. |
| 8 | `-->` | AssistantHistoryController | Panel/AssistantHistoryPage | `200 OK` | `SuccessResponse<PageResponse<AssistantInteractionDTO>>` | Devuelve página e indicadores para seguir paginando. |
| 9 | `->` | Panel/AssistantHistoryPage | Panel/AssistantHistoryPage | Invertir la página y mostrar mensajes | `content`, `last` | Presenta burbujas en orden cronológico y estado de cuota. |
| 10 | `->` | Estudiante | Panel/AssistantHistoryPage | “Load older questions” en `opt páginas anteriores` | Siguiente página | Solicita el mismo endpoint con `page + 1`; agrega los mensajes al inicio. |

### Fragmentos requeridos

- `par disponibilidad / historial`: ambas lecturas se lanzan con `Promise.all()`;
  la presentación inicial espera a ambas. No afirmar que la UI actual muestra el
  historial cuando falla la petición de disponibilidad.
- `alt conversación inexistente`: el servicio devuelve `404`; `listAssistantHistory()`
  lo adapta a una página vacía para mostrar que aún no hay preguntas.
- `alt lectura no autorizada`: un usuario que no es estudiante -> `403`; una
  interacción fuera de su conversación -> `404`.
- `alt paginación inválida`: `400`.
- `alt asignación cerrada / matrícula terminada`: puede leer la conversación propia
  conservada, aunque disponibilidad indique que no admite preguntas.
- `alt grupo archivado o eliminado`: muestra metadatos con aviso de contenido borrado;
  no recupera preguntas ni respuestas originales.
- `alt fallo de carga`: muestra error y permite volver a cargar; no realiza una
  llamada al modelo como mecanismo de recuperación.

La ruta directa `/assignment/:id/assistant-history` usa los endpoints del asistente;
no requiere cargar antes el espacio de trabajo de la asignación.

---

## DS-05. Archivar grupo y detener respuestas pendientes

### Objetivo y precondiciones

El propietario autorizado archiva un grupo, borra definitivamente el texto del
asistente y evita que una solicitud en curso entregue una respuesta tardía.
Relacionado con **RF-10, RN-13, RN-22 y RN-23**.

El grupo debe existir y permitir la operación de ciclo de vida. El archivo y la
purga se ejecutan dentro de la misma transacción y usan el bloqueo del grupo que
serializa la reserva y finalización de interacciones.

### Participantes

`Docente/propietario autorizado`, `Interfaz de grupo`, `GroupController`,
`GroupService`, `AssistantTextPurgeService`, `PostgreSQL`, `AssistantService`,
`AssistantTransactionService`.

### Fase de archivo y purga

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Docente/propietario autorizado | Interfaz de grupo | Archivar grupo | ID de grupo | Envía la operación de ciclo de vida. |
| 2 | `->` | Interfaz de grupo | GroupController | `POST /api/groups/{id}/archive` / `archive(id, authentication)` | ID de grupo; JWT | Delega con el correo autenticado. |
| 3 | `->` | GroupController | GroupService | `setArchived(id, true, email)` | ID, nuevo estado y correo | Inicia la transacción y valida propietario bajo bloqueo. |
| 4 | `->` | GroupService | PostgreSQL | `requireOwnedGroupForUpdate(...)`; actualizar grupo | Grupo activo, `archived = true` | Modifica el ciclo de vida y su marca de actualización. |
| 5 | `->` | GroupService | AssistantTextPurgeService | `eraseGroup(groupId)` | ID de grupo | Participa en la misma transacción con propagación `MANDATORY`. |
| 6 | `->` | AssistantTextPurgeService | PostgreSQL | `cancelPendingForGroup(groupId, now)` | Grupo y fecha | Cambia pendientes a `CANCELLED`, fija `GROUP_ARCHIVED` y fecha de término. |
| 7 | `->` | AssistantTextPurgeService | PostgreSQL | `eraseContentForGroup(groupId)` | ID de grupo | Borra `studentMessage`, `assistantResponse` y `executionId`; fija `contentErased = true`. Conserva propiedad, estado y consumo. |
| 8 | `-->` | GroupService | GroupController | `GroupDTO` | Grupo archivado | Confirma conjuntamente archivo y purga. |
| 9 | `-->` | GroupController | Interfaz de grupo | `200 OK` | `SuccessResponse<GroupDTO>` | Muestra el grupo archivado. |

### Fase concurrente y consulta posterior

| # | Tipo | Origen | Destino | Método/mensaje | Parámetros | Resultado o cambio de estado |
|---:|:---:|---|---|---|---|---|
| 10 | `->` | AssistantService | AssistantTransactionService | `eligibleForModel(interactionId, policyVersion)` o `deliver(...)` en rama `par solicitud de IA en curso` | Interacción del grupo archivado | Tras el archivo confirmado, detecta cancelación o pérdida de elegibilidad; no entrega una respuesta nueva. |
| 11 | `-->` | AssistantService | Interfaz del estudiante, mediante AssistantController | Error de cancelación | `REQUEST_CANCELLED`, HTTP `409` | No consume una nueva respuesta; la consulta de historial recupera el estado guardado. |
| 12 | `->` | Estudiante | Panel/Página de historial | Consultar conversación | ID de asignación | `ref DS-04`: muestra registros con `contentErased = true` y sin texto original. |

Los participantes de consulta de historial del mensaje 12 se incorporan con una
referencia a DS-04 para no duplicar sus líneas de vida.

### Fragmentos requeridos

- `alt no propietario / grupo eliminado para archivo`: `403` / `400`; no ejecuta
  una purga exitosa. Grupo inexistente -> `404`.
- `alt fallo durante archivo o purga`: revierte la misma transacción; no dibujar
  una confirmación independiente del borrado.
- `alt eliminación lógica`: `DELETE /api/groups/{id}` llama a `softDelete(id, email)`;
  marca el grupo inactivo y archivado y utiliza la misma purga.
- `par solicitud en curso / archivo`: el bloqueo del grupo ordena las escrituras.
  Si la entrega confirma primero, conserva su consumo y luego borra el texto.
  Si el archivo confirma primero, impide la entrega posterior.
- `opt restaurar o desarchivar`: no restaura texto borrado ni cambia consumo previo.
- `opt notificación de grupo archivado`: `GroupService` publica un evento de dominio
  para enrutamiento posterior al commit; puede representarse con `->>` en una línea
  de vida adicional. Ese evento no ejecuta la purga del asistente.

---

## Notas de construcción de los diagramas

- Dibujar una secuencia por DS. Mantener fases separadas para reserva, llamadas al
  modelo y entrega; en DS-03, distinguir reenvío, polling y recuperación programada.
- Separar frontend, backend y servicios externos mediante cajas UML. PostgreSQL y
  MinIO representan infraestructura; no agregar worker, sandbox o RabbitMQ al camino
  de respuesta educativa.
- Usar flechas sólidas para llamadas síncronas y discontinuas para retornos. Mostrar
  activaciones de controladores y servicios; cerrar cada bloque transaccional cuando
  retorna su servicio. `AssistantContextService.build()` es una transacción de lectura,
  distinta de la reserva y la entrega.
- Expandir el gateway en tres llamadas normales: revisión de entrada, generación y
  revisión de salida. La revisión de salida solo ocurre si el candidato pasó las
  comprobaciones locales. Una regeneración permite llegar a cinco llamadas como máximo;
  los cambios de política cancelan, sin generar llamadas de revalidación.
- Repetir el callback de elegibilidad antes de **cada** llamada al gateway, incluidas
  regeneraciones. Verificar versión de política y presupuesto compartido; no limitar
  el control a la primera revisión de entrada.
- Dibujar la comprobación posterior a una entrada `BLOCK` sin flecha al proveedor ni
  incremento del contador. Un cambio de política durante cualquier llamada en curso
  se detecta en el siguiente control o en la entrega; no retira la petición ya enviada.
- No agregar bucles de reintento en Spring AI, SDK o transporte HTTP. El bucle de
  regeneración pertenece a guardrails y solo responde al rechazo de un candidato.
- La instrumentación técnica del gateway puede añadirse con
  `AssistantModelCallRecorder.start()` antes de transmitir y `finish()` al terminar,
  en transacciones cortas independientes. Registrar timeout del solicitante no prueba
  que el proveedor dejó de trabajar. Tokens y llamadas no equivalen a cuota educativa.
- Mostrar la revelación o animación de texto como operación local posterior al retorno
  HTTP. El flujo no transmite texto parcial al navegador.
- La lectura propia del historial no genera llamadas al proveedor ni modifica consumo.
  El borrado no recupera textos transmitidos previamente al proveedor externo.
- No confundir código o diagnóstico autorizado con solución de referencia o pruebas
  privadas: estas últimas no forman parte del contexto del asistente.

## Trazabilidad de fuentes

| Secuencia o aspecto | Fuentes principales |
|---|---|
| DS-01: entrada HTTP y coordinación | [AssistantController](../../codehive-backend/src/main/java/com/github/codehive/controller/AssistantController.java), [AssistantService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantService.java), [AssistantMessageRequest](../../codehive-backend/src/main/java/com/github/codehive/model/request/assistant/AssistantMessageRequest.java) |
| DS-01: reserva, elegibilidad y entrega | [AssistantTransactionService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java), [AssistantInteractionStatus](../../codehive-backend/src/main/java/com/github/codehive/model/enums/AssistantInteractionStatus.java) |
| DS-01: contexto y revisión | [AssistantContextService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantContextService.java), [AssistantGuardrailService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantGuardrailService.java), [SpringAiAssistantModelGateway](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/SpringAiAssistantModelGateway.java) |
| DS-02: configuración y validación | [AssignmentController](../../codehive-backend/src/main/java/com/github/codehive/controller/AssignmentController.java), [AssignmentAiPolicyService](../../codehive-backend/src/main/java/com/github/codehive/service/AssignmentAiPolicyService.java), [AiPolicyRules](../../codehive-backend/src/main/java/com/github/codehive/service/AiPolicyRules.java), [UpdateAiPolicyRequest](../../codehive-backend/src/main/java/com/github/codehive/model/request/assignment/UpdateAiPolicyRequest.java) |
| DS-03: reenvío, polling y recuperación | [useAssignmentAssistant](../../codehive-frontend/app/features/student/hooks/useAssignmentAssistant.ts), [AssistantTransactionService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java), [AssistantLeaseRecoveryJob](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantLeaseRecoveryJob.java) |
| DS-04: lectura y paginación | [AssistantHistoryController](../../codehive-backend/src/main/java/com/github/codehive/controller/AssistantHistoryController.java), [AssistantHistoryService](../../codehive-backend/src/main/java/com/github/codehive/service/AssistantHistoryService.java), [assistant.api.ts](../../codehive-frontend/app/features/student/api/assistant.api.ts), [AssistantHistoryPage](../../codehive-frontend/app/features/student/pages/AssistantHistoryPage.tsx) |
| DS-05: ciclo de vida y purga | [GroupController](../../codehive-backend/src/main/java/com/github/codehive/controller/GroupController.java), [GroupService](../../codehive-backend/src/main/java/com/github/codehive/service/GroupService.java), [AssistantTextPurgeService](../../codehive-backend/src/main/java/com/github/codehive/service/AssistantTextPurgeService.java), [AssistantInteractionRepository](../../codehive-backend/src/main/java/com/github/codehive/repository/AssistantInteractionRepository.java) |
| Códigos HTTP del asistente | [GlobalExceptionHandler](../../codehive-backend/src/main/java/com/github/codehive/model/exception/handler/GlobalExceptionHandler.java) |
| Instrumentación opcional del gateway | [AssistantModelCallRecorder](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantModelCallRecorder.java) |
| Límite de llamadas, esquemas y transporte | [AssistantModelCallBudget](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantModelCallBudget.java), [AssistantResponseSchemas](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantResponseSchemas.java), [AssistantGoogleGenAiConfiguration](../../codehive-backend/src/main/java/com/github/codehive/config/AssistantGoogleGenAiConfiguration.java) |
| Pruebas de límite, cancelación y peticiones HTTP | [AssistantModelCallBudgetTest](../../codehive-backend/src/test/java/com/github/codehive/service/assistant/AssistantModelCallBudgetTest.java), [AssistantControllerIntegrationTest](../../codehive-backend/src/test/java/com/github/codehive/controller/AssistantControllerIntegrationTest.java), [GoogleGenAiTransportTest](../../codehive-backend/src/test/java/com/github/codehive/config/GoogleGenAiTransportTest.java) |

Las secuencias distinguen los estados persistidos de los resultados de finalización.
Reflejan el límite de cinco llamadas, los esquemas por etapa y la cancelación sin
revalidación ante cambios de política.

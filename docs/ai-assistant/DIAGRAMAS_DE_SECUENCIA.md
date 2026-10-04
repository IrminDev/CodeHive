# Asistente educativo de IA: guía para diagramas de secuencia

Revisión: 4 de octubre de 2026. Se proponen cinco secuencias que explican el comportamiento implementado. Los participantes son clases principales o fronteras del sistema; PostgreSQL representa repositorios y transacciones para evitar un diagrama con cada interfaz técnica.

Relacionar las secuencias con [requerimientos funcionales](REQUERIMIENTOS_FUNCIONALES.md) y [reglas](REGLAS_DE_NEGOCIO_Y_RESTRICCIONES.md). Los diagramas pueden construirse en UML o Mermaid siguiendo los mensajes descritos.

## DS-01. Solicitar y entregar orientación educativa

**Objetivo:** explicar la pregunta normal y sus controles hasta mostrar una respuesta aprobada. Corresponde a RF-06, RF-07, RF-08 y RF-09.

**Participantes, de izquierda a derecha:** Estudiante, Interfaz del asistente, `AssistantController`, `AssistantService`, `AssistantTransactionService`, `AssistantContextService`, `AssistantGuardrailService`, Gateway Spring AI, Gemini y PostgreSQL. Agregar MinIO solo para el fragmento opcional de ejecución.

**Mensajes principales:**
1. Estudiante pulsa “Ask assistant”. La interfaz captura pregunta, lenguaje, selecciones y código seleccionado; crea el identificador y muestra la pregunta con espera.
2. Interfaz envía `POST /api/assignments/{id}/assistant/interactions`. Anotar autenticación, autorización y límite de frecuencia antes del controlador.
3. Controlador llama `AssistantService.ask()`.
4. Servicio llama `reserve()`. Dibujar un bloque de transacción corto: bloquear grupo/conversación, comprobar acceso/política/cuota y duplicados, guardar pregunta pendiente con reserva temporal y confirmar. No se cobra en esta fase.
5. Servicio obtiene la política vigente y llama `AssistantContextService.build()`.
6. Contexto lee asignación pública e historial permitido de PostgreSQL. En un fragmento `opt ejecución seleccionada`, busca la última ejecución apta y, si hay reporte disponible, lee su proyección desde MinIO. Devuelve contexto acotado.
7. Servicio llama `markContext()` para conservar el identificador de ejecución seleccionado si procede.
8. Servicio llama `generate()`. Guardrails realizan revisión de entrada, generación y revisión de salida a través del gateway y Gemini. Entre generación y revisión de salida, mostrar validación local del candidato.
9. Añadir una nota: antes de cada llamada al gateway, guardrails ejecutan el callback del servicio, que verifica `eligibleForModel()`.
10. Guardrails devuelven respuesta validada. Servicio llama `deliver()`.
11. Dibujar otra transacción corta: bloquear, revisar reserva/acceso/política/cuota, guardar respuesta aprobada y consumo juntos, confirmar.
12. Servicio obtiene resultado guardado y disponibilidad; controlador responde. Interfaz termina espera y revela localmente la respuesta.

**Fragmentos alternos:**

- `alt entrada bloqueada`: la revisión de entrada ya llamó a Gemini; `stop()` conserva pregunta con estado bloqueado, sin respuesta ni cobro.
- `alt redirección`: se genera orientación permitida, se valida y se entrega consumiendo una respuesta.
- `loop máximo dos generaciones`: un candidato rechazado recibe una regeneración; dos candidatos rechazados terminan en fallo sin cobro.
- `alt fallo del proveedor`: error o timeout detiene la interacción sin respuesta cobrada.
- `alt política cambió`: el servicio vuelve a leer política y contexto, revalida el candidato y reintenta finalización dentro del bucle acotado. Si la respuesta deja de cumplir o sigue cambiando la política, se cancela.
- `alt acceso terminó o reserva venció`: no entregar respuesta; terminar sin cobro.

**Notas de construcción:** las llamadas al modelo quedan fuera de las transacciones de escritura. Entrada, generación y revisión son llamadas separadas al mismo gateway. La animación del navegador se dibuja como operación local posterior a la respuesta HTTP.

## DS-02. Guardar la configuración del docente

**Objetivo:** mostrar una modificación inmediata de habilitación, cuota o nivel. Corresponde a RF-02.

**Participantes:** Docente, Página de edición, `AssignmentController`, `AssignmentAiPolicyService`, `GroupService` y PostgreSQL.

**Mensajes principales:**
1. Docente cambia los controles y pulsa “Save AI policy now”.
2. Página comprueba la cuota y normaliza a cero si se deshabilitó.
3. Página envía `PUT /api/assignments/{id}/ai-policy`.
4. Controlador delega a `AssignmentAiPolicyService.update()`.
5. Servicio identifica al usuario y asignación y verifica con `GroupService` que el propietario puede modificar el grupo.
6. En una transacción, obtiene/bloquea la política, aplica reglas y guarda sus valores con versión independiente.
7. Devuelve configuración guardada. Página actualiza sus controles y muestra confirmación inmediata.

**Fragmentos alternos:** cuota inválida detiene el formulario; falta de propiedad o grupo no modificable rechaza el cambio; error de guardado muestra aviso. Puede agregarse una referencia a DS-01 cuando una respuesta esté en curso y deba revalidarse con la nueva política.

**Notas de construcción:** este guardado no inicia validación del worker ni modifica consumo previo. Para creación/clonación, representar política como parte del formulario de asignación, no como una llamada adicional obligatoria al endpoint de actualización.

## DS-03. Recuperar una solicitud pendiente o interrumpida

**Objetivo:** explicar cómo se evita una pregunta duplicada o un doble consumo. Corresponde a RF-11.

**Participantes:** Estudiante, `useAssignmentAssistant`, `AssistantController`, `AssistantService`, `AssistantTransactionService`, `AssistantHistoryController`, `AssistantHistoryService` y PostgreSQL.

**Mensajes principales:**
1. Después de una interrupción, el estudiante pulsa “Retry same request”.
2. El hook reenvía el payload con el mismo `clientRequestId` conservado en memoria.
3. El servicio llama `reserve()`; transacciones busca la solicitud existente y compara su huella.
4. Si coincide, devuelve la interacción anterior sin volver a generar una respuesta.
5. Dibujar `alt terminada`: HTTP 200 con resultado existente y saldo; interfaz muestra o actualiza esa interacción.
6. Dibujar `alt pendiente`: HTTP 202 y referencia pendiente; interfaz actualiza su historial.
7. En `loop mientras pendiente, cada tres segundos`, el hook pide el detalle con `GET .../interactions/{interactionId}`. Servicio de historial verifica propiedad y lee el registro.
8. Al terminar, hook vuelve a cargar disponibilidad e historial.

**Fragmentos alternos:** mismo ID con contenido distinto se rechaza; resultado anterior fallido se recupera como fallo, sin nueva generación; si ya no hay payload en memoria, “Refresh history” consulta registros. Si la reserva vence, `AssistantLeaseRecoveryJob` llama `recoverOne()` y cambia el pendiente a fallo recuperable para liberar la conversación.

**Notas de construcción:** mostrar que un identificador nuevo es otro intento. El reintento local no sobrevive a cerrar o recargar el panel; el registro persistido sí puede consultarse. El polling recupera un estado pendiente y no implica una cola de trabajo de IA.

## DS-04. Consultar historial propio

**Objetivo:** mostrar lectura y paginación, incluso cuando ya no se permite nueva ayuda. Corresponde a RF-04 y RF-10.

**Participantes:** Estudiante, Panel/Página de historial, `AssistantController`, `AssistantHistoryController`, `AssistantService`, `AssistantHistoryService` y PostgreSQL.

**Mensajes principales:**
1. Estudiante abre “AI help” o entra a “Full history”.
2. La interfaz solicita disponibilidad al controlador del asistente y lista de mensajes al controlador de historial. Se puede usar `par` para ambas lecturas.
3. Disponibilidad devuelve saldo y motivo si no puede preguntar. Historial verifica que la conversación pertenece al estudiante autenticado y devuelve una página de registros.
4. Interfaz ordena los registros cronológicamente y muestra las burbujas completas.
5. En `opt mensajes más antiguos`, estudiante pulsa “Load older questions”; interfaz solicita otra página y la agrega al inicio.

**Fragmentos alternos:** conversación vacía; acceso ajeno denegado; error de carga; cierre de asignación o fin de matrícula con historial aún permitido; grupo archivado/eliminado con registros sin texto.

**Notas de construcción:** la página directa `/assignment/:id/assistant-history` no requiere cargar primero el espacio de trabajo de la asignación. Leer historial no genera llamadas a Gemini ni altera consumo.

## DS-05. Archivar grupo y detener respuestas pendientes

**Objetivo:** mostrar borrado permanente del texto y prevención de entrega tardía. Relacionado con RF-10 y RN-13, RN-22, RN-23.

**Participantes:** Docente/usuario autorizado, Interfaz de grupo, Controlador de grupo, `GroupService`, `AssistantTextPurgeService`, PostgreSQL y `AssistantService` para la solicitud en curso.

**Mensajes principales:**
1. Usuario autorizado ejecuta la acción de archivar el grupo.
2. Controlador delega la operación de ciclo de vida a `GroupService`.
3. Dibujar una transacción que incluye el cambio del grupo y la llamada `AssistantTextPurgeService.eraseGroup()`.
4. Purga cancela interacciones pendientes y borra preguntas, respuestas e identificadores de ejecución del grupo; marca contenido borrado y conserva consumo y propiedad.
5. Confirma la transacción y devuelve el resultado de archivo a la interfaz.
6. En un fragmento `par solicitud de IA en curso`, el coordinador intenta la siguiente comprobación de elegibilidad o finalización; encuentra la cancelación o grupo archivado y no entrega una nueva respuesta.
7. En una posterior consulta de historial, el estudiante ve registros con aviso de borrado y sin el texto original.

**Fragmentos alternos:** la eliminación lógica del grupo utiliza el mismo mecanismo de purga. Al restaurar o desarchivar, el texto no reaparece y el consumo acumulado no cambia. Si la respuesta ya se había entregado antes del archivo, se conserva su consumo aunque se borre su contenido.

**Notas de construcción:** el borrado y el cambio de grupo pertenecen a la misma transacción. Las llamadas externas al modelo pueden haber comenzado antes del archivo; el control impide su entrega posterior, sin afirmar que se retiren datos ya transmitidos al proveedor.

## Fuentes para comprobar nombres y operaciones

**Observación de la revisión:** el coordinador, las transacciones y la consulta de purga utilizan `AssistantInteractionStatus.CANCELLED`, pero el enum actual no declara ese valor. Las secuencias documentan el comportamiento de cancelación previsto por esos servicios; la inconsistencia debe corregirse para que ese código pueda compilar. Esta entrega documental no modifica el código.

- [Coordinador](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantService.java).
- [Transacciones](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java).
- [Guardrails](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantGuardrailService.java).
- [Configuración del docente](../../codehive-backend/src/main/java/com/github/codehive/service/AssignmentAiPolicyService.java).
- [Historial](../../codehive-backend/src/main/java/com/github/codehive/service/AssistantHistoryService.java).
- [Purga](../../codehive-backend/src/main/java/com/github/codehive/service/AssistantTextPurgeService.java).

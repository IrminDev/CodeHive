# Requisitos funcionales de notificaciones

## RF-NOT-001

**ID:** RF-NOT-001  
**Título:** Consultar preferencias de notificación  
**Descripción:** Permite al usuario consultar su configuración global y el catálogo completo de notificaciones disponible para su rol.  
**Usuario involucrado:** Profesor o estudiante autenticado.  
**Precondiciones:** El usuario está autenticado y activo.  
**Descripción del flujo principal:**

1. El usuario solicita sus preferencias de notificación.
2. El sistema obtiene la identidad y el rol desde el contexto de autenticación.
3. El sistema consulta la configuración global y los overrides persistidos.
4. El sistema combina los registros existentes con los valores predeterminados del catálogo correspondiente al rol.
5. El sistema devuelve `emailEnabled`, zona horaria, locale y cada tipo disponible con su estado efectivo.

**Flujos alternativos:**

1.1. Si el usuario no está autenticado, el sistema deniega el acceso y finaliza el flujo.  
3.1. Si no existen registros persistidos, el sistema aplica todos los valores predeterminados y continúa en el paso 5 del flujo principal.  
4.1. Si existe un override para un tipo, el sistema sustituye únicamente ese valor y continúa en el paso 4 del flujo principal.

**Postcondiciones:** No se modifica información y el usuario recibe únicamente preferencias correspondientes a su identidad y rol.

## RF-NOT-002

**ID:** RF-NOT-002  
**Título:** Actualizar preferencias de notificación  
**Descripción:** Permite habilitar o deshabilitar el correo global, configurar zona horaria y modificar tipos individuales.  
**Usuario involucrado:** Profesor o estudiante autenticado.  
**Precondiciones:** El usuario está autenticado y envía una configuración válida.  
**Descripción del flujo principal:**

1. El usuario envía el interruptor global, una zona horaria IANA, locale `en-US` y los overrides que desea modificar.
2. El sistema obtiene la identidad y el rol desde el contexto de autenticación.
3. El sistema valida la zona horaria, el locale y que no existan tipos duplicados.
4. El sistema valida que cada tipo pertenezca al rol del usuario.
5. Para los recordatorios, el sistema valida el tiempo de anticipación.
6. El sistema crea o actualiza la configuración global y cada override recibido.
7. El sistema combina los valores persistidos con el catálogo predeterminado.
8. El sistema devuelve la configuración efectiva.

**Flujos alternativos:**

1.1. Si faltan campos globales obligatorios, el sistema muestra los errores y vuelve al paso 1 del flujo principal.  
3.1. Si la zona horaria no existe, el sistema muestra el error y vuelve al paso 1 del flujo principal.  
3.2. Si el locale es diferente de `en-US`, el sistema muestra el error y vuelve al paso 1 del flujo principal.  
3.3. Si un tipo aparece más de una vez, el sistema muestra el error y vuelve al paso 1 del flujo principal.  
4.1. Si un tipo pertenece a otro rol, el sistema rechaza la solicitud y vuelve al paso 1 del flujo principal.  
5.1. Si un tipo no es recordatorio pero recibe anticipación, el sistema muestra el error y vuelve al paso 1 del flujo principal.  
5.2. Si la anticipación no es 120, 1440, 2880 o 10080 minutos, el sistema muestra el error y vuelve al paso 1 del flujo principal.

**Postcondiciones:** La configuración efectiva del usuario queda persistida sin modificar preferencias de otros usuarios.

## RF-NOT-003

**ID:** RF-NOT-003  
**Título:** Restaurar preferencias predeterminadas  
**Descripción:** Permite eliminar la configuración personalizada del usuario y recuperar los valores predeterminados de su rol.  
**Usuario involucrado:** Profesor o estudiante autenticado.  
**Precondiciones:** El usuario está autenticado.  
**Descripción del flujo principal:**

1. El usuario solicita restaurar sus preferencias.
2. El sistema obtiene su identidad desde el contexto de autenticación.
3. El sistema elimina su configuración global personalizada.
4. El sistema elimina sus overrides por tipo.
5. El sistema reconstruye la respuesta con `emailEnabled = true`, `America/Mexico_City`, `en-US` y el catálogo habilitado.
6. El sistema devuelve la configuración restaurada.

**Flujos alternativos:**

1.1. Si el usuario no está autenticado, el sistema deniega el acceso y finaliza el flujo.  
3.1. Si el usuario no tenía configuración personalizada, el sistema continúa en el paso 5 del flujo principal.  
4.1. Si el usuario no tenía overrides, el sistema continúa en el paso 5 del flujo principal.

**Postcondiciones:** El usuario queda sujeto a los valores predeterminados sin filas personalizadas.

## RF-NOT-004

**ID:** RF-NOT-004  
**Título:** Verificar envío de correo  
**Descripción:** Permite solicitar un correo de prueba para comprobar el acceso al SMTP y la dirección registrada.  
**Usuario involucrado:** Profesor o estudiante autenticado.  
**Precondiciones:** El usuario está autenticado y tiene una dirección de correo registrada.  
**Descripción del flujo principal:**

1. El usuario solicita un correo de prueba.
2. El sistema obtiene el nombre y correo del usuario autenticado.
3. El sistema genera el contenido HTML y texto plano con la plantilla de prueba.
4. El sistema envía el mensaje mediante el cliente SMTP configurado.
5. El sistema confirma la solicitud.

**Flujos alternativos:**

1.1. Si el usuario supera tres solicitudes en cinco minutos, el sistema informa el límite y vuelve al paso 1 cuando termine la ventana.  
1.2. Si el usuario no está autenticado, el sistema deniega el acceso y finaliza el flujo.  
4.1. Si SMTP rechaza el envío, el sistema devuelve un error y el usuario puede volver al paso 1 del flujo principal.

**Postcondiciones:** El correo de prueba fue entregado al servidor SMTP o se informó el fallo; no se modifica ninguna preferencia.

## RF-NOT-005

**ID:** RF-NOT-005  
**Título:** Notificar actividad de inscripción al profesor  
**Descripción:** Informa al propietario profesor cuando un estudiante entra o sale de su grupo.  
**Usuario involucrado:** Profesor propietario y estudiante inscrito.  
**Precondiciones:** El grupo existe; el propietario tiene rol `TEACHER`; la operación de inscripción termina correctamente; el tipo y el correo global del profesor están habilitados.  
**Descripción del flujo principal:**

1. El estudiante se une a un grupo o sale de él.
2. El servicio de grupos confirma y persiste el cambio de inscripción.
3. El sistema publica el evento de dominio después del commit.
4. El router identifica al propietario del grupo.
5. El sistema verifica sus preferencias y publica el trabajo en RabbitMQ.
6. El consumidor construye el contenido con el estudiante y grupo correspondientes.
7. El sistema envía el correo al profesor.

**Flujos alternativos:**

2.1. Si la operación de inscripción falla o se revierte, el sistema no publica la notificación y finaliza el flujo.  
4.1. Si el propietario no tiene rol `TEACHER`, el sistema descarta el evento y finaliza el flujo.  
5.1. Si el profesor está inactivo o deshabilitó la notificación, el sistema descarta el evento y finaliza el flujo.  
7.1. Si el envío falla, el sistema ejecuta RF-NOT-013 y regresa al paso 7 del flujo principal mientras queden intentos.

**Postcondiciones:** El cambio de inscripción permanece registrado y, cuando corresponde, el profesor recibe `STUDENT_ENROLLED` o `STUDENT_LEFT`.

## RF-NOT-006

**ID:** RF-NOT-006  
**Título:** Notificar cambios de acceso al estudiante  
**Descripción:** Informa a estudiantes removidos o inscritos cuando cambia la disponibilidad de su grupo.  
**Usuario involucrado:** Profesor propietario y estudiante.  
**Precondiciones:** El grupo y la inscripción existen; la operación termina correctamente; el tipo correspondiente está habilitado para el estudiante.  
**Descripción del flujo principal:**

1. El profesor remueve a un estudiante o archiva un grupo.
2. El servicio de grupos persiste el cambio.
3. El sistema publica el evento después del commit.
4. Para una remoción, el router selecciona al estudiante removido; para un archivo, selecciona las inscripciones activas.
5. El sistema verifica las preferencias de cada destinatario.
6. El sistema publica un trabajo por destinatario en RabbitMQ.
7. El consumidor genera y envía cada correo.

**Flujos alternativos:**

2.1. Si la operación falla o se revierte, el sistema no publica correos y finaliza el flujo.  
4.1. Si no existen estudiantes activos al archivar, el sistema finaliza sin trabajos pendientes.  
5.1. Si un estudiante está inactivo o deshabilitó el tipo, el sistema omite ese destinatario y continúa en el paso 5 con el siguiente.  
7.1. Si un envío falla, el sistema ejecuta RF-NOT-013 y regresa al paso 7 del flujo principal mientras queden intentos.

**Postcondiciones:** Los destinatarios aplicables reciben `REMOVED_FROM_GROUP` o `GROUP_ARCHIVED`; el estado del grupo o inscripción no depende del resultado SMTP.

## RF-NOT-007

**ID:** RF-NOT-007  
**Título:** Notificar resultado de validación de tarea  
**Descripción:** Informa al profesor autor cuando el worker termina de validar una tarea.  
**Usuario involucrado:** Profesor autor y worker.  
**Precondiciones:** Existe una tarea en proceso y el backend recibe un resultado del worker.  
**Descripción del flujo principal:**

1. El worker publica el resultado de generación de salidas esperadas.
2. El backend localiza la tarea.
3. El backend cambia la validación a `READY` o `FAILED`.
4. El sistema detecta que existe una transición real de estado.
5. El sistema crea `ASSIGNMENT_READY` o `ASSIGNMENT_VALIDATION_FAILED`.
6. El router selecciona al autor profesor.
7. El sistema publica y consume el trabajo de correo.
8. El sistema envía el resultado de validación al profesor.

**Flujos alternativos:**

2.1. Si la tarea no existe, el sistema registra el problema y finaliza el flujo.  
4.1. Si el mensaje repite el estado actual, el sistema no vuelve a notificar y finaliza el flujo.  
6.1. Si el autor no tiene rol `TEACHER`, está inactivo o deshabilitó el tipo, el sistema descarta el correo y finaliza el flujo.  
8.1. Si SMTP falla, el sistema ejecuta RF-NOT-013 y regresa al paso 8 del flujo principal mientras queden intentos.

**Postcondiciones:** La tarea conserva el resultado del worker y el profesor recibe como máximo una notificación por transición.

## RF-NOT-008

**ID:** RF-NOT-008  
**Título:** Notificar publicación de tarea  
**Descripción:** Informa a los estudiantes activos cuando una tarea lista alcanza su fecha de publicación.  
**Usuario involucrado:** Estudiante inscrito.  
**Precondiciones:** La tarea está activa y `READY`; el grupo está activo y no archivado; llegó `launchDate` o es nula.  
**Descripción del flujo principal:**

1. La tarea queda `READY` con publicación inmediata o el scheduler detecta que llegó `launchDate`.
2. El sistema obtiene las inscripciones `ACTIVE` del grupo.
3. Para cada estudiante, el sistema construye una clave determinística de publicación.
4. El sistema verifica que la clave no haya sido procesada y que el estudiante permita el tipo.
5. El sistema registra la clave de deduplicación.
6. El sistema publica un trabajo `ASSIGNMENT_PUBLISHED`.
7. El consumidor verifica nuevamente la preferencia.
8. El sistema envía el correo con el enlace a la tarea.

**Flujos alternativos:**

1.1. Si la tarea no está `READY`, todavía no llegó `launchDate`, fue eliminada o su grupo está archivado/eliminado, el scheduler finaliza sin publicar y vuelve al paso 1 en la siguiente ejecución.  
2.1. Si no existen inscripciones activas, el sistema finaliza el flujo.  
4.1. Si la clave ya existe, el sistema omite al estudiante y continúa en el paso 3 con el siguiente.  
4.2. Si el estudiante deshabilitó la notificación, el sistema omite al estudiante y continúa en el paso 3 con el siguiente.  
8.1. Si SMTP falla, el sistema ejecuta RF-NOT-013 y regresa al paso 8 del flujo principal mientras queden intentos.

**Postcondiciones:** Cada estudiante elegible tiene como máximo un trabajo de publicación registrado para esa tarea.

## RF-NOT-009

**ID:** RF-NOT-009  
**Título:** Notificar una entrega al profesor  
**Descripción:** Informa al propietario profesor cuando un estudiante crea una entrega definitiva normal o tardía.  
**Usuario involucrado:** Estudiante y profesor propietario.  
**Precondiciones:** La entrega definitiva fue aceptada antes de `closeDate`; el propietario tiene rol `TEACHER`.  
**Descripción del flujo principal:**

1. El estudiante crea una entrega definitiva.
2. El sistema determina si la entrega ocurre después de `dueDate`.
3. El sistema persiste la entrega con su marca `deliveredLate`.
4. Después del commit, el router selecciona al propietario del grupo.
5. Si no es tardía, el sistema crea `ASSIGNMENT_SUBMITTED`; si es tardía, crea `LATE_ASSIGNMENT_SUBMITTED`.
6. El sistema verifica preferencias y publica el trabajo.
7. El consumidor genera el correo con tarea, grupo, estudiante, lenguaje y estado tardío.
8. El sistema envía el correo al profesor.

**Flujos alternativos:**

1.1. Si la entrega es rechazada, el sistema no publica una notificación y finaliza el flujo.  
4.1. Si el propietario no tiene rol `TEACHER`, está inactivo o deshabilitó el tipo, el sistema descarta el correo y finaliza el flujo.  
8.1. Si SMTP falla, el sistema ejecuta RF-NOT-013 y regresa al paso 8 del flujo principal mientras queden intentos.

**Postcondiciones:** La entrega queda registrada y el profesor recibe exactamente uno de los dos tipos de entrega cuando corresponde.

## RF-NOT-010

**ID:** RF-NOT-010  
**Título:** Notificar evaluación de entrega al estudiante  
**Descripción:** Informa al estudiante cuando el worker produce el resultado final de una ejecución definitiva.  
**Usuario involucrado:** Estudiante y worker.  
**Precondiciones:** Existe una ejecución `PENDING` asociada a una entrega definitiva.  
**Descripción del flujo principal:**

1. El worker publica el reporte de ejecución.
2. El backend localiza la ejecución.
3. El backend detecta que el estado actual es `PENDING`.
4. El backend persiste el estado final, tiempo y memoria.
5. Después del commit, el router selecciona al estudiante propietario de la entrega.
6. El sistema verifica sus preferencias y publica `SUBMISSION_EVALUATED`.
7. El consumidor consulta el resultado actual y construye el correo.
8. El sistema envía el correo con el enlace a la tarea.

**Flujos alternativos:**

2.1. Si la ejecución no existe, el sistema registra el problema y finaliza el flujo.  
3.1. Si la ejecución ya tenía un estado final, el sistema actualiza los datos recibidos sin volver a notificar y finaliza el flujo.  
5.1. Si se trata de una ejecución de práctica sin entrega, el sistema no notifica y finaliza el flujo.  
6.1. Si el estudiante está inactivo o deshabilitó el tipo, el sistema descarta el correo y finaliza el flujo.  
8.1. Si SMTP falla, el sistema ejecuta RF-NOT-013 y regresa al paso 8 del flujo principal mientras queden intentos.

**Postcondiciones:** La ejecución contiene el resultado recibido y se produce como máximo una notificación de evaluación por transición desde `PENDING`.

## RF-NOT-011

**ID:** RF-NOT-011  
**Título:** Recordar fechas al profesor  
**Descripción:** Informa al profesor cuando una tarea se aproxima a su fecha de entrega o cierre.  
**Usuario involucrado:** Profesor propietario.  
**Precondiciones:** La tarea está activa y `READY`; el grupo está activo y no archivado; existe la fecha correspondiente; el profesor habilitó el tipo.  
**Descripción del flujo principal:**

1. El scheduler inicia una revisión periódica.
2. El sistema localiza tareas con fechas dentro de los siguientes siete días.
3. El sistema obtiene la anticipación configurada por el profesor.
4. El sistema verifica que la fecha sea futura y ya se encuentre dentro de la ventana.
5. El sistema construye una clave con tipo, tarea, profesor y anticipación.
6. El sistema registra la clave si no existe.
7. El sistema publica `ASSIGNMENT_DUE_SOON` o `ASSIGNMENT_CLOSE_SOON`.
8. El consumidor envía el correo.

**Flujos alternativos:**

2.1. Si no existen tareas candidatas, el sistema finaliza y vuelve al paso 1 en la siguiente ejecución programada.  
4.1. Si la ventana todavía no comienza, el sistema omite la tarea y continúa en el paso 2 con la siguiente.  
4.2. Si la fecha ya pasó o es nula, el sistema omite la tarea y continúa en el paso 2 con la siguiente.  
6.1. Si la clave ya existe o el tipo está deshabilitado, el sistema omite el trabajo y continúa en el paso 2 con la siguiente tarea.  
8.1. Si SMTP falla, el sistema ejecuta RF-NOT-013 y regresa al paso 8 del flujo principal mientras queden intentos.

**Postcondiciones:** El profesor recibe como máximo un recordatorio por tipo, tarea y anticipación configurada.

## RF-NOT-012

**ID:** RF-NOT-012  
**Título:** Recordar fechas al estudiante sin entrega  
**Descripción:** Informa al estudiante que una tarea se aproxima a su vencimiento o cierre cuando todavía no tiene una entrega definitiva.  
**Usuario involucrado:** Estudiante inscrito.  
**Precondiciones:** La tarea y el grupo están disponibles; el estudiante tiene inscripción `ACTIVE`; no existe una entrega definitiva; el tipo está habilitado.  
**Descripción del flujo principal:**

1. El scheduler encuentra una tarea candidata.
2. El sistema obtiene las inscripciones activas del grupo.
3. Para cada estudiante, el sistema verifica que no exista una entrega definitiva.
4. El sistema obtiene la anticipación configurada.
5. El sistema verifica que la fecha sea futura y esté dentro de la ventana.
6. El sistema construye y registra una clave de deduplicación.
7. El sistema publica `ASSIGNMENT_DUE_SOON_NO_SUBMISSION` o `ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION`.
8. El consumidor envía el correo al estudiante.

**Flujos alternativos:**

3.1. Si el estudiante ya tiene una entrega definitiva, el sistema lo omite y vuelve al paso 3 con el siguiente estudiante.  
4.1. Si el tipo está deshabilitado, el sistema omite al estudiante y vuelve al paso 3 con el siguiente.  
5.1. Si la ventana todavía no comienza, la fecha no existe o ya pasó, el sistema omite el recordatorio y vuelve al paso 3 con el siguiente estudiante.  
6.1. Si la clave ya existe, el sistema omite el trabajo y vuelve al paso 3 con el siguiente estudiante.  
8.1. Si SMTP falla, el sistema ejecuta RF-NOT-013 y regresa al paso 8 del flujo principal mientras queden intentos.

**Postcondiciones:** Cada estudiante elegible recibe como máximo un recordatorio por tipo, tarea y anticipación.

## RF-NOT-013

**ID:** RF-NOT-013  
**Título:** Reintentar y aislar correos fallidos  
**Descripción:** Mantiene los fallos temporales fuera del flujo HTTP y conserva los mensajes que requieren revisión.  
**Usuario involucrado:** Sistema y operador.  
**Precondiciones:** Existe un `NotificationMessage` consumido desde la cola principal.  
**Descripción del flujo principal:**

1. El consumidor valida `schemaVersion`.
2. El consumidor localiza al destinatario y vuelve a verificar sus preferencias.
3. El registry selecciona la estrategia correspondiente.
4. La estrategia obtiene los datos actuales y construye el contenido.
5. El renderer genera HTML y texto plano.
6. El cliente SMTP envía el correo.
7. El consumidor confirma el procesamiento a RabbitMQ.

**Flujos alternativos:**

1.1. Si la versión no es soportada, el sistema mueve el mensaje a DLQ y finaliza el flujo.  
2.1. Si el destinatario no existe, está inactivo o deshabilitó el tipo, el sistema confirma el mensaje sin correo y finaliza el flujo.  
3.1. Si no existe estrategia, el sistema trata el caso como fallo y continúa en el paso 3.2 de este flujo alternativo.  
3.2. Si todavía quedan intentos, el sistema incrementa `attempt`, mueve el mensaje a la cola de espera y regresa al paso 1 del flujo principal después de cinco minutos.  
3.3. Si se alcanzó el máximo, el sistema mueve el mensaje a DLQ y finaliza el flujo.  
4.1. Si no se encuentran los datos de dominio, el sistema continúa en el paso 3.2 del flujo alternativo.  
5.1. Si falla el renderizado, el sistema continúa en el paso 3.2 del flujo alternativo.  
6.1. Si falla SMTP, el sistema continúa en el paso 3.2 del flujo alternativo.

**Postcondiciones:** El correo fue aceptado por SMTP, quedó programado para reintento o fue aislado en DLQ.

## RF-NOT-014

**ID:** RF-NOT-014  
**Título:** Enviar correos transaccionales existentes con identidad visual común  
**Descripción:** Envía bienvenida y recuperación de contraseña usando plantillas HTML y texto plano consistentes con CodeHive.  
**Usuario involucrado:** Usuario registrado o usuario que solicita recuperación.  
**Precondiciones:** El flujo de registro creó un usuario o el flujo de recuperación generó un token válido.  
**Descripción del flujo principal:**

1. El servicio correspondiente solicita el envío con sus datos mínimos.
2. El sistema selecciona `welcome` o `password-reset`.
3. El renderer genera HTML y texto plano en inglés.
4. El cliente SMTP envía el correo desde la cuenta configurada.
5. El flujo llamador continúa según su comportamiento existente.

**Flujos alternativos:**

1.1. Si el registro o la creación del token falla, el sistema no solicita el correo y finaliza el flujo.  
3.1. Si falla el renderizado, el sistema informa el error al flujo llamador y finaliza.  
4.1. Si SMTP falla, el sistema informa el error al flujo llamador y este puede volver al paso 1 según su política.

**Postcondiciones:** El servidor SMTP aceptó el correo o el flujo llamador recibió el error; estos correos no pasan por la cola de notificaciones académicas.

## Requisitos preparados para funciones futuras

### RF-NOT-FUT-001

**ID:** RF-NOT-FUT-001  
**Título:** Notificar reprogramación de tarea  
**Descripción:** Informará a los estudiantes activos cuando un profesor cambie las fechas de una tarea publicada.  
**Usuario involucrado:** Profesor y estudiantes inscritos.  
**Precondiciones:** Existe un endpoint de edición de tareas, la tarea estaba publicada y cambió al menos una fecha.  
**Descripción del flujo principal:**

1. El profesor modifica las fechas de la tarea.
2. El sistema persiste y confirma el cambio.
3. El sistema publica `ASSIGNMENT_RESCHEDULED`.
4. El router selecciona estudiantes activos.
5. El consumidor usa la estrategia ya implementada.
6. El sistema envía las fechas actualizadas.

**Flujos alternativos:**

2.1. Si la actualización falla, el sistema no publica la notificación y vuelve al paso 1 del flujo principal.  
3.1. Si ninguna fecha cambió, el sistema finaliza sin notificar.  
4.1. Si no existen estudiantes activos, el sistema finaliza sin trabajos.

**Postcondiciones:** Los estudiantes aplicables reciben el calendario actualizado. Este requisito permanece pendiente hasta implementar edición de tareas.

### RF-NOT-FUT-002

**ID:** RF-NOT-FUT-002  
**Título:** Notificar retroalimentación docente  
**Descripción:** Informará al estudiante cuando un profesor publique retroalimentación sobre una entrega.  
**Usuario involucrado:** Profesor y estudiante.  
**Precondiciones:** Existe el modelo de retroalimentación y el profesor está autorizado sobre la entrega.  
**Descripción del flujo principal:**

1. El profesor registra retroalimentación.
2. El sistema valida la autorización y persiste el contenido.
3. Después del commit, el sistema publica `FEEDBACK_RECEIVED`.
4. El router selecciona al propietario de la entrega.
5. El consumidor usa la estrategia ya implementada.
6. El sistema envía el enlace a la tarea.

**Flujos alternativos:**

2.1. Si el profesor no está autorizado o el contenido es inválido, el sistema muestra el error y vuelve al paso 1 del flujo principal.  
3.1. Si la transacción se revierte, el sistema no publica la notificación y finaliza el flujo.  
5.1. Si el estudiante deshabilitó el tipo, el sistema descarta el correo y finaliza el flujo.

**Postcondiciones:** El estudiante recibe aviso de la retroalimentación persistida.

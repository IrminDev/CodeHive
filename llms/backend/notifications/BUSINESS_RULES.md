# Restricciones y reglas de negocio de notificaciones

## Propósito

Este documento define las restricciones y reglas de negocio del sistema de
notificaciones por correo de CodeHive. Aplica a preferencias, selección de
destinatarios, eventos académicos, recordatorios, entrega asíncrona y plantillas.

## Alcance

El sistema notifica actividades de grupos, tareas, validaciones y entregas. La
entrega asíncrona se ejecuta dentro de `codehive-backend` mediante un productor y
un consumidor locales conectados a RabbitMQ. No existe un microservicio de
notificaciones separado.

Los correos de bienvenida, recuperación de contraseña y prueba de configuración
utilizan las mismas plantillas y el mismo cliente SMTP, pero se envían de forma
síncrona porque pertenecen a flujos interactivos existentes.

## Reglas generales

1. Toda notificación tiene exactamente un tipo definido en `NotificationType`.
2. Cada tipo pertenece a audiencia `OWNER` o `STUDENT`.
3. Estudiante con `CREATE_GROUP` recibe ambos catálogos; profesor recibe `OWNER`; estudiante sin scope recibe `STUDENT`; admin ninguno.
4. La identidad del usuario que administra preferencias se obtiene del contexto de autenticación; la API no acepta un identificador de usuario proporcionado por el cliente.
5. Todos los tipos disponibles para el rol están habilitados por defecto.
6. Un usuario inactivo no recibe notificaciones, aunque sus preferencias estén habilitadas.
7. El interruptor global `emailEnabled = false` deshabilita todos los tipos individuales.
8. Una preferencia individual deshabilitada impide el envío de ese tipo aunque el interruptor global esté habilitado.
9. Las preferencias se verifican al publicar el mensaje y nuevamente antes de enviar el correo. Por ello, un usuario puede deshabilitar un correo que ya se encuentre pendiente en la cola.
10. La configuración predeterminada usa `America/Mexico_City` y `en-US`.
11. Actualmente solo se admite contenido en inglés y locale `en-US`.
12. Las fechas se presentan usando la zona horaria IANA configurada por el destinatario, pero el identificador de zona no se repite dentro del correo.
13. Cada correo contiene una alternativa HTML y una alternativa de texto plano.
14. Las credenciales y el servidor SMTP son los existentes en `spring.mail.*`; no se crea otro cliente ni otra cuenta.
15. Los eventos de dominio se enrutan después de que la transacción de negocio termina correctamente.
16. Si la transacción de negocio se revierte, su notificación no se publica.

## Catálogo para propietarios

| Tipo | Disparador | Destinatario |
|---|---|---|
| `STUDENT_ENROLLED` | Un estudiante entra mediante código o reactiva su inscripción | Propietario habilitado |
| `STUDENT_LEFT` | Un estudiante sale voluntariamente | Propietario habilitado |
| `STUDENT_ENROLLMENT_CANCELLED` | Administración cancela inscripción por ciclo de vida | Propietario habilitado |
| `ASSIGNMENT_SUBMITTED` | Se crea una entrega definitiva dentro del plazo | Propietario del grupo, si tiene rol `TEACHER` |
| `LATE_ASSIGNMENT_SUBMITTED` | Se crea una entrega definitiva después de `dueDate` y antes de `closeDate` | Propietario del grupo, si tiene rol `TEACHER` |
| `ASSIGNMENT_DUE_SOON` | Una tarea entra en la ventana configurada antes de `dueDate` | Propietario del grupo, si tiene rol `TEACHER` |
| `ASSIGNMENT_CLOSE_SOON` | Una tarea entra en la ventana configurada antes de `closeDate` | Propietario del grupo, si tiene rol `TEACHER` |
| `ASSIGNMENT_VALIDATION_FAILED` | El worker cambia la validación de la tarea a `FAILED` | Autor de la tarea, si tiene rol `TEACHER` |
| `ASSIGNMENT_READY` | El worker cambia la validación de la tarea a `READY` | Autor de la tarea, si tiene rol `TEACHER` |

Reglas adicionales:

1. Una entrega tardía genera `LATE_ASSIGNMENT_SUBMITTED`, no ambos tipos de entrega.
2. Los recordatorios del profesor no dependen de la cantidad de entregas recibidas.
3. Los resultados duplicados del worker no vuelven a producir `ASSIGNMENT_READY` o `ASSIGNMENT_VALIDATION_FAILED` cuando la tarea ya se encuentra en el mismo estado.
4. `GROUP_ACTIVITY_DIGEST` y `NO_SUBMISSIONS_SUMMARY` no forman parte del catálogo.
5. Un propietario estudiante con `CREATE_GROUP` recibe tipos `OWNER`, incluidos recordatorios, además de tipos `STUDENT` por sus inscripciones.

## Catálogo para estudiantes

| Tipo | Disparador | Destinatario |
|---|---|---|
| `ASSIGNMENT_PUBLISHED` | La tarea está `READY` y alcanza `launchDate` | Estudiantes con inscripción `ACTIVE` |
| `ASSIGNMENT_DUE_SOON_NO_SUBMISSION` | Entra en la ventana de `dueDate` y el estudiante no tiene entrega definitiva | Estudiante correspondiente |
| `ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION` | Entra en la ventana de `closeDate` y el estudiante no tiene entrega definitiva | Estudiante correspondiente |
| `ASSIGNMENT_RESCHEDULED` | Cambian las fechas de una tarea publicada | Estudiantes con inscripción `ACTIVE` |
| `SUBMISSION_EVALUATED` | Una ejecución definitiva pasa de `PENDING` a un resultado final | Propietario de la entrega |
| `FEEDBACK_RECEIVED` | El profesor registra retroalimentación | Estudiante de la tarea |
| `REMOVED_FROM_GROUP` | El propietario remueve la inscripción | Estudiante removido |
| `GROUP_ARCHIVED` | El propietario archiva el grupo | Estudiantes con inscripción `ACTIVE` |

Reglas adicionales:

1. Una tarea no se considera publicada hasta estar activa, `READY`, pertenecer a un grupo activo no archivado y haber alcanzado su `launchDate`.
2. Si `launchDate` es nula, la tarea puede publicarse al quedar `READY`.
3. La publicación se envía una sola vez por combinación de tarea y estudiante.
4. Un estudiante con cualquier entrega definitiva para la tarea deja de recibir recordatorios de falta de entrega para esa tarea.
5. Los recordatorios no se envían después de la fecha asociada.
6. Solo la primera transición de una ejecución definitiva desde `PENDING` produce `SUBMISSION_EVALUATED`.
7. `ASSIGNMENT_VALIDATION_DELAYED` no forma parte del catálogo de estudiantes.
8. La edición de fechas, actualización general, cambio de casos, retroalimentación, devolución de calificación y revaluación publican eventos después del commit.

## Preferencias y recordatorios

1. La ausencia de registros de preferencias significa que se utilizan los valores predeterminados.
2. `UserNotificationSettings` mantiene el interruptor global, la zona horaria y el locale.
3. `UserNotificationPreference` solo mantiene excepciones por tipo; no se crean filas para todo el catálogo al registrar un usuario.
4. La combinación `(user_id, notification_type)` es única.
5. `reminderLeadMinutes` solo puede utilizarse en tipos marcados como recordatorio.
6. Los tiempos admitidos son 120, 1440, 2880 y 10080 minutos.
7. El tiempo predeterminado es 1440 minutos para recordatorios del profesor y para el vencimiento del estudiante.
8. El tiempo predeterminado para el cierre del estudiante es 120 minutos.
9. Cambiar el tiempo de anticipación crea una clave de deduplicación diferente. Esto permite recibir un recordatorio correspondiente a la nueva ventana, pero no repetir la misma ventana.
10. Restaurar preferencias elimina los overrides y vuelve a los valores del catálogo; no deshabilita notificaciones globalmente.
11. El correo de prueba se envía bajo solicitud explícita aun cuando `emailEnabled` sea falso.
12. El correo de prueba está limitado a tres solicitudes por cada cinco minutos.

## Programación y deduplicación

1. El scheduler se ejecuta cada diez minutos de manera predeterminada.
2. El scheduler consulta tareas que puedan requerir acciones dentro de los siguientes siete días.
3. Los grupos archivados o eliminados lógicamente se excluyen de publicaciones y recordatorios.
4. Las tareas eliminadas lógicamente o con validación diferente de `READY` se excluyen.
5. La deduplicación persistente se utiliza únicamente para trabajos que el scheduler puede descubrir nuevamente.
6. `NotificationDispatchLog` registra claves de publicación y recordatorio; no almacena el contenido ni representa una cola de correos pendientes.
7. RabbitMQ es la fuente de verdad para trabajos de correo pendientes.
8. No debe eliminarse un registro de deduplicación para reintentar un fallo SMTP; el reintento ocurre con el mismo mensaje en RabbitMQ.

Formatos de clave implementados:

- Publicación: `ASSIGNMENT_PUBLISHED:{assignmentId}:{recipientId}`.
- Recordatorio: `{notificationType}:{assignmentId}:{recipientId}:{leadMinutes}`.

## Entrega, reintentos y errores

1. Todo mensaje nuevo usa `schemaVersion = 2`, `attempt = 0` y puede incluir `resourceId` para identificar el recurso exacto que disparó el correo.
2. El consumidor acepta versiones `1` y `2`. Un mensaje con otra versión pasa directamente a la cola de errores; un mensaje v1 usa contenido reducido cuando no existe contexto exacto.
3. Si el destinatario no existe, está inactivo o deshabilitó el tipo, el consumidor descarta el mensaje sin enviar correo.
4. Si falla la consulta de datos, la construcción del contenido o SMTP, el mensaje incrementa `attempt`.
5. Un mensaje fallido espera cinco minutos antes de regresar a la cola principal.
6. El máximo predeterminado es cinco intentos de procesamiento.
7. Al alcanzar el máximo, el mensaje pasa a `codehive_notification_email_dlq`.
8. Un mensaje en DLQ requiere inspección y decisión operativa; no se reenvía automáticamente.
9. La garantía es de entrega al menos una vez.
10. SMTP y RabbitMQ no comparten una transacción distribuida. Si el proceso termina después de que SMTP acepta el correo y antes del acuse de RabbitMQ, puede existir un duplicado excepcional.
11. No se garantiza orden global entre notificaciones diferentes.

## Reglas de plantillas

1. Todo correo debe tener asunto, badge, título, mensaje, sección de detalles y acción principal.
2. Las plantillas deben conservar la paleta visual de CodeHive: azules `#00509D`, `#003F88`, `#00296B` y amarillo `#FDC500`.
3. El contenido debe ser entendible sin cargar imágenes externas.
4. El texto plano debe contener la misma información esencial y los enlaces completos.
5. Los valores variables se procesan mediante Thymeleaf para evitar concatenar HTML de dominio.
6. Los correos de notificación deben incluir un enlace a las preferencias.
7. Los enlaces se construyen a partir de `frontend.url`.
8. Los correos de recuperación no deben revelar información adicional sobre la cuenta.

## Fuera del alcance actual

- Notificaciones push, móviles, WebSocket o dentro de la aplicación.
- Digests periódicos.
- Preferencias por grupo.
- Preferencias por horario silencioso.
- Locales diferentes de `en-US`.
- Procesamiento en un microservicio independiente.
- Reenvío automático o interfaz administrativa para la DLQ.
- Publicación de `ASSIGNMENT_RESCHEDULED` hasta implementar edición de fechas.
- No existen publicadores académicos pendientes para edición, feedback o calificación.

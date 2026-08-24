# Descripción técnica del sistema de notificaciones

## Objetivo arquitectónico

El sistema desacopla los cambios académicos del envío SMTP sin introducir otro
despliegue Java. El productor, consumidor, scheduler, estrategias y cliente SMTP
viven dentro de `codehive-backend`; RabbitMQ mantiene los trabajos pendientes y
permite reintentos.

```text
Servicio de dominio
  └─ NotificationDomainEvent
      └─ AFTER_COMMIT: NotificationDomainEventRouter
          └─ NotificationDispatchService
              └─ NotificationProducer
                  └─ RabbitMQ
                      └─ NotificationEmailListener
                          └─ NotificationStrategyRegistry
                              └─ estrategia de grupo, tarea o entrega
                                  └─ EmailTemplateRenderer
                                      └─ MailSenderService
                                          └─ Google SMTP
```

Los recordatorios sustituyen al servicio de dominio por
`NotificationReminderScheduler`, pero utilizan el mismo dispatch, cola,
consumidor, estrategias y SMTP.

## Componentes

### Preferencias

| Componente | Responsabilidad |
|---|---|
| `UserNotificationSettings` | Configuración global de un usuario |
| `UserNotificationPreference` | Override para un tipo específico |
| `NotificationType` | Catálogo, audiencia, marca de recordatorio y anticipación predeterminada |
| `NotificationPreferenceService` | Merge de defaults, validación, actualización, reset y resolución efectiva |
| `NotificationPreferenceController` | API autenticada de preferencias y correo de prueba |
| `UserNotificationSettingsRepository` | Persistencia de configuración global |
| `UserNotificationPreferenceRepository` | Persistencia y búsqueda de overrides |

La configuración es dispersa: no existe una fila por cada tipo habilitado. La
ausencia de una fila equivale al default del enum.

### Eventos y selección de destinatarios

| Componente | Responsabilidad |
|---|---|
| `NotificationDomainEvent` | Evento interno con IDs de contexto, tipo y fecha |
| `NotificationDomainEventPublisher` | Abstracción sobre `ApplicationEventPublisher` |
| `NotificationDomainEventRouter` | Consume después del commit y resuelve destinatarios |
| `NotificationDispatchService` | Verifica preferencias, deduplica cuando aplica y publica |
| `NotificationDispatchLog` | Registra claves de scheduler ya despachadas |

`NotificationDomainEventRouter.route` usa
`@TransactionalEventListener(phase = AFTER_COMMIT, fallbackExecution = true)` y
abre una transacción `REQUIRES_NEW` de solo lectura. `fallbackExecution` permite
procesar eventos originados en listeners que ya terminaron su transacción
individual de repositorio.

Resolución implementada:

- Inscripción o salida: propietario del grupo.
- Validación lista o fallida: autor de la tarea.
- Entrega normal o tardía: propietario del grupo de la tarea.
- Remoción: estudiante indicado por el evento.
- Archivo: inscripciones activas del grupo.
- Publicación o reprogramación: inscripciones activas del grupo.
- Evaluación: estudiante propietario de la entrega.
- Feedback y calificación: estudiante de `StudentAssignmentWork`.

### Scheduler

`NotificationReminderScheduler` se habilita con `SchedulingConfig` y
`@EnableScheduling`.

Cada ejecución:

1. Obtiene `Instant.now()`.
2. Busca tareas `READY`, activas y pertenecientes a grupos activos no archivados.
3. Publica tareas cuya fecha de lanzamiento ya llegó.
4. Busca tareas con `dueDate` o `closeDate` dentro de siete días.
5. Evalúa ventanas del profesor.
6. Obtiene estudiantes activos.
7. Omite estudiantes con una entrega definitiva.
8. Evalúa ventanas del estudiante.
9. Usa claves persistentes para evitar redescubrimientos duplicados.

Consultas relevantes:

- `AssignmentRepository.findReadyActiveForNotifications`.
- `AssignmentRepository.findReminderCandidates`.
- `GroupEnrollmentRepository.findByGroupIdAndStatusOrderByJoinedAtAsc`.
- `SubmissionRepository.existsByAssignmentIdAndStudentId`.

Configuración:

```properties
notification.reminder.fixed-delay-ms=600000
notification.reminder.initial-delay-ms=60000
```

En pruebas, el delay inicial se incrementa para que el scheduler no compita con
los tests de integración.

## Modelo persistente

### `user_notification_settings`

| Campo | Tipo conceptual | Restricción |
|---|---|---|
| `id` | UUID | PK generada |
| `user_id` | UUID | FK, único, no nulo |
| `email_enabled` | Boolean | No nulo, default lógico `true` |
| `timezone` | String(64) | Zona IANA, no nula |
| `locale` | String(10) | No nulo, actualmente `en-US` |
| `created_at` | LocalDateTime | No nulo, inmutable |
| `updated_at` | LocalDateTime | No nulo |

### `user_notification_preferences`

| Campo | Tipo conceptual | Restricción |
|---|---|---|
| `id` | UUID | PK generada |
| `user_id` | UUID | FK, no nulo |
| `notification_type` | Enum String | No nulo |
| `enabled` | Boolean | No nulo |
| `reminder_lead_minutes` | Integer | Nulo para tipos no recordatorio |
| `created_at` | LocalDateTime | No nulo, inmutable |
| `updated_at` | LocalDateTime | No nulo |

Existe un unique constraint sobre `(user_id, notification_type)`.

### `notification_dispatch_log`

| Campo | Tipo conceptual | Restricción |
|---|---|---|
| `id` | UUID | PK generada |
| `deduplication_key` | String(255) | Único, no nulo |
| `dispatched_at` | Instant | No nulo, inmutable |

Esta tabla no contiene payload, destinatario separado, estado ni intentos. Su
único objetivo es evitar que el scheduler vuelva a crear el mismo trabajo.

## Contrato HTTP

Base: `/api/notification-preferences`.

### `GET /api/notification-preferences`

Respuesta `NotificationSettingsDTO`:

```json
{
  "emailEnabled": true,
  "timezone": "America/Mexico_City",
  "locale": "en-US",
  "preferences": [
    {
      "type": "ASSIGNMENT_PUBLISHED",
      "enabled": true,
      "reminderLeadMinutes": null
    }
  ]
}
```

### `PUT /api/notification-preferences`

```json
{
  "emailEnabled": true,
  "timezone": "America/Mexico_City",
  "locale": "en-US",
  "preferences": [
    {
      "type": "ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION",
      "enabled": true,
      "reminderLeadMinutes": 120
    }
  ]
}
```

La lista representa los overrides a crear o actualizar; los tipos omitidos
conservan su override anterior o el default si nunca tuvieron uno.

### Otros endpoints

- `POST /reset`: elimina settings y overrides del principal.
- `POST /test-email`: obtiene correo y nombre desde `AuthService`; tiene
  `@RateLimit(limit = 3, duration = 300)`.

Todos los endpoints usan `Authentication.getName()` y no aceptan `userId`.

## Contrato de RabbitMQ

### Payload `NotificationMessage`

```text
notificationId : UUID
type           : NotificationType
recipientId    : UUID
actorId        : UUID?
groupId        : UUID?
assignmentId   : UUID?
submissionId   : UUID?
resourceId     : UUID?
occurredAt     : Instant
attempt        : int
schemaVersion  : int
```

`resourceId` identifica el recurso exacto cuando existe: inscripción, actualización
de tarea, revisión del conjunto de pruebas, ejecución, feedback o calificación. Los mensajes v1 no lo contienen y
deben generar una variante reducida sin consultar un recurso "más reciente" que
pueda pertenecer a otro evento.

### Topología

```text
codehive.notification.exchange
  notification.email
    -> codehive_notification_email_queue

codehive.notification.retry.exchange
  notification.email.retry
    -> codehive_notification_email_retry_queue
       TTL 300000 ms
       DLX -> codehive.notification.exchange / notification.email

codehive.notification.exchange
  notification.email.failed
    -> codehive_notification_email_dlq
```

Todos los exchanges y queues son durables. La retry queue utiliza
`x-message-ttl`, `x-dead-letter-exchange` y `x-dead-letter-routing-key`.

`NotificationProducer` usa `RabbitTemplate` con mensajes JSON, routing keys
explícitas y publicación mandatory. La aplicación habilita publisher confirms y
returns:

```properties
spring.rabbitmq.publisher-confirm-type=correlated
spring.rabbitmq.publisher-returns=true
```

## Consumo y política de fallos

`NotificationEmailListener` consume la cola principal.

Orden de procesamiento:

1. Validar versión `1` o `2`.
2. Consultar el usuario.
3. Evaluar `NotificationPreferenceService.isEnabled`.
4. Resolver estrategia.
5. Construir `NotificationEmailContent`.
6. Enviar con `MailSenderService`.

Ante una excepción se crea `message.nextAttempt()`. Si el nuevo valor es menor
que `notification.email.max-attempts`, se publica en retry. En caso contrario se
publica en DLQ.

Configuración:

```properties
notification.email.max-attempts=5
```

Con el default, se procesan los intentos numerados 0, 1, 2, 3 y 4. Después del
fallo del intento 4, el mensaje pasa a DLQ con `attempt = 5`.

## Patrón Strategy

Interfaz:

```text
NotificationStrategy
  supportedTypes(): Set<NotificationType>
  build(NotificationMessage, User): NotificationEmailContent
```

Implementaciones:

- `GroupNotificationStrategy`: inscripción, salida, remoción y archivo.
- `AssignmentNotificationStrategy`: publicación, reprogramación, validación y recordatorios.
- `SubmissionNotificationStrategy`: entrega y evaluación.
- `StudentReviewNotificationStrategy`: feedback publicado y calificación devuelta.

`NotificationStrategyRegistry` construye un `EnumMap` al iniciar la aplicación.
El startup falla si:

- Dos estrategias declaran el mismo tipo.
- Un tipo del enum no está declarado por ninguna estrategia.

Esto obliga a que todo valor nuevo del catálogo tenga una implementación
explícita.

## Plantillas y SMTP

`EmailTemplateConfig` crea un `SpringTemplateEngine` con dos resolvers:

- `templates/email/html/**` en modo HTML.
- `templates/email/text/**` en modo TEXT.

`EmailTemplateRenderer` agrega:

- `frontendUrl`.
- `preferencesUrl = {frontend.url}/notifications`.

Cada valor de `NotificationType` tiene un par dedicado bajo
`email/{html,text}/notifications/{notification-type}`. El renderer valida todos
los pares al iniciar, agrega hechos tipados y callouts opcionales, y reutiliza un
shell HTML para branding y accesibilidad. `test-notification` también tiene su
propio par. `welcome` y `password-reset` conservan sus plantillas transaccionales.

`MailSenderService` construye un `MimeMessage` con
`MimeMessageHelper.setText(text, html)`. Esto produce una alternativa de texto y
otra HTML en el mismo correo. El remitente proviene de `spring.mail.username`.

Los estilos HTML son inline para compatibilidad con clientes de correo. No se
requieren imágenes externas.

## Integraciones con el dominio

### `GroupService`

- `join` publica `STUDENT_ENROLLED`.
- `leave` publica `STUDENT_LEFT`.
- `removeStudent` publica `REMOVED_FROM_GROUP`.
- `setArchived(true)` publica `GROUP_ARCHIVED`.

Desarchivar no produce correo.

### `ExecutionRequestService`

Al persistir una entrega definitiva publica exactamente uno:

- `ASSIGNMENT_SUBMITTED`.
- `LATE_ASSIGNMENT_SUBMITTED`.

Las ejecuciones de práctica no producen estos eventos.

### `ExecutionResultService`

Publica `SUBMISSION_EVALUATED` solo si:

- La ejecución tenía estado `PENDING`.
- La ejecución pertenece a una `Submission`.

### `TestGenerationResultListener`

- La transición a `READY` publica `ASSIGNMENT_READY`.
- La transición a `FAILED` publica `ASSIGNMENT_VALIDATION_FAILED`.
- Una tarea lista con lanzamiento inmediato publica `ASSIGNMENT_PUBLISHED`.
- Los resultados repetidos en el mismo estado no repiten la notificación de validación.

La publicación inmediata y el scheduler comparten la misma clave persistente,
por lo que no duplican el correo de lanzamiento.

## Semántica transaccional y garantías

1. Los eventos de servicios transaccionales se manejan después del commit.
2. La resolución de destinatarios utiliza una transacción nueva de lectura.
3. El registro de deduplicación usa `REQUIRES_NEW`.
4. La publicación Rabbit y el commit PostgreSQL no forman una transacción distribuida.
5. La aceptación SMTP y el ack Rabbit tampoco forman una transacción distribuida.
6. La semántica observable es at-least-once, con deduplicación explícita para trabajos programados.
7. Los cambios académicos nunca se revierten por un fallo SMTP ocurrido en el consumidor.

## Observabilidad y operación

Logs operativos usan el prefijo `[NOTIFICATION]` e incluyen:

- Tipo.
- Destinatario por UUID.
- `notificationId`.
- Número de intento.

Para investigar un fallo:

1. Buscar el `notificationId` en logs.
2. Revisar profundidad de main queue y retry queue.
3. Inspeccionar `codehive_notification_email_dlq`.
4. Validar usuario, preferencias y existencia del agregado.
5. Validar conectividad y credenciales SMTP.
6. Decidir manualmente si el mensaje debe corregirse, descartarse o republicarse.

No existe todavía una interfaz de administración de DLQ.

## Seguridad y privacidad

- El cliente no controla el destinatario de eventos académicos.
- El destinatario se resuelve con relaciones persistidas.
- La API de preferencias siempre opera sobre el principal.
- Los correos contienen información académica resumida y enlaces, no soluciones de referencia ni casos privados.
- Las plantillas escapan variables mediante Thymeleaf.
- Los logs deben usar UUID y tipo; no deben registrar cuerpo, contraseña temporal, token de recuperación ni código fuente.
- El correo de recuperación mantiene el comportamiento anti-enumeración del flujo existente.

## Pruebas

Cobertura enfocada:

- `NotificationPreferenceServiceTest`: defaults, separación por rol, tiempos permitidos y reset.
- `NotificationEmailListenerTest`: envío, omisión por preferencia, retry y versión incompatible.
- `EmailTemplateConfigTest`: renderizado HTML/texto y estilo de marca.
- `OpenApiCoverageIntegrationTest`: documentación del controller.
- Suite de integración existente: verifica que las dependencias nuevas no rompan grupos, tareas, ejecuciones, auth ni recuperación.

El scheduler usa un delay inicial mayor bajo el profile `test` para mantener las
pruebas determinísticas y evitar conexiones RabbitMQ en segundo plano.

## Extensión

Para agregar un tipo:

1. Añadirlo a `NotificationType` con rol y metadata de recordatorio.
2. Declararlo en exactamente una estrategia.
3. Implementar su `NotificationEmailContent`.
4. Publicar un evento después de la transacción propietaria o añadir lógica al scheduler.
5. Definir si requiere deduplicación persistente.
6. Añadir pruebas de audiencia, preferencias, contenido y errores.
7. Actualizar `BUSINESS_RULES.md` y `REQUIREMENTS.md`.

Para activar `ASSIGNMENT_RESCHEDULED`, el futuro servicio de edición debe
comparar fechas anteriores y nuevas y publicar después del commit. Para activar
`FEEDBACK_RECEIVED` se publica después de persistir y autorizar la
retroalimentación asociada a `StudentAssignmentWork`.

# Estadísticas de uso de IA — implementación

## Decisiones aprobadas

- Sin importes monetarios ni estimaciones de facturación.
- Docente propietario ve conteos de fallos/bloqueos por alumno, sin contenido ni intención.
- Estudiante conserva lectura de consumo propio tras salir, archivar o eliminar lógicamente grupo.
- Administración requiere rol ADMIN y CHECK_ANALYTICS; identificar/filtrar usuarios requiere además VIEW_USERS.
- Retención de metadatos durante horizonte del ledger. Alcance exclusivo de eliminación lógica;
  no se implementa eliminación física, anonimización ni una nueva política para ese caso.
- No se conceden scopes nuevos automáticamente.

## Instrumentación y privacidad

`assistant_model_calls` es única fuente técnica. Columnas antiguas de proveedor/modelo/tokens
en `assistant_interactions` siguen por compatibilidad; no se alimentan ni se suman.
`requested_assistance_level` es snapshot nuevo, sin backfill. Regeneraciones se derivan de
llamadas de generación realmente iniciadas, incluyendo interacciones fallidas.

Gateway recibe interacción, etapa, intento y versión explícitos. Inicio se persiste dentro de
executor admitido, en transacción corta independiente, antes de llamar proveedor. Si inicio
falla, no transmite ni cobra. Fallo de escritura final conserva inicio para conciliación y
registra únicamente ID operacional. SDK mantiene `spring.ai.retry.max-attempts=1`.
Un registro mide una invocación de `ChatModel.call`, no una estimación de requests HTTP internos.

Timeout del solicitante es marca separada. Resultado tardío puede completar metadatos, sin
retornar texto ni cobrar interacción cancelada/fallida. Finalización es idempotente y no
sobrescribe resultados terminales. Job marca STARTED de más de diez minutos como UNKNOWN,
sin reenviar llamadas; finalización tardía puede resolver UNKNOWN. Calls de diagnóstico sin
interacción (pruebas sintéticas del gateway) no forman parte del uso educativo.

No se guardan prompts, contexto, código, cuerpos HTTP ni texto generado en telemetría.
Archivo/eliminación lógica conserva asociaciones y consumo; purga existente elimina texto.

## Esquema de desarrollo

Aplicar [AI_USAGE_DEV_SCHEMA.sql](AI_USAGE_DEV_SCHEMA.sql) sobre tablas existentes.
Script aditivo e idempotente: tabla de llamadas, snapshot, índices, checks y restricciones
existentes del asistente. No borra base, historial ni cuota. No requiere Flyway para este cambio.

## Contrato HTTP

Endpoints GET del plan están implementados en tres controladores por audiencia. Respuestas
usan `SuccessResponse<T>`; acceso se valida antes de agregar. Profesor usa propiedad del grupo,
como métricas existentes; scope analítico no concede acceso docente a grupos ajenos.

- Resumen: `generatedAt`, `filters`, `instrumentationStartedAt`, `educational`, `technical`,
  `trend`, `currentPolicy`, `label`.
- Tablas: mismos metadatos, `rows: PageResponse<Row>`. Cada fila conserva cuota por asignación
  en `quota`, separada de solicitudes/respuestas filtradas.
- Modelos: mismos metadatos y `rows` por proveedor, modelo configurado/reportado y etapa.
- `/api/assistant-usage/owned-groups` devuelve IDs, nombres y lifecycle de grupos propios,
  incluidos archivados/eliminados, para selector histórico docente.

Filtros: `from`, `to` son instantes UTC `[from,to)`. Predeterminado: últimos 30 días.
`lifetime=true` produce agregado de por vida sin serie; incompatible con fechas explícitas.
Serie diaria completa con días sin actividad, máximo rango 366 días. Llamadas se agrupan por
su propio inicio, independiente del inicio de solicitud. Estados reflejan resultado actual.

Tablas: `page>=0`, `size=1..100` (20 predeterminado), `search` hasta 200 caracteres,
`sort=label|requests|responses|lastActivity`, `direction=ASC|DESC`. UUID desempata orden.
Búsqueda filtra filas, no totales del resumen. Rangos, páginas y órdenes inválidos devuelven 400.
Administración acepta `userId`, `groupId`, `assignmentId`, `provider`, `model`; IDs incompatibles
se deniegan. Proveedor/modelo filtran solo ledger técnico, no solicitudes educativas.

Cada fuente se agrega antes de combinar resultados; no hay join interacción × llamadas que
multiplique solicitudes/cuota. Tablas incluyen padrón activo sin uso y antiguos participantes
con actividad. Resumen general conserva tareas/grupos eliminados lógicamente. Personal solo
lista asignaciones con conversación propia o actualmente publicadas para inscripción activa.
GET no recupera leases ni escribe metadatos. Cada respuesta tiene timestamp propio;
no se promete snapshot perfecto entre endpoints.

Tokens son Long anulables; total del proveedor se conserva aunque difiera de entrada+salida.
Cobertura incluye llamadas medidas, desconocidas, resultados inciertos e histórico sin
instrumentación. Nunca se reconstruyen llamadas/tokens a partir de intentos ni se presenta
cero donde falta medición. Primera llamada registrada es referencia de comienzo de medición;
no demuestra cobertura retroactiva ni consumo anterior nulo.

## Frontend

- `/teacher/analytics?section=ai`: selector histórico propio, rango, resumen, tendencia,
  asignaciones/alumnos y detalle de asignación con cuota de por vida. Analytics académico sigue
  disponible. Grupo y edición de asignación incluyen enlaces contextuales.
- `/ai-usage`: total personal, grupos, desglose por asignación y enlace a conversación propia.
  Sidebar, panel del asistente y métricas personales incluyen acceso contextual.
- `/admin/ai-usage`: resumen global, tabla por usuario con VIEW_USERS y sección por modelo/etapa.
  Detalle de usuario incorpora pestaña AI usage, con grupos/asignaciones.

Componentes compartidos bajo `features/assistant-usage`; clientes autenticados existentes.
Filtros/página/búsqueda/orden viven en URL. Cambios abortan requests anteriores y rechazan
respuestas obsoletas; cambio de identidad remonta estado. Sin polling de estadísticas.
Refresh explícito y evento local tras entrega educativa completada. Tokens quedan en sección
secundaria, columnas técnicas opcionales; UI mantiene idioma inglés existente.
Gráfica Recharts con estilos de línea distintos, leyenda/unidades UTC y alternativa tabular.
Tablas permiten desplazamiento horizontal en móvil; controles tienen etiquetas y foco nativo.

## Verificación

- Suite backend: 428 pruebas (incluye seis pruebas nuevas de alcance/fechas/scopes).
- PostgreSQL: 25 pruebas; fixtures UUID fijos, HTTP real por rol/scopes, fan-out, histórico,
  cuota, límites UTC, tokens ausentes/cero/grandes, paginación, archivo y concurrencia existente.
- Frontend: 37 pruebas; seis nuevas de cobertura, paginación, URL, respuestas obsoletas,
  scopes, 403/retry y cuota histórica. `npm run typecheck` y `npm run build`.
- `EXPLAIN ANALYZE`: fixture sintética con 20 mil solicitudes y 60 mil llamadas.
  Agregados educativos/técnicos y tabla completaron en 272 ms en corrida local;
  consulta selectiva de llamadas utilizó `idx_assistant_call_started`, 216 filas, 0.071 ms.
  Son mediciones de prueba, no SLA ni predicción de producción. No añadir índices extra
  sin medir consultas reales, distribución de usuarios/grupos y hardware de despliegue.

Verificación automática con datos sintéticos; no se realizaron llamadas a proveedor real,
no se reinició base existente y no se modificó worker. Backend aislado también se comprobó mediante login real y GET con cuentas sintéticas de
los tres roles. Revisión visual no pudo completarse: herramienta de navegador devuelve
lista vacía de navegadores disponibles. Queda pendiente revisión visual en entorno con navegador.

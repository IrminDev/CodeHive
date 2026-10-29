# Evidencias CH4-RNF1–CH4-RNF8

Ejecutar desde raíz de CodeHive, en misma terminal. Requiere `curl`, `jq`, Python 3 y contenedor PostgreSQL `db`. Sustituir valores de preparación; no adjuntar JWT ni credenciales en capturas. Los POST válidos pueden consumir cuota y llamar al proveedor. Para archivo/eliminación, usar grupo de demostración: esas acciones borran textos.

Los comandos siguientes son guía para ejecutar y capturar; no constituyen resultados de pruebas ya ejecutadas. Las consultas SQL muestran datos reales; los tests complementan garantías que una captura de datos no demuestra.

## Preparación

`ASSIGNMENT_ID`: tarea con IA habilitada, abierta, validada y con lenguaje JAVA permitido. Estudiante A inscrito y con cuota. Estudiante B distinto, con conversación propia en esa tarea. `INTERACTION_A`: ID de interacción de A, obtenido en Network o historial. `FOREIGN_ASSIGNMENT_ID`: tarea de grupo al que A no tiene acceso. `GROUP_ID`: grupo de demostración de `ASSIGNMENT_ID`.

```bash
export API='http://localhost:8080'
export STUDENT_A_JWT='eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJoZXJuYW5kZXpqaW1lbmV6aXJtaW4rc3R1ZGVudEBnbWFpbC5jb20iLCJpYXQiOjE3OTI5ODcxMDEsImV4cCI6MTc5MzA3MzUwMSwicm9sZSI6IlNUVURFTlQiLCJ0b2tlblZlcnNpb24iOjIsInVzZXJJZCI6IjRmNGNlZWMxLTM1ODQtNDJiMS1iNjYyLTM5ZDVhYzY4MDcyNyJ9.OVRJ84vB0CaTvnNSgd6jZEmZWGew_yDrPK35em3zdG5G4Lrv2rNkGMyo4pQLBbf8C6zfBcLlFjy5lpApUTVnUw'
export STUDENT_B_JWT='eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJoZXJuYW5kZXpqaW1lbmV6aXJtaW4rc3R1ZGVudDFAZ21haWwuY29tIiwiaWF0IjoxNzkyOTg3MjAzLCJleHAiOjE3OTMwNzM2MDMsInJvbGUiOiJTVFVERU5UIiwidG9rZW5WZXJzaW9uIjowLCJ1c2VySWQiOiJiZjhhNGJiNy1hZjE1LTQ1OTYtOTQ5My00YTBiNzYxNzU4NzUifQ.PgTrfMpiqy1dTKJeMEsxh6N87zn6EJ-Yn7MBrZFymrNb2IoxNRrrw3I5otGr3lbuo9l6yBARfbAMcTjrxzPIPg'
export TEACHER_JWT='eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJoZXJuYW5kZXpqaW1lbmV6aXJtaW4rdGVhY2hlckBnbWFpbC5jb20iLCJpYXQiOjE3OTI5ODcxNzMsImV4cCI6MTc5MzA3MzU3Mywicm9sZSI6IlRFQUNIRVIiLCJ0b2tlblZlcnNpb24iOjAsInVzZXJJZCI6IjBiNjAzNTlmLWQ0NGMtNGJhZC1iZjA0LTI3OTU1YzY5N2YwOSJ9.c4ZW0ipVkUm1Y5d_s_mcczV7rcVfIL8xIsKkD-HqkE79K3V6xT_0hdzfgE3bgaCUfodMEl8qfxhqf6eUsC1jhQ'
export ADMIN_JWT='eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkBjb2RlaGl2ZS5jb20iLCJpYXQiOjE3OTI5ODcwNDksImV4cCI6MTc5MzA3MzQ0OSwicm9sZSI6IkFETUlOIiwidG9rZW5WZXJzaW9uIjowLCJ1c2VySWQiOiJmY2JkNmI2Ni00MTQwLTQ4ZWEtODViZS01N2FhY2ZhNjlkNjQifQ.tSXMLQPwqxuUm3KCqBbNCXUSV5DFUq_krLA92Pj9KOrKaGpO1F2CzP97jlK_0OqFvq05lQOSI-_m5MAbeVffxg'
export ASSIGNMENT_ID='f8db7bd0-846c-4fcf-a78c-540d40bbf41e'
export FOREIGN_ASSIGNMENT_ID='415b1fd8-a13b-4366-9b06-a460aee4eaed'
export INTERACTION_A='5b67bdec-82e5-4a8c-be38-d1f413e5390f'
export GROUP_ID='c66977ee-b53e-4e26-b681-9d7c630c47d6'

export ASSISTANT_URL="$API/api/assignments/$ASSIGNMENT_ID/assistant"
mkdir -p /tmp/codehive-ch4-evidence
python3 - <<'PY'
import json, uuid
from pathlib import Path
payload = {
    'clientRequestId': str(uuid.uuid4()),
    'message': '¿Qué es una variable? Explica únicamente el concepto general.',
    'language': 'JAVA',
    'includeEditorCode': False,
    'includeExecutionContext': False,
    'editorCode': None,
}
Path('/tmp/codehive-ch4-evidence/request.json').write_text(json.dumps(payload))
PY
```

Tests: adjuntar resumen de terminal y página de clase/método en `codehive-backend/build/reports/tests/test/index.html`. `--rerun-tasks` evita presentar `UP-TO-DATE` como ejecución nueva. Tests normales usan perfil `test` y modelos simulados; no acreditan comportamiento semántico de Gemini real.

## CH4-RNF1 — Control de acceso

Sin autenticación: capturar denegación HTTP (configuración de seguridad puede responder 401 o 403).

```bash
curl -sS -i "$ASSISTANT_URL/interactions/$INTERACTION_A"
curl -sS -i -H 'Content-Type: application/json' \
  --data-binary @/tmp/codehive-ch4-evidence/request.json "$ASSISTANT_URL/interactions"
```

Docente/admin: consultas y generaciones denegadas por rol, HTTP 403.

```bash
for token in "$TEACHER_JWT" "$ADMIN_JWT"; do
  curl -sS -i -H "Authorization: Bearer $token" "$ASSISTANT_URL/interactions"
  curl -sS -i -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    --data-binary @/tmp/codehive-ch4-evidence/request.json "$ASSISTANT_URL/interactions"
done
```

A lee interacción propia: 200. B intenta leer misma interacción: 404, sin texto de A. A intenta generar en tarea ajena existente: 403 (`ASSISTANCE_UNAVAILABLE`) con asistente global habilitado; UUID inexistente: 404.

```bash
curl -sS -i -H "Authorization: Bearer $STUDENT_A_JWT" "$ASSISTANT_URL/interactions/$INTERACTION_A"
curl -sS -i -H "Authorization: Bearer $STUDENT_B_JWT" "$ASSISTANT_URL/interactions/$INTERACTION_A"
curl -sS -i -H "Authorization: Bearer $STUDENT_A_JWT" -H 'Content-Type: application/json' \
  --data-binary @/tmp/codehive-ch4-evidence/request.json \
  "$API/api/assignments/$FOREIGN_ASSIGNMENT_ID/assistant/interactions"
```

Historial propio aun después de abandonar inscripción: test y captura de `/assignment/UUID_TAREA/assistant-history` como estudiante A.

```bash
(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantControllerIntegrationTest.studentWithOwnConversationCannotReadAnotherStudentsInteraction' \
  --tests '*AssistantControllerIntegrationTest.ownHistoryRemainsReadableAfterLeavingEnrollment' \
  --tests '*AssistantServiceTest.nonStudentsCannotReadAvailabilityOrAsk')
```

Código: [AssistantController](../../codehive-backend/src/main/java/com/github/codehive/controller/AssistantController.java), `@PreAuthorize`; [AssistantHistoryService](../../codehive-backend/src/main/java/com/github/codehive/service/AssistantHistoryService.java), `requireStudent`, `requireConversation`, `get`; [AssistantTransactionService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java), `reserve`, validación de elegibilidad. No existe parámetro para elegir conversación ajena: identidad se deriva del JWT.

## CH4-RNF2 — Privacidad del contexto

UI: estudiante → `/assignment/UUID_TAREA` → panel AI help → aviso de consentimiento y opciones **Code** / **Last run**, inicialmente apagadas. Capturar aviso y Network → POST → Request Payload para cada opción. Payload del navegador acredita selección; no acredita por sí solo contenido enviado por backend al proveedor.

Proyección pública, consentimiento, exclusión de diagnóstico privado y límites de código:

```bash
(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantContextServiceTest')
```

Tests concretos: `optOutSendsOnlyPublicAssignmentAndDoesNotReadExecutionArtifacts`, `optedInDefinitiveResultNeverExposesHiddenOutputOrStderr`, `codeAtMaximumLengthIsIncludedOnlyWithOptIn`, `oversizedOrUnconsentedCodeIsRejected`, `erasedAndMorePermissiveHistoryNeverReentersPrompt`.

Captura de código con números de línea para 32768 UTF-16 y 65000 del contexto serializado:

```bash
rg -n -C 4 '32_768|PublicAssignment|publicAssignment\(' \
  codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantContextService.java
rg -n -C 4 'safeContext.length\(\) > 65_000' \
  codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantGuardrailService.java
```

Secciones: `AssistantContextService.build`, `publicAssignment`, `executionContext`; `AssistantGuardrailService.generate`. `String.length()` cuenta unidades UTF-16. Contexto público usa DTO propio; no serializa entidad completa ni solución de referencia. El límite de 65000 aplica al JSON de `Context`, no a toda la solicitud al proveedor. No se encontró test dedicado a frontera exacta de 65000; adjuntar guardia de código, sin atribuir esa cobertura a tests existentes.

## CH4-RNF3 — Conservación y eliminación de contenido

Ejecutar consulta antes de archivar, después de archivar y después de desarchivar. Repetir con otro grupo para eliminación lógica. UI docente: `/teacher/groups/UUID_GRUPO` → acciones de archivar/desarchivar/eliminar. Conservar capturas de cada estado.

```bash
docker exec -i -e EVIDENCE_GROUP_ID="$GROUP_ID" db sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -P pager=off --set=group_id="$EVIDENCE_GROUP_ID"' <<'SQL'
SELECT c.id AS conversation_id, c.student_id, i.id AS interaction_id,
       i.sequence_number, i.status, i.quota_charged, i.content_erased,
       i.student_message IS NULL AS pregunta_borrada,
       i.assistant_response IS NULL AS respuesta_borrada,
       i.created_at, i.completed_at, i.failure_code
FROM assistant_interactions i
JOIN assistant_conversations c ON c.id = i.conversation_id
JOIN assignments a ON a.id = c.assignment_id
WHERE a.group_id = :'group_id'::uuid
ORDER BY c.id, i.sequence_number;
SQL
```

Después del archivo/eliminación: textos NULL, `content_erased=true`, pendientes cancelados; interacciones cobradas conservan `quota_charged=true`. Desarchivar no restaura textos. Sin pendiente al archivar, esa captura no prueba cancelación: usar test siguiente.

```bash
(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantTransactionServiceIntegrationTest.archiveCancelsPendingAndPreventsLateDelivery' \
  --tests '*AssistantTransactionServiceIntegrationTest.rollingBackArchiveAlsoRollsBackTextErasureAndCancellation' \
  --tests '*AssistantTransactionServiceIntegrationTest.archiveAndUnarchiveKeepChargedMetadataWithoutRestoringText' \
  --tests '*AssistantTransactionServiceIntegrationTest.purgeRequiresAnExistingLifecycleTransaction')
```

Código: [AssistantTextPurgeService.eraseGroup](../../codehive-backend/src/main/java/com/github/codehive/service/AssistantTextPurgeService.java), `@Transactional(propagation = Propagation.MANDATORY)`; [GroupService](../../codehive-backend/src/main/java/com/github/codehive/service/GroupService.java), llamadas a `eraseGroup` en archivo/eliminación; [AssistantInteractionRepository](../../codehive-backend/src/main/java/com/github/codehive/repository/AssistantInteractionRepository.java), `cancelPendingForGroup`, `eraseContentForGroup`.

## CH4-RNF4 — Integridad y control de cuota

Idempotencia: mismo JSON y `clientRequestId` dos veces. Esperado: misma interacción, sin segundo cobro ni nuevas llamadas al modelo. Primera petición debe terminar correctamente; respuesta pendiente es HTTP 202. Un fallo anterior tampoco debe iniciar nueva generación al repetir mismo ID.

```bash
curl -sS -H "Authorization: Bearer $STUDENT_A_JWT" -H 'Content-Type: application/json' \
  --data-binary @/tmp/codehive-ch4-evidence/request.json "$ASSISTANT_URL/interactions" \
  | tee /tmp/codehive-ch4-evidence/first.json | jq .
curl -sS -H "Authorization: Bearer $STUDENT_A_JWT" -H 'Content-Type: application/json' \
  --data-binary @/tmp/codehive-ch4-evidence/request.json "$ASSISTANT_URL/interactions" \
  | tee /tmp/codehive-ch4-evidence/replay.json | jq .
```

Invariantes de BD: las tres consultas deben devolver cero filas. No sustituyen pruebas de concurrencia/rollback.

```bash
docker exec -i db sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -P pager=off' <<'SQL'
SELECT conversation_id, client_request_id, count(*)
FROM assistant_interactions
GROUP BY conversation_id, client_request_id HAVING count(*) > 1;

SELECT conversation_id, count(*) AS pendientes
FROM assistant_interactions WHERE status = 'PENDING'
GROUP BY conversation_id HAVING count(*) > 1;

SELECT id, status, quota_charged, content_erased
FROM assistant_interactions
WHERE (quota_charged AND status NOT IN ('COMPLETED', 'REDIRECTED'))
   OR (NOT content_erased AND status IN ('COMPLETED', 'REDIRECTED')
       AND (NOT quota_charged OR assistant_response IS NULL));
SQL
```

Pruebas de doble finalización, reserva concurrente, idempotencia y cuota:

```bash
(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantTransactionServiceIntegrationTest.concurrentFirstRequestsCreateOneConversationAndOnePendingSlot' \
  --tests '*AssistantTransactionServiceIntegrationTest.concurrentFinalizationChargesOnlyOnce' \
  --tests '*AssistantTransactionServiceIntegrationTest.retryIsIdempotentAndBlockedRequestsDoNotCharge' \
  --tests '*AssistantTransactionServiceIntegrationTest.deliveredRedirectionChargesOnceAndQuotaNeverResets' \
  --tests '*AssistantControllerIntegrationTest.completedAnswerChargesOnceAndReplayDoesNotCallModelAgain')
```

Código: `AssistantTransactionService.reserve` y `deliver`, ambos transaccionales; `deliver` guarda respuesta, estado y `quotaCharged=true` dentro de misma transacción. [AssistantConversationRepository](../../codehive-backend/src/main/java/com/github/codehive/repository/AssistantConversationRepository.java), `findLockedById`; [AssistantInteraction](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssistantInteraction.java), unicidad conversación/`client_request_id`. Cuota actual puede reducirse por política por debajo de consumo histórico: eso no demuestra que se haya excedido al solicitar.

### Prueba adicional contra PostgreSQL real, en BD desechable

No apuntar este task a `codehive`: usa `create-drop` y borra tablas. El siguiente bloque crea **otra BD**, `codehive_assistant_test_evidence`; usar únicamente para tests. Si ya existe con datos que quieras conservar, elegir nombre nuevo que contenga `assistant_test`.

```bash
docker exec -i db sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres' <<'SQL'
CREATE DATABASE codehive_assistant_test_evidence;
SQL

(cd codehive-backend && \
  CODEHIVE_ASSISTANT_TEST_DATABASE_URL='jdbc:postgresql://localhost:5432/codehive_assistant_test_evidence' \
  CODEHIVE_ASSISTANT_TEST_DATABASE_USERNAME='myuser' \
  CODEHIVE_ASSISTANT_TEST_DATABASE_PASSWORD='secret' \
  ./gradlew postgresAssistantTest --console=plain --rerun-tasks)
```

Adjuntar `codehive-backend/build/reports/tests/postgresAssistantTest/index.html`. Incluye `AssistantPostgresSchemaIntegrationTest.developmentSchemaAddsPostgresIndexesAndConstraints`, además de tests de concurrencia. Si falla, adjuntar fallo y no declararlo aprobado.

## CH4-RNF5 — Límites de uso y capacidad

Diez peticiones en 60 segundos: ejecutar con A sin peticiones al asistente durante últimos 60 segundos. Mensaje vacío evita generar respuestas/cobrar. Primeras diez: 400; undécima: 429 por limitador, con `Retry-After`. Si aparece 429 antes, ventana ya tenía consumo. No usar cuota agotada como evidencia del límite temporal.

```bash
for n in $(seq 1 11); do
  printf '\nSolicitud %s\n' "$n"
  curl -sS -i -H "Authorization: Bearer $STUDENT_A_JWT" -H 'Content-Type: application/json' \
    --data '{"clientRequestId":"00000000-0000-0000-0000-000000000001","message":"","language":"JAVA","includeEditorCode":false,"includeExecutionContext":false}' \
    "$ASSISTANT_URL/interactions"
done
```

Pregunta de 2001 unidades UTF-16: HTTP 400. Ejecutar fuera de ventana ya agotada por bloque anterior; un 429 no prueba longitud.

```bash
python3 - <<'PY'
import json, uuid
from pathlib import Path
payload = json.loads(Path('/tmp/codehive-ch4-evidence/request.json').read_text())
payload.update(clientRequestId=str(uuid.uuid4()), message='x' * 2001)
Path('/tmp/codehive-ch4-evidence/oversize.json').write_text(json.dumps(payload))
PY
curl -sS -i -H "Authorization: Bearer $STUDENT_A_JWT" -H 'Content-Type: application/json' \
  --data-binary @/tmp/codehive-ch4-evidence/oversize.json "$ASSISTANT_URL/interactions"
```

Límites de salida: no se fuerzan fiablemente desde UI; adjuntar código y tests.

```bash
rg -n -C 3 '@RateLimit' codehive-backend/src/main/java/com/github/codehive/controller/AssistantController.java
rg -n -C 3 'Size\(max = 2000\)' codehive-backend/src/main/java/com/github/codehive/model/request/assistant/AssistantMessageRequest.java
rg -n -C 3 '8_000|4_000|size\(\) > 2|length\(\) > 600|count\(\) > 12' \
  codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantGuardrailService.java

(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantRateLimitInterceptorTest.assistantEndpointEnforcesTenRequestsPerMinuteWithRetryAfter' \
  --tests '*AssistantControllerIntegrationTest.oversizedQuestionNeverReservesOrCallsModel' \
  --tests '*AssistantGuardrailServiceTest.oversizedSnippetFailsAfterOneRegeneration')
```

Secciones: `AssistantGuardrailService.parseAnswer` y `deterministicIssue`: JSON de salida máximo 8000 UTF-16; explicación máximo 4000 y pregunta de seguimiento 500; máximo dos snippets de 600 UTF-16 y 12 líneas cada uno. Test existente de snippet cubre 601 caracteres; no acredita por separado fronteras de dos snippets/12 líneas. Para esas fronteras, adjuntar guardias de código. `RateLimitInterceptor.preHandle` usa ID del usuario autenticado; test del limitador existente usa fallback por IP.

## CH4-RNF6 — Trazabilidad y confidencialidad

Después de generar respuesta, en consola del backend buscar `assistant outcome`: IDs, estado, intentos, duración y código seguro. Si guardas salida de backend en archivo, usar ruta real:

```bash
export BACKEND_LOG='/RUTA/AL/LOG_DEL_BACKEND.log'
rg 'assistant outcome' "$BACKEND_LOG"
```

Modelo/tokens/duración por llamada: ledger técnico `assistant_model_calls`, no columnas antiguas de tokens de `assistant_interactions`. Captura SQL sin preguntas ni respuestas:

```bash
docker exec -i db sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -P pager=off' <<'SQL'
SELECT i.id AS interaction_id, i.status AS interaction_status,
       i.failure_code AS interaction_code, i.created_at, i.completed_at,
       m.call_ordinal, m.stage, m.status AS call_status,
       m.duration_ms, m.failure_code AS call_code,
       m.provider_id, m.configured_model_id, m.reported_model_id,
       m.input_tokens, m.output_tokens, m.total_tokens, m.usage_source
FROM assistant_interactions i
LEFT JOIN assistant_model_calls m ON m.interaction_id = i.id
WHERE i.completed_at IS NOT NULL
ORDER BY i.created_at DESC, m.call_ordinal
LIMIT 40;
SQL
```

Pruebas de no registrar pregunta/respuesta y sanitizar errores del proveedor:

```bash
(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantControllerIntegrationTest.operationalLogDoesNotContainPromptOrValidatedAnswer' \
  --tests '*AssistantServiceTest.unexpectedProviderFailureIsSanitizedAndStopsWithoutDelivery' \
  --tests '*SpringAiAssistantModelGatewayTest.providerRateLimitReturnsSafeCodeWithoutProviderMessage' \
  --tests '*AssistantModelCallRecorderTest')

rg -n -C 3 'logger\.|log\.' codehive-backend/src/main/java/com/github/codehive/service/assistant/*.java
```

Código: `AssistantService.logOutcome`, `SpringAiAssistantModelGateway`, [AssistantModelCall](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssistantModelCall.java), [AssistantModelCallRecorder](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantModelCallRecorder.java). Test de logs acredita marcadores de pregunta/respuesta; no prueba exhaustivamente ausencia de todo secreto en todos los logs del despliegue. Si requisito exige modelo/tokens específicamente en consola, ledger SQL no acredita esa interpretación: implementación actual los conserva en BD.

## CH4-RNF7 — Configuración y desacoplamiento

Capturar propiedades con nombres de variables y defaults; comando no lee `.env` ni imprime credencial real.

```bash
rg -n 'ASSISTANT_|GEMINI_|spring.ai.model.chat|spring.config.import' \
  codehive-backend/src/main/resources/application.properties
rg -n -C 3 'AssistantModelGateway|ChatModel|@Value|MAXIMUM = 5' \
  codehive-backend/src/main/java/com/github/codehive/service/assistant/{AssistantGuardrailService,AssistantModelGateway,SpringAiAssistantModelGateway,AssistantModelCallBudget}.java

(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantServiceTest.globalSwitchPreservesQuotaButPreventsReservations' \
  --tests '*AssistantProviderDisabledIntegrationTest' \
  --tests '*AssistantGoogleGenAiConfigurationTest' \
  --tests '*SpringAiAssistantModelGatewayTest.startsWithoutProviderButFailsClosedWhenCalled' \
  --tests '*SpringAiAssistantModelGatewayTest.configuredProviderCallBudgetFailsClosedBeforeAnotherTransmission')
```

Secciones: `application.properties`: `ASSISTANT_ENABLED`, `ASSISTANT_MODEL_PROVIDER`, `GEMINI_MODEL`, `GEMINI_API_KEY`, `ASSISTANT_MODEL_TIMEOUT_SECONDS`, `ASSISTANT_MODEL_MAX_OUTPUT_TOKENS`, `ASSISTANT_PROVIDER_CALLS_PER_MINUTE`. Cambios requieren reinicio del backend. `AssistantGuardrailService` depende de interfaz `AssistantModelGateway`; `SpringAiAssistantModelGateway` adapta `ChatModel`.

UI docente → editar política IA de tarea: habilitación, nivel y máximo de solicitudes por estudiante (`AssignmentAiPolicy.maxAiRequests`). Capturar esa configuración si “presupuesto” significa cuota educativa. Presupuesto de salida y llamadas por minuto son configurables; máximo de **cinco llamadas por interacción** está fijo en `AssistantModelCallBudget.MAXIMUM`. Si requisito exige configurar ese máximo o presupuesto monetario, evidencia actual no acredita ese punto.

## CH4-RNF8 — Consistencia del historial y consumo

UI estudiante → `/assignment/UUID_TAREA` → AI help. Capturar estado pensando, respuesta aprobada con cuota actualizada y misma interacción en `/assignment/UUID_TAREA/assistant-history`. Network → POST: `interaction` y `availability` en misma respuesta. Revelado progresivo de texto ocurre después de recibir respuesta aprobada; no es streaming sin revisión desde proveedor.

Consultar interacción y consumo después de generación; reemplazar `INTERACTION_A` por ID recién devuelto:

```bash
curl -sS -H "Authorization: Bearer $STUDENT_A_JWT" \
  "$ASSISTANT_URL/interactions/$INTERACTION_A" | jq .
curl -sS -H "Authorization: Bearer $STUDENT_A_JWT" "$ASSISTANT_URL" | jq .
```

Pruebas de revisión previa, confirmación persistida, error seguro y cobro único:

```bash
(cd codehive-backend && ./gradlew test --console=plain --rerun-tasks \
  --tests '*AssistantGuardrailServiceTest.conceptualAnswerWaitsForOutputReview' \
  --tests '*AssistantGuardrailServiceTest.twoRejectedCandidatesNeverReleaseResponse' \
  --tests '*AssistantServiceTest.terminalHistoryMismatchNeverReleasesGeneratedCandidate' \
  --tests '*AssistantControllerIntegrationTest.completedAnswerChargesOnceAndReplayDoesNotCallModelAgain' \
  --tests '*AssistantControllerIntegrationTest.timeoutStoresUnchargedFailureAndReturnsSafeCode' \
  --tests '*AssistantControllerIntegrationTest.stricterPolicyCancelsBeforeOutputRelease')
```

Código: `AssistantService.ask`, revisión → `transactions.deliver` → lectura de estado persistido → respuesta; [useAssignmentAssistant](../../codehive-frontend/app/features/student/hooks/useAssignmentAssistant.ts), `refresh`, polling, `send` y mensajes por código; [GlobalExceptionHandler.handleAssistantState](../../codehive-backend/src/main/java/com/github/codehive/model/exception/handler/GlobalExceptionHandler.java), mapeo HTTP/códigos seguros.

Para evidencia visual de errores, capturar mensaje del panel y respuesta Network cuando ocurra timeout, indisponibilidad o cuota agotada. Tests anteriores producen errores deterministas sin depender de fallos de Gemini ni cambios en credenciales reales. Captura de un error no acredita todos los tipos: adjuntar también mapeo de código.

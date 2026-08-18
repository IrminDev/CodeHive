# Métricas de desempeño para el docente

## Propósito

Este documento define las restricciones, reglas de negocio, catálogo de indicadores y contrato
HTTP de las métricas de desempeño de los alumnos dirigidas al propietario de un grupo. Estas
métricas alimentan el panel del docente en el frontend; el contrato aquí descrito es la fuente
de verdad para ambos equipos.

## Alcance

La versión actual (v1) solo incluye métricas calculables con el modelo de datos existente, sin
cambios de esquema. Quedan fuera y documentadas al final como v2:

- Métricas de ejecuciones de práctica: `Execution` no persiste la tarea de una ejecución
  `PRACTICE` (`submission` es nula por diseño).
- Métricas por caso de prueba: `passedTests`/`totalTests` no se persisten; el detalle vive en el
  reporte de MinIO y expira a los 180 días.

## Fundamentos de cálculo

Estas convenciones aplican a todo el catálogo:

1. **Alumnos activos**: inscripciones con `GroupEnrollment.status = ACTIVE` en el grupo. Es el
   denominador estándar de toda tasa.
2. **Entrega vigente**: `StudentAssignmentWork.currentSubmission`. Es nula si el alumno nunca
   entregó o retiró su entrega.
3. **Ejecución representativa** de una entrega: la más reciente no marcada `isOutdated`.
4. **Calificaciones**: el docente ve borradores y devueltas; los promedios usan ambas y se
   reporta el desglose `draft`/`returned`. Se normalizan como
   `value / maxPointsSnapshot × 100` porque `maxPoints` varía entre tareas.
5. **Nulos**: una métrica sin datos suficientes devuelve `null`, nunca `0`; el cero es un valor
   legítimo y el panel debe distinguirlos.
6. **Redondeo**: porcentajes y promedios a 2 decimales, `BigDecimal` con `HALF_UP`.
7. Las tareas con `isActive = false` se excluyen de todos los agregados.
8. Los estados `SUBMITTED` y `RETURNED` de `StudentWorkStatus` cuentan como "entregado";
   `NOT_SUBMITTED` y `WITHDRAWN` no.
9. **Tarea publicada**: activa, `validationStatus = READY` y `launchDate` nula o alcanzada.
10. Las conversiones entre `Submission.createdAt` (`LocalDateTime`) y las fechas de tarea
    (`Instant`) usan la zona horaria del servidor, la misma con la que se escribió `createdAt`.

## Catálogo de métricas

### M1 — Tasa de finalización por tarea (`submissionRate`)

- **Mide**: porcentaje de alumnos activos con entrega vigente en la tarea.
- **Cálculo**: `trabajos entregados de la tarea / alumnos activos × 100`.
- **Entidades**: `StudentAssignmentWork`, `GroupEnrollment`.

### M2 — Calificación promedio por tarea (`averageScore`)

- **Mide**: promedio normalizado (0–100) de las calificaciones existentes de la tarea.
- **Cálculo**: `avg(value / maxPointsSnapshot × 100)` con desglose `draftGrades` /
  `returnedGrades`; `averagePoints` reporta el promedio sin normalizar.
- **Entidades**: `AssignmentGrade`, `StudentAssignmentWork`.

### M3 — Calificación promedio por alumno (`averageScore` por alumno)

- **Mide**: promedio normalizado del alumno sobre las tareas del grupo con calificación.
- **Cálculo**: `avg(value / maxPointsSnapshot × 100)` agrupado por alumno, junto con
  `gradedAssignments` y el total de tareas publicadas.
- **Entidades**: `AssignmentGrade`, `StudentAssignmentWork`, `Assignment`, `GroupEnrollment`.

### M4 — Puntualidad (`onTimeRate`, `lateCount`)

- **Mide**: proporción de entregas vigentes dentro del plazo, por tarea y por alumno.
- **Cálculo**: sobre entregas vigentes, `count(deliveredLate = false) / count(*) × 100`. El flag
  ya incorpora la reconciliación cuando el docente extiende o elimina `dueDate`.
- **Entidades**: `Submission`.

### M5 — Tiempo promedio de entrega (`averageDeliveryMarginHours`)

- **Mide**: margen medio, en horas, entre la entrega vigente y `dueDate`; positivo significa
  antes del plazo y negativo, tardío.
- **Cálculo**: `avg(dueDate − createdAt de la entrega vigente)` sobre tareas con `dueDate`.
- **Entidades**: `Submission`, `Assignment`.

### M6 — Distribución de veredictos (`verdictDistribution`)

- **Mide**: cuántas entregas vigentes de la tarea terminaron en cada `ExecutionStatus`
  (AC, WA, TLE, MLE, RTE, CE, OLE, PENDING).
- **Cálculo**: conteo por estado de la ejecución representativa de cada entrega vigente.
- **Entidades**: `Execution`, `Submission`.

### M7 — Intentos (`attempts`, `averageAttempts`)

- **Mide**: número de entregas definitivas realizadas por alumno en una tarea, incluyendo
  reemplazadas y retiradas, y su promedio por tarea.
- **Cálculo**: `count(Submission)` agrupado por `(assignment, student)`.
- **Entidades**: `Submission`.

### M8 — Distribución de lenguajes (`languageDistribution`)

- **Mide**: lenguajes usados en las entregas vigentes de la tarea.
- **Cálculo**: conteo por `Submission.language` sobre entregas vigentes.
- **Entidades**: `Submission`.

### M9 — Rendimiento de soluciones aceptadas (`acceptedPerformance`)

- **Mide**: tiempo y memoria promedio de las soluciones aceptadas de una tarea, junto a los
  límites configurados, para comparar eficiencia.
- **Cálculo**: `avg(timeMs)` y `avg(memoryMb)` de ejecuciones representativas con
  `status = AC`; se acompaña de `timeLimitMs` y `memoryLimitMb`.
- **Entidades**: `Execution`, `Assignment`.

### M10 — Alumnos sin entrega (`missingCount`, `missingStudents`)

- **Mide**: alumnos activos sin entrega vigente en tareas publicadas; marcados `overdue` cuando
  `dueDate` ya pasó.
- **Cálculo**: alumnos activos menos alumnos con trabajo entregado, por tarea publicada.
- **Entidades**: `GroupEnrollment`, `StudentAssignmentWork`, `Assignment`.

### M11 — Progreso de calificación (`gradingProgress`)

- **Mide**: de las entregas recibidas, cuántas tienen calificación y cuántas fueron devueltas.
- **Cálculo**: por tarea y global: `submitted`, `graded` (existe calificación), `returned`
  (`GradeStatus.RETURNED`).
- **Entidades**: `AssignmentGrade`, `StudentAssignmentWork`.

### M12 — Resumen de inscripciones (`enrollment`)

- **Mide**: composición histórica del grupo.
- **Cálculo**: conteos por `EnrollmentStatus`: `active`, `left`, `removed`.
- **Entidades**: `GroupEnrollment`.

## Restricciones y reglas de negocio

1. Solo el **propietario del grupo** puede consultar sus métricas, independientemente de su rol,
   siguiendo la misma regla de propiedad que administra el grupo. No se usa autorización por rol
   `TEACHER`.
2. La identidad se obtiene exclusivamente del JWT autenticado; ningún endpoint acepta un
   identificador de usuario del cliente.
3. El propietario puede consultar métricas de grupos **archivados o eliminados lógicamente**;
   son consultas históricas de solo lectura, consistentes con la visibilidad de tareas del
   propietario.
4. Las métricas nunca exponen casos de prueba privados, código fuente ni códigos de unión.
5. Los datos personales de alumnos se limitan a identificador, nombre completo y boleta;
   nunca correo, scopes ni banderas de cuenta.
6. Las respuestas no se paginan: los grupos son de tamaño aula. Si esto cambia, se paginará con
   `page`/`size` como el listado de tareas.
7. Las métricas son de lectura pura: ningún endpoint modifica estado.
8. Un alumno no tiene acceso a ningún endpoint de métricas docentes, aunque esté inscrito.

## Requisitos funcionales

### RF-MET-001

**ID:** RF-MET-001
**Título:** Consultar resumen de métricas de un grupo
**Descripción:** Permite al propietario obtener el resumen agregado del grupo: inscripciones,
tareas, tasa global de finalización, promedio global y progreso de calificación.
**Usuario involucrado:** Propietario del grupo.
**Precondiciones:** El usuario está autenticado y es propietario del grupo.
**Descripción del flujo principal:**

1. El propietario solicita el resumen del grupo.
2. El sistema verifica que el solicitante sea el propietario.
3. El sistema agrega inscripciones, tareas activas, entregas, puntualidad y calificaciones.
4. El sistema devuelve el resumen con los agregados globales, usando `null` donde no hay datos.

**Flujos alternativos:**

2.1. Si el solicitante no es propietario, el sistema deniega el acceso y finaliza el flujo.
2.2. Si el grupo no existe, el sistema informa que no fue encontrado y finaliza el flujo.

**Postcondiciones:** No se modifica información.

### RF-MET-002

**ID:** RF-MET-002
**Título:** Consultar métricas por tarea de un grupo
**Descripción:** Devuelve, para cada tarea activa del grupo, sus indicadores de entrega,
puntualidad, calificación, intentos, veredictos y alumnos faltantes.
**Usuario involucrado:** Propietario del grupo.
**Precondiciones:** El usuario está autenticado y es propietario del grupo.
**Descripción del flujo principal:**

1. El propietario solicita las métricas por tarea del grupo.
2. El sistema verifica la propiedad.
3. El sistema calcula los indicadores de cada tarea activa, ordenadas por fecha de creación
   descendente.
4. El sistema devuelve la lista; una tarea sin entregas reporta conteos en cero y promedios en
   `null`.

**Flujos alternativos:**

2.1. Si el solicitante no es propietario, el sistema deniega el acceso y finaliza el flujo.
2.2. Si el grupo no existe, el sistema informa que no fue encontrado y finaliza el flujo.

**Postcondiciones:** No se modifica información.

### RF-MET-003

**ID:** RF-MET-003
**Título:** Consultar métricas por alumno de un grupo
**Descripción:** Devuelve, para cada alumno con inscripción activa, su tasa de finalización,
promedio, puntualidad, intentos y tareas faltantes.
**Usuario involucrado:** Propietario del grupo.
**Precondiciones:** El usuario está autenticado y es propietario del grupo.
**Descripción del flujo principal:**

1. El propietario solicita las métricas por alumno.
2. El sistema verifica la propiedad.
3. El sistema calcula los indicadores de cada alumno activo sobre las tareas publicadas,
   ordenados por apellido ascendente.
4. El sistema devuelve la lista exponiendo solo identificador, nombre completo, boleta y fecha
   de ingreso como datos personales.

**Flujos alternativos:**

2.1. Si el solicitante no es propietario, el sistema deniega el acceso y finaliza el flujo.
2.2. Si el grupo no existe, el sistema informa que no fue encontrado y finaliza el flujo.

**Postcondiciones:** No se modifica información.

### RF-MET-004

**ID:** RF-MET-004
**Título:** Consultar métricas detalladas de una tarea
**Descripción:** Devuelve el detalle de una tarea: indicadores agregados, distribución de
lenguajes, rendimiento de soluciones aceptadas, alumnos faltantes y desglose por alumno.
**Usuario involucrado:** Propietario del grupo de la tarea.
**Precondiciones:** El usuario está autenticado y es propietario del grupo de la tarea; la tarea
está activa.
**Descripción del flujo principal:**

1. El propietario solicita las métricas de una tarea.
2. El sistema localiza la tarea y verifica la propiedad del grupo.
3. El sistema calcula los agregados de la tarea y el desglose por alumno activo.
4. El sistema devuelve el detalle; los veredictos `PENDING` indican evaluación en curso.

**Flujos alternativos:**

2.1. Si la tarea no existe o está eliminada lógicamente, el sistema informa que no fue
     encontrada y finaliza el flujo.
2.2. Si el solicitante no es propietario del grupo, el sistema deniega el acceso y finaliza el
     flujo.

**Postcondiciones:** No se modifica información.

## Contrato HTTP

Convenciones compartidas con el resto de la API:

- Éxito: `SuccessResponse<T>` → `{ "success": true, "message": "…", "data": … }`.
- Error: `ErrorResponse` emitido por `GlobalExceptionHandler` (`404` recurso inexistente,
  `403` sin propiedad, `401` sin JWT válido).
- Identificadores `UUID`; instantes en ISO-8601.
- Las claves de `verdictDistribution` y `languageDistribution` son subconjuntos de
  `ExecutionStatus` y `Language`; solo se incluyen valores con conteo mayor a cero.
- Todo campo numérico agregado puede ser `null` (sin datos); el panel debe distinguirlo de `0`.

### `GET /api/groups/{groupId}/metrics/overview`

| Código | Caso |
|---|---|
| 200 | Propietario autenticado |
| 401 | Sin JWT válido |
| 403 | Autenticado pero no propietario |
| 404 | Grupo inexistente |

```json
{
  "success": true,
  "message": "Group metrics retrieved successfully",
  "data": {
    "groupId": "uuid",
    "generatedAt": "2026-07-30T18:00:00Z",
    "enrollment": { "active": 32, "left": 3, "removed": 1 },
    "assignments": { "total": 10, "published": 8, "processing": 1, "failed": 1 },
    "overallSubmissionRate": 84.38,
    "overallAverageScore": 76.20,
    "overallOnTimeRate": 91.10,
    "gradingProgress": { "submitted": 270, "graded": 240, "returned": 200 }
  }
}
```

### `GET /api/groups/{groupId}/metrics/assignments`

Códigos idénticos al resumen. `data` es una lista ordenada por `createdAt` descendente con solo
tareas activas:

```json
{
  "data": [
    {
      "assignmentId": "uuid",
      "title": "Práctica 3 — Grafos",
      "validationStatus": "READY",
      "dueDate": "2026-08-01T05:00:00Z",
      "closeDate": "2026-08-03T05:00:00Z",
      "maxPoints": 100.00,
      "activeStudents": 32,
      "submittedCount": 27,
      "submissionRate": 84.38,
      "lateCount": 4,
      "onTimeRate": 85.19,
      "averageScore": 78.50,
      "averagePoints": 78.50,
      "draftGrades": 5,
      "returnedGrades": 20,
      "averageAttempts": 2.4,
      "averageDeliveryMarginHours": 14.2,
      "verdictDistribution": { "AC": 21, "WA": 4, "TLE": 1, "PENDING": 1 },
      "missingCount": 5,
      "overdue": false
    }
  ]
}
```

### `GET /api/groups/{groupId}/metrics/students`

Códigos idénticos al resumen. `data` es la lista de alumnos con inscripción activa, ordenada por
apellido ascendente:

```json
{
  "data": [
    {
      "studentId": "uuid",
      "fullName": "Ada Lovelace",
      "enrollmentNumber": "2023630001",
      "joinedAt": "2026-02-01T10:00:00",
      "publishedAssignments": 8,
      "submittedCount": 7,
      "completionRate": 87.50,
      "lateCount": 1,
      "averageScore": 81.25,
      "gradedAssignments": 6,
      "totalAttempts": 15,
      "missingAssignmentIds": ["uuid"]
    }
  ]
}
```

### `GET /api/assignments/{assignmentId}/metrics`

| Código | Caso |
|---|---|
| 200 | Propietario del grupo de la tarea |
| 401 | Sin JWT válido |
| 403 | Autenticado pero no propietario |
| 404 | Tarea inexistente o eliminada lógicamente |

`data` contiene el objeto por tarea del listado anterior, ampliado con:

```json
{
  "languageDistribution": { "JAVA": 15, "PYTHON": 10, "CPP": 2 },
  "acceptedPerformance": {
    "averageTimeMs": 342.5,
    "averageMemoryMb": 28.4,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256
  },
  "missingStudents": [
    { "studentId": "uuid", "fullName": "…", "enrollmentNumber": "…" }
  ],
  "perStudent": [
    {
      "studentId": "uuid",
      "fullName": "…",
      "workStatus": "SUBMITTED",
      "currentSubmissionId": "uuid",
      "deliveredLate": false,
      "attempts": 3,
      "verdict": "AC",
      "timeMs": 210,
      "memoryMb": 22,
      "grade": { "value": 95.00, "maxPoints": 100.00, "status": "RETURNED" }
    }
  ]
}
```

## Rutas HTTP

| Operación | Ruta |
|---|---|
| Resumen del grupo | `GET /api/groups/{groupId}/metrics/overview` |
| Métricas por tarea | `GET /api/groups/{groupId}/metrics/assignments` |
| Métricas por alumno | `GET /api/groups/{groupId}/metrics/students` |
| Detalle de una tarea | `GET /api/assignments/{assignmentId}/metrics` |

## Pendiente de definir (v2)

- Métricas de ejecuciones de práctica por tarea y alumno: requieren persistir la tarea en
  `Execution` para ejecuciones `PRACTICE`; cambio de esquema a coordinar.
- Porcentaje de casos de prueba superados y casos que más fallan en el grupo: requieren
  persistir `passedTests`/`totalTests` al procesar el resultado del worker.
- El uso del scope `CHECK_ANALYTICS` (hoy declarado y sin uso) para métricas administrativas
  transversales, cuando se definan los permisos de administración.

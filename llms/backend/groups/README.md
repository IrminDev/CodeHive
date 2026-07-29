# Grupos, tareas y entregas

## Propósito

Este documento define las restricciones, reglas de negocio y requisitos funcionales para la gestión de grupos académicos, inscripciones, tareas, ejemplos, clonación y entregas de programación.

## Modelo de dominio

```text
Propietario (User autorizado con CREATE_GROUP)
 └─ Grupo (ClassGroup)
     ├─ Inscripciones de estudiantes (GroupEnrollment)
     └─ Tareas (Assignment)
         ├─ Ejemplos públicos (AssignmentExample)
         ├─ Casos de prueba privados (TestCase)
         ├─ Solución de referencia (ReferenceSolution)
         └─ Entregas (Submission) → ejecuciones (Execution)
```

## Restricciones y reglas de negocio

### Grupos

1. Un grupo tiene exactamente un propietario autenticado con el scope `CREATE_GROUP` al momento de crearlo.
2. Cualquier propietario puede administrar varios grupos; los profesores reciben `CREATE_GROUP` por defecto y los estudiantes pueden recibirlo de un administrador.
3. Un grupo contiene un código de unión aleatorio de ocho caracteres, en mayúsculas y con caracteres no ambiguos. El código debe ser único sin distinguir mayúsculas de minúsculas.
4. Solo un usuario con rol `STUDENT` puede unirse mediante código. Un profesor no puede inscribirse en un grupo, ni siquiera en uno propio.
5. Las inscripciones no se eliminan físicamente. La combinación `(grupo, estudiante)` es única y conserva el historial.
6. Una inscripción puede estar en los estados `ACTIVE`, `LEFT` o `REMOVED`.
7. Cuando un estudiante que salió o fue removido vuelve a unirse, se reactiva su misma inscripción y se actualiza su fecha de unión.
8. El propietario y los estudiantes con una inscripción `ACTIVE` pueden consultar la lista de estudiantes activos del grupo. Solo el propietario, independientemente de su rol, puede actualizar el grupo, remover estudiantes, archivar, desarchivar, eliminar lógicamente, restaurar o rotar el código de unión. Consultar la lista no concede acceso a tareas, entregas, retroalimentación ni calificaciones de otros estudiantes.
9. El código de unión se devuelve al propietario y nunca a usuarios que acceden únicamente mediante inscripción.
10. Un estudiante propietario no puede inscribirse en su propio grupo.

### Ciclo de vida de grupos

1. `isActive = true` significa que el grupo no está eliminado lógicamente.
2. `isActive = false` significa eliminación lógica. El grupo se oculta a estudiantes y se conserva para que su propietario consulte y clone sus tareas históricas.
3. `archived = true` significa que el grupo es de solo lectura. No permite uniones, modificaciones, creación de tareas ni nuevas ejecuciones o entregas.
4. Restaurar un grupo eliminado lo deja archivado; el propietario debe desarchivarlo explícitamente antes de modificarlo o recibir actividad.
5. La eliminación lógica también archiva el grupo.

### Tareas y ejemplos

1. Toda tarea pertenece exactamente a un grupo y registra al profesor autor.
2. La tarea solo puede ser creada, eliminada o clonada por el propietario del grupo.
3. Una tarea puede tener cero o más ejemplos ordenados. Cada ejemplo contiene `input`, `output` y `explanation`; los tres son texto público independiente de los casos de prueba.
4. Los ejemplos no reemplazan los casos de prueba del evaluador. Los casos de prueba y sus salidas esperadas siguen siendo privados.
5. Una tarea tiene los estados de validación `PROCESSING`, `READY` y `FAILED`.
6. Al crear o clonar una tarea, inicia en `PROCESSING`. El worker la cambia a `READY` cuando genera correctamente las salidas esperadas, o a `FAILED` si la generación falla.
7. `Assignment.isActive` solo representa eliminación lógica. No debe usarse para indicar que el worker terminó de validar la tarea.
8. Una tarea solo es visible y ejecutable para estudiantes cuando está activa, su grupo está activo, su validación está en `READY` y ya llegó su fecha de publicación.

### Fechas de tareas

1. `launchDate` determina desde cuándo la tarea está disponible para estudiantes.
2. `dueDate` determina desde cuándo una nueva entrega se marca como tardía; no impide entregas.
3. `closeDate` determina desde cuándo no se aceptan nuevas entregas definitivas.
4. Si las fechas existen, deben cumplir `launchDate <= dueDate <= closeDate`.
5. Una fecha nula significa que esa restricción no aplica: sin fecha de publicación la tarea está disponible al quedar lista; sin fecha de entrega nunca se marca tardía; sin fecha de cierre no se cierra.
6. Las fechas se almacenan como instantes absolutos (`Instant`) para evitar ambigüedad de zona horaria.

### Ejecuciones y entregas

1. La identidad del solicitante se obtiene exclusivamente del JWT autenticado. El campo `requesterId` enviado por el cliente se ignora para impedir suplantación.
2. El lenguaje solicitado debe pertenecer a los lenguajes permitidos por la tarea.
3. Un estudiante necesita una inscripción `ACTIVE` para consultar o ejecutar tareas de un grupo.
4. Un profesor propietario puede ejecutar pruebas de práctica, pero no puede crear entregas definitivas de estudiante.
5. Una ejecución `PRACTICE` de estudiante requiere al menos un caso de prueba proporcionado por el cliente.
6. Una ejecución `DEFINITIVE` crea una `Submission` inmutable asociada al estudiante autenticado.
7. Se permiten múltiples entregas definitivas antes del cierre. La más reciente se obtiene por fecha de creación; si ocurre después de `dueDate`, se persiste con `deliveredLate = true`. Si el profesor extiende o elimina `dueDate`, las entregas tardías que ahora quedan dentro del plazo se actualizan a `deliveredLate = false`.
8. En el instante de `closeDate` y después de él, no se acepta una nueva entrega definitiva.
9. Quien inició una ejecución puede consultar su estado y reporte; en una entrega definitiva también puede hacerlo el propietario del grupo.

### Actualización, retiro y evaluación docente

1. Una entrega actual debe retirarse explícitamente antes de entregar una nueva versión.
2. El retiro solo se permite antes de `closeDate`; conserva código, resultados e historial.
3. La retroalimentación pertenece a la combinación tarea-estudiante, admite múltiples comentarios y no se edita. El profesor puede eliminarla lógicamente y publicar otra.
4. La calificación pertenece a la combinación tarea-estudiante, inicia como borrador y solo es visible al estudiante después de devolverla.
5. Una nueva entrega, un cambio activo de casos de prueba o un cambio de `maxPoints` elimina la calificación actual y conserva el evento en el historial.
6. Cambiar únicamente la solución de referencia exige validación contra los casos activos, pero no reejecuta entregas ni notifica estudiantes.
7. Un cambio de casos de prueba se publica únicamente cuando la solución de referencia completa todos los casos correctamente; un fallo conserva intacta la revisión activa.
8. Al publicar una revisión de casos, se reejecuta únicamente la entrega actual no retirada de cada estudiante.

### Clonación

1. Una tarea solo puede clonarse a otro grupo activo, no archivado y perteneciente al mismo profesor.
2. El grupo destino debe ser diferente del grupo origen.
3. La clonación copia metadatos, restricciones, ayudas, etiquetas, lenguajes, ejemplos, solución de referencia y archivos de entrada de casos de prueba.
4. Las salidas esperadas no se copian como resultado final: se vuelven a generar de forma asíncrona con el worker para la nueva tarea.

## Requisitos funcionales

### RF-GRU-001

**ID:** RF-GRU-001  
**Título:** Crear grupo académico  
**Descripción:** Permite a un usuario con `CREATE_GROUP` crear un grupo del que será el único propietario.
**Usuario involucrado:** Usuario autorizado.
**Precondiciones:** El usuario está autenticado, tiene `CREATE_GROUP` y proporciona un nombre válido.
**Descripción del flujo principal:**

1. El usuario solicita la creación e indica nombre y descripción opcional.
2. El sistema valida los datos recibidos.
3. El sistema genera un código de unión único.
4. El sistema crea el grupo activo y no archivado, asignando al usuario autenticado como propietario.
5. El sistema devuelve la información del grupo, incluido el código de unión.

**Flujos alternativos:**

1.1. Si el usuario no tiene `CREATE_GROUP`, el sistema deniega el acceso y finaliza el flujo.
2.1. Si el nombre no cumple las validaciones, el sistema muestra los errores y vuelve al paso 1 del flujo principal.
3.1. Si existe una colisión de código, el sistema genera otro código y vuelve al paso 3 del flujo principal.

**Postcondiciones:** Existe un grupo activo cuyo propietario es el usuario autenticado.

### RF-GRU-002

**ID:** RF-GRU-002  
**Título:** Consultar grupos accesibles  
**Descripción:** Permite listar y consultar los grupos a los que el usuario tiene acceso.  
**Usuario involucrado:** Profesor o estudiante.  
**Precondiciones:** El usuario está autenticado.  
**Descripción del flujo principal:**

1. El usuario solicita su lista de grupos o el detalle de un grupo.
2. El sistema identifica el rol y la identidad del usuario autenticado.
3. El sistema combina los grupos propios del usuario con sus inscripciones activas, cuando tenga rol `STUDENT`, sin duplicados.
4. El sistema verifica que el usuario tenga acceso al grupo solicitado, cuando aplique.
5. El sistema devuelve los grupos o el detalle autorizado.

**Flujos alternativos:**

3.1. Si el propietario no solicita incluir eliminados, el sistema omite sus grupos con `isActive = false` y continúa en el paso 5.
4.1. Si el usuario no es propietario ni tiene inscripción activa, el sistema deniega el acceso y finaliza el flujo.
4.2. Si un estudiante intenta consultar un grupo eliminado, el sistema responde como recurso no encontrado y finaliza el flujo.

**Postcondiciones:** No se modifica información; el usuario recibe únicamente datos autorizados. El código de unión solo se entrega al propietario.

### RF-GRU-003

**ID:** RF-GRU-003  
**Título:** Unirse a un grupo con código  
**Descripción:** Permite a un estudiante inscribirse a un grupo activo mediante su código de unión.  
**Usuario involucrado:** Estudiante.  
**Precondiciones:** El usuario está autenticado con rol `STUDENT`, conoce un código válido y el grupo está activo y no archivado.  
**Descripción del flujo principal:**

1. El estudiante envía el código de unión.
2. El sistema localiza el grupo asociado al código sin distinguir mayúsculas o minúsculas.
3. El sistema verifica que el grupo esté activo y no archivado.
4. El sistema crea una inscripción activa o reactiva la inscripción histórica del estudiante.
5. El sistema devuelve la información del grupo sin revelar el código de unión.

**Flujos alternativos:**

2.1. Si el código no existe, el sistema informa que no hay un grupo activo con ese código y vuelve al paso 1 del flujo principal.
3.1. Si el grupo está archivado o eliminado, el sistema informa que no admite inscripciones y finaliza el flujo.
4.1. Si el estudiante ya tiene una inscripción activa, el sistema muestra el error y finaliza el flujo.
4.2. Si el estudiante es propietario del grupo, el sistema rechaza la inscripción y finaliza el flujo.
1.1. Si el usuario es profesor u otro rol, el sistema deniega el acceso y finaliza el flujo.

**Postcondiciones:** El estudiante queda con inscripción `ACTIVE` y puede consultar las tareas disponibles del grupo.

### RF-GRU-004

**ID:** RF-GRU-004  
**Título:** Administrar inscripción de un estudiante  
**Descripción:** Permite a un estudiante salir de un grupo o al propietario removerlo.
**Usuario involucrado:** Estudiante o propietario.
**Precondiciones:** Existe una inscripción activa; el estudiante autenticado es el inscrito o el usuario autenticado es propietario del grupo.
**Descripción del flujo principal:**

1. El usuario solicita salir del grupo o el propietario solicita remover a un estudiante.
2. El sistema verifica la propiedad o la identidad del estudiante, según la operación.
3. El sistema localiza la inscripción activa.
4. El sistema cambia el estado a `LEFT` cuando el estudiante sale, o a `REMOVED` cuando lo remueve el propietario, y registra la fecha de finalización.
5. El sistema confirma la operación.

**Flujos alternativos:**

2.1. Si el solicitante no es propietario, el sistema deniega el acceso y finaliza el flujo.
3.1. Si no existe una inscripción activa, el sistema informa el error y finaliza el flujo.

**Postcondiciones:** Se conserva el historial de inscripción y no se eliminan entregas previas del estudiante.

### RF-GRU-005

**ID:** RF-GRU-005  
**Título:** Administrar ciclo de vida y código de un grupo  
**Descripción:** Permite al propietario actualizar, archivar, desarchivar, eliminar lógicamente, restaurar y rotar el código de su grupo.  
**Usuario involucrado:** Propietario del grupo.
**Precondiciones:** El usuario está autenticado y es propietario del grupo. Para actualizar o rotar código, el grupo está activo y no archivado.
**Descripción del flujo principal:**

1. El propietario selecciona una operación de administración del grupo.
2. El sistema verifica que el solicitante sea propietario.
3. El sistema aplica la operación solicitada.
4. Si la operación es rotar código, el sistema genera y asigna un código único nuevo.
5. El sistema actualiza la fecha de modificación y devuelve el estado resultante.

**Flujos alternativos:**

2.1. Si el solicitante no es propietario, el sistema deniega el acceso y finaliza el flujo.
3.1. Si se intenta modificar o rotar el código de un grupo archivado, el sistema muestra el error y finaliza el flujo.
3.2. Si se intenta modificar o rotar el código de un grupo eliminado, el sistema muestra el error y finaliza el flujo.
4.1. Si el código generado ya existe, el sistema genera otro y vuelve al paso 4 del flujo principal.

**Postcondiciones:** El grupo refleja la operación. Una eliminación lógica lo deja inactivo y archivado; una restauración lo deja activo pero archivado.

### RF-TAR-001

**ID:** RF-TAR-001  
**Título:** Crear tarea con ejemplos y casos de prueba  
**Descripción:** Permite al propietario de un grupo crear una tarea, sus ejemplos públicos, solución de referencia y casos de prueba privados.  
**Usuario involucrado:** Profesor propietario.  
**Precondiciones:** El profesor está autenticado, es propietario de un grupo activo no archivado y proporciona metadatos, solución de referencia y al menos un archivo de entrada.  
**Descripción del flujo principal:**

1. El profesor envía el grupo destino, metadatos, fechas, ejemplos, solución de referencia y casos de prueba.
2. El sistema valida los datos, los límites y el orden de fechas.
3. El sistema verifica que el profesor sea propietario del grupo y que el grupo admita cambios.
4. El sistema crea la tarea activa con estado de validación `PROCESSING`.
5. El sistema guarda los ejemplos ordenados como contenido público independiente.
6. El sistema guarda la solución de referencia y los archivos de entrada en almacenamiento de objetos.
7. El sistema crea los metadatos de los casos de prueba privados.
8. El sistema publica un trabajo de generación de salidas esperadas para el worker.
9. El sistema devuelve la tarea en estado `PROCESSING`.

**Flujos alternativos:**

2.1. Si falta información obligatoria, un lenguaje permitido o un caso de prueba, el sistema muestra los errores y vuelve al paso 1 del flujo principal.
2.2. Si `launchDate`, `dueDate` y `closeDate` no cumplen el orden permitido, el sistema muestra el error y vuelve al paso 1 del flujo principal.
3.1. Si el profesor no es propietario, el sistema deniega el acceso y finaliza el flujo.
3.2. Si el grupo está archivado o eliminado, el sistema informa que es de solo lectura y finaliza el flujo.
6.1. Si falla el almacenamiento de un archivo, el sistema cancela la creación y finaliza el flujo con error.

**Postcondiciones:** Existe una tarea asociada al grupo, con ejemplos y archivos almacenados, pendiente de validación por el worker.

### RF-TAR-002

**ID:** RF-TAR-002  
**Título:** Validar tarea de forma asíncrona  
**Descripción:** Actualiza el estado de validación de una tarea al terminar la generación de salidas esperadas.  
**Usuario involucrado:** Worker del sistema.  
**Precondiciones:** Existe una tarea en `PROCESSING` y el worker recibió su trabajo de generación.  
**Descripción del flujo principal:**

1. El worker ejecuta la solución de referencia para cada caso de prueba.
2. El worker guarda las salidas esperadas y publica el resultado.
3. El backend recibe el resultado asociado a la tarea.
4. Si el resultado es exitoso, el sistema cambia la validación a `READY`.
5. El sistema persiste el estado para que la tarea pueda estar disponible según su fecha de publicación.

**Flujos alternativos:**

1.1. Si la solución de referencia falla durante la generación, el worker publica un resultado fallido y continúa en el paso 3 del flujo principal.
3.1. Si la tarea ya no existe, el sistema registra el evento y finaliza el flujo.
4.1. Si el resultado es fallido, el sistema cambia la validación a `FAILED`, registra el error y finaliza el flujo.

**Postcondiciones:** La tarea queda en `READY` o `FAILED`; solo `READY` puede ser visible y ejecutable para estudiantes.

### RF-TAR-003

**ID:** RF-TAR-003  
**Título:** Consultar tareas disponibles  
**Descripción:** Permite consultar tareas de un grupo con visibilidad según el rol y el ciclo de vida.  
**Usuario involucrado:** Profesor propietario o estudiante inscrito.  
**Precondiciones:** El usuario está autenticado y tiene acceso al grupo.  
**Descripción del flujo principal:**

1. El usuario solicita la lista paginada de tareas de un grupo o el detalle de una tarea.
2. El sistema verifica que el profesor sea propietario o que el estudiante tenga inscripción activa.
3. Si el usuario es profesor propietario, el sistema devuelve las tareas activas del grupo, incluso cuando el grupo está archivado o eliminado.
4. Si el usuario es estudiante, el sistema filtra por tarea activa, grupo activo, validación `READY` y fecha de publicación alcanzada.
5. El sistema devuelve las tareas autorizadas; al consultar detalle incluye ejemplos y casos de muestra disponibles.

**Flujos alternativos:**

2.1. Si el usuario no tiene acceso al grupo, el sistema deniega el acceso y finaliza el flujo.
4.1. Si la fecha de publicación no ha llegado, la tarea no se devuelve al estudiante y el sistema continúa con la siguiente tarea o finaliza la consulta.
5.1. Si la tarea solicitada no es visible para el estudiante, el sistema responde como recurso no encontrado y finaliza el flujo.

**Postcondiciones:** No se modifica información ni se exponen casos de prueba privados o códigos de unión.

### RF-TAR-004

**ID:** RF-TAR-004  
**Título:** Clonar tarea a otro grupo  
**Descripción:** Permite reutilizar una tarea histórica o vigente en otro grupo del mismo profesor.  
**Usuario involucrado:** Profesor propietario.  
**Precondiciones:** El profesor es propietario de la tarea origen y del grupo destino; el destino es activo, no archivado y diferente del grupo origen.  
**Descripción del flujo principal:**

1. El profesor selecciona una tarea origen e indica el grupo destino y, opcionalmente, nuevas fechas.
2. El sistema verifica la propiedad de la tarea y del grupo destino.
3. El sistema valida que el destino sea diferente, activo y no archivado, y valida las fechas.
4. El sistema crea una nueva tarea en `PROCESSING` con los metadatos, ejemplos y configuración de la tarea origen.
5. El sistema copia la solución de referencia y las entradas de los casos de prueba al espacio de almacenamiento de la nueva tarea.
6. El sistema crea los nuevos metadatos de casos de prueba.
7. El sistema publica un nuevo trabajo de generación de salidas esperadas.
8. El sistema devuelve la tarea clonada.

**Flujos alternativos:**

2.1. Si el profesor no es propietario de la tarea origen o del grupo destino, el sistema deniega el acceso y finaliza el flujo.
3.1. Si el grupo destino es el mismo que el origen, el sistema muestra el error y vuelve al paso 1 del flujo principal.
3.2. Si el destino está archivado o eliminado, el sistema muestra el error y vuelve al paso 1 del flujo principal.
3.3. Si las fechas son inválidas, el sistema muestra el error y vuelve al paso 1 del flujo principal.
5.1. Si no se puede copiar un archivo, el sistema cancela la clonación y finaliza el flujo con error.

**Postcondiciones:** Existe una nueva tarea independiente en el grupo destino y sus salidas esperadas se regeneran de forma asíncrona.

### RF-TAR-005

**ID:** RF-TAR-005  
**Título:** Eliminar lógicamente una tarea  
**Descripción:** Permite ocultar una tarea sin eliminar sus datos ni archivos históricos.  
**Usuario involucrado:** Profesor propietario.  
**Precondiciones:** El profesor está autenticado y es propietario del grupo de la tarea.  
**Descripción del flujo principal:**

1. El profesor solicita eliminar una tarea.
2. El sistema verifica que sea propietario del grupo.
3. El sistema cambia `Assignment.isActive` a `false`.
4. El sistema confirma la eliminación lógica.

**Flujos alternativos:**

2.1. Si el profesor no es propietario, el sistema deniega el acceso y finaliza el flujo.
2.2. Si la tarea no existe, el sistema informa que no fue encontrada y finaliza el flujo.

**Postcondiciones:** La tarea deja de aparecer en listados activos y no puede ejecutarse, pero se conserva su información histórica.

### RF-ENT-001

**ID:** RF-ENT-001  
**Título:** Ejecutar código de práctica  
**Descripción:** Permite probar código contra casos ingresados por el usuario sin crear una entrega definitiva.  
**Usuario involucrado:** Estudiante inscrito o profesor propietario.  
**Precondiciones:** La tarea y el grupo están activos, el grupo no está archivado, la tarea está `READY`, el lenguaje está permitido y el estudiante ya alcanzó la fecha de publicación.  
**Descripción del flujo principal:**

1. El usuario autenticado envía código, lenguaje, tarea, tipo `PRACTICE` y al menos un caso de prueba propio.
2. El sistema obtiene la identidad desde el JWT, sin usar la identidad enviada por el cliente.
3. El sistema valida la tarea, el grupo, el lenguaje y la autorización del usuario.
4. El sistema crea una ejecución pendiente asociada al usuario autenticado.
5. El sistema almacena el código fuente y publica el trabajo de ejecución.
6. El sistema devuelve el identificador de ejecución para consulta posterior.

**Flujos alternativos:**

1.1. Si no se proporciona código, lenguaje, tarea o casos de práctica, el sistema muestra el error y vuelve al paso 1 del flujo principal.
3.1. Si el estudiante no tiene inscripción activa, el sistema deniega el acceso y finaliza el flujo.
3.2. Si la tarea no está lista, no está publicada, está eliminada o el grupo está archivado/eliminado, el sistema rechaza la solicitud y finaliza el flujo.
3.3. Si el lenguaje no está permitido, el sistema muestra el error y vuelve al paso 1 del flujo principal.
5.1. Si falla el almacenamiento del código, el sistema cancela la solicitud y finaliza el flujo con error.

**Postcondiciones:** Existe una ejecución pendiente o procesada, asociada únicamente al usuario autenticado; no se crea una entrega.

### RF-ENT-002

**ID:** RF-ENT-002  
**Título:** Realizar entrega definitiva  
**Descripción:** Permite a un estudiante inscrito enviar múltiples entregas de una tarea hasta su fecha de cierre.  
**Usuario involucrado:** Estudiante inscrito.  
**Precondiciones:** El estudiante está autenticado y tiene inscripción activa; la tarea está activa, `READY`, publicada, permite el lenguaje y no está cerrada; el grupo está activo y no archivado.  
**Descripción del flujo principal:**

1. El estudiante envía código, lenguaje, tarea y tipo `DEFINITIVE`.
2. El sistema obtiene la identidad del estudiante desde el JWT.
3. El sistema valida inscripción, disponibilidad, lenguaje y fecha de cierre.
4. El sistema determina si la entrega ocurre después de la fecha de entrega.
5. El sistema crea una entrega inmutable asociada al estudiante autenticado y registra el indicador de tardanza.
6. El sistema crea la ejecución pendiente asociada a esa entrega.
7. El sistema almacena el código y publica el trabajo de evaluación definitiva.
8. El sistema devuelve el identificador de ejecución.

**Flujos alternativos:**

2.1. Si la identidad indicada en el cuerpo no coincide con el JWT, el sistema ignora esa identidad y continúa con el paso 3 usando el usuario del JWT.
3.1. Si el usuario no es estudiante inscrito, el sistema deniega el acceso y finaliza el flujo.
3.2. Si el solicitante es el profesor propietario, el sistema deniega la creación de una entrega definitiva y finaliza el flujo.
3.3. Si la tarea no está publicada, no está lista, fue eliminada o el grupo es de solo lectura, el sistema rechaza la solicitud y finaliza el flujo.
3.4. Si el instante actual es igual o posterior a `closeDate`, el sistema informa que la tarea está cerrada y finaliza el flujo.
4.1. Si no existe `dueDate` o el instante actual no es posterior a ella, el sistema marca la entrega como no tardía y continúa en el paso 5.

**Postcondiciones:** Existe una nueva entrega y ejecución asociadas al estudiante autenticado. Si la entrega ocurrió después de `dueDate`, queda marcada permanentemente como tardía.

### RF-ENT-003

**ID:** RF-ENT-003  
**Título:** Consultar estado y reporte de una ejecución  
**Descripción:** Permite al iniciador consultar el estado y el reporte detallado de su ejecución.  
**Usuario involucrado:** Usuario que inició la ejecución.  
**Precondiciones:** El usuario está autenticado y conoce el identificador de una ejecución propia.  
**Descripción del flujo principal:**

1. El usuario solicita el estado o reporte de una ejecución.
2. El sistema obtiene la identidad desde el JWT.
3. El sistema localiza la ejecución y verifica que pertenezca al usuario autenticado.
4. Para el estado, el sistema devuelve la información persistida de la ejecución.
5. Para el reporte, el sistema obtiene y deserializa el archivo de reporte desde el almacenamiento de objetos.
6. El sistema devuelve el resultado solicitado.

**Flujos alternativos:**

3.1. Si la ejecución no existe, el sistema informa que no fue encontrada y finaliza el flujo.
3.2. Si la ejecución pertenece a otro usuario, el sistema deniega el acceso y finaliza el flujo.
5.1. Si la ejecución sigue pendiente y el reporte no existe todavía, el sistema informa que el reporte no está disponible y finaliza el flujo.
5.2. Si la ejecución terminó pero no existe el archivo de reporte, el sistema informa que el reporte no fue encontrado y finaliza el flujo.

**Postcondiciones:** No se modifica información; el reporte solo es revelado a su iniciador.

## Rutas HTTP implementadas

| Operación | Ruta |
|---|---|
| Crear grupo | `POST /api/groups` |
| Listar grupos propios/accesibles | `GET /api/groups` |
| Consultar grupo | `GET /api/groups/{id}` |
| Actualizar grupo | `PATCH /api/groups/{id}` |
| Unirse a grupo | `POST /api/groups/join` |
| Salir de grupo | `POST /api/groups/{id}/leave` |
| Consultar estudiantes | `GET /api/groups/{id}/students` |
| Remover estudiante | `DELETE /api/groups/{id}/students/{studentId}` |
| Archivar / desarchivar | `POST /api/groups/{id}/archive`, `POST /api/groups/{id}/unarchive` |
| Eliminar / restaurar grupo | `DELETE /api/groups/{id}`, `POST /api/groups/{id}/restore` |
| Rotar código | `POST /api/groups/{id}/join-code/rotate` |
| Crear tarea | `POST /api/assignments` |
| Listar tareas de grupo | `GET /api/assignments?groupId={id}` |
| Consultar tarea | `GET /api/assignments/{id}` |
| Clonar tarea | `POST /api/assignments/{id}/clone` |
| Eliminar tarea | `DELETE /api/assignments/{id}` |
| Solicitar ejecución | `POST /api/execution/check` |
| Consultar ejecución | `GET /api/execution/check/{id}` |
| Consultar reporte | `GET /api/execution/check/{id}/report` |
| Actualizar tarea | `PATCH /api/assignments/{id}` |
| Consultar actualización | `GET /api/assignments/updates/{updateId}` |
| Retirar entrega | `POST /api/submissions/{submissionId}/withdraw` |
| Consultar libro de entregas | `GET /api/assignments/{id}/student-work` |
| Publicar/listar retroalimentación | `POST`, `GET /api/assignments/{id}/students/{studentId}/feedback` |
| Eliminar retroalimentación | `DELETE /api/assignments/feedback/{feedbackId}` |
| Guardar/devolver calificación | `PUT /api/assignments/{id}/students/{studentId}/grade`, `POST .../grade/return` |

## Pendiente de definir

- Las excepciones de autorización para administradores se implementarán cuando estén definidos los scopes administrativos y sus acciones concretas.
- Los futuros permisos administrativos sobre entregas y calificaciones deben definirse mediante scopes concretos; actualmente solo el propietario del grupo puede evaluarlas.

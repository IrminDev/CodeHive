# Asistente educativo de IA: requerimientos funcionales

Revisión: 4 de octubre de 2026. Estos requerimientos describen acciones y resultados desde la experiencia del usuario. Los nombres entre comillas corresponden a los controles actuales en inglés. Cuotas, niveles y condiciones obligatorias se detallan en [reglas de negocio](REGLAS_DE_NEGOCIO_Y_RESTRICCIONES.md).

## RF-01. Configurar la ayuda al crear una asignación

**Descripción:** permitir que el docente decida qué ayuda educativa ofrecerá la asignación antes de crearla.

**Usuario:** docente propietario del grupo.

**Precondiciones:** sesión iniciada, grupo propio disponible y formulario de creación accesible.

**Flujo normal:**
1. El docente abre la creación de asignación y completa sus datos habituales.
2. En “AI educational assistance”, marca “Enable assistant for this assignment”.
3. Introduce la cantidad de respuestas en “Lifetime answers per student (1–10)”.
4. Selecciona “Assistance level” y lee la explicación del nivel.
5. Pulsa “Create assignment”.
6. El sistema crea la asignación con la configuración elegida; la disponibilidad para estudiantes depende de que la asignación termine su preparación y sea accesible.

**Flujos alternos:** si deja la opción desmarcada, se crea sin ayuda de IA. Si la cuota no es válida, debe corregirla antes de guardar. Si la creación falla, recibe el error correspondiente.

**Postcondiciones:** la asignación creada conserva la política seleccionada; todavía no existen preguntas ni consumo del asistente.

## RF-02. Ajustar la ayuda de una asignación existente

**Descripción:** permitir cambios inmediatos en habilitación, cuota y nivel desde la edición.

**Usuario:** docente propietario de la asignación.

**Precondiciones:** sesión iniciada y asignación propia en un grupo modificable.

**Flujo normal:**
1. El docente abre la lista de asignaciones y entra a editar la asignación.
2. Localiza “AI educational assistance”.
3. Cambia la habilitación, cantidad de respuestas o nivel.
4. Pulsa “Save AI policy now”.
5. Ve la confirmación de actualización inmediata y permanece en la página de edición.

**Flujos alternos:** si desmarca la habilitación, los controles de cuota y nivel se desactivan y la cuota mostrada pasa a cero. Una cuota inválida muestra un aviso. Si no tiene acceso o el guardado falla, recibe un mensaje y no se confirma el cambio.

**Postcondiciones:** las nuevas solicitudes se rigen por la configuración guardada. El consumo anterior permanece. Este botón guarda la política de IA independientemente del botón general para guardar otros cambios.

## RF-03. Configurar la ayuda al clonar una asignación

**Descripción:** permitir elegir la ayuda de IA de la nueva asignación durante una clonación.

**Usuario:** docente propietario.

**Precondiciones:** acceso a la asignación de origen y otro grupo propio apto como destino.

**Flujo normal:**
1. En la lista de asignaciones, el docente pulsa “Clone”.
2. Selecciona el grupo destino y revisa los datos de la copia.
3. En la sección de ayuda educativa, revisa o modifica habilitación, cuota y nivel.
4. Envía el formulario de clonación.
5. El sistema crea una nueva asignación con la política del formulario.

**Flujos alternos:** puede dejar el asistente deshabilitado. Si destino, cuota u otros datos son inválidos, corrige el formulario. Si falla la clonación, recibe un aviso.

**Postcondiciones:** la copia tiene su propia configuración; las conversaciones y respuestas utilizadas en la asignación original no aparecen en la copia.

## RF-04. Abrir el asistente y consultar disponibilidad

**Descripción:** mostrar al estudiante la conversación, la ayuda permitida y las respuestas restantes.

**Usuario:** estudiante.

**Precondiciones:** sesión iniciada y acceso al espacio de trabajo de la asignación.

**Flujo normal:**
1. El estudiante abre la asignación.
2. Pulsa el botón flotante “AI help”.
3. Se abre el panel “AI educational assistant”.
4. Observa las respuestas restantes, el nivel de ayuda y los mensajes anteriores.
5. Puede cerrar el panel con el botón de cierre y continuar trabajando en la asignación.

**Flujos alternos:** sin preguntas previas, ve un mensaje de conversación vacía. Si no puede pedir ayuda, ve el motivo y el envío deshabilitado. Si la carga falla, ve un aviso con una opción para actualizar el historial.

**Postcondiciones:** el estudiante conoce la disponibilidad; abrir o cerrar el panel no utiliza una respuesta.

## RF-05. Leer y aceptar el aviso de envío de datos

**Descripción:** informar al estudiante de qué información se envía a Gemini antes de usar el asistente.

**Usuario:** estudiante.

**Precondiciones:** panel abierto y aviso todavía no aceptado para ese usuario y versión en el navegador actual.

**Flujo normal:**
1. El estudiante pulsa “Review AI data sharing before asking”.
2. Lee el aviso sobre su pregunta, información pública de la asignación y mensajes anteriores, además de las opciones para compartir código y ejecución.
3. Pulsa “I understand and accept”.
4. El aviso se contrae y desaparece su botón de revisión para el usuario que ya lo aceptó.
5. Puede enviar una pregunta cuando también cumpla las demás condiciones del panel.

**Flujos alternos:** si no acepta, “Ask assistant” permanece deshabilitado. Si cambia de navegador, borra almacenamiento o cambia la versión del aviso, deberá aceptarlo nuevamente. Si el navegador no permite guardar la aceptación, esta solo se conserva mientras el componente siga abierto.

**Postcondiciones:** el usuario ha aceptado el aviso en la interfaz; en el navegador se recuerda la aceptación cuando el almacenamiento está disponible.

## RF-06. Solicitar orientación educativa

**Descripción:** permitir una pregunta relacionada con la asignación y mostrar una respuesta educativa revisada.

**Usuario:** estudiante.

**Precondiciones:** panel disponible para preguntar, aviso aceptado y ausencia de otra pregunta pendiente.

**Flujo normal:**
1. El estudiante escribe su duda en “Ask for help with this assignment”.
2. Conserva desmarcadas las opciones de compartir información adicional si no desea adjuntarla.
3. Pulsa “Ask assistant”.
4. Su pregunta aparece en una burbuja y se muestra “Thinking…” con una animación de espera.
5. Recibe la respuesta en una burbuja del asistente; aparecen la explicación, posibles fragmentos y pregunta de seguimiento.
6. La información se revela progresivamente y se actualiza la cantidad de respuestas restantes.
7. Puede escribir una nueva pregunta para continuar la misma conversación.

**Flujos alternos:** una pregunta vacía no permite enviar. Si solicita más ayuda de la permitida, puede recibir una orientación alternativa. Si la pregunta se bloquea, ve un mensaje que invita a preguntar por un concepto o paso. Si no se logra una respuesta válida o ocurre un fallo, ve un aviso sin descuento de respuestas. Si cambian las condiciones de acceso mientras espera, se informa que la solicitud no pudo entregarse.

**Postcondiciones:** una respuesta entregada queda en la conversación y actualiza el saldo; un intento sin respuesta entregada no reduce la cuota. El texto de entrada se limpia y las opciones de compartir se desmarcan después del envío.

## RF-07. Compartir el código actual para una pregunta

**Descripción:** permitir que el estudiante incorpore voluntariamente el contenido actual de su editor al pedir ayuda.

**Usuario:** estudiante.

**Precondiciones:** condiciones para preguntar cumplidas y código disponible en el editor.

**Flujo normal:**
1. El estudiante escribe o modifica su código en el editor de la asignación.
2. Abre el asistente y escribe una duda.
3. Marca “Share current editor code with AI for this question”.
4. Pulsa “Ask assistant”.
5. Recibe una respuesta que puede tomar en cuenta el código compartido.

**Flujos alternos:** si desmarca la opción antes de enviar, el código no se comparte. Si el editor está vacío o supera el tamaño permitido, aparece el aviso y no puede enviar con esa opción marcada; puede corregir el código o desmarcarla.

**Postcondiciones:** la pregunta utiliza el código capturado al enviarla. La opción queda desmarcada para la siguiente pregunta y la respuesta no sustituye el código del editor.

## RF-08. Compartir el resultado de la última ejecución

**Descripción:** permitir orientación que considere una ejecución anterior del estudiante en la misma asignación.

**Usuario:** estudiante.

**Precondiciones:** condiciones para preguntar cumplidas; una ejecución previa es recomendable, pero su ausencia no impide solicitar ayuda.

**Flujo normal:**
1. El estudiante escribe una pregunta en el asistente.
2. Marca “Share my latest finished execution result for this assignment”.
3. Pulsa “Ask assistant”.
4. El sistema selecciona el último resultado de ejecución apto de ese estudiante.
5. Recibe una respuesta que puede considerar el resultado disponible.

**Flujos alternos:** si no existe un resultado terminado, recibe ayuda con el resto de la información y ve el aviso de que no se encontró una ejecución para incluir. Si los detalles ya no están disponibles, el sistema puede usar el resumen conservado. Si no marca la opción, no comparte ejecución.

**Postcondiciones:** no se inicia una ejecución adicional al pedir ayuda. La selección se desmarca para la próxima pregunta.

## RF-09. Leer respuestas y controlar su presentación

**Descripción:** facilitar la lectura de respuestas, código y preguntas de seguimiento como una conversación.

**Usuario:** estudiante.

**Precondiciones:** respuesta aprobada disponible en el panel.

**Flujo normal:**
1. El estudiante observa la respuesta que aparece progresivamente.
2. Si desea verla completa de inmediato, pulsa “Show full answer”.
3. Lee la explicación, los fragmentos con resaltado de sintaxis y la pregunta de seguimiento en color diferenciado.
4. Puede desplazarse hacia arriba para revisar mensajes anteriores.

**Flujos alternos:** con la preferencia del dispositivo de reducir movimiento, la respuesta aparece completa sin esa animación. Los mensajes anteriores se muestran completos al cargar el historial. Si se desplaza hacia arriba durante la respuesta, la lectura no lo devuelve forzosamente al final.

**Postcondiciones:** el estudiante puede leer y continuar; cambiar la presentación no solicita otra respuesta ni consume cuota.

## RF-10. Consultar el historial de la conversación

**Descripción:** permitir revisar preguntas y respuestas propias, tanto en el panel como en una página de historial.

**Usuario:** estudiante dueño de la conversación.

**Precondiciones:** sesión iniciada; para mostrar mensajes debe existir conversación retenida o registros de ella.

**Flujo normal:**
1. El estudiante abre el panel y revisa las burbujas de la conversación.
2. Si hay preguntas anteriores sin cargar, pulsa “Load older questions”.
3. Para abrir la página dedicada, pulsa “Full history”.
4. La página muestra su conversación y el saldo disponible.
5. Puede cargar mensajes más antiguos o pulsar “My assignments” para volver a sus asignaciones.

**Flujos alternos:** puede acceder a una URL de historial guardada aunque haya terminado la matrícula o cerrado la asignación. Sin historial, ve el estado vacío correspondiente. Si el grupo fue archivado o eliminado, ve avisos de texto borrado y los registros conservados. Si intenta consultar una conversación ajena o la carga falla, recibe un aviso de acceso o carga.

**Postcondiciones:** la consulta no modifica consumo, texto ni permiso para solicitar nueva ayuda.

## RF-11. Recuperar una solicitud interrumpida

**Descripción:** permitir que el estudiante compruebe lo sucedido cuando la conexión se interrumpe o una pregunta sigue pendiente.

**Usuario:** estudiante.

**Precondiciones:** pregunta enviada desde el panel y resultado incierto, pendiente o fallido.

**Flujo normal:**
1. El estudiante ve un aviso de interrupción o espera.
2. Si aparece “Retry same request”, pulsa el botón.
3. El sistema intenta recuperar esa misma pregunta y actualiza historial y saldo.
4. Cuando hay una respuesta terminada, la muestra en la conversación.

**Flujos alternos:** si ya no se conserva el reintento en el panel, aparece “Refresh history”; el estudiante lo pulsa para comprobar los registros. Mientras la pregunta siga pendiente, el panel actualiza su estado automáticamente. Si ya terminó con fallo, repetirla recupera ese resultado; para otro intento el estudiante escribe y envía una nueva pregunta cuando se permita. Tras recargar o cerrar el panel, puede consultar historial aunque ya no se conserve el reintento local.

**Postcondiciones:** recuperar la misma solicitud no descuenta una segunda respuesta ni añade otra pregunta duplicada.

## Referencias de interfaz

- [Controles del docente](../../codehive-frontend/app/features/teacher/components/AiPolicyFields.tsx).
- [Panel del estudiante](../../codehive-frontend/app/features/student/components/AssistantPanel.tsx).
- [Entrada y aceptación](../../codehive-frontend/app/features/student/components/AssistantComposer.tsx).
- [Página de historial](../../codehive-frontend/app/features/student/pages/AssistantHistoryPage.tsx).

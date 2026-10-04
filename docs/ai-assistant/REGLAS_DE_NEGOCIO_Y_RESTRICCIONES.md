# Asistente educativo de IA: reglas de negocio y restricciones

Documento basado en la implementación revisada el 4 de octubre de 2026. Las reglas definen condiciones del dominio y límites obligatorios; los recorridos de pantalla están en [requerimientos funcionales](REQUERIMIENTOS_FUNCIONALES.md).

## Reglas de negocio

| ID | Regla | Descripción |
| --- | --- | --- |
| RN-01 | Uso exclusivo de estudiantes | Solo un usuario con rol estudiante puede solicitar ayuda y consultar su conversación. El docente configura la política, pero no utiliza el asistente como estudiante. |
| RN-02 | Configuración por asignación | Cada asignación tiene una política independiente: habilitación, cuota y nivel de ayuda. La configuración general del servicio también debe permitir nuevas solicitudes. |
| RN-03 | Responsable de la configuración | Solo el propietario autorizado de la asignación puede modificar su política, dentro de un grupo que permita modificaciones. |
| RN-04 | Cuota máxima | La cuota habilitada debe ser un entero entre 1 y 10 respuestas por estudiante y asignación. Es un máximo de respuestas entregadas, no un máximo absoluto de intentos. |
| RN-05 | Deshabilitación | Una asignación con el asistente deshabilitado debe tener cuota 0. Deshabilitarlo no elimina ni reinicia el consumo anterior. |
| RN-06 | Consumo de cuota | Una respuesta validada y entregada consume una unidad. Una redirección educativa entregada también consume una unidad. Preguntas bloqueadas, fallos, cancelaciones y solicitudes pendientes no consumen respuestas. |
| RN-07 | Consumo acumulado | El consumo no se reinicia por tiempo, reapertura, cambio de cuota o deshabilitación y rehabilitación. Si la cuota nueva es menor o igual al consumo acumulado, no quedan respuestas disponibles. |
| RN-08 | Tres niveles de ayuda | **Solo conceptual:** conceptos y terminología, sin pasos específicos ni código. **Explicaciones y guía:** pistas y preguntas orientadoras, sin código ni pseudocódigo. **Explicaciones, guía y fragmentos:** permite fragmentos breves de código o pseudocódigo relacionados con la asignación. |
| RN-09 | Prohibición de soluciones completas | Ningún nivel permite una solución completa lista para entregar. También se revisa que respuestas sucesivas no reconstruyan una solución completa. |
| RN-10 | Conversación única | Existe una sola conversación continua para cada pareja estudiante/asignación. Las preguntas forman parte de esa misma conversación. |
| RN-11 | Una solicitud en curso | La conversación puede tener como máximo una solicitud pendiente. Una segunda solicitud distinta espera hasta que la anterior termine o deje de estar pendiente. |
| RN-12 | Elegibilidad académica | Para nueva ayuda se requiere estudiante habilitado para participar, matrícula activa, grupo activo y no archivado, asignación activa, publicada y lista, y fecha de cierre todavía no alcanzada. El lenguaje elegido debe estar permitido. La fecha de entrega por sí sola no equivale al cierre. |
| RN-13 | Cambios durante la respuesta | La elegibilidad se revisa antes de las llamadas al modelo y antes de entregar. Un cambio de política exige comprobar la respuesta con la política vigente. Si ya no cumple o se pierde el acceso, no se entrega ni se cobra. |
| RN-14 | Código mediante elección explícita | Solo se incorpora el código actual del editor cuando el estudiante selecciona compartirlo para esa pregunta. Las selecciones se desmarcan después del envío. |
| RN-15 | Ejecución mediante elección explícita | Solo se incorpora ejecución si el estudiante lo solicita. Se elige la más reciente no pendiente, iniciada por ese estudiante en esa asignación; las reevaluaciones automáticas quedan excluidas. El estudiante no puede seleccionar una ejecución ajena. |
| RN-16 | Contexto público | La IA recibe una proyección de información pública de la asignación y contexto permitido. No se incorporan pruebas privadas ni código de referencia. Los resultados definitivos no aportan diagnósticos por prueba privada. |
| RN-17 | Antecedentes permitidos | El contexto conversacional incluye respuestas entregadas y retenidas, compatibles con el nivel vigente. Se excluyen mensajes borrados y respuestas producidas con un nivel más permisivo que el actual. |
| RN-18 | Redirección educativa | Una petición que excede la ayuda permitida puede recibir orientación dentro del nivel autorizado. Un intento bloqueado no recibe respuesta generada. La clasificación de entrada utiliza una llamada al proveedor de IA. |
| RN-19 | Validación previa | Solo se muestra una respuesta después de que haya superado comprobaciones de formato, límites y contenido educativo, y haya sido guardada con su consumo correspondiente. |
| RN-20 | Regeneración limitada | Se permite una regeneración interna después de un candidato rechazado. Si el segundo candidato tampoco cumple, el intento termina sin entregar respuesta y sin consumir cuota de respuestas. |
| RN-21 | Reenvío de la misma solicitud | Repetir el identificador y contenido de una solicitud recupera su resultado o estado sin generar ni cobrar otra respuesta. Reutilizar el identificador con contenido distinto se rechaza. Un nuevo identificador representa un intento nuevo. |
| RN-22 | Conservación del historial | Al cerrar la asignación o terminar la matrícula, la conversación propia sigue siendo consultable mientras se conserve su texto. Esto no autoriza nueva ayuda. |
| RN-23 | Borrado por ciclo de vida del grupo | Archivar o eliminar lógicamente el grupo borra definitivamente preguntas y respuestas y cancela solicitudes pendientes. Se conservan registros de propiedad, estado y consumo. Restaurar o desarchivar no restaura el texto. |
| RN-24 | Trazabilidad de preguntas bloqueadas | Una pregunta bloqueada conserva su texto original hasta el borrado del grupo. No se guarda el contexto completo usado para revisarla. |
| RN-25 | Política inicial y copia | Las asignaciones nuevas parten de una política deshabilitada si no se indica otra. Crear o clonar aplica la política elegida en el formulario; una clonación es otra asignación y no hereda conversaciones ni consumo de la original. |

## Restricciones de entrada, contenido y operación

| ID | Restricción | Límite o comportamiento |
| --- | --- | --- |
| RT-01 | Pregunta | Debe contener texto y tener como máximo 2.000 caracteres. |
| RT-02 | Código seleccionado | Debe contener texto y tener como máximo 32.768 caracteres. Sin selección explícita, no debe adjuntarse código. |
| RT-03 | Fragmentos generados | Máximo dos fragmentos; cada uno hasta 600 caracteres y 12 líneas. Solo se permiten en el nivel con fragmentos. |
| RT-04 | Respuesta estructurada | Se revisan explicación, fragmentos y pregunta de seguimiento. Se aplican límites de tamaño y se rechazan estructuras incorrectas, código no permitido y contenido inseguro. |
| RT-05 | Contexto acotado | La preparación limita datos de asignación, historial y diagnósticos. Si falta o expiró un reporte, la ayuda puede continuar con el resumen disponible. |
| RT-06 | Protección de solicitudes | El envío del asistente admite hasta 10 solicitudes por 60 segundos por sujeto autenticado en cada proceso backend. Esta protección es independiente de la cuota de respuestas. |
| RT-07 | Protección del proveedor | Las llamadas al proveedor tienen presupuesto por minuto, concurrencia y tiempo de espera acotados. Los valores operativos pueden configurarse. |
| RT-08 | Solicitudes abandonadas | Una solicitud pendiente tiene una reserva temporal de tres minutos. Las reservas vencidas se recuperan para impedir bloqueos permanentes y entregas tardías. |
| RT-09 | Aceptación del aviso | La interfaz requiere aceptar el aviso de envío de datos a Gemini antes de preguntar. La aceptación se recuerda por usuario y versión en ese navegador; actualmente no constituye un registro de consentimiento almacenado en el servidor. |
| RT-10 | Presentación de código | Los fragmentos se muestran como texto con resaltado, sin ejecutarse ni insertarse automáticamente en el editor. |

## Alcance actual

No están implementados un bloqueo temporal por rechazos repetidos, un máximo vitalicio independiente de intentos fallidos ni una caché de rechazos equivalentes con identificadores nuevos. Tampoco se transmiten tokens del proveedor al estudiante: la presentación progresiva ocurre en el navegador después de validar la respuesta.

Referencias de implementación: [política](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssignmentAiPolicy.java), [conversación](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssistantConversation.java), [coordinador](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantService.java). Los valores de configuración actuales deben consultarse en [application.properties](../../codehive-backend/src/main/resources/application.properties).

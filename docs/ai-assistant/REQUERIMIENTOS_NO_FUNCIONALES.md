# Asistente educativo de IA: requerimientos no funcionales

Revisión: 4 de octubre de 2026. Se describen propiedades de calidad y operación presentes en la implementación. No se establece un SLA de disponibilidad o una garantía de exactitud del modelo.

## RNF-01. Control de acceso y aislamiento

**Descripción:** las solicitudes deben usar autenticación del sistema y comprobar rol, participación y propiedad de la conversación en el servidor. La identidad del estudiante procede de la sesión autenticada; no debe confiarse en una identidad o ejecución ajena indicada por el cliente.

## RNF-02. Minimización de datos enviados

**Descripción:** el contexto debe construirse mediante campos expresamente permitidos y límites de tamaño. Código y ejecución requieren selecciones independientes. Pruebas privadas y código de referencia deben permanecer fuera del contexto enviado al proveedor.

## RNF-03. Conservación limitada y borrado coherente

**Descripción:** preguntas y respuestas se conservan hasta el archivo o eliminación lógica del grupo. El borrado debe coordinarse con ese cambio de estado y conservar únicamente los registros necesarios de propiedad, estado y consumo. No se persisten adjuntos completos ni candidatos rechazados.

## RNF-04. Integridad de cuota y concurrencia

**Descripción:** la reserva y finalización deben protegerse con transacciones y bloqueos de base de datos. Guardar la respuesta y registrar el consumo forman una operación atómica. Solicitudes simultáneas y reintentos no deben superar la cuota ni producir doble cobro.

## RNF-05. Resiliencia ante fallos externos

**Descripción:** tiempos de espera, errores, saturación o límites del proveedor deben producir resultados controlados y mensajes seguros. Una interacción sin respuesta entregada no consume cuota de respuestas. Las reservas vencidas deben recuperarse para permitir nuevas solicitudes.

## RNF-06. Uso acotado de recursos

**Descripción:** el servicio limita frecuencia de solicitudes, llamadas al proveedor, tareas concurrentes, cola de espera, tamaños de contexto y salida, y regeneraciones. Las llamadas al modelo tienen un plazo configurable. Estas medidas reducen saturación y consumo descontrolado, aunque los presupuestos actuales de frecuencia son locales a cada proceso backend.

## RNF-07. Seguridad del contenido mostrado

**Descripción:** las respuestas pasan por comprobaciones deterministas y semánticas antes de entregarse. El navegador presenta código como texto y conserva el escape de contenido. El resaltado no debe ejecutar instrucciones del modelo ni modificar automáticamente el editor.

## RNF-08. Accesibilidad y lectura

**Descripción:** el panel ofrece controles etiquetados, estados de espera y mensajes comprensibles. La aparición progresiva puede omitirse y respeta la preferencia de reducir movimiento. Los estilos distinguen pregunta, respuesta y seguimiento en temas claro y oscuro. El desplazamiento permite leer mensajes anteriores durante una respuesta.

## RNF-09. Adaptación a pantalla

**Descripción:** el asistente debe ser utilizable en pantallas pequeñas y grandes. El panel conserva zonas desplazables para conversación y formulario, y permite cerrarse para continuar usando la asignación.

## RNF-10. Observabilidad sin exposición de contenido

**Descripción:** los registros operativos incluyen identificadores, estados, códigos seguros, duración y metadatos de uso del modelo cuando están disponibles. No deben incluir preguntas, adjuntos, contexto completo, respuestas ni cuerpos de error del proveedor.

## RNF-11. Configuración y mantenimiento

**Descripción:** habilitación global, proveedor, modelo, credenciales, tiempo de espera y presupuesto de llamadas se suministran mediante configuración backend. La clave se mantiene fuera del navegador y de los textos de conversación. El contrato del asistente utiliza una interfaz de modelo que permite mantener la lógica educativa separada de la integración Spring AI/Gemini.

## RNF-12. Consistencia de la experiencia

**Descripción:** historial y saldo deben reflejar resultados persistidos. La animación de texto comienza después de la aprobación y no presenta respuestas provisionales. La interfaz ofrece estados distintos para espera, ausencia de historial, falta de disponibilidad y fallo, sin mostrar etiquetas técnicas de resultados como encabezados de chat.

Referencias: [contexto permitido](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantContextService.java), [adaptador de IA](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/SpringAiAssistantModelGateway.java), [transacciones](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java).

# Actualizar BarberControl — apariencia y agenda

Esta actualización no modifica hojas, citas, eventos ni identificadores.

## Barber Admin
Reemplaza [Index.html](../apps/admin/Index.html) y [Gestion.gs](../apps/admin/Gestion.gs) en el proyecto actual. Conserva las propiedades y los archivos restantes. Guarda y publica una nueva versión del despliegue.

- Configuración (engranaje) → Apariencia: tema claro u oscuro, guardado mediante UserProperties y una copia local.
- Horarios de atención y bloqueos: selectores de hora, minutos y a. m./p. m. Los valores internos conservan HH:mm para ser compatibles con Sheets y Calendar.
- Agenda: botón grande Actualizar reservaciones. Se selecciona hoy por defecto en el mes actual; al seleccionar un día o actualizar, se limpia la lista de citas y aparece una barra animada roja, blanca y azul debajo del calendario. Al terminar se muestran las citas, un mensaje de día vacío o un error recuperable. Las respuestas antiguas no reemplazan una selección más reciente.
- Cada cita muestra dos accesos a WhatsApp: Confirmar por WhatsApp (mensaje completo con cliente, corte, fecha, hora y barbería) y Enviar mensaje (saludo que el barbero puede completar). El enlace no envía automáticamente el mensaje ni cambia el estado de la reserva.

## Barber Public
Reemplaza solamente [Index.html](../apps/public/Index.html) en tu proyecto público. Guarda y publica una nueva versión.

- Estilos, Mi cita y Ajustes son botones internos: no navegan al marco superior de Apps Script. Contacto conserva el enlace de WhatsApp.
- Mi cita muestra el formulario o comprobante de la sesión actual. Si aún no se seleccionó un corte, se muestra un botón para explorar estilos.
- Ajustes ofrece los temas claro y oscuro. La elección se guarda en localStorage, separado de la caché del catálogo. Si el navegador impide el almacenamiento local, se aplica durante la sesión pero no se garantiza la persistencia.
- Una fotografía principal se puede abrir a tamaño mayor aun cuando no tenga imágenes adicionales. El carrusel mantiene las flechas cuando hay varias; con una sola se ocultan las flechas.

No es necesario volver a ejecutar instalarBarberControl ni crear propiedades a mano.

## Comprobaciones en Google Apps Script
1. Abrir cada despliegue /exec actualizado, seleccionar tema claro, recargar y comprobar que se mantiene; repetir con oscuro.
2. En Public, pulsar Estilos, Mi cita, Ajustes y Contacto desde un celular. Elegir un corte y regresar a Mi cita sin recargar.
3. Abrir una foto única y un corte con varias fotos; verificar el botón cerrar.
4. En Admin, abrir diferentes días, pulsar Actualizar y comprobar la barra de carga, el listado y el mensaje de día sin reservas.
5. Verificar medianoche y mediodía (12:00 a. m. y 12:00 p. m.) en controles y que los datos guardados sigan siendo HH:mm.
6. Abrir ambos enlaces WhatsApp de una cita de prueba y comprobar el destinatario y el texto; el envío depende de la acción del barbero.

Las pruebas automáticas verifican la lógica, no reproducen el despliegue real ni garantizan el aspecto visual en cada dispositivo.

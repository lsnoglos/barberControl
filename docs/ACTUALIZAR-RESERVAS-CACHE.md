# Actualización: reserva animada, WhatsApp y caché local

Esta versión reutiliza las aplicaciones **Barber Admin** y **Barber Public** existentes. No borra citas, calendarios, servicios ni imágenes.

## Cambios funcionales

- Al confirmar una reserva aparece un **tubo de barbería animado en CSS**, inspirado en la referencia GIF. El fondo se bloquea para impedir pulsaciones repetidas.
- El diálogo desaparece al confirmar, al producirse un error o si se excede la espera de 60 segundos. Si hay error de comunicación, **comprueba el calendario antes de repetir**, porque la cita podría haberse registrado.
- El comprobante muestra **día de la semana, día, mes, año, servicio, importe, hora a. m./p. m. y código de cita**.
- El botón opcional **Avisar al barbero por WhatsApp** abre un mensaje preparado con fecha, hora, servicio y código; no lo envía automáticamente.
- El catálogo y fotos públicas se guardan en localStorage con límites de tamaño e invalidación por versión en Sheets; los filtros y la ordenación reutilizan fotos ya descargadas. El sistema funciona aunque el navegador rechace el almacenamiento local, usando memoria temporal.
- Horarios disponibles, datos de cliente y reservaciones **nunca** se guardan en la caché del navegador.

## A. Actualizar Barber Admin (proyecto privado)

En Apps Script abre el proyecto **Barber Admin** existente y copia desde [apps/admin](../apps/admin):

| Archivo | Acción |
|---|---|
| [VersionCatalogo.gs](../apps/admin/VersionCatalogo.gs) | **Crear** archivo .gs con el mismo nombre |
| [Gestion.gs](../apps/admin/Gestion.gs) | Reemplazar |
| [Catalogos.gs](../apps/admin/Catalogos.gs) | Reemplazar |
| [Marca.gs](../apps/admin/Marca.gs) | Reemplazar |
| [Instalador.gs](../apps/admin/Instalador.gs) | Reemplazar |

Antes de actualizar, realiza una **copia de seguridad** de \`BarberControl_DB\`. No cambies las Script Properties.

Una vez guardados los archivos, ejecuta **\`instalarBarberControl\` una vez** desde la barra superior de Apps Script. Es idempotente y reutiliza Sheets, Calendar y Drive existentes. Acepta la autorización que solicite Google para crear el activador de edición.

Verifica que:

- En la hoja \`Configuracion\` exista \`PUBLIC_CATALOG_VERSION\`.
- En **Desencadenadores/Activadores** de Apps Script exista \`barberControlOnEditCatalogo_\`, ligado a la edición del Spreadsheet.

Este activador actualiza la marca cuando se editan directamente en Sheets las pestañas \`Servicios\`, \`Estilos\`, \`Categorias\` o \`Configuracion\`. Las operaciones desde el panel Admin actualizan esa marca por código.

Por último: **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**.

## B. Actualizar Barber Public (proyecto público)

En Apps Script abre **Barber Public** y copia desde [apps/public](../apps/public):

| Archivo | Acción |
|---|---|
| [Index.html](../apps/public/Index.html) | Reemplazar contenido de tu \`index.html\` |
| [Escaparate.gs](../apps/public/Escaparate.gs) | Reemplazar |

No cambies \`Code.gs\`, \`Datos.gs\`, \`Disponibilidad.gs\`, \`Reservas.gs\`, \`Puente.gs\` ni las propiedades de Google.

Después: **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. La URL \`/exec\` anterior no cambia; se actualiza su versión.

## C. Pruebas

1. Abre la web pública y explora varios estilos. Filtra y ordena: las fotos ya descargadas deben reutilizarse.
2. Haz una reserva de prueba. Al pulsar Confirmar debe aparecer la animación de tubo que bloquea la pantalla.
3. Comprueba el mensaje completo: por ejemplo, «miércoles 4 de noviembre de 2026», «2:15 p. m.» y código BC.
4. Abre el botón opcional de WhatsApp; revisa el texto antes de enviarlo.
5. Verifica que la cita se registró en \`BarberControl_DB/Reservas\` y \`BarberControl - Citas\`.
6. Modifica un servicio o fotografía desde Admin y recarga la web pública: debe actualizarse su caché.
7. Edita una descripción directamente desde Sheets. Comprueba que cambia la marca \`PUBLIC_CATALOG_VERSION\` y luego recarga el catálogo.

## D. Detalles y límites

- La animación se construyó con CSS y no descarga el GIF de referencia. Por ello funciona incluso con mala conexión y mantiene coherencia visual con el tema oscuro.
- La caché de fotos está limitada a cerca de **1,8 millones de caracteres** de Base64 para no agotar el espacio de localStorage. Las imágenes mayores se reutilizan en memoria mientras la pestaña siga abierta.
- Algunos navegadores no permiten localStorage dentro de iframes o en navegación privada; el sistema sigue funcionando sin persistencia entre visitas.
- La detección de versiones cubre cambios hechos desde Admin y ediciones manuales de las pestañas comerciales en Sheets. No vigila modificaciones manuales de archivos directamente dentro de Drive.
- La disponibilidad se revalida en el servidor cada vez que se confirma la cita. Una respuesta tardía **no significa que no se haya registrado**.
- El código pasó pruebas automatizadas de sintaxis y lógica; deben realizarse pruebas reales en tus dos despliegues de Google.

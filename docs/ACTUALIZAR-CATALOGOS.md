# Actualizar BarberControl: estilos, fotografías y videos

## Qué incorpora esta versión

- **Panel privado**: crea/edita estilos y sus técnicas/orígenes, vincula servicios ya registrados, carga portada desde celular o computadora, activa/oculta estilos.
- **Trabajos**: crea publicaciones asociadas a servicio y estilo, carga hasta 8 fotos por operación, añade un video opcional de YouTube, marca destacados, despublica fotos o videos y edita publicaciones.
- **Web pública**: muestra estilos, origen, técnica y álbumes de trabajos autorizados; reproduce videos de YouTube incrustados bajo demanda; **Reservar este estilo / Quiero este corte** abre la agenda con el servicio seleccionado y conserva los IDs del estilo/trabajo en la cita.
- **Datos existentes**: se reutilizan las hojas \`Servicios\`, \`Estilos\`, \`Galeria\`, \`Medios\`, \`Reservas\`. No se requiere instalar otra base de datos.

## Antes de actualizar

1. Confirma que el proyecto **Barber Admin** ya abre y funciona.
2. En Drive, comprueba que existe \`BarberControl_DB\` con las nueve pestañas creadas por \`instalarBarberControl\`.
3. Haz una copia de respaldo de \`BarberControl_DB\` en Google Drive antes de realizar cambios.
4. Asegúrate de usar el **mismo proyecto Apps Script Admin**: NO crees un Admin nuevo para instalar esta mejora.

## A. Actualiza el proyecto PRIVADO (Barber Admin)

En [script.google.com](https://script.google.com), abre **Barber Admin**.

| Archivo en Apps Script | Acción | Copiar desde GitHub |
|---|---|---|
| \`Code.gs\` / \`Código.gs\` | Reemplaza el código | \`apps/admin/Code.gs\` |
| \`index.html\` / \`Index.html\` | Reemplaza TODO el contenido | \`apps/admin/Index.html\` |
| \`Catalogos.gs\` | **Nuevo → Secuencia de comandos** | \`apps/admin/Catalogos.gs\` |
| \`CatalogoPanel.html\` | **Nuevo → HTML**, nómbralo \`CatalogoPanel\` | \`apps/admin/CatalogoPanel.html\` |

**Conserva** los archivos \`Instalador.gs\`, \`Gestion.gs\` y \`appsscript.json\`; no necesitan actualizarse para esta funcionalidad.

**Importante**:
- Si el HTML existente se llama \`index.html\` (i minúscula), **no tienes que renombrarlo**. El nuevo \`Code.gs\` acepta \`index\` o \`Index\`.
- El nuevo archivo de la interfaz debe llamarse **exactamente \`CatalogoPanel.html\`**, respetando las mayúsculas.
- Al crear un archivo HTML, Google añade un contenido de ejemplo. **Borra el contenido completo** y pega el archivo de GitHub íntegro. No dejes \`<html>\` anidados.
- Guarda todo con Ctrl+S.

Luego, **Implementar → Administrar implementaciones → Editar (lápiz) → Versión: Nueva versión → Implementar**.
Abre la URL privada \`/exec\` ya creada: aparecerá la sección **7. Catálogo de estilos y galería multimedia**.

**No necesitas volver a ejecutar \`instalarBarberControl\`**; la estructura ya incluye las pestañas y carpetas necesarias. Si faltan por una instalación incompleta, el instalador es idempotente y puede repararlas sin borrar registros, previa copia de seguridad.

### Primer estilo

1. En **3. Servicios y precios**, registra o selecciona un servicio (ejemplo: Degradado, 45 minutos).
2. En **7. Catálogo de estilos**, escribe \`Low Fade\`, selecciona el servicio, agrega descripción, origen y técnica.
3. Selecciona una fotografía desde el teléfono o computadora, marca el permiso de publicación.
4. Deja marcados **Activo** y **Visible** y pulsa **Guardar estilo**.
5. El sistema comprime la imagen en el navegador, sube una copia JPEG a Drive y registra el ID en \`Estilos\`.

### Primera publicación de galería

1. En la misma sección, abre **Publicar un trabajo realizado**.
2. Escribe título, servicio, estilo (opcional), descripción.
3. Selecciona 1–8 fotos y, si lo deseas, pega un URL de video de YouTube.
4. Confirma la autorización del cliente, marca **Publicar** y pulsa **Guardar publicación y archivos**.
5. Para añadir más fotografías después, pulsa **Editar / añadir medios**, selecciona nuevas fotos y guarda otra vez.

Las publicaciones sin fotos ni videos no aparecen en la web pública hasta que tengan al menos un medio publicado. Puedes guardar borradores y publicarlos luego.

**Precaución:** si el proceso de subida falla en mitad de varias fotos, algunas podrían haberse guardado correctamente. Antes de repetir, revisa la lista de medios del trabajo para evitar duplicados.

## B. Actualiza el proyecto PÚBLICO

Si ya creaste el proyecto Apps Script **Barber Publico**, actualiza o añade:

| Archivo en Apps Script | Acción | Copiar desde GitHub |
|---|---|---|
| \`Code.gs\` | Reemplazar | \`apps/public/Code.gs\` |
| \`Index.html\` / \`index.html\` | Reemplazar | \`apps/public/Index.html\` |
| \`Reservas.gs\` | Reemplazar | \`apps/public/Reservas.gs\` |
| \`Catalogo.gs\` | **Nuevo** (.gs) | \`apps/public/Catalogo.gs\` |
| \`GaleriaPublica.html\` | **Nuevo** (HTML) | \`apps/public/GaleriaPublica.html\` |

Si todavía no has creado el proyecto público, sigue [DESPLIEGUE.md](DESPLIEGUE.md) y copia **todos los archivos** de \`apps/public\` además de estos.

Después vuelve a **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**.

### Recursos y permisos del proyecto público

En **Configuración del proyecto → Propiedades de secuencia de comandos**, verifica:

- \`SPREADSHEET_ID\`: el ID de \`BarberControl_DB\`.
- \`CALENDAR_ID\`: el ID de \`BarberControl - Citas\`.
- \`BRIDGE_SECRET\`: clave compartida que generó el instalador Admin.

Estas propiedades **se guardan en Google**; jamás deben publicarse en GitHub ni en HTML.

La web pública debe desplegarse ejecutándose con la cuenta propietaria y **acceso a cualquier persona, incluso anónima**. Ahora solicita permisos para **leer desde Drive**, porque entrega fotos a los clientes mediante funciones del servidor, sin dar acceso público a toda la carpeta.

### Prueba funcional

1. Abre la URL pública \`/exec\` en ventana de incógnito.
2. Comprueba que se visualizan **Estilos de corte** y **Galería de trabajos**.
3. Abre una publicación con foto y/o video. Haz clic en «Ver procedimiento en YouTube»: aparecerá el reproductor, cuando YouTube permita insertar ese video.
4. Pulsa **Quiero este corte**; la página debe saltar al calendario con el servicio correcto seleccionado.
5. Reserva una hora libre con datos de prueba. Comprueba la fila en \`Reservas\` con \`EstiloId\` y \`GaleriaId\`, y el evento de Google Calendar.
6. En Admin, oculta el estilo y publica una nueva versión si cambiaste código (el cambio de datos en Sheets se refleja sin volver a implementar). Al actualizar la página pública ya no debe mostrarse ese estilo.

## Cómo funciona el almacenamiento

- La foto se convierte a **JPEG** y se reduce a máximo **1.000 píxeles** en el navegador antes de subirla. Google Drive la guarda en subcarpetas \`Imagenes/Estilos\` o \`Imagenes/Galeria\`.
- Sheets solo registra identificadores y metadatos; las fotos no se guardan en celdas.
- Las fotos originales en Drive **siguen privadas**. La web pública obtiene una copia codificada únicamente después de comprobar los permisos de publicación y el consentimiento en Sheets.
- El video se aloja en **YouTube**. Sheets guarda su identificador y se inserta mediante \`youtube-nocookie.com/embed/ID\` cuando el cliente lo solicita.
- Las imágenes HEIC dependen de la compatibilidad del navegador con la decodificación. Si no abre, conviértelas a JPG previamente.

## Límites de la versión

- Primer enfoque para una barbería de bajo volumen, no para una plataforma de streaming masivo. Las imágenes se entregan como cadenas Base64 mediante Apps Script, por lo que se recomienda **una galería moderada**.
- Las reservas públicas existentes no se eliminan ni migran al actualizar los archivos.
- La aprobación del consentimiento depende del barbero. No almacena una firma digital del cliente.
- No se han probado estas actualizaciones en una cuenta de Google real desde el repositorio; las pruebas automatizadas verifican sintaxis y lógica aislada. Realiza la prueba privada antes de compartir el enlace.

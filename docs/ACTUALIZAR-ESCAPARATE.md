# BarberControl — Actualización de identidad y escaparate móvil

Versión: 2026-11-03 · Aplicaciones Google Apps Script independientes Admin + Público.

## Qué cambia
- La página del cliente **ya NO muestra la galería**; conserva los datos anteriores en Sheets y Drive para no perder material.
- El catálogo es **de estilos y servicios** con buscador, filtros horizontales (Todo, Cabello, Barba, Combos, Masajes, etc.) y orden por precio o nombre.
- Las categorías se crean en Admin; la categoría del estilo se **hereda del servicio asociado**.
- Configuración comercial: nombre, eslogan, logotipo PNG (admite transparencia) y número de WhatsApp.
- Cada tarjeta puede abrir la reserva con el estilo preseleccionado. El nuevo evento Calendar muestra **el nombre del estilo + el servicio**, además del identificador de estilo registrado en Sheets.
- Si hay un servicio activo sin estilos, también se muestra como tarjeta reservable.
- La portada destaca automáticamente una fotografía real de los estilos publicados, si existe.
- La web no exige inicio de sesión de los clientes.

## Importante: primero haz respaldo
Crea una copia de Google Sheets \`BarberControl_DB\` y verifica las reservas actuales. **No elimines los proyectos ni crees una nueva base de datos.**

## PASO 1 — Actualizar Barber Admin

En el proyecto **Barber Admin**, copia exactamente estos archivos desde GitHub:

| Apps Script | Carpeta GitHub | Acción |
|---|---|---|
| \`Instalador.gs\` | \`apps/admin/Instalador.gs\` | Reemplazar |
| \`Gestion.gs\` | \`apps/admin/Gestion.gs\` | Reemplazar |
| \`Code.gs\` | \`apps/admin/Code.gs\` | Reemplazar |
| \`index.html\` / \`Index.html\` | \`apps/admin/Index.html\` | Reemplazar |
| \`CatalogoPanel.html\` | \`apps/admin/CatalogoPanel.html\` | Reemplazar |
| \`Marca.gs\` | \`apps/admin/Marca.gs\` | **Crear nuevo** |
| \`MarcaPanel.html\` | \`apps/admin/MarcaPanel.html\` | **Crear nuevo (HTML)** |

Conserva los archivos existentes \`Catalogos.gs\` y \`appsscript.json\`.

Para crear los archivos nuevos:
1. Haz clic en el símbolo **+** junto a Archivos.
2. Para \`Marca.gs\`, elige **Secuencia de comandos** y escribe \`Marca\` como nombre.
3. Para \`MarcaPanel.html\`, elige **HTML** y escribe **exactamente** \`MarcaPanel\`.
4. Copia el contenido completo del archivo del repositorio correspondiente. No dejes HTML de ejemplo o etiquetas duplicadas.
5. Guarda todos los archivos (Ctrl+S).

### PASO 2 — Actualización de datos (una vez)

En el selector superior de funciones de Barber Admin, ejecuta **\`instalarBarberControl\`** nuevamente.

La función es **idempotente**: reutiliza Sheets, Calendar y carpetas existentes si sus IDs siguen en las Script Properties del mismo proyecto. No elimina reservas. Esta ejecución añade:

- Nueva hoja \`Categorias\`, inicialmente con Cabello, Barba, Combos, Masajes, Diseños, Tratamientos y Otros.
- Tres campos nuevos en \`Configuracion\`: \`TELEFONO_WHATSAPP\`, \`ESLOGAN_NEGOCIO\` y \`LOGO_FILE_ID\`.

Si ya hay información, no la reinicia. Revisa el registro de ejecución; si aparece un error **no publiques** hasta resolverlo.

### PASO 3 — Publicar nueva versión Admin

**Implementar → Administrar implementaciones → lápiz → Versión: Nueva versión → Implementar.**

Abre de nuevo la URL privada \`/exec\`.

En **Identidad de la barbería y categorías**:
1. Escribe el nombre comercial (por ejemplo, William Barber Shop).
2. Agrega un eslogan.
3. Introduce el WhatsApp comercial (8 dígitos locales de Nicaragua o número internacional con código de país).
4. Selecciona un **PNG con transparencia real** y guárdalo como logo.
5. Agrega, oculta o reactiva categorías.

En **Servicios y precios**, selecciona una categoría del desplegable, no la escribas libremente. En **Estilos de corte y servicios**, vincula cada estilo a su servicio y sube una fotografía.

**Nota sobre el logo aportado:** aunque el archivo tenga extensión PNG, si la imagen original tiene un rectángulo blanco dibujado detrás del logotipo, ese fondo no desaparecerá por sí solo. Utiliza una versión con canal alfa/transparencia real.

## PASO 4 — Actualizar Barber Public

En el proyecto **Barber-Public**, copia:

| Apps Script | Carpeta GitHub | Acción |
|---|---|---|
| \`index.html\` / \`Index.html\` | \`apps/public/Index.html\` | Reemplazar completo |
| \`Reservas.gs\` | \`apps/public/Reservas.gs\` | Reemplazar completo |
| \`Escaparate.gs\` | \`apps/public/Escaparate.gs\` | **Crear nuevo** |

Conserva estos archivos existentes sin cambio: \`Code.gs\`, \`Datos.gs\`, \`Disponibilidad.gs\`, \`Catalogo.gs\`, \`Puente.gs\` y \`appsscript.json\`.

\`GaleriaPublica.html\` puede quedar en el proyecto, pero **ya no se incluye ni se muestra**: no es necesario borrarlo.

Las tres Script Properties existentes siguen siendo las mismas:
- \`SPREADSHEET_ID\`
- \`CALENDAR_ID\`
- \`BRIDGE_SECRET\`

No las cambies ni copies sus valores en el código.

Después: **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**. Abre la URL pública \`/exec\` en incógnito.

## PASO 5 — Pruebas recomendadas

1. Se ve el logo, nombre y eslogan configurados en Admin.
2. El botón WhatsApp abre \`wa.me\` con el número configurado; si no se configuró, el botón se oculta.
3. Los chips **Todo, Cabello, Barba, Combos, Masajes** aparecen en móvil y filtran por categoría de servicio.
4. Se muestra la fotografía de los estilos publicados, y un servicio sin estilo aparece en una tarjeta de servicio.
5. Haz clic en **Reservar este estilo** en un estilo Low Fade. La agenda debe mostrar **Low Fade**, el servicio, el precio y su duración.
6. Elige fecha y hora; confirma con datos de prueba. Debe aparecer un código de reserva en pantalla.
7. Comprueba \`BarberControl_DB > Reservas\`: la columna \`EstiloId\` contiene el identificador del estilo.
8. Comprueba **Google Calendar > BarberControl - Citas**: el título del nuevo evento debe contener **Low Fade | Corte degradado** (los nombres serán los que configuraste).
9. El calendario del barbero debe estar marcado y visible. Las citas antiguas conservan sus títulos previos; solo las nuevas adoptarán el título por estilo.
10. Confirma que **Galería de trabajos** ya no aparece en la web pública y que las fotos anteriores continúan almacenadas en Drive.

## Límite de pruebas

La CI de GitHub valida sintaxis, permisos declarados y pruebas con mocks; **no equivale a ejecutar la aplicación en una cuenta de Google real**. Verifica las pruebas de autorización, visibilidad, archivos y Calendar después de desplegar. No compartas ningún secreto ni ID privado en capturas.

## Modelo de datos

\`Categorias\`: ID, Nombre, Orden, Activa.
\`Servicios\`: el campo \`Categoria\` guarda la categoría elegida y el servicio determina precio/duración.
\`Estilos\`: \`ServicioId\` conecta cada estilo con un servicio y hereda su categoría.
\`Configuracion\`: nombre, WhatsApp, eslogan, ID de logotipo y reglas de agenda.
\`Reservas\`: \`EstiloId\` guarda la referencia elegida; Calendar presenta el estilo y el servicio en el título.

**No hay migración destructiva**: se conservan los datos de \`Galeria\` y \`Medios\`, aunque se oculten en la página pública.

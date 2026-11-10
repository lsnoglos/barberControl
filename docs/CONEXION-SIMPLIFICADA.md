# Conectar Barber Admin y Barber Public con un único paquete

Los dos proyectos Apps Script **no comparten Script Properties**. El instalador privado crea y guarda sus valores; no tienes que buscarlos en Google Sheets, Calendar o Drive.

## Una sola configuración, sin copiar tres identificadores

### 1. Barber Admin (privado)
1. Desde GitHub copia las versiones actuales de `apps/admin/Instalador.gs` y `apps/admin/Index.html` a los archivos correspondientes del proyecto privado de Google Apps Script.
2. Guarda y publica una **nueva versión** del despliegue Admin.
3. Abre el panel y baja a **Conexión con el proyecto público**.
4. Pulsa **Generar paquete para Barber Public** y luego **Copiar paquete**.
5. El paquete contiene `SPREADSHEET_ID`, `CALENDAR_ID` y `BRIDGE_SECRET`. **Es secreto**. No lo envíes por WhatsApp, capturas, chats o repositorios. Úsalo solo en la configuración del proyecto público.

Si no hay recursos, ejecuta `instalarBarberControl` una vez desde el proyecto Admin.

### 2. Barber Public (editor privado del proyecto)
1. Crea un archivo de **secuencia de comandos** llamado `ConexionPublica.gs` y copia el contenido de [ConexionPublica.gs](../apps/public/ConexionPublica.gs).
2. Abre **Configuración del proyecto → Propiedades de las secuencias de comandos**.
3. Pulsa **Editar propiedades** y añade una sola propiedad:
   - Nombre: `PAQUETE_BARBERCONTROL`
   - Valor: pega el texto completo copiado de Admin.
4. Guarda.
5. En el selector de funciones del editor, elige `aplicarPaqueteConexionPublica` y pulsa **Ejecutar**. Autoriza el acceso a Google Sheets/Calendar si se solicita.
6. Comprueba el **Registro de ejecución**. Si todo fue bien, verás el nombre de la hoja y calendario conectados.
7. Verifica las propiedades: ya deben aparecer `SPREADSHEET_ID`, `CALENDAR_ID` y `BRIDGE_SECRET`. La propiedad temporal `PAQUETE_BARBERCONTROL` se elimina automáticamente.
8. **Elimina el archivo temporal `ConexionPublica.gs` del proyecto público** después de ejecutarlo: no se necesita para recibir reservas ni debe estar disponible para visitantes.
9. Publica una nueva versión del despliegue Público.

No borres los archivos actuales `Datos.gs`, `Disponibilidad.gs`, `Reservas.gs` ni `Puente.gs`.

### 3. Completar el enlace entre aplicaciones

En Admin, guarda la URL `/exec` de la aplicación Pública en **Vincular URL pública**. Esta URL no forma parte de la configuración inicial porque se obtiene al desplegar el proyecto público.

## Importante para la seguridad

- **El instalador no escribe automáticamente en las propiedades de otro proyecto**: Google separa los almacenes de propiedades entre scripts.
- Para evitar habilitar una ruta de instalación anónima que pudiera ser abusada, la importación se ejecuta **manualmente desde el editor privado**, nunca desde una pantalla web de clientes.
- No almacenes `BRIDGE_SECRET` en Google Sheets ni en archivos del repositorio.
- Si publicaste una captura con el valor de `BRIDGE_SECRET`, se recomienda **rotar esa clave** en Admin y volver a importar un paquete nuevo en Public antes de utilizar el sistema con clientes.
- El nombre `ROOT_FOLDER_ID` solamente se necesita en Admin; no es necesario copiarlo a Public.
- Si ya configuraste Public con las tres propiedades, no necesitas repetir la instalación. El paquete es una alternativa cómoda para instalaciones nuevas o para recuperar una conexión.

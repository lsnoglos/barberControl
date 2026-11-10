# BarberControl — Instalación y vinculación automática (sin copiar IDs)

## Resultado esperado

**No tienes que buscar identificadores de Google Sheets, Calendar o Drive, ni crear Script Properties manualmente.**

- `Barber Admin` crea y recupera recursos, guarda sus IDs en `PropertiesService` y deja un manifiesto en una carpeta privada separada de las fotos y la base de datos comercial.
- `Barber Public` encuentra automáticamente ese manifiesto desde Google Drive, valida los recursos y crea sus propias propiedades cuando se usa por primera vez.
- Ambas aplicaciones deben estar **desplegadas con la MISMA cuenta propietaria de Google** y ejecutarse como su propietario.

### Qué crea Admin

| Recurso | Creación |
|---|---|
| Carpeta `BarberControl` y subcarpetas | Automática |
| Archivo `BarberControl_DB` y pestañas | Automática |
| Calendario `BarberControl - Citas` | Automática |
| Propiedades `SPREADSHEET_ID`, `CALENDAR_ID`, `ROOT_FOLDER_ID`, `BRIDGE_SECRET` | Automática |
| Carpeta `BarberControl - CONFIG PRIVADA NO COMPARTIR` y manifiesto | Automática |

La carpeta de configuración privada se mantiene **separada** de `BarberControl` para reducir el riesgo de compartir accidentalmente el secreto del puente administrativo. No debes compartir esa carpeta con nadie.

## 1. Actualizar Barber Admin

En el proyecto existente `Barber Admin`, conserva tus demás archivos y actualiza solamente:

1. [Instalador.gs](../apps/admin/Instalador.gs) — reemplazar.
2. [ConexionAutomatica.gs](../apps/admin/ConexionAutomatica.gs) — **crear archivo nuevo** de tipo `Secuencia de comandos`.
3. [Index.html](../apps/admin/Index.html) — reemplazar si deseas ver el texto actualizado de conexión automática en el panel.

Haz copia de seguridad de `BarberControl_DB` antes de actualizar.

En el editor de Apps Script selecciona y ejecuta **`instalarBarberControl`**. El instalador:
- reutilizará tu Sheets y Calendar existentes si sus IDs están guardados;
- recuperará los IDs desde el manifiesto cuando ya exista;
- creará el manifiesto privado si aún no existe;
- generará automáticamente las propiedades faltantes;
- no pedirá que escribas nombres, IDs ni claves.

Si el proyecto ya existía antes de esta mejora, **no borres sus Script Properties antes de ejecutar por primera vez el instalador actualizado**. Hasta entonces aún no se ha creado el manifiesto de recuperación.

Puedes publicar una **nueva versión** del despliegue Admin después de actualizar su interfaz.

## 2. Actualizar Barber Public

En el proyecto Apps Script existente `Barber Public`, copia los archivos actualizados:

1. [ConexionPublica.gs](../apps/public/ConexionPublica.gs) — reemplazar si existía o crear archivo `.gs` nuevo.
2. [Datos.gs](../apps/public/Datos.gs) — reemplazar.
3. [Escaparate.gs](../apps/public/Escaparate.gs) — reemplazar.
4. [Puente.gs](../apps/public/Puente.gs) — reemplazar.

**No crees ninguna Script Property. No copies IDs ni paquetes. No tienes que ejecutar ninguna función adicional en Public.**

Guarda y utiliza **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**.

La primera consulta al catálogo crea automáticamente `SPREADSHEET_ID`, `CALENDAR_ID` y `BRIDGE_SECRET` dentro de las Script Properties de Barber Public. No devuelve sus valores al cliente.

Si Public ya tiene propiedades correctas de una instalación anterior, las reutilizará sin modificarlas. Por eso **no necesitas borrar las propiedades que ya funcionan**.

## 3. Probar

1. Ejecuta el instalador de Admin y comprueba que terminó sin errores.
2. En Drive, confirma que existe la carpeta `BarberControl - CONFIG PRIVADA NO COMPARTIR`. No abras ni compartas su archivo de configuración.
3. Abre la URL `/exec` de Public, preferiblemente en ventana incógnita.
4. Verifica que se muestran el nombre comercial, estilos y precios.
5. En el editor de Public (no la página pública) abre **Configuración del proyecto → Propiedades de las secuencias de comandos**. Ahora deben aparecer automáticamente `SPREADSHEET_ID`, `CALENDAR_ID` y `BRIDGE_SECRET`.
6. Prueba una reserva y verifica la coincidencia en Sheets y Calendar.

Para que Admin pueda crear y desactivar bloqueos mediante el proyecto público, sigue siendo necesario **registrar una sola vez la URL `/exec` pública en Admin**. Esa URL se genera al desplegar Public, por eso no se puede conocer antes.

## Seguridad y limitaciones

- Las operaciones de autovinculación están en funciones privadas de Apps Script terminadas en `_` y no pueden llamarse directamente desde `google.script.run`.
- El manifiesto contiene una clave secreta. Debe permanecer privado, nunca en Google Sheets ni en el contenido público de la aplicación.
- Los proyectos deben pertenecer y ejecutarse bajo la misma cuenta; si cambias el propietario, se requiere revalidar permisos.
- Si hay varias carpetas privadas con el mismo nombre, falla de manera segura en lugar de elegir recursos arbitrarios.
- El instalador automático no pretende gestionar varias barberías distintas desde una sola cuenta Google; esa capacidad necesitaría identificación de instancia.
- Si una de las aplicaciones ya apunta a otra base de datos, la autovinculación se detiene para evitar sobrescribirla.
- Si se cambia `BRIDGE_SECRET` después de una vinculación previa, habrá que coordinar su actualización en Public; la autovinculación inicial no reemplaza automáticamente una configuración completa ya existente.

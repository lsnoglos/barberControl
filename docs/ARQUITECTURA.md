# Arquitectura y seguridad de BarberControl

## Responsabilidades

**Admin** (`apps/admin`): editor de recursos y catálogos, instalación inicial, configuración y solicitudes firmadas de bloqueos de agenda. Se despliega como `MYSELF`, ejecutado por el propietario.

**Público** (`apps/public`): presentación, catálogo visible, disponibilidad, reservas y controlador firmado de bloqueos. Se despliega como `ANYONE_ANONYMOUS`, ejecutado por el propietario.

No se crean dos proyectos idénticos: los archivos y permisos de cada carpeta son diferentes. **Los proyectos no comparten Script Properties**. Deben recibir sus propios valores de configuración.

## Recursos compartidos

- `BarberControl_DB` (Sheets), creado automáticamente por el instalador Admin.
- `BarberControl - Citas` (Calendar), creado automáticamente por el instalador Admin.
- Carpeta `BarberControl` (Drive) con `Imagenes`, `Videos` y `Respaldos`.

Sheets contiene: `Configuracion`, `Horarios`, `Bloqueos`, `Servicios`, `Estilos`, `Galeria`, `Medios`, `Reservas` y `Auditoria`.

## Motor de reservas

1. Selecciona un servicio visible, activo y reservable.
2. Verifica fecha, apertura, cierre, duración y anticipación mínima.
3. Consulta reglas de bloqueo y reservas en Sheets y eventos de Calendar.
4. Calcula horas libres, sin revelar el nombre ni teléfono de clientes anteriores.
5. Antes de confirmar, obtiene `LockService.getScriptLock()` en el proyecto público y **recalcula la disponibilidad**.
6. Crea el evento Calendar, luego registra en Sheets. Si falla Sheets, intenta eliminar el evento Calendar creado.
7. Devuelve número de cita y token privado (futura consulta/cancelación).

El número de confirmaciones por mismo teléfono y día está limitado a 2 (medida básica, **no es una protección antibots suficiente**). Una clave de idempotencia evita enviar la misma solicitud dos veces.

**Advertencia importante:** no existe transacción atómica entre Google Calendar y Sheets. Si el rollback de Calendar falla, se necesita reconciliación manual. Los eventos creados directamente desde Calendar tampoco participan en el bloqueo de Apps Script, aunque sí se consultan. Por tanto, antes de producción deben realizarse pruebas reales y añadirse monitoreo/reconciliación.

## Cómo se coordinan los bloqueos Admin

Ambos proyectos son Apps Script independientes. No comparten `LockService`.

Para evitar que una reserva pública compita con un bloqueo administrativo, **Admin no escribe directamente los bloqueos**. Firma una solicitud HMAC-SHA256 y la envía al despliegue público mediante `UrlFetchApp`.

`apps/public/Puente.gs` valida la firma HMAC (clave solo en Script Properties), sello temporal, nonce y acción; obtiene **el mismo ScriptLock** que `Reservas.gs` y realiza el cambio en Sheets.

Esto coordina las escrituras realizadas por estas dos rutas del código; **no garantiza serialización respecto a modificaciones manuales en Calendar o Sheets**, ni sustituye un almacenamiento transaccional para un negocio de alto volumen.

La clave `BRIDGE_SECRET` se genera en la instalación y el propietario la copia a Script Properties de la aplicación pública. Nunca debe almacenarse en HTML ni en el repositorio.

## Acceso

- Los clientes no necesitan Google, correo ni login.
- El admin se despliega con acceso solo del propietario: la URL por sí sola no permite entrar.
- No confiar en ocultar botones ni en `Session.getActiveUser().getEmail()` dentro de un despliegue público ejecutado como propietario.
- Los archivos de clientes, teléfonos, comentarios y tokens se consideran privados.
- Las fotos publicadas de clientes requieren consentimiento expreso.
- Los campos de texto recibidos por el público deben neutralizar entradas que pudieran interpretarse como fórmulas en Sheets.

## Limitaciones de esta iteración

No hay instalador ejecutado todavía en una cuenta Google, ni catálogo multimedia completo. Tampoco hay pruebas de integración real con permisos OAuth, comprobación de acceso anónimo en entornos Google Workspace ni pruebas de reserva simultánea con varias personas. No se debe considerar listo para producción hasta realizar estas comprobaciones.

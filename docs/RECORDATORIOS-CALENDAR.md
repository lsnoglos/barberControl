# BarberControl — Citas en Google Calendar y recordatorios del barbero

## ¿Dónde se guardan?

Cada reserva confirmada crea un evento en el calendario privado **BarberControl - Citas** usando el `CALENDAR_ID` registrado por el instalador. Después registra la fila en la hoja `Reservas`, incluyendo `CalendarEventId`.

El evento incluye:
- Título con nombre del cliente, corte y modalidad (local / domicilio).
- Fecha y hora reales según `America/Managua`.
- Descripción con código de reserva, cliente, WhatsApp, dirección e indicaciones.
- En domicilio, la dirección aparece también en el campo **Ubicación** para abrirla en un mapa.

**El calendario creado no es el calendario principal de Google.** Si no aparece, entra a Google Calendar con la cuenta propietaria y activa la visualización de `BarberControl - Citas`. En Android, revisa que ese calendario esté sincronizado y sus notificaciones estén activadas.

## Recordatorios por modalidad

Los eventos nuevos incluyen notificaciones emergentes (`addPopupReminder`) configurables.

| Modalidad | Valor predeterminado | Campo en `Configuracion` |
|---|---|---|
| En el local | 30 y 15 minutos antes | `AVISOS_LOCAL=30,15` |
| A domicilio | 60, 30 y 15 minutos antes | `AVISOS_DOMICILIO=60,30,15` |

Los intervalos se cambian desde **Admin → ⚙ Configuración → Recordatorios de Google Calendar**. Opciones disponibles: 15, 30, 30/15, 60/30/15, 120/60/30/15 y desactivados.

Los avisos se establecen cuando se crea una reserva **nueva**. Si una cita se crea cuando faltan menos minutos de los programados, los recordatorios que ya quedaron en el pasado no se añaden. Las reservas anteriores no se modifican automáticamente.

Los recordatorios de Google Calendar son avisos previos al **inicio de la cita**. Para domicilio, 60 minutos no necesariamente equivale al tiempo de viaje; esta versión no calcula rutas, tráfico ni hora óptima de salida.

## Actualizar Apps Script

Primero, en **Barber Admin**, copia del repositorio los archivos:
- `apps/admin/Instalador.gs`
- `apps/admin/Gestion.gs`
- `apps/admin/Index.html` (o el archivo `index.html` que ya tengas)

Guarda. Ejecuta `instalarBarberControl` una vez para agregar las dos claves predeterminadas a la hoja `Configuracion` **sin eliminar los recursos ni las citas**. Publica una **nueva versión** del despliegue Admin.

Luego, en **Barber Public**, reemplaza:
- `apps/public/Reservas.gs`

Guarda y publica una **nueva versión** de Barber Public.

## Activar notificaciones del móvil

1. Abre la aplicación **Google Calendar**, con la misma cuenta con la que ejecutas BarberControl.
2. En el menú lateral, comprueba que el calendario **BarberControl - Citas** esté visible.
3. Ve a **Menú → Ajustes → BarberControl - Citas** y comprueba que estén habilitados los avisos.
4. En **Ajustes del teléfono → Aplicaciones → Google Calendar → Notificaciones**, permite las notificaciones y los avisos emergentes si lo deseas.
5. Crea una reserva de prueba con suficiente anticipación y verifica el evento y sus recordatorios.

Consulta la [documentación oficial de Google para notificaciones Android](https://support.google.com/calendar/answer/37242?co=GENIE.Platform%3DAndroid&hl=es).

## Avisar inmediatamente cuando llega una reserva

Los recordatorios de esta versión sirven para avisar **antes de la cita**. No envían automáticamente un WhatsApp al crearla. Para notificación inmediata de nueva reserva hay varias vías adicionales:

- **Correo electrónico** al barbero desde Apps Script, después de guardar la reserva en Sheets y Calendar; requiere configurar MailApp y autorizar su alcance.
- **WhatsApp automático** mediante una integración autorizada con la plataforma oficial de WhatsApp Business (no lo realiza un simple enlace `wa.me`).
- **Notificación push propia** mediante una aplicación móvil o servicio de notificaciones, si se desarrolla esa integración.

La versión actual no implementa estas entregas inmediatas. No debes considerarlas activas por el hecho de crear el evento.

## Si una cita no aparece

1. Busca el código de cita en la pestaña `Reservas`.
2. Revisa que `CalendarEventId` no esté vacío.
3. Confirma que el calendario **BarberControl - Citas** esté visible en la misma cuenta.
4. Verifica que la cita esté en su día/hora correctos y que ambas aplicaciones utilicen el `CALENDAR_ID` existente.
5. Si Sheets tiene la reserva pero Calendar no tiene el evento, revisa el registro de **Ejecuciones** en Barber Public antes de repetir la cita.

**Privacidad:** el título de los eventos ahora contiene el nombre del cliente. Si no quieres que se vea en la pantalla de bloqueo, oculta el contenido sensible de las notificaciones de Google Calendar desde Android.

# Actualizar BarberControl: identidad, catálogo móvil y agenda

Esta actualización reutiliza los mismos proyectos Google Apps Script, el Sheet y el Calendar existentes. **No borres las hojas ni las reservas**.

## 1. Barber Admin

En el proyecto privado, reemplaza o agrega estos archivos desde `apps/admin/`:

- Actualizar: `Code.gs`, `Index.html`, `Gestion.gs`, `Instalador.gs`, `Catalogos.gs`, `CatalogoPanel.html`.
- Crear si faltan: `Marca.gs` (secuencia de comandos) y `MarcaPanel.html` (HTML).

**Conserva** `appsscript.json` y cualquier configuración secreta en Script Properties.

Ejecuta `instalarBarberControl` una vez con la versión actualizada. Es idempotente: comprueba los recursos existentes y añade `Categorias` y las propiedades de identidad que falten. Por precaución, crea primero una copia de `BarberControl_DB`.

Desde Admin, completa:
- Nombre comercial y eslogan.
- WhatsApp (8 dígitos nacionales reciben prefijo 505; también admite formato internacional).
- Logotipo PNG que **realmente** tenga canal alfa. Si la imagen original tiene fondo blanco, no se quita automáticamente: debes cargar un PNG transparente.
- Categorías recomendadas: Cabello, Barba, Combos, Masajes, Diseños, Tratamientos, y las adicionales que prefieras.
- Servicios, precio, duración y categorías; después vincula los estilos con su servicio.

La sección **Reservaciones registradas** muestra estilo elegido, servicio, cliente, horario, estado y acceso de contacto; la cita también debe existir en `BarberControl - Citas`.

## 2. Barber Public

En el proyecto público, copia desde `apps/public/`:

- Actualizar: `Code.gs`, `Index.html`, `Reservas.gs`, `Catalogo.gs`, `Datos.gs`.
- Crear si falta: `Escaparate.gs` (secuencia de comandos).
- Conservar: `Disponibilidad.gs`, `Puente.gs`, `appsscript.json`. `GaleriaPublica.html` puede mantenerse en el proyecto, pero ya **no se inserta** en la interfaz.

Después de guardar, crea **Nueva versión** desde **Implementar → Administrar implementaciones** en ambos proyectos; no basta guardar código para cambiar una URL `/exec` ya publicada.

## 3. Pruebas de extremo a extremo

1. Abre Barber Public en una ventana privada: debe mostrar logo/nombre/contacto, categorías filtrables y catálogo en rejilla responsive.
2. Comprueba que **no aparece una sección de galería**; sus datos anteriores continúan en Sheets.
3. Filtra Cabello / Barba / Combos / Masajes y prueba buscar y ordenar.
4. Elige un estilo específico y pulsa reservar; confirma que el resumen muestra ese estilo y su duración/precio.
5. Reserva una cita de prueba para una hora libre. Anota su código.
6. Comprueba en la hoja `Reservas` que `ServicioId` y `EstiloId` están rellenados.
7. Comprueba el evento en el calendario **BarberControl - Citas**: el título debe mostrar el nombre del estilo y su servicio, y la descripción debe contener el código de reserva.
8. Comprueba las tarjetas de **Reservaciones registradas** en Admin: deben mostrar el estilo, horario, cliente y estado.

Si el código aparece en Sheets pero falta el evento en Calendar, **no repitas automáticamente la reserva**: revisa las ejecuciones del proyecto público. Las operaciones Sheets/Calendar no son una transacción única; puede requerirse conciliación.

## 4. Consideraciones

- La aplicación usa el Google Calendar **propio de BarberControl**, no necesariamente el calendario principal de la cuenta. Desde Google Calendar, activa la visibilidad de **BarberControl - Citas**.
- Los precios y la duración salen del servicio asociado y se validan en el servidor; una foto o estilo solamente es la referencia visual seleccionada.
- Para un cambio de datos en Sheets no necesitas una nueva versión; para cambios en código sí.
- Estos cambios tienen comprobaciones sintácticas automatizadas, pero no sustituyen una prueba real de Apps Script bajo permisos de Google.

# BarberControl Público

**Carpeta que se sube al proyecto Apps Script PÚBLICO.**

## Permitido
- Mostrar nombre, presentación y contacto de la barbería.
- Leer servicios, estilos, fotos y videos marcados como públicos.
- Consultar intervalos disponibles sin revelar datos de otros clientes.
- Recibir y validar solicitudes de reserva; las escrituras se implementarán cuando exista un mecanismo de coordinación y anticolisiones.

## No permitido
- Instalar recursos o modificar la configuración del negocio.
- Crear, eliminar o editar servicios, precios, archivos y bloqueos sin autorización.
- Mostrar nombre, teléfono, comentarios u otros datos de reservas ajenas.
- Exponer IDs sensibles innecesarios, tokens OAuth o funciones administrativas.

## Despliegue
- Ejecutar como el propietario: `USER_DEPLOYING`.
- Quién puede acceder: `ANYONE_ANONYMOUS`.
- Solo incluir los archivos de **esta carpeta**.

**Estado:** esqueleto navegable. No permite reservar todavía.

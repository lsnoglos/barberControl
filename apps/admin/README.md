# BarberControl Admin

**Carpeta que se sube al proyecto Apps Script PRIVADO.**

## Responsabilidades futuras
- Instalador inicial idempotente: Google Sheets, pestañas, carpetas Drive y calendario.
- Configuración de la barbería, horarios y bloqueos.
- Gestión de servicios, estilos, precios, galería, fotos y videos.
- Administración de citas y clientes.
- Respaldo, auditoría y conciliación de datos.

## Acceso y despliegue
- Proyecto independiente de `apps/public`.
- Se despliega con `access: MYSELF` y `executeAs: USER_DEPLOYING`.
- **El propietario debe ser quien despliegue**, usando su cuenta de Google.
- Un usuario con Gmail diferente no debe poder acceder al panel.
- No incrustar funciones administrativas en el proyecto público ni exponer credenciales en HTML.

**Estado:** esqueleto navegable; instalador y herramientas administrativas pendientes.

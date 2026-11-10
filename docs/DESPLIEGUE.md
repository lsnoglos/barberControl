# Guía de despliegue: dos Apps Script

**Objetivo:** crear dos proyectos Apps Script en la **cuenta de Google propietaria de la barbería**, sincronizados con dos carpetas distintas del repositorio GitHub.

## A. Crear los proyectos en Google

1. Iniciar sesión en [script.google.com](https://script.google.com) usando la cuenta del propietario.
2. Crear un proyecto nuevo llamado **BarberControl - Admin**.
3. Crear otro proyecto independiente llamado **BarberControl - Publico**.
4. Si vas a pegar los archivos manualmente, no necesitas copiar ningún Script ID. Si utilizas `clasp`, identifica cada proyecto por su Script ID para sincronizar código (no es un ID de Sheets ni Calendar).

No uses el mismo Script ID para ambos: son despliegues con permisos y funciones diferentes.

## B. Subir el código

Requisitos: Node.js, [clasp](https://github.com/google/clasp), Apps Script API activada en la cuenta y el repositorio descargado.

```bash
npm install -g @google/clasp
clasp login
```

Crear el archivo `.clasp.json` en **cada** directorio utilizando su plantilla:

```text
apps/admin/.clasp.json
apps/public/.clasp.json
```

Cada archivo contiene el `scriptId` de su proyecto correspondiente. Estos archivos están excluidos de Git por seguridad.

Sincronizar por separado:

```bash
cd apps/admin
clasp push
cd ../public
clasp push
```

No ejecutar `clasp push` desde la raíz del repositorio. Comprueba siempre el ID antes de subir.

## C. Implementar Admin y ejecutar el instalador

En el editor de **BarberControl - Admin** → **Implementar** → **Nueva implementación** → **Aplicación web**.

- Ejecutar como: **Yo** (propietario).
- Quién tiene acceso: **Solo yo**.

Abre la URL privada `/exec` desde la cuenta propietaria. Autoriza los servicios de Google solicitados y pulsa **Preparar BarberControl en Google**.

El instalador:
- crea/reutiliza `BarberControl` en Drive;
- crea/reutiliza `BarberControl_DB` en Sheets con pestañas y encabezados;
- configura horarios de ejemplo;
- crea/reutiliza el calendario `BarberControl - Citas`;
- genera `BRIDGE_SECRET` en propiedades privadas;
- crea un manifiesto privado de configuración en Drive para que Barber Public pueda autovincularse sin copiar identificadores.

Al instalar de nuevo, reutilizará los recursos registrados y no eliminará las citas.

**Antes de compartir con clientes**: cambia el nombre del negocio, revisa horarios, registra los servicios y define los precios reales.

## D. Conectar y desplegar Público (automático)

Después de ejecutar el instalador desde Admin, la configuración compartida está disponible **solo para los dos proyectos autorizados bajo la misma cuenta de Google**.

1. Asegúrate de que `apps/public/ConexionPublica.gs`, `Datos.gs`, `Escaparate.gs` y `Puente.gs` correspondan a las versiones actuales del repositorio.
2. Despliega la aplicación pública como **Aplicación web**, ejecutada **como yo (propietario)** y accesible por **cualquier persona, incluso anónima**.
3. Abre la URL `/exec`. Al consultar el catálogo, Barber Public buscará la configuración privada de Admin en Drive, comprobará los recursos y creará sus propias propiedades **automáticamente**.
4. Verifica en el editor, en **Configuración → Propiedades de secuencia de comandos**, que aparezcan `SPREADSHEET_ID`, `CALENDAR_ID` y `BRIDGE_SECRET`.

**No copies ni pegues valores.** No tienes que crear ninguna Script Property manualmente. Si había propiedades válidas de una instalación anterior, se seguirán usando.

Esta primera conexión requiere que ambos proyectos pertenezcan y se ejecuten con la **misma cuenta propietaria**. Nunca compartas la carpeta `BarberControl - CONFIG PRIVADA NO COMPARTIR`.

Más detalles: [CONEXION-SIMPLIFICADA.md](CONEXION-SIMPLIFICADA.md).

## E. Terminar la conexión del puente

Vuelve al panel Admin. En **Conexión con el proyecto público**, pega la URL `/exec` del despliegue público y pulsa **Vincular URL pública**.

Después, crea un bloqueo de prueba de 12:00 a 12:30 en el panel privado. Vuelve a la página pública y confirma que esa franja no es reservable.

## F. Pruebas antes de recibir clientes

- En incógnito, comprobar que Público abre sin inicio de sesión.
- Con una cuenta distinta, verificar que Admin no permite acceso.
- Comprobar que el catálogo solo devuelve servicios activos/visibles/reservables.
- Crear una cita y verificar el evento Calendar y la fila Sheets.
- Abrir dos ventanas y tratar de reservar exactamente el mismo intervalo simultáneamente: solo una debe confirmarse.
- Crear un bloqueo desde Admin e intentar reservar esa franja.
- Simular errores para verificar que no quedan citas huérfanas.
- Comprobar configuraciones regionales, teléfono, privacidad y disponibilidad en móvil.
- Antes de producción, incorporar antispam, observabilidad y rutina de conciliación.

## G. Qué NO hay todavía

Ya hay catálogo de estilos, fotografías y enlaces opcionales de YouTube en el código. Todavía faltan recordatorios automáticos, cancelación desde cliente y mejoras avanzadas de agenda. Las pestañas para esos módulos ya están creadas por el instalador para su futuro desarrollo.

Los proyectos Google **no se crean al subir código a GitHub**: deben existir previamente en la cuenta del propietario (o crearse mediante una integración autorizada con la Apps Script API). Tampoco basta con editar el manifiesto: comprueba los permisos reales en **Implementar**.

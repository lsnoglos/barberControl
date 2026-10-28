# Guía de despliegue: dos Apps Script

**Objetivo:** crear dos proyectos Apps Script en la **cuenta de Google propietaria de la barbería**, sincronizados con dos carpetas distintas del repositorio GitHub.

## A. Crear los proyectos en Google

1. Iniciar sesión en [script.google.com](https://script.google.com) usando la cuenta del propietario.
2. Crear un proyecto nuevo llamado **BarberControl - Admin**.
3. Crear otro proyecto independiente llamado **BarberControl - Publico**.
4. Abrir **Configuración del proyecto** de cada uno y copiar su **ID de secuencia de comandos (Script ID)**.

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
- devuelve los identificadores requeridos para el proyecto público.

Al instalar de nuevo, reutilizará los recursos registrados y no eliminará las citas.

**Antes de compartir con clientes**: cambia el nombre del negocio, revisa horarios, registra los servicios y define los precios reales.

## D. Conectar y desplegar Público

En el editor de **BarberControl - Publico**, abre **Configuración del proyecto → Propiedades de secuencia de comandos (Script Properties)**.

Agrega exactamente estas tres claves con los valores mostrados en el panel Admin:

```text
SPREADSHEET_ID   = (ID del archivo BarberControl_DB)
CALENDAR_ID      = (ID del calendario BarberControl - Citas)
BRIDGE_SECRET    = (clave secreta generada en Admin)
```

No copies los valores reales al repositorio GitHub.

Despliega **BarberControl - Publico** como **Aplicación web**:
- Ejecutar como: **Yo** (propietario).
- Quién tiene acceso: **Cualquier persona**, incluso anónima.

Autoriza los permisos del proyecto con la cuenta propietaria y verifica la URL `/exec` desde una ventana de incógnito **sin iniciar sesión**.

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

No hay carga de fotografías, estilos/galería visual, videos YouTube, recordatorios automáticos, cancelación desde cliente ni panel avanzado de atención de citas. Las pestañas para esos módulos ya están creadas por el instalador para su futuro desarrollo.

Los proyectos Google **no se crean al subir código a GitHub**: deben existir previamente en la cuenta del propietario (o crearse mediante una integración autorizada con la Apps Script API). Tampoco basta con editar el manifiesto: comprueba los permisos reales en **Implementar**.

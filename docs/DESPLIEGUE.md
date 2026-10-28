# Guía de despliegue: dos proyectos Apps Script

## Requisitos

- Cuenta de Google del **propietario** de la barbería (será quien despliegue ambas aplicaciones).
- Dos proyectos nuevos en [script.google.com](https://script.google.com/).
- Si se despliega desde Git: Node.js, herramienta [clasp](https://github.com/google/clasp) y Apps Script API habilitada en su cuenta.

## Paso 1. Crear proyectos en Google

Desde la cuenta propietaria, crear **dos proyectos Apps Script independientes**:

1. `BarberControl - Publico`.
2. `BarberControl - Admin`.

Copiar de la configuración de cada uno su **Script ID**. **No** son los URLs de despliegue web.

## Paso 2. Vincular las carpetas del repositorio

Instalar clasp e iniciar sesión en la cuenta propietaria:

```bash
npm install -g @google/clasp
clasp login
```

En la carpeta `apps/public`, copiar `.clasp.json.example` a `.clasp.json` y sustituir `scriptId` por el ID del proyecto **PÚBLICO**.

En la carpeta `apps/admin`, repetir el proceso, usando el ID del proyecto **ADMIN**.

Las configuraciones `.clasp.json` reales están excluidas de Git por `.gitignore`.

## Paso 3. Sincronizar cada proyecto por separado

Desde la raíz del repositorio:

```bash
cd apps/public
clasp push
cd ../admin
clasp push
```

**Atención:** `clasp push` reemplaza el contenido del proyecto remoto correspondiente. Verificar siempre el `scriptId` de la carpeta antes de ejecutarlo.

Alternativamente, copiar manualmente `Code.gs`, `Index.html` y la configuración de `appsscript.json` de cada carpeta a su respectivo proyecto.

## Paso 4. Publicar dos URLs

Dentro de cada editor Apps Script: **Deploy / Implementar → New deployment / Nueva implementación → Web app / Aplicación web**.

- **Público**: ejecutar como propietario, acceso **cualquier persona, incluso anónima**.
- **Admin**: ejecutar como propietario, acceso **solo yo**.

Estos permisos también están descritos en `appsscript.json`, pero **comprobarlos expresamente en el diálogo de despliegue**.

Verificar por separado en ventana incógnita:
- URL pública: debe mostrar la página inicial sin cuenta Google.
- URL privada: no debe admitir un usuario distinto del propietario.

**No enviar jamás la URL privada a clientes.**

## Paso 5. Configurar recursos de datos (futuro)

Todavía no se crearán automáticamente Sheets, Calendar ni Drive, porque el **instalador aún no está programado**. El instalador se incorporará en `apps/admin` y sincronizará los IDs necesarios entre los dos proyectos sin compartir acceso administrativo.

## Recordatorio

El repositorio tiene dos puntos de partida, pero todavía **no permite reservar**. Se requerirán las siguientes etapas de desarrollo antes de operar con clientes.

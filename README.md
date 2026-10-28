# BarberControl ✂

Sistema de reservas de barbería con **dos aplicaciones Google Apps Script independientes** y recursos compartidos de **Google Sheets, Google Calendar y Google Drive**.

## Estructura

```text
barberControl/
├── apps/
│   ├── public/            # Proyecto Apps Script PUBLICO, sin login
│   │   ├── Code.gs        # Página web / doPost firmado
│   │   ├── Datos.gs       # Consultas públicas a Sheets
│   │   ├── Disponibilidad.gs
│   │   ├── Reservas.gs    # Confirmaciones con revalidación
│   │   ├── Puente.gs      # Bloqueos administrativos HMAC
│   │   ├── Index.html
│   │   └── appsscript.json
│   └── admin/             # Proyecto Apps Script PRIVADO, propietario
│       ├── Code.gs
│       ├── Instalador.gs  # Crea recursos Google automáticamente
│       ├── Gestion.gs     # Servicios, horarios y puente
│       ├── Index.html
│       └── appsscript.json
├── docs/
│   ├── ARQUITECTURA.md
│   └── DESPLIEGUE.md
└── tests/
    └── validate.js
```

## Funciones implementadas

**Privado**: instalación idempotente; creación de pestañas Sheets, estructura Drive y calendario; cambio del nombre de negocio, intervalo, servicios, precios, duración, estado activo/visible/reservable, horarios semanales y bloqueos recurrentes o por fecha a través de un puente autenticado.

**Público**: lectura de servicios permitidos; selección de fecha; cálculo de intervalos según duración, calendario, citas, bloqueos, horario y anticipación; registro de reservas con revalidación y bloqueo; creación de eventos en Calendar; confirmación de la reserva al cliente.

Ambas interfaces están diseñadas como **primera versión funcional de desarrollo**, pendientes de despliegue, autorizaciones, pruebas integrales y endurecimiento antes de usarse con clientes reales.

## Pendiente para próximas iteraciones

Catálogo de estilos, galería de fotos Drive, videos de YouTube, carga de medios, gestión/cancelación de citas desde Admin, enlaces privados de cancelación para clientes, recordatorios, pruebas de concurrencia reales, controles contra bots, respaldos programados y conciliación de errores externos.

## ¡No mezcles proyectos!

- Código de `apps/public` → despliegue accesible para cualquiera (sin autorizar Google).
- Código de `apps/admin` → despliegue `MYSELF`, exclusivamente del propietario.
- **Nunca** copies `Gestion.gs` ni `Instalador.gs` al proyecto público.
- `BRIDGE_SECRET` y los identificadores reales se almacenan en **Script Properties**, no en Git.

## Inicio

Sigue [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md), después [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

**Estado en Google:** el repositorio GitHub contiene código; por sí solo no crea proyectos Apps Script en la cuenta del propietario. Debe crear dos proyectos y autorizar los permisos de Google como se describe en la guía.

# BarberControl

Aplicación web para una barbería, desarrollada con **Google Apps Script**, **Google Sheets**, **Google Calendar** y **Google Drive**.

## Organización del repositorio

Este repositorio contiene **dos proyectos de Google Apps Script independientes**. No se debe copiar todo el repositorio a un único proyecto de Apps Script.

```text
barberControl/
├── apps/
│   ├── public/                 # Proyecto Apps Script PÚBLICO
│   │   ├── Code.gs             # doGet y funciones públicas
│   │   ├── Index.html          # Sitio visible para los clientes
│   │   ├── appsscript.json     # Acceso anónimo, ejecución como propietario
│   │   ├── .clasp.json.example # Configuración de sincronización (ejemplo)
│   │   └── README.md
│   └── admin/                  # Proyecto Apps Script PRIVADO
│       ├── Code.gs             # doGet y funciones administrativas
│       ├── Index.html          # Panel exclusivo del propietario
│       ├── appsscript.json     # Acceso solo del propietario
│       ├── .clasp.json.example
│       └── README.md
├── docs/
│   ├── ARQUITECTURA.md
│   └── DESPLIEGUE.md
└── .gitignore
```

## ¿Cuál código va en cada proyecto?

| Proyecto | Carpeta | Visitantes | Responsabilidades |
|---|---|---|---|
| BarberControl Público | `apps/public/` | Clientes, sin login | Información comercial, servicios y estilos publicados, fotos públicas, consulta de disponibilidad y solicitud de citas |
| BarberControl Admin | `apps/admin/` | Solo propietario autorizado | Instalación inicial, configuración, administración del catálogo, archivos, precios, agenda y bloqueos |

Los dos proyectos se conectarán **a los mismos recursos de datos**, pero se desplegarán por separado y tendrán **URLs distintas**.

### Importante sobre seguridad

El proyecto público **no incluye operaciones de administración**. La separación de las interfaces no reemplaza la validación de permisos: todas las operaciones sensibles deberán realizarse en el proyecto privado. No se debe desplegar `apps/admin` con acceso `ANYONE` o `ANYONE_ANONYMOUS`.

La autenticación de clientes **no será obligatoria**. Los clientes no deben autorizar Google Drive, Sheets o Calendar.

### Estado actual

**Estructura inicial de dos proyectos creada.** Los HTML y `Code.gs` son esqueletos de inicio, **no** una aplicación de reservas lista para producción. Aún faltan el instalador, los catálogos, el motor de disponibilidad, la creación de citas, el panel real y las pruebas de concurrencia.

Siguiente paso: [DESPLIEGUE.md](docs/DESPLIEGUE.md) para vincular cada carpeta con su propio proyecto Apps Script y [ARQUITECTURA.md](docs/ARQUITECTURA.md) para conocer los límites de seguridad y de concurrencia.

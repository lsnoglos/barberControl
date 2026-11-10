# BarberControl ✂️

Sistema de reservas para barbería con **dos proyectos independientes de Google Apps Script** y un único catálogo de cortes. Datos en Google Sheets, citas en Calendar e imágenes en Drive.

## Versión actual — Catálogo único de cortes

**El cliente:** entra directamente al catálogo móvil, busca y filtra por categorías, consulta fotografías de cada corte, ve precio **en el local**, **a domicilio** o ambos, y elige su modalidad. La disponibilidad se calcula según la duración del corte y los bloqueos de agenda. Puede reservar sin iniciar sesión y, tras confirmación, avisar opcionalmente al barbero por WhatsApp.

**El barbero:** administra los cortes, precios, fotografías, reservas en un calendario mensual, horarios y bloqueos. Desde el engranaje ⚙ gestiona identidad, WhatsApp, categorías, intervalo, instalación y conexión con Public.

Las pantallas de carga muestran un **tubo de barbería animado**. La caché local guarda fotografías y catálogo públicos; **nunca** guarda clientes, reservas ni horas libres.

## Archivos de cada proyecto

```text
apps/
├── admin/                          # Solo propietario
│   ├── Code.gs                      # Acceso al panel privado
│   ├── Index.html                   # Panel principal y ajustes ⚙
│   ├── CortesAdminV2.gs             # Cortes, imágenes y agenda mensual
│   ├── Instalador.gs                # Instalación y migración
│   ├── ConexionAutomatica.gs        # Configuración privada de Drive
│   ├── Gestion.gs                   # Horarios, bloqueos y puente
│   ├── Marca.gs                     # Logo, nombre, WhatsApp, categorías
│   ├── VersionCatalogo.gs           # Invalida caché pública
│   ├── Catalogos.gs                 # Funciones multimedia reutilizadas/legado
│   ├── CatalogoPanel.html           # Plantilla antigua, no visible en v2
│   ├── MarcaPanel.html              # Plantilla antigua, no visible en v2
│   └── appsscript.json
└── public/                         # Clientes, sin inicio de sesión
    ├── Code.gs
    ├── Index.html                   # Catálogo móvil, carrusel, reserva
    ├── Escaparate.gs                # Cortes y marca pública
    ├── Catalogo.gs                  # Acceso seguro a fotografías
    ├── Disponibilidad.gs            # Horarios por corte y modalidad
    ├── Reservas.gs                  # Confirmación con validación/idempotencia
    ├── Datos.gs                     # Lectura privada de Sheets/Calendar
    ├── Puente.gs                    # Bloqueos firmados desde Admin
    ├── ConexionPublica.gs           # Autovinculación inicial
    ├── GaleriaPublica.html          # Plantilla antigua, no visible en v2
    └── appsscript.json
```

## Actualizar tus aplicaciones existentes

**[Guía principal: Actualizar a BarberControl v2](docs/ACTUALIZAR-V2-CORTES.md).**

1. Respaldar `BarberControl_DB`.
2. Actualizar los archivos indicados de **Admin**, agregar `CortesAdminV2.gs`, y ejecutar `instalarBarberControl` una vez. El instalador crea `Cortes` y `FotosCortes`, migra los estilos existentes sin duplicarlos y amplía las reservas sin borrar información.
3. Publicar una nueva versión de **Admin**.
4. Actualizar los cinco archivos indicados de **Public**.
5. Publicar una nueva versión de **Public** y realizar una reserva de prueba.

**No borres** las hojas antiguas `Servicios`, `Estilos` ni `Galeria`: se conservan para migración e historial, aunque ya no figuran en la interfaz. Ambas aplicaciones deben ejecutarse con la misma cuenta propietaria.

## Instalación desde cero

La instalación y vinculación son automáticas: Admin crea Sheets, Calendar y carpetas Drive, y guarda sus identificadores en una carpeta de configuración privada. Public los recupera automáticamente con la misma cuenta de Google, sin copiar IDs ni propiedades manualmente.

Solo hay que vincular una vez la URL pública `/exec` en Admin para que sus bloqueos se coordinen con las reservas.

[Guía de autovinculación](docs/CONEXION-SIMPLIFICADA.md).

## Seguridad y pruebas

Las citas y las reglas de bloqueo se coordinan en el proyecto público con `LockService`, y las operaciones administrativas de bloqueo se autentican mediante firma HMAC. Las fotografías de clientes requieren permiso de publicación. La información personal de cada reserva no se expone en el catálogo.

El código cuenta con pruebas automatizadas de sintaxis, permisos, catálogo, modalidad de precios, imágenes, formato de fechas, reservas idempotentes y migración sin pérdida de filas anteriores. **Aún se deben realizar pruebas con tu cuenta real de Apps Script**: los tests no sustituyen la validación del despliegue, los permisos ni la concurrencia real de Sheets y Calendar.

[Historial y pruebas](https://github.com/lsnoglos/barberControl/actions) · [Guía completa de v2](docs/ACTUALIZAR-V2-CORTES.md).

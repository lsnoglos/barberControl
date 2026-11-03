# BarberControl ✂

Sistema de reservas para barbería, construido con **dos proyectos Google Apps Script independientes**, Google Sheets, Google Calendar y Google Drive.

## Versión actual: escaparate móvil de estilos

La interfaz pública ahora muestra **únicamente estilos y servicios**: portada con fotografía destacada de los cortes reales, logotipo del negocio, WhatsApp, buscador, filtros por categoría, ordenamiento, precios, duración y botón **Reservar** en cada tarjeta. Ya no se muestra la galería general de trabajos (los registros y archivos existentes se conservan).

Al elegir un estilo, el cliente pasa a la agenda interactiva, selecciona fecha y hora y confirma sin iniciar sesión. El nombre del estilo queda tanto en la fila de Sheets como en el título del **nuevo evento** de Google Calendar.

El administrador puede configurar nombre, eslogan, WhatsApp, logotipo PNG transparente y categorías (Cabello, Barba, Combos, Masajes, Diseños, Tratamientos y las nuevas que cree). Cada estilo se relaciona con un servicio que define el precio y la duración.

## Actualización de los proyectos que ya creaste

**[Guía paso a paso: ACTUALIZAR-ESCAPARATE.md](docs/ACTUALIZAR-ESCAPARATE.md)**

Primero se actualiza **Barber Admin**, luego se ejecuta una vez el instalador actualizado para crear `Categorias` y los nuevos campos de configuración (sin borrar citas). Después se reemplazan los archivos indicados en **Barber Public** y se publican nuevas versiones de ambos despliegues.

## Organización del repositorio

```text
barberControl/
├── apps/
│   ├── admin/                  # Proyecto Apps Script PRIVADO
│   │   ├── Code.gs
│   │   ├── Instalador.gs       # Idempotente: crea o reutiliza recursos
│   │   ├── Gestion.gs          # Servicios, horarios, bloqueos y agenda
│   │   ├── Marca.gs            # Nombre, WhatsApp, logo y categorías
│   │   ├── MarcaPanel.html     # Identidad y categorías en Admin
│   │   ├── Catalogos.gs       # Almacenamiento multimedia y estilos
│   │   ├── CatalogoPanel.html  # Solo gestión de estilos
│   │   ├── Index.html
│   │   └── appsscript.json
│   └── public/                 # Proyecto Apps Script PÚBLICO
│       ├── Code.gs
│       ├── Datos.gs
│       ├── Escaparate.gs       # Marca y productos por categorías
│       ├── Catalogo.gs        # Validación y entrega privada de imágenes
│       ├── Disponibilidad.gs
│       ├── Reservas.gs        # Refleja el estilo en Google Calendar
│       ├── Puente.gs
│       ├── Index.html         # Catálogo móvil + reservas
│       ├── GaleriaPublica.html # Histórico, ya NO se incorpora a la interfaz
│       └── appsscript.json
├── docs/
└── tests/
```

## Seguridad y datos

- La web pública se ejecuta sin login; el panel Admin debe desplegarse como **Solo yo**.
- No se publican credenciales, ID de Drive del logo, datos personales ni fotos privadas sin autorización.
- Los datos de reservas y la galería anterior permanecen en Sheets/Drive. El instalador no debe ejecutarse en una cuenta distinta a la propietaria.
- Apps Script tiene cuotas y Google Sheets/Calendar no comparten una transacción atómica: aún faltan pruebas reales de concurrencia, monitoreo y recuperación de errores antes de escalar.

## Estado de pruebas

CI valida sintaxis y lógica de catálogo, consentimiento, privacidad, identidad y reserva con estilo utilizando simulaciones. **No equivale a pruebas reales en la cuenta de Google.** Confirma el flujo completo en tus dos implementaciones antes de compartir el enlace a clientes.

[Arquitectura](docs/ARQUITECTURA.md) · [Despliegue inicial](docs/DESPLIEGUE.md) · [Actualización de esta versión](docs/ACTUALIZAR-ESCAPARATE.md)

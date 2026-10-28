# Arquitectura de BarberControl

## 1. Dos proyectos Apps Script, no dos copias iguales

1. **Público**: proyecto y despliegue web independiente; funciones públicas mínimas (lectura del catálogo, horarios disponibles y alta validada de reservas).
2. **Admin**: proyecto y despliegue web independiente; acceso restringido a la cuenta propietaria; instalación y funciones administrativas.

Ambos proyectos consultarán el mismo archivo Sheets y calendario de trabajo, pero **no** se deben incluir archivos `Admin.gs` dentro del proyecto público. Los datos compartidos no implican código compartido indiscriminado.

En el futuro pueden extraerse funciones puras comunes y utilizar un paso de compilación que incorpore solo los módulos necesarios a cada proyecto; por ahora cada proyecto tiene su propio código y no hay un tercer proyecto de biblioteca.

## 2. Fuente y recursos de Google

- **Sheets**: configuración, servicios, estilos, medios, galería, bloqueos, reservas y auditoría.
- **Calendar**: ocupaciones reales, eventos de reservas y posibles citas manuales.
- **Drive**: imágenes originales, miniaturas, portadas, archivos de respaldo.
- **Apps Script**: vistas web, validaciones, control de acceso y lógica de negocio.
- **YouTube**: videos públicos o no listados permitidos para insertar.

El instalador deberá crear los recursos una vez y guardar sus IDs mediante `PropertiesService`. **Importante:** cada proyecto tiene sus propias Script Properties. El instalador deberá configurar los identificadores de los recursos compartidos en ambos, sin exponerlos innecesariamente al cliente.

## 3. Seguridad

- El enlace público no requiere login y no ofrece operaciones administrativas.
- El enlace admin solo será accesible a quien desplegó la aplicación con `MYSELF`.
- `google.script.run` permite invocar funciones de servidor accesibles; ocultar botones o pantallas no es una barrera de seguridad. Funciones privadas terminadas en `_` sirven para ocultarlas de `google.script.run`, pero no sustituyen el control de acceso.
- El proyecto público nunca debe devolver datos de otros clientes, identificadores secretos ni tokens OAuth.
- Los campos de reserva siempre se validan en servidor: servicio activo, precio oficial, duración, fecha, teléfono y disponibilidad.
- La publicación de imágenes de clientes debe contar con consentimiento.

## 4. Coordinación de reservas: asunto pendiente de diseño

**Advertencia:** `LockService` sincroniza ejecuciones del mismo proyecto de Apps Script, pero no crea un bloqueo transaccional común entre dos proyectos distintos. Compartir Sheets y Calendar no resuelve por sí solo las carreras entre una reserva pública y un cambio administrativo simultáneo.

Antes de habilitar reservas reales se debe definir un **único coordinador de las operaciones de agenda** (o un backend con transacciones) para que las escrituras no compitan, más reconciliación entre Sheets y Calendar y pruebas de concurrencia. No se debe prometer ausencia total de duplicados con la estructura actual.

## 5. Estado de implementación

El código presente es un **esqueleto verificable**, con sendos `doGet()` y vistas HTML. Aún no se ha implementado el instalador, la disponibilidad ni la persistencia.

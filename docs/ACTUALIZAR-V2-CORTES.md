# BarberControl v2 — Un solo catálogo de cortes y agenda mensual

Esta actualización reemplaza la separación visible **Servicios y precios → Estilos** por **Cortes**, donde cada registro tiene sus propios precios en local/domicilio, categoría, duración y fotos.

## Qué se conserva

- Tu carpeta Drive, Google Sheets, Google Calendar y Script Properties.
- Las citas registradas anteriormente, con sus códigos y eventos.
- Las hojas históricas \`Servicios\`, \`Estilos\` y \`Galeria\`. **No las borres**, se utilizan para migración e historial.
- Los nombres y fotografías ya publicados. El instalador migra estilos y servicios antiguos a \`Cortes\` conservando los IDs de origen y el precio anterior como **precio en local**; el domicilio queda sin precio hasta configurarlo.
- La configuración del negocio, horarios, bloqueos y categorías existentes.

La migración es **idempotente**: al volver a ejecutar el instalador, los cortes migrados no se duplican.

## Orden de actualización (importante)

Antes de comenzar, crea una **copia de seguridad de \`BarberControl_DB\`**. No elimines las propiedades de los proyectos.

### 1. Barber Admin — primero

Abre tu proyecto existente. Actualiza o crea los siguientes archivos desde [apps/admin](../apps/admin):

| Archivo | Acción |
|---|---|
| \`Instalador.gs\` | Reemplazar (nuevo esquema + migración) |
| \`Marca.gs\` | Reemplazar (categorías validan cortes) |
| \`Index.html\` | Reemplazar por completo tu HTML de inicio (\`index.html\` si así lo nombraste) |
| \`CortesAdminV2.gs\` | **Crear** nuevo archivo de tipo Secuencia de comandos |

Conserva todos los demás archivos administrativos, especialmente \`Code.gs\`, \`Gestion.gs\`, \`Catalogos.gs\`, \`ConexionAutomatica.gs\`, \`VersionCatalogo.gs\`, \`MarcaPanel.html\` y \`CatalogoPanel.html\`. Las dos plantillas antiguas permanecen como archivos de compatibilidad pero **no se muestran**.

En el editor, selecciona **\`instalarBarberControl\`** y ejecútalo. Autoriza si Google lo solicita. Debes encontrar las pestañas \`Cortes\` y \`FotosCortes\` en tu hoja. La hoja \`Reservas\` conservará sus columnas originales y agregará \`CorteId\`, \`Modalidad\`, \`Direccion\`.

**No borres Servicios, Estilos, Galería ni las reservas anteriores.**

Después, **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. Comprueba que el panel privado muestre:
- Estilos de cortes (nuevo registro/edición)
- Reservaciones (calendario mensual + Actualizar)
- Horarios de atención
- Bloquear horarios
- Engranaje ⚙ con identidad, categorías, intervalo, instalación y conexión pública

### 2. Barber Public — después

Abre tu proyecto Apps Script público. Reemplaza desde [apps/public](../apps/public):

| Archivo | Acción |
|---|---|
| \`Index.html\` | Reemplazar el HTML completo de la pantalla pública |
| \`Escaparate.gs\` | Reemplazar |
| \`Catalogo.gs\` | Reemplazar |
| \`Disponibilidad.gs\` | Reemplazar |
| \`Reservas.gs\` | Reemplazar |

Conserva \`Code.gs\`, \`Datos.gs\`, \`ConexionPublica.gs\`, \`Puente.gs\` y \`appsscript.json\`. Ya no se utiliza el HTML antiguo \`GaleriaPublica.html\` en la vista del cliente; puedes conservarlo sin insertarlo.

Guarda y **publica una nueva versión** del despliegue público. No hace falta crear variables manualmente ni borrar los valores actuales.

## Nuevo registro de cortes

Dentro de Admin → **Nuevo corte**, indica:
- Nombre, categoría y duración (10–480 minutos).
- Precio en local y/o precio a domicilio. **Basta uno de los dos**; el otro puede quedar vacío.
- Descripción, origen/historia y técnica (opcionales).
- Foto principal y hasta 8 adicionales por operación (opcionales).
- Estado activo y visible.
- Confirma la autorización antes de subir imágenes.

Para añadir más fotos, vuelve a **Editar** el corte. Puedes ocultar fotos adicionales sin eliminarlas de Drive.

## Pruebas completas

1. Comprueba que Barber Public **abre directamente el catálogo**, sin el bloque grande de bienvenida.
2. Verifica que las categorías y los precios en local y a domicilio aparecen correctamente.
3. En cortes con fotos adicionales, pulsa la imagen: debe abrirse un carrusel con botón **Cerrar** y navegación.
4. En cortes sin fotos adicionales, tocar la imagen no debe abrir ningún diálogo.
5. Abre un corte con ambas modalidades; verifica que pide elegir **local/domicilio** antes de consultar horas.
6. Elige domicilio: debe solicitar dirección. Selecciona local: no debe solicitarla.
7. Confirma una reserva de prueba: debe aceptar el nombre, mostrar la animación de barber pole y devolver comprobante.
8. Comprueba en \`Reservas\` las columnas \`CorteId\`, \`Modalidad\` y \`Direccion\`. En Calendar, el título mostrará el corte y la modalidad.
9. Abre Admin → Reservaciones. El día reservado debe aparecer marcado y al pulsarlo mostrar el cliente, corte, modalidad, fecha y precio.
10. Usa **Actualizar** para consultar nuevas reservas sin recargar la página.
11. En ⚙ Configuración, cambia identidad/logo/categorías/intervalo. Debe verse el loading animado y finalizar en éxito o error.
12. Prueba bloquear una franja desde Admin y comprobar que ya no está disponible en Public.

## Seguridad y limitaciones

- **La disponibilidad siempre se recalcula en el servidor**, bajo \`LockService\`, y además se compara con Calendar. Las fotos y el catálogo público pueden estar en caché local; las horas no.
- Las fotos de clientes requieren autorización de publicación.
- Los datos privados del cliente solo van a la hoja de reservas y a su evento privado de Calendar.
- Apps Script no proporciona transacciones atómicas entre Sheets y Calendar. Si hay una desconexión en mitad del proceso, verifica los registros antes de repetir la reserva.
- Si una llamada excede 60 segundos, se libera el loading y se muestra advertencia; una llamada tardía todavía podría terminar en Google. Mantén el mismo código de idempotencia al reintentar.
- Estas modificaciones se verifican mediante pruebas automatizadas de código; **debes probar el flujo real con las autorizaciones de tus dos proyectos** antes de compartir el enlace con clientes.

## Diseño de datos

- \`Cortes\`: nombre, categoría, descripción, historia, técnica, dos precios opcionales, duración, imagen principal y estado.
- \`FotosCortes\`: cero o varias fotografías adicionales por corte.
- \`Reservas\`: conserva columnas anteriores y añade corte, modalidad y dirección.
- Las tablas anteriores siguen disponibles exclusivamente por compatibilidad/historial.

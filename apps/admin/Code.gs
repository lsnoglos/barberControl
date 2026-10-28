/**
 * BARBERCONTROL ADMINISTRACIÓN
 * Este proyecto NO se publica a clientes.
 *
 * Despliegue obligatorio:
 *   Ejecutar como: propietario/deployer
 *   Acceso: solo yo (MYSELF)
 *
 * El acceso privado es requisito, no sustituto de buenas validaciones.
 */

/** Punto de entrada del panel administrativo privado. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BarberControl | Administración')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Estado temporal del panel: no expone datos privados. */
function obtenerEstadoAdmin() {
  return {
    aplicacion: 'BarberControl',
    modulo: 'administracion',
    configurado: false,
    mensaje: 'La instalación automática y la administración se implementarán próximamente.'
  };
}

// NOTA: El instalador inicial, precios, galería, bloqueos y administración
// de citas se implementarán SOLO en este proyecto privado.
// No cambiar el acceso de este despliegue a público.

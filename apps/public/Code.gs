/**
 * BARBERCONTROL PUBLICO
 * Proyecto Apps Script independiente del panel administrativo.
 *
 * Despliegue obligatorio:
 *   Ejecutar como: propietario/deployer
 *   Acceso: cualquiera, incluso anónimo
 *
 * No añadir aquí funciones administrativas ni secretos.
 */

/** Punto de entrada de la web pública. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BarberControl | Reserva tu corte')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Estado público temporal. Solo devuelve información no sensible.
 * El catálogo y la disponibilidad reales se añadirán en otra etapa.
 */
function obtenerEstadoPublico() {
  return {
    aplicacion: 'BarberControl',
    modulo: 'publico',
    configurado: false,
    mensaje: 'La agenda en línea se encuentra en preparación.'
  };
}

// NOTA: Las futuras operaciones públicas deberán validar entradas, controlar
// abuso y comprobar la disponibilidad nuevamente al confirmar una cita.
// Evitar que google.script.run exponga operaciones administrativas.

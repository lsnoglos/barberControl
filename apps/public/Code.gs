/**
 * BARBERCONTROL PUBLICO
 * Unicamente lectura publica, disponibilidad y creacion validada de reservas.
 * No incorporar aqui funciones que modifiquen precios, horarios ni permisos.
 */
function doGet(){
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BarberControl | Reserva tu corte')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}

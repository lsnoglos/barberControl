/** Punto de entrada del panel privado BarberControl. Despliegue: MYSELF. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BarberControl | Administración')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

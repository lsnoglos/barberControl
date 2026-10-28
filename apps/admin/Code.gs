/** Punto de entrada del panel privado BarberControl. Despliegue: MYSELF. */
function doGet() {
  return cargarPlantillaBarberControl_().evaluate()
    .setTitle('BarberControl | Administración')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

function incluirCatalogoAdmin_(nombre) {
  if(nombre!=='CatalogoPanel')throw new Error('Plantilla no permitida.');
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

/** Compatibilidad con proyectos creados manualmente como index.html. */
function cargarPlantillaBarberControl_() {
  try { return HtmlService.createTemplateFromFile('Index'); }
  catch (e) { return HtmlService.createTemplateFromFile('index'); }
}

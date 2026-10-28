/**
 * BARBERCONTROL PUBLICO
 * Unicamente lectura publica, disponibilidad y creacion validada de reservas.
 * No incorporar aqui funciones que modifiquen precios, horarios ni permisos.
 */
function doGet(){
  return cargarPlantillaBarberControl_().evaluate()
    .setTitle('BarberControl | Reserva tu corte')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}


/**
 * Punto de entrada para llamadas administrativas FIRMADAS provenientes
 * del proyecto privado. No admite operaciones sin autenticar.
 */
function doPost(e) {
  let result;
  try {
    if(!e || !e.postData || !e.postData.contents) throw new Error('Solicitud invalida.');
    result={ok:true,data:procesarPeticionAdmin_(JSON.parse(e.postData.contents))};
  } catch(err) {
    result={ok:false,error:String(err.message||err)};
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function incluirCatalogoPublico_(name) {
  if(name!=='GaleriaPublica')throw new Error('Plantilla no permitida.');
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** Compatibilidad con proyectos creados manualmente como index.html. */
function cargarPlantillaBarberControl_() {
  try { return HtmlService.createTemplateFromFile('Index'); }
  catch (e) { return HtmlService.createTemplateFromFile('index'); }
}

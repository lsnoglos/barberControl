/**
 * Marca la versión del contenido PÚBLICO en la hoja Configuracion.
 * Es una marca de invalidación: no almacena datos privados ni crea
 * una caché de los horarios/reservas, que siempre se consultan al servidor.
 */
function actualizarVersionEscaparate_() {
  const sheet=obtenerDbAdmin_().getSheetByName('Configuracion');
  if(!sheet)throw new Error('No existe la hoja Configuracion.');
  const last=sheet.getLastRow();
  const keys=last>1?sheet.getRange(2,1,last-1,1).getDisplayValues().flat():[];
  const version=new Date().toISOString()+'-'+Utilities.getUuid().slice(0,8);
  const row=keys.indexOf('PUBLIC_CATALOG_VERSION');
  if(row<0)sheet.appendRow(['PUBLIC_CATALOG_VERSION',version,'Marca de actualización para caché pública']);
  else sheet.getRange(row+2,2).setValue(version);
  SpreadsheetApp.flush();
  return version;
}

/**
 * BARBER PUBLIC — Enlace automático SIN copiar IDs ni crear propiedades.
 *
 * Requiere que instalarBarberControl haya creado el manifiesto privado
 * en Drive y que ambos Apps Script se ejecuten como la MISMA cuenta Google.
 *
 * IMPORTANTE: todas las funciones terminan en "_" para que NO puedan
 * ser llamadas directamente por visitantes mediante google.script.run.
 */
const BC_AUTO_PRIVATE_FOLDER_='BarberControl - CONFIG PRIVADA NO COMPARTIR';
const BC_AUTO_PRIVATE_FILE_='barbercontrol-system-config.json';

function bcAutovincularPublico_() {
  const props=PropertiesService.getScriptProperties();
  const keys=['SPREADSHEET_ID','CALENDAR_ID','BRIDGE_SECRET'];
  if(keys.every(function(k){return Boolean(props.getProperty(k));}))return false;

  const folders=DriveApp.getFoldersByName(BC_AUTO_PRIVATE_FOLDER_);
  if(!folders.hasNext())throw new Error(
    'No se encontró la configuración privada. Primero ejecuta instalarBarberControl en Barber Admin con la misma cuenta Google.');
  const folder=folders.next();
  if(folders.hasNext())throw new Error(
    'Se encontraron varias configuraciones privadas. No se conectará automáticamente a una barbería equivocada.');

  const files=folder.getFilesByName(BC_AUTO_PRIVATE_FILE_);
  if(!files.hasNext())throw new Error('Falta el manifiesto. Ejecuta nuevamente instalarBarberControl en Admin.');
  const file=files.next();
  if(files.hasNext())throw new Error('Existen varios archivos de configuración. Revisa la carpeta privada.');

  // No confiar en un manifiesto compartido por otra cuenta.
  const owner=file.getOwner();
  const activeUser=Session.getEffectiveUser();
  if(!owner||!activeUser||!owner.getEmail()||owner.getEmail()!==activeUser.getEmail())
    throw new Error('Barber Admin y Public deben pertenecer y ejecutarse con la misma cuenta propietaria.');
  if(file.getSharingAccess && file.getSharingAccess()!==DriveApp.Access.PRIVATE)
    throw new Error('La configuración de Drive fue compartida. Quita el acceso público antes de conectar.');

  let cfg;
  try{cfg=JSON.parse(file.getBlob().getDataAsString('UTF-8'));}
  catch(err){throw new Error('No se puede interpretar la configuración privada guardada por Admin.');}
  if(!cfg||cfg.tipo!=='BARBERCONTROL_AUTO_V1')
    throw new Error('Versión de configuración privada no compatible.');
  const id=String(cfg.spreadsheetId||'').trim();
  const calendarId=String(cfg.calendarId||'').trim();
  const secret=String(cfg.bridgeSecret||'').trim();
  if(!/^[A-Za-z0-9_-]{20,200}$/.test(id)||
     !/^[A-Za-z0-9_.@-]{12,300}$/.test(calendarId)||
     !/^[A-Za-z0-9-]{50,300}$/.test(secret))
    throw new Error('El manifiesto no contiene identificadores válidos.');
  const existingSheet=props.getProperty('SPREADSHEET_ID');
  const existingCal=props.getProperty('CALENDAR_ID');
  if((existingSheet&&existingSheet!==id)||(existingCal&&existingCal!==calendarId))
    throw new Error('Barber Public ya apunta a otra instalación. No se cambiarán datos automáticamente.');

  // Asegurarse de que realmente existen los recursos de este propietario.
  const db=SpreadsheetApp.openById(id);
  ['Configuracion','Servicios','Reservas','Horarios'].forEach(function(name){
    if(!db.getSheetByName(name))throw new Error('Falta la hoja requerida: '+name);
  });
  if(!CalendarApp.getCalendarById(calendarId))
    throw new Error('No se encontró el calendario asociado a Barber Admin.');

  // Solo el servidor guarda las propiedades; jamás se devuelven al navegador.
  props.setProperties({
    SPREADSHEET_ID:id,
    CALENDAR_ID:calendarId,
    BRIDGE_SECRET:secret
  });
  return true;
}

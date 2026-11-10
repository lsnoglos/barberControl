/**
 * Puente de instalación automática entre DOS proyectos Apps Script.
 *
 * Ambos proyectos deben ejecutarse/autorizase con LA MISMA cuenta propietaria.
 * El manifiesto se guarda en una carpeta privada SEPARADA del contenido
 * comercial (que podría compartirse o publicarse más adelante).
 *
 * Los archivos de esta carpeta contienen secretos: NUNCA compartirla.
 */
const BC_PRIVATE_CONFIG_FOLDER_='BarberControl - CONFIG PRIVADA NO COMPARTIR';
const BC_PRIVATE_CONFIG_FILE_='barbercontrol-system-config.json';

function bcPrivateConfigFolder_(create) {
  const props=PropertiesService.getScriptProperties();
  const savedId=props.getProperty('PRIVATE_CONFIG_FOLDER_ID');
  if(savedId) {
    try {
      const folder=DriveApp.getFolderById(savedId);
      if(folder.getName()===BC_PRIVATE_CONFIG_FOLDER_)return folder;
    }catch(error){ /* Buscar por nombre si se movió o se perdió el acceso. */ }
  }
  const found=DriveApp.getFoldersByName(BC_PRIVATE_CONFIG_FOLDER_);
  if(found.hasNext()){
    const folder=found.next();
    if(found.hasNext())
      throw new Error('Se encontraron varias carpetas privadas BarberControl. Por seguridad no se elige ninguna automáticamente.');
    props.setProperty('PRIVATE_CONFIG_FOLDER_ID',folder.getId());
    return folder;
  }
  if(!create)return null;
  const folder=DriveApp.createFolder(BC_PRIVATE_CONFIG_FOLDER_);
  props.setProperty('PRIVATE_CONFIG_FOLDER_ID',folder.getId());
  return folder;
}

function bcPrivateConfigFile_(folder) {
  const matches=folder.getFilesByName(BC_PRIVATE_CONFIG_FILE_);
  if(!matches.hasNext())return null;
  const file=matches.next();
  if(matches.hasNext())throw new Error('Existen varios manifiestos de BarberControl en la carpeta privada. Requiere revisión.');
  return file;
}

/** Solo permite leer el manifiesto cuando el formato es el esperado. */
function bcLeerManifiestoPrivado_() {
  const folder=bcPrivateConfigFolder_(false);
  if(!folder)return null;
  const file=bcPrivateConfigFile_(folder);
  if(!file)return null;
  let config;
  try{config=JSON.parse(file.getBlob().getDataAsString('UTF-8'));}
  catch(error){throw new Error('La configuración privada guardada en Drive no es JSON válido.');}
  if(!config||config.tipo!=='BARBERCONTROL_AUTO_V1'||
    typeof config.spreadsheetId!=='string'||
    typeof config.calendarId!=='string'||
    typeof config.bridgeSecret!=='string')
    throw new Error('El manifiesto privado de BarberControl no tiene la estructura esperada.');
  return config;
}

/**
 * Admin: crea o actualiza el manifiesto después de crear los recursos.
 * La conexión no sale de Drive ni se publica en la aplicación pública.
 */
function bcGuardarManifiestoPrivado_() {
  const props=PropertiesService.getScriptProperties();
  const sheetId=props.getProperty('SPREADSHEET_ID');
  const calendarId=props.getProperty('CALENDAR_ID');
  const rootId=props.getProperty('ROOT_FOLDER_ID');
  const secret=props.getProperty('BRIDGE_SECRET');
  if(!sheetId||!calendarId||!rootId||!secret)
    throw new Error('Faltan recursos para preparar la vinculación automática.');
  const folder=bcPrivateConfigFolder_(true);
  const obj={
    tipo:'BARBERCONTROL_AUTO_V1',
    spreadsheetId:sheetId,
    calendarId:calendarId,
    rootFolderId:rootId,
    bridgeSecret:secret
  };
  const content=JSON.stringify(obj);
  const file=bcPrivateConfigFile_(folder);
  if(file)file.setContent(content);
  else folder.createFile(BC_PRIVATE_CONFIG_FILE_,content,MimeType.PLAIN_TEXT);
  props.setProperty('AUTO_LINK_READY','true');
  return true;
}

/**
 * Si Admin conserva su manifiesto pero ha perdido una Script Property,
 * recupera la referencia ya creada SIN crear una segunda BD/calendario.
 */
function bcRecuperarPropsAdmin_() {
  const props=PropertiesService.getScriptProperties();
  const required=['SPREADSHEET_ID','CALENDAR_ID','ROOT_FOLDER_ID','BRIDGE_SECRET'];
  if(required.every(k=>Boolean(props.getProperty(k))))return;
  const config=bcLeerManifiestoPrivado_();
  if(!config)return;
  const mapping={
    SPREADSHEET_ID:config.spreadsheetId,
    CALENDAR_ID:config.calendarId,
    ROOT_FOLDER_ID:config.rootFolderId,
    BRIDGE_SECRET:config.bridgeSecret
  };
  // Validar que los recursos anteriores siguen siendo accesibles.
  SpreadsheetApp.openById(mapping.SPREADSHEET_ID);
  if(!CalendarApp.getCalendarById(mapping.CALENDAR_ID))
    throw new Error('El calendario guardado ya no está disponible. No se crearán recursos nuevos automáticamente.');
  DriveApp.getFolderById(mapping.ROOT_FOLDER_ID);
  required.forEach(function(key){
    if(!props.getProperty(key))props.setProperty(key,mapping[key]);
  });
}

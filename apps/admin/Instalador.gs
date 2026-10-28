/**
 * Instalador idempotente, exclusivamente para el proyecto PRIVADO.
 * Ejecutar con la cuenta que sera propietaria de Drive/Sheets/Calendar.
 */
const BC_SCHEMA_ = {
  Configuracion: ['Clave','Valor','Descripcion'],
  Horarios: ['DiaSemana','Abierto','Inicio','Fin'],
  Bloqueos: ['ID','Tipo','DiaSemana','FechaInicio','FechaFin','Inicio','Fin','Motivo','Activo'],
  Servicios: ['ID','Nombre','Categoria','Descripcion','DuracionMin','Precio','Moneda','ImagenId','Activo','Visible','Reservable','Orden'],
  Estilos: ['ID','Nombre','ServicioId','Descripcion','Origen','Tecnica','ImagenId','Activo','Visible','Orden'],
  Galeria: ['ID','Titulo','Descripcion','ServicioId','EstiloId','Destacado','Publicado','Consentimiento','CreadoEn'],
  Medios: ['ID','GaleriaId','Tipo','DriveId','YoutubeId','Descripcion','Orden','Publicado'],
  Reservas: ['ID','CreadaEn','Fecha','Inicio','Fin','Cliente','Telefono','ServicioId','EstiloId','GaleriaId','Comentario','Estado','CalendarEventId','Idempotencia','Precio','DuracionMin','TokenHash'],
  Auditoria: ['Fecha','Accion','Entidad','ID','Detalle']
};

function instalarBarberControl() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    let root;
    if (props.getProperty('ROOT_FOLDER_ID')) {
      root = DriveApp.getFolderById(props.getProperty('ROOT_FOLDER_ID'));
    } else {
      root = DriveApp.createFolder('BarberControl');
      props.setProperty('ROOT_FOLDER_ID', root.getId());
    }
    const carpetas = ['Imagenes', 'Videos', 'Respaldos'];
    carpetas.forEach(function(nombre) {
      const existentes = root.getFoldersByName(nombre);
      const folder = existentes.hasNext() ? existentes.next() : root.createFolder(nombre);
      if (nombre === 'Imagenes') {
        ['Servicios','Estilos','Galeria','Miniaturas','Identidad'].forEach(function(sub) {
          if (!folder.getFoldersByName(sub).hasNext()) folder.createFolder(sub);
        });
      }
    });
    let ss;
    if (props.getProperty('SPREADSHEET_ID')) {
      ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    } else {
      ss = SpreadsheetApp.create('BarberControl_DB');
      props.setProperty('SPREADSHEET_ID', ss.getId());
    }
    ss.setSpreadsheetTimeZone('America/Managua');
    Object.keys(BC_SCHEMA_).forEach(function(nombre) {
      let sheet = ss.getSheetByName(nombre);
      if (!sheet) {
        const hojas = ss.getSheets();
        if (hojas.length === 1 && hojas[0].getLastRow() === 0 && !BC_SCHEMA_.hasOwnProperty(hojas[0].getName())) {
          sheet = hojas[0].setName(nombre);
        } else {
          sheet = ss.insertSheet(nombre);
        }
      }
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1,1,1,BC_SCHEMA_[nombre].length).setValues([BC_SCHEMA_[nombre]]);
        sheet.setFrozenRows(1);
        sheet.getRange(1,1,1,BC_SCHEMA_[nombre].length).setBackground('#171a20').setFontColor('#ffffff').setFontWeight('bold');
      } else {
        const actuales = sheet.getRange(1,1,1,BC_SCHEMA_[nombre].length).getDisplayValues()[0];
        if (JSON.stringify(actuales) !== JSON.stringify(BC_SCHEMA_[nombre])) {
          throw new Error('La estructura de la hoja '+nombre+' no coincide con el esquema; no se modificaron sus encabezados.');
        }
      }
    });
    const defaults = [
      ['NOMBRE_NEGOCIO','Mi Barberia','Nombre comercial'],
      ['MONEDA','NIO','Moneda de precios'],
      ['ZONA_HORARIA','America/Managua','Zona horaria'],
      ['INTERVALO_MIN','15','Frecuencia de horarios de inicio'],
      ['ANTICIPACION_MIN','60','Anticipacion minima de reservas'],
      ['DIAS_ADELANTO','30','Ventana maxima de reserva'],
      ['BUFFER_MIN','0','Tiempo extra entre servicios']
    ];
    const config = ss.getSheetByName('Configuracion');
    const existentes = config.getLastRow()>1 ? config.getRange(2,1,config.getLastRow()-1,1).getValues().flat().map(String) : [];
    defaults.filter(function(row){return existentes.indexOf(row[0])===-1;}).forEach(function(row){config.appendRow(row);});
    const horarios = ss.getSheetByName('Horarios');
    if (horarios.getLastRow() === 1) {
      horarios.getRange(2,1,7,4).setValues([
        [0,false,'',''],[1,true,'08:00','18:00'],[2,true,'08:00','18:00'],
        [3,true,'08:00','18:00'],[4,true,'08:00','18:00'],[5,true,'08:00','18:00'],
        [6,true,'08:00','17:00']
      ]);
    }
    DriveApp.getFileById(ss.getId()).moveTo(root);
    if (!props.getProperty('CALENDAR_ID')) {
      const calendar = CalendarApp.createCalendar('BarberControl - Citas',{timeZone:'America/Managua'});
      props.setProperty('CALENDAR_ID',calendar.getId());
    } else {
      if (!CalendarApp.getCalendarById(props.getProperty('CALENDAR_ID'))) {
        throw new Error('El calendario configurado no es accesible. Comprueba CALENDAR_ID.');
      }
    }
    return obtenerEstadoInstalacion_();
  } finally {
    lock.releaseLock();
  }
}

function obtenerEstadoInstalacion_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  const calendarId = props.getProperty('CALENDAR_ID');
  return {
    instalado: Boolean(spreadsheetId && calendarId && props.getProperty('ROOT_FOLDER_ID')),
    spreadsheetId: spreadsheetId || '',
    calendarId: calendarId || '',
    rootFolderId: props.getProperty('ROOT_FOLDER_ID') || '',
    spreadsheetUrl: spreadsheetId ? 'https://docs.google.com/spreadsheets/d/'+spreadsheetId+'/edit' : '',
    carpetaUrl: props.getProperty('ROOT_FOLDER_ID') ? 'https://drive.google.com/drive/folders/'+props.getProperty('ROOT_FOLDER_ID') : '',
    propiedadesPublicas: spreadsheetId && calendarId ? {
      SPREADSHEET_ID: spreadsheetId,
      CALENDAR_ID: calendarId
    } : null
  };
}

function obtenerDbAdmin_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Primero ejecuta el instalador desde el panel administrativo.');
  return SpreadsheetApp.openById(id);
}

function leerFilasAdmin_(nombre) {
  const sheet = obtenerDbAdmin_().getSheetByName(nombre);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length<=1) return [];
  return values.slice(1).filter(function(row){return row[0]!=='';}).map(function(row){
    const obj={}; values[0].forEach(function(key,i){obj[key]=row[i]||'';});return obj;
  });
}

function auditarAdmin_(accion,entidad,id,detalle) {
  obtenerDbAdmin_().getSheetByName('Auditoria').appendRow([new Date(),accion,entidad,id,String(detalle||'').slice(0,500)]);
}

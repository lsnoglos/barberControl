/**
 * Instalador idempotente, exclusivamente para el proyecto PRIVADO.
 * Ejecutar con la cuenta que sera propietaria de Drive/Sheets/Calendar.
 */
const BC_SCHEMA_ = {
  Configuracion: ['Clave','Valor','Descripcion'],
  Categorias: ['ID','Nombre','Orden','Activa'],
  Cortes: ['ID','Nombre','Categoria','Descripcion','Origen','Tecnica','PrecioLocal','PrecioDomicilio','DuracionMin','ImagenId','Activo','Visible','Orden','LegacyServicioId','LegacyEstiloId'],
  FotosCortes: ['ID','CorteId','DriveId','Descripcion','Orden','Publicado'],
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
    // Recuperar los IDs existentes desde Drive antes de crear algo nuevo.
    bcRecuperarPropsAdmin_();
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
    // Ampliación compatible: conservar las 18 columnas de las reservas antiguas.
    const reservasSheet=ss.getSheetByName('Reservas');
    const extra=['CorteId','Modalidad','Direccion'];
    const firstHeader=reservasSheet.getRange(1,1,1,reservasSheet.getLastColumn()).getDisplayValues()[0];
    extra.forEach(function(key){
      if(firstHeader.indexOf(key)<0){
        const col=reservasSheet.getLastColumn()+1;
        reservasSheet.getRange(1,col).setValue(key);
        reservasSheet.getRange(1,col).setBackground('#171a20').setFontColor('#ffffff').setFontWeight('bold');
      }
    });
    // Crear un Corte por cada estilo antiguo, manteniendo el precio local
    // y el vínculo histórico. Las hojas Servicios/Estilos NO se borran.
    migrarEstilosACortes_(ss);
    // Mantener fechas, horas y teléfonos como texto en Sheets.
    ss.getSheetByName('Reservas').getRange('A:A').setNumberFormat('@');
    ss.getSheetByName('Reservas').getRange('C:E').setNumberFormat('@');
    ss.getSheetByName('Reservas').getRange('G:G').setNumberFormat('@');
    ss.getSheetByName('Reservas').getRange('N:N').setNumberFormat('@');
    ss.getSheetByName('Horarios').getRange('C:D').setNumberFormat('@');
    ss.getSheetByName('Bloqueos').getRange('D:G').setNumberFormat('@');
    const defaults = [
      ['NOMBRE_NEGOCIO','Mi Barberia','Nombre comercial'],
      ['MONEDA','NIO','Moneda de precios'],
      ['ZONA_HORARIA','America/Managua','Zona horaria'],
      ['INTERVALO_MIN','15','Frecuencia de horarios de inicio'],
      ['ANTICIPACION_MIN','60','Anticipacion minima de reservas'],
      ['DIAS_ADELANTO','30','Ventana maxima de reserva'],
      ['BUFFER_MIN','0','Tiempo extra entre servicios'],
      ['TELEFONO_WHATSAPP','','WhatsApp comercial, código internacional'],
      ['ESLOGAN_NEGOCIO','Tu estilo comienza aquí','Eslogan público'],
      ['LOGO_FILE_ID','','Archivo PNG con transparencia en Drive'],
      ['PUBLIC_CATALOG_VERSION','0','Marca de versión para actualizar catálogo público']
    ];
    const config = ss.getSheetByName('Configuracion');
    const existentes = config.getLastRow()>1 ? config.getRange(2,1,config.getLastRow()-1,1).getValues().flat().map(String) : [];
    defaults.filter(function(row){return existentes.indexOf(row[0])===-1;}).forEach(function(row){config.appendRow(row);});
    const categories=ss.getSheetByName('Categorias');
    if (categories.getLastRow()===1) {
      categories.getRange(2,1,7,4).setValues([
        ['CAT-CABELLO','Cabello',1,true],['CAT-BARBA','Barba',2,true],
        ['CAT-COMBOS','Combos',3,true],['CAT-MASAJES','Masajes',4,true],
        ['CAT-DISENOS','Diseños',5,true],['CAT-TRATAMIENTOS','Tratamientos',6,true],
        ['CAT-OTROS','Otros',7,true]
      ]);
    }
    const horarios = ss.getSheetByName('Horarios');
    if (horarios.getLastRow() === 1) {
      horarios.getRange(2,1,7,4).setValues([
        [0,false,'',''],[1,true,'08:00','18:00'],[2,true,'08:00','18:00'],
        [3,true,'08:00','18:00'],[4,true,'08:00','18:00'],[5,true,'08:00','18:00'],
        [6,true,'08:00','17:00']
      ]);
    }
    // Detectar también cambios manuales en las pestañas comerciales de Sheets.
    // Las escrituras hechas desde Admin ya invalidan la versión directamente.
    const handler='barberControlOnEditCatalogo_';
    const existingTrigger=ScriptApp.getProjectTriggers().some(function(trigger){
      return trigger.getHandlerFunction()===handler &&
        trigger.getTriggerSourceId()===ss.getId();
    });
    if(!existingTrigger)ScriptApp.newTrigger(handler).forSpreadsheet(ss).onEdit().create();
    DriveApp.getFileById(ss.getId()).moveTo(root);
    if (!props.getProperty('CALENDAR_ID')) {
      const calendar = CalendarApp.createCalendar('BarberControl - Citas',{timeZone:'America/Managua'});
      props.setProperty('CALENDAR_ID',calendar.getId());
    } else {
      if (!CalendarApp.getCalendarById(props.getProperty('CALENDAR_ID'))) {
        throw new Error('El calendario configurado no es accesible. Comprueba CALENDAR_ID.');
      }
    }
    if (!props.getProperty('BRIDGE_SECRET')) {
      props.setProperty('BRIDGE_SECRET',Utilities.getUuid()+Utilities.getUuid());
    }
    // Guardar los IDs y el secreto en una carpeta privada independiente.
    // Barber Public los descubrirá automáticamente al ejecutar su asistente.
    bcGuardarManifiestoPrivado_();
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
    publicWebappUrl: props.getProperty('PUBLIC_WEBAPP_URL') || '',
    propiedadesPublicas: spreadsheetId && calendarId ? {
      SPREADSHEET_ID: spreadsheetId,
      CALENDAR_ID: calendarId,
      BRIDGE_SECRET: props.getProperty('BRIDGE_SECRET') || ''
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

/** Detecta cambios MANUALES en las pestañas del catálogo público. */
function barberControlOnEditCatalogo_(event) {
  if(!event||!event.range||!event.source)return;
  const expected=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!expected||event.source.getId()!==expected)return;
  const sheetName=event.range.getSheet().getName();
  if(['Servicios','Estilos','Cortes','FotosCortes','Categorias','Configuracion'].indexOf(sheetName)===-1)return;
  actualizarVersionEscaparate_();
}

/**
 * Paquete de enlace a Barber Public. Solo llamar desde Barber Admin PRIVADO.
 * No guardarlo en Google Sheets, HTML público ni en repositorios Git.
 */
function exportarConexionPublicaAdmin() {
  const props=PropertiesService.getScriptProperties();
  const datos={
    tipo:'BARBERCONTROL_PUBLIC_V1',
    SPREADSHEET_ID:props.getProperty('SPREADSHEET_ID')||'',
    CALENDAR_ID:props.getProperty('CALENDAR_ID')||'',
    BRIDGE_SECRET:props.getProperty('BRIDGE_SECRET')||''
  };
  if(!datos.SPREADSHEET_ID || !datos.CALENDAR_ID || !datos.BRIDGE_SECRET){
    throw new Error('El instalador todavía no ha generado todos los recursos de Google.');
  }
  // Se envía únicamente a la interfaz PRIVADA del propietario.
  return JSON.stringify(datos);
}

/** Migración idempotente: de Servicios + Estilos hacia un único catálogo Cortes. */
function migrarEstilosACortes_(ss) {
  const cortes=ss.getSheetByName('Cortes');
  const oldServicios=ss.getSheetByName('Servicios').getDataRange().getDisplayValues();
  const oldEstilos=ss.getSheetByName('Estilos').getDataRange().getDisplayValues();
  const asRows=function(rows){const keys=rows[0];return rows.slice(1).filter(r=>r[0]).map(r=>{
    const obj={};keys.forEach((k,i)=>obj[k]=r[i]||'');return obj;
  });};
  const servicios=asRows(oldServicios),estilos=asRows(oldEstilos);
  const byId={};servicios.forEach(s=>byId[s.ID]=s);
  const existing=cortes.getDataRange().getDisplayValues();
  const known=new Set(existing.slice(1).map(r=>r[13]+'|'+r[14]));
  const hasStyle=new Set(estilos.map(e=>e.ServicioId));
  const out=[];
  const active=v=>String(v).toLowerCase()==='true';
  const parsePrice=v=>String(v).trim()===''?'':Number(String(v).replace(',','.'));
  estilos.forEach(e=>{
    const s=byId[e.ServicioId];if(!s||known.has(e.ServicioId+'|'+e.ID))return;
    const price=parsePrice(s.Precio);
    const id='CRT-'+Utilities.getUuid().slice(0,12).toUpperCase();
    out.push([id,e.Nombre,s.Categoria,e.Descripcion||s.Descripcion,e.Origen,e.Tecnica,
      Number.isFinite(price)?price:'','',Number(s.DuracionMin)||30,e.ImagenId||s.ImagenId,
      active(s.Activo)&&active(e.Activo),active(s.Visible)&&active(e.Visible),Number(e.Orden)||0,
      s.ID,e.ID]);
  });
  servicios.forEach(s=>{
    if(hasStyle.has(s.ID)||known.has(s.ID+'|'))return;
    const price=parsePrice(s.Precio);
    out.push(['CRT-'+Utilities.getUuid().slice(0,12).toUpperCase(),s.Nombre,s.Categoria,s.Descripcion,'','',
      Number.isFinite(price)?price:'','',Number(s.DuracionMin)||30,s.ImagenId,
      active(s.Activo),active(s.Visible),Number(s.Orden)||0,s.ID,'']);
  });
  if(out.length){
    cortes.getRange(cortes.getLastRow()+1,1,out.length,15).setValues(out);
    SpreadsheetApp.flush();
  }
  // No modifica citas históricas ni vuelve a migrar registros ya existentes.
}

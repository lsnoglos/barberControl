/**
 * Asistente de vinculación para Barber Public.
 *
 * Uso desde el EDITOR de Apps Script del propietario:
 * 1. En Configuración del proyecto > Propiedades, crear
 *    PAQUETE_BARBERCONTROL y pegar el paquete copiado de Admin.
 * 2. Ejecutar aplicarPaqueteConexionPublica desde el editor.
 *
 * No recibe parámetros desde visitantes ni devuelve credenciales.
 * Tras instalar, borra la propiedad temporal automáticamente.
 */
function aplicarPaqueteConexionPublica() {
  const props=PropertiesService.getScriptProperties();
  const raw=props.getProperty('PAQUETE_BARBERCONTROL');
  if(!raw)throw new Error('Agrega PAQUETE_BARBERCONTROL en las propiedades del proyecto y pega el paquete de Admin.');
  if(raw.length>3000)throw new Error('El paquete supera la longitud permitida.');
  let paquete;
  try{paquete=JSON.parse(raw);}catch(e){throw new Error('El paquete no es JSON válido. Vuelve a copiarlo de Barber Admin.');}
  if(!paquete||paquete.tipo!=='BARBERCONTROL_PUBLIC_V1')throw new Error('Formato de paquete incorrecto.');
  const id=String(paquete.SPREADSHEET_ID||'').trim();
  const cal=String(paquete.CALENDAR_ID||'').trim();
  const secret=String(paquete.BRIDGE_SECRET||'').trim();
  if(!/^[A-Za-z0-9_-]{20,200}$/.test(id))throw new Error('Identificador de Sheets inválido.');
  if(cal.length<12||cal.length>300||!/^[A-Za-z0-9_.@-]+$/.test(cal))
    throw new Error('Identificador de Calendar inválido.');
  if(secret.length<50||secret.length>300||!/^[A-Za-z0-9-]+$/.test(secret))
    throw new Error('Clave privada inválida.');
  // Verificar primero que el propietario pueda leer los recursos existentes.
  const spreadsheet=SpreadsheetApp.openById(id);
  ['Configuracion','Servicios','Reservas','Horarios'].forEach(function(nombre){
    if(!spreadsheet.getSheetByName(nombre))throw new Error('No existe la hoja requerida: '+nombre);
  });
  const calendario=CalendarApp.getCalendarById(cal);
  if(!calendario)throw new Error('La cuenta actual no tiene acceso al calendario configurado.');
  // Escribir todas las propiedades y retirar el paquete temporal.
  props.setProperties({
    SPREADSHEET_ID:id,
    CALENDAR_ID:cal,
    BRIDGE_SECRET:secret
  });
  props.deleteProperty('PAQUETE_BARBERCONTROL');
  return 'Barber Public conectado a '+spreadsheet.getName()+
    ' y al calendario '+calendario.getName()+'. No es necesario buscar IDs manualmente.';
}

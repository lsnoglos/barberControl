/**
 * Acceso de solo lectura a la configuracion compartida.
 * Configura SPREADSHEET_ID y CALENDAR_ID en las Script Properties
 * de ESTE proyecto publico antes de desplegar.
 */
const BC_TZ_ = 'America/Managua';

function dbPublica_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('BarberControl no esta configurado. Falta SPREADSHEET_ID.');
  return SpreadsheetApp.openById(id);
}
function calendarioPublico_() {
  const id=PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
  if (!id) throw new Error('Falta CALENDAR_ID en la configuracion publica.');
  const calendar=CalendarApp.getCalendarById(id);
  if(!calendar) throw new Error('El calendario de la barberia no es accesible.');
  return calendar;
}
function leerPublico_(nombre) {
  const values=dbPublica_().getSheetByName(nombre).getDataRange().getDisplayValues();
  if(values.length<=1)return [];
  return values.slice(1).filter(function(r){return r[0]!=='';}).map(function(r){
    const object={};values[0].forEach(function(k,i){object[k]=r[i]||'';});return object;
  });
}
function esVerdad_(v){return String(v).toLowerCase()==='true'||String(v)==='1';}
function configuracionPublica_(){
  const out={};
  leerPublico_('Configuracion').forEach(function(r){out[r.Clave]=r.Valor;});
  return out;
}
function serviciosPublicos_(){
  return leerPublico_('Servicios').filter(function(s){
    return esVerdad_(s.Activo)&&esVerdad_(s.Visible)&&esVerdad_(s.Reservable);
  }).map(function(s){
    return {id:s.ID,nombre:s.Nombre,categoria:s.Categoria,
      descripcion:s.Descripcion,duracion:Number(s.DuracionMin),
      precio:Number(s.Precio),moneda:s.Moneda||'NIO'};
  }).filter(function(s){return Number.isFinite(s.duracion)&&s.duracion>0;});
}
function obtenerCatalogoPublico() {
  try{
    const conf=configuracionPublica_();
    return {
      listo: Boolean(PropertiesService.getScriptProperties().getProperty('CALENDAR_ID')),
      negocio:conf.NOMBRE_NEGOCIO||'BarberControl',
      servicios:serviciosPublicos_(),
      moneda:conf.MONEDA||'NIO'
    };
  }catch(e){
    return {listo:false,negocio:'BarberControl',servicios:[],mensaje:'El propietario debe completar la instalación.'};
  }
}
function minutos_(hhmm){
  const s=String(hhmm);
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))throw new Error('Hora invalida: '+s);
  return Number(s.slice(0,2))*60+Number(s.slice(3,5));
}
function reloj_(min){
  return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');
}
function fechaLocal_(date,hhmm){
  const [y,m,d]=date.split('-').map(Number);
  const [h,min]=hhmm.split(':').map(Number);
  return new Date(y,m-1,d,h,min,0,0);
}
function validarFecha_(fecha,conf) {
  if(typeof fecha!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(fecha))throw new Error('Fecha invalida.');
  const dt=fechaLocal_(fecha,'12:00');
  if(Utilities.formatDate(dt,BC_TZ_,'yyyy-MM-dd')!==fecha)throw new Error('Fecha inexistente.');
  const hoy=Utilities.formatDate(new Date(),BC_TZ_,'yyyy-MM-dd');
  if(fecha<hoy)throw new Error('No se permiten citas en fechas anteriores.');
  const diferencia=Math.floor((fechaLocal_(fecha,'12:00')-fechaLocal_(hoy,'12:00'))/86400000);
  const limite=Number(conf.DIAS_ADELANTO||30);
  if(diferencia>limite)throw new Error('Esa fecha excede el plazo de reserva permitido.');
  return dt;
}

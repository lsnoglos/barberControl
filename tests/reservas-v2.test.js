const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'apps/public/Reservas.gs'),'utf8');
const headers=['ID','CreadaEn','Fecha','Inicio','Fin','Cliente','Telefono','ServicioId',
 'EstiloId','GaleriaId','Comentario','Estado','CalendarEventId','Idempotencia','Precio',
 'DuracionMin','TokenHash','CorteId','Modalidad','Direccion'];
const saved=[];
let created=0,deleted=0,failAppend=false;
const alerts=[];
let clearingReminders=0;
const sheet={
 getLastColumn:()=>headers.length,
 getRange:(r,c,n,len)=>({getDisplayValues:()=>[headers]}),
 appendRow:row=>{
  if(failAppend)throw new Error('Sin acceso a Sheets');
  saved.push(row);
 }
};
const ctx=vm.createContext({
 LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},
 configuracionPublica_:()=>({AVISOS_LOCAL:'30,15',AVISOS_DOMICILIO:'60,30,15'}),
 leerPublico_:()=>saved.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]]))),
 cortesPublicos_:()=>[{id:'CRT-1',nombre:'Low Fade'}],
 calcularIntervalos_:(fecha,corteId,modalidad)=>({
  corte:{id:corteId,nombre:'Low Fade',precio:modalidad==='LOCAL'?80:125,duracion:45},
  horarios:[{inicio:'14:15',fin:'15:00'}]
 }),
 calendarioPublico_:()=>({createEvent:(title,start,end,options)=>{
  created++;assert(title.includes('Low Fade'));
  assert(title.includes('A domicilio'));
  assert(options.description.includes('Barrio central'));
  assert(title.includes('William'),'El nombre debe aparecer en el aviso');
  assert.equal(options.location,'Barrio central casa azul');
  return {
    getId:()=> 'calendar-event-1',deleteEvent:()=>{deleted++;},
    getStartTime:()=>new Date(Date.now()+6*3600*1000),
    removeAllReminders:()=>{clearingReminders++;},
    addPopupReminder:minutes=>{alerts.push(minutes);}
  };
 }}),
 dbPublica_:()=>({getSheetByName:()=>sheet}),
 fechaLocal_:(fecha,time)=>new Date(fecha+'T'+time+':00'),
 SpreadsheetApp:{flush:()=>{}},
 Utilities:{
  getUuid:()=> 'abcdef12-abcd-4def-8abc-abcdefabcdef',
  DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},
  computeDigest:()=>[1,2,3,4]
 },
 Date,Error,Number,String,Array,JSON
});
vm.runInContext(code,ctx);
const payload={
 nombre:'William',telefono:'58371944',comentario:'Quiero degradado',direccion:'Barrio central casa azul',
 corteId:'CRT-1',modalidad:'DOMICILIO',fecha:'2026-11-11',inicio:'14:15',
 idempotencia:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
};
const call=obj=>vm.runInContext('reservarCita',ctx)(obj);
assert.throws(()=>call([payload]),/formato incorrecto/);
const confirmation=call(payload);
assert.equal(confirmation.nombre,'Low Fade');
assert.equal(confirmation.modalidad,'DOMICILIO');
assert.equal(confirmation.precio,125);
assert.equal(saved[0][headers.indexOf('Cliente')],'William');
assert.equal(saved[0][headers.indexOf('Telefono')],'50558371944');
assert.equal(saved[0][headers.indexOf('CorteId')],'CRT-1');
assert.equal(saved[0][headers.indexOf('Modalidad')],'DOMICILIO');
assert.equal(saved[0][headers.indexOf('Direccion')],'Barrio central casa azul');
assert.equal(created,1);
assert.equal(clearingReminders,1);
assert.deepEqual(alerts,[60,30,15]);
const retry=call(payload);
assert.equal(retry.codigo,confirmation.codigo);
assert.equal(retry.yaExistia,true);
assert.equal(created,1);
assert.equal(saved.length,1);
assert.throws(()=>call({...payload,idempotencia:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',nombre:'W'}),
 /nombre/);
assert.throws(()=>call({...payload,idempotencia:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',direccion:''}),
 /dirección/);
failAppend=true;
assert.throws(()=>call({...payload,idempotencia:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'}),
 /No se pudo completar/);
assert.equal(deleted,1);
const reminders=vm.runInContext('configurarAvisosCalendar_',ctx);
let cleared=0;
const fake={
  removeAllReminders:()=>cleared++,
  getStartTime:()=>new Date(Date.now()+20*60000),
  addPopupReminder:n=>alerts.push(n)
};
const len=alerts.length;
reminders(fake,'LOCAL',{AVISOS_LOCAL:'30,15'});
assert.equal(cleared,1);
assert.deepEqual(alerts.slice(len),[15],'No crear recordatorios para horas que ya pasaron');
reminders(fake,'LOCAL',{AVISOS_LOCAL:'0'});
assert.equal(cleared,2,'La opción sin avisos debe quitar recordatorios predeterminados');
console.log('OK: cita Calendar con cliente/dirección, avisos 60/30/15, idempotencia y rollback');

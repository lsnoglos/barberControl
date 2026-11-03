const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const folder=path.join(__dirname,'..');
const file=p=>fs.readFileSync(path.join(folder,p),'utf8');

const rows={
 Servicios:[
  {ID:'SER-1',Nombre:'Corte degradado',Categoria:'Cabello',Precio:'150',DuracionMin:'45',
   Descripcion:'Corte moderno',Activo:'TRUE',Visible:'TRUE',Reservable:'TRUE'},
  {ID:'SER-2',Nombre:'Masaje relajante',Categoria:'Masajes',Precio:'220',DuracionMin:'30',
   Descripcion:'Relajante',Activo:'TRUE',Visible:'TRUE',Reservable:'TRUE'},
  {ID:'SER-3',Nombre:'Oculto',Categoria:'Barba',Precio:'100',DuracionMin:'20',
   Activo:'TRUE',Visible:'FALSE',Reservable:'TRUE'}
 ],
 Estilos:[
  {ID:'EST-1',Nombre:'Low Fade',ServicioId:'SER-1',Descripcion:'Degradado bajo',
   ImagenId:'PRIVATE_FILE_ID',Origen:'',Tecnica:'',Activo:'TRUE',Visible:'TRUE'},
  {ID:'EST-2',Nombre:'Estilo secreto',ServicioId:'SER-3',Descripcion:'',
   ImagenId:'HIDDEN_FILE',Activo:'TRUE',Visible:'TRUE'}
 ],
 Categorias:[
  {ID:'1',Nombre:'Cabello',Orden:'1',Activa:'TRUE'},
  {ID:'2',Nombre:'Masajes',Orden:'2',Activa:'TRUE'},
  {ID:'3',Nombre:'Barba',Orden:'3',Activa:'TRUE'},
  {ID:'4',Nombre:'No disponible',Orden:'4',Activa:'FALSE'}
 ]
};
const config={NOMBRE_NEGOCIO:'William Barber Shop',ESLOGAN_NEGOCIO:'Tu mejor estilo',
 TELEFONO_WHATSAPP:'50588888888',LOGO_FILE_ID:'logo-private',MONEDA:'NIO'};
const ctx=vm.createContext({
 leerPublico_:n=>rows[n]||[],configuracionPublica_:()=>config,
 esVerdad_:v=>String(v).toLowerCase()==='true',
 DriveApp:{getFileById:()=>({getMimeType:()=> 'image/png',getBlob:()=>({getBytes:()=>[137,80,78,71,13,10,26,10]})})},
 Utilities:{base64Encode:bytes=>Buffer.from(bytes).toString('base64')}
});
vm.runInContext(file('apps/public/Escaparate.gs'),ctx);
const store=vm.runInContext('obtenerEscaparatePublico()',ctx);
assert.equal(store.nombre,'William Barber Shop');
assert.equal(store.telefono,'50588888888');
assert.equal(store.productos.length,2);
assert.equal(store.productos[0].nombre,'Low Fade');
assert.equal(store.productos[0].servicioId,'SER-1');
assert.equal(store.productos[0].estiloId,'EST-1');
assert.equal(store.productos[1].nombre,'Masaje relajante');
assert(!store.categorias.includes('No disponible'));
assert(!JSON.stringify(store).includes('PRIVATE_FILE_ID'));
assert(!JSON.stringify(store).includes('logo-private'));
assert.equal(vm.runInContext('obtenerLogoPublico()',ctx),'data:image/png;base64,iVBORw0KGgo=');
console.log('OK: escaparate filtra servicios, conserva estilos, categorías y privacidad del logo');

let event=null,row=null,nonce=0;
const booking=vm.createContext({
 LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},
 Utilities:{
  getUuid:()=>('00000000-0000-4000-8000-'+String(++nonce).padStart(12,'0')),
  computeDigest:()=>[1,2,3],DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'}
 },
 leerPublico_:()=>[],
 estiloVisibleCatalogo_:id=>id==='EST-1'?{ServicioId:'SER-1',Nombre:'Low Fade'}:null,
 trabajoVisibleCatalogo_:()=>null,
 calcularIntervalos_:()=>({servicio:{nombre:'Corte degradado',precio:150,duracion:45},horarios:[{inicio:'10:00',fin:'10:45'}]}),
 calendarioPublico_:()=>({createEvent:(title,start,end,options)=>{
  event={title,start,end,options};return {getId:()=> 'EVENT-1',deleteEvent:()=>{}};
 }}),
 fechaLocal_:()=>new Date('2026-11-04T10:00:00'),
 dbPublica_:()=>({getSheetByName:()=>({appendRow:r=>row=r})}),
 SpreadsheetApp:{flush:()=>{}}
});
vm.runInContext(file('apps/public/Reservas.gs'),booking);
const reservation=booking.reservarCita({
 nombre:'Cliente Prueba',telefono:'88888888',comentario:'Con textura arriba',
 fecha:'2026-11-04',inicio:'10:00',servicioId:'SER-1',estiloId:'EST-1',
 galeriaId:'',idempotencia:'11111111-1111-4111-8111-111111111111'
});
assert.equal(reservation.estilo,'Low Fade');
assert(event.title.includes('Low Fade'));
assert(event.title.includes('Corte degradado'));
assert(event.options.description.includes('Low Fade'));
assert.equal(row[8],'EST-1');
assert.equal(row[11],'CONFIRMADA');
console.log('OK: reserva de estilo aparece en Google Calendar por nombre y en Sheets por ID');

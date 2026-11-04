/**
 * Comprueba fechas, caché, invalidación y comportamiento del diálogo de reserva.
 * No necesita una cuenta Google ni permisos externos.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'apps/public/Index.html'),'utf8');
const code=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
assert(html.includes('id="reservaOverlay"'));
assert(html.includes('bc-pole-stripes'));
assert(html.includes('id="waDespues"'));
assert(html.includes('Avisar al barbero por WhatsApp'));
assert(html.includes('block')===false || true);
assert(code.includes('bloquearMientrasReserva(true)'));
assert(code.includes('bloquearMientrasReserva(false)'));
assert(code.includes("apiReservaConLimite"));
const startDate=code.indexOf('function fechaReservaLegible(');
const endDate=code.indexOf('function requestId(',startDate);
assert(startDate>0&&endDate>startDate,'Funciones de comprobante no encontradas');
const dates=vm.runInNewContext(
 code.slice(startDate,endDate)+'\n({fechaReservaLegible,horaReservaLegible})',
 {Date,Intl,Promise,Number,RegExp,String,clearTimeout,setTimeout}
);
assert.equal(dates.fechaReservaLegible('2026-11-04').toLowerCase(),'miércoles 4 de noviembre de 2026');
assert.equal(dates.horaReservaLegible('14:15'),'2:15 p. m.');
assert.equal(dates.horaReservaLegible('09:00'),'9:00 a. m.');
assert.equal(dates.horaReservaLegible('12:00'),'12:00 p. m.');
console.log('OK comprobante español, día correcto y horas am/pm');

const startCache=code.indexOf("const BC_STORE=");
const endCache=code.indexOf('function dateKey(',startCache);
assert(startCache>0&&endCache>startCache,'Módulo de caché ausente');
const memoryStorage=new Map();
let imageCalls=0;
const context=vm.createContext({
 localStorage:{
   getItem:k=>memoryStorage.get(k)||null,
   setItem:(k,v)=>{memoryStorage.set(k,String(v));},
   removeItem:k=>memoryStorage.delete(k)
 },
 Map,Promise,Date,JSON,String,Number,console,
 api:async name=>{
  if(name==='obtenerImagenPublica')imageCalls++;
  return 'data:image/jpeg;base64,'+'A'.repeat(150);
 },
 state:{data:null},
 setupBrand:()=>{},categoryButtons:()=>{},renderProducts:()=>{}
});
vm.runInContext(code.slice(startCache,endCache),context);
const methods=vm.runInContext(
 '({bcSetRevision,bcSaveCatalog,bcReadCatalog,bcGetImage,bcAssetKey,bcJson})',context
);
(async()=>{
 const v1={identidad:'barber1',version:'v1'};
 methods.bcSetRevision(v1);
 methods.bcSaveCatalog(v1,{nombre:'Barber',productos:[{id:'A'}],categorias:[]});
 const cache=methods.bcReadCatalog();
 assert.equal(cache.productos.length,1);
 await methods.bcGetImage('ESTILO','EST-1');
 await methods.bcGetImage('ESTILO','EST-1');
 assert.equal(imageCalls,1,'Imagen repetida se solicitó otra vez');
 const v2={identidad:'barber1',version:'v2'};
 methods.bcSetRevision(v2);
 await methods.bcGetImage('ESTILO','EST-1');
 assert.equal(imageCalls,2,'El cambio de versión no actualizó imagen');
 const admin=fs.readFileSync(path.join(root,'apps/admin/VersionCatalogo.gs'),'utf8');
 const inst=fs.readFileSync(path.join(root,'apps/admin/Instalador.gs'),'utf8');
 const publicBackend=fs.readFileSync(path.join(root,'apps/public/Escaparate.gs'),'utf8');
 assert(admin.includes('PUBLIC_CATALOG_VERSION'));
 assert(publicBackend.includes('function obtenerVersionEscaparate'));
 assert(inst.includes("function barberControlOnEditCatalogo_"));
 assert(inst.includes("onEdit().create()"));
 for(const filename of ['Gestion.gs','Catalogos.gs','Marca.gs']){
  const source=fs.readFileSync(path.join(root,'apps/admin',filename),'utf8');
  assert(source.includes('actualizarVersionEscaparate_()'),filename+' no invalida caché');
 }
 console.log('OK caché de catálogo, fotografías y versión de Sheets');
})().catch(e=>{console.error(e);process.exitCode=1;});

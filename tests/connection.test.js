const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const adminProps={SPREADSHEET_ID:'1abcdefghijklmnopqrstuvWXYZ',CALENDAR_ID:'abcd1234@group.calendar.google.com',BRIDGE_SECRET:'12345678-aaaa-bbbb-cccc-dddd0000111112345678-aaaa-bbbb-cccc-dddd00002222'};
const adminCtx=vm.createContext({
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>adminProps[k]||null})},
 Error,JSON,String
});
vm.runInContext(read('apps/admin/Instalador.gs'),adminCtx);
const paquete=vm.runInContext('exportarConexionPublicaAdmin()',adminCtx);
const payload=JSON.parse(paquete);
assert.deepEqual(Object.keys(payload),['tipo','SPREADSHEET_ID','CALENDAR_ID','BRIDGE_SECRET']);
assert.equal(payload.BRIDGE_SECRET,adminProps.BRIDGE_SECRET);
const publicProps={PAQUETE_BARBERCONTROL:paquete};
const publicCtx=vm.createContext({
 PropertiesService:{getScriptProperties:()=>({
   getProperty:key=>publicProps[key]||null,
   setProperties:obj=>Object.assign(publicProps,obj),
   deleteProperty:key=>delete publicProps[key]
 })},
 SpreadsheetApp:{openById:id=>{
   assert.equal(id,adminProps.SPREADSHEET_ID);
   return {getName:()=> 'BarberControl_DB',
     getSheetByName:()=>({})};
 }},
 CalendarApp:{getCalendarById:id=>{
   assert.equal(id,adminProps.CALENDAR_ID);
   return {getName:()=> 'BarberControl - Citas'};
 }},
 JSON,String,Error
});
vm.runInContext(read('apps/public/ConexionPublica.gs'),publicCtx);
const result=vm.runInContext('aplicarPaqueteConexionPublica()',publicCtx);
assert.match(result,/conectado a BarberControl_DB/);
for(const key of ['SPREADSHEET_ID','CALENDAR_ID','BRIDGE_SECRET']){
 assert.equal(publicProps[key],adminProps[key]);
}
assert.equal(publicProps.PAQUETE_BARBERCONTROL,undefined);
assert(!result.includes(adminProps.BRIDGE_SECRET),'La respuesta no debe mostrar la clave');
assert.throws(()=>vm.runInContext('aplicarPaqueteConexionPublica()',publicCtx),
 /Agrega PAQUETE_BARBERCONTROL/);
console.log('OK exportar, validar, importar y retirar paquete de conexión');

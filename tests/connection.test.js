/**
 * Comprueba la instalación automática sin copiar IDs ni secretos.
 * No utiliza ninguna cuenta real de Google.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const load=p=>fs.readFileSync(path.join(base,p),'utf8');
const sheetId='1abcdefghijklmnopqrstuvWXYZ';
const calendarId='abcd1234@group.calendar.google.com';
const secret='12345678-aaaa-bbbb-cccc-dddd0000111112345678-aaaa-bbbb-cccc-dddd00002222';
const folderName='BarberControl - CONFIG PRIVADA NO COMPARTIR';
const manifestName='barbercontrol-system-config.json';
const owner='barber-owner@example.com';
const adminProps={SPREADSHEET_ID:sheetId,CALENDAR_ID:calendarId,ROOT_FOLDER_ID:'root-1',BRIDGE_SECRET:secret};
const publicProps={};
let folder=null;
function iterator(items) {
 const values=items.slice();let current=0;
 return {hasNext:()=>current<values.length,next:()=>values[current++]};
}
function makeFile(name,content) {
 let value=content;
 return {
  getName:()=>name,
  getId:()=> 'file-1',
  getBlob:()=>({getDataAsString:()=>value}),
  setContent:newValue=>{value=newValue;},
  getOwner:()=>({getEmail:()=>owner}),
  getSharingAccess:()=> 'PRIVATE'
 };
}
const drive={
 Access:{PRIVATE:'PRIVATE'},
 getFoldersByName:(name)=>iterator(folder&&name===folderName?[folder]:[]),
 createFolder:(name)=>{
  assert.equal(name,folderName);
  const fileMap=new Map();
  folder={
   getId:()=> 'private-1',getName:()=>name,
   getFilesByName:fileName=>iterator(fileMap.has(fileName)?[fileMap.get(fileName)]:[]),
   createFile:(fileName,content)=>{const f=makeFile(fileName,content);fileMap.set(fileName,f);return f;}
  };
  return folder;
 }
};
function properties(data) {
 return {getProperty:key=>data[key]||null,
   setProperty:(key,value)=>{data[key]=value;},
   setProperties:obj=>Object.assign(data,obj)};
}
const google={
 SpreadsheetApp:{openById:id=>{
  assert.equal(id,sheetId);return {getSheetByName:()=>({}),getName:()=> 'BarberControl_DB'};
 }},
 CalendarApp:{getCalendarById:id=>{
  assert.equal(id,calendarId);return {getName:()=> 'BarberControl - Citas'};
 }},
 DriveApp:drive,
 MimeType:{PLAIN_TEXT:'text/plain'},
 Session:{getEffectiveUser:()=>({getEmail:()=>owner})},
 Error,JSON,String,Boolean
};
const admin=vm.createContext({...google,PropertiesService:{getScriptProperties:()=>properties(adminProps)}});
vm.runInContext(load('apps/admin/ConexionAutomatica.gs'),admin);
assert.equal(vm.runInContext('bcGuardarManifiestoPrivado_()',admin),true);
const config=vm.runInContext('bcLeerManifiestoPrivado_()',admin);
assert.equal(config.tipo,'BARBERCONTROL_AUTO_V1');
assert.equal(config.spreadsheetId,sheetId);
assert.equal(config.calendarId,calendarId);
assert.equal(config.bridgeSecret,secret);
assert.equal(config.rootFolderId,'root-1');
assert(folder,'La carpeta privada no fue creada');
assert.equal(folder.getFilesByName(manifestName).hasNext(),true);
console.log('OK: Admin creó manifiesto privado con IDs y secreto automáticamente');

const publicCtx=vm.createContext({...google,PropertiesService:{getScriptProperties:()=>properties(publicProps)}});
vm.runInContext(load('apps/public/ConexionPublica.gs'),publicCtx);
assert.equal(vm.runInContext('bcAutovincularPublico_()',publicCtx),true);
assert.equal(publicProps.SPREADSHEET_ID,sheetId);
assert.equal(publicProps.CALENDAR_ID,calendarId);
assert.equal(publicProps.BRIDGE_SECRET,secret);
assert.equal(vm.runInContext('bcAutovincularPublico_()',publicCtx),false);
assert.equal(vm.runInContext('typeof aplicarPaqueteConexionPublica',publicCtx),'undefined');
assert.equal(vm.runInContext('typeof bcAutovincularPublico_',publicCtx),'function');
console.log('OK: Public descubrió Drive y creó sus propiedades sin copiar ni pegar valores');

delete adminProps.SPREADSHEET_ID;
delete adminProps.CALENDAR_ID;
delete adminProps.ROOT_FOLDER_ID;
delete adminProps.BRIDGE_SECRET;
const adminRecover=vm.createContext({...google,PropertiesService:{getScriptProperties:()=>properties(adminProps)},
 DriveApp:{...drive,getFolderById:id=>{assert.equal(id,'root-1');return folder;}}});
vm.runInContext(load('apps/admin/ConexionAutomatica.gs'),adminRecover);
vm.runInContext('bcRecuperarPropsAdmin_()',adminRecover);
assert.equal(adminProps.SPREADSHEET_ID,sheetId);
assert.equal(adminProps.CALENDAR_ID,calendarId);
assert.equal(adminProps.ROOT_FOLDER_ID,'root-1');
assert.equal(adminProps.BRIDGE_SECRET,secret);
console.log('OK: Admin recuperó propiedades faltantes sin duplicar recursos');

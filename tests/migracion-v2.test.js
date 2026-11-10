const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../apps/admin/Instalador.gs'),'utf8');
const headers=['ID','Nombre','Categoria','Descripcion','Origen','Tecnica','PrecioLocal','PrecioDomicilio',
 'DuracionMin','ImagenId','Activo','Visible','Orden','LegacyServicioId','LegacyEstiloId'];
const oldServices=[
 ['ID','Nombre','Categoria','Descripcion','DuracionMin','Precio','Moneda','ImagenId','Activo','Visible','Reservable','Orden'],
 ['SER-1','Degradado','Cabello','Corte','45','80','NIO','photo-original','TRUE','TRUE','TRUE','1'],
 ['SER-2','Barba','Barba','Perfilado','20','100','NIO','','TRUE','TRUE','TRUE','2']
];
const oldStyles=[
 ['ID','Nombre','ServicioId','Descripcion','Origen','Tecnica','ImagenId','Activo','Visible','Orden'],
 ['EST-1','Low Fade','SER-1','Detalle low fade','Historia','Máquina','style-photo','TRUE','TRUE','3']
];
const data={Servicios:oldServices,Estilos:oldStyles,Cortes:[headers]};
const sheets={};
for(const [name,rows] of Object.entries(data)){
 sheets[name]={
  getDataRange:()=>({getDisplayValues:()=>rows.map(row=>row.slice())}),
  getLastRow:()=>rows.length,
  getRange:(r,c,n,w)=>({
   setValues:batch=>{for(let i=0;i<batch.length;i++)rows[r+i-1]=batch[i].slice();}
  })
 };
}
let sequence=0;
const context=vm.createContext({
 Utilities:{getUuid:()=>String(++sequence).padStart(8,'0')+'-bbbb-4ccc-8ddd-eeeeeeeeeeee'},
 SpreadsheetApp:{flush:()=>{}},
 Number,String,Set,Error,JSON,Date
});
vm.runInContext(source,context);
const spreadsheet={getSheetByName:name=>sheets[name]};
const migrate=vm.runInContext('migrarEstilosACortes_',context);
migrate(spreadsheet);
assert.equal(data.Cortes.length,3,'Un estilo + un servicio sin estilo');
const low=data.Cortes.find(row=>row[1]==='Low Fade');
assert.equal(low[6],80,'Precio anterior pasa a precio en local');
assert.equal(low[7],'','Domicilio queda sin precio');
assert.equal(low[9],'style-photo','Conservar fotografía principal');
assert.equal(low[13],'SER-1');assert.equal(low[14],'EST-1');
const barba=data.Cortes.find(row=>row[1]==='Barba');
assert.equal(barba[6],100);
assert.equal(barba[14],'');
migrate(spreadsheet);
assert.equal(data.Cortes.length,3,'Migración idempotente');
assert.equal(data.Servicios.length,3,'Servicios históricos intactos');
assert.equal(data.Estilos.length,2,'Estilos históricos intactos');
console.log('OK: migra cortes con imagen y precio, conserva histórico y evita duplicados');

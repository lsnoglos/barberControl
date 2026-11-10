const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const rows={
 Cortes:[
  {ID:'CRT-1',Nombre:'Low Fade',Categoria:'Cabello',PrecioLocal:'80',PrecioDomicilio:'120',DuracionMin:'45',ImagenId:'private1',Descripcion:'Degradado',Activo:'TRUE',Visible:'TRUE'},
  {ID:'CRT-2',Nombre:'Solo en local',Categoria:'Barba',PrecioLocal:'90',PrecioDomicilio:'',DuracionMin:'20',ImagenId:'',Activo:'TRUE',Visible:'TRUE'},
  {ID:'CRT-3',Nombre:'Solo a domicilio',Categoria:'Masajes',PrecioLocal:'',PrecioDomicilio:'250',DuracionMin:'60',ImagenId:'',Activo:'TRUE',Visible:'TRUE'},
  {ID:'CRT-4',Nombre:'Oculto',Categoria:'Cabello',PrecioLocal:'100',PrecioDomicilio:'',DuracionMin:'30',ImagenId:'private4',Activo:'TRUE',Visible:'FALSE'}
 ],
 FotosCortes:[{ID:'F1',CorteId:'CRT-1',Publicado:'TRUE'}],
 Categorias:[
  {Nombre:'Cabello',Activa:'TRUE',Orden:'1'},
  {Nombre:'Barba',Activa:'TRUE',Orden:'2'},
  {Nombre:'Masajes',Activa:'TRUE',Orden:'3'}
 ]
};
const config={
 NOMBRE_NEGOCIO:'William Barber Shop',ESLOGAN_NEGOCIO:'Tu mejor estilo',
 TELEFONO_WHATSAPP:'50588888888',LOGO_FILE_ID:'private-logo',MONEDA:'NIO'
};
const ctx=vm.createContext({
 leerPublico_:n=>rows[n]||[],esVerdad_:v=>String(v).toLowerCase()==='true',
 configuracionPublica_:()=>config,Number,String
});
vm.runInContext(load('apps/public/Escaparate.gs'),ctx);
const page=vm.runInContext('obtenerEscaparatePublico()',ctx);
assert.equal(page.productos.length,3);
assert.equal(page.productos[0].fotosAdicionales,1);
assert.equal(page.productos[1].precioDomicilio,null);
assert.equal(page.productos[2].precioLocal,null);
assert.equal(page.productos[0].precioLocal,80);
assert.equal(page.productos[0].precioDomicilio,120);
assert.equal(JSON.stringify(page).includes('private-logo'),false);
assert.equal(JSON.stringify(page).includes('private1'),false);
console.log('OK: escaparate único, modalidad opcional y sin IDs privados');
const avail=vm.createContext({
 cortesPublicos_:()=>page.productos,
 configuracionPublica_:()=>({}),
 validarFecha_:()=>new Date(2026,10,11),
 leerPublico_:n=>n==='Horarios'?[{DiaSemana:'3',Abierto:'TRUE',Inicio:'08:00',Fin:'18:00'}]:[],
 esVerdad_:v=>String(v).toLowerCase()==='true',
 minutos_:x=>Number(x.slice(0,2))*60+Number(x.slice(3,5)),
 reloj_:x=>String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0'),
 fechaLocal_:(date,time)=>new Date(date+'T'+time+':00'),
 calendarioPublico_:()=>({getEvents:()=>[]}),
 Date,Number,String,Error
});
vm.runInContext(load('apps/public/Disponibilidad.gs'),avail);
assert.equal(vm.runInContext("corteReservable_('CRT-1','LOCAL').precio",avail),80);
assert.equal(vm.runInContext("corteReservable_('CRT-1','DOMICILIO').precio",avail),120);
assert.throws(()=>vm.runInContext("corteReservable_('CRT-2','DOMICILIO')",avail));
assert.throws(()=>vm.runInContext("corteReservable_('CRT-3','LOCAL')",avail));
console.log('OK: disponibilidad basada en precios y modalidad reales');
const code=load('apps/public/Index.html');
assert(!code.includes('Un gran estilo empieza aquí'));
assert(code.includes("api('reservarCita',payload)"));
assert(code.includes('fotosAdicionales>0'));
assert(code.includes('id="galleryModal"'));
assert(code.includes("api('obtenerDisponibilidad',fecha,cut.id,mode)"));
console.log('OK: cliente sin hero, carrusel opcional y envío de objeto correcto');

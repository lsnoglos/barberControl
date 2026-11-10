const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const rows={
 Cortes:[
  {ID:'CRT-1',Nombre:'Low Fade',Categoria:'Cabello',PrecioLocal:'80',PrecioDomicilio:'120',DuracionMin:'45',ImagenId:'private-cover',Activo:'TRUE',Visible:'TRUE'},
  {ID:'CRT-2',Nombre:'Oculto',Categoria:'Barba',PrecioLocal:'100',PrecioDomicilio:'',DuracionMin:'30',ImagenId:'secret-cover',Activo:'TRUE',Visible:'FALSE'}
 ],
 FotosCortes:[
  {ID:'PIC-1',CorteId:'CRT-1',DriveId:'photo-visible',Publicado:'TRUE',Orden:'1'},
  {ID:'PIC-2',CorteId:'CRT-1',DriveId:'photo-hidden',Publicado:'FALSE',Orden:'2'},
  {ID:'PIC-3',CorteId:'CRT-2',DriveId:'photo-secret',Publicado:'TRUE',Orden:'1'}
 ]
};
const requested=[];
const context=vm.createContext({
 leerPublico_:n=>rows[n]||[],esVerdad_:v=>String(v).toLowerCase()==='true',
 DriveApp:{getFileById:id=>{requested.push(id);return {getMimeType:()=> 'image/jpeg',getBlob:()=>({getBytes:()=>[255,216,255]})};}},
 Utilities:{base64Encode:b=>Buffer.from(b).toString('base64')},String,Number,Error
});
vm.runInContext(load('apps/public/Catalogo.gs'),context);
const photos=vm.runInContext("obtenerFotosCortePublico('CRT-1')",context);
assert.equal(photos.length,2,'Se muestra la portada y una foto adicional publicada');
assert.equal(photos[0].id,'PORTADA');
assert.equal(photos[1].id,'PIC-1');
assert.equal(JSON.stringify(photos).includes('private-cover'),false,'No revelar ID de Drive');
assert.throws(()=>vm.runInContext("obtenerFotosCortePublico('CRT-2')",context));
assert.throws(()=>vm.runInContext("obtenerImagenPublica('FOTO_CORTE','CRT-1','PIC-2')",context));
assert.throws(()=>vm.runInContext("obtenerImagenPublica('CORTE','CRT-2','')",context));
assert.equal(vm.runInContext("obtenerImagenPublica('CORTE','CRT-1','')",context),'data:image/jpeg;base64,/9j/');
assert.equal(vm.runInContext("obtenerImagenPublica('FOTO_CORTE','CRT-1','PIC-1')",context),'data:image/jpeg;base64,/9j/');
assert.deepEqual(requested,['private-cover','photo-visible']);
console.log('OK: fotos múltiples, visibilidad y privacidad de Drive');
const admin=load('apps/admin/CortesAdminV2.gs');
const ctx=vm.createContext({});
vm.runInContext(admin,ctx);
const price=vm.runInContext('bcV2Precio_',ctx);
assert.equal(price(''), '');
assert.equal(price('0'),0);
assert.equal(price('150.50'),150.50);
assert.throws(()=>price('-5'));
console.log('OK: precios local/domicilio opcionales');

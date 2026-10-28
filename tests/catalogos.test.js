/**
 * Pruebas aisladas del catálogo, consentimiento y URLs de YouTube.
 * No necesitan credenciales ni llamadas reales a servicios Google.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const base=path.join(__dirname,'..');
const adminSource=fs.readFileSync(path.join(base,'apps/admin/Catalogos.gs'),'utf8');
const admin=vm.createContext({});
vm.runInContext(adminSource,admin,{filename:'apps/admin/Catalogos.gs'});
const youtube=vm.runInContext('extraerYoutubeIdCatalogo_',admin);
assert.equal(youtube('https://youtu.be/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
assert.equal(youtube('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),'dQw4w9WgXcQ');
assert.equal(youtube('https://youtube.com/shorts/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
assert.equal(youtube('https://m.youtube.com/watch?feature=shared&v=dQw4w9WgXcQ'),'dQw4w9WgXcQ');
assert.throws(()=>youtube('https://evil.example/watch?v=dQw4w9WgXcQ'));
assert.throws(()=>youtube('javascript:alert(1)'));
console.log('OK: enlaces YouTube válidos y rechazo de orígenes ajenos');

const rows={
 Servicios:[
  {ID:'SER-1',Nombre:'Degradado',Activo:'TRUE',Visible:'TRUE',Reservable:'TRUE'},
  {ID:'SER-2',Nombre:'Secreto',Activo:'TRUE',Visible:'FALSE',Reservable:'TRUE'},
  {ID:'SER-3',Nombre:'No reservable',Activo:'TRUE',Visible:'TRUE',Reservable:'FALSE'}
 ],
 Estilos:[
  {ID:'EST-1',Nombre:'Low Fade',ServicioId:'SER-1',Activo:'TRUE',Visible:'TRUE',ImagenId:'file-visible'},
  {ID:'EST-2',Nombre:'Oculto',ServicioId:'SER-2',Activo:'TRUE',Visible:'TRUE',ImagenId:'file-secret'}
 ],
 Galeria:[
  {ID:'GAL-1',Titulo:'Trabajo autorizado',ServicioId:'SER-1',Publicado:'TRUE',Consentimiento:'TRUE',Destacado:'FALSE'},
  {ID:'GAL-2',Titulo:'Sin autorización',ServicioId:'SER-1',Publicado:'TRUE',Consentimiento:'FALSE',Destacado:'FALSE'},
  {ID:'GAL-3',Titulo:'Borrador',ServicioId:'SER-1',Publicado:'FALSE',Consentimiento:'TRUE',Destacado:'FALSE'}
 ],
 Medios:[
  {ID:'MED-1',GaleriaId:'GAL-1',Tipo:'FOTO',Publicado:'TRUE',DriveId:'file-work'},
  {ID:'MED-2',GaleriaId:'GAL-2',Tipo:'FOTO',Publicado:'TRUE',DriveId:'file-private'},
  {ID:'MED-3',GaleriaId:'GAL-1',Tipo:'YOUTUBE',Publicado:'TRUE',YoutubeId:'dQw4w9WgXcQ'},
  {ID:'MED-4',GaleriaId:'GAL-3',Tipo:'FOTO',Publicado:'TRUE',DriveId:'file-draft'}
 ]
};
let reads=[];
const context=vm.createContext({
 leerPublico_:n=>rows[n]||[],
 esVerdad_:v=>String(v).toLowerCase()==='true',
 Utilities:{base64Encode:b=>Buffer.from(b).toString('base64')},
 DriveApp:{getFileById:id=>{reads.push(id);return {getMimeType:()=> 'image/jpeg',
   getBlob:()=>({getBytes:()=>[255,216,255,0,0]})};}}
});
vm.runInContext(fs.readFileSync(path.join(base,'apps/public/Catalogo.gs'),'utf8'),context);
const get=expression=>vm.runInContext(expression,context);
const visual=get('obtenerCatalogoVisualPublico()');
assert.equal(visual.estilos.length,1);
assert.equal(visual.estilos[0].id,'EST-1');
assert.equal(visual.trabajos.length,1);
assert.equal(visual.trabajos[0].id,'GAL-1');
assert.equal(visual.trabajos[0].medios.length,2);
assert.equal(JSON.stringify(visual).includes('file-work'),false,'No se deben publicar IDs de Drive');
assert.equal(JSON.stringify(visual).includes('file-secret'),false);
assert.equal(get("obtenerImagenPublica('ESTILO','EST-1','')"),'data:image/jpeg;base64,/9j/AAA=');
assert.equal(get("obtenerImagenPublica('GALERIA','GAL-1','MED-1')"),'data:image/jpeg;base64,/9j/AAA=');
assert.throws(()=>get("obtenerImagenPublica('GALERIA','GAL-2','MED-2')"));
assert.throws(()=>get("obtenerImagenPublica('GALERIA','GAL-3','MED-4')"));
assert.throws(()=>get("obtenerImagenPublica('ESTILO','EST-2','')"));
assert.equal(reads.length,2,'Solo se deben leer de Drive archivos públicos');
console.log('OK: filtros de publicación, privacidad y consentimiento');

const adminIndex=fs.readFileSync(path.join(base,'apps/admin/Index.html'),'utf8');
const publicIndex=fs.readFileSync(path.join(base,'apps/public/Index.html'),'utf8');
assert(adminIndex.includes("incluirCatalogoAdmin_('CatalogoPanel')"));
assert(publicIndex.includes("incluirCatalogoPublico_('GaleriaPublica')"));
assert(publicIndex.includes("bcReferenciaReserva"));
console.log('OK: módulos HTML enlazados y reserva con referencia del estilo');

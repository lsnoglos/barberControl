/**
 * BarberControl Admin — catálogos y archivos multimedia.
 * SOLO desplegar en el proyecto privado (acceso MYSELF).
 *
 * Imágenes: se comprimen en el navegador antes de enviarse a Apps Script.
 * Drive conserva los archivos privados; el proyecto público solo
 * distribuye imágenes cuyo estilo/trabajo está publicado.
 */
function textoCatalogoSeguro_(value, max) {
  const text=String(value===undefined||value===null?'':value).trim().slice(0,max||500);
  return /^[=+\-@]/.test(text) ? "'"+text : text;
}
function verdaderoCatalogo_(value) {
  return value===true || String(value).toLowerCase()==='true';
}
function buscarFilaCatalogo_(nombre,id) {
  const sheet=obtenerDbAdmin_().getSheetByName(nombre);
  const rows=sheet.getDataRange().getValues();
  const index=rows.findIndex(function(row,i){return i>0 && String(row[0])===String(id);});
  if(index<0)throw new Error('No se encontró el registro '+nombre+': '+id);
  return {sheet:sheet,index:index+1,row:rows[index]};
}
function nombreEstilo_(data,key,max) {
  return textoCatalogoSeguro_(data[key],max);
}
function verificarServicioCatalogo_(id) {
  return buscarFilaCatalogo_('Servicios',id);
}
function verificarEstiloCatalogo_(id, servicioId) {
  const found=buscarFilaCatalogo_('Estilos',id);
  if(String(found.row[2])!==String(servicioId))
    throw new Error('El estilo debe pertenecer al servicio seleccionado.');
  return found;
}
function listarCatalogosAdmin() {
  return {
    servicios:leerFilasAdmin_('Servicios'),
    estilos:leerFilasAdmin_('Estilos'),
    trabajos:leerFilasAdmin_('Galeria'),
    medios:leerFilasAdmin_('Medios')
  };
}
function guardarEstiloAdmin(data) {
  if(!data || typeof data!=='object')throw new Error('Información inválida.');
  const nombre=nombreEstilo_(data,'nombre',100);
  const servicioId=String(data.servicioId||'').trim();
  if(nombre.length<3)throw new Error('Escribe el nombre del estilo.');
  verificarServicioCatalogo_(servicioId);
  const id=String(data.id||'').trim() || 'EST-'+Utilities.getUuid().slice(0,10).toUpperCase();
  const sheet=obtenerDbAdmin_().getSheetByName('Estilos');
  const rows=sheet.getDataRange().getValues();
  const index=rows.findIndex(function(r,i){return i>0 && String(r[0])===id;});
  if(data.id && index<0)throw new Error('El estilo que intentas editar no existe.');
  const previous=index>0?rows[index]:null;
  const getFlag=(field,oldIndex,defaultValue)=>data[field]===undefined?
    (previous?verdaderoCatalogo_(previous[oldIndex]):defaultValue):data[field]===true;
  const record=[
    id,nombre,servicioId,
    nombreEstilo_(data,'descripcion',1200),
    nombreEstilo_(data,'origen',1200),
    nombreEstilo_(data,'tecnica',1200),
    previous?String(previous[6]||''):'',
    getFlag('activo',7,true),getFlag('visible',8,true),
    Number.isInteger(Number(data.orden))?Number(data.orden):0
  ];
  if(index>0)sheet.getRange(index+1,1,1,record.length).setValues([record]);
  else sheet.appendRow(record);
  auditarAdmin_('GUARDAR','Estilos',id,nombre);
  return {id:id, catalogos:listarCatalogosAdmin()};
}
function cambiarEstadoEstiloAdmin(id,campo,activo) {
  const columnas={activo:8,visible:9};
  if(!Object.prototype.hasOwnProperty.call(columnas,campo))throw new Error('Campo inválido.');
  const found=buscarFilaCatalogo_('Estilos',id);
  found.sheet.getRange(found.index,columnas[campo]).setValue(activo===true);
  auditarAdmin_('ESTADO','Estilos',id,campo+': '+Boolean(activo));
  return listarCatalogosAdmin();
}
function guardarTrabajoAdmin(data) {
  if(!data || typeof data!=='object')throw new Error('Información inválida.');
  const titulo=nombreEstilo_(data,'titulo',130);
  const servicioId=String(data.servicioId||'').trim();
  const estiloId=String(data.estiloId||'').trim();
  if(titulo.length<3)throw new Error('Introduce un título.');
  verificarServicioCatalogo_(servicioId);
  if(estiloId)verificarEstiloCatalogo_(estiloId,servicioId);
  const consentimiento=data.consentimiento===true;
  const publicado=data.publicado===true;
  if(publicado && !consentimiento)
    throw new Error('Antes de publicar fotografías o videos del cliente confirma su autorización.');
  const id=String(data.id||'').trim() || 'GAL-'+Utilities.getUuid().slice(0,10).toUpperCase();
  const sheet=obtenerDbAdmin_().getSheetByName('Galeria');
  const rows=sheet.getDataRange().getValues();
  const index=rows.findIndex(function(r,i){return i>0 && String(r[0])===id;});
  if(data.id && index<0)throw new Error('La publicación que intentas editar no existe.');
  const fecha=index>0?rows[index][8]:new Date();
  const record=[
    id,titulo,nombreEstilo_(data,'descripcion',1500),
    servicioId,estiloId,data.destacado===true,publicado,consentimiento,fecha
  ];
  if(index>0)sheet.getRange(index+1,1,1,record.length).setValues([record]);
  else sheet.appendRow(record);
  auditarAdmin_('GUARDAR','Galeria',id,titulo);
  return {id:id, catalogos:listarCatalogosAdmin()};
}
function carpetaImagenesCatalogo_(tipo) {
  const props=PropertiesService.getScriptProperties();
  const raiz=props.getProperty('ROOT_FOLDER_ID');
  if(!raiz)throw new Error('Ejecuta primero instalarBarberControl.');
  const root=DriveApp.getFolderById(raiz);
  const imagenes=root.getFoldersByName('Imagenes');
  if(!imagenes.hasNext())throw new Error('Falta la carpeta Imagenes. Ejecuta el instalador.');
  const parent=imagenes.next();
  const nombre=tipo==='SERVICIO'?'Servicios':tipo==='ESTILO'?'Estilos':'Galeria';
  const iterator=parent.getFoldersByName(nombre);
  return iterator.hasNext()?iterator.next():parent.createFolder(nombre);
}
function prepararImagenCatalogo_(base64) {
  const raw=String(base64||'');
  // La interfaz HTML convierte las imágenes a JPEG y restringe el peso.
  const match=/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if(!match)throw new Error('La imagen debe ser JPEG comprimida.');
  if(match[1].length>1700000)throw new Error('La imagen supera el tamaño permitido. Usa una foto más pequeña.');
  const bytes=Utilities.base64Decode(match[1]);
  if(bytes.length<3||bytes.length>1250000||((bytes[0]&255)!==255)||((bytes[1]&255)!==216)||((bytes[2]&255)!==255))
    throw new Error('Archivo JPEG no válido o demasiado grande.');
  return bytes;
}
/**
 * Sube portada de servicio/estilo. El servidor valida el registro y el JPEG.
 * Devuelve identificador de Drive para uso interno del administrador.
 */
function subirPortadaAdmin(data) {
  if(!data || !['ESTILO','SERVICIO'].includes(data.tipo))throw new Error('Tipo no permitido.');
  const nombre=data.tipo==='ESTILO'?'Estilos':'Servicios';
  const id=String(data.id||'').trim();
  const found=buscarFilaCatalogo_(nombre,id);
  if(data.autorizacion!==true)
    throw new Error('Confirma que tienes los derechos o autorización para publicar la imagen.');
  const bytes=prepararImagenCatalogo_(data.imagen);
  const fileName=(data.tipo==='ESTILO'?'estilo_':'servicio_')+
    id.replace(/[^A-Za-z0-9_-]/g,'').slice(0,40)+'_'+Utilities.getUuid().slice(0,8)+'.jpg';
  const file=carpetaImagenesCatalogo_(data.tipo).createFile(
    Utilities.newBlob(bytes,'image/jpeg',fileName)
  );
  try{
    found.sheet.getRange(found.index,data.tipo==='ESTILO'?7:8).setValue(file.getId());
    SpreadsheetApp.flush();
  }catch(e){
    file.setTrashed(true);
    throw e;
  }
  auditarAdmin_('PORTADA',nombre,id,file.getId());
  return {id:id,imagenId:file.getId()};
}
function subirFotoTrabajoAdmin(data) {
  if(!data || typeof data!=='object')throw new Error('Solicitud inválida.');
  const id=String(data.galeriaId||'').trim();
  buscarFilaCatalogo_('Galeria',id);
  const bytes=prepararImagenCatalogo_(data.imagen);
  const nombre='trabajo_'+id.replace(/[^A-Za-z0-9_-]/g,'').slice(0,40)+'_'+
    Utilities.getUuid().slice(0,8)+'.jpg';
  const file=carpetaImagenesCatalogo_('GALERIA').createFile(
    Utilities.newBlob(bytes,'image/jpeg',nombre)
  );
  const mediaId='MED-'+Utilities.getUuid().slice(0,10).toUpperCase();
  try{
    const sheet=obtenerDbAdmin_().getSheetByName('Medios');
    sheet.appendRow([mediaId,id,'FOTO',file.getId(),'',
      nombreEstilo_(data,'descripcion',500),sheet.getLastRow(),true]);
    SpreadsheetApp.flush();
  }catch(e){file.setTrashed(true);throw e;}
  auditarAdmin_('FOTOGRAFIA','Galeria',id,mediaId);
  return {id:mediaId,galeriaId:id};
}
function extraerYoutubeIdCatalogo_(url) {
  const raw=String(url||'').trim();
  let match=raw.match(/^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#]*?&)?v=([A-Za-z0-9_-]{11})(?:[&#]|$)/i);
  if(!match)match=raw.match(/^https:\/\/(?:www\.|m\.)?youtube\.com\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/i);
  if(!match)match=raw.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/i);
  if(!match)throw new Error('Pega un enlace válido de YouTube (watch, Shorts o youtu.be).');
  return match[1];
}
function guardarVideoTrabajoAdmin(data) {
  if(!data||!data.galeriaId)throw new Error('Selecciona una publicación.');
  const id=String(data.galeriaId).trim();
  buscarFilaCatalogo_('Galeria',id);
  const videoId=extraerYoutubeIdCatalogo_(data.url);
  const sheet=obtenerDbAdmin_().getSheetByName('Medios');
  const existing=sheet.getDataRange().getValues();
  const found=existing.findIndex(function(row,i){
    return i>0&&String(row[1])===id&&String(row[2])==='YOUTUBE';
  });
  const mediaId=found>0?String(existing[found][0]):'MED-'+Utilities.getUuid().slice(0,10).toUpperCase();
  const row=[mediaId,id,'YOUTUBE','',videoId,
    nombreEstilo_(data,'descripcion',500),found>0?existing[found][6]:sheet.getLastRow(),true];
  if(found>0)sheet.getRange(found+1,1,1,row.length).setValues([row]);
  else sheet.appendRow(row);
  auditarAdmin_('VIDEO','Galeria',id,videoId);
  return {id:mediaId,galeriaId:id,youtubeId:videoId};
}
function cambiarEstadoMedioAdmin(id,publicado) {
  const found=buscarFilaCatalogo_('Medios',id);
  found.sheet.getRange(found.index,8).setValue(publicado===true);
  auditarAdmin_('ESTADO','Medios',id,'Publicado: '+Boolean(publicado));
  return listarCatalogosAdmin();
}
/** Vista previa privada, solo de un archivo registrado por BarberControl. */
function obtenerImagenAdmin(tipo,id,medioId) {
  let fileId='';
  if(tipo==='ESTILO')fileId=String(buscarFilaCatalogo_('Estilos',id).row[6]||'');
  if(tipo==='SERVICIO')fileId=String(buscarFilaCatalogo_('Servicios',id).row[7]||'');
  if(tipo==='GALERIA'){
    const row=buscarFilaCatalogo_('Medios',medioId).row;
    if(String(row[1])!==String(id) || String(row[2])!=='FOTO')
      throw new Error('La fotografía no pertenece a la publicación.');
    fileId=String(row[3]||'');
  }
  if(!fileId)throw new Error('No hay fotografía para mostrar.');
  const bytes=DriveApp.getFileById(fileId).getBlob().getBytes();
  if(bytes.length>1250000)throw new Error('Imagen demasiado grande.');
  return 'data:image/jpeg;base64,'+Utilities.base64Encode(bytes);
}

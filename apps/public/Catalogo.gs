/** Entrega segura de fotos de cortes sin compartir la carpeta de Drive. */
function corteVisibleV2_(id){
  return leerPublico_('Cortes').find(c=>c.ID===String(id)&&
    esVerdad_(c.Activo)&&esVerdad_(c.Visible));
}
function obtenerFotosCortePublico(corteId){
  const corte=corteVisibleV2_(corteId);
  if(!corte)throw new Error('Corte no disponible.');
  const photos=[];
  if(corte.ImagenId)photos.push({id:'PORTADA',tipo:'PRINCIPAL'});
  leerPublico_('FotosCortes').filter(f=>f.CorteId===corteId&&esVerdad_(f.Publicado))
    .sort((a,b)=>Number(a.Orden)-Number(b.Orden)).slice(0,16).forEach(f=>{
      photos.push({id:f.ID,tipo:'ADICIONAL'});
    });
  return photos;
}
function obtenerImagenPublica(tipo,id,medioId){
  const corte=corteVisibleV2_(id);
  if(!corte)throw new Error('Corte no publicado.');
  let fileId='';
  if(tipo==='CORTE')fileId=String(corte.ImagenId||'');
  else if(tipo==='FOTO_CORTE'){
    const media=leerPublico_('FotosCortes').find(f=>f.ID===String(medioId)&&
      f.CorteId===String(id)&&esVerdad_(f.Publicado));
    if(!media)throw new Error('Foto no publicada.');
    fileId=String(media.DriveId||'');
  }else throw new Error('Tipo de imagen no permitido.');
  if(!fileId)throw new Error('La foto no está disponible.');
  const file=DriveApp.getFileById(fileId);
  if(file.getMimeType()!=='image/jpeg')throw new Error('Formato incompatible.');
  const bytes=file.getBlob().getBytes();
  if(bytes.length>1250000)throw new Error('Imagen demasiado grande.');
  return 'data:image/jpeg;base64,'+Utilities.base64Encode(bytes);
}

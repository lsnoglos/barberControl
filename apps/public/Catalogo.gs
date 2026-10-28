/**
 * Catálogo visual PÚBLICO. Nunca devuelve números de teléfono, archivos
 * privados ni el ID de Google Drive; solo medios publicados.
 */
function servicioVisibleCatalogo_(servicioId) {
  return leerPublico_('Servicios').find(function(s){
    return String(s.ID)===String(servicioId) &&
      esVerdad_(s.Activo) && esVerdad_(s.Visible);
  });
}
function estiloVisibleCatalogo_(id) {
  return leerPublico_('Estilos').find(function(s){
    return String(s.ID)===String(id) && esVerdad_(s.Activo) &&
      esVerdad_(s.Visible) && Boolean(servicioVisibleCatalogo_(s.ServicioId));
  });
}
function trabajoVisibleCatalogo_(id) {
  return leerPublico_('Galeria').find(function(s){
    return String(s.ID)===String(id) && esVerdad_(s.Publicado) &&
      esVerdad_(s.Consentimiento) && Boolean(servicioVisibleCatalogo_(s.ServicioId));
  });
}
function obtenerCatalogoVisualPublico() {
  const servicios=leerPublico_('Servicios').filter(function(s){
    return esVerdad_(s.Activo) && esVerdad_(s.Visible);
  });
  const servicioIds={};
  servicios.forEach(function(s){servicioIds[s.ID]=s;});
  const estilos=leerPublico_('Estilos').filter(function(e){
    return esVerdad_(e.Activo) && esVerdad_(e.Visible) && Boolean(servicioIds[e.ServicioId]);
  }).slice(0,60).map(function(e){
    return {
      id:e.ID,nombre:e.Nombre,servicioId:e.ServicioId,
      descripcion:e.Descripcion,origen:e.Origen,tecnica:e.Tecnica,
      tieneImagen:Boolean(e.ImagenId),
      reservable:esVerdad_(servicioIds[e.ServicioId].Reservable)
    };
  });
  const publicados=leerPublico_('Galeria').filter(function(g){
    return esVerdad_(g.Publicado) && esVerdad_(g.Consentimiento) &&
      Boolean(servicioIds[g.ServicioId]);
  }).slice(-48).reverse();
  const medios=leerPublico_('Medios');
  const trabajos=publicados.map(function(g){
    const asociados=medios.filter(function(m){
      return m.GaleriaId===g.ID && esVerdad_(m.Publicado);
    }).slice(0,12).map(function(m){
      return {
        id:m.ID,tipo:m.Tipo,descripcion:m.Descripcion,
        youtubeId:m.Tipo==='YOUTUBE'&&/^[A-Za-z0-9_-]{11}$/.test(m.YoutubeId)?
          m.YoutubeId:''
      };
    }).filter(function(m){
      return m.tipo==='FOTO'||(m.tipo==='YOUTUBE'&&m.youtubeId);
    });
    return {
      id:g.ID,titulo:g.Titulo,descripcion:g.Descripcion,
      servicioId:g.ServicioId,estiloId:g.EstiloId,
      destacado:esVerdad_(g.Destacado),medios:asociados,
      reservable:esVerdad_(servicioIds[g.ServicioId].Reservable)
    };
  }).filter(function(g){return g.medios.length>0;});
  return {estilos:estilos,trabajos:trabajos};
}
/**
 * Imágenes privadas en Drive, distribuidas en data URI únicamente cuando
 * el servicio, estilo o trabajo correspondiente es público.
 * No aceptar IDs de Drive proporcionados por visitantes.
 */
function obtenerImagenPublica(tipo,id,medioId) {
  const kind=String(tipo||'');
  const ref=String(id||'');
  let fileId='';
  if(kind==='ESTILO'){
    const e=estiloVisibleCatalogo_(ref);
    if(!e)throw new Error('Estilo no disponible.');
    fileId=e.ImagenId||'';
  }else if(kind==='SERVICIO'){
    const s=servicioVisibleCatalogo_(ref);
    if(!s)throw new Error('Servicio no disponible.');
    fileId=s.ImagenId||'';
  }else if(kind==='GALERIA'){
    if(!trabajoVisibleCatalogo_(ref))throw new Error('Publicación no disponible.');
    const media=leerPublico_('Medios').find(function(m){
      return m.ID===String(medioId) && m.GaleriaId===ref &&
        m.Tipo==='FOTO' && esVerdad_(m.Publicado);
    });
    if(!media)throw new Error('Fotografía no disponible.');
    fileId=media.DriveId||'';
  }else{
    throw new Error('Tipo de recurso no permitido.');
  }
  if(!fileId)throw new Error('Fotografía no encontrada.');
  const file=DriveApp.getFileById(fileId);
  if(file.getMimeType()!=='image/jpeg')throw new Error('El formato de la imagen no es compatible.');
  const bytes=file.getBlob().getBytes();
  if(bytes.length>1250000)throw new Error('Imagen demasiado grande.');
  return 'data:image/jpeg;base64,'+Utilities.base64Encode(bytes);
}

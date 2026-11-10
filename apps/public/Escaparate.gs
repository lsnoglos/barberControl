/**
 * Barber Public V2: catálogo único de cortes, sin galería ni "servicios".
 * Solo se devuelve información de estilos publicados y sus precios ofrecidos.
 */
function cortesPublicos_(){
  return leerPublico_('Cortes').filter(c=>esVerdad_(c.Activo)&&esVerdad_(c.Visible))
    .map(c=>{
      const pl=String(c.PrecioLocal||'').trim(),pd=String(c.PrecioDomicilio||'').trim();
      return {
        id:c.ID,nombre:c.Nombre,categoria:c.Categoria,descripcion:c.Descripcion,
        origen:c.Origen,tecnica:c.Tecnica,precioLocal:pl===''?null:Number(pl.replace(',','.')),
        precioDomicilio:pd===''?null:Number(pd.replace(',','.')),
        duracion:Number(c.DuracionMin),tieneImagen:Boolean(c.ImagenId),
        activo:true
      };
    }).filter(c=>Number.isInteger(c.duracion)&&c.duracion>=10&&
      (Number.isFinite(c.precioLocal)||Number.isFinite(c.precioDomicilio)));
}
function obtenerEscaparatePublico(){
  const config=configuracionPublica_();
  const categories=leerPublico_('Categorias').filter(c=>esVerdad_(c.Activa))
    .sort((a,b)=>Number(a.Orden)-Number(b.Orden)).map(c=>c.Nombre);
  const cortes=cortesPublicos_().slice(0,200);
  const fotos=leerPublico_('FotosCortes').filter(f=>esVerdad_(f.Publicado));
  const count={};fotos.forEach(f=>{count[f.CorteId]=(count[f.CorteId]||0)+1;});
  cortes.forEach(c=>c.fotosAdicionales=count[c.id]||0);
  const phone=String(config.TELEFONO_WHATSAPP||'').replace(/\D/g,'');
  return {
    nombre:config.NOMBRE_NEGOCIO||'BarberControl',
    eslogan:config.ESLOGAN_NEGOCIO||'Tu estilo comienza aquí',
    telefono:/^\d{8,15}$/.test(phone)?phone:'',
    tieneLogo:Boolean(config.LOGO_FILE_ID),
    categorias:categories,
    productos:cortes,
    moneda:config.MONEDA||'NIO'
  };
}
function obtenerLogoPublico(){
  const config=configuracionPublica_();
  const id=String(config.LOGO_FILE_ID||'');
  if(!id)return '';
  const file=DriveApp.getFileById(id);
  if(file.getMimeType()!=='image/png')throw new Error('Logo inválido.');
  const bytes=file.getBlob().getBytes();
  if(bytes.length>950000)throw new Error('Logo demasiado grande.');
  return 'data:image/png;base64,'+Utilities.base64Encode(bytes);
}
function obtenerVersionEscaparate(){
  bcAutovincularPublico_();
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,id,Utilities.Charset.UTF_8)
    .map(b=>('0'+(b&255).toString(16)).slice(-2)).join('').slice(0,16);
  const conf=configuracionPublica_();
  return {identidad:hash,version:String(conf.PUBLIC_CATALOG_VERSION||'0')};
}

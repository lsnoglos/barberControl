/**
 * Escaparate móvil para clientes, solo lectura.
 * Ofrece estilos publicados, servicios sin estilo, categorías y marca.
 * No devuelve IDs de Drive ni información de otros clientes.
 */
function obtenerEscaparatePublico() {
  const config=configuracionPublica_();
  const servicios=leerPublico_('Servicios').filter(function(s){
    return esVerdad_(s.Activo)&&esVerdad_(s.Visible);
  });
  const byId={};
  servicios.forEach(function(s){byId[s.ID]=s;});
  const styles=leerPublico_('Estilos').filter(function(e){
    return esVerdad_(e.Activo)&&esVerdad_(e.Visible)&&Boolean(byId[e.ServicioId]);
  });
  const used={};
  const items=styles.map(function(e){
    const s=byId[e.ServicioId];used[e.ServicioId]=true;
    return {
      id:e.ID,estiloId:e.ID,servicioId:s.ID,
      nombre:e.Nombre,categoria:s.Categoria,descripcion:e.Descripcion,
      origen:e.Origen,tecnica:e.Tecnica,
      precio:Number(s.Precio),duracion:Number(s.DuracionMin),
      reservable:esVerdad_(s.Reservable),tipoImagen:'ESTILO',tieneImagen:Boolean(e.ImagenId),
      tipo:'ESTILO',servicioNombre:s.Nombre
    };
  });
  servicios.filter(function(s){return !used[s.ID];}).forEach(function(s){
    items.push({
      id:s.ID,estiloId:'',servicioId:s.ID,
      nombre:s.Nombre,categoria:s.Categoria,descripcion:s.Descripcion,
      origen:'',tecnica:'',
      precio:Number(s.Precio),duracion:Number(s.DuracionMin),
      reservable:esVerdad_(s.Reservable),tipoImagen:'SERVICIO',tieneImagen:Boolean(s.ImagenId),
      tipo:'SERVICIO',servicioNombre:s.Nombre
    });
  });
  const categorias=leerPublico_('Categorias')
    .filter(function(c){return esVerdad_(c.Activa);})
    .sort(function(a,b){return Number(a.Orden)-Number(b.Orden);})
    .map(function(c){return c.Nombre;});
  const numero=String(config.TELEFONO_WHATSAPP||'').replace(/\D/g,'');
  return {
    nombre:config.NOMBRE_NEGOCIO||'BarberControl',
    eslogan:config.ESLOGAN_NEGOCIO||'Tu estilo comienza aquí',
    telefono:numero.length>=8&&numero.length<=15?numero:'',
    tieneLogo:Boolean(config.LOGO_FILE_ID),
    categorias:categorias,
    productos:items.slice(0,100),
    moneda:config.MONEDA||'NIO'
  };
}
/** Logo del negocio, nunca el ID de archivo: solo bytes PNG controlados. */
function obtenerLogoPublico() {
  const config=configuracionPublica_();
  const id=String(config.LOGO_FILE_ID||'');
  if(!id)return '';
  const file=DriveApp.getFileById(id);
  if(file.getMimeType()!=='image/png')throw new Error('Logo inválido.');
  const bytes=file.getBlob().getBytes();
  if(bytes.length>950000)throw new Error('Logo demasiado grande.');
  return 'data:image/png;base64,'+Utilities.base64Encode(bytes);
}

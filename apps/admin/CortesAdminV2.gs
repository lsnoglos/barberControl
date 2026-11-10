/**
 * BARBER ADMIN V2: registro único de cortes (sin tabla de Servicios en UI).
 * Hojas Cortes y FotosCortes; las anteriores se conservan como histórico.
 */
function bcV2Bool_(v){return v===true||String(v).toLowerCase()==='true';}
function bcV2Texto_(v,max){
  const t=String(v==null?'':v).trim().slice(0,max);
  return /^[=+\-@]/.test(t)?"'"+t:t;
}
function bcV2Precio_(valor){
  if(valor===null||valor===undefined||String(valor).trim()==='')return '';
  const n=Number(valor);
  if(!Number.isFinite(n)||n<0||n>1000000)throw new Error('Indica un precio válido de 0 a 1,000,000 córdobas.');
  return Math.round(n*100)/100;
}
function bcV2Filas_(nombre){return leerFilasAdmin_(nombre);}
function bcV2Buscar_(nombre,id){
  const hoja=obtenerDbAdmin_().getSheetByName(nombre);
  if(!hoja)throw new Error('Falta '+nombre+'. Ejecuta el instalador actualizado.');
  const values=hoja.getDataRange().getValues();
  const index=values.findIndex((r,i)=>i>0&&String(r[0])===String(id));
  if(index<0)throw new Error('Registro no encontrado: '+id);
  return {hoja:hoja,index:index+1,row:values[index]};
}
function obtenerCortesAdmin(){
  return {cortes:bcV2Filas_('Cortes'),fotos:bcV2Filas_('FotosCortes'),
    categorias:bcV2Filas_('Categorias').filter(c=>bcV2Bool_(c.Activa))};
}
function guardarCorteAdminV2(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Información del corte inválida.');
  const nombre=bcV2Texto_(data.nombre,100),categoria=bcV2Texto_(data.categoria,60);
  const duracion=Number(data.duracion);
  const local=bcV2Precio_(data.precioLocal),domicilio=bcV2Precio_(data.precioDomicilio);
  if(nombre.length<2)throw new Error('Escribe el nombre del corte o estilo.');
  if(!bcV2Filas_('Categorias').some(c=>c.Nombre===categoria&&bcV2Bool_(c.Activa)))
    throw new Error('Selecciona una categoría activa.');
  if(!Number.isInteger(duracion)||duracion<10||duracion>480)
    throw new Error('La duración debe estar entre 10 y 480 minutos.');
  if(local===''&&domicilio==='')throw new Error('Indica al menos un precio: local o domicilio.');
  const id=String(data.id||'').trim()||'CRT-'+Utilities.getUuid().slice(0,12).toUpperCase();
  const sheet=obtenerDbAdmin_().getSheetByName('Cortes');
  const all=sheet.getDataRange().getValues();
  const index=all.findIndex((r,i)=>i>0&&String(r[0])===id);
  if(data.id&&index<0)throw new Error('No encontramos el corte que intentas editar.');
  const previous=index>=0?all[index]:null;
  const row=[
    id,nombre,categoria,bcV2Texto_(data.descripcion,900),
    bcV2Texto_(data.origen,1000),bcV2Texto_(data.tecnica,1000),
    local,domicilio,duracion,previous?previous[9]:'',
    data.activo===undefined?(previous?bcV2Bool_(previous[10]):true):data.activo===true,
    data.visible===undefined?(previous?bcV2Bool_(previous[11]):true):data.visible===true,
    previous?Number(previous[12])||0:all.length,
    previous?previous[13]:'',previous?previous[14]:''
  ];
  if(index>=0)sheet.getRange(index+1,1,1,row.length).setValues([row]);
  else sheet.appendRow(row);
  auditarAdmin_(index>=0?'EDITAR':'CREAR','Corte',id,nombre);
  actualizarVersionEscaparate_();
  return {id:id};
}
function subirFotoCorteAdminV2(data){
  if(!data||typeof data!=='object')throw new Error('Fotografía inválida.');
  const corteId=String(data.corteId||''),principal=data.principal===true;
  const corte=bcV2Buscar_('Cortes',corteId);
  if(data.autorizacion!==true)throw new Error('Confirma que tienes autorización para publicar la fotografía.');
  const bytes=prepararImagenCatalogo_(data.imagen);
  const nombre='corte_'+corteId.replace(/[^A-Za-z0-9_-]/g,'')+'_'+Utilities.getUuid().slice(0,8)+'.jpg';
  const file=carpetaImagenesCatalogo_('ESTILO').createFile(Utilities.newBlob(bytes,'image/jpeg',nombre));
  try{
    if(principal)corte.hoja.getRange(corte.index,10).setValue(file.getId());
    else{
      const fotos=obtenerDbAdmin_().getSheetByName('FotosCortes');
      fotos.appendRow(['FOT-'+Utilities.getUuid().slice(0,12).toUpperCase(),corteId,
        file.getId(),bcV2Texto_(data.descripcion,300),fotos.getLastRow(),true]);
    }
    SpreadsheetApp.flush();
  }catch(e){try{file.setTrashed(true);}catch(_e){}throw e;}
  auditarAdmin_('FOTO','Corte',corteId,principal?'Principal':'Adicional');
  actualizarVersionEscaparate_();
  return {ok:true};
}
function cambiarFotoCorteV2(id,publicada){
  const foto=bcV2Buscar_('FotosCortes',id);
  foto.hoja.getRange(foto.index,6).setValue(publicada===true);
  auditarAdmin_('FOTO','Corte',foto.row[1],publicada?'Visible':'Oculta');
  actualizarVersionEscaparate_();
  return {ok:true};
}
function obtenerFotoAdminV2(tipo,id,fotoId){
  let fileId='';
  if(tipo==='PRINCIPAL')fileId=String(bcV2Buscar_('Cortes',id).row[9]||'');
  else if(tipo==='ADICIONAL'){
    const foto=bcV2Buscar_('FotosCortes',fotoId);
    if(String(foto.row[1])!==String(id))throw new Error('La foto no corresponde al corte.');
    fileId=String(foto.row[2]||'');
  }
  if(!fileId)throw new Error('Imagen no disponible.');
  const file=DriveApp.getFileById(fileId);
  if(file.getMimeType()!=='image/jpeg')throw new Error('Formato de imagen inválido.');
  const bytes=file.getBlob().getBytes();
  if(bytes.length>1250000)throw new Error('Fotografía demasiado grande.');
  return 'data:image/jpeg;base64,'+Utilities.base64Encode(bytes);
}
/** Vista privada de la agenda: agrupa exclusivamente citas registradas. */
function obtenerCalendarioAdminV2(year,month){
  const y=Number(year),m=Number(month);
  if(!Number.isInteger(y)||y<2020||y>2100||!Number.isInteger(m)||m<1||m>12)
    throw new Error('Mes inválido.');
  const prefix=String(y)+'-'+String(m).padStart(2,'0')+'-';
  const counts={};
  bcV2Filas_('Reservas').forEach(r=>{
    if(String(r.Fecha).startsWith(prefix)&&!['CANCELADA','RECHAZADA'].includes(String(r.Estado).toUpperCase()))
      counts[r.Fecha]=(counts[r.Fecha]||0)+1;
  });
  return counts;
}
function obtenerReservasDiaAdminV2(fecha){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha)))throw new Error('Fecha inválida.');
  const cortes={};bcV2Filas_('Cortes').forEach(c=>cortes[c.ID]=c);
  const estilos={};bcV2Filas_('Estilos').forEach(e=>estilos[e.ID]=e.Nombre);
  const servicios={};bcV2Filas_('Servicios').forEach(s=>servicios[s.ID]=s.Nombre);
  return bcV2Filas_('Reservas').filter(r=>r.Fecha===fecha)
    .sort((a,b)=>a.Inicio.localeCompare(b.Inicio)).map(r=>{
      const corte=cortes[r.CorteId];
      return {
        id:r.ID,fecha:r.Fecha,inicio:r.Inicio,fin:r.Fin,
        cliente:r.Cliente,telefono:r.Telefono,comentario:r.Comentario,estado:r.Estado,
        nombre:corte?corte.Nombre:(estilos[r.EstiloId]||servicios[r.ServicioId]||'Servicio anterior'),
        modalidad:r.Modalidad||'SIN_ESPECIFICAR',
        direccion:r.Direccion||'',precio:r.Precio||'',duracion:r.DuracionMin||''
      };
    });
}

/**
 * Registro de reservas: bloqueo por proyecto, revalidacion y
 * compensacion si falla la escritura Sheets tras crear Calendar.
 *
 * IMPORTANTE: operaciones de agenda desde OTROS proyectos no comparten
 * LockService. No habilitar escrituras administrativas simultaneas
 * sin un coordinador unico. Ver docs/ARQUITECTURA.md.
 */
function textoSeguroHoja_(value) {
  const text=String(value||'');
  return /^[=+@\-]/.test(text) ? "'"+text : text;
}

function reservarCita(solicitud) {
  if(!solicitud||typeof solicitud!=='object')throw new Error('Solicitud invalida.');
  const nombre=String(solicitud.nombre||'').trim();
  const telefono=String(solicitud.telefono||'').replace(/[^+0-9]/g,'').slice(0,20);
  const comentario=String(solicitud.comentario||'').trim().slice(0,500);
  const fecha=String(solicitud.fecha||'');
  const inicio=String(solicitud.inicio||'');
  const servicioId=String(solicitud.servicioId||'');
  const clave=String(solicitud.idempotencia||'');
  if(nombre.length<3||nombre.length>90)throw new Error('Introduce un nombre valido.');
  if(!/^\+?[0-9]{8,15}$/.test(telefono))throw new Error('Introduce un telefono de 8 a 15 digitos.');
  if(!/^[0-9a-fA-F-]{20,80}$/.test(clave))throw new Error('Identificador de solicitud invalido.');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(inicio))throw new Error('Hora solicitada invalida.');
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try{
    const registros=leerPublico_('Reservas');
    if(registros.some(function(r){return r.Idempotencia===clave;}))
      throw new Error('Esta solicitud ya se registro. Comprueba tu confirmacion antes de reenviarla.');
    const confirmadas=registros.filter(function(r){
      return r.Fecha===fecha&&r.Telefono===telefono&&['CONFIRMADA','PENDIENTE'].includes(r.Estado);
    });
    if(confirmadas.length>=2)throw new Error('Este telefono ya tiene el maximo de reservas para ese dia.');
    // Reconsultar dentro del bloqueo: el horario pudo ocuparse mientras
    // se completaba el formulario.
    const calculo=calcularIntervalos_(fecha,servicioId);
    const slot=calculo.horarios.find(function(h){return h.inicio===inicio;});
    if(!slot)throw new Error('Ese horario dejo de estar disponible. Selecciona otro.');
    const id='BC-'+Utilities.getUuid().slice(0,8).toUpperCase();
    const token=Utilities.getUuid()+'-'+Utilities.getUuid();
    const hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token,Utilities.Charset.UTF_8)
      .map(function(b){return ('0'+(b&255).toString(16)).slice(-2);}).join('');
    const calendar=calendarioPublico_();
    const ev=calendar.createEvent('BarberControl: '+calculo.servicio.nombre,
      fechaLocal_(fecha,inicio),fechaLocal_(fecha,slot.fin),{
      description:'Reserva: '+id+'\nCliente: '+nombre+'\nTelefono: '+telefono+'\nComentario: '+comentario
    });
    try{
      dbPublica_().getSheetByName('Reservas').appendRow([
        id,new Date(),fecha,inicio,slot.fin,textoSeguroHoja_(nombre),telefono,servicioId,'','',
        textoSeguroHoja_(comentario),'CONFIRMADA',ev.getId(),clave,calculo.servicio.precio,
        calculo.servicio.duracion,hash
      ]);
      SpreadsheetApp.flush();
    }catch(err){
      try{ev.deleteEvent();}catch(rollbackErr){console.error('REVISAR CALENDARIO '+id+': '+rollbackErr);}
      throw new Error('No fue posible completar la reserva. Intentalo nuevamente.');
    }
    return {
      codigo:id,fecha:fecha,inicio:inicio,fin:slot.fin,
      servicio:calculo.servicio.nombre,precio:calculo.servicio.precio,
      token:token
    };
  }finally{lock.releaseLock();}
}

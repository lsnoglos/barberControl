/**
 * Confirma una reserva de un corte, revalidando duración, horario y precio
 * bajo el mismo bloqueo usado por el puente administrativo.
 */
function textoSeguroHoja_(value){
  const text=String(value==null?'':value);
  return /^[=+@\-]/.test(text)?"'"+text:text;
}
/**
 * Avisos emergentes en el Calendar del propietario.
 * Se configuran en Configuracion: AVISOS_LOCAL, AVISOS_DOMICILIO.
 * Máximo 5 avisos, entre 5 minutos y 4 semanas antes del inicio.
 * No configura notificaciones del teléfono: el barbero debe activarlas.
 */
function configurarAvisosCalendar_(event, modalidad, config) {
  const key=modalidad==='DOMICILIO'?'AVISOS_DOMICILIO':'AVISOS_LOCAL';
  const defaultValue=modalidad==='DOMICILIO'?'60,30,15':'30,15';
  const raw=String(config[key]===undefined?defaultValue:config[key]).trim();
  if(raw==='0'||raw==='')return;
  const reminders=[...new Set(raw.split(',').map(x=>Number(x.trim())))]
    .filter(n=>Number.isInteger(n)&&n>=5&&n<=40320).slice(0,5);
  const remaining=Math.floor((event.getStartTime().getTime()-Date.now())/60000);
  reminders.filter(n=>n<remaining).forEach(n=>event.addPopupReminder(n));
}

function reservarCita(solicitud){
  // Aceptar UN OBJETO, nunca un arreglo. El error anterior ocurría
  // porque el navegador enviaba [objeto] como único argumento.
  if(!solicitud||typeof solicitud!=='object'||Array.isArray(solicitud))
    throw new Error('Los datos de la reserva llegaron con un formato incorrecto. Actualiza la página.');
  const nombre=String(solicitud.nombre||'').replace(/\s+/g,' ').trim();
  const digits=String(solicitud.telefono||'').replace(/\D/g,'');
  const telefono=digits.length===8?'505'+digits:digits;
  const comentario=String(solicitud.comentario||'').trim().slice(0,500);
  const direccion=String(solicitud.direccion||'').trim().slice(0,350);
  const corteId=String(solicitud.corteId||'').trim();
  const modalidad=String(solicitud.modalidad||'').trim().toUpperCase();
  const fecha=String(solicitud.fecha||''),inicio=String(solicitud.inicio||'');
  const clave=String(solicitud.idempotencia||'');
  if(nombre.length<2||nombre.length>90)
    throw new Error('Escribe tu nombre (mínimo 2 caracteres).');
  if(!/^\d{8,15}$/.test(telefono))throw new Error('Introduce un WhatsApp válido de 8 a 15 dígitos.');
  if(modalidad==='DOMICILIO'&&direccion.length<8)
    throw new Error('Indica la dirección para atenderte a domicilio.');
  if(!/^[0-9a-fA-F-]{20,80}$/.test(clave))throw new Error('Identificador de solicitud inválido.');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(inicio))throw new Error('Hora inválida.');
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try{
    const reservas=leerPublico_('Reservas');
    const previous=reservas.find(r=>r.Idempotencia===clave);
    if(previous){
      // Reintento seguro cuando la respuesta original no llegó.
      if(previous.Telefono!==telefono)
        throw new Error('Ese identificador corresponde a otra reserva.');
      const previousCut=cortesPublicos_().find(c=>c.id===previous.CorteId);
      return {codigo:previous.ID,fecha:previous.Fecha,inicio:previous.Inicio,
        fin:previous.Fin,nombre:previousCut?previousCut.nombre:'Corte registrado',
        modalidad:previous.Modalidad||modalidad,precio:Number(previous.Precio),
        yaExistia:true};
    }
    const count=reservas.filter(r=>r.Fecha===fecha&&r.Telefono===telefono&&
      ['CONFIRMADA','PENDIENTE'].includes(r.Estado)).length;
    if(count>=2)throw new Error('Este teléfono ya tiene dos reservas para ese día.');
    const selection=calcularIntervalos_(fecha,corteId,modalidad);
    const slot=selection.horarios.find(s=>s.inicio===inicio);
    if(!slot)throw new Error('Ese horario ya no está libre. Elige otra hora.');
    const corte=selection.corte;
    const id='BC-'+Utilities.getUuid().slice(0,8).toUpperCase();
    const token=Utilities.getUuid()+'-'+Utilities.getUuid();
    const hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token,Utilities.Charset.UTF_8)
      .map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
    const config=configuracionPublica_();
    const event=calendarioPublico_().createEvent(
      '✂ '+nombre+' · '+corte.nombre+' | '+(modalidad==='LOCAL'?'En local':'A domicilio'),
      fechaLocal_(fecha,inicio),fechaLocal_(fecha,slot.fin),{
        description:'Reserva: '+id+'\nCorte: '+corte.nombre+'\nModalidad: '+modalidad+
          '\nCliente: '+nombre+'\nWhatsApp: '+telefono+
          (direccion?'\nDirección: '+direccion:'')+'\nComentarios: '+comentario,
        location:modalidad==='DOMICILIO'?direccion:'Barbería (en local)'
      });
    // Una alerta no debe impedir la confirmación ni dejar un evento huérfano.
    try{
      configurarAvisosCalendar_(event,modalidad,config);
    }catch(reminderError){
      console.error('AVISOS CALENDAR '+id+': '+(reminderError.message||reminderError));
    }
    try{
      const sheet=dbPublica_().getSheetByName('Reservas');
      const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
      const row=Array(headers.length).fill('');
      const values={
        ID:id,CreadaEn:new Date(),Fecha:fecha,Inicio:inicio,Fin:slot.fin,
        Cliente:textoSeguroHoja_(nombre),Telefono:telefono,
        ServicioId:'',EstiloId:'',GaleriaId:'',
        Comentario:textoSeguroHoja_(comentario),Estado:'CONFIRMADA',
        CalendarEventId:event.getId(),Idempotencia:clave,
        Precio:corte.precio,DuracionMin:corte.duracion,TokenHash:hash,
        CorteId:corteId,Modalidad:modalidad,Direccion:textoSeguroHoja_(direccion)
      };
      Object.keys(values).forEach(key=>{
        const ix=headers.indexOf(key);
        if(ix<0)throw new Error('Falta columna de reservas: '+key+'. Actualiza el instalador.');
        row[ix]=values[key];
      });
      sheet.appendRow(row);
      SpreadsheetApp.flush();
    }catch(err){
      try{event.deleteEvent();}catch(rollbackErr){console.error('REVISAR CALENDAR '+id+': '+rollbackErr);}
      throw new Error('No se pudo completar el registro: '+String(err.message||err));
    }
    return {codigo:id,fecha:fecha,inicio:inicio,fin:slot.fin,
      nombre:corte.nombre,modalidad:modalidad,precio:corte.precio,token:token};
  }finally{lock.releaseLock();}
}

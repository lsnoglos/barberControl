/** Disponibilidad calculada por CORTE y modalidad (LOCAL o DOMICILIO). */
function corteReservable_(id,modalidad){
  const c=cortesPublicos_().find(c=>c.id===String(id));
  if(!c)throw new Error('Este corte ya no está disponible.');
  if(!['LOCAL','DOMICILIO'].includes(modalidad))
    throw new Error('Selecciona si te atenderemos en el local o a domicilio.');
  const price=modalidad==='LOCAL'?c.precioLocal:c.precioDomicilio;
  if(!Number.isFinite(price))throw new Error('Este corte no se ofrece en la modalidad elegida.');
  return {id:c.id,nombre:c.nombre,precio:price,duracion:c.duracion,modalidad:modalidad};
}
function calcularIntervalos_(fecha,corteId,modalidad){
  const conf=configuracionPublica_();
  const dt=validarFecha_(fecha,conf);
  const corte=corteReservable_(corteId,modalidad);
  const horario=leerPublico_('Horarios').find(h=>Number(h.DiaSemana)===dt.getDay());
  if(!horario||!esVerdad_(horario.Abierto))return {corte:corte,fecha:fecha,horarios:[]};
  const abierto=minutos_(horario.Inicio),cerrado=minutos_(horario.Fin);
  const blocked=[];
  leerPublico_('Bloqueos').forEach(b=>{
    if(!esVerdad_(b.Activo))return;
    const tipo=String(b.Tipo).toUpperCase();
    const applies=tipo==='DIARIO'||(tipo==='SEMANAL'&&Number(b.DiaSemana)===dt.getDay())||
      (tipo==='UNICO'&&b.FechaInicio===fecha)||
      (tipo==='RANGO'&&b.FechaInicio<=fecha&&b.FechaFin>=fecha);
    if(applies)blocked.push({inicio:b.Inicio?minutos_(b.Inicio):0,fin:b.Fin?minutos_(b.Fin):1440});
  });
  leerPublico_('Reservas').forEach(r=>{
    if(r.Fecha!==fecha||['CANCELADA','RECHAZADA'].includes(String(r.Estado).toUpperCase()))return;
    if(r.Inicio&&r.Fin)blocked.push({inicio:minutos_(r.Inicio),fin:minutos_(r.Fin)});
  });
  const dayStart=fechaLocal_(fecha,'00:00');
  const dayEnd=new Date(dayStart.getTime()+86400000);
  calendarioPublico_().getEvents(dayStart,dayEnd).forEach(ev=>{
    const ini=Math.max(0,Math.floor((ev.getStartTime().getTime()-dayStart.getTime())/60000));
    const fin=Math.min(1440,Math.ceil((ev.getEndTime().getTime()-dayStart.getTime())/60000));
    if(fin>ini)blocked.push({inicio:ini,fin:fin});
  });
  const step=Number(conf.INTERVALO_MIN||15),buffer=Number(conf.BUFFER_MIN||0);
  const minAdvance=Number(conf.ANTICIPACION_MIN||60);
  if(!Number.isInteger(step)||step<5||step>60)throw new Error('Intervalo de agenda inválido.');
  const bookedTime=corte.duracion+Math.max(0,buffer);
  const now=Date.now()+minAdvance*60000;
  const slots=[];
  for(let minute=Math.ceil(abierto/step)*step;minute+bookedTime<=cerrado;minute+=step){
    if(fechaLocal_(fecha,reloj_(minute)).getTime()<now)continue;
    if(!blocked.some(b=>minute<b.fin&&minute+bookedTime>b.inicio)){
      slots.push({inicio:reloj_(minute),fin:reloj_(minute+corte.duracion)});
    }
  }
  return {corte:corte,fecha:fecha,horarios:slots};
}
function obtenerDisponibilidad(fecha,corteId,modalidad){
  return calcularIntervalos_(String(fecha),String(corteId),String(modalidad));
}

/** Motor de disponibilidad publico: nunca devuelve nombres de otros clientes. */
function calcularIntervalos_(fecha,servicioId) {
  const conf=configuracionPublica_();
  const dt=validarFecha_(fecha,conf);
  const servicio=serviciosPublicos_().find(function(s){return s.id===String(servicioId);});
  if(!servicio)throw new Error('El servicio no esta disponible para reservar.');
  const horario=leerPublico_('Horarios').find(function(h){return Number(h.DiaSemana)===dt.getDay();});
  if(!horario||!esVerdad_(horario.Abierto))return {servicio:servicio,fecha:fecha,horarios:[]};
  const abierto=minutos_(horario.Inicio);
  const cerrado=minutos_(horario.Fin);
  const bloques=[];
  leerPublico_('Bloqueos').forEach(function(b){
    if(!esVerdad_(b.Activo))return;
    const tipo=String(b.Tipo).toUpperCase();
    const igual=tipo==='DIARIO'
      || (tipo==='SEMANAL' && Number(b.DiaSemana)===dt.getDay())
      || (tipo==='UNICO' && b.FechaInicio===fecha)
      || (tipo==='RANGO' && fecha>=b.FechaInicio && fecha<=b.FechaFin);
    if(!igual)return;
    const ini=b.Inicio ? minutos_(b.Inicio) : 0;
    const fin=b.Fin ? minutos_(b.Fin) : 1440;
    bloques.push({inicio:ini,fin:fin});
  });
  leerPublico_('Reservas').forEach(function(r){
    if(r.Fecha!==fecha||['CANCELADA','RECHAZADA'].includes(String(r.Estado).toUpperCase()))return;
    if(!r.Inicio||!r.Fin)return;
    bloques.push({inicio:minutos_(r.Inicio),fin:minutos_(r.Fin)});
  });
  // Incluir eventos agregados directamente al calendario por el propietario.
  const inicioDia=fechaLocal_(fecha,'00:00');
  const finDia=new Date(inicioDia.getTime()+86400000);
  calendarioPublico_().getEvents(inicioDia,finDia).forEach(function(event){
    const ini=Math.max(0,Math.floor((event.getStartTime().getTime()-inicioDia.getTime())/60000));
    const fin=Math.min(1440,Math.ceil((event.getEndTime().getTime()-inicioDia.getTime())/60000));
    if(fin>ini)bloques.push({inicio:ini,fin:fin});
  });
  const paso=Number(conf.INTERVALO_MIN||15);
  const buffer=Number(conf.BUFFER_MIN||0);
  const antelacion=Number(conf.ANTICIPACION_MIN||60);
  if(!Number.isInteger(paso)||paso<5||paso>60)throw new Error('Intervalo no valido.');
  const now=Date.now()+antelacion*60000;
  const horarios=[];
  const duracion=servicio.duracion+buffer;
  for(let m=Math.ceil(abierto/paso)*paso;m+duracion<=cerrado;m+=paso){
    if(fechaLocal_(fecha,reloj_(m)).getTime()<now)continue;
    const ocupado=bloques.some(function(b){return m<b.fin && m+duracion>b.inicio;});
    if(!ocupado)horarios.push({inicio:reloj_(m),fin:reloj_(m+servicio.duracion)});
  }
  return {servicio:servicio,fecha:fecha,horarios:horarios};
}

function obtenerDisponibilidad(fecha,servicioId){
  return calcularIntervalos_(fecha,servicioId);
}

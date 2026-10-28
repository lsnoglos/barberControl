/**
 * Puente de agenda con HMAC. Los bloqueos y las reservas comparten
 * LockService dentro del mismo proyecto publico.
 * BRIDGE_SECRET se configura en Script Properties, JAMAS en codigo.
 */
function firmaValida_(payload,secret) {
  const message=payload.ts+'.'+payload.nonce+'.'+JSON.stringify(payload.body);
  const expected=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(
    message,secret,Utilities.Charset.UTF_8
  ));
  const received=String(payload.signature||'');
  if(expected.length!==received.length)return false;
  let difference=0;
  for(let i=0;i<expected.length;i++) difference|=expected.charCodeAt(i)^received.charCodeAt(i);
  return difference===0;
}

function procesarPeticionAdmin_(payload) {
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const secret=PropertiesService.getScriptProperties().getProperty('BRIDGE_SECRET');
    if(!secret)throw new Error('Puente administrativo no configurado.');
    if(!payload || !Number.isSafeInteger(payload.ts) || Math.abs(Date.now()-payload.ts)>120000)
      throw new Error('Peticion vencida.');
    if(typeof payload.nonce!=='string' || !/^[a-f0-9-]{36}$/.test(payload.nonce))
      throw new Error('Identificador de peticion invalido.');
    if(!payload.body || !firmaValida_(payload,secret))throw new Error('Firma invalida.');
    const cache=CacheService.getScriptCache();
    const key='BRIDGE_'+payload.nonce;
    if(cache.get(key))throw new Error('Peticion ya procesada.');
    const action=payload.body.action, data=payload.body.data||{};
    let result;
    if(action==='crearBloqueo')result=crearBloqueoInterno_(data,payload.nonce);
    else if(action==='desactivarBloqueo')result=desactivarBloqueoInterno_(data.id);
    else throw new Error('Operacion no permitida.');
    cache.put(key,'1',180);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function crearBloqueoInterno_(data,nonce) {
  const tipo=String(data.tipo||'').toUpperCase();
  if(!['SEMANAL','DIARIO','UNICO','RANGO'].includes(tipo))throw new Error('Tipo invalido.');
  const dia=Number(data.diaSemana);
  if(tipo==='SEMANAL'&&(!Number.isInteger(dia)||dia<0||dia>6))throw new Error('Dia invalido.');
  const fechaInicio=String(data.fechaInicio||''),fechaFin=String(data.fechaFin||'');
  const validoFecha=f=>/^\d{4}-\d{2}-\d{2}$/.test(f);
  if(['UNICO','RANGO'].includes(tipo)&&!validoFecha(fechaInicio))throw new Error('Fecha requerida.');
  if(tipo==='RANGO'&&(!validoFecha(fechaFin)||fechaFin<fechaInicio))throw new Error('Rango de fechas invalido.');
  const inicio=String(data.inicio||''),fin=String(data.fin||'');
  if(minutos_(inicio)>=minutos_(fin))throw new Error('La hora final debe ser mayor.');
  const id='BLQ-'+String(nonce).replace(/-/g,'').slice(0,20).toUpperCase();
  const sheet=dbPublica_().getSheetByName('Bloqueos');
  const rows=sheet.getDataRange().getValues();
  if(rows.some(function(r){return String(r[0])===id;}))return {id:id};
  sheet.appendRow([id,tipo,tipo==='SEMANAL'?dia:'',
    ['UNICO','RANGO'].includes(tipo)?fechaInicio:'',
    tipo==='RANGO'?fechaFin:'',inicio,fin,
    String(data.motivo||'Ocupado').trim().slice(0,100),true]);
  SpreadsheetApp.flush();
  return {id:id};
}

function desactivarBloqueoInterno_(id) {
  const sheet=dbPublica_().getSheetByName('Bloqueos');
  const rows=sheet.getDataRange().getValues();
  const i=rows.findIndex(function(r,j){return j>0&&String(r[0])===String(id);});
  if(i<0)throw new Error('Bloqueo no encontrado.');
  sheet.getRange(i+1,9).setValue(false);
  SpreadsheetApp.flush();
  return {id:id,activo:false};
}

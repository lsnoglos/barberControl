/**
 * Operaciones del propietario. Este codigo SOLO debe desplegarse en
 * el proyecto Admin con acceso MYSELF.
 */
function obtenerPanelAdmin() {
  const estado=obtenerEstadoInstalacion_();
  if (!estado.instalado) return {estado:estado,configuracion:[],horarios:[],servicios:[],bloqueos:[],reservas:[]};
  return {
    estado:estado,
    configuracion:leerFilasAdmin_('Configuracion'),
    horarios:leerFilasAdmin_('Horarios'),
    servicios:leerFilasAdmin_('Servicios'),
    bloqueos:leerFilasAdmin_('Bloqueos'),
    reservas:leerFilasAdmin_('Reservas').slice(-60).reverse()
  };
}

function guardarServicioAdmin(data) {
  if (!data || typeof data!=='object') throw new Error('Datos de servicio invalidos.');
  const nombre=String(data.nombre||'').trim().slice(0,100);
  const categoria=String(data.categoria||'Cabello').trim().slice(0,60);
  const descripcion=String(data.descripcion||'').trim().slice(0,800);
  const duracion=Number(data.duracion);
  const precio=Number(data.precio);
  if (nombre.length<3) throw new Error('El nombre debe tener al menos 3 caracteres.');
  if (!Number.isInteger(duracion)||duracion<10||duracion>360) throw new Error('Duracion entre 10 y 360 minutos.');
  if (!Number.isFinite(precio)||precio<0||precio>1000000) throw new Error('Precio invalido.');
  const id=String(data.id||'').trim()||'SER-'+Utilities.getUuid().slice(0,8).toUpperCase();
  const sheet=obtenerDbAdmin_().getSheetByName('Servicios');
  const rows=sheet.getDataRange().getValues();
  let index=-1;
  for(let i=1;i<rows.length;i++) if(String(rows[i][0])===id){index=i+1;break;}
  if (data.id && index===-1) throw new Error('No existe el servicio que intentas editar.');
  const row=[id,nombre,categoria,descripcion,duracion,precio,'NIO',String(data.imagenId||'').trim(),
    data.activo!==false,data.visible!==false,data.reservable!==false,Number(data.orden)||0];
  if(index>0) sheet.getRange(index,1,1,row.length).setValues([row]); else sheet.appendRow(row);
  auditarAdmin_(index>0?'MODIFICAR':'CREAR','Servicio',id,nombre);
  return obtenerPanelAdmin();
}

function cambiarEstadoServicioAdmin(id,propiedad,valor) {
  const columnas={activo:9,visible:10,reservable:11};
  if(!Object.prototype.hasOwnProperty.call(columnas,propiedad)) throw new Error('Campo no permitido.');
  const sheet=obtenerDbAdmin_().getSheetByName('Servicios');
  const data=sheet.getDataRange().getValues();
  const index=data.findIndex(function(row,i){return i>0&&String(row[0])===String(id);});
  if(index<0)throw new Error('Servicio no encontrado.');
  sheet.getRange(index+1,columnas[propiedad]).setValue(valor===true);
  auditarAdmin_('ESTADO','Servicio',id,propiedad+'='+Boolean(valor));
  return obtenerPanelAdmin();
}

function guardarConfiguracionAdmin(nombre,valor) {
  const allowed={NOMBRE_NEGOCIO:80,INTERVALO_MIN:3,ANTICIPACION_MIN:5,DIAS_ADELANTO:3,BUFFER_MIN:3};
  if(!Object.prototype.hasOwnProperty.call(allowed,nombre))throw new Error('Configuracion no editable.');
  const texto=String(valor).trim().slice(0,allowed[nombre]);
  if(nombre!=='NOMBRE_NEGOCIO') {
    const numero=Number(texto);
    if(!Number.isInteger(numero)||numero<0||numero>365)throw new Error('Valor numerico fuera de rango.');
    if(nombre==='INTERVALO_MIN' && (numero<5||60%numero!==0))throw new Error('Intervalo valido: divisor de 60, minimo 5.');
    if(nombre==='DIAS_ADELANTO'&&numero<1)throw new Error('Reserva entre 1 y 365 dias.');
  }
  if(!texto)throw new Error('Este campo es obligatorio.');
  const sheet=obtenerDbAdmin_().getSheetByName('Configuracion');
  const keys=sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat();
  const i=keys.indexOf(nombre);
  if(i<0)throw new Error('Clave inexistente.');
  sheet.getRange(i+2,2).setValue(texto);
  auditarAdmin_('CONFIGURACION','Configuracion',nombre,texto);
  return obtenerPanelAdmin();
}

function guardarHorarioAdmin(data) {
  const dia=Number(data.dia);
  const abierto=data.abierto===true;
  const inicio=String(data.inicio||'');
  const fin=String(data.fin||'');
  if(!Number.isInteger(dia)||dia<0||dia>6)throw new Error('Dia invalido.');
  if(abierto && (!/^\d{2}:\d{2}$/.test(inicio)||!/^\d{2}:\d{2}$/.test(fin)||inicio>=fin))
    throw new Error('Introduce un rango valido, por ejemplo 08:00–18:00.');
  const sheet=obtenerDbAdmin_().getSheetByName('Horarios');
  const rows=sheet.getDataRange().getDisplayValues();
  const row=rows.findIndex(function(value,i){return i>0&&Number(value[0])===dia;});
  if(row<0)throw new Error('Dia no configurado.');
  sheet.getRange(row+1,2,1,3).setValues([[abierto,abierto?inicio:'',abierto?fin:'']]);
  auditarAdmin_('HORARIO','Horario',String(dia),(abierto?inicio+'-'+fin:'Cerrado'));
  return obtenerPanelAdmin();
}

/**
 * ATENCION: antes de habilitar operativamente bloqueos desde Admin,
 * coordinar las escrituras con el motor del proyecto Publico.
 * No exponer un guardado no transaccional de bloqueos en esta fase.
 */

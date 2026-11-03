/** Personalización de la barbería y categorías configurables. Proyecto Admin. */
function categoriasAdmin_() {
  const db=obtenerDbAdmin_();
  const hoja=db.getSheetByName('Categorias');
  if(!hoja)throw new Error('Falta la hoja Categorias. Ejecuta nuevamente instalarBarberControl.');
  return leerFilasAdmin_('Categorias');
}
function obtenerMarcaAdmin() {
  const config={};
  leerFilasAdmin_('Configuracion').forEach(function(r){config[r.Clave]=r.Valor;});
  return {
    nombre:config.NOMBRE_NEGOCIO||'',
    telefono:config.TELEFONO_WHATSAPP||'',
    eslogan:config.ESLOGAN_NEGOCIO||'',
    tieneLogo:Boolean(config.LOGO_FILE_ID),
    categorias:categoriasAdmin_()
  };
}
function actualizarConfigMarca_(key,value) {
  const sheet=obtenerDbAdmin_().getSheetByName('Configuracion');
  const last=sheet.getLastRow();
  const rows=last>1?sheet.getRange(2,1,last-1,1).getValues().flat():[];
  const index=rows.indexOf(key);
  if(index<0)throw new Error('Falta la propiedad '+key+'. Ejecuta instalarBarberControl.');
  sheet.getRange(index+2,2).setValue(value);
}
function guardarMarcaAdmin(data) {
  if(!data||typeof data!=='object')throw new Error('Datos inválidos.');
  const nombre=String(data.nombre||'').trim();
  const eslogan=String(data.eslogan||'').trim();
  const raw=String(data.telefono||'').trim();
  const digits=raw.replace(/\D/g,'');
  if(nombre.length<3||nombre.length>80)throw new Error('El nombre debe tener entre 3 y 80 caracteres.');
  if(eslogan.length>140)throw new Error('El eslogan es demasiado largo.');
  if(raw && (!/^[+]?[0-9 ()-]+$/.test(raw)||digits.length<8||digits.length>15))
    throw new Error('El teléfono WhatsApp no es válido.');
  // Nicaragua: números nacionales de 8 dígitos reciben prefijo +505.
  const numero=digits.length===8?'505'+digits:digits;
  if(numero.length>15)throw new Error('El teléfono supera el tamaño internacional.');
  const clean=v=>/^[=+\-@]/.test(v)?"'"+v:v;
  actualizarConfigMarca_('NOMBRE_NEGOCIO',clean(nombre));
  actualizarConfigMarca_('TELEFONO_WHATSAPP',numero);
  actualizarConfigMarca_('ESLOGAN_NEGOCIO',clean(eslogan));
  auditarAdmin_('CONFIGURACION','Barberia','Marca','Identidad actualizada');
  return obtenerMarcaAdmin();
}
function crearCategoriaAdmin(nombre) {
  const n=String(nombre||'').trim().replace(/\s+/g,' ');
  if(n.length<2||n.length>45||!/^[-A-Za-zÀ-ÿ0-9 ()&]+$/.test(n))
    throw new Error('La categoría debe tener de 2 a 45 caracteres (letras y números).');
  const names=categoriasAdmin_();
  if(names.some(function(c){return c.Nombre.toLocaleLowerCase('es')===n.toLocaleLowerCase('es');}))
    throw new Error('Esa categoría ya existe.');
  const id='CAT-'+Utilities.getUuid().slice(0,10).toUpperCase();
  const sheet=obtenerDbAdmin_().getSheetByName('Categorias');
  sheet.appendRow([id,n,names.length+1,true]);
  auditarAdmin_('CREAR','Categoria',id,n);
  return obtenerMarcaAdmin();
}
function cambiarCategoriaAdmin(id,activa) {
  const sheet=obtenerDbAdmin_().getSheetByName('Categorias');
  const values=sheet.getDataRange().getValues();
  const index=values.findIndex(function(r,i){return i>0&&String(r[0])===String(id);});
  if(index<0)throw new Error('Categoría no encontrada.');
  const nombre=String(values[index][1]);
  if(!activa){
    const enUso=leerFilasAdmin_('Servicios').some(function(s){
      return s.Categoria===nombre&&String(s.Activo).toLowerCase()==='true';
    });
    if(enUso)throw new Error('Hay servicios activos en esa categoría. Reasígnalos antes de desactivarla.');
  }
  sheet.getRange(index+1,4).setValue(activa===true);
  auditarAdmin_('ESTADO','Categoria',id,String(activa===true));
  return obtenerMarcaAdmin();
}
/**
 * Guarda logotipo PNG transparente en la carpeta privada Identidad.
 * Solo acepta PNG real. El archivo debe ser reducido a <=900 KB en el navegador.
 */
function subirLogoAdmin(dataUri) {
  const match=/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUri||''));
  if(!match||match[1].length>1350000)throw new Error('Se requiere un PNG de máximo 900 KB.');
  const bytes=Utilities.base64Decode(match[1]);
  if(bytes.length>950000||bytes.length<67)throw new Error('El logotipo excede el peso permitido.');
  const signature=[137,80,78,71,13,10,26,10];
  if(!signature.every(function(n,i){return (bytes[i]&255)===n;}))
    throw new Error('El archivo no es un PNG válido.');
  const rootId=PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  if(!rootId)throw new Error('Primero instala BarberControl.');
  const folders=DriveApp.getFolderById(rootId).getFoldersByName('Imagenes');
  if(!folders.hasNext())throw new Error('Falta carpeta Imagenes.');
  const dir=folders.next();
  const f=dir.getFoldersByName('Identidad');
  const target=f.hasNext()?f.next():dir.createFolder('Identidad');
  const logo=target.createFile(Utilities.newBlob(bytes,'image/png','logo_barberia_'+Utilities.getUuid().slice(0,8)+'.png'));
  try {
    actualizarConfigMarca_('LOGO_FILE_ID',logo.getId());
    SpreadsheetApp.flush();
  }catch(e){logo.setTrashed(true);throw e;}
  auditarAdmin_('LOGO','Barberia','Identidad',logo.getId());
  return obtenerMarcaAdmin();
}
function obtenerLogoAdmin() {
  const config=obtenerMarcaAdmin();
  if(!config.tieneLogo)return '';
  const c={};
  leerFilasAdmin_('Configuracion').forEach(function(r){c[r.Clave]=r.Valor;});
  const file=DriveApp.getFileById(c.LOGO_FILE_ID);
  if(file.getMimeType()!=='image/png')throw new Error('El logo debe ser PNG.');
  const bytes=file.getBlob().getBytes();
  if(bytes.length>950000)throw new Error('El logo es demasiado grande.');
  return 'data:image/png;base64,'+Utilities.base64Encode(bytes);
}

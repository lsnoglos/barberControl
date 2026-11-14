const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const publicHtml=file('apps/public/Index.html');
const adminHtml=file('apps/admin/Index.html');
assert(publicHtml.includes('class="pole"'));
assert(adminHtml.includes('class="pole"'));
assert(publicHtml.includes('id="busy"'));
assert(adminHtml.includes('id="busy"'));
assert(publicHtml.includes('id="galleryClose"'));
assert(publicHtml.includes('id="clientName"'));
assert(!publicHtml.includes('Un gran estilo empieza aquí'));
assert(adminHtml.includes('id="settingsButton"'));
assert(adminHtml.includes('id="month"'));
assert(adminHtml.includes('id="hours"'));
assert(adminHtml.includes('id="blocks"'));
assert(!adminHtml.includes('Servicios y precios'));
const script=[...publicHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
assert(script.includes("api('reservarCita',payload)"));
assert(!script.includes("apiReservaConLimite([{"));
assert(script.includes("api('obtenerDisponibilidad',fecha,cut.id,mode)"));
const begin=script.indexOf('function readableDate('),end=script.indexOf('function choose(',begin);
assert(begin>0&&end>begin);
const dates=vm.runInNewContext(script.slice(begin,end)+'\n({readableDate,readableTime})',{Intl,Date,Number,String,RegExp});
assert.match(dates.readableDate('2026-11-04').toLowerCase(),/miércoles 4 de noviembre de 2026/);
assert.equal(dates.readableTime('14:15'),'2:15 p. m.');
assert.equal(dates.readableTime('09:00'),'9:00 a. m.');
assert.equal(dates.readableTime('12:00'),'12:00 p. m.');
console.log('OK: modal barbería, fechas españolas y panel dividido por engranaje');

const adminScript=[...adminHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
function portion(source,from,to){
 const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
 assert(a>=0&&b>a,'Falta '+from);return source.slice(a,b);
}
const adminTime=vm.runInNewContext(portion(adminScript,'function readableTime(','function makeClock(')+'\nreadableTime');
for(const [input,expected] of [['00:00','12:00 a. m.'],['08:05','8:05 a. m.'],['12:00','12:00 p. m.'],['17:30','5:30 p. m.'],['23:59','11:59 p. m.']]){
 assert.equal(adminTime(input),expected);assert.equal(dates.readableTime(input),expected);
}
assert(!adminHtml.includes('type="time"'),'Los navegadores pueden mostrar hora militar en input time');
assert(adminScript.includes("option(period,'AM','a. m.')"));
assert(adminScript.includes("option(period,'PM','p. m.')"));
const whatsapp=vm.runInNewContext(portion(adminScript,'function clientWhatsApp(','function priceSummary(')+'\nclientWhatsApp',{
 readableTime:adminTime,dateTitle:()=> 'lunes 16 de noviembre de 2026'
});
const r={cliente:'Cliente de prueba',telefono:'88888888',nombre:'Low Fade',fecha:'2026-11-16',inicio:'14:15',modalidad:'LOCAL'};
const confirmation=new URL(whatsapp(r,true,'Mi barbería'));
assert.equal(confirmation.pathname,'/50588888888');
assert.match(confirmation.searchParams.get('text'),/Estimado Cliente de prueba/);
assert.match(confirmation.searchParams.get('text'),/2:15 p\. m\./);
assert.match(confirmation.searchParams.get('text'),/Mi barbería/);
assert.equal(new URL(whatsapp(r,false,'Mi barbería')).searchParams.get('text'),'Hola Cliente de prueba, ');
assert.match(new URL(whatsapp({...r,modalidad:'DOMICILIO'},true,'Mi barbería')).searchParams.get('text'),/domicilio/);
assert.equal(whatsapp({...r,telefono:'123'},true,'Mi barbería'),'');
assert(publicHtml.includes('id="navCatalog"')&&publicHtml.includes('id="navBooking"')&&publicHtml.includes('id="navSettings"'));
assert(!publicHtml.includes('href="#catalogo"')&&!publicHtml.includes('href="#booking"'));
const els={};
for(const id of ['catalogo','appearance','booking','bookingEmpty'])els[id]={hidden:true,scrollIntoView(){}};
const publicState={cut:null};
const navigate=vm.runInNewContext(portion(script,'function navigateTo(','$(\'navCatalog\').onclick=')+'\nnavigateTo',{
 $:id=>els[id],state:publicState,setNav:()=>{}
});
navigate('navBooking');assert.equal(els.bookingEmpty.hidden,false);assert.equal(els.booking.hidden,true);assert.equal(els.catalogo.hidden,true);
publicState.cut={id:'CRT-1'};navigate('navBooking');assert.equal(els.booking.hidden,false);assert.equal(els.bookingEmpty.hidden,true);
navigate('navCatalog');assert.equal(els.catalogo.hidden,false);assert.equal(els.booking.hidden,true);
navigate('navSettings');assert.equal(els.appearance.hidden,false);
assert(script.includes("hasPhoto=Boolean(cut.tieneImagen)||hasExtra"));
assert(script.includes("[{id:'PORTADA',tipo:'PRINCIPAL'}]"));
assert(publicHtml.includes('data-theme="light"')&&adminHtml.includes('data-theme="light"'));
const prefs={};const themeEls={themeLight:{setAttribute(){}},themeDark:{setAttribute(){}}};
const rootNode={dataset:{}};
const themeFns=vm.runInNewContext(portion(script,"const THEME_KEY=",'function setNav(')+'\napplyTheme',{
 $:id=>themeEls[id],document:{documentElement:rootNode},write:(k,v)=>prefs[k]=v
});
themeFns('light',true);assert.equal(rootNode.dataset.theme,'light');assert.equal(prefs['bc-public-theme-v1'],'light');
themeFns('dark',true);assert.equal(prefs['bc-public-theme-v1'],'dark');
const userPrefs=new Map();
const backend=file('apps/admin/Gestion.gs');const ctx=vm.createContext({
 PropertiesService:{getUserProperties:()=>({getProperty:k=>userPrefs.get(k),setProperty:(k,v)=>userPrefs.set(k,v)})}
});
vm.runInContext(backend,ctx);
assert.equal(vm.runInContext('obtenerTemaAdmin()',ctx),'');
assert.equal(vm.runInContext("guardarTemaAdmin('light')",ctx),'light');
assert.equal(vm.runInContext('obtenerTemaAdmin()',ctx),'light');
assert.throws(()=>vm.runInContext("guardarTemaAdmin('other')",ctx),/Tema no válido/);
assert(adminHtml.includes('class="barber-progress"')&&adminHtml.includes('calendar-refresh'));
assert(adminScript.includes('if(active)$(\'dayBookings\').textContent=\'\';'));
assert(adminScript.includes("if(seq!==state.calendarSeq)return;"));
assert(adminScript.includes("calendarLoading(true,'Consultando las citas del día…')"));
assert(adminScript.includes("calendarLoading(true,'Actualizando calendario y reservaciones…')"));
assert(adminScript.includes("No hay reservas para este día."));
console.log('OK: reloj de 12 horas, agenda con carga, temas persistentes, navegación interna, ampliación y WhatsApp');

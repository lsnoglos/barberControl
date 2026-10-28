/* Chequeos estáticos mínimos: no ejecutan servicios reales de Google. */
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
for(const project of ['public','admin']){
 const dir=path.join(root,'apps',project);
 const entries=fs.readdirSync(dir);
 const scripts=entries.filter(x=>x.endsWith('.gs'));
 assert(scripts.includes('Code.gs'),'Falta Code.gs en '+project);
 for(const name of scripts){
  const source=fs.readFileSync(path.join(dir,name),'utf8');
  new vm.Script(source,{filename:project+'/'+name});
 }
 const html=fs.readFileSync(path.join(dir,'Index.html'),'utf8');
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  new vm.Script(match[1],{filename:project+'/Index.html'});
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'appsscript.json'),'utf8'));
 assert.equal(manifest.timeZone,'America/Managua');
 assert.equal(manifest.webapp.executeAs,'USER_DEPLOYING');
 assert.equal(manifest.webapp.access,project==='public'?'ANYONE_ANONYMOUS':'MYSELF');
 console.log('OK '+project+': '+scripts.length+' archivos .gs, HTML y manifiesto');
}
const publicText=fs.readdirSync(path.join(root,'apps','public'))
 .filter(x=>x.endsWith('.gs')).map(x=>fs.readFileSync(path.join(root,'apps','public',x),'utf8')).join('\n');
assert(!publicText.includes('function instalarBarberControl('),'Instalador administrativo en app publica');
assert(!publicText.includes('function guardarServicioAdmin('),'Gestion administrativa en app publica');
console.log('OK separación de código y permisos (estático)');

// Navegador → Django → SQLite. Solo loopback; ninguna escritura en producción.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const evidence=process.env.ROOT_EVIDENCE;
const base=process.env.ROOT_FRONTEND||'http://127.0.0.1:3039',api='http://127.0.0.1:3041';
const read=async path=>(await fetch(api+path)).json();
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const errors=[],writes=[];const before=await read('/__estado');
 async function open(mobile=false){
  const session=await read('/__sesion/root');
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,timezoneId:'America/Santiago',serviceWorkers:'block'});
  await context.addInitScript(s=>{
   localStorage.setItem('authToken','token-ficticio');localStorage.setItem('tokenTimestamp',String(Date.now()));
   localStorage.setItem('userData',JSON.stringify(s.user));localStorage.setItem('userProfile',JSON.stringify(s.profile));
   localStorage.setItem('cartera_tour_done','1');localStorage.setItem('theme','light');
  },session);
  const fault={lost:false};
  await context.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());if(u.origin===base)return route.continue();
   if(u.hostname!=='api.carterafinanciera.com')return route.abort();
   assert(u.pathname.startsWith('/tiendas/'),'Endpoint no previsto: '+u.pathname);
   if(req.method()!=='GET')writes.push({method:req.method(),path:u.pathname,body:req.postDataJSON()});
   const r=await route.fetch({url:api+u.pathname+u.search,headers:{...req.headers(),'X-Local-Role':'root'},maxRetries:0});
   if(fault.lost&&req.method()==='PUT'){fault.lost=false;return route.abort('failed');}
   return route.fulfill({response:r});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-10-10T15:00:00Z'));
  return{context,page,fault};
 }
 const goto=async(p,path)=>{await p.goto(base+path);await p.waitForLoadState('networkidle');};
 const save=async(p,value)=>{
  await p.getByLabel('Precio Mensual',{exact:true}).fill(value);
  await p.getByRole('button',{name:'Guardar precios',exact:true}).click();
  await p.getByLabel('Motivo del cambio').fill('Tarifa ficticia verificada');
  await Promise.all([p.waitForResponse(r=>r.request().method()==='PUT'),p.getByRole('button',{name:'Confirmar tarifas',exact:true}).click()]);
 };
 try{
  const desktop=await open();const p=desktop.page;
  await goto(p,'/dashboard/admin');
  assert.equal(await p.evaluate(()=>localStorage.getItem('selectedStore')),null);
  await goto(p,'/dashboard/admin/rutas');
  assert.equal(await p.locator('[title="Eliminar ruta sin historial"]:visible').count(),1);
  const row=p.locator('tbody tr').filter({hasText:'Ruta A'});
  assert.equal(await row.getByTitle('Eliminar ruta sin historial').count(),0);
  const t=await read('/__sesion/root');
  const archive=await fetch(api+`/tiendas/${t.store.id}/archivar/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({archivar:true,version:0})});
  assert.equal(archive.status,200);
  await Promise.all([p.waitForResponse(r=>r.url().includes('/archivar/')),row.getByTitle('Archivar ruta').click()]);
  await p.getByText('La suscripción cambió. Recarga antes de archivar o restaurar.',{exact:true}).waitFor();
  await p.getByRole('status',{name:'Cargando información'}).waitFor({state:'hidden'});
  assert.equal((await read('/__estado')).version,1);
  await p.getByTitle('Mostrar también las rutas archivadas').click();
  await row.getByTitle('Restaurar ruta archivada').waitFor();
  await Promise.all([p.waitForResponse(r=>r.url().includes('/archivar/')),row.getByTitle('Restaurar ruta archivada').click()]);
  await p.getByRole('status',{name:'Cargando información'}).waitFor({state:'hidden'});
  assert.equal((await read('/__estado')).version,2);
  assert.equal((await read('/__estado')).archivada,false);
  await p.locator('[title="Eliminar ruta sin historial"]:visible').click();
  await p.getByText(/sin saldo ni historial protegido/).last().waitFor();
  await Promise.all([p.waitForResponse(r=>r.request().method()==='DELETE'),p.getByRole('button',{name:'Eliminar',exact:true}).click()]);
  assert.equal((await read('/tiendas/list/?vista=lista')).length,2);

  const mobile=await open(true);await goto(mobile.page,'/dashboard/admin/conciliacion');
  await mobile.page.getByLabel('Importe verificado en el comprobante').waitFor();
  assert(await mobile.page.getByRole('button',{name:'Confirmar',exact:true}).isDisabled());
  assert.equal(await mobile.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  for(const name of ['Ver comprobante','Rechazar','Confirmar']){
   const box=await mobile.page.getByRole('button',{name,exact:true}).boundingBox();
   assert(box&&box.x>=0&&box.x+box.width<=390,'Acción móvil recortada: '+name);
  }
  if(evidence){await fs.mkdir(evidence,{recursive:true});await mobile.page.screenshot({path:evidence+'/conciliacion-movil.png',fullPage:true});}
  await mobile.context.close();
  await goto(p,'/dashboard/admin/conciliacion');
  assert(await p.getByRole('button',{name:'Confirmar',exact:true}).isDisabled());
  await p.getByLabel('Importe verificado en el comprobante').fill('11000');
  await p.getByRole('button',{name:'Confirmar',exact:true}).click();
  await p.getByLabel('Verifiqué el ingreso bancario y el importe').check();
  await Promise.all([p.waitForResponse(r=>r.url().endsWith('/revisar/')),p.getByRole('button',{name:'Registrar confirmación',exact:true}).click()]);
  await p.getByRole('button',{name:'Revertir',exact:true}).waitFor();
  assert.equal((await read('/__estado')).pagos.filter(x=>x.solicitud_id!==null)[0].monto,'11000');

  const second=await open();await goto(p,'/dashboard/admin/planes');await goto(second.page,'/dashboard/admin/planes');
  await p.getByLabel('Precio Mensual',{exact:true}).fill('');
  assert(await p.getByRole('button',{name:'Guardar precios',exact:true}).isDisabled());
  await save(p,'15000');await p.getByText('Precios actualizados.',{exact:true}).waitFor();
  await save(second.page,'16000');await second.page.getByRole('alert').filter({hasText:'Recarga los planes'}).waitFor();
  assert(await second.page.getByRole('button',{name:'Guardar precios',exact:true}).isDisabled());
  assert.equal((await read('/__estado')).planes[0].precio,'15000');
  await second.page.getByRole('button',{name:'Recargar planes'}).click();
  await second.page.getByLabel('Precio Mensual',{exact:true}).waitFor();
  await save(second.page,'18000');await second.page.getByText('Precios actualizados.',{exact:true}).waitFor();
  await p.getByRole('button',{name:'Recargar planes'}).click();await p.getByLabel('Precio Mensual',{exact:true}).waitFor();
  await p.getByLabel('Precio Mensual',{exact:true}).fill('17000');desktop.fault.lost=true;
  await p.getByRole('button',{name:'Guardar precios',exact:true}).click();
  await p.getByLabel('Motivo del cambio').fill('Tarifa ficticia verificada');
  await p.getByRole('button',{name:'Confirmar tarifas',exact:true}).click();
  await p.getByRole('alert').filter({hasText:'Recarga los planes'}).waitFor();
  assert(await p.getByRole('button',{name:'Guardar precios',exact:true}).isDisabled());
  assert.equal((await read('/__estado')).planes[0].precio,'17000');
  assert.equal((await read('/__estado')).planes[0].version,3);
  if(evidence)await p.screenshot({path:evidence+'/tarifas-respuesta-perdida.png',fullPage:true});
  await second.context.close();await desktop.context.close();
  const after=await read('/__estado');for(const k of ['caja','saldo','clientes','recaudos'])assert.equal(after[k],before[k],k);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({resultado:'OK',erroresJS:errors,escriturasSoloSQLite:writes.length,caja:after.caja,saldo:after.saldo,versionTarifa:after.planes[0].version,versionSuscripcion:after.version}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

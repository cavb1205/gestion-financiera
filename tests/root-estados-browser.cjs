// Integración etapa 2: navegador real, Django/SQLite ficticios y fallos simulados.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const base='http://127.0.0.1:3039',api='http://127.0.0.1:3041';
const evidence=process.env.ROOT_EVIDENCE;
const read=async path=>(await fetch(api+path)).json();
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const errors=[],writes=[];const before=await read('/__estado');
 async function open(mobile=false){
  const session=await read('/__sesion/root');
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},timezoneId:'America/Santiago',serviceWorkers:'block'});
  await context.addInitScript(s=>{
   localStorage.setItem('authToken','token-ficticio');localStorage.setItem('tokenTimestamp',String(Date.now()));
   localStorage.setItem('userData',JSON.stringify(s.user));localStorage.setItem('userProfile',JSON.stringify(s.profile));
   localStorage.setItem('cartera_tour_done','1');localStorage.setItem('theme','light');
  },session);
  const fault={path:null,shrink:false,lost:false};
  await context.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());if(u.origin===base)return route.continue();
   if(u.hostname!=='api.carterafinanciera.com')return route.abort();
   assert(u.pathname.startsWith('/tiendas/'),'Fuera del alcance: '+u.pathname);
   if(req.method()==='GET'&&fault.path===u.pathname)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Mantenimiento ficticio'})});
   if(req.method()!=='GET')writes.push({method:req.method(),path:u.pathname,body:req.postDataJSON()});
   const r=await route.fetch({url:api+u.pathname+u.search,headers:{...req.headers(),'X-Local-Role':'root'},maxRetries:0});
   if(fault.lost&&req.method()==='POST'&&u.pathname.includes('/revisar/')){fault.lost=false;return route.abort('failed');}
   if(fault.shrink&&u.pathname==='/tiendas/list/')return route.fulfill({response:r,json:(await r.json()).slice(0,2)});
   return route.fulfill({response:r});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-10-10T15:00:00Z'));
  return {page,context,fault};
 }
 const goto=async(p,path)=>{await p.goto(base+path);await p.waitForLoadState('networkidle');};
 const pages=[
  ['/dashboard/admin','/tiendas/admin/resumen/'],
  ['/dashboard/admin/rutas','/tiendas/list/'],
  ['/dashboard/admin/conciliacion','/tiendas/solicitudes/revision/'],
  ['/dashboard/admin/ingresos','/tiendas/ingresos/'],
  ['/dashboard/admin/planes','/tiendas/planes/'],
  ['/dashboard/admin/cuenta-bancaria','/tiendas/cuenta-destino/'],
 ];
 try{
  for(const mobile of [false,true]){
   const c=await open(mobile);
   for(const [path,endpoint] of pages){
    c.fault.path=endpoint;await goto(c.page,path);
    await c.page.getByRole('heading',{name:'No se pudo actualizar la información'}).waitFor();
    assert.equal(await c.page.getByText('No hay solicitudes pendientes.',{exact:true}).count(),0);
    assert.equal(await c.page.getByText('Sin resultados',{exact:true}).count(),0);
    if(endpoint==='/tiendas/cuenta-destino/')assert.equal(await c.page.getByRole('textbox').count(),0);
    c.fault.path=null;await c.page.getByRole('button',{name:'Reintentar',exact:true}).click();
    await c.page.getByRole('heading',{name:'No se pudo actualizar la información'}).waitFor({state:'hidden'});
    await c.page.waitForLoadState('networkidle');
    if(endpoint==='/tiendas/cuenta-destino/')await c.page.getByLabel('Banco',{exact:true}).waitFor();
    assert.equal(await c.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path);
   }
   if(mobile&&evidence){await fs.mkdir(evidence,{recursive:true});await c.page.screenshot({path:evidence+'/cuenta-movil.png',fullPage:true,animations:'disabled'});}
   await c.context.close();
  }

  const mobile=await open(true);await goto(mobile.page,'/dashboard/admin/conciliacion');
  await mobile.page.getByRole('button',{name:'Revisar excepción',exact:true}).click();
  const dialog=mobile.page.getByRole('dialog');
  await dialog.waitFor();await mobile.page.keyboard.press('Tab');
  assert(await dialog.evaluate(el=>el.contains(document.activeElement)));
  const reason=mobile.page.getByLabel('Motivo de la revisión');
  await reason.click();await mobile.page.keyboard.type('Verificación móvil del ingreso',{delay:20});
  assert.equal(await reason.inputValue(),'Verificación móvil del ingreso');
  assert(await reason.evaluate(el=>el===document.activeElement));
  await mobile.page.getByLabel('Verifiqué el ingreso bancario y el importe').check();
  assert(await mobile.page.getByRole('button',{name:'Registrar confirmación',exact:true}).isEnabled());
  assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false);
  if(evidence)await mobile.page.screenshot({path:evidence+'/excepcion-movil.png',animations:'disabled'});
  await mobile.page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  await mobile.context.close();

  const one=await open(),two=await open();const p=one.page,q=two.page;
  await goto(p,'/dashboard/admin/rutas');
  const temporal=p.locator('tbody tr').filter({hasText:'Ruta temporal'});
  await temporal.waitFor();assert((await temporal.innerText()).includes('Acceso temporal · pago por verificar'));
  assert(!(await temporal.innerText()).includes('Bloqueada'));
  await p.getByRole('button',{name:'Ir a la página 2',exact:true}).click();
  assert.equal(await p.locator('tbody tr').count(),2);
  one.fault.shrink=true;await p.getByRole('button',{name:'Recargar rutas'}).click();
  await temporal.waitFor();assert.equal(await p.locator('tbody tr').count(),2);
  assert.equal(await p.getByText('Sin resultados',{exact:true}).count(),0);
  one.fault.shrink=false;

  await goto(p,'/dashboard/admin/cuenta-bancaria');await goto(q,'/dashboard/admin/cuenta-bancaria');
  await p.getByLabel('Banco',{exact:true}).fill('');
  assert(await p.getByRole('button',{name:'Revisar cambios',exact:true}).isDisabled());
  await p.getByLabel('Banco',{exact:true}).fill('Banco Nuevo');
  await p.getByRole('button',{name:'Revisar cambios',exact:true}).click();
  assert(await p.getByRole('button',{name:'Confirmar cuenta',exact:true}).isDisabled());
  await p.getByLabel('Motivo del cambio').fill('Cuenta ficticia verificada');
  await Promise.all([p.waitForResponse(r=>r.request().method()==='PUT'),p.getByRole('button',{name:'Confirmar cuenta',exact:true}).click()]);
  await p.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal((await read('/__estado')).cuenta.version,1);
  await q.getByLabel('Banco',{exact:true}).fill('Banco de otra sesión');
  await q.getByRole('button',{name:'Revisar cambios',exact:true}).click();
  await q.getByLabel('Motivo del cambio').fill('Cuenta desactualizada');
  await Promise.all([q.waitForResponse(r=>r.request().method()==='PUT'),q.getByRole('button',{name:'Confirmar cuenta',exact:true}).click()]);
  await q.getByRole('alert').filter({hasText:'Recarga la cuenta'}).waitFor();
  assert.equal((await read('/__estado')).cuenta.banco,'Banco Nuevo');
  await q.getByRole('button',{name:'Recargar cuenta'}).click();await q.getByLabel('Banco',{exact:true}).waitFor();
  assert.equal(await q.getByLabel('Banco',{exact:true}).inputValue(),'Banco Nuevo');

  await goto(p,'/dashboard/admin/conciliacion');
  const expired=p.locator('section').filter({hasText:'Comprobantes fuera de plazo'});
  await expired.getByRole('button',{name:'Revisar excepción',exact:true}).click();
  assert(await p.getByRole('button',{name:'Registrar confirmación',exact:true}).isDisabled());
  await p.getByLabel('Verifiqué el ingreso bancario y el importe').check();
  assert(await p.getByRole('button',{name:'Registrar confirmación',exact:true}).isDisabled());
  await p.getByLabel('Motivo de la revisión').fill('Pago recibido y verificado fuera del plazo');
  await Promise.all([p.waitForResponse(r=>r.url().endsWith('/revisar/')),p.getByRole('button',{name:'Registrar confirmación',exact:true}).click()]);
  await p.getByRole('dialog').waitFor({state:'hidden'});
  const afterException=await read('/__estado');
  const tardio=afterException.solicitudes.find(s=>s.codigo==='MM-TARDIO');
  assert.equal(tardio.confirmada_fuera_plazo,true);assert.equal(tardio.estado,'confirmada');
  assert.equal(tardio.cuenta_acordada.banco,'Banco Ficticio');
  await p.getByRole('button',{name:'Revertir',exact:true}).click();
  assert(await p.getByRole('button',{name:'Confirmar reversión',exact:true}).isDisabled());
  await p.getByLabel('Motivo de la revisión').fill('Ingreso bancario de prueba no localizado');
  await Promise.all([p.waitForResponse(r=>r.url().endsWith('/revisar/')),p.getByRole('button',{name:'Confirmar reversión',exact:true}).click()]);
  await p.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal((await read('/__estado')).pagos.find(x=>x.solicitud_id!==null).estado,'anulado');

  await p.getByLabel('Importe verificado en el comprobante').fill('11000');
  await p.getByRole('button',{name:'Confirmar',exact:true}).click();
  await p.getByLabel('Verifiqué el ingreso bancario y el importe').check();one.fault.lost=true;
  await p.getByRole('button',{name:'Registrar confirmación',exact:true}).click();
  await p.getByRole('alert').filter({hasText:'Recarga y revisa el estado'}).waitFor();
  assert(await p.getByRole('button',{name:'Registrar confirmación',exact:true}).isDisabled());
  const saved=await read('/__estado');assert.equal(saved.solicitudes.find(s=>s.codigo==='MM-PRUEBA').estado,'confirmada');
  await p.getByRole('button',{name:'Recargar revisión'}).click();
  await p.getByRole('dialog').waitFor({state:'hidden'});await p.getByRole('button',{name:'Revertir',exact:true}).waitFor();
  if(evidence){
   await p.evaluate(()=>window.scrollTo(0,0));
   for(const close of await p.locator('.Toastify__close-button').all())if(await close.isVisible())await close.click();
   await p.screenshot({path:evidence+'/conciliacion-escritorio.png',fullPage:true,animations:'disabled'});
  }
  const after=await read('/__estado');
  for(const key of ['caja','saldo','clientes','recaudos'])assert.equal(after[key],before[key],key);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({resultado:'OK',pantallasErrorRecuperadas:12,preactivadaCorrecta:true,paginacionCorrecta:true,escriturasFicticias:writes.length,erroresJS:errors,caja:after.caja,saldo:after.saldo}));
  await one.context.close();await two.context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

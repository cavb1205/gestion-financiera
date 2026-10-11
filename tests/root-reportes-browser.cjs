// Solo loopback: Chrome → API Django → SQLite ficticia. Sin escrituras.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const base='http://127.0.0.1:3039',api='http://127.0.0.1:3041';
const read=async path=>(await fetch(api+path)).json();
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const errors=[],writes=[];const before=await read('/__estado');
 const evidence=process.env.ROOT_EVIDENCE;
 const resumen=await read('/tiendas/admin/resumen/');
 assert.equal(resumen.ingresos_mes,12000);
 assert.equal(resumen.comparacion_mes.anterior,0); // Septiembre 1-10, no 20-30.
 assert.equal(resumen.comparacion_mes.variacion_pct,null);
 try{
  for(const mobile of [false,true]){
   const session=await read('/__sesion/root');
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},timezoneId:'America/Santiago',serviceWorkers:'block',acceptDownloads:true});
   await context.addInitScript(s=>{
    localStorage.setItem('authToken','token-ficticio');localStorage.setItem('tokenTimestamp',String(Date.now()));
    localStorage.setItem('userData',JSON.stringify(s.user));localStorage.setItem('userProfile',JSON.stringify(s.profile));
    localStorage.setItem('cartera_tour_done','1');localStorage.setItem('theme','light');
   },session);
   await context.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());if(u.origin===base)return route.continue();
    if(u.hostname!=='api.carterafinanciera.com')return route.abort();
    assert(u.pathname.startsWith('/tiendas/'),'Fuera del alcance: '+u.pathname);
    if(req.method()!=='GET'){writes.push(u.pathname);return route.abort();}
    const r=await route.fetch({url:api+u.pathname+u.search,headers:{...req.headers(),'X-Local-Role':'root'},maxRetries:0});
    return route.fulfill({response:r});
   });
   const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.clock.setFixedTime(new Date('2026-10-10T15:00:00Z'));
   const goto=async path=>{await p.goto(base+path);await p.waitForLoadState('networkidle');};
   const download=async name=>{
    const [d]=await Promise.all([p.waitForEvent('download'),p.getByRole('button',{name,exact:true}).click()]);
    return fs.readFile(await d.path(),'utf8');
   };
   await goto('/dashboard/admin');
   await p.getByText('Proyección mensual',{exact:true}).waitFor();
   await p.getByLabel('Comparación mensual equivalente').waitFor();
   assert.equal(await p.getByText('Conversión trial',{exact:true}).count(),0);
   await p.getByRole('heading',{name:'Primer pago por mes de registro',exact:true}).waitFor();
   assert.equal(await p.getByLabel('Primer pago por mes de registro').locator('tbody tr').count(),6);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(evidence){await fs.mkdir(evidence,{recursive:true});await p.screenshot({path:evidence+`/panel-${mobile?'movil':'escritorio'}.png`,fullPage:true,animations:'disabled'});
    await p.getByLabel('Primer pago por mes de registro').screenshot({path:evidence+`/cohortes-${mobile?'movil':'escritorio'}.png`,animations:'disabled'});}

   await goto('/dashboard/admin/rutas');
   await p.getByLabel('Buscar rutas').fill('@admin-pruebas');
   await p.getByText('3 rutas coinciden.',{exact:false}).waitFor();
   await p.getByLabel('Buscar rutas').fill('camilo');
   await p.getByText('3 rutas coinciden.',{exact:false}).waitFor();
   const csvRutas=await download('Exportar rutas a CSV');
   assert(csvRutas.includes('"\'=1+1"'));assert(csvRutas.includes('admin-pruebas'));
   await p.getByLabel('Buscar rutas').fill('901');
   await p.getByText('1 rutas coinciden.',{exact:false}).waitFor();
   if(mobile)await p.getByRole('button',{name:'Abrir menú',exact:true}).click();
   const current=p.locator('a[aria-current="page"]:visible');
   assert.equal(await current.count(),1);assert.equal(await current.getAttribute('href'),'/dashboard/admin/rutas');
   if(mobile){
    await p.getByRole('button',{name:'Cerrar navegación',exact:true}).click();
    await p.getByRole('button',{name:'Abrir menú',exact:true}).click();
    await p.keyboard.press('Escape');
    await p.getByRole('button',{name:'Abrir menú',exact:true}).waitFor();
   }
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);

   await goto('/dashboard/admin/ingresos');
   await p.getByLabel('Comparación anual equivalente').waitFor();
   const totals=await p.locator('main').count()?p.locator('main'):p;
   await p.getByLabel('Buscar pagos').fill('MM-ANULADO');
   await p.getByText('Sin pagos que coincidan con los filtros.',{exact:true}).waitFor();
   await p.getByLabel('Mostrar anulados').check();
   await p.getByText('Anulado · no suma',{exact:true}).waitFor();
   assert.equal(await p.locator('tbody tr').count(),1);
   const csvAnulado=await download('Exportar ingresos a CSV');
   assert(csvAnulado.includes('MM-ANULADO'));assert(csvAnulado.includes('anulado'));assert(!csvAnulado.includes('90000'));
   await p.getByLabel('Buscar pagos').fill('');await p.getByLabel('Mostrar anulados').uncheck();
   await p.getByLabel('Mes del detalle').selectOption('10');
   assert.equal(await p.locator('tbody tr').count(),1);
   await p.getByLabel('Buscar pagos').fill('@admin-pruebas');
   assert.equal(await p.locator('tbody tr').count(),1);
   // Mes actual: el futuro y el anulado no se suman.
   assert((await totals.innerText()).includes('$12.000')||(await totals.innerText()).includes('$12,000'));
   if(evidence)await p.screenshot({path:evidence+`/ingresos-${mobile?'movil':'escritorio'}.png`,fullPage:true,animations:'disabled'});
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);

   await goto('/dashboard/admin/conciliacion');
   await p.getByLabel('Buscar solicitudes').fill('MM-ANULADO');
   await p.getByText('Sin solicitudes pendientes que coincidan con la búsqueda.',{exact:true}).waitFor();
   assert.equal(await p.getByRole('button',{name:'Confirmar',exact:true}).count(),0);
   assert((await download('Exportar conciliación a CSV')).includes('MM-ANULADO'));
   await p.getByLabel('Buscar solicitudes').fill('@admin-pruebas');
   await p.getByRole('button',{name:'Confirmar',exact:true}).waitFor();
   assert(await p.getByRole('button',{name:'Confirmar',exact:true}).isDisabled());
   await p.getByLabel('Buscar solicitudes').fill('no-existe');
   assert(await p.getByRole('button',{name:'Exportar conciliación a CSV',exact:true}).isDisabled());
   assert.equal(await p.getByText('No hay solicitudes pendientes.',{exact:true}).count(),0);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await context.close();
  }
  const after=await read('/__estado');
  assert.deepEqual(after,before);assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({resultado:'OK',escritorioYMovil:true,comparaciones:true,cohortes:true,busqueda:true,csvSeguro:true,escrituras:0,erroresJS:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

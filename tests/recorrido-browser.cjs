// Navegador → vistas Django reales → SQLite en memoria. No usa producción.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { probarArrastre } = require('./arrastre-recorrido-browser.cjs');
const base = 'http://127.0.0.1:3039';
const api = 'http://127.0.0.1:3040';
const store = { tienda:{id:901,nombre:'Ruta de prueba',zona_horaria:'America/Santiago'},fecha_vencimiento:'2099-12-31',estado:'Activa' };

(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
  const errores = [], operaciones = [];
  async function abrir(role,mobile=false) {
    const fallos = {guardar:false,cargar:false};
    const context = await browser.newContext({viewport:mobile ? {width:390,height:844} : {width:1440,height:1000},hasTouch:mobile,timezoneId:'America/Santiago',serviceWorkers:'block'});
    await context.addInitScript(({role,store}) => {
      localStorage.setItem('authToken','solo-prueba-local');
      localStorage.setItem('tokenTimestamp',String(Date.now()));
      localStorage.setItem('userData',JSON.stringify({id:role==='admin'?1:2,username:role+'-local',is_staff:role==='admin',is_superuser:false}));
      localStorage.setItem('userProfile',JSON.stringify({id:1,tienda:901}));
      localStorage.setItem('selectedStore',JSON.stringify(store));
      localStorage.setItem('cartera_tour_done','1');
      localStorage.setItem('theme','light');
      Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok){ok({coords:{latitude:0,longitude:0}});}}});
    },{role,store});
    await context.route('**/*',async route => {
      const req = route.request(),url=new URL(req.url());
      if (url.origin===base) return route.continue();
      if (url.hostname==='api.carterafinanciera.com') {
        if (url.pathname.startsWith('/tiendas/recorrido/') || url.pathname.startsWith('/ventas/activas/liquidar/')) {
          operaciones.push({role,method:req.method(),path:url.pathname,body:req.postData()});
          if (fallos.cargar && req.method()==='GET' && url.pathname.startsWith('/tiendas/recorrido/')) { fallos.cargar=false; return route.fulfill({status:503,json:{error:'Fallo de carga de prueba.'}}); }
          if (fallos.guardar && req.method()==='PUT') { fallos.guardar=false; return route.fulfill({status:500,json:{error:'Fallo de prueba: reintenta guardar.'}}); }
          const response=await route.fetch({url:api+url.pathname+url.search,headers:{'X-Local-Role':role,'Content-Type':'application/json'},maxRetries:0});
          return route.fulfill({response});
        }
        assert.equal(req.method(),'GET','No se permiten otras escrituras');
        if (url.pathname.startsWith('/tiendas/detail/admin/')) return route.fulfill({json:store});
        return route.fulfill({json:[]});
      }
      return route.abort();
    });
    const page=await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-10T15:00:00Z'));
    page.on('pageerror',e=>errores.push(e.message));
    await page.goto(base+'/dashboard/liquidar');
    await page.getByRole('button',{name:'Organizar recorrido',exact:true}).waitFor();
    await page.getByRole('link',{name:/Cliente 01 Prueba/}).first().waitFor();
    return {context,page,fallos};
  }
  const dialogo = page => page.getByRole('dialog',{name:'Organizar recorrido',exact:true});
  const estado = async () => (await fetch(api+'/__estado')).json();
  const metricas = async page => Promise.all(['Total a cobrar del día','Pendiente por cobrar','Total cobrado del día'].map(label=>page.getByRole('region',{name:label,exact:true}).innerText()));
  try {
    const {page:admin,context:ca,fallos:fallosAdmin}=await abrir('admin');
    const antes=await metricas(admin);
    await probarArrastre(admin,false);
    assert.deepEqual(await estado(),{configuraciones:0,cambios:0});
    await admin.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
    const d=dialogo(admin);
    await d.getByLabel('Buscar cliente o dirección').fill('Cliente 70');
    if (process.env.RECORRIDO_SCREENSHOT) await admin.screenshot({path:process.env.RECORRIDO_SCREENSHOT+'-desktop.png'});
    await d.getByRole('button',{name:'Mover al inicio a Cliente 70 Prueba',exact:true}).click();
    await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    assert.deepEqual(await estado(),{configuraciones:0,cambios:0});
    fallosAdmin.cargar=true;
    await admin.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
    await d.getByText('Fallo de carga de prueba.',{exact:true}).waitFor();
    assert(await d.getByRole('button',{name:'Guardar cambios',exact:true}).isDisabled());
    assert.equal(await d.locator('[data-recorrido-cliente]').count(),0,'No recupera cambios cancelados ni deja guardar datos obsoletos');
    await d.getByRole('button',{name:'Reintentar carga',exact:true}).click();
    await d.getByLabel('Buscar cliente o dirección').fill('Cliente 70');
    assert((await d.locator('[data-recorrido-cliente="70"]').innerText()).startsWith('70\n'));
    await d.getByRole('button',{name:'Cancelar',exact:true}).click();
    await admin.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
    await d.getByLabel('Buscar cliente o dirección').fill('Cliente 70');
    await d.getByRole('button',{name:'Ubicar a Cliente 70 Prueba',exact:true}).click();
    await d.getByLabel('Buscar el cliente de referencia').fill('Cliente 08');
    await d.getByLabel('Cliente de referencia',{exact:true}).selectOption('8');
    await d.getByRole('button',{name:'Aplicar movimiento',exact:true}).click();
    await d.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await d.waitFor({state:'hidden'});
    assert.deepEqual(await estado(),{configuraciones:1,cambios:1});
    assert.deepEqual(await metricas(admin),antes,'El orden no cambia los indicadores');
    await admin.reload();
    await admin.getByRole('link',{name:/Cliente 70 Prueba/}).first().waitFor();
    const enlaces=admin.locator('table tbody a[href^="/dashboard/ventas/"]');
    const nombres=await enlaces.locator(':scope > p:first-child').allTextContents();
    assert(nombres.indexOf('Cliente 70 Prueba')<nombres.indexOf('Cliente 08 Prueba'));

    const {page:worker,context:cw,fallos}=await abrir('worker',true);
    await probarArrastre(worker,true);
    await worker.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
    const dw=dialogo(worker);
    await dw.getByLabel('Buscar cliente o dirección').fill('Cliente 75');
    if (process.env.RECORRIDO_SCREENSHOT) await worker.screenshot({path:process.env.RECORRIDO_SCREENSHOT+'-mobile.png'});
    assert.equal(await dw.locator('[data-recorrido-cliente]').count(),1,'Incluye cliente semanal que hoy no paga');
    await dw.getByLabel('Buscar cliente o dirección').fill('Cliente 70');
    await dw.getByRole('button',{name:'Mover al inicio a Cliente 70 Prueba',exact:true}).click();
    await dw.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await dw.waitFor({state:'hidden'});
    assert.deepEqual(await estado(),{configuraciones:1,cambios:2});
    await worker.reload();
    await worker.getByRole('link',{name:/Cliente 70 Prueba/}).first().waitFor();

    // Dos operadores editan la misma versión: el segundo recibe conflicto.
    await admin.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
    await d.getByLabel('Buscar cliente o dirección').fill('Cliente 69');
    await d.getByRole('button',{name:'Mover al inicio a Cliente 69 Prueba',exact:true}).click();
    await worker.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
    await dw.getByLabel('Buscar cliente o dirección').fill('Cliente 68');
    await dw.getByRole('button',{name:'Mover al inicio a Cliente 68 Prueba',exact:true}).click();
    await d.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await d.waitFor({state:'hidden'});
    await dw.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await dw.getByRole('button',{name:'Recargar orden actual',exact:true}).waitFor();
    assert(await dw.getByRole('button',{name:'Guardar cambios',exact:true}).isDisabled());
    assert.deepEqual(await estado(),{configuraciones:1,cambios:3});
    await dw.getByRole('button',{name:'Recargar orden actual',exact:true}).click();
    await dw.getByLabel('Buscar cliente o dirección').fill('');
    await dw.locator('[data-recorrido-cliente="69"]').waitFor();
    assert.equal(await dw.locator('[data-recorrido-cliente]').first().getAttribute('data-recorrido-cliente'),'69');
    await worker.keyboard.press('Escape');
    await dw.waitFor({state:'hidden'});
    await worker.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
    await dw.getByLabel('Buscar cliente o dirección').fill('Cliente 67');
    await dw.getByRole('button',{name:'Mover al inicio a Cliente 67 Prueba',exact:true}).click();
    fallos.guardar=true;
    await dw.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await dw.getByText('Fallo de prueba: reintenta guardar.',{exact:true}).waitFor();
    assert.deepEqual(await estado(),{configuraciones:1,cambios:3});
    assert((await dw.locator('[data-recorrido-cliente="67"]').innerText()).startsWith('1\n'));
    await dw.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await dw.waitFor({state:'hidden'});
    assert.deepEqual(await estado(),{configuraciones:1,cambios:4});
    for (const [rol,movil] of [['admin',true],['worker',false]]) {
      const {page,context}=await abrir(rol,movil);
      await probarArrastre(page,movil);
      await page.getByRole('button',{name:'Organizar recorrido',exact:true}).click();
      await dialogo(page).getByLabel('Buscar cliente o dirección').fill('Cliente 67');
      assert((await dialogo(page).locator('[data-recorrido-cliente="67"]').innerText()).startsWith('1\n'));
      await dialogo(page).getByRole('button',{name:'Cancelar',exact:true}).click();
      await context.close();
    }
    await probarArrastre(worker,true,{guardar:true});
    assert.deepEqual(await estado(),{configuraciones:1,cambios:5},'Un arrastre solo escribe al guardar');
    assert.equal(await worker.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sin desborde horizontal móvil');
    assert.equal(errores.length,0,errores.join('\n'));
    assert(operaciones.filter(r=>r.method!=='GET').every(r=>r.method==='PUT'&&r.path==='/tiendas/recorrido/t/901/'));
    console.log(JSON.stringify({resultado:'OK',casos:['cancelar sin escribir','mover entre páginas','persistir y recargar','indicadores intactos','ambos roles en móvil y escritorio','cliente semanal no exigible en organizador','conflicto sin sobrescribir','recargar conflicto','fallo al guardar conserva edición','reintentar guardado','Escape','sin errores JS'],estado:await estado(),escrituras:operaciones.filter(r=>r.method==='PUT').length}));
    await ca.close(); await cw.close();
  } finally { await browser.close(); }
})().catch(err=>{console.error(err);process.exitCode=1;});

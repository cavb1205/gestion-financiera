// Navegador → API Django → SQLite en memoria. Nunca escribe en producción.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.SUSCRIPCIONES_FRONTEND || 'http://127.0.0.1:3039';
const api = 'http://127.0.0.1:3041';
const json = async path => (await fetch(api+path)).json();
const estado = () => json('/__estado');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  const errores=[], operaciones=[];
  const inicial=await estado();
  const preservar=async()=>{const s=await estado();for(const k of ['caja','saldo','clientes','recaudos'])assert.equal(s[k],inicial[k],k);return s;};
  async function abrir(role,mobile=false){
    const session=await json('/__sesion/'+role);
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,timezoneId:'America/Santiago',serviceWorkers:'block'});
    await context.addInitScript(({session,role})=>{
      localStorage.setItem('authToken','token-local-ficticio');localStorage.setItem('tokenTimestamp',String(Date.now()));
      localStorage.setItem('userData',JSON.stringify(session.user));localStorage.setItem('userProfile',JSON.stringify(session.profile));
      if(role!=='root')localStorage.setItem('selectedStore',JSON.stringify(session.store));
      localStorage.setItem('cartera_tour_done','1');localStorage.setItem('theme','light');
      Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok){ok({coords:{latitude:0,longitude:0}});}}});
    },{session,role});
    const fallos={post:false,detalle:false};
    await context.route('**/*',async route=>{
      const req=route.request(),u=new URL(req.url());
      if(u.origin===base)return route.continue();
      if(u.hostname==='api.carterafinanciera.com'){
        operaciones.push({role,method:req.method(),path:u.pathname});
        if(fallos.post&&req.method()==='POST'&&u.pathname.endsWith('/admin/vencer/')){fallos.post=false;return route.fulfill({status:503,json:{error:'Fallo de prueba'}});}
        if(fallos.detalle&&req.method()==='GET'&&u.pathname.endsWith('/admin/detalle/')){fallos.detalle=false;return route.fulfill({status:503,json:{error:'Fallo de recarga de prueba'}});}
        if(!u.pathname.startsWith('/tiendas/')&&!u.pathname.startsWith('/ventas/')&&!u.pathname.startsWith('/recaudos/')&&!u.pathname.startsWith('/trabajadores/')&&!u.pathname.startsWith('/clientes/')){
          assert.equal(req.method(),'GET','Escritura inesperada');return route.fulfill({json:[]});
        }
        const response=await route.fetch({url:api+u.pathname+u.search,headers:{...req.headers(),'X-Local-Role':role},maxRetries:0});
        return route.fulfill({response});
      }
      return route.abort();
    });
    const page=await context.newPage();page.on('pageerror',e=>errores.push(e.message));
    await page.clock.setFixedTime(new Date('2026-10-10T15:00:00Z'));
    return{context,page,fallos,session};
  }
  const dialog=p=>p.getByRole('dialog',{name:'Vencer membresía manualmente',exact:true});
  const openDetail=async p=>{
    await p.goto(base+'/dashboard/admin/rutas');
    try { await p.locator('[title="Ver detalle de la ruta"]:visible').first().waitFor({timeout:10000}); }
    catch(err){console.error(JSON.stringify({url:p.url(),texto:await p.locator('body').innerText(),operaciones,errores}));throw err;}
    const row=p.locator('tr:visible').filter({hasText:'Ruta A'});
    if(await row.count())await row.getByTitle('Ver detalle de la ruta').click();
    else await p.locator('[title="Ver detalle de la ruta"]:visible').first().click();
    await p.getByRole('button',{name:'Vencer membresía manualmente',exact:true}).waitFor();
  };
  const renovar=async()=>{
    const s=await json('/__sesion/root');
    const res=await fetch(api+`/tiendas/activate/mounth/${s.store.id}/`,{method:'POST',headers:{'Content-Type':'application/json','X-Local-Role':'root'},body:JSON.stringify({version:s.store.version})});
    assert.equal(res.status,200,await res.text());
  };
  try{
    const admin=await abrir('admin');await admin.page.goto(base+'/dashboard/liquidar');
    await admin.page.getByRole('button',{name:'Organizar recorrido',exact:true}).waitFor();
    const root=await abrir('root');await openDetail(root.page);
    await root.page.getByRole('button',{name:'Vencer membresía manualmente',exact:true}).click();
    let d=dialog(root.page);assert(await d.getByRole('button',{name:'Vencer membresía',exact:true}).isDisabled());
    await d.getByLabel('Motivo obligatorio',{exact:true}).fill('Prueba de corrección');
    await root.page.keyboard.press('Escape');assert.equal(await estado().then(s=>s.cambios),0);
    await root.page.getByRole('button',{name:'Vencer membresía manualmente',exact:true}).click();d=dialog(root.page);
    await d.getByLabel('Motivo obligatorio',{exact:true}).fill('Ruta activada por equivocación');
    await d.getByRole('button',{name:'Vencer membresía',exact:true}).click();
    await d.waitFor({state:'hidden'});let s=await preservar();assert(s.manual);assert.equal(s.cambios,1);assert(s.pagos.every(p=>p.estado==='vigente'));
    await root.page.getByText('Vencida manualmente · sin gracia',{exact:true}).waitFor();
    await admin.page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await admin.page.getByRole('heading',{name:'Acceso Suspendido'}).waitFor();
    assert(await admin.page.evaluate(()=>!!localStorage.getItem('authToken')),'No cerrar cuenta');
    await admin.page.getByRole('button',{name:'Activar / Renovar Plan'}).click();
    await admin.page.getByText(/Tu membresía fue vencida manualmente/).waitFor();
    await admin.context.close();
    // Reactivación real: versión actual y fechas verificadas en el servidor.
    await renovar();await root.page.getByRole('button',{name:'Cerrar detalle',exact:true}).click();await openDetail(root.page);
    await root.page.getByRole('button',{name:'Vencer membresía manualmente',exact:true}).click();d=dialog(root.page);
    await d.getByLabel('Motivo obligatorio',{exact:true}).fill('Ingreso manual de prueba incorrecto');
    await d.getByLabel('Anular también un pago manual registrado por error').check();
    assert(await d.getByRole('button',{name:'Vencer membresía',exact:true}).isDisabled());
    const payment=(await estado()).pagos.filter(p=>p.estado==='vigente').at(-1);
    await d.getByLabel('Pago a anular',{exact:true}).selectOption(String(payment.id));
    await d.getByRole('button',{name:'Vencer membresía',exact:true}).click();await d.waitFor({state:'hidden'});
    s=await preservar();assert.equal(s.pagos.find(p=>p.id===payment.id).estado,'anulado');
    await root.page.getByText('Anulado',{exact:true}).waitFor();
    assert.equal(s.cambios,3);await root.context.close();
    // Móvil: conflicto concurrente, recarga obligatoria y cancelación.
    await renovar();assert.equal((await fetch(api+'/__pendiente',{method:'POST'})).status,201);
    const mobile=await abrir('root',true);await openDetail(mobile.page);
    await mobile.page.getByRole('button',{name:'Vencer membresía manualmente',exact:true}).tap();d=dialog(mobile.page);
    await d.getByLabel('Motivo obligatorio',{exact:true}).fill('Corrección con datos anteriores');
    assert(await d.getByRole('button',{name:'Vencer membresía',exact:true}).isDisabled());
    await d.getByLabel(/Entiendo que estas solicitudes seguirán pendientes/).check();
    await renovar();const before=await estado();
    await d.getByRole('button',{name:'Vencer membresía',exact:true}).tap();
    await d.getByRole('alert').filter({hasText:'La membresía cambió'}).waitFor();
    assert(await d.getByRole('button',{name:'Vencer membresía',exact:true}).isDisabled());assert.deepEqual(await estado(),before);
    await d.getByRole('button',{name:'Recargar detalle',exact:true}).tap();
    await d.getByLabel('Motivo obligatorio',{exact:true}).fill('Corrección de prueba móvil');
    await d.getByLabel(/Entiendo que estas solicitudes seguirán pendientes/).check();
    const bounds=await d.boundingBox();assert(bounds.width<=390&&bounds.x>=0,'Sin desborde en móvil');
    await mobile.page.screenshot({path:'/private/tmp/suscripciones-modal-mobile.png'});
    mobile.fallos.post=true;await d.getByRole('button',{name:'Vencer membresía',exact:true}).tap();
    await d.getByRole('alert').filter({hasText:'Fallo de prueba'}).waitFor();assert.deepEqual(await estado(),before);
    await d.getByRole('button',{name:'Recargar detalle',exact:true}).tap();
    await d.getByLabel('Motivo obligatorio',{exact:true}).fill('Corrección de prueba móvil verificada');
    await d.getByLabel(/Entiendo que estas solicitudes seguirán pendientes/).check();
    mobile.fallos.detalle=true;await d.getByRole('button',{name:'Vencer membresía',exact:true}).tap();
    await d.getByRole('alert').filter({hasText:'El cambio fue registrado'}).waitFor();
    assert((await preservar()).manual);assert(await d.getByRole('button',{name:'Vencer membresía',exact:true}).isDisabled());
    await d.getByRole('button',{name:'Recargar detalle',exact:true}).tap();await d.waitFor({state:'hidden'});
    await mobile.context.close();
    for(const role of ['worker','admin']){
      const u=await abrir(role,true);await u.page.goto(base+'/dashboard/liquidar');
      await u.page.getByRole('heading',{name:'Acceso Suspendido'}).waitFor();
      assert(await u.page.evaluate(()=>!!localStorage.getItem('authToken')));await u.context.close();
    }
    assert.deepEqual(errores,[]);await preservar();
    console.log(JSON.stringify({resultado:'OK',erroresJS:errores.length,solicitudes:operaciones.length,estado:await estado()}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

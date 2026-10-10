// Operaciones solo en la API ficticia localhost:3014 (SQLite en memoria).
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
  const api='http://127.0.0.1:3014';
  const base=process.env.LIQUIDAR_FRONTEND || 'http://127.0.0.1:3013';
  const {store}=await fetch(api+'/pruebas/contexto').then(r=>r.json());
  const evidence=await fetch(api+'/pruebas/evidencia').then(r=>r.json());
  const scheduled=evidence.ventas.find(v=>v.plazo==='Semanal' && v.saldo_actual==='1200000.00' && v.fecha_vencimiento==='2026-11-05');
  assert.ok(scheduled);
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'America/Santiago',serviceWorkers:'block'});
  await context.addInitScript(({store})=>{
    const NativeDate = Date;
    const now = new NativeDate('2026-10-15T16:00:00Z').getTime();
    globalThis.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now; }
    };
    localStorage.setItem('authToken','solo-api-local');
    localStorage.setItem('tokenTimestamp',String(Date.now()));
    localStorage.setItem('liquidarFecha','2026-10-15');
    localStorage.setItem('userData',JSON.stringify({username:'administrador-local',is_staff:true}));
    localStorage.setItem('userProfile','{}');
    localStorage.setItem('selectedStore',JSON.stringify(store));
    localStorage.setItem('cartera_tour_done','1');
  },{store});
  const errors=[],desktopHitChecks=[],requests=[];
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===base) return route.continue();
    if(url.hostname!=='api.carterafinanciera.com' && (url.hostname!=='127.0.0.1'||url.port!=='3014')) return route.abort();
    assert.equal(req.method(),'GET');
    const response=await context.request.get(api+url.pathname+url.search);
    requests.push({path:url.pathname+url.search,status:response.status()});
    return route.fulfill({response});
  });
  const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
  const amount=name=>page.getByRole('region',{name,exact:true}).locator('p').first();
  const money=n=>'$'+new Intl.NumberFormat('es-CL').format(n);
  const check=async (pending,collected)=>{
    await amount('Total a cobrar del día').getByText('$300.000',{exact:true}).waitFor();
    await amount('Pendiente por cobrar').getByText(money(pending),{exact:true}).waitFor();
    await amount('Total cobrado del día').getByText(money(collected),{exact:true}).waitFor();
  };
  try {
    await page.goto(base+'/dashboard/liquidar');
    await check(300000,0);
    const filter=page.getByPlaceholder('Nombre del cliente...');
    await filter.fill('no-existe'); await check(0,0);
    await filter.fill(''); await check(300000,0);
    let collected=0;
    for(const [payment,pending] of [[100000,200000],[500000,0],[600000,0]]) {
      const res=await fetch(api+'/recaudos/create/t/1/',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({venta:scheduled.id,valor_recaudo:payment,fecha_recaudo:'2026-10-15'})});
      assert.equal(res.status,200); collected+=payment;
      await page.reload(); await check(pending,collected);
    }
    // El crédito cancelado desaparece de la lista, no del total de la fecha.
    assert.equal(await page.getByText('Pendiente Prueba',{exact:true}).count(),0);
    await page.getByLabel('Fecha de consulta',{exact:true}).fill('2026-10-16');
    // El bloque informativo sigue retirado.
    assert.equal(await page.getByText(/Los anticipos siguen visibles/).count(),0);
    await amount('Total proyectado').getByText('$0',{exact:true}).waitFor();
    const whatsapp=page.getByRole('link',{name:'WhatsApp: estado de cuenta',exact:true});
    await whatsapp.first().waitFor();
    for(const width of [1440,1280,1024,820,768]) {
      await page.setViewportSize({width,height:1000});
      const links=await whatsapp.filter({visible:true}).all();
      assert.ok(links.length>0,`Debe haber enlace de WhatsApp a ${width}px`);
      for(const link of links) {
        await link.scrollIntoViewIfNeeded();
        const reachable=await link.evaluate(el=>{
          const r=el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
        });
        desktopHitChecks.push({width,reachable});
        assert.ok(reachable,`WhatsApp debe recibir clicks a ${width}px`);
        await link.click({trial:true}); // No navegar a WhatsApp ni enviar mensajes.
      }
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:['base fija tras filtro','base fija tras pago parcial','base fija tras pago doble','base fija tras cancelación','mañana sin cuota: cero','WhatsApp recibe clicks en escritorio'],base:300000,collected,desktopHitChecks,messagesSent:0,pageErrors:errors},null,2));
  } catch(error) {
    console.error(await page.locator('body').innerText());
    console.error(errors);
    console.error(requests);
    console.error(await page.evaluate(()=>({session:localStorage.getItem('selectedStore'),user:localStorage.getItem('userData'),stamp:localStorage.getItem('tokenTimestamp'),now:Date.now()})));
    throw error;
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

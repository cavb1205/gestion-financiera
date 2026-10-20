// Navegador → API real Django → SQLite desechable. Todo acceso externo bloqueado.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base='http://127.0.0.1:3048', api='http://127.0.0.1:3047';
const read=async(path)=>(await fetch(api+path)).json();
(async()=>{
  const before=await read('/__estado');
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  const checks=[],errors=[];
  const session=await read('/__sesion/admin');
  const context=await browser.newContext({viewport:{width:1440,height:1100},
    timezoneId:'America/Santiago',serviceWorkers:'block'});
  await context.addInitScript(s=>{
    if(localStorage.getItem('authToken'))return;
    for(const[k,v]of Object.entries({authToken:'ficticio',tokenTimestamp:String(Date.now()),
      userData:JSON.stringify(s.user),userProfile:JSON.stringify(s.profile),selectedStore:JSON.stringify(s.store),
      cartera_tour_done:'1',theme:'light'}))localStorage.setItem(k,v);
  },session);
  let historialInvalido=false;
  await context.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.origin===base){
      assert(['GET','HEAD'].includes(req.method()));return route.continue();
    }
    if(u.origin!==api)return route.abort();
    if(historialInvalido&&u.pathname.includes('/paginado/')){
      return route.fulfill({status:200,contentType:'application/json',body:'{}'});
    }
    assert(['GET','PUT','PATCH'].includes(req.method()));
    const response=await context.request.fetch(api+u.pathname+u.search,{
      method:req.method(),data:req.postData()||undefined,
      headers:{'Content-Type':'application/json'},failOnStatusCode:false});
    return route.fulfill({response});
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.clock.setFixedTime(new Date('2026-10-10T15:00:00Z'));
  const open=async id=>{
    await p.goto(`${base}/dashboard/ventas/${id}/editar`);
    await p.waitForLoadState('networkidle');
  };
  const guardar=async id=>{
    const response=p.waitForResponse(r=>r.url().includes(`/ventas/${id}/update/`)&&r.request().method()==='PUT');
    await p.getByRole('button',{name:'Sincronizar Cambios'}).click();
    const res=await response;assert.equal(res.status(),200,await res.text());
    await p.waitForURL(`${base}/dashboard/ventas/${id}`);
  };
  try{
    await open(1001);
    assert.equal(await p.getByLabel('Modalidad de pago').inputValue(),'Diario');
    await p.getByLabel('Modalidad de pago').selectOption('Semanal');
    assert.equal(await p.getByLabel('Cuotas',{exact:true}).inputValue(),'4');
    const preview=p.getByRole('region',{name:'Vista previa del plan editado'});
    await preview.getByText('Cambio de modalidad: Diario → Semanal').waitFor();
    assert.match(await preview.innerText(),/300.000/);
    await fs.mkdir('outputs/editar-modalidad',{recursive:true});
    await p.screenshot({path:'outputs/editar-modalidad/editar-semanal-desktop.png',fullPage:true});
    await guardar(1001);
    let estado=await read('/__estado'),v=estado.ventas.find(v=>v.id===1001);
    assert.equal(v.plazo,'Semanal');assert.equal(v.cuotas,4);assert.equal(v.calendario_version,1);
    assert.equal(v.fecha_vencimiento,'2026-11-05');
    checks.push('Diario → Semanal: vista previa, guardado y calendario persistido');
    await open(1001);
    assert.equal(await p.getByLabel('Modalidad de pago').inputValue(),'Semanal');
    await p.getByLabel('Modalidad de pago').selectOption('Mensual');
    assert.equal(await p.getByLabel('Cuotas',{exact:true}).inputValue(),'1');
    await p.setViewportSize({width:390,height:844});
    await p.screenshot({path:'outputs/editar-modalidad/editar-mensual-mobile.png',fullPage:true});
    await p.getByRole('region',{name:'Vista previa del plan editado'}).screenshot({path:'outputs/editar-modalidad/editar-mensual-plan.png'});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await guardar(1001);
    v=(await read('/__estado')).ventas.find(v=>v.id===1001);
    assert.equal(v.plazo,'Mensual');assert.equal(v.cuotas,1);assert.equal(v.fecha_vencimiento,'2026-11-08');
    checks.push('Semanal → Mensual: una cuota y vencimiento mensual; móvil sin desbordamiento');
    await open(1001);
    await p.getByLabel('Modalidad de pago').selectOption('Diario');
    assert.equal(await p.getByLabel('Cuotas',{exact:true}).inputValue(),'20');
    await guardar(1001);
    v=(await read('/__estado')).ventas.find(v=>v.id===1001);
    assert.equal(v.plazo,'Diario');assert.equal(v.calendario_version,0);
    checks.push('Mensual → Diario: vuelve a 20 cuotas y conserva reglas diarias');
    for(const id of [1002,1003]){
      await open(id);assert(await p.getByLabel('Modalidad de pago').isDisabled());
      assert.match(await p.locator('body').innerText(),/abonos o visitas registradas/i);
    }
    await open(1002);
    await p.getByLabel('Cuotas',{exact:true}).fill('21');
    await p.getByLabel('Motivo de la corrección').fill('Corrección de prueba con pagos intactos');
    const correccion=p.waitForResponse(r=>r.url().includes('/ventas/1002/correccion-administrativa/')&&r.request().method()==='PATCH');
    await p.getByRole('button',{name:'Registrar corrección'}).click();
    const respuestaCorreccion=await correccion;
    assert.equal(respuestaCorreccion.status(),200,await respuestaCorreccion.text());
    assert(!Object.hasOwn(respuestaCorreccion.request().postDataJSON(),'plazo'));
    await p.waitForURL(`${base}/dashboard/ventas/1002`);
    assert.equal((await read('/__estado')).ventas.find(v=>v.id===1002).plazo,'Diario');
    checks.push('Corrección con abonos sigue operando: fecha/cuotas/motivo sin enviar ni modificar modalidad');
    checks.push('Abonos y visitas bloquean selector; corrección existente no incluye modalidad');
    await open(1004);
    const historico=p.getByRole('region',{name:'Vista previa del plan editado'});
    assert.match(await historico.innerText(),/histórico de pagos cada 30 días/);
    assert.match(await historico.innerText(),/2 mar 2026/);
    checks.push('Mensual histórico conserva calendario de 30 días en la vista previa');
    await open(1005);
    await p.getByRole('heading',{name:'No se puede editar este crédito'}).waitFor();
    assert.equal(await p.getByLabel('Modalidad de pago').count(),0);
    checks.push('Crédito de otra ruta: no se muestra el formulario');
    historialInvalido=true;await open(1001);
    await p.getByRole('heading',{name:'No se puede editar este crédito'}).waitFor();
    assert.equal(await p.getByRole('button',{name:'Sincronizar Cambios'}).count(),0);
    historialInvalido=false;
    checks.push('Historial no verificable: edición bloqueada, no se supone cero movimientos');
    await open(1006);
    await p.getByLabel('Modalidad de pago').selectOption('Semanal');
    await fetch(api+'/__movimiento/1006',{method:'POST'});
    const conflicto=p.waitForResponse(r=>r.url().includes('/ventas/1006/update/')&&r.request().method()==='PUT');
    await p.getByRole('button',{name:'Sincronizar Cambios'}).click();
    assert.equal((await conflicto).status(),409);
    await p.getByText(/Esta venta tiene recaudos/).first().waitFor();
    checks.push('Movimiento posterior a abrir formulario: servidor rechaza guardado con 409');
    const after=await read('/__estado');
    assert.deepEqual(after.caja,before.caja);assert.equal(after.movimientos,before.movimientos);
    for(const original of before.ventas){
      const actual=after.ventas.find(v=>v.id===original.id);
      for(const campo of ['valor_venta','interes','saldo_actual'])assert.equal(actual[campo],original[campo]);
    }
    assert.deepEqual(after.recaudos.filter(r=>r.venta_id!==1006),before.recaudos);
    assert.deepEqual(errors,[]);
    const result={checks,errors,cajaCapitalTasaYPagosIntactos:true,soloDatosFicticios:true};
    await fs.writeFile('outputs/editar-modalidad/verificacion.json',JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

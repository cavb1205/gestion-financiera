// Navegador → API Django → SQLite en memoria; toda otra red está bloqueada.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = 'http://127.0.0.1:3051', api = 'http://127.0.0.1:3050';
const estado = async () => (await fetch(api + '/__estado')).json();
(async () => {
  const before = await estado();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const checks = [], errors = [];
  async function crearContexto(rol, width = 1440) {
    const sesion = await (await fetch(api + '/__sesion/' + rol)).json();
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, timezoneId: 'America/Santiago',
      serviceWorkers: 'block', permissions: ['geolocation'], geolocation: { latitude: -33.45, longitude: -70.66 } });
    await ctx.addInitScript(s => {
      if (localStorage.getItem('authToken')) return;
      for (const [key, value] of Object.entries({ authToken: 'ficticio', tokenTimestamp: String(Date.now()),
        userData: JSON.stringify(s.user), userProfile: JSON.stringify(s.profile), selectedStore: JSON.stringify(s.store),
        liquidarFecha: '2026-10-15', cartera_tour_done: '1', theme: 'light' })) localStorage.setItem(key, value);
    }, sesion);
    await ctx.route('**/*', async route => {
      const req = route.request(), u = new URL(req.url());
      if (u.origin === base && ['GET', 'HEAD'].includes(req.method())) return route.continue();
      if (u.origin !== api) return route.abort();
      assert(['GET', 'POST'].includes(req.method()));
      const response = await ctx.request.fetch(u.href, { method: req.method(), data: req.postData() || undefined,
        headers: { 'Content-Type': 'application/json', 'X-Prueba-Rol': rol } });
      return route.fulfill({ response });
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-10-15T16:00:00Z'));
    return { ctx, page };
  }
  const { ctx, page: p } = await crearContexto('admin');
  const importe = nombre => p.getByRole('region', { name: nombre, exact: true }).locator('p').first();
  const dinero = n => '$' + new Intl.NumberFormat('es-CL').format(n);
  const comprobarImportes = async (pendiente, cobrado = 0) => {
    await importe('Total a cobrar del día').getByText(dinero(1560000), { exact: true }).waitFor();
    await importe('Pendiente por cobrar').getByText(dinero(pendiente), { exact: true }).waitFor();
    await importe('Total cobrado del día').getByText(dinero(cobrado), { exact: true }).waitFor();
  };
  const sinPestanas = async page => {
    assert.equal(await page.getByRole('group', { name: 'Estado del recorrido' }).count(), 0);
    assert.equal(await page.getByRole('button', { name: /^Gestionados|^Por gestionar/ }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Ver clientes con abono o falla' }).count(), 0);
  };
  const fila = nombre => p.locator('tbody tr').filter({ hasText: nombre + ' Prueba' });
  try {
    await p.goto(base + '/dashboard/liquidar');
    await comprobarImportes(1560000);
    await sinPestanas(p);
    assert.equal(await p.locator('tbody tr').count(), 4);
    assert.equal(await fila('Sin vencimiento').count(), 0);
    for (const [i, nombre, id] of [[0, 'Semanal', 1001], [1, 'Mensual', 1002], [2, 'Diario', 1003]]) {
      await fila(nombre).getByRole('button', { name: 'Reportar falla', exact: true }).click();
      await p.waitForURL(base + '/dashboard/liquidar/reportar');
      const respuesta = p.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/recaudos/create/nopay/'));
      await p.getByRole('button', { name: 'Reportar Incidencia', exact: true }).click();
      assert.equal((await respuesta).status(), 200);
      await p.waitForURL(base + '/dashboard/liquidar');
      await comprobarImportes(1560000);
      assert.equal(await fila(nombre).count(), 0);
      assert.equal(await p.locator('tbody tr').count(), 3 - i);
      await sinPestanas(p);
      const duplicate = await fetch(api + '/recaudos/create/nopay/t/901/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venta: id, fecha_recaudo: '2026-10-15', visita_blanco: { tipo_falla: 'Otro Motivo', comentario: 'Duplicada ficticia' } }) });
      assert.equal(duplicate.status, 409);
    }
    checks.push('Una sola lista sin pestañas ni accesos duplicados; fallas en las tres modalidades retiran el crédito de esa fecha');
    checks.push('El servidor sigue rechazando fallas duplicadas con HTTP 409');
    const despuesFallas = await estado();
    assert.deepEqual(despuesFallas.caja, before.caja);
    assert.deepEqual(despuesFallas.ventas, before.ventas);
    assert.equal(despuesFallas.movimientos, before.movimientos);
    assert.equal(despuesFallas.fallas, 3);
    checks.push('Fallas conservan caja, saldos, capital, tasa, meta del día y deuda pendiente');

    await p.getByPlaceholder('Nombre del cliente...').fill('Semanal');
    await comprobarImportes(300000);
    assert.equal(await fila('Semanal').count(), 0);
    await p.getByPlaceholder('Nombre del cliente...').fill('');
    await comprobarImportes(1560000);
    checks.push('La deuda del cliente con falla sigue en el pendiente filtrado aunque no aparezca en la lista');

    await p.getByRole('link', { name: 'Recaudos', exact: true }).filter({ visible: true }).click();
    await p.waitForURL(base + '/dashboard/recaudos');
    await fila('Semanal').waitFor();
    await fila('Mensual').waitFor();
    await fila('Diario').waitFor();
    checks.push('El menú Recaudos existente muestra las tres fallas del día');
    await fila('Semanal').getByRole('link').filter({ hasText: 'Semanal Prueba' }).click();
    await p.waitForURL(base + '/dashboard/ventas/1001');
    await p.getByRole('button', { name: 'Registrar Abono', exact: true }).click();
    await p.waitForURL(base + '/dashboard/liquidar/abonar');
    await p.getByLabel('Monto del Recaudo').fill('100000');
    const pago = p.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/recaudos/create/t/901/'));
    await p.getByRole('button', { name: 'Registrar Recaudo', exact: true }).click();
    assert.equal((await pago).status(), 200);
    await p.waitForURL(base + '/dashboard/liquidar');
    await comprobarImportes(1460000, 100000);
    assert.equal(await fila('Semanal').count(), 0);
    checks.push('Recaudos → detalle del crédito → agregar pago permite otro abono; solo ese dinero reduce la deuda');

    await p.setViewportSize({ width: 390, height: 844 });
    await sinPestanas(p);
    await p.getByText('Adelantado Prueba', { exact: true }).filter({ visible: true }).waitFor();
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await fs.mkdir('outputs/liquidar-lista-simple', { recursive: true });
    for (const boton of await p.locator('.Toastify__close-button').all()) await boton.click();
    await p.getByPlaceholder('Nombre del cliente...').scrollIntoViewIfNeeded();
    await p.screenshot({ path: 'outputs/liquidar-lista-simple/liquidar-movil.png', animations: 'disabled' });
    checks.push('Móvil sin pestañas, sin controles duplicados y sin desbordamiento horizontal');

    const { ctx: workerContext, page: w } = await crearContexto('worker', 390);
    await w.goto(base + '/dashboard/liquidar');
    await w.getByText('Adelantado Prueba', { exact: true }).filter({ visible: true }).waitFor();
    await sinPestanas(w);
    assert.equal(await w.getByText('Semanal Prueba', { exact: true }).filter({ visible: true }).count(), 0);
    await workerContext.close();
    checks.push('Trabajador conserva una lista simple con los anticipos sin registro del día');

    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.getByLabel('Fecha de consulta', { exact: true }).fill('2026-10-14');
    await importe('Total a cobrar del día').getByText('$60.000', { exact: true }).waitFor();
    assert.equal(await fila('Semanal').count(), 0);
    checks.push('Consultar otra fecha no arrastra la gestión de hoy');
    await fetch(api + '/__dia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha: '2026-10-16' }) });
    await p.clock.setFixedTime(new Date('2026-10-16T16:00:00Z'));
    await p.evaluate(() => localStorage.setItem('liquidarFecha', '2026-10-16'));
    await p.reload();
    await fila('Semanal').waitFor();
    assert(await fila('Semanal').getByRole('button', { name: 'Reportar falla', exact: true }).isEnabled());
    await sinPestanas(p);
    checks.push('Día siguiente: deuda sin cubrir vuelve a la lista y permite una nueva visita');
    const after = await estado();
    for (const v of before.ventas) {
      const actual = after.ventas.find(a => a.id === v.id);
      for (const key of ['valor_venta', 'interes', 'plazo', 'cuotas']) assert.equal(actual[key], v[key]);
    }
    assert.deepEqual(errors, []);
    const resultado = { checks, errors, soloDatosFicticios: true, notificacionesReales: 0 };
    await fs.writeFile('outputs/liquidar-lista-simple/verificacion.json', JSON.stringify(resultado, null, 2));
    console.log(JSON.stringify(resultado));
  } catch (error) {
    console.error((await p.locator('body').innerText()).slice(0, 12000));
    console.error(errors);
    throw error;
  } finally { await ctx.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

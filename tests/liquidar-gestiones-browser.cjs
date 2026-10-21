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
  const grupo = (page, nombre) => page.getByRole('group', { name: 'Estado del recorrido' }).getByRole('button', { name: new RegExp('^' + nombre) });
  const fila = nombre => p.locator('tbody tr').filter({ hasText: nombre + ' Prueba' });
  try {
    await p.goto(base + '/dashboard/liquidar');
    await comprobarImportes(1560000);
    await grupo(p, 'Por gestionar 4').waitFor();
    assert.equal(await fila('Sin vencimiento').count(), 0);
    for (const [i, nombre, id] of [[0, 'Semanal', 1001], [1, 'Mensual', 1002], [2, 'Diario', 1003]]) {
      await fila(nombre).getByRole('button', { name: 'Reportar falla', exact: true }).click();
      await p.waitForURL(base + '/dashboard/liquidar/reportar');
      const respuesta = p.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/recaudos/create/nopay/'));
      await p.getByRole('button', { name: 'Reportar Incidencia', exact: true }).click();
      assert.equal((await respuesta).status(), 200);
      await p.waitForURL(base + '/dashboard/liquidar');
      await grupo(p, `Por gestionar ${3 - i}`).waitFor();
      assert.equal(await fila(nombre).count(), 0);
      await comprobarImportes(1560000);
      await grupo(p, `Gestionados ${i + 1}`).click();
      await fila(nombre).waitFor();
      assert(await fila(nombre).getByRole('button', { name: 'Falla ya registrada en esta fecha' }).isDisabled());
      assert(await fila(nombre).getByRole('button', { name: /^Abonar/ }).isEnabled());
      const duplicate = await fetch(api + '/recaudos/create/nopay/t/901/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venta: id, fecha_recaudo: '2026-10-15', visita_blanco: { tipo_falla: 'Otro Motivo', comentario: 'Duplicada ficticia' } }) });
      assert.equal(duplicate.status, 409);
      await grupo(p, `Por gestionar ${3 - i}`).click();
    }
    checks.push('Fallas diaria/semanal/mensual pasan a Gestionados y desaparecen de Por gestionar');
    checks.push('Falla duplicada deshabilitada en la interfaz y rechazada con HTTP 409 en API');
    const despuesFallas = await estado();
    assert.deepEqual(despuesFallas.caja, before.caja);
    assert.deepEqual(despuesFallas.ventas, before.ventas);
    assert.equal(despuesFallas.movimientos, before.movimientos);
    assert.equal(despuesFallas.fallas, 3);
    checks.push('Fallas conservan caja, saldos, capital, tasa, meta del día y deuda pendiente');

    await grupo(p, 'Gestionados 3').click();
    await p.getByPlaceholder('Nombre del cliente...').fill('Semanal');
    await comprobarImportes(300000);
    await grupo(p, 'Por gestionar 0').click();
    await comprobarImportes(300000);
    await grupo(p, 'Gestionados 1').click();
    await p.getByPlaceholder('Nombre del cliente...').fill('');
    await comprobarImportes(1560000);
    checks.push('Filtro de cliente afecta deuda; cambiar grupo no altera indicadores financieros');

    await fila('Semanal').getByRole('button', { name: 'Abonar', exact: true }).click();
    await p.waitForURL(base + '/dashboard/liquidar/abonar');
    await p.getByLabel('Monto del Recaudo').fill('100000');
    const pago = p.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/recaudos/create/t/901/'));
    await p.getByRole('button', { name: 'Registrar Recaudo', exact: true }).click();
    assert.equal((await pago).status(), 200);
    await p.waitForURL(base + '/dashboard/liquidar');
    await comprobarImportes(1460000, 100000);
    checks.push('Se puede abonar después de una falla desde Gestionados; deuda baja solo por dinero recibido');

    await p.setViewportSize({ width: 390, height: 844 });
    await grupo(p, 'Gestionados 3').click();
    assert(await p.getByRole('button', { name: 'Falla ya registrada en esta fecha' }).filter({ visible: true }).first().isDisabled());
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await fs.mkdir('outputs/liquidar-gestiones', { recursive: true });
    await p.getByRole('group', { name: 'Estado del recorrido' }).scrollIntoViewIfNeeded();
    await p.screenshot({ path: 'outputs/liquidar-gestiones/gestionados-movil.png' });
    checks.push('Vista móvil: grupos accesibles, falla bloqueada y sin desbordamiento horizontal');

    const { ctx: workerContext, page: w } = await crearContexto('worker', 390);
    await w.goto(base + '/dashboard/liquidar');
    await grupo(w, 'Por gestionar 1').waitFor();
    await w.getByText('Adelantado Prueba', { exact: true }).filter({ visible: true }).waitFor();
    await grupo(w, 'Gestionados 3').click();
    await w.getByText('Semanal Prueba', { exact: true }).filter({ visible: true }).waitFor();
    await workerContext.close();
    checks.push('Trabajador ve ambos grupos de su ruta y anticipos siguen disponibles en Por gestionar');

    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.getByLabel('Fecha de consulta', { exact: true }).fill('2026-10-14');
    await grupo(p, 'Por gestionar').waitFor();
    await grupo(p, 'Gestionados').click();
    assert.equal(await fila('Semanal').count(), 0);
    checks.push('Consultar otra fecha no arrastra la gestión de hoy');
    await fetch(api + '/__dia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha: '2026-10-16' }) });
    await p.clock.setFixedTime(new Date('2026-10-16T16:00:00Z'));
    await p.evaluate(() => localStorage.setItem('liquidarFecha', '2026-10-16'));
    await p.reload();
    await fila('Semanal').waitFor();
    assert(await fila('Semanal').getByRole('button', { name: 'Reportar falla', exact: true }).isEnabled());
    await grupo(p, 'Gestionados 0').waitFor();
    checks.push('Día siguiente: deuda sin cubrir vuelve a Por gestionar y permite una nueva visita');
    const after = await estado();
    for (const v of before.ventas) {
      const actual = after.ventas.find(a => a.id === v.id);
      for (const key of ['valor_venta', 'interes', 'plazo', 'cuotas']) assert.equal(actual[key], v[key]);
    }
    assert.deepEqual(errors, []);
    const resultado = { checks, errors, soloDatosFicticios: true, notificacionesReales: 0 };
    await fs.writeFile('outputs/liquidar-gestiones/verificacion.json', JSON.stringify(resultado, null, 2));
    console.log(JSON.stringify(resultado));
  } catch (error) {
    console.error((await p.locator('body').innerText()).slice(0, 12000));
    console.error(errors);
    throw error;
  } finally { await ctx.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

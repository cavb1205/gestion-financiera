// Verifica la presentación de Liquidar con Django local y datos ficticios; solo GET.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.LIQUIDAR_FRONTEND || 'http://127.0.0.1:3039';
const api = 'http://127.0.0.1:3041';
const json = async path => (await fetch(api + path)).json();

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const errors = [], writes = [], results = [];
  try {
    const before = await json('/__estado');
    for (const [role, mobile] of [['admin', false], ['worker', true]]) {
      const session = await json('/__sesion/' + role);
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, hasTouch: mobile, timezoneId: 'America/Santiago', serviceWorkers: 'block' });
      await context.addInitScript(session => {
        localStorage.setItem('authToken', 'token-local-ficticio');
        localStorage.setItem('tokenTimestamp', String(Date.now()));
        localStorage.setItem('userData', JSON.stringify(session.user));
        localStorage.setItem('userProfile', JSON.stringify(session.profile));
        localStorage.setItem('selectedStore', JSON.stringify(session.store));
        localStorage.setItem('cartera_tour_done', '1');
        Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(ok) { ok({ coords: { latitude: 0, longitude: 0 } }); } } });
      }, session);
      await context.route('**/*', async route => {
        const req = route.request(), url = new URL(req.url());
        if (req.method() !== 'GET') { writes.push(url.pathname); return route.abort(); }
        if (url.origin === base) return route.continue();
        if (url.hostname === 'api.carterafinanciera.com') {
          if (/^\/(tiendas|ventas|recaudos|clientes|trabajadores)\//.test(url.pathname)) {
            const response = await route.fetch({ url: api + url.pathname + url.search, headers: { ...req.headers(), 'X-Local-Role': role } });
            return route.fulfill({ response });
          }
          return route.fulfill({ json: [] });
        }
        return route.abort();
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-10-10T19:00:00Z'));
      assert.equal((await page.goto(base + '/dashboard/liquidar')).status(), 200);
      await page.getByRole('button', { name: 'Organizar recorrido', exact: true }).waitFor();
      await page.getByRole('region', { name: 'Total a cobrar del día', exact: true }).waitFor();
      await page.waitForFunction(() => {
        const region = document.querySelector('[role="region"][aria-label="Pendiente por cobrar"]');
        return Number((region?.querySelector('p')?.textContent || '').replace(/[^\d-]/g, '')) > 0;
      });
      assert.equal(await page.getByText(/Los anticipos siguen visibles/).count(), 0);
      assert.equal(await page.getByText(/gestiones obligatorias pendientes/).count(), 0);
      const money = async name => Number((await page.getByRole('region', { name, exact: true }).locator('p').first().innerText()).replace(/[^\d-]/g, ''));
      const total = await money('Total a cobrar del día'), collected = await money('Total cobrado del día'), pending = await money('Pendiente por cobrar');
      assert(pending > 0, 'Fixture con deuda');
      assert.equal(total, pending + collected, 'Fórmula publicada preservada');
      await page.getByLabel('Buscar Cliente', { exact: true }).fill('cliente-inexistente');
      assert.equal(await money('Pendiente por cobrar'), 0);
      assert.equal(await money('Total a cobrar del día'), total);
      assert.equal(await money('Total cobrado del día'), collected);
      await page.getByLabel('Buscar Cliente', { exact: true }).fill('');
      if (role === 'admin') {
        await page.getByLabel('Fecha de consulta', { exact: true }).fill('2026-10-11');
        await page.getByRole('region', { name: 'Total proyectado', exact: true }).waitFor();
        assert.equal(await page.getByText(/Los anticipos siguen visibles/).count(), 0);
        const whatsapp = page.locator('a[aria-label="WhatsApp: estado de cuenta"]:visible').first();
        // Consultar no abre WhatsApp ni envía mensajes.
        assert((await whatsapp.getAttribute('href'))?.startsWith('https://'));
      }
      results.push({ role, viewport: mobile ? 'mobile' : 'desktop', bloque_retirado: true, totales_y_filtros: 'OK' });
      await context.close();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(await json('/__estado'), before);
    console.log(JSON.stringify({ resultado: 'OK', erroresJS: errors.length, escrituras: writes.length, resultados: results }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

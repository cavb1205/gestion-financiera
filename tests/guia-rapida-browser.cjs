// Guía local, sin autenticación, API externa ni mutaciones de negocio.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.GUIA_FRONTEND || 'http://127.0.0.1:3052';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const errors = [], apiRequests = [], results = [];
  try {
    for (const scenario of [
      { name: 'desktop', viewport: { width: 1440, height: 1000 }, dark: false },
      { name: 'mobile-dark', viewport: { width: 390, height: 844 }, dark: true },
    ]) {
      const context = await browser.newContext({ viewport: scenario.viewport, hasTouch: scenario.name.startsWith('mobile'), serviceWorkers: 'block' });
      await context.addInitScript(dark => {
        localStorage.setItem('theme', dark ? 'dark' : 'light');
      }, scenario.dark);
      await context.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin === base && request.method() === 'GET') return route.continue();
        if (url.hostname === 'api.carterafinanciera.com') apiRequests.push(url.pathname);
        return route.abort();
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(base + '/guia-rapida');
      assert.equal(response.status(), 200);
      await page.getByRole('heading', { name: 'Trabaja con claridad. Controla la cartera a tiempo.' }).waitFor();
      assert.equal(await page.locator('article.guide-card').count(), 16);
      const assertPublicGuide = async () => {
        assert.doesNotMatch(await page.locator('body').innerText(), /\broot\b|superusuario|Vencer membresía manualmente|Anular también un pago manual/i);
        assert.equal(await page.locator('a[href^="/dashboard/admin/"]').count(), 0);
        assert.equal(await page.getByRole('button', { name: 'Root', exact: true }).count(), 0);
      };
      await assertPublicGuide();
      const index = page.getByRole('navigation', { name: 'Índice de la guía' });
      async function verifyIndex() {
        const ids = await page.locator('article.guide-card').evaluateAll(nodes => nodes.map(node => '#' + node.id));
        const links = await index.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
        assert.deepEqual(links, ids, 'El índice no enlaza secciones ocultas');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Sin desbordamiento horizontal de página');
      }
      await verifyIndex();
      const faq = page.getByRole('button', { name: /Problemas frecuentes/ });
      assert.equal(await faq.getAttribute('aria-expanded'), 'false');
      await faq.click();
      assert.equal(await faq.getAttribute('aria-expanded'), 'true');
      await page.getByText('¿El mensual nuevo siempre vence a los 30 días?', { exact: true }).waitFor();
      await assertPublicGuide();
      await faq.click();
      for (const [label, count, expected, excluded] of [
        ['Trabajador', 10, 'jornada', 'interpretar-utilidad'],
        ['Administrador', 16, 'interpretar-utilidad', 'membresias-root'],
      ]) {
        await page.getByRole('button', { name: label, exact: true }).click();
        assert.equal(await page.locator('article.guide-card').count(), count);
        assert.equal(await page.locator('#' + expected).count(), 1);
        assert.equal(await page.locator('#' + excluded).count(), 0);
        assert.equal(await page.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed'), 'true');
        await verifyIndex();
        await assertPublicGuide();
      }
      await page.locator('#membresias').scrollIntoViewIfNeeded();
      if (scenario.dark) await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.screenshot({ path: `outputs/guia-${scenario.name}-membresias.png` });
      await page.getByRole('button', { name: 'Toda la guía', exact: true }).click();
      await verifyIndex();
      await page.locator('#nueva-venta').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `outputs/guia-${scenario.name}-calendario.png` });
      await page.emulateMedia({ media: 'print' });
      assert.equal(await page.locator('article.guide-card:visible').count(), 16);
      await assertPublicGuide();
      assert.equal(await index.isVisible(), false);
      results.push({ scenario: scenario.name, sections: 16, publicOnly: true, filters: 'OK', index: 'OK', faq: 'OK', print: 'OK' });
      await context.close();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(apiRequests, []);
    console.log(JSON.stringify({ resultado: 'OK', erroresJS: errors.length, solicitudesAPI: apiRequests.length, scenarios: results }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

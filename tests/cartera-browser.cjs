// Chrome → API Django → SQLite ficticia. Ninguna escritura permitida.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = process.env.CARTERA_BASE || "http://127.0.0.1:3039";
const api = "http://127.0.0.1:3043";
const read = async (path) => (await fetch(api + path)).json();
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
  });
  const errors = [],
    checks = [],
    before = await read("/__estado");
  try {
    for (const mobile of [false, true]) {
      const session = await read("/__sesion/admin");
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
        timezoneId: "America/Santiago",
        serviceWorkers: "block",
        acceptDownloads: true,
      });
      await context.addInitScript((s) => {
        if (localStorage.getItem("authToken")) return;
        for (const [k, v] of Object.entries({
          authToken: "ficticio",
          tokenTimestamp: String(Date.now()),
          userData: JSON.stringify(s.user),
          userProfile: JSON.stringify(s.profile),
          selectedStore: JSON.stringify(s.store),
          cartera_tour_done: "1",
          theme: "light",
        }))
          localStorage.setItem(k, v);
      }, session);
      let fault = "",
        auditFault = "",
        delay = false;
      await context.route("**/*", async (route) => {
        const req = route.request(),
          u = new URL(req.url());
        if (u.origin === base) {
          assert(["GET", "HEAD"].includes(req.method()));
          return route.continue();
        }
        if (
          !(
            u.origin === api || u.origin === "https://api.carterafinanciera.com"
          )
        )
          return route.abort();
        assert.equal(req.method(), "GET");
        if (u.pathname.startsWith("/ventas/activas/") && fault) {
          const f = fault;
          fault = "";
          return route.fulfill({
            status: f === "http" ? 503 : 200,
            contentType: "application/json",
            body: f === "empty" ? "[]" : "{}",
          });
        }
        if (u.pathname.includes("/inconsistencias/") && auditFault) {
          const f = auditFault;
          auditFault = "";
          if (f === "network") return route.abort();
          return route.fulfill({
            status: f === "http" ? 503 : 200,
            contentType: "application/json",
            body: "{}",
          });
        }
        if (u.pathname.startsWith("/ventas/activas/") && delay) {
          delay = false;
          await new Promise((r) => setTimeout(r, 500));
        }
        const response = await context.request.get(
          api + u.pathname + u.search,
          { headers: { "X-Local-Role": "admin" } },
        );
        return route.fulfill({ response });
      });
      const p = await context.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.clock.setFixedTime(new Date("2026-10-10T15:00:00Z"));
      const goto = async (path) => {
        await p.goto(base + path);
        await p.waitForLoadState("networkidle");
      };
      const report = () => goto("/dashboard/reportes/cartera");
      const summary = p.getByLabel("Resumen de cartera");
      const clients = p.getByLabel("Clientes por atender", { exact: true });
      await report();
      await summary.waitFor();
      assert.equal(
        await p.getByText("Cuotas equivalentes vencidas").count(),
        0,
      );
      assert.equal(await clients.locator("article").count(), 15);
      const initial = await summary.innerText();
      await clients
        .getByRole("button", { name: "Siguiente", exact: true })
        .click();
      await clients.getByText("Página 2 de 2").waitFor();
      assert((await clients.locator("article").count()) > 10);
      await p.getByLabel("Buscar cliente", { exact: true }).fill("combinado");
      assert.equal(await clients.locator("article").count(), 2);
      assert.equal(await summary.innerText(), initial);
      const combined = clients
        .locator("article")
        .filter({ hasText: "2 créditos activos" });
      assert.equal(await combined.count(), 1);
      const href = await combined.getByRole("link").getAttribute("href");
      assert.match(href, /\?cliente=\d+$/);
      await combined.getByRole("link").click();
      await p
        .getByText(/Mostrando todos los créditos activos del cliente/)
        .waitFor();
      await p.waitForLoadState("networkidle");
      await p
        .getByRole('link', { name: /Cliente combinado/ })
        .first()
        .waitFor();
      const creditIds = await p
        .locator('a[href^="/dashboard/ventas/"]')
        .evaluateAll((links) => [
          ...new Set(
            links
              .map((a) => a.getAttribute("href"))
              .filter((h) => /^\/dashboard\/ventas\/\d+$/.test(h)),
          ),
        ]);
      assert.equal(creditIds.length, 2);
      await report();
      await p
        .getByRole("link", { name: /Riesgo crítico/ })
        .first()
        .click();
      await p.waitForURL("**/dashboard/ventas?filtro=riesgo_3");
      await p.waitForLoadState("networkidle");
      assert.match(p.url(), /filtro=riesgo_3/);
      await p.waitForFunction(
        () =>
          document.querySelector('select:has(option[value="riesgo_3"])')
            ?.value === "riesgo_3",
      );
      await report();
      const audit = p.getByLabel("Control de datos de la ruta");
      await audit.getByText(/105 casos por revisar/).waitFor();
      await audit.getByText("Ver casos de esta ruta", { exact: true }).click();
      await audit.getByText(/Mostrando 100 de 105/).waitFor();
      assert.equal(await audit.getByRole("link").count(), 100);
      assert.equal(await audit.locator('a[href*="alertas"]').count(), 0);
      const download = p.waitForEvent("download");
      await p.getByRole("button", { name: "Exportar CSV" }).click();
      const d = await download,
        contents = await fs.readFile(await d.path(), "utf8");
      assert.match(contents, /'=SUM\(A1\)/);
      for (const f of ["network", "malformed", "http"]) {
        auditFault = f;
        await p.getByRole("button", { name: "Actualizar cartera" }).click();
        await audit.getByRole("alert").waitFor();
        await summary.waitFor();
        assert.equal(await audit.getByText(/Sin inconsistencias/).count(), 0);
      }
      for (const f of ["http", "malformed"]) {
        fault = f;
        await p.getByRole("button", { name: "Actualizar cartera" }).click();
        await p.getByRole("button", { name: "Reintentar" }).waitFor();
        assert.equal(
          await p.getByText("Sin cartera activa", { exact: true }).count(),
          0,
        );
        assert(
          await p.getByRole("button", { name: "Exportar CSV" }).isDisabled(),
        );
        await p.getByRole("button", { name: "Reintentar" }).click();
        await summary.waitFor();
      }
      delay = true;
      await p.getByRole("button", { name: "Actualizar cartera" }).click();
      assert(
        await p.getByRole("button", { name: "Exportar CSV" }).isDisabled(),
      );
      await summary.waitFor();
      fault = "empty";
      await p.getByRole("button", { name: "Actualizar cartera" }).click();
      await p.getByText("Sin cartera activa", { exact: true }).waitFor();
      await p.getByRole("button", { name: "Actualizar cartera" }).click();
      await summary.waitFor();
      // Una navegación de ruta no puede dejar datos del reporte anterior.
      await p.evaluate((s) => {
        s.store.tienda.id = 902;
        s.store.tienda.nombre = "Ruta B";
        localStorage.setItem("selectedStore", JSON.stringify(s.store));
      }, session);
      await report();
      await clients
        .getByText("Exclusivo ruta B Álvarez", { exact: false })
        .waitFor();
      assert.equal(
        await clients
          .getByText("Cliente combinado Álvarez", { exact: true })
          .count(),
        0,
      );
      await p.evaluate(
        (s) => localStorage.setItem("selectedStore", JSON.stringify(s.store)),
        session,
      );
      await report();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
      );
      if (process.env.CARTERA_EVIDENCE) {
        await fs.mkdir(process.env.CARTERA_EVIDENCE, { recursive: true });
        await p.screenshot({
          path: `${process.env.CARTERA_EVIDENCE}/cartera-${mobile ? "movil" : "escritorio"}.png`,
          fullPage: true,
        });
      }
      checks.push(mobile ? "móvil" : "escritorio");
      await context.close();
    }
    // Administrador distinto: control de su ruta, sin depender de Alertas privadas.
    const session = await read("/__sesion/other");
    const context = await browser.newContext({ serviceWorkers: "block" });
    await context.addInitScript((s) => {
      localStorage.setItem("authToken", "ficticio");
      localStorage.setItem("tokenTimestamp", String(Date.now()));
      localStorage.setItem("userData", JSON.stringify(s.user));
      localStorage.setItem("selectedStore", JSON.stringify(s.store));
      localStorage.setItem("userProfile", JSON.stringify(s.profile));
      localStorage.setItem("cartera_tour_done", "1");
    }, session);
    await context.route("**/*", async (route) => {
      const req = route.request(),
        u = new URL(req.url());
      if (u.origin === base) return route.continue();
      if (
        !(u.origin === api || u.origin === "https://api.carterafinanciera.com")
      )
        return route.abort();
      assert.equal(req.method(), "GET");
      const response = await context.request.get(api + u.pathname + u.search, {
        headers: { "X-Local-Role": "other" },
      });
      return route.fulfill({ response });
    });
    const p = await context.newPage();
    await p.clock.setFixedTime(new Date("2026-10-10T15:00:00Z"));
    await p.goto(base + "/dashboard/reportes/cartera");
    await p
      .getByText("Exclusivo independiente Álvarez", { exact: false })
      .waitFor();
    await p
      .getByText("Sin inconsistencias detectadas en esta consulta.", {
        exact: true,
      })
      .waitFor();
    assert.equal(await p.locator('a[href*="/dashboard/alertas"]').count(), 0);
    await context.close();
    checks.push("administrador independiente");
    assert.deepEqual(await read("/__estado"), before);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        checks,
        financeUnchanged: true,
        browserErrors: errors.length,
        productionWrites: 0,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

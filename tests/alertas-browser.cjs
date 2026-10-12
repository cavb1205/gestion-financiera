// Solo loopback: Chrome → API Django → SQLite. Escrituras: notas ficticias.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = "http://127.0.0.1:3039",
  api = "http://127.0.0.1:3042";
const read = async (path) => (await fetch(api + path)).json();
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
  });
  const errors = [],
    writes = [],
    checks = [];
  const before = await read("/__estado");
  try {
    for (const mobile of [false, true]) {
      const mode = mobile ? "movil" : "escritorio",
        session = await read("/__sesion/admin");
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
        timezoneId: "America/Santiago",
        serviceWorkers: "block",
      });
      await context.addInitScript((s) => {
        localStorage.setItem("authToken", "ficticio");
        localStorage.setItem("tokenTimestamp", String(Date.now()));
        localStorage.setItem("userData", JSON.stringify(s.user));
        localStorage.setItem("userProfile", JSON.stringify(s.profile));
        localStorage.setItem("selectedStore", JSON.stringify(s.store));
        localStorage.setItem("cartera_tour_done", "1");
        localStorage.setItem("theme", "light");
      }, session);
      let fault = "",
        loseWrite = false;
      await context.route("**/*", async (route) => {
        const req = route.request(),
          u = new URL(req.url());
        if (u.origin === base) return route.continue();
        if (u.origin !== api) return route.abort();
        if (req.method() === "PATCH") {
          assert.match(u.pathname, /^\/tiendas\/alertas\/\d+\/estado\/$/);
          writes.push(u.pathname);
        } else assert.equal(req.method(), "GET");
        if (u.pathname === "/tiendas/alertas/pendientes/" && fault) {
          const current = fault;
          fault = "";
          if (current === "malformed")
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: "{}",
            });
          return route.fulfill({
            status: 503,
            contentType: "application/json",
            body: '{"error":"Fallo ficticio de carga"}',
          });
        }
        const response = await route.fetch({
          headers: { ...req.headers(), "X-Local-Role": "admin" },
          maxRetries: 0,
        });
        if (req.method() === "PATCH" && loseWrite) {
          loseWrite = false;
          return route.abort();
        }
        return route.fulfill({ response });
      });
      const p = await context.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.clock.setFixedTime(new Date("2026-10-10T15:00:00Z"));
      const goto = async (path) => {
        await p.goto(base + path);
        await p.waitForLoadState("networkidle");
      };
      await goto("/dashboard");
      await p
        .getByRole("heading", {
          name: "Pendientes de revisión · todas mis rutas",
          exact: true,
        })
        .waitFor();
      await p
        .getByRole("link", { name: "Ver pendientes", exact: true })
        .click();
      await p
        .getByRole("heading", { name: "Pendientes de revisión", exact: true })
        .waitFor();
      await p
        .getByLabel("Lista de excepciones")
        .locator("article")
        .first()
        .waitFor();
      assert.equal(
        await p
          .getByText("NO MOSTRAR: crédito cerrado", { exact: true })
          .count(),
        0,
      );
      assert.equal(
        await p.getByText("Telegram conectado", { exact: true }).count(),
        0,
      );
      assert.equal(
        await p
          .getByRole("heading", { name: "Panorama de posibles pérdidas" })
          .count(),
        0,
      );
      // Pulsar la pestaña activa no vacía la pantalla.
      await p
        .getByRole("button", { name: "Pendientes actuales", exact: true })
        .click();
      assert(
        (await p
          .getByLabel("Lista de excepciones")
          .locator("article")
          .count()) > 0,
      );
      await p.getByRole("button", { name: "Siguiente", exact: true }).click();
      await p.getByText("Página 2 de ", { exact: false }).waitFor();
      await p.getByLabel("Buscar excepciones").fill(`antigua ${mode}`);
      await p
        .getByLabel("Filtros de alertas")
        .getByRole("button", { name: "Buscar", exact: true })
        .click();
      const title = p.getByRole("heading", {
        name: `Excepción Ántigua ${mode}`,
        exact: true,
      });
      await title.waitFor();
      assert.equal(
        await p.getByLabel("Lista de excepciones").locator("article").count(),
        1,
      );
      const card = p.getByLabel("Lista de excepciones").locator("article");
      await card.getByRole("button", { name: "Revisar", exact: true }).click();
      const dialog = p.getByRole("dialog");
      await dialog
        .getByLabel("Nota (opcional)")
        .fill(`Revisión ficticia ${mode}`);
      const count = writes.length;
      await dialog
        .getByRole("button", { name: "Guardar revisión", exact: true })
        .evaluate((button) => {
          button.click();
          button.click();
        });
      await dialog.waitFor({ state: "detached" });
      assert.equal(writes.length, count + 1);
      await card
        .getByText("Revisada · sigue abierta", { exact: true })
        .waitFor();
      await card.locator("summary").click();
      await card
        .getByText(`Revisión ficticia ${mode}`, { exact: true })
        .waitFor();
      if (process.env.ALERTAS_EVIDENCE) {
        await fs.mkdir(process.env.ALERTAS_EVIDENCE, { recursive: true });
        await p.screenshot({
          path: `${process.env.ALERTAS_EVIDENCE}/alertas-${mode}.png`,
          fullPage: true,
          animations: "disabled",
        });
      }
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      // Resolución con nota; escritorio prueba respuesta perdida después de guardar.
      await card.getByRole("button", { name: "Revisar", exact: true }).click();
      await dialog
        .getByLabel("Resultado de la revisión")
        .selectOption("resuelta");
      await dialog
        .getByLabel("Nota (obligatoria)")
        .fill(`Autorización ficticia comprobada ${mode}`);
      if (!mobile) loseWrite = true;
      await dialog
        .getByRole("button", { name: "Guardar revisión", exact: true })
        .click();
      if (!mobile) {
        await dialog.getByRole("alert").waitFor();
        await dialog
          .getByRole("button", { name: "Cancelar", exact: true })
          .click();
        await p
          .getByRole("button", { name: "Actualizar", exact: true })
          .click();
      }
      await p
        .getByRole("heading", {
          name: "No hay casos con estos filtros",
          exact: true,
        })
        .waitFor();
      await p
        .getByRole("button", { name: "Historial resuelto", exact: true })
        .click();
      await title.waitFor();
      await p.getByLabel("Lista de excepciones").locator("summary").click();
      await p
        .getByText(`Autorización ficticia comprobada ${mode}`, { exact: true })
        .waitFor();
      await p
        .getByRole("button", { name: "Pendientes actuales", exact: true })
        .click();
      await p.getByLabel("Buscar excepciones").fill("");
      await p
        .getByLabel("Filtros de alertas")
        .getByRole("button", { name: "Buscar", exact: true })
        .click();
      await p.getByLabel("Tipo de excepción").selectOption("CIERRE_AUSENTE");
      await p
        .getByRole("heading", { name: "3 cierre(s) pendiente(s)", exact: true })
        .waitFor();
      assert.equal(
        await p.getByLabel("Lista de excepciones").locator("article").count(),
        1,
      );
      await p.getByLabel("Tipo de excepción").selectOption("");
      await p.getByLabel("Buscar excepciones").fill("Caso de otra ruta");
      await p
        .getByLabel("Filtros de alertas")
        .getByRole("button", { name: "Buscar", exact: true })
        .click();
      await p
        .getByRole("heading", { name: "Caso de otra ruta", exact: true })
        .waitFor();
      await p
        .getByLabel("Lista de excepciones")
        .locator("article")
        .filter({
          has: p.getByRole("heading", {
            name: "Caso de otra ruta",
            exact: true,
          }),
        })
        .getByRole("button", { name: "Ver crédito", exact: true })
        .click();
      await p.waitForURL(/\/dashboard\/ventas\/\d+$/);
      assert.equal(
        await p.evaluate(
          () => JSON.parse(localStorage.getItem("selectedStore")).tienda.id,
        ),
        902,
      );
      await goto("/dashboard/alertas");
      // Fallos HTTP y contratos rotos muestran un error persistente, no ceros seguros.
      for (const failure of ["http", "malformed"]) {
        fault = failure;
        await p
          .getByRole("button", { name: "Actualizar", exact: true })
          .click();
        await p
          .getByText("No se pudo confirmar la información", { exact: true })
          .waitFor();
        assert.equal(
          await p
            .getByRole("heading", {
              name: "Sin excepciones detectadas por estos controles",
              exact: true,
            })
            .count(),
          0,
        );
        await p
          .getByRole("button", { name: "Actualizar", exact: true })
          .click();
        await p
          .getByText("No se pudo confirmar la información", { exact: true })
          .waitFor({ state: "detached" });
      }
      checks.push(mode);
      await context.close();
    }
    const after = await read("/__estado");
    assert.deepEqual(after.finanzas, before.finanzas);
    assert.equal(writes.length, 4);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        resultado: "OK",
        vistas: checks,
        flujoChromeApiDjangoSqlite: true,
        paginacion: true,
        notas: true,
        respuestaPerdida: true,
        cambioDeRuta: true,
        fallosRecuperados: 4,
        escriturasFicticias: writes.length,
        finanzasIntactas: true,
        erroresJS: errors,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

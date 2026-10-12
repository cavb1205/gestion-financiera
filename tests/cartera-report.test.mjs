import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPortfolio,
  selectClients,
  validatePortfolio,
  validateAudit,
  matchesPortfolioSegment,
  portfolioCsv,
} from "../app/dashboard/reportes/cartera/report-model.mjs";
import { csvDocument } from "../app/utils/rootReports.mjs";
import { getMontoParaPonerseAlDia } from "../app/utils/cartera.js";

test("importe diario directo evita multiplicar cuotas equivalentes redondeadas", () => {
  assert.equal(
    getMontoParaPonerseAlDia(
      sale(1, {
        valor_cuota: 18000,
        dias_atrasados: 0.99,
        saldo_actual: 89900,
        importe_atrasado_estimado: 17900,
      }),
    ),
    17900,
  );
});
test("compatibilidad gradual y calendario contractual prevalecen", () => {
  assert.equal(getMontoParaPonerseAlDia(sale(1)), 5);
  assert.equal(
    getMontoParaPonerseAlDia(sale(1, { importe_atrasado_estimado: 0 })),
    0,
  );
  assert.equal(
    getMontoParaPonerseAlDia(
      sale(1, {
        importe_atrasado_estimado: 500,
        calendario_pago: { importe_vencido: 30 },
      }),
    ),
    30,
  );
  assert.equal(
    getMontoParaPonerseAlDia(sale(1, { importe_atrasado_estimado: 500 })),
    100,
  );
});

const sale = (id, extra = {}) => ({
  id,
  cliente: {
    id,
    nombres: "Cliente",
    apellidos: "Álvarez",
    identificacion: `doc-${id}`,
  },
  saldo_actual: 100,
  capital_expuesto: 80,
  total_a_pagar: 200,
  total_abonado: 100,
  valor_cuota: 10,
  plazo: "Diario",
  estado_venta: "Vigente",
  dias_atrasados: 0.5,
  dias_sin_abono: 1,
  ...extra,
});

test("rechaza respuestas inválidas sin ocultarlas como cartera vacía", () => {
  assert.deepEqual(validatePortfolio([]), []);
  assert.deepEqual(
    validatePortfolio({ message: "No se han creado ventas" }),
    [],
  );
  for (const data of [
    {},
    null,
    { error: "fallo" },
    [sale(1, { saldo_actual: "NaN" })],
    [sale(1), sale(1)],
    [sale(1, { capital_expuesto: null })],
    [sale(1, { saldo_actual: false })],
    [sale(1, { importe_atrasado_estimado: "inválido" })],
  ])
    assert.throws(() => validatePortfolio(data));
});
test("saldo completo del cliente incluye su crédito sano y no confunde deuda atrasada", () => {
  const a = sale(1),
    b = sale(2, { cliente: a.cliente, dias_atrasados: 0, dias_sin_abono: 0 });
  const m = buildPortfolio([a, b]);
  assert.equal(m.clients.length, 1);
  assert.equal(m.clients[0].credits, 2);
  assert.equal(m.clients[0].balance, 200);
  assert.equal(m.clients[0].flaggedBalance, 100);
  assert.equal(m.clients[0].capital, 160);
  assert.equal(m.clients[0].arrears, 5);
  assert.equal(m.summary.flaggedBalance, 100);
  assert.equal(m.summary.arrears, 5);
});
test("mismo nombre no combina identidades distintas", () =>
  assert.equal(buildPortfolio([sale(1), sale(2)]).clients.length, 2));
test("alerta sin importe calculado no se etiqueta como al día", () => {
  const v = sale(1, { dias_atrasados: 0 });
  assert.equal(matchesPortfolioSegment(v, "cob_al_dia"), false);
  assert.equal(
    selectClients(buildPortfolio([v]).clients, { filter: "seguimiento" }).count,
    1,
  );
});
test("niveles exactos coinciden con todos sus enlaces", () => {
  const vs = [
    sale(1),
    sale(2, { dias_sin_abono: 3 }),
    sale(3, { dias_sin_abono: 7 }),
    sale(4, { dias_sin_abono: 14 }),
  ];
  const m = buildPortfolio(vs);
  for (const g of m.groups)
    assert.equal(
      vs.filter((v) => matchesPortfolioSegment(v, `riesgo_${g.level}`)).length,
      g.count,
    );
  assert.equal(
    m.groups.reduce((s, g) => s + g.count, 0),
    vs.length,
  );
});
test("tramos fraccionarios sin huecos ni solapamiento", () => {
  for (const q of [0.01, 0.5, 1, 5, 5.5, 6, 15, 15.5, 16, 30, 30.5, 31]) {
    assert.equal(
      ["cob_1_5", "cob_6_15", "cob_16_30", "cob_30_mas"].filter((s) =>
        matchesPortfolioSegment(sale(1, { dias_atrasados: q }), s),
      ).length,
      1,
    );
  }
});
test("paginación recorre todos los clientes y búsqueda normaliza acentos", () => {
  const clients = buildPortfolio(
    Array.from({ length: 38 }, (_, i) => sale(i + 1)),
  ).clients;
  const ids = new Set();
  for (let page = 1; page <= 3; page++)
    for (const c of selectClients(clients, { page }).items) ids.add(c.id);
  assert.equal(ids.size, 38);
  assert.equal(selectClients(clients, { search: "alvarez" }).count, 38);
  assert.equal(selectClients(clients, { page: 99 }).current, 3);
  assert.equal(selectClients(clients, { minimum: 81 }).count, 0);
});
test("auditoría usa total real y verifica ruta y contrato", () => {
  const data = {
    ruta: { id: 901 },
    resumen: { casos: 105, monto_a_revisar: 90 },
    casos: Array.from({ length: 100 }, (_, i) => ({
      venta_id: i + 1,
      titulo: "Caso",
      detalle: "Detalle",
      monto_a_revisar: 1,
      tienda: { id: 901 },
    })),
  };
  assert.equal(validateAudit(data, 901).resumen.casos, 105);
  for (const d of [
    {},
    { ...data, ruta: { id: 902 } },
    { ...data, resumen: { casos: 0 } },
    { ...data, casos: [] },
  ])
    assert.throws(() => validateAudit(d, 901));
});
test("exportación neutraliza fórmulas y conserva base del importe", () => {
  const csv = portfolioCsv(
    buildPortfolio([
      sale(1, {
        cliente: { id: 1, nombres: "=SUM(A1)", identificacion: "@formula" },
      }),
    ]),
  );
  const text = csvDocument(csv.headers, csv.rows);
  assert.match(text, /'\=SUM\(A1\)/);
  assert.match(text, /'@formula/);
  assert.match(text, /Estimación por jornadas registradas/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  crearCsvReporte, diasDelPeriodo, normalizarFilaReporte, normalizarReporte,
  porcentaje, procesarRespaldo, resumirReporte,
  leerRespuestaReporte,
} from "./report-model.js";

const inicio = "2026-09-01";
const fin = "2026-09-30";
const kiara = {
  fecha: fin, cantidadVentas: 25, totalVendido: 27750000, interesesGenerados: 5550000,
  capitalRecuperado: 22673000, interesesCobrados: 4576000, gastos: 1145000,
  utilidadCobrada: 3431000, utilidadesRetiradas: 1000000, recaudos: 27249000,
  categoriasGastos: { "Sueldo Vendedor": 863000, Arriendo: 200000, "Gastos Varios": 50000, Gasolina: 32000 },
};

const respuestaV2 = (filas = [kiara]) => ({
  version: 2, filas,
  contexto: {
    tiendaId: 3, inicio, fin, consultadoEn: "2026-10-08T12:00:00Z",
    fechaConsulta: "2026-10-08", zonaHoraria: "America/Santiago",
    perdidasSinFecha: { cantidad: 2, capitalActual: 650000 },
  },
});

test("v2 normalizes actual context without charging undated losses to the period", () => {
  const data = respuestaV2([{ ...kiara, capitalNuevos: 25450000, capitalRenovado: 2300000,
    capitalSinClasificar: 0, capitalPerdidaDeclarado: 100000, interesPerdidaDeclarado: 20000,
    cantidadDeclaracionesPerdida: 1, declaracionesPorRevisar: 0 }]);
  const reporte = leerRespuestaReporte(data, inicio, fin, 3);
  const totales = resumirReporte(reporte.filas);
  assert.equal(totales.capitalNuevos + totales.capitalRenovado + totales.capitalSinClasificar, totales.totalVendido);
  assert.equal(totales.capitalPerdidaDeclarado, 100000);
  assert.equal(totales.cantidadDeclaracionesPerdida, 1);
  assert.equal(totales.resultadoMenosRetiros, 2431000);
  assert.equal(reporte.historico.perdidasSinFecha.capitalActual, 650000);
  assert.equal(reporte.historico.fechaConsulta, "2026-10-08");
});

test("v2 can return undated whole-route losses with no period movements", () => {
  const reporte = leerRespuestaReporte(respuestaV2([]), inicio, fin, 3);
  assert.deepEqual(reporte.filas, []);
  assert.equal(reporte.historico.perdidasSinFecha.cantidad, 2);
  assert.equal(resumirReporte(reporte.filas).capitalPerdidaDeclarado, null);
});

test("legacy and partial responses do not fabricate historical capabilities", () => {
  const legado = leerRespuestaReporte([kiara], inicio, fin, 3);
  assert.equal(legado.historico, null);
  assert.equal(legado.filas[0].capitalNuevos, null);
  assert.equal(legado.filas[0].capitalPerdidaDeclarado, null);
  assert.equal(legado.filas[0].cantidadDeclaracionesPerdida, null);
  const data = respuestaV2([{ ...kiara, cantidadDeclaracionesPerdida: "" }]);
  delete data.contexto.perdidasSinFecha;
  data.contexto.fechaConsulta = "inválida";
  const incompleto = leerRespuestaReporte(data, inicio, fin, 3);
  assert.equal(incompleto.historico.perdidasSinFecha.cantidad, null);
  assert.equal(incompleto.historico.fechaConsulta, null);
  assert.equal(resumirReporte(incompleto.filas).cantidadDeclaracionesPerdida, null);
});

test("v2 rejects context from another route, period or schema", () => {
  assert.throws(() => leerRespuestaReporte(respuestaV2(), inicio, fin, 42));
  assert.throws(() => leerRespuestaReporte(respuestaV2(), "2026-08-01", fin, 3));
  assert.throws(() => leerRespuestaReporte({ ...respuestaV2(), version: 3 }, inicio, fin, 3));
  assert.throws(() => leerRespuestaReporte({ version: 2, filas: [] }, inicio, fin, 3));
});

test("CSV keeps declaration and origin dates distinct and warns about gross events", () => {
  const parsed = leerRespuestaReporte(respuestaV2(), inicio, fin, 3);
  const csv = crearCsvReporte({ ...parsed, inicio, fin, tiendaId: 3, nombre: "Prueba" });
  assert.ok(csv.includes("por fecha de declaración (bruto)"));
  assert.ok(csv.includes("sin netear recuperaciones"));
  assert.ok(csv.includes('"2026-10-08T12:00:00Z"'));
  assert.ok(csv.includes('"650000"'));
  assert.ok(csv.includes("no imputado al período"));
});

test("Kiara September: preserves the known result and subtracts recorded withdrawals only", () => {
  const totales = resumirReporte(normalizarReporte([kiara], inicio, fin));
  assert.equal(totales.utilidadCobrada, 3431000);
  assert.equal(totales.resultadoMenosRetiros, 2431000);
  assert.equal(totales.capitalRecuperado + totales.interesesCobrados, totales.recaudos);
  assert.equal(Object.values(totales.categoriasGastos).reduce((a, b) => a + b, 0), 1145000);
  assert.equal(totales.perdidaCapital, null);
});

test("known zero is different from unavailable, invalid or missing amounts", () => {
  const fila = normalizarFilaReporte({ fecha: inicio, interesesCobrados: "0", gastos: "bad", aportes: null, utilidad: "120000" });
  assert.equal(fila.interesesCobrados, 0);
  assert.equal(fila.gastos, null);
  assert.equal(fila.utilidadesRetiradas, null);
  assert.equal(fila.aportes, null);
  assert.equal(fila.utilidadEstimada, 120000);
  assert.equal(fila.cantidadVentas, null);
  assert.equal(resumirReporte([fila]).cantidadVentas, null);
});

test("partial capabilities do not silently produce incomplete period totals", () => {
  const filas = normalizarReporte([kiara, { fecha: inicio, gastos: 0 }], inicio, fin);
  const totales = resumirReporte(filas);
  assert.equal(totales.gastos, 1145000);
  assert.equal(totales.utilidadCobrada, null);
  assert.equal(totales.resultadoMenosRetiros, null);
  assert.equal(totales.categoriasGastos, null);
});

test("user category names do not collide with object prototype keys", () => {
  const categoriasGastos = Object.fromEntries([["__proto__", 10], ["constructor", 20]]);
  const totales = resumirReporte(normalizarReporte([{ ...kiara, categoriasGastos }], inicio, fin));
  assert.equal(totales.categoriasGastos.__proto__, 10);
  assert.equal(totales.categoriasGastos.constructor, 20);
  const respaldo = resumirReporte(procesarRespaldo([], [{fecha:inicio,valor:10,tipo_gasto:{tipo_gasto:"__proto__"}}], inicio, fin));
  assert.equal(respaldo.categoriasGastos.__proto__, 10);
});

test("withdrawals above period result and negative results are not clamped", () => {
  const positive = resumirReporte(normalizarReporte([{ ...kiara, utilidadesRetiradas: 4000000 }], inicio, fin));
  assert.equal(positive.resultadoMenosRetiros, -569000);
  const negative = resumirReporte(normalizarReporte([{ ...kiara, gastos: 5000000, utilidadCobrada: -424000 }], inicio, fin));
  assert.equal(negative.resultadoMenosRetiros, -1424000);
  assert.equal(porcentaje(negative.utilidadesRetiradas, negative.utilidadCobrada), null);
});

test("fallback preserves the historical estimate without fabricating cash or capital losses", () => {
  const filas = procesarRespaldo([
    { fecha_venta: inicio, valor_venta: "1000000", total_a_pagar: "1200000", estado_venta: "Perdida", perdida: "300000" },
    { fecha_venta: "2026-08-31", valor_venta: 1000000, total_a_pagar: 1200000 },
  ], [{ fecha: inicio, valor: "50000", tipo_gasto: { tipo_gasto: "Arriendo" } }], inicio, fin);
  assert.equal(filas.length, 1);
  assert.equal(filas[0].utilidadEstimada, -150000);
  assert.equal(filas[0].perdidas, 300000);
  assert.equal(filas[0].perdidaCapital, null);
  assert.equal(filas[0].interesNoCobrado, null);
  assert.equal(filas[0].utilidadCobrada, null);
  assert.equal(filas[0].utilidadesRetiradas, null);
  assert.equal(resumirReporte(filas).resultadoMenosRetiros, null);
});

test("report filters and sorts the response inside the requested range", () => {
  const filas = normalizarReporte([{ fecha: inicio }, { fecha: "2026-10-01" }, { fecha: fin }, { fecha: "2026-08-31" }], inicio, fin);
  assert.deepEqual(filas.map((f) => f.fecha), [fin, inicio]);
  assert.throws(() => normalizarReporte({}, inicio, fin));
  assert.throws(() => normalizarReporte([null], inicio, fin));
  assert.throws(() => normalizarReporte([{ fecha: "bad" }], inicio, fin));
  assert.throws(() => procesarRespaldo({}, [], inicio, fin));
});

test("ratios have no artificial zero or infinity for undefined denominators", () => {
  assert.equal(porcentaje(0, 100), 0);
  assert.equal(porcentaje(100, 0), null);
  assert.equal(porcentaje(null, 100), null);
  assert.equal(porcentaje(100, -10), null);
  assert.equal(porcentaje(150, 100), 150);
});

test("calendar averages include the whole selected interval including DST and leap days", () => {
  assert.equal(diasDelPeriodo(inicio, fin), 30);
  assert.equal(diasDelPeriodo("2024-02-01", "2024-02-29"), 29);
  assert.equal(diasDelPeriodo(fin, inicio), 0);
  assert.equal(diasDelPeriodo("", fin), 0);
});

test("empty and partial reports cannot be mistaken for confirmed zero result", () => {
  const totales = resumirReporte([]);
  assert.equal(totales.utilidadCobrada, null);
  assert.equal(totales.resultadoMenosRetiros, null);
  assert.equal(procesarRespaldo([], [], inicio, fin).length, 0);
});

test("CSV identifies the route, period and unavailable data without inventing zeros", () => {
  const csv = crearCsvReporte({ tiendaId: 3, nombre: 'Kiara "Calama"', inicio, fin, respaldo: false, filas: normalizarReporte([kiara], inicio, fin) });
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"Kiara ""Calama"""'));
  assert.ok(csv.includes('"2431000"'));
  assert.ok(csv.includes("no es caja disponible"));
  const fallback = crearCsvReporte({ tiendaId: 3, nombre: "Kiara", inicio, fin, respaldo: true, filas: procesarRespaldo([], [{ fecha: inicio, valor: 10 }], inicio, fin) });
  assert.ok(fallback.includes("Respaldo: solo estimación"));
  const [headers, row] = fallback.slice(1).split("\n");
  const columna = headers.split(",").findIndex((s) => s === '"Resultado cobrado antes de pérdidas y retiros"');
  assert.equal(row.split(",")[columna], '""');
});

test("CSV prevents formula injection in user text without altering negative numeric results", () => {
  const csv = crearCsvReporte({ tiendaId: 3, nombre: "=1+1", inicio, fin, respaldo: false,
    filas: normalizarReporte([{ ...kiara, utilidadCobrada: -424000, categoriasGastos: { "@SUM(1)": 10 } }], inicio, fin) });
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"\'@SUM(1): 10"'));
  assert.ok(csv.includes('"-424000"'));
});

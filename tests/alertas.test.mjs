import test from "node:test";
import assert from "node:assert/strict";
import {
  puedeVerAlertas,
  consultaAlertas,
  validarPendientes,
  adaptarHistorial,
  textoAlerta,
  esCobranza,
} from "../app/utils/alertas.mjs";

const respuesta = () => ({
  version: 1,
  casos: [],
  rutas: [],
  caja_sin_historial: [],
  resumen: { total: 0, criticas: 0, revisadas: 0, cierres: 0 },
  paginacion: { page: 1, limit: 25, total: 0, pages: 1 },
});

test("Centro privado: cavb1205 administrador, no otros usuarios ni trabajadores", () => {
  assert(puedeVerAlertas({ username: "cavb1205", is_staff: true }));
  for (const user of [
    null,
    { username: "otro", is_superuser: true },
    { username: "cavb1205" },
  ])
    assert.equal(puedeVerAlertas(user), false);
});
test("Consulta envia todos los filtros al servidor, con búsqueda escapada y paginación", () => {
  const url = consultaAlertas({
    ruta: "901",
    prioridad: "critica",
    tipo: "VENTA_CON_ALERTAS",
    busqueda: "  Ángela & Cía  ",
    pagina: 9,
  });
  const parsed = new URL(url, "https://ficticio.test");
  assert.equal(parsed.searchParams.get("q"), "Ángela & Cía");
  assert.equal(parsed.searchParams.get("page"), "9");
  assert.equal(parsed.searchParams.get("tienda"), "901");
  assert.equal(parsed.searchParams.get("severidad"), "critica");
  assert.equal(parsed.pathname, "/tiendas/alertas/pendientes/");
  assert.equal(
    new URL(
      consultaAlertas({ resumen: true }),
      "https://ficticio.test",
    ).searchParams.get("solo_resumen"),
    "1",
  );
});
test("Historial pide solo resueltas sin mezclar el estado pendiente", () => {
  const url = new URL(
    consultaAlertas({ historial: true, estado: "nueva" }),
    "https://ficticio.test",
  );
  assert.equal(url.pathname, "/tiendas/alertas/");
  assert.equal(url.searchParams.get("estado"), "resuelta");
});
test("Cero confirmado válido; respuestas incompletas nunca se convierten en ausencia de alertas", () => {
  assert.deepEqual(validarPendientes(respuesta()), respuesta());
  for (const data of [
    {},
    [],
    { ...respuesta(), resumen: {} },
    { ...respuesta(), casos: null },
    { ...respuesta(), paginacion: { page: 1, limit: 25, pages: 1, total: 5 } },
    {
      ...respuesta(),
      casos: [
        {
          key: "a",
          tienda: { id: 1 },
          titulo: "Error",
          severidad: "desconocida",
        },
      ],
    },
  ])
    assert.throws(() => validarPendientes(data));
  const summary = {
    ...respuesta(),
    paginacion: { page: 1, limit: 25, pages: 3, total: 70 },
  };
  assert.equal(
    validarPendientes(summary, { soloResumen: true }).paginacion.total,
    70,
  );
});
test("Adaptador conserva notas y motivo de resolución del historial", () => {
  const raw = {
    ...respuesta(),
    alertas: [
      {
        id: 9,
        estado: "resuelta",
        actualizada: "2026-10-11",
        datos: {
          revisiones: [{ nota: "Comprobado" }],
          resolucion: { motivo: "Pagado" },
        },
      },
    ],
  };
  const adapted = adaptarHistorial(raw);
  assert.equal(adapted.casos[0].revisiones[0].nota, "Comprobado");
  assert.equal(adapted.casos[0].datos.resolucion.motivo, "Pagado");
  assert.throws(() => adaptarHistorial({}));
});
test("Texto de Telegram se presenta como texto, no HTML ejecutable", () => {
  assert.equal(textoAlerta("<b>Crédito &amp; pagos</b>"), "Crédito & pagos");
  assert(!textoAlerta("<img src=x onerror=alert(1)>Prueba").includes("<img"));
  assert(esCobranza({ tipo: "RIESGO_CARTERA" }));
  assert(!esCobranza({ tipo: "VENTA_CON_ALERTAS" }));
});

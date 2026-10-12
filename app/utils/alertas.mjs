export const TIPOS_ALERTAS = {
  VENTA_CON_ALERTAS: "Crédito con señales",
  RIESGO_CARTERA: "Atraso importante",
  SIN_PRIMER_ABONO: "Sin primer abono",
  SEGUIMIENTO_PREVENTIVO: "Seguimiento",
  CIERRE_AUSENTE: "Cierres pendientes",
  INCONSISTENCIA: "Créditos y pagos",
  INTEGRIDAD_CAJA: "Registros de caja",
};

export function puedeVerAlertas(user) {
  return (
    user?.username === "cavb1205" && Boolean(user.is_staff || user.is_superuser)
  );
}

export function consultaAlertas({
  historial = false,
  ruta = "todas",
  prioridad = "",
  tipo = "",
  estado = "",
  busqueda = "",
  pagina = 1,
  resumen = false,
} = {}) {
  const query = new URLSearchParams({ limit: "25", page: String(pagina) });
  if (ruta !== "todas") query.set("tienda", String(ruta));
  if (prioridad) query.set("severidad", prioridad);
  if (tipo) query.set("tipo", tipo);
  if (busqueda.trim()) query.set("q", busqueda.trim());
  if (historial) query.set("estado", "resuelta");
  else if (estado) query.set("estado", estado);
  if (resumen) query.set("solo_resumen", "1");
  return `/tiendas/alertas/${historial ? "" : "pendientes/"}?${query}`;
}

function validarPaginacion(data) {
  const p = data?.paginacion;
  if (
    !p ||
    ![p.page, p.limit, p.pages].every((v) => Number.isInteger(v) && v >= 1) ||
    !Number.isInteger(p.total) ||
    p.total < 0 ||
    !Array.isArray(data.rutas)
  ) {
    throw new Error(
      "La respuesta de alertas está incompleta. Intenta actualizar.",
    );
  }
}

export function validarPendientes(data, { soloResumen = false } = {}) {
  validarPaginacion(data);
  if (
    data.version !== 1 ||
    !Array.isArray(data.casos) ||
    !Array.isArray(data.caja_sin_historial) ||
    !["total", "criticas", "revisadas", "cierres"].every(
      (k) => Number.isInteger(data.resumen?.[k]) && data.resumen[k] >= 0,
    ) ||
    data.casos.some(
      (c) =>
        !c.key ||
        !c.tienda?.id ||
        !c.titulo ||
        !["critica", "alta", "media"].includes(c.severidad),
    ) ||
    (!soloResumen && data.paginacion.total > 0 && data.casos.length === 0)
  ) {
    throw new Error(
      "No se pudo confirmar el estado de los pendientes. Actualiza nuevamente.",
    );
  }
  return data;
}

export function adaptarHistorial(data) {
  validarPaginacion(data);
  if (!Array.isArray(data.alertas) || !Number.isInteger(data.resumen?.total)) {
    throw new Error("No se pudo confirmar el historial de alertas.");
  }
  return {
    ...data,
    casos: data.alertas.map((a) => ({
      ...a,
      key: `alerta:${a.id}`,
      origen: "alerta",
      alerta_id: a.id,
      monto: null,
      fecha: a.actualizada,
      revisiones: a.datos?.revisiones || [],
      ayuda:
        "Antecedente de revisión. No modifica el crédito ni confirma una pérdida.",
    })),
    caja_sin_historial: [],
  };
}

export function textoAlerta(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(?:amp|lt|gt|quot|#39);/g,
      (entity) =>
        ({
          "&amp;": "&",
          "&lt;": "<",
          "&gt;": ">",
          "&quot;": '"',
          "&#39;": "'",
        })[entity],
    );
}

export function esCobranza(caso) {
  return [
    "RIESGO_CARTERA",
    "SIN_PRIMER_ABONO",
    "SEGUIMIENTO_PREVENTIVO",
  ].includes(caso.tipo);
}

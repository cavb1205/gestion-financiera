import {
  getRiesgoCartera,
  getMontoParaPonerseAlDia,
  NIVEL_DETERIORO,
} from "../../../utils/cartera.js";
import { normalizeSearchText } from "../../../utils/text.js";

const validNumber = (value) =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value));

export function validatePortfolio(data) {
  if (
    data?.message === "No se han creado ventas" &&
    Object.keys(data).length === 1
  )
    return [];
  if (!Array.isArray(data))
    throw new Error(
      "La respuesta de cartera no es válida. Intenta actualizar.",
    );
  const ids = new Set();
  for (const v of data) {
    if (
      !v ||
      !v.id ||
      !v.cliente?.id ||
      ids.has(String(v.id)) ||
      [
        "saldo_actual",
        "capital_expuesto",
        "total_a_pagar",
        "total_abonado",
        "valor_cuota",
      ].some((k) => !validNumber(v[k])) ||
      (v.importe_atrasado_estimado != null &&
        !validNumber(v.importe_atrasado_estimado)) ||
      (v.riesgo_cartera &&
        (![
          v.riesgo_cartera.nivel_cobranza,
          v.riesgo_cartera.nivel_deterioro,
        ].every((n) => Number.isInteger(n) && n >= 0 && n <= 3) ||
          typeof v.riesgo_cartera.en_mora !== "boolean" ||
          !validNumber(v.riesgo_cartera.cuotas_atrasadas)))
    ) {
      throw new Error(
        "La cartera contiene datos incompletos. No se calcularon totales.",
      );
    }
    ids.add(String(v.id));
  }
  return data;
}

export function validateAudit(data, routeId) {
  const total = data?.resumen?.casos;
  if (
    !data ||
    String(data.ruta?.id) !== String(routeId) ||
    !Array.isArray(data.casos) ||
    !Number.isInteger(total) ||
    total < data.casos.length ||
    total < 0 ||
    !validNumber(data.resumen?.monto_a_revisar) ||
    Number(data.resumen.monto_a_revisar) < 0 ||
    (total > 0 && !data.casos.length) ||
    data.casos.some(
      (c) =>
        !c.venta_id ||
        String(c.tienda?.id) !== String(routeId) ||
        typeof c.titulo !== "string" ||
        typeof c.detalle !== "string" ||
        !validNumber(c.monto_a_revisar) ||
        Number(c.monto_a_revisar) < 0,
    )
  ) {
    throw new Error("No se pudo validar el control de datos de esta ruta.");
  }
  return data;
}

export function matchesPortfolioSegment(venta, segment) {
  const r = getRiesgoCartera(venta),
    q = r.cuotasAtrasadas;
  if (segment === "cob_mora") return r.enMora;
  if (segment === "cob_al_dia") return !r.enMora;
  if (segment === "cob_1_5") return q > 0 && q <= 5;
  if (segment === "cob_6_15") return q > 5 && q <= 15;
  if (segment === "cob_16_30") return q > 15 && q <= 30;
  if (segment === "cob_30_mas") return q > 30;
  if (/^riesgo_[0-3]$/.test(segment))
    return r.enMora && r.nivelDeterioro === Number(segment.slice(-1));
  return true;
}

export function buildPortfolio(ventas) {
  const clients = new Map(),
    statuses = new Map(),
    terms = new Map();
  const groups = [3, 2, 1, 0].map((level) => ({
    level,
    label: level === 0 ? "Seguimiento inicial" : NIVEL_DETERIORO[level].label,
    count: 0,
    balance: 0,
  }));
  const summary = {
    balance: 0,
    capital: 0,
    flaggedBalance: 0,
    arrears: 0,
    flagged: 0,
    paid: 0,
    total: 0,
    noFirst: 0,
    noFirstFlagged: 0,
  };
  const rows = ventas.map((v) => {
    const risk = getRiesgoCartera(v),
      balance = Number(v.saldo_actual),
      capital = Number(v.capital_expuesto);
    const arrears = getMontoParaPonerseAlDia(v);
    const name =
      `${v.cliente.nombres || ""} ${v.cliente.apellidos || ""}`.trim() ||
      "Sin nombre";
    const daysLate = v.calendario_pago
      ? Number(v.calendario_pago.dias_mora) || 0
      : null;
    const row = { venta: v, risk, balance, capital, arrears, name, daysLate };
    summary.balance += balance;
    summary.capital += capital;
    summary.paid += Number(v.total_abonado);
    summary.total += Number(v.total_a_pagar);
    if (Number(v.total_abonado) <= 0) {
      summary.noFirst++;
      if (risk.enMora) summary.noFirstFlagged++;
    }
    if (risk.enMora) {
      summary.flagged++;
      summary.flaggedBalance += balance;
      summary.arrears += arrears;
      const g = groups.find((g) => g.level === risk.nivelDeterioro);
      if (g) {
        g.count++;
        g.balance += balance;
      }
    }
    for (const [map, key] of [
      [statuses, v.estado_venta || "Otro"],
      [terms, v.plazo || "Otro"],
    ]) {
      const group = map.get(key) || { label: key, count: 0, balance: 0 };
      group.count++;
      group.balance += balance;
      map.set(key, group);
    }
    const id = String(v.cliente.id);
    const c = clients.get(id) || {
      id,
      name,
      identification: v.cliente.identificacion || "",
      credits: 0,
      flagged: 0,
      balance: 0,
      flaggedBalance: 0,
      capital: 0,
      arrears: 0,
      rank: 0,
      level: 0,
      daysWithoutPayment: 0,
      daysLate: null,
      hasDaily: false,
      reason: "",
      candidate: false,
    };
    c.credits++;
    c.balance += balance;
    c.capital += capital;
    if (risk.enMora) {
      c.flagged++;
      c.flaggedBalance += balance;
      c.arrears += arrears;
    }
    if (risk.prioridad.rank > c.rank || !c.reason) {
      c.rank = risk.prioridad.rank;
      c.reason = risk.prioridad.reason;
    }
    c.level = Math.max(c.level, risk.nivelDeterioro);
    c.daysWithoutPayment = Math.max(
      c.daysWithoutPayment,
      risk.diasSinAbono || 0,
    );
    if (daysLate !== null) c.daysLate = Math.max(c.daysLate || 0, daysLate);
    else c.hasDaily = true;
    c.candidate ||= risk.candidatoCastigo;
    clients.set(id, c);
    return row;
  });
  const attentionClients = [...clients.values()].filter(
    (c) => c.flagged > 0 || c.rank > 0,
  );
  return {
    rows,
    summary,
    groups,
    clients: attentionClients,
    statuses: [...statuses.values()],
    terms: [...terms.values()],
  };
}

export function selectClients(
  clients,
  {
    search = "",
    filter = "todos",
    order = "prioridad",
    minimum = "",
    page = 1,
    size = 15,
  } = {},
) {
  const needle = normalizeSearchText(search);
  const list = clients.filter(
    (c) =>
      (!needle ||
        normalizeSearchText(`${c.name} ${c.identification}`).includes(
          needle,
        )) &&
      (filter !== "urgente" || c.rank >= 2) &&
      (filter !== "critico" || c.level === 3) &&
      (filter !== "atraso" || c.arrears > 0) &&
      (filter !== "seguimiento" || (c.arrears === 0 && c.flagged > 0)) &&
      (!minimum || c.capital >= Number(minimum)),
  );
  list.sort((a, b) => {
    if (order === "saldo")
      return b.balance - a.balance || a.id.localeCompare(b.id);
    if (order === "capital")
      return b.capital - a.capital || a.id.localeCompare(b.id);
    return (
      b.rank - a.rank ||
      b.level - a.level ||
      b.arrears - a.arrears ||
      b.capital - a.capital ||
      a.id.localeCompare(b.id)
    );
  });
  const pages = Math.max(1, Math.ceil(list.length / size)),
    current = Math.max(1, Math.min(page, pages));
  return {
    items: list.slice((current - 1) * size, current * size),
    count: list.length,
    pages,
    current,
  };
}

export function portfolioCsv(model) {
  return {
    headers: [
      "Crédito",
      "Cliente ID",
      "Cliente",
      "Identificación",
      "Plazo",
      "Estado",
      "Saldo pendiente",
      "Capital por recuperar",
      "Importe atrasado calculado",
      "Base del importe",
      "Días de mora calendario",
      "Días sin abono",
      "Prioridad",
      "Nivel de deterioro",
    ],
    rows: model.rows.map((r) => [
      r.venta.id,
      r.venta.cliente.id,
      r.name,
      r.venta.cliente.identificacion,
      r.venta.plazo,
      r.venta.estado_venta,
      r.balance,
      r.capital,
      r.arrears,
      r.venta.calendario_pago
        ? "Calendario contractual"
        : "Estimación por jornadas registradas",
      r.daysLate ?? "",
      r.risk.diasSinAbono ?? "",
      r.risk.prioridad.label,
      r.risk.nivelDeterioro,
    ]),
  };
}

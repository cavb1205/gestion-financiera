// app/utils/cartera.js
//
// Reglas de cartera compartidas por las vistas del frontend.
//
// Hay dos señales distintas y no deben mezclarse:
// 1) prioridad de cobranza: qué debe gestionar el trabajador hoy;
// 2) deterioro: qué tan comprometida está la recuperación del crédito.
//
// Los umbrales de deterioro respetan la frecuencia del crédito. Así no se
// juzga igual un crédito diario que uno semanal o mensual.

export const INTERVALOS_COBRO = {
  Diario: 1,
  Semanal: 7,
  Mensual: 30,
};

export const UMBRALES_RIESGO = {
  // Atención, riesgo alto y riesgo crítico. Son los mismos tramos que usa
  // actualmente el score del backend para cada frecuencia.
  Diario: { atencion: 3, alto: 7, critico: 14 },
  Semanal: { atencion: 9, alto: 16, critico: 30 },
  Mensual: { atencion: 35, alto: 45, critico: 75 },
};

export const DIAS_CANDIDATO_CASTIGO = 90;

export const NIVEL_DETERIORO = {
  0: {
    key: "sano",
    label: "Sin riesgo",
    short: "Sin riesgo",
    min: 0,
    // Paleta para badges (clases Tailwind)
    badge:
      "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
    text: "text-slate-500",
  },
  1: {
    key: "atencion",
    label: "Atención temprana",
    short: "Atención",
    min: 0,
    badge:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  2: {
    key: "alto",
    label: "Riesgo alto",
    short: "Riesgo alto",
    min: 0,
    badge:
      "bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800/40",
    text: "text-orange-600 dark:text-orange-400",
  },
  3: {
    key: "critico",
    label: "Riesgo crítico",
    short: "Crítico",
    min: 0,
    badge:
      "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/50",
    text: "text-rose-700 dark:text-rose-300",
  },
};

export function getIntervaloCobro(venta) {
  return INTERVALOS_COBRO[venta?.plazo] || INTERVALOS_COBRO.Diario;
}

export function getUmbralesRiesgo(venta) {
  return UMBRALES_RIESGO[venta?.plazo] || UMBRALES_RIESGO.Diario;
}

const ETIQUETAS_PRIORIDAD = {
  al_dia: "Al día",
  vigilar: "Vigilar",
  hoy: "Gestionar hoy",
  urgente: "Urgente",
  critico: "Crítico",
};

/**
 * Clasifica el nivel de deterioro de un crédito.
 * @param {object} venta - objeto de venta del endpoint /ventas/activas/
 * @returns {{ nivel: number, diasSinAbono: number|null, enMora: boolean } & typeof NIVEL_DETERIORO[number]}
 */
export function clasificarDeterioro(venta) {
  const riesgo = getRiesgoCartera(venta);
  const nivel = riesgo.nivelDeterioro;
  return {
    nivel,
    diasSinAbono: riesgo.diasSinAbono,
    enMora: riesgo.enMora,
    candidatoCastigo: riesgo.candidatoCastigo,
    umbrales: riesgo.umbrales,
    ...NIVEL_DETERIORO[nivel],
  };
}

/**
 * Días calendario desde el último abono real. El backend cuenta desde la
 * fecha de venta cuando el crédito todavía no tiene un abono.
 */
export function getDiasSinAbono(venta) {
  const dias = Number(venta?.dias_sin_abono);
  return Number.isFinite(dias) ? Math.max(0, Math.round(dias)) : null;
}

/**
 * Equivalente de cuotas que falta cubrir según el atraso acumulado.
 * `dias_atrasados` es un cálculo de cuotas equivalentes, no días calendario.
 */
export function getCuotasAtrasadas(venta) {
  const atraso = Number(venta?.dias_atrasados);
  const atrasoRegistrado = Number.isFinite(atraso) ? Math.max(0, atraso) : 0;
  const sinPrimerAbono = getTotalAbonado(venta) <= 0;
  const diasSinAbono = getDiasSinAbono(venta);
  const ciclosSinAbono = sinPrimerAbono && diasSinAbono !== null
    ? Math.floor(diasSinAbono / getIntervaloCobro(venta))
    : 0;
  return Math.max(atrasoRegistrado, ciclosSinAbono);
}

export function getMontoParaPonerseAlDia(venta) {
  const cuota = Number(venta?.valor_cuota);
  if (!Number.isFinite(cuota)) return 0;
  const montoCalculado = Math.round(getCuotasAtrasadas(venta) * cuota);
  const saldo = Number(venta?.saldo_actual);
  if (!Number.isFinite(saldo)) return montoCalculado;
  return Math.min(Math.max(0, montoCalculado), Math.max(0, Math.round(saldo)));
}

function getEstadoFinanciero(venta) {
  return venta?.estado_venta || "Vigente";
}

function getTotalAbonado(venta) {
  const abonado = Number(venta?.total_abonado);
  if (Number.isFinite(abonado)) return abonado;
  const total = Number(venta?.total_a_pagar);
  const saldo = Number(venta?.saldo_actual);
  return Number.isFinite(total) && Number.isFinite(saldo) ? total - saldo : 0;
}

function calcularEnMora(venta, diasSinAbono, cuotasAtrasadas) {
  const atrasoOriginal = Number(venta?.dias_atrasados);
  const estado = getEstadoFinanciero(venta);
  const pagosAdelantados = Number.isFinite(atrasoOriginal)
    && atrasoOriginal < 0
    && estado !== "Vencido";
  const cicloIncumplido = diasSinAbono !== null
    && diasSinAbono >= getIntervaloCobro(venta);

  return !pagosAdelantados && (
    estado === "Vencido"
    || cuotasAtrasadas > 0
    || cicloIncumplido
  );
}

/**
 * Clasificación central de cobranza y deterioro.
 *
 * El nivel operativo puede subir desde el primer ciclo incumplido, pero el
 * deterioro solo sube cuando el crédito está realmente en mora. Esto permite
 * actuar temprano sin llamar "pérdida" a un crédito que todavía está sano.
 */
export function getRiesgoCartera(venta) {
  // El backend es la fuente de verdad cuando ya expone el perfil calculado.
  // El cálculo local queda como respaldo para un despliegue gradual o si una
  // respuesta antigua todavía no trae este campo.
  const riesgoApi = venta?.riesgo_cartera;
  if (riesgoApi && Number.isFinite(Number(riesgoApi.nivel_cobranza))) {
    const nivelCobranza = Math.max(0, Math.min(3, Number(riesgoApi.nivel_cobranza)));
    const clave = riesgoApi.clave_cobranza || "al_dia";
    return {
      prioridad: {
        rank: nivelCobranza,
        key: clave,
        label: ETIQUETAS_PRIORIDAD[clave] || clave,
        reason: riesgoApi.motivo || "Sin atraso registrado",
      },
      nivelDeterioro: Number(riesgoApi.nivel_deterioro) || 0,
      enMora: Boolean(riesgoApi.en_mora),
      diasSinAbono: Number.isFinite(Number(riesgoApi.dias_sin_abono))
        ? Math.max(0, Math.round(Number(riesgoApi.dias_sin_abono)))
        : null,
      cuotasAtrasadas: Number.isFinite(Number(riesgoApi.cuotas_atrasadas))
        ? Math.max(0, Number(riesgoApi.cuotas_atrasadas))
        : 0,
      intervalo: Number(riesgoApi.intervalo_cobro) || getIntervaloCobro(venta),
      umbrales: riesgoApi.umbrales_dsa || getUmbralesRiesgo(venta),
      candidatoCastigo: Boolean(riesgoApi.candidato_castigo),
      plazo: venta?.plazo || "Diario",
    };
  }

  const diasSinAbono = getDiasSinAbono(venta);
  const cuotasAtrasadas = getCuotasAtrasadas(venta);
  const intervalo = getIntervaloCobro(venta);
  const umbrales = getUmbralesRiesgo(venta);
  const estado = getEstadoFinanciero(venta);
  const atrasoOriginal = Number(venta?.dias_atrasados);
  const enMora = calcularEnMora(venta, diasSinAbono, cuotasAtrasadas);
  const sinPrimerAbono = getTotalAbonado(venta) <= 0;
  const cicloIncumplido = diasSinAbono !== null && diasSinAbono >= intervalo;
  const pagosAdelantados = Number.isFinite(atrasoOriginal)
    && atrasoOriginal < 0
    && estado !== "Vencido";

  let nivelDeterioro = 0;
  if (enMora && diasSinAbono !== null) {
    if (diasSinAbono >= umbrales.critico) nivelDeterioro = 3;
    else if (diasSinAbono >= umbrales.alto) nivelDeterioro = 2;
    else if (diasSinAbono >= umbrales.atencion) nivelDeterioro = 1;
  }

  let rank = 0;
  let key = "al_dia";
  let label = "Al día";
  let reason = "Sin atraso registrado";

  if (pagosAdelantados) {
    reason = "Pagos adelantados";
  } else if (
    enMora
    && (
      estado === "Vencido"
      || cuotasAtrasadas >= 5
      || (diasSinAbono !== null && diasSinAbono >= umbrales.critico)
    )
  ) {
    rank = 3;
    key = "critico";
    label = "Crítico";
    reason = estado === "Vencido" ? "Crédito vencido" : "Atraso crítico";
  } else if (
    enMora
    && (
      cuotasAtrasadas >= 2
      || (diasSinAbono !== null && diasSinAbono >= Math.max(intervalo * 2, umbrales.atencion))
    )
  ) {
    rank = 2;
    key = "urgente";
    label = "Urgente";
    reason = sinPrimerAbono ? "Sin primer abono" : "Atraso acumulado";
  } else if (enMora || (sinPrimerAbono && cicloIncumplido)) {
    rank = 1;
    key = "hoy";
    label = "Gestionar hoy";
    reason = sinPrimerAbono ? "Sin primer abono" : "Ciclo pendiente";
  } else if (diasSinAbono !== null && diasSinAbono >= Math.max(1, intervalo - 1)) {
    rank = 0;
    key = "vigilar";
    label = "Vigilar";
    reason = "Último abono antiguo";
  }

  return {
    prioridad: { rank, key, label, reason },
    nivelDeterioro,
    enMora,
    diasSinAbono,
    cuotasAtrasadas,
    intervalo,
    umbrales,
    plazo: venta?.plazo || "Diario",
    candidatoCastigo: enMora
      && diasSinAbono !== null
      && diasSinAbono >= DIAS_CANDIDATO_CASTIGO,
  };
}

/**
 * Prioridad operativa para ordenar la cartera.
 * La antigüedad del último abono adelanta la gestión, pero un crédito pagado
 * por adelantado no se marca como riesgo solo por llevar días sin abonar.
 */
export function getPrioridadCobranza(venta) {
  return getRiesgoCartera(venta).prioridad;
}

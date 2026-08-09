"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiActivity,
  FiAlertTriangle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiExternalLink,
  FiFilter,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, getApiError } from "../../utils/api";
import { formatMoney, parseMoney } from "../../utils/format";
import { formatAppDateTime, getAppDateDifference, getAppDateString } from "../../utils/datetime";
import {
  getCuotasAtrasadas,
  getDiasSinAbono,
  getRiesgoCartera,
} from "../../utils/cartera";

const TIPOS = {
  VENTA_CON_ALERTAS: "Venta con señales",
  SEGUIMIENTO_PREVENTIVO: "Seguimiento preventivo",
  RIESGO_CARTERA: "Riesgo de cartera",
  SIN_PRIMER_ABONO: "Sin primer abono",
  CIERRE_AUSENTE: "Cierre de caja ausente",
  RESUMEN_OPERATIVO: "Resumen operativo",
};

const USUARIO_ALERTAS = "cavb1205";

const RESUMEN_CARTERA_VACIO = {
  creditosActivos: 0,
  saldoActivo: 0,
  creditosRiesgo: 0,
  saldoRiesgo: 0,
  sinPrimerAbono: 0,
  saldoSinPrimerAbono: 0,
  criticos: 0,
  saldoCritico: 0,
  candidatosPerdida: 0,
  saldoCandidatosPerdida: 0,
  topExposicion: [],
  reconciliaciones: [],
  discrepancias: [],
  diferenciaCajaTotal: 0,
  inconsistencias: [],
  montoInconsistencias: 0,
  señalesInconsistencias: 0,
  rutasConsultadas: 0,
  rutasConError: 0,
  fecha: null,
  actualizado: null,
};

const SEVERIDADES = {
  critica: {
    label: "Crítica",
    short: "Crítica",
    icon: FiAlertTriangle,
    accent: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-500/15",
    border: "border-rose-200 dark:border-rose-500/25",
    rail: "bg-rose-500",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  alta: {
    label: "Alta",
    short: "Alta",
    icon: FiAlertTriangle,
    accent: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    border: "border-amber-200 dark:border-amber-500/25",
    rail: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  media: {
    label: "Media",
    short: "Media",
    icon: FiBell,
    accent: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-100 dark:bg-indigo-500/15",
    border: "border-indigo-200 dark:border-indigo-500/25",
    rail: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
};

const ESTADOS = {
  nueva: {
    label: "Nueva",
    badge: "bg-slate-900 text-white dark:bg-white dark:text-slate-900",
  },
  revisada: {
    label: "Revisada",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  resuelta: {
    label: "Resuelta",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
};

function quitarFormatoTelegram(valor = "") {
  return String(valor)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fechaCorta(valor) {
  return valor ? formatAppDateTime(valor) : "Sin fecha";
}

function fechaRelativa(valor) {
  if (!valor) return "";
  const dias = getAppDateDifference(valor);
  if (dias === null) return "";
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `Hace ${dias} días`;
}

function obtenerTextoBusqueda(alerta) {
  return [
    alerta.titulo,
    alerta.detalle,
    alerta.tienda?.nombre,
    alerta.cliente?.nombre,
    alerta.trabajador,
    alerta.tipo,
    ...(alerta.senales || []).map((senal) => senal.texto),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function fechaLocal(offset = 0) {
  return getAppDateString(offset);
}

async function leerJsonSeguro(ruta, valorAlternativo) {
  try {
    const response = await apiFetch(ruta);
    if (!response.ok) return { ok: false, data: valorAlternativo };
    return { ok: true, data: await response.json() };
  } catch {
    return { ok: false, data: valorAlternativo };
  }
}

function construirResumenCartera(filas, fecha) {
  const ventas = filas.flatMap((fila) =>
    (Array.isArray(fila.ventas) ? fila.ventas : []).map((venta) => ({
      venta,
      ruta: fila.ruta,
      riesgo: getRiesgoCartera(venta),
    }))
  );

  const conRiesgo = ventas.filter(({ riesgo }) => riesgo.enMora || riesgo.nivelDeterioro > 0);
  const sinPrimerAbono = ventas.filter(({ venta, riesgo }) =>
    parseMoney(venta.total_abonado) <= 0 && riesgo.prioridad.rank >= 1
  );
  const criticos = ventas.filter(({ riesgo }) =>
    riesgo.prioridad.rank >= 3 || riesgo.nivelDeterioro >= 3
  );
  const candidatosPerdida = ventas.filter(({ riesgo }) => riesgo.candidatoCastigo);

  const topExposicion = [...conRiesgo]
    .sort((a, b) => parseMoney(b.venta.saldo_actual) - parseMoney(a.venta.saldo_actual))
    .slice(0, 6)
    .map(({ venta, ruta, riesgo }) => ({
      id: venta.id,
      clienteId: venta.cliente?.id,
      cliente: `${venta.cliente?.nombres || "Cliente"} ${venta.cliente?.apellidos || ""}`.trim(),
      ruta: ruta.nombre,
      saldo: parseMoney(venta.saldo_actual),
      diasSinAbono: getDiasSinAbono(venta),
      cuotasAtrasadas: getCuotasAtrasadas(venta),
      nivel: riesgo.nivelDeterioro,
      prioridad: riesgo.prioridad.label,
      candidatoPerdida: riesgo.candidatoCastigo,
    }));

  const reconciliaciones = filas
    .map(({ ruta, resumen, cierres }) => {
      const movimientos = resumen?.fecha || {};
      const cierreActual = (Array.isArray(cierres) ? cierres : []).find(
        (cierre) => cierre.fecha_cierre === fecha
      );
      const cierreAnterior = (Array.isArray(cierres) ? cierres : []).find(
        (cierre) => cierre.fecha_cierre === fechaLocal(-1)
      );
      const aportes = parseMoney(movimientos.aportes);
      const recaudos = parseMoney(movimientos.recaudos);
      const gastos = parseMoney(movimientos.gastos);
      const utilidades = parseMoney(movimientos.utilidades);
      const tieneActividad = Boolean(
        aportes || recaudos || gastos || utilidades || movimientos.count_ventas
      );
      const comparable = Boolean(cierreActual && cierreAnterior);
      const esperado = comparable
        ? parseMoney(cierreAnterior.valor) + aportes + recaudos - gastos - utilidades
        : null;
      const actual = comparable ? parseMoney(cierreActual.valor) : null;
      const diferencia = comparable ? actual - esperado : null;

      return {
        ruta: ruta.nombre,
        rutaId: ruta.id,
        tieneActividad,
        comparable,
        cierreActual: actual,
        cierreAnterior: comparable ? parseMoney(cierreAnterior.valor) : null,
        esperado,
        diferencia,
        recaudos,
        aportes,
        gastos,
        utilidades,
        estado: !comparable ? "sin_comparacion" : Math.abs(diferencia) >= 1 ? "revisar" : "cuadrado",
      };
    })
    .filter((item) => item.tieneActividad || item.comparable);

  const discrepancias = reconciliaciones.filter((item) => item.estado === "revisar");
  const inconsistencias = filas.flatMap(({ ruta, auditoria }) =>
    (Array.isArray(auditoria?.casos) ? auditoria.casos : []).map((caso) => ({
      ...caso,
      ruta: ruta.nombre,
      rutaId: ruta.id,
    }))
  );
  const señalesInconsistencias = inconsistencias.reduce(
    (total, caso) => total + (Array.isArray(caso.señales) ? caso.señales.length : 1),
    0,
  );
  const rutasConError = filas.filter((fila) =>
    !fila.ventasOk || !fila.resumenOk || !fila.cierresOk || !fila.auditoriaOk
  ).length;

  return {
    creditosActivos: ventas.length,
    saldoActivo: ventas.reduce((total, item) => total + parseMoney(item.venta.saldo_actual), 0),
    creditosRiesgo: conRiesgo.length,
    saldoRiesgo: conRiesgo.reduce((total, item) => total + parseMoney(item.venta.saldo_actual), 0),
    sinPrimerAbono: sinPrimerAbono.length,
    saldoSinPrimerAbono: sinPrimerAbono.reduce((total, item) => total + parseMoney(item.venta.saldo_actual), 0),
    criticos: criticos.length,
    saldoCritico: criticos.reduce((total, item) => total + parseMoney(item.venta.saldo_actual), 0),
    candidatosPerdida: candidatosPerdida.length,
    saldoCandidatosPerdida: candidatosPerdida.reduce((total, item) => total + parseMoney(item.venta.saldo_actual), 0),
    topExposicion,
    reconciliaciones,
    discrepancias,
    diferenciaCajaTotal: discrepancias.reduce((total, item) => total + Math.abs(item.diferencia || 0), 0),
    inconsistencias,
    montoInconsistencias: inconsistencias.reduce((total, caso) => total + parseMoney(caso.monto_a_revisar), 0),
    señalesInconsistencias,
    rutasConsultadas: filas.length,
    rutasConError,
    fecha,
    actualizado: new Date().toISOString(),
  };
}

function AuditoriaInconsistencias({ resumen, loading }) {
  if (loading) {
    return (
      <section className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2 w-80 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
      </section>
    );
  }

  const casos = Array.isArray(resumen.inconsistencias) ? resumen.inconsistencias : [];

  return (
    <section className="mt-6 overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl p-3 ${casos.length > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
              {casos.length > 0 ? <FiFileText size={20} /> : <FiCheckCircle size={20} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">Auditoría de inconsistencias</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">En vivo</span>
              </div>
              <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-400">
                Revisa contradicciones entre créditos, saldos y recaudos. Este bloque no crea alertas ni modifica la cartera.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className={`rounded-xl px-3 py-2 ${casos.length > 0 ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Casos</p>
              <p className="mt-0.5 text-lg font-black">{casos.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">A revisar</p>
              <p className="mt-0.5 text-lg font-black">{formatMoney(resumen.montoInconsistencias)}</p>
            </div>
          </div>
        </div>
      </div>

      {casos.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <FiCheckCircle className="mx-auto text-emerald-500" size={25} />
          <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">No hay contradicciones financieras detectadas</p>
          <p className="mx-auto mt-1 max-w-lg text-xs font-medium leading-relaxed text-slate-400">El saldo guardado de las ventas coincide con sus recaudos y no hay pagos registrados en rutas equivocadas.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {casos.slice(0, 8).map((caso) => {
            const severity = SEVERIDADES[caso.severidad] || SEVERIDADES.media;
            return (
              <div key={`${caso.rutaId}-${caso.venta_id}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/30 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${severity.badge}`}>{severity.short}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{caso.ruta} · Venta #{caso.venta_id}</span>
                  </div>
                  <Link href={`/dashboard/ventas/${caso.venta_id}`} className="mt-2 block text-sm font-black text-slate-800 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
                    {caso.titulo}
                  </Link>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                    {caso.cliente?.nombre || "Cliente"} · {caso.detalle}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 lg:justify-end">
                  <div className="text-left lg:text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Monto a revisar</p>
                    <p className={`mt-1 text-sm font-black ${caso.monto_a_revisar > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-600 dark:text-slate-300"}`}>
                      {formatMoney(caso.monto_a_revisar)}
                    </p>
                  </div>
                  <Link href={`/dashboard/ventas/${caso.venta_id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400">
                    Revisar <FiExternalLink size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
          {casos.length > 8 && (
            <p className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Hay {casos.length - 8} casos más en las rutas seleccionadas</p>
          )}
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone }) {
  const tones = {
    dark: "bg-slate-950 text-white dark:bg-white dark:text-slate-950",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };
  return (
    <div className="glass rounded-[1.6rem] border border-slate-200/70 p-5 shadow-sm dark:border-slate-800/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">{hint}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone] || tones.dark}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function PanoramaCartera({ resumen, loading }) {
  if (loading) {
    return (
      <section className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
      </section>
    );
  }

  const diferenciaCaja = resumen.diferenciaCajaTotal || 0;

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Control financiero</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Panorama de posibles pérdidas</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-slate-400">
            Señales calculadas sobre la cartera activa y los cierres disponibles. El sistema informa; la decisión sigue siendo administrativa.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {resumen.rutasConsultadas} ruta{resumen.rutasConsultadas === 1 ? "" : "s"} consultada{resumen.rutasConsultadas === 1 ? "" : "s"}
        </span>
      </div>

      {resumen.rutasConError > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <FiAlertTriangle className="mt-0.5 shrink-0" size={16} />
          <p className="text-[11px] font-bold leading-relaxed">
            No se pudo actualizar la información completa de {resumen.rutasConError} ruta{resumen.rutasConError === 1 ? "" : "s"}. Los ceros de esa ruta no deben interpretarse como ausencia de riesgo; actualiza nuevamente cuando el servicio responda.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Saldo en riesgo"
          value={formatMoney(resumen.saldoRiesgo)}
          hint={`${resumen.creditosRiesgo} crédito${resumen.creditosRiesgo === 1 ? "" : "s"} con deterioro`}
          icon={FiDollarSign}
          tone="rose"
        />
        <StatCard
          label="Sin primer abono"
          value={resumen.sinPrimerAbono}
          hint={`${formatMoney(resumen.saldoSinPrimerAbono)} ya expuestos`}
          icon={FiClock}
          tone="amber"
        />
        <StatCard
          label="Críticos / 90+ días"
          value={resumen.criticos}
          hint={`${resumen.candidatosPerdida} candidato${resumen.candidatosPerdida === 1 ? "" : "s"} a posible pérdida`}
          icon={FiAlertTriangle}
          tone="rose"
        />
        <StatCard
          label="Diferencias de caja"
          value={resumen.discrepancias.length}
          hint={
            resumen.discrepancias.length > 0
              ? `${formatMoney(diferenciaCaja)} para revisar`
              : "Sin diferencias detectadas"
          }
          icon={FiShield}
          tone={resumen.discrepancias.length > 0 ? "amber" : "emerald"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Mayor dinero expuesto</h3>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ordenado por saldo pendiente</p>
            </div>
            <span className="rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              {formatMoney(resumen.saldoRiesgo)}
            </span>
          </div>
          {resumen.topExposicion.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <FiCheckCircle className="mx-auto text-emerald-500" size={24} />
              <p className="mt-3 text-xs font-black text-slate-500 dark:text-slate-300">No hay créditos con deterioro activo</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {resumen.topExposicion.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/30 sm:px-6">
                  <div className="min-w-0">
                    <Link href={`/dashboard/ventas/${item.id}`} className="block truncate text-sm font-black text-slate-800 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
                      {item.cliente}
                    </Link>
                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.ruta} · {item.cuotasAtrasadas} cuota{item.cuotasAtrasadas === 1 ? "" : "s"} atrasada{item.cuotasAtrasadas === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-rose-600 dark:text-rose-300">{formatMoney(item.saldo)}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{item.candidatoPerdida ? "Posible pérdida" : item.prioridad}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Conciliación de caja</h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cierre actual vs. movimientos registrados</p>
          </div>
          {resumen.reconciliaciones.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <FiClock className="mx-auto text-slate-300" size={24} />
              <p className="mt-3 text-xs font-black text-slate-500 dark:text-slate-300">Aún no hay movimientos para comparar</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {resumen.reconciliaciones.map((item) => (
                <div key={item.rutaId} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-black text-slate-800 dark:text-white">{item.ruta}</p>
                    {item.estado === "revisar" ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">Revisar</span>
                    ) : item.estado === "cuadrado" ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Cuadrado</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">Sin comparación</span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400">
                    <span>Recaudos: <strong className="text-slate-600 dark:text-slate-300">{formatMoney(item.recaudos)}</strong></span>
                    <span className="text-right">Gastos: <strong className="text-slate-600 dark:text-slate-300">{formatMoney(item.gastos)}</strong></span>
                  </div>
                  {item.estado === "revisar" && (
                    <p className="mt-2 text-[10px] font-black text-rose-600 dark:text-rose-300">
                      {item.diferencia < 0 ? "Faltante" : "Sobrante"}: {formatMoney(Math.abs(item.diferencia))} · esperado {formatMoney(item.esperado)} · cierre {formatMoney(item.cierreActual)}
                    </p>
                  )}
                  {item.estado === "sin_comparacion" && (
                    <p className="mt-2 text-[10px] font-medium leading-relaxed text-slate-400">Se necesitan cierres consecutivos para comparar el saldo con los movimientos.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AlertCard({ alerta, onEstado }) {
  const severity = SEVERIDADES[alerta.severidad] || SEVERIDADES.media;
  const estado = ESTADOS[alerta.estado] || ESTADOS.nueva;
  const SeverityIcon = severity.icon;
  const senales = alerta.senales || [];
  const detalle = quitarFormatoTelegram(alerta.detalle);

  return (
    <article className={`relative overflow-hidden rounded-[1.8rem] border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/80 ${severity.border}`}>
      <div className={`absolute inset-y-0 left-0 w-1.5 ${severity.rail}`} />
      <div className="p-5 pl-7 sm:p-6 sm:pl-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`mt-0.5 rounded-2xl p-3 ${severity.iconBg}`}>
              <SeverityIcon className={severity.accent} size={20} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${severity.badge}`}>
                  {severity.short}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${estado.badge}`}>
                  {estado.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {TIPOS[alerta.tipo] || alerta.tipo}
                </span>
              </div>
              <h2 className="text-base font-black leading-tight text-slate-900 dark:text-white sm:text-lg">
                {alerta.titulo}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-400">
                <span className="inline-flex items-center gap-1"><FiMapPin size={12} />{alerta.tienda?.nombre || "Ruta no disponible"}</span>
                <span className="inline-flex items-center gap-1"><FiClock size={12} />{fechaCorta(alerta.creada)}</span>
                <span>{fechaRelativa(alerta.creada)}</span>
              </div>
            </div>
          </div>
          <span className="rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            #{alerta.id}
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-950/60">
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            {detalle || "La alerta no contiene detalle adicional."}
          </p>
        </div>

        {senales.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {senales.map((senal, index) => {
              const senalStyle = SEVERIDADES[senal.severidad] || SEVERIDADES.media;
              return (
                <div key={`${senal.codigo || "senal"}-${index}`} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${senalStyle.rail}`} />
                  <span className="text-[11px] font-bold leading-relaxed text-slate-600 dark:text-slate-300">{senal.texto}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-[11px] font-bold text-slate-400 dark:border-slate-800">
          {alerta.cliente?.nombre && <span className="inline-flex items-center gap-1.5"><FiUser size={13} />{alerta.cliente.nombre}</span>}
          {alerta.trabajador && <span className="inline-flex items-center gap-1.5"><FiShield size={13} />{alerta.trabajador}</span>}
          {alerta.venta_id && <span className="inline-flex items-center gap-1.5"><FiCreditCard size={13} />Venta #{alerta.venta_id}</span>}
          {alerta.ocurrencias > 1 && <span>{alerta.ocurrencias} ocurrencias</span>}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {alerta.venta_id && (
              <Link href={`/dashboard/ventas/${alerta.venta_id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400">
                Ver venta <FiExternalLink size={12} />
              </Link>
            )}
            {alerta.cliente?.id && (
              <Link href={`/dashboard/clientes/${alerta.cliente.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400">
                Ver cliente <FiExternalLink size={12} />
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {alerta.estado !== "revisada" && alerta.estado !== "resuelta" && (
              <button onClick={() => onEstado(alerta.id, "revisada")} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-700 transition hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20">
                <FiCheck size={13} /> Revisada
              </button>
            )}
            {alerta.estado !== "resuelta" && (
              <button onClick={() => onEstado(alerta.id, "resuelta")} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">
                <FiCheckCircle size={13} /> Resolver
              </button>
            )}
            {alerta.estado === "resuelta" && (
              <button onClick={() => onEstado(alerta.id, "revisada")} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <FiRotateCcw size={13} /> Reabrir
              </button>
            )}
            {alerta.estado === "revisada" && (
              <button onClick={() => onEstado(alerta.id, "nueva")} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <FiRotateCcw size={13} /> Nueva
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AlertasPage() {
  const { user, selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alertas, setAlertas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, nuevas: 0, criticas: 0, altas: 0, medias: 0 });
  const [loading, setLoading] = useState(true);
  const [cargandoCartera, setCargandoCartera] = useState(true);
  const [resumenCartera, setResumenCartera] = useState(RESUMEN_CARTERA_VACIO);
  const [actualizando, setActualizando] = useState(false);
  const [estado, setEstado] = useState("activas");
  const [severidad, setSeveridad] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [tienda, setTienda] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const rutaContextoId = selectedStore?.tienda?.id ? String(selectedStore.tienda.id) : "todas";
  const filtroRuta = tienda || rutaContextoId;
  const nombreRutaSeleccionada = filtroRuta === "todas"
    ? "Todas mis rutas"
    : rutas.find((ruta) => String(ruta.id) === String(filtroRuta))?.nombre
      || selectedStore?.tienda?.nombre
      || "Ruta actual";
  const filtroInicialAplicado = useRef(false);

  const isAdmin = user?.is_staff || user?.is_superuser;
  const puedeVerAlertas = isAdmin && user?.username === USUARIO_ALERTAS;

  useEffect(() => {
    if (!authLoading && !filtroInicialAplicado.current) {
      setTienda(rutaContextoId);
      filtroInicialAplicado.current = true;
    }
  }, [authLoading, rutaContextoId]);

  const cargarCartera = useCallback(async (rutasData) => {
    const rutasSeguras = Array.isArray(rutasData) ? rutasData.filter((ruta) => ruta?.id) : [];
    const fecha = fechaLocal();

    setCargandoCartera(true);
    try {
      const filas = await Promise.all(
        rutasSeguras.map(async (ruta) => {
          const [ventasResponse, resumenResponse, cierresResponse, auditoriaResponse] = await Promise.all([
            leerJsonSeguro(`/ventas/activas/t/${ruta.id}/`, []),
            leerJsonSeguro(`/tiendas/cierre/resumen/${fecha}/t/${ruta.id}/`, {}),
            leerJsonSeguro(`/tiendas/cierres/t/${ruta.id}/`, []),
            leerJsonSeguro(`/tiendas/controles/inconsistencias/t/${ruta.id}/`, { casos: [] }),
          ]);
          return {
            ruta,
            ventas: Array.isArray(ventasResponse.data) ? ventasResponse.data : [],
            resumen: resumenResponse.data && typeof resumenResponse.data === "object" ? resumenResponse.data : {},
            cierres: Array.isArray(cierresResponse.data) ? cierresResponse.data : [],
            ventasOk: ventasResponse.ok,
            resumenOk: resumenResponse.ok,
            cierresOk: cierresResponse.ok,
            auditoria: auditoriaResponse.data && typeof auditoriaResponse.data === "object" ? auditoriaResponse.data : { casos: [] },
            auditoriaOk: auditoriaResponse.ok,
          };
        })
      );
      setResumenCartera(construirResumenCartera(filas, fecha));
    } finally {
      setCargandoCartera(false);
    }
  }, []);

  const cargarAlertas = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    else setActualizando(true);
    try {
      const queryRuta = filtroRuta !== "todas" ? `&tienda=${encodeURIComponent(filtroRuta)}` : "";
      const response = await apiFetch(`/tiendas/alertas/?estado=${encodeURIComponent(estado)}&limit=200${queryRuta}`);
      if (!response.ok) throw new Error(await getApiError(response, "No se pudieron consultar las alertas."));
      const data = await response.json();
      setAlertas(Array.isArray(data.alertas) ? data.alertas : []);
      const rutasData = Array.isArray(data.rutas) ? data.rutas : [];
      setRutas(rutasData);
      setResumen(data.resumen || { total: 0, nuevas: 0, criticas: 0, altas: 0, medias: 0 });
      const rutasParaPanel = filtroRuta === "todas"
        ? rutasData
        : rutasData.filter((ruta) => String(ruta.id) === String(filtroRuta));
      await cargarCartera(rutasParaPanel);
    } catch (error) {
      toast.error(error.message || "No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  }, [cargarCartera, estado, filtroRuta]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !puedeVerAlertas) {
      router.replace("/dashboard");
    }
  }, [authLoading, isAuthenticated, puedeVerAlertas, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && puedeVerAlertas && tienda !== null) cargarAlertas();
  }, [authLoading, isAuthenticated, puedeVerAlertas, cargarAlertas, estado, tienda]);

  const alertasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return alertas.filter((alerta) => {
      if (estado === "activas" && !["nueva", "revisada"].includes(alerta.estado)) return false;
      if (!['todas', 'activas'].includes(estado) && alerta.estado !== estado) return false;
      if (severidad !== "todas" && alerta.severidad !== severidad) return false;
      if (tipo !== "todos" && alerta.tipo !== tipo) return false;
      if (filtroRuta !== "todas" && String(alerta.tienda?.id) !== String(filtroRuta)) return false;
      if (termino && !obtenerTextoBusqueda(alerta).includes(termino)) return false;
      return true;
    });
  }, [alertas, busqueda, estado, severidad, tipo, filtroRuta]);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const response = await apiFetch(`/tiendas/alertas/${id}/estado/`, {
        method: "PATCH",
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!response.ok) throw new Error(await getApiError(response, "No se pudo actualizar la alerta."));
      setAlertas((actuales) => actuales.map((alerta) => alerta.id === id ? { ...alerta, estado: nuevoEstado } : alerta));
      setResumen((actual) => {
        const alerta = alertas.find((item) => item.id === id);
        if (!alerta || alerta.estado === nuevoEstado) return actual;
        const cambioNueva = (nuevoEstado === "nueva" ? 1 : 0) - (alerta.estado === "nueva" ? 1 : 0);
        const cambioCritica = alerta.severidad === "critica" ? cambioNueva : 0;
        const cambioAlta = alerta.severidad === "alta" ? cambioNueva : 0;
        const cambioMedia = alerta.severidad === "media" ? cambioNueva : 0;
        return {
          ...actual,
          nuevas: Math.max(0, (actual.nuevas || 0) + cambioNueva),
          criticas: Math.max(0, (actual.criticas || 0) + cambioCritica),
          altas: Math.max(0, (actual.altas || 0) + cambioAlta),
          medias: Math.max(0, (actual.medias || 0) + cambioMedia),
        };
      });
      toast.success(nuevoEstado === "resuelta" ? "Alerta resuelta." : "Estado actualizado.");
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar la alerta.");
    }
  };

  const limpiarFiltros = () => {
    setEstado("activas");
    setSeveridad("todas");
    setTipo("todos");
    setTienda(rutaContextoId);
    setBusqueda("");
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !puedeVerAlertas) return null;

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:shadow-none sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Monitoreo activo · cavb1205
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Centro de alertas</h1>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
                Revisa las señales importantes de tus rutas desde un solo lugar. Las alertas informan y dejan operar: ningún crédito se bloquea automáticamente.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-200">
                <FiMapPin size={13} /> Vista: {nombreRutaSeleccionada}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-200">
                <FiBell className="text-indigo-300" size={15} /> Telegram conectado
              </div>
              <button onClick={() => cargarAlertas(true)} disabled={actualizando} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-900 transition hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-70">
                <FiRefreshCw className={actualizando ? "animate-spin" : ""} size={15} /> Actualizar
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Nuevas" value={resumen.nuevas || 0} hint="Requieren tu revisión" icon={FiBell} tone="dark" />
          <StatCard label="Críticas" value={resumen.criticas || 0} hint="Prioridad inmediata" icon={FiAlertTriangle} tone="rose" />
          <StatCard label="Alta prioridad" value={resumen.altas || 0} hint="Seguimiento recomendado" icon={FiActivity} tone="amber" />
          <StatCard label="En cartera" value={resumen.total || 0} hint="Dentro de tus rutas" icon={FiCheckCircle} tone="emerald" />
        </section>

        <PanoramaCartera resumen={resumenCartera} loading={cargandoCartera} />
        <AuditoriaInconsistencias resumen={resumenCartera} loading={cargandoCartera} />

        <section className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"><FiFilter size={17} /></div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Filtrar señales</p>
                <p className="text-[11px] font-bold text-slate-400">{alertasFiltradas.length} visibles de {alertas.length}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-1 xl:justify-end">
              <label className="relative block xl:w-56">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar cliente, ruta..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-indigo-500/20" />
              </label>
              <select value={estado} onChange={(event) => setEstado(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <option value="activas">Alertas activas</option>
                <option value="nueva">Nuevas</option>
                <option value="revisada">Revisadas</option>
                <option value="resuelta">Historial resuelto</option>
                <option value="todas">Todo el historial</option>
              </select>
              <select value={severidad} onChange={(event) => setSeveridad(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <option value="todas">Todas las prioridades</option>
                <option value="critica">Críticas</option>
                <option value="alta">Altas</option>
                <option value="media">Medias</option>
              </select>
              <select value={filtroRuta} onChange={(event) => setTienda(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <option value="todas">Todas mis rutas</option>
                {rutas.map((ruta) => <option key={ruta.id} value={ruta.id}>{ruta.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {Object.entries(TIPOS).slice(0, 3).map(([codigo, label]) => (
                <button key={codigo} onClick={() => setTipo(tipo === codigo ? "todos" : codigo)} className={`rounded-full px-3 py-1.5 text-[10px] font-black transition ${tipo === codigo ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"}`}>
                  {label}
                </button>
              ))}
            </div>
            {(estado !== "activas" || severidad !== "todas" || tipo !== "todos" || filtroRuta !== rutaContextoId || busqueda) && (
              <button onClick={limpiarFiltros} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-rose-500"><FiX size={13} /> Limpiar filtros</button>
            )}
          </div>
        </section>

        <section className="mt-6">
          {alertasFiltradas.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><FiCheckCircle size={29} /></div>
              <h2 className="mt-5 text-lg font-black text-slate-900 dark:text-white">No hay alertas con estos filtros</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-400">Cuando el sistema detecte una situación que requiera tu atención aparecerá aquí y también llegará al bot de Telegram.</p>
              {(estado !== "activas" || severidad !== "todas" || tipo !== "todos" || filtroRuta !== rutaContextoId || busqueda) && <button onClick={limpiarFiltros} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 dark:shadow-none">Ver alertas activas de la ruta actual</button>}
            </div>
          ) : (
            <div className="space-y-4">
              {alertasFiltradas.map((alerta) => <AlertCard key={alerta.id} alerta={alerta} onEstado={cambiarEstado} />)}
            </div>
          )}
        </section>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400"><FiShield size={13} /> Alcance protegido: rutas administradas por cavb1205</p>
      </div>
    </main>
  );
}

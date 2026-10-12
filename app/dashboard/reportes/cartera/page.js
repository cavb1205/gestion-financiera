"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { FiDownload, FiRefreshCw, FiArrowUpRight } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import { formatMoney } from "../../../utils/format";
import { getAppDateString } from "../../../utils/datetime";
import { downloadCsv } from "../../../utils/rootReports.mjs";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import {
  buildPortfolio,
  selectClients,
  validatePortfolio,
  validateAudit,
  portfolioCsv,
} from "./report-model.mjs";

const panel =
  "glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5";
const input =
  "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm w-full";
const button =
  "rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800";

function Help({ children }) {
  return (
    <details className="text-xs text-slate-500 dark:text-slate-400 mt-2">
      <summary className="cursor-pointer w-fit text-indigo-600 dark:text-indigo-400">
        Cómo interpretarlo
      </summary>
      <p className="mt-2 leading-relaxed max-w-2xl">{children}</p>
    </details>
  );
}
function Metric({ label, value, children }) {
  return (
    <article className={panel}>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </h2>
      <p className="text-2xl font-bold mt-2 tabular-nums tracking-tight">
        {value}
      </p>
      <Help>{children}</Help>
    </article>
  );
}

export default function CarteraReportPage() {
  const {
    selectedStore,
    isAuthenticated,
    loading: authLoading,
    user,
  } = useAuth();
  const routeId = selectedStore?.tienda?.id;
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);
  const [snapshot, setSnapshot] = useState(null);
  const [auditState, setAuditState] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [order, setOrder] = useState("prioridad");
  const [minimum, setMinimum] = useState("");
  const [page, setPage] = useState(1);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!isAuthenticated || !routeId) return;
    const sequence = ++requestId.current;
    const current = () => sequence === requestId.current;
    setBusy(true);
    setError("");
    setSnapshot(null);
    setAuditState(null);
    // Este control opcional no bloquea la cartera ni transforma errores en "sin casos".
    const audit = isAdmin
      ? (async () => {
          try {
            const res = await apiFetch(
              `/tiendas/controles/inconsistencias/t/${routeId}/`,
            );
            if (!res.ok)
              throw new Error("El control de datos no está disponible.");
            const data = validateAudit(await res.json(), routeId);
            if (current()) setAuditState({ routeId, data });
          } catch (e) {
            if (current())
              setAuditState({
                routeId,
                error: e.message || "No se pudo consultar el control de datos.",
              });
          }
        })()
      : Promise.resolve();
    try {
      const res = await apiFetch(`/ventas/activas/t/${routeId}/`);
      if (!res.ok)
        throw new Error(
          "No se pudo cargar la cartera. Actualiza para intentar de nuevo.",
        );
      const ventas = validatePortfolio(await res.json());
      if (current())
        setSnapshot({
          routeId,
          ventas,
          loadedAt: new Date().toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
    } catch (e) {
      if (current()) setError(e.message || "No se pudo cargar la cartera.");
    } finally {
      if (current()) setBusy(false);
    }
    await audit;
  }, [isAuthenticated, routeId, isAdmin]);

  useEffect(() => {
    const requests = requestId;
    setSearch("");
    setFilter("todos");
    setMinimum("");
    setPage(1);
    load();
    return () => {
      requests.current++;
    };
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [search, filter, order, minimum]);

  const valid = !busy && !error && snapshot?.routeId === routeId;
  const model = useMemo(
    () => buildPortfolio(snapshot?.routeId === routeId ? snapshot.ventas : []),
    [snapshot, routeId],
  );
  const selected = useMemo(
    () =>
      selectClients(model.clients, { search, filter, order, minimum, page }),
    [model, search, filter, order, minimum, page],
  );
  const audit = auditState?.routeId === routeId ? auditState : null;
  const s = model.summary;
  const exportCsv = () => {
    if (!valid || !model.rows.length) return;
    const csv = portfolioCsv(model);
    downloadCsv(
      `cartera_ruta_${routeId}_${getAppDateString()}.csv`,
      csv.headers,
      csv.rows,
    );
  };
  if (authLoading || !isAuthenticated || !selectedStore)
    return <LoadingSpinner />;

  return (
    <div className="pb-10 space-y-5 text-slate-800 dark:text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Análisis de cartera
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {selectedStore.tienda.nombre} ·{" "}
            {valid
              ? `${model.rows.length} créditos activos · actualizado ${snapshot.loadedAt}`
              : "Consulta de créditos activos"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={button}
            onClick={load}
            disabled={busy}
            aria-label="Actualizar cartera"
          >
            <FiRefreshCw className={busy ? "animate-spin inline" : "inline"} />
          </button>
          <button
            className={button}
            onClick={exportCsv}
            disabled={!valid || !model.rows.length}
          >
            <FiDownload className="inline mr-2" />
            Exportar CSV
          </button>
        </div>
      </header>
      {busy || (!error && !valid) ? (
        <div role="status" className={panel}>
          Consultando la cartera de esta ruta…
        </div>
      ) : error ? (
        <div role="alert" className={`${panel} text-rose-600`}>
          <p>{error}</p>
          <button className={`${button} mt-3`} onClick={load}>
            Reintentar
          </button>
        </div>
      ) : !model.rows.length ? (
        <div className={panel}>
          <h2 className="font-semibold">Sin cartera activa</h2>
          <p className="text-sm text-slate-500 mt-1">
            Esta ruta no tiene créditos activos registrados.
          </p>
        </div>
      ) : (
        <>
          <section
            aria-label="Resumen de cartera"
            className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"
          >
            <Metric
              label="Saldo pendiente total"
              value={formatMoney(s.balance)}
            >
              Capital e intereses pendientes de todos los créditos activos. No
              es dinero disponible en caja ni utilidad.
            </Metric>
            <Metric
              label="Capital por recuperar"
              value={formatMoney(s.capital)}
            >
              Capital aún no recuperado en toda la cartera, incluidos créditos
              sin alertas. El indicador aplica primero los abonos al capital; no
              representa pérdidas ni utilidad contable.
            </Metric>
            <Metric
              label="Saldo de créditos con atraso"
              value={formatMoney(s.flaggedBalance)}
            >
              Saldo completo de {s.flagged} créditos señalados por atraso o
              seguimiento sin abono. Incluye cuotas futuras: no es el importe
              que deben pagar hoy. En créditos diarios el seguimiento usa
              jornadas registradas y días sin abono.
            </Metric>
            <Metric label="Clientes por atender" value={model.clients.length}>
              Personas con créditos que requieren cobranza o seguimiento,
              contadas una sola vez aunque tengan varios préstamos. No implica
              que deban declararse como pérdida.
            </Metric>
          </section>
          <section className={panel} aria-label="Niveles de seguimiento">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-bold">Dónde concentrar la revisión</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Cada crédito con atraso aparece en un solo nivel.
                </p>
              </div>
              <p className="text-sm">
                Importe atrasado calculado{" "}
                <strong className="block text-lg tabular-nums">
                  {formatMoney(s.arrears)}
                </strong>
              </p>
            </div>
            <Help>
              El importe atrasado usa vencimientos contractuales en créditos
              semanales o mensuales con calendario. En diarios es una estimación
              por jornadas registradas, no el saldo completo ni el total a
              cobrar del día de Liquidar. Un cliente puede necesitar seguimiento
              aun con importe calculado cero. Los niveles consideran la
              modalidad; riesgo crítico no equivale a pérdida y requiere
              revisión individual.
            </Help>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
              {model.groups.map((g) => (
                <Link
                  key={g.level}
                  href={`/dashboard/ventas?filtro=riesgo_${g.level}`}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:border-indigo-400"
                >
                  <span
                    className={`text-sm font-semibold ${g.level === 3 ? "text-rose-600" : g.level === 2 ? "text-orange-600" : "text-slate-600 dark:text-slate-300"}`}
                  >
                    {g.label} <FiArrowUpRight className="inline" />
                  </span>
                  <p className="text-xl font-bold mt-1">
                    {g.count}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      créditos
                    </span>
                  </p>
                  <p className="text-sm tabular-nums mt-1">
                    {formatMoney(g.balance)} de saldo
                  </p>
                </Link>
              ))}
            </div>
          </section>
          <section className={panel} aria-label="Clientes por atender">
            <h2 className="font-bold">Clientes por atender</h2>
            <Help>
              Saldo total y capital incluyen todos los créditos activos del
              cliente en esta ruta. El saldo señalado incluye solo sus créditos
              con alerta de atraso. Los días sin abono son seguimiento, no días
              contractuales de mora. Un abono pequeño no elimina el importe de
              cuotas vencidas del calendario.
            </Help>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
              <label className="text-xs text-slate-500">
                Buscar cliente
                <input
                  className={`${input} mt-1`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre o identificación"
                />
              </label>
              <label className="text-xs text-slate-500">
                Mostrar
                <select
                  className={`${input} mt-1`}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="todos">Todos por atender</option>
                  <option value="urgente">Urgentes o críticos</option>
                  <option value="critico">Riesgo crítico</option>
                  <option value="atraso">Con importe atrasado</option>
                  <option value="seguimiento">
                    Seguimiento sin importe calculado
                  </option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Ordenar por
                <select
                  className={`${input} mt-1`}
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                >
                  <option value="prioridad">Prioridad de cobranza</option>
                  <option value="capital">Capital por recuperar</option>
                  <option value="saldo">Saldo total</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Capital mínimo
                <input
                  type="number"
                  min="0"
                  className={`${input} mt-1`}
                  value={minimum}
                  onChange={(e) => setMinimum(e.target.value)}
                  placeholder="Sin mínimo"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {selected.count} de {model.clients.length} clientes · los filtros
              no cambian el resumen de la ruta.
            </p>
            <div className="space-y-3">
              {selected.items.map((c) => (
                <article
                  key={c.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <Link
                        href={`/dashboard/ventas?cliente=${encodeURIComponent(c.id)}`}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {c.name} <FiArrowUpRight className="inline" />
                      </Link>
                      <p className="text-xs text-slate-500 mt-1">
                        {c.identification || "Sin identificación"} · {c.credits}{" "}
                        créditos activos · {c.flagged} señalados
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{c.reason}</span>
                  </div>
                  <dl className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-3 text-sm">
                    {[
                      ["Saldo total", c.balance],
                      ["Capital por recuperar", c.capital],
                      ["Saldo señalado", c.flaggedBalance],
                      ["Importe atrasado calculado", c.arrears],
                    ].map(([label, amount]) => (
                      <div key={label}>
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="font-semibold tabular-nums mt-1">
                          {formatMoney(amount)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-xs text-slate-500 mt-3">
                    {c.daysLate !== null
                      ? `${c.daysLate} días de mora de calendario${c.hasDaily ? " · también tiene créditos sin calendario" : ""} · `
                      : ""}
                    {c.daysWithoutPayment} jornadas completas sin abono.
                    {c.flagged > 0 && c.arrears === 0
                      ? " Requiere seguimiento; no hay importe atrasado calculado."
                      : ""}
                    {c.candidate
                      ? " Revisar recuperación antes de decidir una pérdida."
                      : ""}
                  </p>
                </article>
              ))}
            </div>
            {!selected.count && (
              <p className="text-sm text-slate-500 py-5">
                No hay clientes que coincidan con estos filtros.
              </p>
            )}
            <nav
              aria-label="Paginación de clientes"
              className="flex items-center justify-between gap-2 mt-4 text-sm"
            >
              <button
                className={button}
                disabled={selected.current <= 1}
                onClick={() => setPage(selected.current - 1)}
              >
                Anterior
              </button>
              <span>
                Página {selected.current} de {selected.pages}
              </span>
              <button
                className={button}
                disabled={selected.current >= selected.pages}
                onClick={() => setPage(selected.current + 1)}
              >
                Siguiente
              </button>
            </nav>
          </section>
          <details className={panel}>
            <summary className="font-semibold cursor-pointer">
              Información adicional de la cartera
            </summary>
            <div className="grid md:grid-cols-2 gap-5 mt-4">
              {[
                ["Por estado", model.statuses, "filtro"],
                ["Por modalidad", model.terms, "plazo"],
              ].map(([title, groups, param]) => (
                <div key={title}>
                  <h3 className="text-sm font-semibold mb-2">{title}</h3>
                  {groups.map((g) => (
                    <Link
                      className="flex justify-between py-2 text-sm border-b border-slate-100 dark:border-slate-800 hover:text-indigo-600"
                      key={g.label}
                      href={`/dashboard/ventas?${param}=${encodeURIComponent(g.label)}`}
                    >
                      <span>
                        {g.label} · {g.count}
                      </span>
                      <span>{formatMoney(g.balance)}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-sm mt-4">
              Sin primer abono: {s.noFirst} créditos; {s.noFirstFlagged}{" "}
              requieren seguimiento.
            </p>
            <p className="text-sm mt-2">
              Avance de pago de créditos activos:{" "}
              {s.total > 0 ? ((100 * s.paid) / s.total).toFixed(1) : "0"}%.
            </p>
            <Help>
              Este avance solo considera créditos que siguen activos. No mide la
              recuperación del mes, no incluye créditos ya pagados y no es un
              indicador de utilidad.
            </Help>
          </details>
        </>
      )}
      {isAdmin && valid && (
        <section className={panel} aria-label="Control de datos de la ruta">
          <h2 className="font-bold">Control de datos de la ruta</h2>
          <Help>
            Detecta diferencias entre saldos, recaudos y otros registros. Son
            casos para revisar, no evidencia de fraude ni pérdidas confirmadas.
            Consultar este reporte no modifica créditos ni envía notificaciones.
          </Help>
          {!audit ? (
            <p className="text-sm mt-3" role="status">
              Consultando control de datos…
            </p>
          ) : audit.error ? (
            <p
              role="alert"
              className="text-amber-700 dark:text-amber-400 text-sm mt-3"
            >
              {audit.error} La cartera permanece disponible; actualiza para
              reintentar este control.
            </p>
          ) : (
            <>
              <p className="text-sm mt-3">
                {audit.data.resumen.casos === 0
                  ? "Sin inconsistencias detectadas en esta consulta."
                  : `${audit.data.resumen.casos} casos por revisar · ${formatMoney(audit.data.resumen.monto_a_revisar)} de importe a revisar (no pérdida).`}
              </p>
              {audit.data.casos.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-indigo-600 dark:text-indigo-400">
                    Ver casos de esta ruta
                  </summary>
                  <p className="text-xs text-slate-500 my-3">
                    Mostrando {audit.data.casos.length} de{" "}
                    {audit.data.resumen.casos} casos
                    {audit.data.resumen.casos > audit.data.casos.length
                      ? " · el control devuelve los primeros 100, ordenados por gravedad."
                      : "."}
                  </p>
                  <ul className="space-y-3">
                    {audit.data.casos.map((c) => (
                      <li
                        key={c.venta_id}
                        className="border-t border-slate-200 dark:border-slate-700 pt-3 text-sm"
                      >
                        <Link
                          className="font-semibold text-indigo-600 dark:text-indigo-400"
                          href={`/dashboard/ventas/${c.venta_id}`}
                        >
                          Crédito #{c.venta_id} ·{" "}
                          {c.cliente?.nombre || "Cliente"}{" "}
                          <FiArrowUpRight className="inline" />
                        </Link>
                        <p className="mt-1">{c.titulo}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {c.detalle}
                        </p>
                        <p className="mt-1 tabular-nums">
                          {formatMoney(c.monto_a_revisar)} a revisar
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

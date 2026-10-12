"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, getApiError } from "../../utils/api";
import { formatDate, formatMoney } from "../../utils/format";
import {
  TIPOS_ALERTAS,
  puedeVerAlertas,
  consultaAlertas,
  validarPendientes,
  adaptarHistorial,
  textoAlerta,
  esCobranza,
} from "../../utils/alertas.mjs";
import LoadingSpinner from "../../components/LoadingSpinner";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";
const TONOS = {
  critica: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  alta: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  media: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function RevisionDialog({ caso, busy, error, onClose, onSave }) {
  const ref = useRef(null);
  const inputRef = useRef(null);
  const [nota, setNota] = useState("");
  const [estado, setEstado] = useState("revisada");
  useEffect(() => {
    ref.current.showModal();
    inputRef.current.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="revision-titulo"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(estado, nota);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="revision-titulo" className="text-lg font-bold">
            Registrar revisión
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar revisión"
            className={BUTTON}
          >
            <FiX />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {caso.tienda.nombre} · {caso.titulo}
        </p>
        <label
          className="mt-5 block text-sm font-semibold"
          htmlFor="revision-estado"
        >
          Resultado de la revisión
        </label>
        <select
          id="revision-estado"
          value={estado}
          disabled={busy}
          onChange={(event) => setEstado(event.target.value)}
          className={`${INPUT} mt-2`}
        >
          <option value="revisada">Revisada · continúa el seguimiento</option>
          {!esCobranza(caso) && (
            <option value="resuelta">Revisión terminada</option>
          )}
        </select>
        <label
          className="mt-4 block text-sm font-semibold"
          htmlFor="revision-nota"
        >
          Nota {estado === "resuelta" ? "(obligatoria)" : "(opcional)"}
        </label>
        <textarea
          ref={inputRef}
          id="revision-nota"
          value={nota}
          disabled={busy}
          onChange={(event) => setNota(event.target.value)}
          maxLength={1000}
          rows={4}
          className={`${INPUT} mt-2`}
          placeholder="Qué comprobaste y cuál es el siguiente paso"
          required={estado === "resuelta"}
          minLength={estado === "resuelta" ? 5 : undefined}
        />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Revisar no elimina deuda ni cambia saldos. La condición de cobranza se
          resuelve cuando realmente deja de existir.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-3 text-sm text-rose-600 dark:text-rose-300"
          >
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={BUTTON}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy || (estado === "resuelta" && nota.trim().length < 5)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar revisión"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Caso({ caso, historial, disabled, abriendo, onAbrir, onRevisar }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-md px-2 py-1 font-semibold ${TONOS[caso.severidad]}`}
            >
              {caso.severidad === "critica"
                ? "Crítica"
                : caso.severidad === "alta"
                  ? "Alta"
                  : "Media"}
            </span>
            <span className="font-semibold text-slate-500">
              {caso.tienda.nombre}
            </span>
            <span className="text-slate-500">
              {caso.estado === "revisada"
                ? "Revisada · sigue abierta"
                : caso.estado === "resuelta"
                  ? "Resuelta"
                  : "Nueva"}
            </span>
          </div>
          <h2 className="mt-2 text-base font-semibold">{caso.titulo}</h2>
          {caso.cliente?.nombre && (
            <p className="mt-1 text-sm text-slate-500">
              {caso.cliente.nombre}
              {caso.venta_id ? ` · Crédito #${caso.venta_id}` : ""}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Última actualización: {formatDate(caso.fecha)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          {caso.monto !== null && caso.monto !== undefined && (
            <div className="sm:text-right">
              <p className="text-xs text-slate-500">
                {caso.monto_etiqueta || "Monto a revisar"}
              </p>
              <p className="mt-1 font-semibold tabular-nums">
                {formatMoney(caso.monto)}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                onAbrir(
                  caso,
                  caso.venta_id
                    ? `/dashboard/ventas/${caso.venta_id}`
                    : caso.origen === "cierres"
                      ? "/dashboard/cierre-caja"
                      : "/dashboard",
                )
              }
              disabled={disabled}
              className={BUTTON}
            >
              {abriendo
                ? "Abriendo…"
                : caso.venta_id
                  ? "Ver crédito"
                  : caso.origen === "cierres"
                    ? "Ver cierres"
                    : "Ver ruta"}
              <FiArrowRight />
            </button>
            {caso.alerta_id && !historial && (
              <button
                onClick={() => onRevisar(caso)}
                disabled={disabled}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Revisar
              </button>
            )}
          </div>
        </div>
      </div>
      <details className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800 sm:px-5">
        <summary className="cursor-pointer font-semibold text-slate-500">
          Detalle y seguimiento
        </summary>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
          {textoAlerta(caso.detalle)}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {caso.ayuda}
        </p>
        {caso.fechas_pendientes?.length > 0 && (
          <p className="mt-3 break-words text-xs text-slate-500">
            Fechas: {caso.fechas_pendientes.join(", ")}
          </p>
        )}
        {caso.datos?.resolucion && (
          <p className="mt-3 text-xs text-slate-500">
            Resolución automática: {caso.datos.resolucion.motivo}
          </p>
        )}
        {caso.revisiones?.length > 0 && (
          <ol className="mt-3 space-y-2 border-l-2 border-slate-200 pl-3 dark:border-slate-700">
            {caso.revisiones.map((r, i) => (
              <li key={`${r.fecha}-${i}`} className="text-xs text-slate-500">
                <p className="font-semibold">
                  {r.actor} · {formatDate(r.fecha)} · {r.nuevo}
                </p>
                <p className="mt-1 whitespace-pre-line">
                  {r.nota || "Sin nota adicional"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </details>
    </article>
  );
}

export default function AlertasPage() {
  const {
    user,
    selectedStore,
    selectStore,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();
  const router = useRouter();
  const permitido = puedeVerAlertas(user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState(false);
  const [ruta, setRuta] = useState("todas");
  const [prioridad, setPrioridad] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [termino, setTermino] = useState("");
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(null);
  const [revisionError, setRevisionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [abriendo, setAbriendo] = useState(null);
  const requestId = useRef(0);
  const actionBusy = useRef(false);
  const query = consultaAlertas({
    historial,
    ruta,
    prioridad,
    tipo,
    estado,
    busqueda: termino,
    pagina,
  });
  const cargar = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const response = await apiFetch(query);
      if (!response.ok)
        throw new Error(
          await getApiError(
            response,
            "No se pudieron consultar los pendientes.",
          ),
        );
      const raw = await response.json();
      const next = historial ? adaptarHistorial(raw) : validarPendientes(raw);
      if (id === requestId.current) {
        setData(next);
        setError("");
      }
    } catch (err) {
      if (id === requestId.current)
        setError(err.message || "No se pudo confirmar la información.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query, historial]);
  useEffect(() => {
    if (!authLoading && isAuthenticated && !permitido)
      router.replace("/dashboard");
  }, [authLoading, isAuthenticated, permitido, router]);
  useEffect(() => {
    if (!authLoading && isAuthenticated && permitido) void cargar();
    return () => {
      requestId.current += 1;
    };
  }, [authLoading, isAuthenticated, permitido, cargar]);

  const filtro = (setter, value) => {
    setter(value);
    setPagina(1);
  };
  const cambiarVista = (value) => {
    if (value === historial) return;
    setHistorial(value);
    setPagina(1);
    setData(null);
    setError("");
    setTipo("");
    setEstado("");
  };
  const guardar = async (nuevoEstado, nota) => {
    if (actionBusy.current) return;
    actionBusy.current = true;
    setBusy(true);
    setRevisionError("");
    try {
      const response = await apiFetch(
        `/tiendas/alertas/${revision.alerta_id}/estado/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            estado: nuevoEstado,
            nota,
            actualizada: revision.actualizada,
          }),
        },
      );
      if (!response.ok)
        throw new Error(
          await getApiError(response, "No se pudo registrar la revisión."),
        );
      setRevision(null);
      await cargar();
    } catch (err) {
      setRevisionError(
        `${err.message} Si la respuesta se perdió, actualiza y comprueba el historial antes de repetir.`,
      );
    } finally {
      actionBusy.current = false;
      setBusy(false);
    }
  };
  const abrir = async (caso, destino) => {
    if (actionBusy.current) return;
    actionBusy.current = true;
    setAbriendo(caso.key);
    try {
      if (String(selectedStore?.tienda?.id) !== String(caso.tienda.id)) {
        const response = await apiFetch(
          `/tiendas/detail/admin/${caso.tienda.id}/`,
          { cache: "no-store" },
        );
        if (!response.ok)
          throw new Error(
            await getApiError(response, "No se pudo abrir esta ruta."),
          );
        const fresh = await response.json();
        if (String(fresh?.tienda?.id) !== String(caso.tienda.id))
          throw new Error("La ruta recibida no corresponde al caso.");
        if (fresh.vencida_manualmente && !user?.is_superuser)
          throw new Error(
            "Esta ruta está vencida manualmente. Revisa su membresía antes de operar.",
          );
        selectStore(fresh);
      }
      router.push(destino);
    } catch (err) {
      setError(err.message);
    } finally {
      actionBusy.current = false;
      setAbriendo(null);
    }
  };
  if (authLoading) return <LoadingSpinner />;
  if (!isAuthenticated || !permitido) return null;
  const resumen = data?.resumen;
  const p = data?.paginacion;
  const rutaNombre =
    ruta === "todas"
      ? "Todas mis rutas"
      : data?.rutas.find((r) => String(r.id) === ruta)?.nombre ||
        "Ruta seleccionada";
  return (
    <main className="mx-auto max-w-6xl space-y-5 pb-12 text-slate-800 dark:text-slate-100">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Control administrativo · {rutaNombre}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Pendientes de revisión
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Excepciones para comprobar y decidir. La cobranza habitual continúa
            en Ventas activas y Liquidar.
          </p>
        </div>
        <button onClick={cargar} disabled={loading || busy} className={BUTTON}>
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </header>
      <nav
        aria-label="Vista de alertas"
        className="flex gap-5 border-b border-slate-200 dark:border-slate-800"
      >
        {[false, true].map((value) => (
          <button
            key={String(value)}
            onClick={() => cambiarVista(value)}
            disabled={busy}
            aria-current={historial === value ? "page" : undefined}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold ${historial === value ? "border-indigo-600 text-indigo-600 dark:text-indigo-300" : "border-transparent text-slate-500"}`}
          >
            {value ? "Historial resuelto" : "Pendientes actuales"}
          </button>
        ))}
      </nav>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          <p className="font-semibold">No se pudo confirmar la información</p>
          <p className="mt-1">{error}</p>
          {data && (
            <p className="mt-1">
              Los datos visibles son anteriores. Actualiza antes de tomar
              decisiones.
            </p>
          )}
        </div>
      )}
      {resumen && !historial && (
        <dl
          aria-label="Resumen de excepciones"
          className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white py-4 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900"
        >
          {[
            ["Pendientes", resumen.total, "Casos, no clientes"],
            ["Críticas", resumen.criticas, "Incluye las revisadas"],
            ["Revisadas", resumen.revisadas, "Continúan abiertas"],
          ].map(([label, value, hint]) => (
            <div key={label} className="px-3 sm:px-5">
              <dt className="text-xs font-semibold text-slate-500">{label}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
              <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
            </div>
          ))}
        </dl>
      )}
      <section aria-label="Filtros de alertas" className="space-y-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            filtro(setTermino, busqueda.trim());
          }}
          className="flex gap-2"
        >
          <label className="relative flex-1">
            <span className="sr-only">Buscar excepciones</span>
            <FiSearch className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Cliente, ruta, crédito o motivo"
              className={`${INPUT} pl-9`}
            />
          </label>
          <button type="submit" className={BUTTON}>
            Buscar
          </button>
        </form>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            aria-label="Ruta de los pendientes"
            value={ruta}
            onChange={(event) => filtro(setRuta, event.target.value)}
            className={INPUT}
          >
            <option value="todas">Todas mis rutas</option>
            {data?.rutas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          <select
            aria-label="Prioridad de los pendientes"
            value={prioridad}
            onChange={(event) => filtro(setPrioridad, event.target.value)}
            className={INPUT}
          >
            <option value="">Todas las prioridades</option>
            <option value="critica">Críticas</option>
            <option value="alta">Altas</option>
            <option value="media">Medias</option>
          </select>
          <select
            aria-label="Tipo de excepción"
            value={tipo}
            onChange={(event) => filtro(setTipo, event.target.value)}
            className={INPUT}
          >
            <option value="">Todos los motivos</option>
            {Object.entries(TIPOS_ALERTAS)
              .filter(
                ([key]) =>
                  !historial ||
                  !["INCONSISTENCIA", "INTEGRIDAD_CAJA"].includes(key),
              )
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
          {!historial && (
            <select
              aria-label="Estado de revisión"
              value={estado}
              onChange={(event) => filtro(setEstado, event.target.value)}
              className={INPUT}
            >
              <option value="">Nuevas y revisadas</option>
              <option value="nueva">Nuevas</option>
              <option value="revisada">Revisadas</option>
            </select>
          )}
        </div>
      </section>
      <details className="rounded-xl border border-slate-200 px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700">
        <summary className="cursor-pointer font-semibold">
          Qué comprueban estos controles
        </summary>
        <p className="mt-2">
          Las señales no confirman fraude ni pérdidas. Caja compara su historial
          auditado con los registros actuales, no con un conteo físico. Los
          cierres pendientes se agrupan por ruta.
        </p>
        {data?.caja_sin_historial.length > 0 && (
          <p className="mt-2">
            Sin historial auditado de caja disponible:{" "}
            {data.caja_sin_historial.join(", ")}. No se puede confirmar su
            coherencia con este control.
          </p>
        )}
        <Link
          href="/dashboard/reportes/cartera"
          className="mt-2 inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-300"
        >
          Ver reporte de cartera de la ruta activa <FiArrowRight />
        </Link>
      </details>
      <section
        aria-label="Lista de excepciones"
        aria-busy={loading}
        className={loading ? "opacity-60" : ""}
      >
        {loading && (
          <p role="status" className="mb-3 text-sm text-slate-500">
            Consultando excepciones…
          </p>
        )}
        {data?.casos.length === 0 && !loading && !error && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <FiCheck className="mx-auto text-slate-400" size={24} />
            <h2 className="mt-3 text-base font-semibold">
              {p.total === 0 && (termino || prioridad || tipo || estado)
                ? "No hay casos con estos filtros"
                : historial
                  ? "No hay revisiones terminadas"
                  : "Sin excepciones detectadas por estos controles"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {historial
                ? "El historial se conserva sin modificar los créditos."
                : "Esto no garantiza recuperación ni confirma el efectivo físico. Revisa el alcance del control."}
            </p>
          </div>
        )}
        <div className="space-y-3">
          {data?.casos.map((caso) => (
            <Caso
              key={caso.key}
              caso={caso}
              historial={historial}
              disabled={loading || Boolean(error) || busy || Boolean(abriendo)}
              abriendo={abriendo === caso.key}
              onAbrir={abrir}
              onRevisar={(c) => {
                setRevision(c);
                setRevisionError("");
              }}
            />
          ))}
        </div>
      </section>
      {p && (
        <nav
          aria-label="Paginación de alertas"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-700"
        >
          <p className="text-slate-500">
            {p.total} casos
            {!historial && resumen ? ` de ${resumen.total} pendientes` : ""} ·
            Página {p.page} de {p.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina(p.page - 1)}
              disabled={loading || p.page <= 1 || busy}
              className={BUTTON}
            >
              <FiChevronLeft /> Anterior
            </button>
            <button
              onClick={() => setPagina(p.page + 1)}
              disabled={loading || p.page >= p.pages || busy}
              className={BUTTON}
            >
              Siguiente <FiChevronRight />
            </button>
          </div>
        </nav>
      )}
      {revision && (
        <RevisionDialog
          caso={revision}
          busy={busy}
          error={revisionError}
          onClose={() => {
            if (!busy) setRevision(null);
          }}
          onSave={guardar}
        />
      )}
    </main>
  );
}

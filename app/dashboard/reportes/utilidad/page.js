"use client";

import { useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiBarChart2, FiDownload, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import { getAppDateString } from "../../../utils/datetime";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ReportView from "./_components/ReportView";
import { crearCsvReporte, leerRespuestaReporte, procesarRespaldo } from "./report-model";
import HistoricalReport from "./_components/HistoricalReport";

export default function ReportesPage() {
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const tiendaId = selectedStore?.tienda?.id;
  const zonaHoraria = selectedStore?.tienda?.zona_horaria;
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const solicitudRef = useRef(0);

  useEffect(() => {
    const hoy = getAppDateString(0, new Date(), zonaHoraria);
    setFechaInicio(`${hoy.slice(0, 8)}01`);
    setFechaFin(hoy);
    setReporte(null);
    setError("");
    setCargando(false);
    // Ignore responses from a previously selected route or an unmounted page.
    solicitudRef.current += 1;
    return () => { solicitudRef.current += 1; };
  }, [tiendaId, zonaHoraria]);

  const reporteVisible = reporte?.tiendaId === tiendaId ? reporte : null;

  async function generarReporte(event) {
    event?.preventDefault();
    if (!tiendaId || cargando) return;
    const hoy = getAppDateString(0, new Date(), zonaHoraria);
    if (!fechaInicio || !fechaFin || fechaInicio > fechaFin || fechaFin > hoy) {
      setError("Selecciona un período válido: desde no puede superar hasta, y hasta no puede ser una fecha futura.");
      return;
    }
    const solicitud = ++solicitudRef.current;
    const contexto = { tiendaId, nombre: selectedStore.tienda.nombre, inicio: fechaInicio, fin: fechaFin };
    setCargando(true);
    setError("");
    setReporte(null);
    try {
      let filas;
      let historico = null;
      let respaldo = false;
      try {
        const response = await apiFetch(`/tiendas/reportes/utilidad/${contexto.inicio}/${contexto.fin}/t/${tiendaId}/?version=2`);
        // Authorization failures must not be masked by fallback requests.
        if (response.status === 401 || response.status === 403) throw new Error("No tienes acceso al reporte de esta ruta.");
        if (!response.ok) throw new Error("No se pudo consultar el reporte consolidado.");
        ({ filas, historico } = leerRespuestaReporte(await response.json(), contexto.inicio, contexto.fin, tiendaId));
      } catch (err) {
        if (solicitud !== solicitudRef.current) return;
        if (err.message === "No tienes acceso al reporte de esta ruta." || !localStorage.getItem("authToken")) throw err;
        const [ventasRes, gastosRes] = await Promise.all([
          apiFetch(`/ventas/list/${contexto.inicio}/${contexto.fin}/t/${tiendaId}/?vista=reporte`),
          apiFetch(`/gastos/list/${contexto.inicio}/${contexto.fin}/t/${tiendaId}/`),
        ]);
        if (!ventasRes.ok || !gastosRes.ok) throw new Error("No se pudo cargar el reporte. Intenta nuevamente.");
        filas = procesarRespaldo(await ventasRes.json(), await gastosRes.json(), contexto.inicio, contexto.fin);
        respaldo = true;
      }
      if (solicitud === solicitudRef.current) setReporte({ ...contexto, filas, respaldo, historico });
    } catch (err) {
      if (solicitud === solicitudRef.current) setError(err.message || "No se pudo cargar el reporte.");
    } finally {
      if (solicitud === solicitudRef.current) setCargando(false);
    }
  }

  function exportarReporte() {
    if (!reporteVisible?.filas.length) return;
    const url = URL.createObjectURL(new Blob([crearCsvReporte(reporteVisible)], { type: "text/csv;charset=utf-8;" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `utilidad_ruta_${reporteVisible.tiendaId}_${reporteVisible.inicio}_${reporteVisible.fin}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  const filtrosModificados = reporteVisible && (reporteVisible.inicio !== fechaInicio || reporteVisible.fin !== fechaFin);
  const hoy = getAppDateString(0, new Date(), zonaHoraria);
  const sinDatosRespaldo = reporteVisible?.respaldo && reporteVisible.filas.length === 0;
  const tituloVacio = !reporteVisible ? "Selecciona el período que quieres revisar"
    : sinDatosRespaldo ? "Sin préstamos o gastos en el respaldo" : "Sin movimientos en el período";
  const descripcionVacia = !reporteVisible ? "Genera el reporte para ver los resultados de la ruta."
    : sinDatosRespaldo ? "Solo se pudieron consultar préstamos y gastos. El respaldo no permite verificar recaudos, aportes ni retiros; no confirma ausencia de movimientos de caja."
      : `No hay registros del ${reporteVisible.inicio} al ${reporteVisible.fin}.`;

  return (
    <div className="mx-auto w-full max-w-7xl pb-12">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">{selectedStore.tienda.nombre}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">Reporte de utilidad</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">Distingue lo cobrado, lo gastado y lo retirado. Interpreta el resultado según las necesidades de tu negocio.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={generarReporte} disabled={cargando} aria-label="Actualizar reporte" className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <FiRefreshCw className={cargando ? "animate-spin" : ""} aria-hidden="true" />
          </button>
          {reporteVisible?.filas.length > 0 && (
            <button type="button" onClick={exportarReporte} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              <FiDownload aria-hidden="true" />Exportar CSV
            </button>
          )}
        </div>
      </header>

      <form onSubmit={generarReporte} className="glass mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="fecha-inicio" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Desde</label>
          <input id="fecha-inicio" type="date" required max={hoy} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="fecha-fin" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Hasta</label>
          <input id="fecha-fin" type="date" required max={hoy} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </div>
        <button type="submit" disabled={cargando} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{cargando ? "Consultando…" : "Generar reporte"}</button>
      </form>
      {error && (
        <p role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />{error}
        </p>
      )}
      {filtrosModificados && <p role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">Cambiaste las fechas. El reporte y la exportación siguen mostrando el período anterior hasta que pulses Generar reporte.</p>}
      <div aria-live="polite" aria-busy={cargando}>
        {cargando ? (
          <div className="py-16 text-center text-sm text-slate-500">Consultando los registros de esta ruta…</div>
        ) : reporteVisible?.filas.length > 0 ? (
          <ReportView reporte={reporteVisible} />
        ) : (
          <div className="glass rounded-2xl border border-slate-200 px-6 py-16 text-center dark:border-slate-800">
            <FiBarChart2 size={32} className="mx-auto mb-4 text-slate-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{tituloVacio}</h2>
            <p className="mt-2 text-sm text-slate-500">{descripcionVacia}</p>
            {reporteVisible && <div className="mt-6 text-left"><HistoricalReport reporte={reporteVisible} /></div>}
          </div>
        )}
      </div>
    </div>
  );
}

// app/dashboard/cierre-caja/page.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiLock,
  FiCalendar,
  FiDollarSign,
  FiRefreshCw,
  FiTrash2,
  FiCheck,
  FiInfo,
  FiActivity,
  FiShield,
  FiClock,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiPackage,
  FiList,
  FiArrowDownRight,
  FiArrowUpRight,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ConfirmModal from "@/app/components/ConfirmModal";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { formatMoney } from "../../utils/format";
import { formatAppDate, formatAppDateTime, getAppDateString } from "../../utils/datetime";
import { apiFetch, getApiError } from "../../utils/api";
import Pagination from "../../components/Pagination";
import { interpretarResumenCierre, mensajeErrorCierre } from "@/app/utils/cierres.mjs";

export default function CierreCajaPage() {
  const { selectedStore, isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !selectedStore)) router.push("/login");
  }, [authLoading, isAuthenticated, selectedStore, router]);
  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  return <CierreCajaRuta key={`${user?.id}:${selectedStore.tienda.id}:${selectedStore.tienda.zona_horaria}`} selectedStore={selectedStore} user={user} />;
}

function CierreCajaRuta({ selectedStore, user }) {
  const isWorker = !(user?.is_staff || user?.is_superuser);
  const storeId = selectedStore.tienda.id;
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getAppDateString(0, new Date(), selectedStore.tienda.zona_horaria));
  const [resumenError, setResumenError] = useState("");
  const alive = useRef(true);
  const summarySequence = useRef(0);
  const previousSequence = useRef(0);
  const historySequence = useRef(0);
  const creatingRef = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; summarySequence.current += 1; previousSequence.current += 1; historySequence.current += 1; };
  }, []);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete modal
  const [cierreToDelete, setCierreToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Caja anterior
  const [cajaAnterior, setCajaAnterior] = useState(null);

  // Resumen del día
  const [resumenDia, setResumenDia] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  // Historial auditable de movimientos de caja
  const [movimientosCaja, setMovimientosCaja] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState("");
  const [saldoActualHistorial, setSaldoActualHistorial] = useState(null);
  const [historialDesde, setHistorialDesde] = useState(null);

  // Fetch lista de cierres
  const fetchCierres = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(
        `/tiendas/cierres/t/${storeId}/`
      );
      if (!response.ok) throw new Error("Error al obtener los cierres de caja");
      const data = await response.json();
      if (!alive.current) return;
      if (data.message) {
        setCierres([]);
      } else {
        setCierres(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (alive.current) toast.error(error.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [storeId]);

  const fetchMovimientosCaja = useCallback(async () => {
    const version = ++historySequence.current;
    setLoadingMovimientos(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (tipoMovimiento) params.set("tipo", tipoMovimiento);
      const response = await apiFetch(
        `/tiendas/caja/movimientos/t/${storeId}/?${params.toString()}`
      );
      if (!response.ok) throw new Error("Error al obtener el historial de caja");
      const data = await response.json();
      if (!alive.current || version !== historySequence.current) return;
      setMovimientosCaja(Array.isArray(data) ? data : (data.results || []));
      setSaldoActualHistorial(data.saldo_actual ?? null);
      setHistorialDesde(data.historial_desde || null);
    } catch (error) {
      if (!alive.current || version !== historySequence.current) return;
      setMovimientosCaja([]);
      setSaldoActualHistorial(null);
      setHistorialDesde(null);
      toast.error(error.message);
    } finally {
      if (alive.current && version === historySequence.current) setLoadingMovimientos(false);
    }
  }, [storeId, tipoMovimiento]);

  // Fetch caja anterior para la fecha seleccionada
  const fetchCajaAnterior = useCallback(async () => {
    if (!selectedDate) return;
    const version = ++previousSequence.current;
    try {
      const response = await apiFetch(`/tiendas/cierre/${selectedDate}/t/${storeId}/`);
      if (!response.ok) throw new Error("Error al consultar caja anterior");
      const data = await response.json();
      if (alive.current && version === previousSequence.current) setCajaAnterior(data.message ? null : data);
    } catch {
      if (alive.current && version === previousSequence.current) setCajaAnterior(null);
    }
  }, [selectedDate, storeId]);

  useEffect(() => {
    const timer = setTimeout(fetchCierres, 0);
    return () => clearTimeout(timer);
  }, [fetchCierres]);

  useEffect(() => {
    const timer = setTimeout(fetchMovimientosCaja, 0);
    return () => { clearTimeout(timer); historySequence.current += 1; };
  }, [fetchMovimientosCaja]);

  // Fetch resumen del día para la fecha seleccionada
  const fetchResumenDia = useCallback(async () => {
    if (!selectedDate) return;
    const version = ++summarySequence.current;
    setLoadingResumen(true);
    try {
      const response = await apiFetch(`/tiendas/cierre/resumen/${selectedDate}/t/${storeId}/`, { cache: "no-store" });
      if (!response.ok) throw new Error(await getApiError(response, "No se pudo verificar el cierre de esta fecha."));
      const data = await response.json().catch(() => null);
      const resumen = interpretarResumenCierre(data, selectedDate, storeId);
      if (!alive.current || version !== summarySequence.current) return;
      if (isWorker && resumen.validacion.hoy !== selectedDate) {
        setResumenDia(null); setSelectedDate(resumen.validacion.hoy); return;
      }
      setResumenDia(resumen);
      setResumenError("");
    } catch (error) {
      if (alive.current && version === summarySequence.current) {
        setResumenDia(null);
        setResumenError(mensajeErrorCierre(error));
      }
    } finally {
      if (alive.current && version === summarySequence.current) setLoadingResumen(false);
    }
  }, [selectedDate, storeId, isWorker]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchCajaAnterior(); fetchResumenDia(); }, 0);
    const refresh = () => {
      if (document.visibilityState === "visible" && !creatingRef.current) { fetchCajaAnterior(); fetchResumenDia(); }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      summarySequence.current += 1;
      previousSequence.current += 1;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fetchCajaAnterior, fetchResumenDia]);

  // Crear cierre
  const handleCrearCierre = async () => {
    if (!puedeRegistrar || creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const response = await apiFetch(`/tiendas/cierre/post/${selectedDate}/t/${storeId}/`, { method: "POST" });
      if (!response.ok) throw new Error(await getApiError(response, "No se pudo confirmar el cierre. Actualiza antes de reintentar."));
      if (!alive.current) return;
      toast.success("Cierre de caja registrado exitosamente");
    } catch (error) {
      if (alive.current) toast.error(error.message);
    } finally {
      if (alive.current) {
        await Promise.allSettled([fetchCierres(), fetchCajaAnterior(), fetchResumenDia()]);
        setCreating(false);
      }
      creatingRef.current = false;
    }
  };

  // Eliminar cierre
  const handleDeleteCierre = async () => {
    if (!cierreToDelete) return;
    setDeleting(true);
    try {
      const response = await apiFetch(
        `/tiendas/cierre/delete/${cierreToDelete.id}/`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error(await getApiError(response, "Error al eliminar el cierre"));
      toast.success("Cierre de caja eliminado");
      setCierreToDelete(null);
      fetchCierres();
      fetchResumenDia();
      fetchCajaAnterior();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Paginación
  const totalPages = Math.ceil(cierres.length / itemsPerPage);
  const paginatedCierres = cierres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr) => {
    return formatAppDate(dateStr, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }, selectedStore.tienda.zona_horaria);
  };

  const hoyStr = getAppDateString(0, new Date(), selectedStore.tienda.zona_horaria);
  const validacion = resumenDia?.fecha_consulta === selectedDate ? resumenDia.validacion : null;
  const puedeRegistrar = !loadingResumen && !resumenError && validacion?.puede_registrar === true;
  const motivoBloqueo = resumenError || (!selectedDate ? "Selecciona una fecha para verificar el cierre."
    : loadingResumen || !validacion ? "Verificando si se puede cerrar esta fecha…"
    : !validacion.puede_registrar ? validacion.mensaje : null);
  const avisoInfo = puedeRegistrar && validacion.codigo === "sin_movimientos_posteriores" ? validacion.mensaje : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="py-4 md:py-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <FiLock size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
              Cierre de Caja
            </h1>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Registro de cortes diarios &bull; Balance operativo
          </p>
        </div>

        <button
          onClick={() => {
            fetchCierres();
            fetchMovimientosCaja();
            fetchResumenDia();
            fetchCajaAnterior();
          }}
          aria-label="Actualizar cierre de caja"
          disabled={creating}
          className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
        >
          <FiRefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Crear Cierre Section */}
      <div className="glass rounded-[2.5rem] p-8 md:p-10 border-white/60 dark:border-slate-800 mb-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
            <FiShield size={20} />
          </div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
            Nuevo Cierre
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {/* Fecha */}
          <div className="space-y-2">
            <label htmlFor="fecha-cierre" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Fecha del Cierre
            </label>
            {isWorker ? (
              <div className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-800 dark:text-white">{selectedDate}</span>
                <FiCalendar className="text-slate-400" size={14} />
              </div>
            ) : (
              <input
                id="fecha-cierre"
                type="date"
                value={selectedDate}
                min={selectedStore.tienda.fecha_registro > hoyStr ? hoyStr : selectedStore.tienda.fecha_registro}
                max={validacion?.hoy || hoyStr}
                disabled={creating}
                onChange={(event) => {
                  if (event.target.value === selectedDate) return;
                  summarySequence.current += 1;
                  previousSequence.current += 1;
                  setResumenDia(null); setCajaAnterior(null); setResumenError("");
                  setSelectedDate(event.target.value);
                }}
                className="block w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            )}
          </div>

          {/* Caja Anterior */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Caja del Día Anterior
            </label>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl">
              <p className="text-[13px] font-black text-slate-800 dark:text-white">
                {cajaAnterior ? formatMoney(cajaAnterior.valor) : "Sin registro"}
              </p>
              {cajaAnterior && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {formatDate(cajaAnterior.fecha_cierre)}
                </p>
              )}
            </div>
          </div>

          {/* Botón Crear */}
          <div className="space-y-2">
            <button
              onClick={handleCrearCierre}
              disabled={creating || !puedeRegistrar}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              title={motivoBloqueo || ""}
            >
              {creating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <FiCheck size={20} />
                  Registrar Cierre
                </>
              )}
            </button>
            {motivoBloqueo && (
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest text-center px-2">
                {motivoBloqueo}
              </p>
            )}
            {!motivoBloqueo && avisoInfo && (
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight text-center px-2 leading-snug">
                ℹ {avisoInfo}
              </p>
            )}
          </div>
        </div>

        {/* Resumen del Día */}
        <div className="mt-10 border-t border-slate-100 dark:border-slate-800 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <FiBarChart2 size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Resumen — {formatDate(selectedDate)}
            </span>
            {loadingResumen && (
              <div className="w-3 h-3 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin ml-1" />
            )}
          </div>

          {!loadingResumen && resumenDia && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                {/* Aportes */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl px-4 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiTrendingUp size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Aportes</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{formatMoney(resumenDia.aportes)}</p>
                </div>

                {/* Recaudos */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiDollarSign size={12} className="text-indigo-500" />
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Recaudos</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{formatMoney(resumenDia.recaudos)}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{resumenDia.count_recaudos} cobro{resumenDia.count_recaudos !== 1 ? "s" : ""}</p>
                </div>

                {/* Créditos nuevos */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl px-4 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiCreditCard size={12} className="text-amber-500" />
                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Créditos</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{formatMoney(resumenDia.ventas)}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{resumenDia.count_ventas} crédito{resumenDia.count_ventas !== 1 ? "s" : ""}</p>
                </div>

                {/* Gastos */}
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl px-4 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiTrendingDown size={12} className="text-rose-500" />
                    <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Gastos</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{formatMoney(resumenDia.gastos)}</p>
                </div>

                {/* Utilidades */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl px-4 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiPackage size={12} className="text-purple-500" />
                    <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Utilidades</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{formatMoney(resumenDia.utilidades)}</p>
                </div>
              </div>

              {/* Saldo de cierre */}
              {resumenDia.estado_saldo === "sin_registro" ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl px-6 py-5 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                      <FiInfo size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-0.5">
                        Sin Cierre Registrado
                      </p>
                      <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70">
                        No se hizo cierre para esta fecha — saldo no disponible
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-amber-600/40 dark:text-amber-400/40 tracking-tighter">—</p>
                </div>
              ) : (
                <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl px-6 py-5 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {resumenDia.estado_saldo === "registrado" ? "Cierre Registrado" : validacion?.codigo === "sin_movimientos_posteriores" ? "Saldo verificado para esta fecha" : "Saldo Actual de Caja"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {resumenDia.estado_saldo === "registrado" ? "Valor consolidado al cierre del día" : "Se verificará nuevamente al guardar el cierre"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${resumenDia.estado_saldo === "registrado" ? "bg-emerald-400" : "bg-indigo-400 animate-pulse"}`} />
                    <p className="text-2xl font-black text-white tracking-tighter">{formatMoney(resumenDia.saldo_cierre)}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {!loadingResumen && !resumenDia && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {resumenError || "Verificando el saldo de esta fecha…"}
            </p>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <FiInfo size={14} className="shrink-0 mt-0.5" />
          <span>El cierre guarda el saldo de la ruta sin modificar la caja. Las fechas anteriores requieren que no existan cambios posteriores y que el historial permita verificar el saldo.</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                <FiActivity size={24} />
              </div>
            </div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter mb-1">
              {cierres.length}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Cierres Registrados
            </p>
          </div>
        </div>

        <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                <FiDollarSign size={24} />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter mb-1 select-all">
              {cierres.length > 0 ? formatMoney(cierres[0].valor) : "$0"}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Último Cierre
            </p>
          </div>
        </div>

        <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                <FiClock size={24} />
              </div>
            </div>
            <p className="text-lg font-black text-slate-800 dark:text-white tracking-tighter mb-1">
              {cierres.length > 0 ? formatDate(cierres[0].fecha_cierre) : "—"}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Fecha Último Cierre
            </p>
          </div>
        </div>
      </div>

      {/* Historial de movimientos */}
      <section className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-10">
        <div className="px-6 md:px-8 py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl shrink-0">
                <FiList size={19} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                    Movimientos de Caja
                  </h3>
                  <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Auditoría
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
                  Cada alta, corrección y reversa queda con saldo antes y después.
                  {historialDesde ? ` Disponible desde ${formatAppDate(historialDesde, { day: "numeric", month: "short", year: "numeric" })}.` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              <label className="sr-only" htmlFor="tipo-movimiento-caja">Filtrar tipo de movimiento</label>
              <select
                id="tipo-movimiento-caja"
                value={tipoMovimiento}
                onChange={(event) => setTipoMovimiento(event.target.value)}
                className="w-full sm:w-auto min-w-[180px] px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="">Todos los movimientos</option>
                <option value="VENTA">Créditos nuevos</option>
                <option value="RECAUDO">Abonos recibidos</option>
                <option value="GASTO">Gastos</option>
                <option value="UTILIDAD">Utilidades retiradas</option>
                <option value="APORTE">Aportes de capital</option>
              </select>
              <div className="px-4 py-3 bg-slate-900 dark:bg-slate-800 rounded-xl text-right sm:min-w-[155px]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Caja actual</p>
                <p className="text-sm font-black text-white tracking-tight">
                  {saldoActualHistorial === null ? "—" : formatMoney(saldoActualHistorial)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loadingMovimientos ? (
          <div className="p-12 flex justify-center"><LoadingSpinner /></div>
        ) : movimientosCaja.length === 0 ? (
          <div className="p-10 md:p-14 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiList size={26} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin movimientos auditados</p>
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Los movimientos nuevos aparecerán aquí automáticamente. El saldo actual de la ruta no se modifica al consultar este historial.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y hora</th>
                    <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Movimiento</th>
                    <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                    <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Variación</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo posterior</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosCaja.map((movimiento) => {
                    const delta = Number(movimiento.delta || 0);
                    const entraDinero = delta > 0;
                    return (
                      <tr key={movimiento.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200">{formatAppDateTime(movimiento.creado_en, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1">Saldo anterior: {formatMoney(movimiento.saldo_anterior)}</p>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${entraDinero ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600"}`}>
                              {entraDinero ? <FiArrowDownRight size={15} /> : <FiArrowUpRight size={15} />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-white">{movimiento.tipo_label}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{movimiento.accion_label}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{movimiento.usuario_nombre || "Sistema"}</td>
                        <td className={`px-5 py-5 text-right text-sm font-black whitespace-nowrap ${entraDinero ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {entraDinero ? "+" : "-"}{formatMoney(Math.abs(delta))}
                        </td>
                        <td className="px-8 py-5 text-right text-sm font-black text-slate-800 dark:text-white whitespace-nowrap">{formatMoney(movimiento.saldo_posterior)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
              {movimientosCaja.map((movimiento) => {
                const delta = Number(movimiento.delta || 0);
                const entraDinero = delta > 0;
                return (
                  <div key={movimiento.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${entraDinero ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600"}`}>
                          {entraDinero ? <FiArrowDownRight size={16} /> : <FiArrowUpRight size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">{movimiento.tipo_label}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{movimiento.accion_label} · {movimiento.usuario_nombre || "Sistema"}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-2">{formatAppDateTime(movimiento.creado_en, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-black whitespace-nowrap ${entraDinero ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {entraDinero ? "+" : "-"}{formatMoney(Math.abs(delta))}
                      </p>
                    </div>
                    <div className="mt-4 ml-[2.75rem] flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400">
                      <span>Saldo anterior {formatMoney(movimiento.saldo_anterior)}</span>
                      <span className="font-black text-slate-700 dark:text-slate-200">Saldo {formatMoney(movimiento.saldo_posterior)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 md:px-8 py-4 bg-slate-50/70 dark:bg-slate-900/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando los últimos {movimientosCaja.length} movimientos de un máximo de 100.
            </div>
          </>
        )}
      </section>

      {/* Table */}
      <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800">
        {/* Table Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
            Historial de Cierres
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {cierres.length} registros
          </span>
        </div>

        {cierres.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <FiLock size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
              No hay cierres registrados
            </p>
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 mt-2 uppercase tracking-widest">
              Registre su primer cierre de caja para comenzar
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Fecha
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Valor de Caja
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCierres.map((cierre) => (
                    <tr
                      key={cierre.id}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl flex items-center justify-center">
                            <FiCalendar size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white">
                              {formatDate(cierre.fecha_cierre)}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              ID: {cierre.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {formatMoney(cierre.valor)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {!isWorker && (
                          <button
                            onClick={() => setCierreToDelete(cierre)}
                            className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                            title="Eliminar cierre"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedCierres.map((cierre) => (
                <div key={cierre.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                      <FiCalendar size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white">
                        {formatDate(cierre.fecha_cierre)}
                      </p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatMoney(cierre.valor)}
                      </p>
                    </div>
                  </div>
                  {!isWorker && (
                    <button
                      onClick={() => setCierreToDelete(cierre)}
                      className="p-3 text-slate-300 hover:text-rose-600 rounded-xl transition-all"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={cierres.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!cierreToDelete}
        onClose={() => setCierreToDelete(null)}
        onConfirm={handleDeleteCierre}
        title="¿Eliminar Cierre?"
        message={cierreToDelete ? `Se eliminará el cierre de caja del ${formatDate(cierreToDelete.fecha_cierre)} por ${formatMoney(cierreToDelete.valor)}. Esta acción no se puede deshacer.` : ""}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        isLoading={deleting}
      />
    </div>
  );
}

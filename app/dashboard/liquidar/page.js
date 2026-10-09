// app/dashboard/liquidar/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch, getApiError } from "@/app/utils/api";
import {
   FiRefreshCw,
   FiCheck,
   FiX,
   FiClock,
   FiSearch,
   FiActivity,
   FiTarget,
   FiArrowRight,
   FiInfo,
   FiFilter,
   FiPhone,
   FiMapPin,
   FiMessageCircle,
   FiDollarSign,
   FiWifiOff,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";
import { formatMoney, parseMoney } from "../../utils/format";
import {
   getCuotasAtrasadas,
   getDiasSinAbono,
   getMontoParaPonerseAlDia,
   getRiesgoCartera,
   formatDiasSinAbono as formatDiasSinAbonoBase,
} from "../../utils/cartera";
import Pagination from "../../components/Pagination";
import { getAppDateString } from "../../utils/datetime";
import { permiteFalla, resumirLiquidacion } from "../../utils/calendario";
import CalendarioCobro from "./CalendarioCobro";
import FechaLiquidacion from "./FechaLiquidacion";
import { buildWhatsAppEstadoCuenta } from "../../utils/whatsapp";

function formatDiasSinAbono(credito) {
   return formatDiasSinAbonoBase(credito);
}

function formatSeguimientoAbono(credito) {
   return formatDiasSinAbono(credito);
}

function formatCuotasAtrasadas(value) {
   if (!value) return "0";
   return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function LiquidarCreditosPage() {
   const { selectedStore, user, isAuthenticated, loading: authLoading } = useAuth();
   const isWorker = !(user?.is_staff || user?.is_superuser);
   const [gpsPermission, setGpsPermission] = useState(null); // null | "granted" | "denied" | "prompt"
   const [gpsBannerDismissed, setGpsBannerDismissed] = useState(false);
   const [creditos, setCreditos] = useState([]);
   const [recaudos, setRecaudos] = useState([]);
   const [caja, setCaja] = useState(null);
   const [loading, setLoading] = useState(true);
   const [fetchError, setFetchError] = useState(null);
   const solicitudRef = useRef(0);
   const claveCargadaRef = useRef(null);
   const tiendaId = selectedStore?.tienda?.id;
   const [selectedDate, setSelectedDate] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage] = useState(10);
   const [searchTerm, setSearchTerm] = useState("");
   const router = useRouter();
   const hoy = getAppDateString(0, new Date(), selectedStore?.tienda?.zona_horaria);
   const vistaPrevia = selectedDate > hoy;
   const puedeRegistrar = !vistaPrevia && !loading && !fetchError && claveCargadaRef.current === `${tiendaId}:${selectedDate}`;

   // Establecer fecha actual por defecto (workers siempre ven solo hoy)
   useEffect(() => {
      if (!tiendaId) return;
      const formattedDate = getAppDateString(
         0,
         new Date(),
         selectedStore?.tienda?.zona_horaria
      );

      if (isWorker) {
         setSelectedDate(formattedDate);
      } else {
         const storedDate = localStorage.getItem("liquidarFecha");
         const valida = /^\d{4}-\d{2}-\d{2}$/.test(storedDate || '') &&
            !Number.isNaN(Date.parse(storedDate)) && new Date(storedDate).toISOString().slice(0, 10) === storedDate;
         setSelectedDate(valida ? storedDate : formattedDate);
      }
   }, [isWorker, tiendaId, selectedStore?.tienda?.zona_horaria]);

   // Verificar/solicitar permiso GPS (solo workers)
   useEffect(() => {
      if (!isWorker || typeof navigator === "undefined" || !navigator.geolocation) {
         if (isWorker) setGpsPermission("denied");
         return;
      }

      const checkPermission = () => {
         if (navigator.permissions) {
            navigator.permissions.query({ name: "geolocation" }).then((result) => {
               if (result.state === "granted") {
                  setGpsPermission("granted");
               } else if (result.state === "denied") {
                  setGpsPermission("denied");
               } else {
                  // "prompt" — disparar el diálogo nativo
                  navigator.geolocation.getCurrentPosition(
                     () => setGpsPermission("granted"),
                     (error) => setGpsPermission(error.code === error.PERMISSION_DENIED ? "denied" : "granted"),
                     { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
                  );
               }
            });
         } else {
            navigator.geolocation.getCurrentPosition(
               () => setGpsPermission("granted"),
               (error) => setGpsPermission(error.code === error.PERMISSION_DENIED ? "denied" : "granted"),
               { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
         }
      };

      checkPermission();

      // Re-verificar cuando el usuario vuelve a la pestaña (ej. después de cambiar ajustes)
      const handleVisibility = () => {
         if (document.visibilityState === "visible") checkPermission();
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => document.removeEventListener("visibilitychange", handleVisibility);
   }, [isWorker]);

   // Un fallo nunca se presenta como una ruta vacía ni permite registrar
   // operaciones con datos incompletos. La fecha sigue accesible para recuperar.
   const fetchData = useCallback(async () => {
      if (!tiendaId || !selectedDate) return;
      const solicitud = ++solicitudRef.current;
      const clave = `${tiendaId}:${selectedDate}`;
      if (claveCargadaRef.current !== clave) {
         setCreditos([]);
         setRecaudos([]);
         setCaja(null);
      }

      setLoading(true);
      setFetchError(null);
      try {
         const fetchJson = async (path) => {
            const res = await apiFetch(path);
            if (!res.ok) {
               const error = new Error(await getApiError(res, "El servidor no pudo cargar esta consulta. Intenta de nuevo."));
               error.status = res.status;
               throw error;
            }
            try {
               return await res.json();
            } catch {
               const error = new Error("El servidor devolvió una respuesta inválida. Intenta de nuevo.");
               error.status = 502;
               throw error;
            }
         };

         const [creditosData, recaudosData, tiendaData] = await Promise.all([
            fetchJson(`/ventas/activas/liquidar/${selectedDate}/t/${tiendaId}/${vistaPrevia ? '?vista=previa' : ''}`),
            vistaPrevia ? Promise.resolve([]) : fetchJson(`/recaudos/list/${selectedDate}/t/${tiendaId}/?vista=lista`),
            vistaPrevia ? Promise.resolve(null) : fetchJson(`/tiendas/detail/admin/${tiendaId}/`),
         ]);

         if (solicitud !== solicitudRef.current) return;
         if (vistaPrevia && (creditosData?.vista_previa !== true || creditosData.fecha_consulta !== selectedDate || !Array.isArray(creditosData.creditos))) {
            const error = new Error("El servidor no devolvió una vista previa válida. Cambia la fecha a hoy o intenta de nuevo.");
            error.status = 502;
            throw error;
         }
         claveCargadaRef.current = clave;

         setCreditos(vistaPrevia ? creditosData.creditos : Array.isArray(creditosData) ? creditosData : []);
         setRecaudos(Array.isArray(recaudosData) ? recaudosData : []);
         if (tiendaData?.tienda?.caja !== undefined) setCaja(tiendaData.tienda.caja);
         setFetchError(null);
      } catch (error) {
         if (solicitud !== solicitudRef.current) return;
         console.error("Error:", error);
         setFetchError({ status: error.status, message: error.message || "No se pudieron cargar los créditos. Intenta de nuevo." });
      } finally {
         if (solicitud === solicitudRef.current) setLoading(false);
      }
   }, [tiendaId, selectedDate, vistaPrevia]);

   useEffect(() => {
      fetchData();
      return () => { solicitudRef.current += 1; };
   }, [fetchData]);

   useEffect(() => {
      if (selectedDate) {
         localStorage.setItem("liquidarFecha", selectedDate);
      }
   }, [selectedDate]);

   const creditosVigentes = claveCargadaRef.current === `${tiendaId}:${selectedDate}` ? creditos : [];
   const filtroCliente = searchTerm.trim().toLowerCase();
   const filteredCreditos = creditosVigentes.filter(c => {
         const fullName = `${c.cliente?.nombres ?? ''} ${c.cliente?.apellidos ?? ''}`.toLowerCase();
         return fullName.includes(filtroCliente);
   });
   useEffect(() => {
      setCurrentPage(1);
   }, [searchTerm, tiendaId, selectedDate]);

   // Paginación
   const indexOfLastItem = currentPage * itemsPerPage;
   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
   const totalPages = Math.ceil(filteredCreditos.length / itemsPerPage);
   const currentItems = filteredCreditos.slice(indexOfFirstItem, indexOfLastItem);

   const getStatusBadge = (estado) => {
      switch (estado) {
         case "Vigente":
            return <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-200 dark:border-emerald-800">Vigente</span>;
         case "Atrasado":
            return <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-200 dark:border-amber-800 border-dashed">Atrasado</span>;
         case "Vencido":
            return <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-200 dark:border-rose-800">Vencido</span>;
         default:
            return <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg">{estado}</span>;
      }
   };

   const calcVisitasRestantes = (c) => {
      const cuotas = parseFloat(c.cuotas);
      const pagos = parseFloat(c.pagos_realizados);
      const atraso = getCuotasAtrasadas(c);
      if (isNaN(cuotas) || isNaN(pagos)) return null;
      return Math.round(cuotas - pagos - atraso);
   };

   const getMoraBorderColor = (riesgo) => {
      if (riesgo.prioridad.rank >= 3) return "border-l-rose-500";
      if (riesgo.prioridad.rank >= 2) return "border-l-orange-500";
      if (riesgo.prioridad.rank >= 1) return "border-l-amber-500";
      return "border-l-emerald-500";
   };

   const formatPhone = (phone) => {
      if (!phone) return null;
      return phone.replace(/\s+/g, "").replace(/^0/, "");
   };

   const buildWhatsAppUrl = (credito) => {
      return buildWhatsAppEstadoCuenta(credito, { fechaConsulta: selectedDate, fechaOperativa: hoy });
   };

   const handleAbonar = (credito) => {
      if (!puedeRegistrar) return;
      const valorAbono = Math.min(parseMoney(credito.saldo_actual), parseMoney(credito.valor_cuota));
      const abono = {
         fecha_recaudo: selectedDate,
         valor_recaudo: valorAbono,
         saldo_actual: credito.saldo_actual,
         valor_cuota: credito.valor_cuota,
         cuotas: credito.cuotas,
         pagos_realizados: credito.pagos_realizados,
         total_abonado: credito.total_abonado,
         calendario_pago: credito.calendario_pago,
         dias_atrasados: getCuotasAtrasadas(credito),
         venta: credito.id,
         tienda: selectedStore.tienda.id,
      };
      localStorage.setItem("abono", JSON.stringify(abono));
      localStorage.setItem("cliente", JSON.stringify(credito.cliente));
      router.push(`/dashboard/liquidar/abonar`);
   };

   const handleReportarFalla = (credito) => {
      if (!puedeRegistrar) return;
      if (!permiteFalla(credito)) {
         toast.info("No hay una cuota exigible pendiente: este cobro es voluntario.");
         return;
      }
      const noPago = {
         fecha_recaudo: selectedDate,
         valor_recaudo: 0,
         venta: credito.id,
         tienda: selectedStore.tienda.id,
         visita_blanco: { comentario: "", tipo_falla: "Casa o Local Cerrado" },
      };
      localStorage.setItem("noPago", JSON.stringify(noPago));
      localStorage.setItem("cliente", JSON.stringify(credito.cliente));
      router.push(`/dashboard/liquidar/reportar`);
   };

   if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

   // Totales
   const resumen = resumirLiquidacion(creditosVigentes);
   // Solo esta tarjeta responde al filtro; incluye todas las coincidencias,
   // no únicamente la página visible. Los otros indicadores son de la ruta.
   const totalPendientes = resumirLiquidacion(filteredCreditos).importePendiente;
   // Base descriptiva del día; no una meta obligatoria para los anticipos.
   const totalRealizados = recaudos.filter(r => !r.es_renovacion).reduce((acc, r) => acc + parseMoney(r.valor_recaudo), 0);
   const totalRecaudar = resumen.importePendiente + totalRealizados;
   const porcentajeAvance = totalRecaudar > 0 ? Math.round((totalRealizados / totalRecaudar) * 100) : 0;

   return (
      <div className="min-h-screen bg-transparent pb-12">
         <div className="w-full">

            {/* Header Section */}
            <div className="flex items-center justify-between mb-6 gap-4">
               <div className="flex items-center gap-3 md:gap-5 min-w-0">
                  <div className="bg-emerald-600 p-3 md:p-4 rounded-[1.25rem] md:rounded-[1.5rem] shadow-xl shadow-emerald-200 dark:shadow-none shrink-0">
                     <FiActivity className="text-white text-xl md:text-3xl" />
                  </div>
                  <div className="min-w-0">
                     <h1 className="text-xl md:text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase truncate">Liquidación Diaria</h1>
                     <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 px-0.5 truncate">
                        <span className="text-emerald-500">{selectedStore.tienda.nombre}</span>
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-2 shrink-0">
                  {!isWorker && (
                     <button
                        onClick={() => {
                           const formattedDate = getAppDateString(
                              0,
                              new Date(),
                              selectedStore?.tienda?.zona_horaria
                           );
                           setSelectedDate(formattedDate);
                        }}
                        className="px-4 py-3 md:px-6 md:py-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-all shadow-sm"
                     >
                        Hoy
                     </button>
                  )}
                  <button
                     onClick={fetchData}
                     disabled={loading}
                     aria-label="Actualizar datos"
                     className="p-3 md:p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group disabled:opacity-50"
                  >
                     <FiRefreshCw size={18} className={`transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
                  </button>
               </div>
            </div>

            {/* Banner GPS — solo workers cuando el permiso no está concedido */}
            {isWorker && !gpsBannerDismissed && gpsPermission === "denied" && (
               <div className="flex items-start gap-4 px-5 py-4 mb-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-[1.5rem]">
                  <FiMapPin className="text-rose-500 shrink-0 mt-0.5" size={16} />
                  <div className="flex-1 min-w-0">
                     <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mb-1">Ubicación bloqueada</p>
                     <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight leading-relaxed">
                        Para activarla: abre la configuración de tu navegador → Permisos del sitio → Ubicación → permite esta página. Los cobros funcionan sin GPS pero quedarán sin ubicación registrada.
                     </p>
                  </div>
                  <button onClick={() => setGpsBannerDismissed(true)} className="text-rose-300 hover:text-rose-500 transition-colors shrink-0 text-lg leading-none">&times;</button>
               </div>
            )}

            {/* Caja Disponible — solo workers */}
            {isWorker && caja !== null && (
               <div className={`flex items-center justify-between px-6 py-5 rounded-[1.5rem] md:rounded-[2rem] mb-6 border ${caja >= 0 ? 'bg-emerald-600 border-emerald-500 shadow-xl shadow-emerald-200 dark:shadow-none' : 'bg-rose-600 border-rose-500 shadow-xl shadow-rose-200 dark:shadow-none'}`}>
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-white/20 rounded-xl">
                        <FiDollarSign className="text-white" size={22} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.25em]">Caja Disponible</p>
                        <p className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">{formatMoney(caja)}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                        {caja >= 0 ? 'Para nuevos créditos' : 'Saldo negativo'}
                     </p>
                  </div>
               </div>
            )}

            {vistaPrevia && (
               <section aria-label="Vista previa de cobranza" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <p className="font-black">Vista previa · {selectedDate} · Solo lectura</p>
                  <p className="mt-2 leading-relaxed">Proyección de los créditos que correspondería cobrar, incluidos saldos atrasados. Supone que no hay nuevos pagos desde hoy; los anticipos ya registrados se tienen en cuenta.</p>
                  <p className="mt-2 font-semibold">Los estados mostrados son proyectados. No se registran abonos ni fallas, no se modifica la caja ni la calificación del cliente.</p>
               </section>
            )}

            {/* Distinguir rechazo HTTP de fallos de conexión; permitir cambiar fecha. */}
            {fetchError && !loading ? (
               <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl p-10 md:p-16 text-center">
                  <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                     {fetchError.status ? <FiInfo size={36} className="text-rose-500" /> : <FiWifiOff size={36} className="text-rose-500" />}
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
                     {fetchError.status ? "No se pudo cargar la consulta" : "Problema de conexión"}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
                     {fetchError.message} Tus cobros registrados no se pierden.
                  </p>
                  <div className="max-w-sm mx-auto mb-6 text-left">
                     <FechaLiquidacion isWorker={isWorker} selectedDate={selectedDate} onChange={setSelectedDate} />
                  </div>
                  <button
                     onClick={fetchData}
                     className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
                  >
                     <FiRefreshCw size={14} /> Reintentar
                  </button>
               </div>
            ) : (
            <>
            {/* Global Metrics Area */}
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
               <p className="font-bold text-slate-900 dark:text-white">{vistaPrevia ? `${resumen.obligatorios} gestiones proyectadas · ${resumen.voluntarios} cobros voluntarios` : `${resumen.obligatorios} gestiones obligatorias pendientes · ${resumen.voluntarios} cobros voluntarios`}</p>
               <p className="mt-1 leading-relaxed">{vistaPrevia ? "Importe proyectado hasta la fecha seleccionada, no una meta garantizada de recaudo. Los cobros voluntarios no son obligaciones." : "Los anticipos siguen visibles, pero no exigen otro abono ni una falla para completar la ruta. El importe pendiente incluye deuda exigible; registrar una visita no elimina esa deuda."}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
               <div role="region" aria-label={vistaPrevia ? "Total proyectado" : "Total a cobrar del día"} className="glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-xl">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                           <FiTarget size={16} className="md:w-6 md:h-6" />
                        </div>
                        <span className="hidden md:block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Importe</span>
                     </div>
                     <p className="text-base md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-0.5 md:mb-1">
                        {formatMoney(totalRecaudar)}
                     </p>
                     <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">{vistaPrevia ? "Total proyectado" : "Total a cobrar del día"}</p>
                     <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">{vistaPrevia ? "Toda la ruta" : "Toda la ruta · cobrado + pendiente"}</p>
                  </div>
               </div>

               <div role="region" aria-label={vistaPrevia ? "Pendiente proyectado" : "Pendiente por cobrar"} className="glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-xl">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                           <FiClock size={16} className="md:w-6 md:h-6" />
                        </div>
                        <span className="hidden md:block text-[10px] font-black text-rose-400 uppercase tracking-widest">Pendiente</span>
                     </div>
                     <p className="text-base md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-0.5 md:mb-1">
                        {formatMoney(totalPendientes)}
                     </p>
                     <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">{vistaPrevia ? "Pendiente proyectado" : "Pendiente por cobrar"}</p>
                     <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">{filtroCliente ? "Solo clientes del filtro" : "Toda la ruta"}</p>
                  </div>
               </div>

               <div role="region" aria-label={vistaPrevia ? "Recaudo de vista previa" : "Total cobrado del día"} className="bg-emerald-600 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-emerald-500 relative overflow-hidden group shadow-xl shadow-emerald-200 dark:shadow-none">
                  <div className="relative z-10 text-white">
                     <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                           <FiCheck size={16} className="md:w-6 md:h-6" />
                        </div>
                        <span title="Porcentaje del importe cobrado, no de visitas completadas" className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{vistaPrevia ? "Solo lectura" : `${porcentajeAvance}%`}</span>
                     </div>
                     <p className="text-base md:text-3xl font-black tracking-tighter mb-0.5 md:mb-1">
                        {vistaPrevia ? "Sin recaudo real" : formatMoney(totalRealizados)}
                     </p>
                     <p className="text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-widest leading-relaxed">{vistaPrevia ? "Solo lectura" : "Total cobrado del día"}</p>
                     {!vistaPrevia && <p className="mt-2 text-[10px] text-white/80">Toda la ruta</p>}
                     <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(porcentajeAvance, 100))}%` }} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Filters & Search Container */}
            <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-10">
               <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col lg:flex-row items-center gap-6 md:gap-8">
                  <div className="w-full lg:w-1/3 space-y-2">
                     <FechaLiquidacion isWorker={isWorker} selectedDate={selectedDate} onChange={setSelectedDate} />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                     <label htmlFor="buscar-cliente" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Buscar Cliente</label>
                     <div className="relative group">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-all pointer-events-none z-10" size={20} />
                        <input
                           id="buscar-cliente"
                           type="text"
                           placeholder="Nombre del cliente..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full pl-16 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner outline-none placeholder:text-slate-300"
                        />
                     </div>
                  </div>

                  <div className="w-full lg:w-auto pt-4 lg:pt-0">
                     <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <FiFilter className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                           {filteredCreditos.length} Resultados
                        </span>
                     </div>
                  </div>
               </div>

               {/* Desktop Table */}
               <div className="hidden md:block overflow-x-auto min-h-[400px]">
                  {loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <LoadingSpinner />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando datos</p>
                     </div>
                  ) : filteredCreditos.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                           <FiSearch size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Sin Registros</h3>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter">No hay créditos pendientes para el periodo {selectedDate}</p>
                     </div>
                  ) : (
                     <table className="w-full table-fixed border-collapse">
                        <colgroup>
                           <col style={{ width: "24%" }} />
                           <col style={{ width: "8%" }} />
                           <col style={{ width: "10%" }} />
                           <col style={{ width: "11%" }} />
                           <col style={{ width: "21%" }} />
                           <col style={{ width: "14%" }} />
                           <col style={{ width: "12%" }} />
                        </colgroup>
                        <thead>
                           <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                              <th className="px-5 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Cliente</th>
                              <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Contacto</th>
                              <th className="px-4 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Cuota</th>
                              <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Progreso</th>
                              <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Seguimiento</th>
                              <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Estado</th>
                              <th className="px-5 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Acción</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {currentItems.map((credito) => {
                              const mora = Math.round(credito.dias_atrasados || 0);
                              const riesgo = getRiesgoCartera(credito);
                              const diasSinAbono = getDiasSinAbono(credito);
                              const cuotasAtrasadas = getCuotasAtrasadas(credito);
                              const montoParaPonerseAlDia = getMontoParaPonerseAlDia(credito);
                              const phone = formatPhone(credito.cliente.telefono_principal);
                              const vr = calcVisitasRestantes(credito);
                              const proxVencer = (credito.estado_venta === "Vigente" || credito.estado_venta === "Atrasado") && vr !== null && vr >= 0 && vr <= 3;
                              return (
                                 <tr key={credito.id} className={`group transition-all border-l-4 ${getMoraBorderColor(riesgo)} ${proxVencer ? "bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/60 dark:hover:bg-amber-950/60" : "hover:bg-slate-50/50 dark:hover:bg-indigo-500/5"}`}>
                                    <td className="px-4 py-5">
                                       <div className="min-w-0">
                                          <Link
                                             href={`/dashboard/ventas/${credito.id}`}
                                             className="group/name block min-w-0"
                                          >
                                             <p className="truncate text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none group-hover/name:text-indigo-600 transition-colors">
                                                {credito.cliente.nombres} {credito.cliente.apellidos}
                                             </p>
                                             <p className="truncate text-[9px] font-bold text-slate-400 mt-1">
                                                Saldo: <span className="text-rose-500">{formatMoney(credito.saldo_actual)}</span>
                                                <span className="mx-1.5 text-slate-300">·</span>
                                                Abonado: <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(credito.total_abonado)}</span>
                                                <span className="mx-1.5 text-slate-300">·</span>
                                                {credito.plazo || "Diario"}
                                             </p>
                                          </Link>
                                          <CalendarioCobro credito={credito} vistaPrevia={vistaPrevia} />
                                       </div>
                                    </td>
                                    <td className="px-2 py-5">
                                       <div className="flex items-center justify-center gap-1.5">
                                          {phone && (
                                             <>
                                                <a
                                                   href={`tel:${phone}`}
                                                   className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                                                   title="Llamar"
                                                   onClick={(e) => e.stopPropagation()}
                                                >
                                                   <FiPhone size={13} />
                                                </a>
                                                <a
                                                   href={buildWhatsAppUrl(credito)}
                                                   aria-label="WhatsApp: estado de cuenta"
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                                                   title="WhatsApp"
                                                   onClick={(e) => e.stopPropagation()}
                                                >
                                                   <FiMessageCircle size={13} />
                                                </a>
                                             </>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-2 py-5 text-right">
                                       <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                                          {formatMoney(credito.valor_cuota)}
                                       </p>
                                    </td>
                                    <td className="px-2 py-5 text-center">
                                       <div className="flex flex-col items-center">
                                          <span className="text-xs font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                                             {Number(credito.pagos_realizados).toLocaleString('es-CL', { maximumFractionDigits: 2 })}/{credito.cuotas}
                                          </span>
                                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                             <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, Math.max(0, (Number(credito.pagos_realizados) / credito.cuotas) * 100))}%` }}
                                             />
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-3 py-5">
                                       <div className="space-y-1">
                                          <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${diasSinAbono > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                             {formatSeguimientoAbono(credito)}
                                          </p>
                                          {montoParaPonerseAlDia > 0 ? (
                                             <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 leading-tight">
                                                {formatMoney(montoParaPonerseAlDia)} <span className="font-bold text-slate-400">· {formatCuotasAtrasadas(cuotasAtrasadas)} cuotas</span>
                                             </p>
                                          ) : (
                                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Sin atraso acumulado</p>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-3 py-5">
                                       <div className="flex flex-col items-start gap-1">
                                          {getStatusBadge(credito.estado_venta)}
                                          {proxVencer && (
                                             <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
                                                ⚠ {vr === 0 ? "Última cuota" : `${vr} ${vr === 1 ? "cuota" : "cuotas"} p/ vencer`}
                                             </span>
                                          )}
                                          {mora > 0 && (
                                             <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                                {mora}d mora
                                             </span>
                                          )}
                                          {mora < 0 && (
                                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                {Math.abs(mora)}d adelantado
                                             </span>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-2 py-5 text-right">
                                       <div className="flex items-center justify-end gap-1.5">
                                          <button
                                             onClick={() => handleReportarFalla(credito)}
                                             disabled={!puedeRegistrar || !permiteFalla(credito)}
                                             aria-label={vistaPrevia ? "Vista previa: falla no permitida" : permiteFalla(credito) ? "Reportar falla" : "Sin cuota exigible: falla no permitida"}
                                             className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 rounded-lg hover:text-rose-600 hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700"
                                             title="Reportar Falla"
                                          >
                                             <FiX size={15} />
                                          </button>
                                          <button
                                             onClick={() => handleAbonar(credito)}
                                             disabled={!puedeRegistrar}
                                             className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                          >
                                             Abonar <FiArrowRight size={12} />
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  )}
               </div>

               {/* Mobile View - Cards Layout */}
               <div className="md:hidden space-y-3 px-4 py-6">
                  {loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <LoadingSpinner />
                     </div>
                  ) : filteredCreditos.length === 0 ? (
                     <div className="glass p-6 md:p-10 text-center rounded-[1.5rem] md:rounded-[2rem]">
                        <FiSearch size={30} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin Pendientes</p>
                     </div>
                  ) : (
                     currentItems.map((credito) => {
                        const mora = Math.round(credito.dias_atrasados || 0);
                        const riesgo = getRiesgoCartera(credito);
                        const diasSinAbono = getDiasSinAbono(credito);
                        const cuotasAtrasadas = getCuotasAtrasadas(credito);
                        const montoParaPonerseAlDia = getMontoParaPonerseAlDia(credito);
                        const phone = formatPhone(credito.cliente.telefono_principal);
                        const vr = calcVisitasRestantes(credito);
                        const proxVencer = (credito.estado_venta === "Vigente" || credito.estado_venta === "Atrasado") && vr !== null && vr >= 0 && vr <= 3;
                        return (
                           <div key={credito.id} className={`glass p-5 rounded-[2rem] border-l-4 ${getMoraBorderColor(riesgo)} border-white/60 dark:border-slate-800 shadow-lg space-y-4 ${proxVencer ? "bg-amber-50/60 dark:bg-amber-950/30" : ""}`}>
                              {/* Client name → clickable to detail */}
                              <div className="flex items-start justify-between gap-3">
                                 <Link
                                    href={`/dashboard/ventas/${credito.id}`}
                                    className="flex-1 min-w-0"
                                 >
                                    <p className="text-[15px] font-black text-slate-800 dark:text-white uppercase leading-tight mb-1.5 active:text-indigo-600 transition-colors">
                                       {credito.cliente.nombres} {credito.cliente.apellidos}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                       {getStatusBadge(credito.estado_venta)}
                                       <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-800">
                                          {credito.plazo || "Diario"}
                                       </span>
                                       {proxVencer && (
                                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-300 dark:border-amber-700 animate-pulse">
                                             ⚠ {vr === 0 ? "Última cuota" : `${vr}c p/ vencer`}
                                          </span>
                                       )}
                                       {mora > 0 && (
                                          <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-100 dark:border-rose-800">{mora} cuotas atrasadas</span>
                                       )}
                                       {mora < 0 && (
                                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 dark:border-emerald-800">{Math.abs(mora)} cuotas adelantadas</span>
                                       )}
                                    </div>
                                 </Link>
                                 <div className="text-right shrink-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cuota</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">
                                       {formatMoney(credito.valor_cuota)}
                                    </p>
                                 </div>
                              </div>

                              <CalendarioCobro credito={credito} vistaPrevia={vistaPrevia} />
                              {/* Contact row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                 {phone ? (
                                    <>
                                       <a
                                          href={`tel:${phone}`}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black active:scale-95 transition-all"
                                       >
                                          <FiPhone size={12} /> {credito.cliente.telefono_principal}
                                       </a>
                                       <a
                                          href={buildWhatsAppUrl(credito)}
                                          aria-label="WhatsApp: estado de cuenta"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[10px] font-black active:scale-95 transition-all"
                                       >
                                          <FiMessageCircle size={12} /> WhatsApp
                                       </a>
                                    </>
                                 ) : (
                                    <span className="text-[10px] font-bold text-slate-300">Sin teléfono</span>
                                 )}
                                 {credito.cliente.direccion && (
                                    <a
                                       href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(credito.cliente.direccion)}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="flex items-center gap-1 text-[10px] font-bold text-slate-400 active:text-indigo-500 transition-colors"
                                    >
                                       <FiMapPin size={10} className="shrink-0 text-rose-400" />
                                       <span className="truncate underline decoration-dotted underline-offset-2">{credito.cliente.direccion}</span>
                                    </a>
                                 )}
                              </div>

                              {/* Financial info */}
                              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                                 <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
                                    <p className="text-sm font-black text-rose-500 tracking-tight">{formatMoney(credito.saldo_actual)}</p>
                                 </div>
                                 <div className="text-center space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Abonado</p>
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatMoney(credito.total_abonado)}</p>
                                 </div>
                                 <div className="text-right space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progreso</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{Number(credito.pagos_realizados).toLocaleString('es-CL', { maximumFractionDigits: 2 })}/{credito.cuotas}</p>
                                 </div>
                              </div>

                              {/* Seguimiento de cobranza */}
                              <div className="flex items-start justify-between gap-3 px-4 py-3 bg-amber-50/60 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                 <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Último abono</p>
                                    <p className={`text-sm font-black tracking-tight ${diasSinAbono > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                       {formatDiasSinAbono(credito)}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Para ponerse al día</p>
                                    <p className={`text-sm font-black tracking-tight ${montoParaPonerseAlDia > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                       {montoParaPonerseAlDia > 0 ? formatMoney(montoParaPonerseAlDia) : "Al día"}
                                    </p>
                                    {cuotasAtrasadas > 0 && <p className="text-[9px] font-bold text-slate-400">{formatCuotasAtrasadas(cuotasAtrasadas)} cuotas</p>}
                                 </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-3">
                                 <button
                                    onClick={() => handleReportarFalla(credito)}
                                    disabled={!puedeRegistrar || !permiteFalla(credito)}
                                    aria-label={vistaPrevia ? "Vista previa: falla no permitida" : permiteFalla(credito) ? "Reportar falla" : "Sin cuota exigible: falla no permitida"}
                                    className="p-4 bg-white dark:bg-slate-900 text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 active:scale-90 transition-all shadow-sm"
                                    title="Reportar Falla"
                                 >
                                    <FiX size={18} />
                                 </button>
                                 <button
                                    onClick={() => handleAbonar(credito)}
                                    disabled={!puedeRegistrar}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                 >
                                    {credito.calendario_pago?.cobro_voluntario ? "Abono voluntario" : "Abonar cuota"} <FiArrowRight />
                                 </button>
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>

               <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredCreditos.length}
                  itemsPerPage={itemsPerPage}
               />
            </div>
            </>
            )}

            {/* Informative Footer */}
            <div className="flex items-center gap-4 px-5 py-4 bg-white/40 dark:bg-slate-900/40 rounded-[1.5rem] border border-white/60 dark:border-slate-800/50 opacity-60">
               <FiInfo className="text-amber-500 shrink-0" size={16} />
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Los recaudos se sincronizan en tiempo real. Valide el efectivo físico al cierre de ruta.
               </p>
               <FiActivity className="text-emerald-500/50 animate-pulse shrink-0" size={16} />
            </div>

         </div>
      </div>
   );
}

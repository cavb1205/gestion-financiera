// app/dashboard/ventas/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiShoppingBag,
  FiFilter,
  FiSearch,
  FiPlus,
  FiTrendingDown,
  FiClock,
  FiDollarSign,
  FiInfo,
  FiActivity,
  FiPieChart,
  FiArrowUpRight,
  FiPhone,
  FiMessageCircle,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../utils/format";
import {
  clasificarDeterioro,
  getCuotasAtrasadas,
  getDiasSinAbono,
  getMontoParaPonerseAlDia,
  getPrioridadCobranza,
  formatDiasSinAbono as formatDiasSinAbonoBase,
} from "../../utils/cartera";
import Link from "next/link";
import Pagination from "../../components/Pagination";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { SkeletonCard, SkeletonTableRows } from "../../components/Skeleton";
import { normalizeSearchText } from "../../utils/text";

function calcVisitasRestantes(venta) {
  const cuotas = parseFloat(venta.cuotas);
  const pagos = parseFloat(venta.pagos_realizados);
  const atraso = getCuotasAtrasadas(venta);
  if (isNaN(cuotas) || isNaN(pagos)) return null;
  return Math.round(cuotas - pagos - atraso);
}

function formatDiasSinAbono(venta) {
  return formatDiasSinAbonoBase(venta);
}

function formatCuotasAtrasadas(value) {
  if (!value) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getPriorityClasses(key) {
  return {
    critico: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    urgente: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    hoy: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    vigilar: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
    al_dia: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  }[key] || "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
}

function formatPhone(phone) {
  if (!phone) return null;
  return phone.replace(/\s+/g, "").replace(/^0/, "");
}

function buildWhatsAppUrl(venta) {
  const phone = (venta.cliente?.telefono_principal || "").replace(/[^0-9]/g, "");
  if (!phone) return null;
  const nombre = venta.cliente?.nombres || "cliente";
  const dias = getDiasSinAbono(venta);
  const cuotas = getCuotasAtrasadas(venta);
  const monto = getMontoParaPonerseAlDia(venta);
  const atraso = cuotas > 0 ? `\n⚠️ Para ponerse al día: *${formatMoney(monto)}*` : "";
  const seguimiento = dias === null || dias <= 0
    ? ""
    : `\n📆 ${formatDiasSinAbonoBase(venta)}`;
  const message = `Hola ${nombre}, le recordamos su crédito.${seguimiento}${atraso}\n💰 Saldo pendiente: *${formatMoney(venta.saldo_actual)}*`;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

export default function VentasPage() {
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading, user } = useAuth();
  const isWorker = !(user?.is_staff || user?.is_superuser);
  const [ventas, setVentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [filters, setFilters] = useState({
    estado: "Todos",
    plazo: "Todos",
    montoMin: "",
    montoMax: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVentas();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  // Permite que reportes/cartera abra esta lista con un segmento ya aplicado.
  // Se lee en el cliente para conservar compatibilidad con la página actual
  // y evitar que el filtro altere la consulta de ventas al backend.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filtro = params.get("filtro");
    const buscar = params.get("buscar");
    const plazo = params.get("plazo");
    if (filtro || plazo) {
      setFilters((prev) => ({
        ...prev,
        ...(filtro ? { estado: filtro } : {}),
        ...(plazo ? { plazo } : {}),
      }));
    }
    if (buscar) {
      setSearchTerm(buscar);
    }
  }, []);

  const fetchVentas = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(
        `/ventas/activas/t/${selectedStore.tienda.id}/`
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las ventas activas");
      }

      const data = await response.json();
      const ventasData = Array.isArray(data) ? data : [];
      setVentas(ventasData);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const ventasOrdered = [...ventas].sort((a, b) => {
    const prioridadA = getPrioridadCobranza(a);
    const prioridadB = getPrioridadCobranza(b);
    if (prioridadA.rank !== prioridadB.rank) return prioridadB.rank - prioridadA.rank;

    const diasA = getDiasSinAbono(a) ?? -1;
    const diasB = getDiasSinAbono(b) ?? -1;
    if (diasA !== diasB) return diasB - diasA;

    const cuotasA = getCuotasAtrasadas(a);
    const cuotasB = getCuotasAtrasadas(b);
    if (cuotasA !== cuotasB) return cuotasB - cuotasA;

    return Number(b.id) - Number(a.id);
  });

  const filteredVentas = ventasOrdered.filter((venta) => {
    const prioridad = getPrioridadCobranza(venta);
    if (filters.estado === "PorVencer") {
      if (venta.estado_venta !== "Vigente" && venta.estado_venta !== "Atrasado") return false;
      const vr = calcVisitasRestantes(venta);
      if (vr === null || vr < 0 || vr > 3) return false;
    } else if (filters.estado === "cob_hoy") {
      if (prioridad.rank < 1) return false;
    } else if (filters.estado === "cob_urgente") {
      if (prioridad.rank < 2) return false;
    } else if (filters.estado === "cob_sin_abono") {
      if ((getDiasSinAbono(venta) ?? 0) < 1) return false;
    } else if (filters.estado === "cob_sin_primer_abono") {
      if (parseMoney(venta.total_abonado) > 0) return false;
    } else if (filters.estado === "cob_atraso") {
      if (getCuotasAtrasadas(venta) <= 0) return false;
    } else if (filters.estado === "cob_al_dia") {
      if (getCuotasAtrasadas(venta) > 0) return false;
    } else if (filters.estado === "cob_1_5") {
      const cuotas = getCuotasAtrasadas(venta);
      if (cuotas < 1 || cuotas > 5) return false;
    } else if (filters.estado === "cob_6_15") {
      const cuotas = getCuotasAtrasadas(venta);
      if (cuotas < 6 || cuotas > 15) return false;
    } else if (filters.estado === "cob_16_30") {
      const cuotas = getCuotasAtrasadas(venta);
      if (cuotas < 16 || cuotas > 30) return false;
    } else if (filters.estado === "cob_30_mas") {
      if (getCuotasAtrasadas(venta) < 31) return false;
    } else if (filters.estado.startsWith("det_")) {
      // Tramos de deterioro: muestra el nivel elegido y peores según la frecuencia.
      const nivelMin = { det_dudoso: 1, det_critico: 2, det_irrecuperable: 3 }[filters.estado];
      if (clasificarDeterioro(venta).nivel < nivelMin) return false;
    } else if (filters.estado !== "Todos" && venta.estado_venta !== filters.estado) return false;
    if (filters.plazo !== "Todos" && venta.plazo !== filters.plazo) return false;
    if (filters.montoMin && parseFloat(venta.saldo_actual) < parseFloat(filters.montoMin)) return false;
    if (filters.montoMax && parseFloat(venta.saldo_actual) > parseFloat(filters.montoMax)) return false;

    if (debouncedSearch) {
      const searchLower = normalizeSearchText(debouncedSearch);
      const nombreCompleto = normalizeSearchText(
        `${venta.cliente?.nombres || ""} ${venta.cliente?.apellidos || ""}`
      );
      const identificacion = normalizeSearchText(venta.cliente?.identificacion);
      const matchesCliente = nombreCompleto.includes(searchLower) || identificacion.includes(searchLower);
      const matchesVenta = String(venta.id).includes(searchLower);
      return matchesCliente || matchesVenta;
    }
    return true;
  });

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filters]);

  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentVentas = filteredVentas.slice(indexOfFirstItem, indexOfLastItem);

  const summary = filteredVentas.reduce(
    (acc, venta) => {
      acc.totalVentas += 1;
      acc.saldoTotal += parseMoney(venta.saldo_actual);
      acc.abonosTotal += parseMoney(venta.total_abonado);
      const prioridad = getPrioridadCobranza(venta);
      if (prioridad.rank >= 1) acc.gestionarHoy += 1;
      if ((getDiasSinAbono(venta) ?? 0) >= 1) acc.sinAbono += 1;
      acc.montoAtrasado += getMontoParaPonerseAlDia(venta);
      if (venta.estado_venta === "Vencido") {
        acc.vencidas += 1;
        acc.perdidas += parseMoney(venta.perdida);
      }
      return acc;
    },
    {
      totalVentas: 0,
      saldoTotal: 0,
      vencidas: 0,
      perdidas: 0,
      gestionarHoy: 0,
      sinAbono: 0,
      montoAtrasado: 0,
    }
  );

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "Vigente":
        return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 dark:border-emerald-800">Vigente</span>;
      case "Atrasado":
        return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-800 border-dashed animate-pulse">Atrasado</span>;
      case "Vencido":
        return <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-200 dark:border-rose-800 shadow-sm shadow-rose-200 dark:shadow-none">Vencido</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">{estado}</span>;
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
               <FiShoppingBag className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Cartera de Créditos</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                Gestión Comercial • <span className="text-indigo-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchVentas}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 active:scale-95 transition-all shadow-sm group"
            >
              <FiActivity size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
            <Link
              href="/dashboard/ventas/nueva"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <FiPlus size={20} />
              Nueva Venta
            </Link>
          </div>
        </div>

        {/* Metrics Overview */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : null}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 ${isLoading ? "hidden" : ""}`}>
          <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                  <FiDollarSign size={24} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg uppercase tracking-widest">
                   Activo
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                {formatMoney(summary.saldoTotal)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Saldo Total en Calle</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Suma total de capital e intereses que los clientes tienen pendientes por pagar actualmente.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                  <FiActivity size={24} />
                </div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Prioridad</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {summary.gestionarHoy}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Gestionar hoy</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Créditos con al menos un ciclo pendiente, atraso acumulado o señal de cobranza urgente.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-sky-50 dark:bg-sky-900/30 text-sky-600 rounded-2xl">
                  <FiClock size={24} />
                </div>
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest leading-none">Seguimiento</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {summary.sinAbono}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Sin abono reciente</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Créditos que llevan uno o más días calendario sin registrar un abono real.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                  <FiTrendingDown size={24} />
                </div>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Cobranza</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {formatMoney(summary.montoAtrasado)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Para ponerse al día</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Suma del monto que los clientes con atraso deben abonar para cubrir sus cuotas pendientes.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-6 md:mb-8 p-5 md:p-8">
           <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="relative flex-1 w-full group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <FiSearch size={20} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ID de venta, cliente o identificación..."
                  className="block w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-medium text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                 <div className="relative group min-w-[180px]">
                    <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                    <select
                      value={filters.estado}
                      onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                      className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest appearance-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer relative z-0"
                    >
                      <option value="Todos">Todos los Estados</option>
                      <option value="PorVencer">⚠️ Por vencer (≤3 cuotas)</option>
                      <option value="Vigente">🟢 Vigente</option>
                      <option value="Atrasado">🟡 Atrasado</option>
                      <option value="Vencido">🔴 Vencido</option>
                      <optgroup label="Seguimiento de cobranza">
                        <option value="cob_hoy">🟡 Gestionar hoy o peor</option>
                        <option value="cob_urgente">🟠 Urgente o peor</option>
                        <option value="cob_sin_abono">⏱ 1+ día sin abono</option>
                        <option value="cob_sin_primer_abono">🆕 Sin primer abono</option>
                        <option value="cob_atraso">💰 Con cuotas atrasadas</option>
                      </optgroup>
                      <optgroup label="Rangos de cuotas vencidas">
                        <option value="cob_al_dia">🟢 Al día</option>
                        <option value="cob_1_5">🟡 1-5 cuotas</option>
                        <option value="cob_6_15">🟠 6-15 cuotas</option>
                        <option value="cob_16_30">🔴 16-30 cuotas</option>
                        <option value="cob_30_mas">⛔ 30+ cuotas</option>
                      </optgroup>
                      <optgroup label="Deterioro según frecuencia">
                        <option value="det_dudoso">🟠 Atención temprana</option>
                        <option value="det_critico">🔶 Riesgo alto</option>
                        <option value="det_irrecuperable">🔴 Riesgo crítico</option>
                      </optgroup>
                    </select>
                 </div>
                 <div className="relative group min-w-[150px]">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                    <select
                      value={filters.plazo}
                      onChange={(e) => setFilters({ ...filters, plazo: e.target.value })}
                      className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest appearance-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer relative z-0"
                    >
                      <option value="Todos">Todos los plazos</option>
                      <option value="Diario">Diario</option>
                      <option value="Semanal">Semanal</option>
                      <option value="Mensual">Mensual</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>

        {/* Table Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          {/* Empty state */}
          {!isLoading && filteredVentas.length === 0 && (
            <div className="px-8 py-24 text-center">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <FiShoppingBag className="text-4xl text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
                {searchTerm ? "Sin coincidencias" : "Sin ventas activas"}
              </h3>
              <p className="text-xs font-bold text-slate-400 mb-6 max-w-xs mx-auto">
                {searchTerm ? "Ningún crédito coincide con tu búsqueda." : "Crea tu primera venta a crédito para comenzar."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push("/dashboard/ventas/nueva")}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all"
                >
                  Crear Primera Venta
                </button>
              )}
            </div>
          )}

          {/* Desktop: Table */}
          {(isLoading || filteredVentas.length > 0) && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="px-5 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prioridad</th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                    <th className="px-5 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Último abono</th>
                    <th className="px-5 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Para ponerse al día</th>
                    <th className="px-5 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo</th>
                    <th className="px-5 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <SkeletonTableRows rows={8} cols={6} />
                  ) : (
                    currentVentas.map((venta) => {
                      const prioridad = getPrioridadCobranza(venta);
                      const cuotasAtrasadas = getCuotasAtrasadas(venta);
                      const montoAtrasado = getMontoParaPonerseAlDia(venta);
                      const phone = formatPhone(venta.cliente?.telefono_principal);
                      const whatsappUrl = buildWhatsAppUrl(venta);
                      return (
                      <tr
                        key={venta.id}
                        onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.target.closest("a")) return; router.push(`/dashboard/ventas/${venta.id}`); }}
                        className={`group transition-all cursor-pointer ${prioridad.rank >= 2 ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 border-l-4 border-rose-400" : prioridad.rank === 1 ? "bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/50 dark:hover:bg-amber-950/50 border-l-4 border-amber-400" : "hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 border-l-4 border-transparent"}`}
                      >
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getPriorityClasses(prioridad.key)}`}>
                              {prioridad.label}
                            </span>
                            {getStatusBadge(venta.estado_venta)}
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{prioridad.reason}</span>
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                              {venta.cliente.nombres.charAt(0)}
                            </div>
                            <div>
                              <Link href={`/dashboard/ventas/${venta.id}`} className="block text-sm font-black text-slate-800 dark:text-white leading-none mb-1 hover:text-indigo-600 transition-colors">
                                {venta.cliente.nombres} {venta.cliente.apellidos}
                              </Link>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                #{venta.id} · {venta.fecha_venta} · {venta.plazo || "Diario"} · Cuota {formatMoney(venta.valor_cuota)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiClock className={prioridad.rank >= 1 ? "text-amber-500" : "text-slate-300"} />
                            <div>
                              <p className={`text-sm font-black leading-none ${prioridad.rank >= 1 ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>
                                {formatDiasSinAbono(venta)}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {parseMoney(venta.total_abonado) > 0 && getDiasSinAbono(venta) === 0 ? "Abono más reciente" : "Sin abono real"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap text-right">
                          {cuotasAtrasadas > 0 ? (
                            <>
                              <p className="text-sm font-black text-orange-600 dark:text-orange-400 leading-none">
                                {formatMoney(montoAtrasado)}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {formatCuotasAtrasadas(cuotasAtrasadas)} cuotas atrasadas
                              </p>
                            </>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Al día</span>
                          )}
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap text-right">
                          <p className={`text-lg font-black tracking-tight leading-none ${venta.saldo_actual > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                            {formatMoney(venta.saldo_actual)}
                          </p>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {phone && (
                              <a href={`tel:${phone}`} className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl hover:bg-indigo-100 transition-all" title="Llamar">
                                <FiPhone size={14} />
                              </a>
                            )}
                            {whatsappUrl && (
                              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl hover:bg-emerald-100 transition-all" title="WhatsApp">
                                <FiMessageCircle size={14} />
                              </a>
                            )}
                            <Link href={`/dashboard/ventas/${venta.id}`} className="px-3 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                              Ver
                            </Link>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile: Cards */}
          {(isLoading || filteredVentas.length > 0) && (
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                        </div>
                      </div>
                      <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
                    </div>
                  </div>
                ))
              ) : (
                currentVentas.map((venta) => {
                  const visitasRestantes = calcVisitasRestantes(venta);
                  const proxVencer = (venta.estado_venta === "Vigente" || venta.estado_venta === "Atrasado") && visitasRestantes !== null && visitasRestantes >= 0 && visitasRestantes <= 3;
                  const prioridad = getPrioridadCobranza(venta);
                  const cuotasAtrasadas = getCuotasAtrasadas(venta);
                  const montoAtrasado = getMontoParaPonerseAlDia(venta);
                  return (
                    <Link
                      key={venta.id}
                      href={`/dashboard/ventas/${venta.id}`}
                      className={`block p-5 active:bg-slate-50 dark:active:bg-slate-800/30 transition-colors cursor-pointer ${prioridad.rank >= 2 ? "bg-rose-50/40 dark:bg-rose-950/20 border-l-4 border-rose-400" : prioridad.rank === 1 || proxVencer ? "bg-amber-50/60 dark:bg-amber-950/30 border-l-4 border-amber-400" : "border-l-4 border-transparent"}`}
                    >
                      {/* Header: avatar + nombre + estado */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm">
                            {venta.cliente.nombres.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-800 dark:text-white leading-tight truncate">
                              {venta.cliente.nombres} {venta.cliente.apellidos}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                              #{venta.id} · {venta.fecha_venta} · {venta.plazo || "Diario"}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${getPriorityClasses(prioridad.key)}`}>
                            {prioridad.label}
                          </span>
                          {getStatusBadge(venta.estado_venta)}
                        </div>
                      </div>

                      {/* Señales clave: saldo · monto para ponerse al día · último abono */}
                      <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
                          <p className={`text-sm font-black tracking-tight ${venta.saldo_actual > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                            {formatMoney(venta.saldo_actual)}
                          </p>
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ponerse al día</p>
                          <p className={`text-sm font-black tracking-tight ${montoAtrasado > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {montoAtrasado > 0 ? formatMoney(montoAtrasado) : "Al día"}
                          </p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Último abono</p>
                          <p className={`text-sm font-black tracking-tight ${prioridad.rank >= 1 ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-white"}`}>
                            {formatDiasSinAbono(venta)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {cuotasAtrasadas > 0 ? `${formatCuotasAtrasadas(cuotasAtrasadas)} cuotas atrasadas` : prioridad.reason}
                        </span>
                        {proxVencer && (
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-300 dark:border-amber-700">
                            ⚠ {visitasRestantes === 0 ? "Última cuota" : `${visitasRestantes} p/ vencer`}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          centered
        />

        {/* Financial Context Sidebar/Extra (Optional stats) */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-indigo-500 dark:bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                    <FiPieChart size={24} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Distribución Riesgo Cartera</h3>
              </div>
              
              <div className="space-y-6">
                {["Vigente", "Atrasado", "Vencido"].map((estado) => {
                  const count = filteredVentas.filter(v => v.estado_venta === estado).length;
                  const percentage = filteredVentas.length > 0 ? ((count / filteredVentas.length) * 100) : 0;
                  const colors = {
                    Vigente: 'bg-emerald-500',
                    Atrasado: 'bg-amber-500',
                    Vencido: 'bg-rose-500'
                  };

                  return (
                    <div key={estado} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{estado}</span>
                        <div className="text-right">
                           <span className="text-sm font-black text-slate-800 dark:text-white">{count}</span>
                           <span className="text-[10px] font-bold text-slate-400 ml-2 uppercase">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                         <div 
                           className={`h-full rounded-full ${colors[estado]} transition-all duration-1000 shadow-sm`}
                           style={{ width: `${percentage}%` }}
                         />
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>

           <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-emerald-500 dark:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none">
                    <FiArrowUpRight size={24} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Proyecciones de Recupero</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Interés en Proceso</p>
                       <div className="group relative">
                         <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                           Utilidad proyectada que se espera percibir de los créditos activos (Diferencia entre Total a Pagar y Capital).
                           <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                         </div>
                       </div>
                    </div>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                       {formatMoney(filteredVentas.reduce((sum, v) => sum + (parseMoney(v.total_a_pagar) - parseMoney(v.valor_venta)), 0))}
                    </p>
                 </div>
                 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Recaudado</p>
                       <div className="group relative">
                         <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                           Monto acumulado de todos los abonos realizados por los clientes en sus créditos vigentes.
                           <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                         </div>
                       </div>
                    </div>
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                       {formatMoney(filteredVentas.reduce((sum, v) => sum + parseFloat(v.total_abonado), 0))}
                    </p>
                 </div>
                 <div className="col-span-2 p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none mt-2">
                    <div className="flex justify-between items-center mb-1">
                       <div className="flex items-center gap-2">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80 leading-none">Saldo Proyectado Total</p>
                          <div className="group relative">
                            <FiInfo className="text-white/40 hover:text-white cursor-help transition-colors" size={12} />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900 border border-white/10 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl text-center uppercase tracking-tighter">
                              Monto total que se espera recolectar (Capital + Intereses) de la cartera activa completa.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                            </div>
                          </div>
                       </div>
                       <FiDollarSign className="opacity-50" />
                    </div>
                    <p className="text-3xl font-black tracking-tighter">
                       {formatMoney(filteredVentas.reduce((sum, v) => sum + parseFloat(v.total_a_pagar), 0))}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

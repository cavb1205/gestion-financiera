// app/dashboard/ventas/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiShoppingBag,
  FiFilter,
  FiSearch,
  FiPlus,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiDollarSign,
  FiUser,
  FiInfo,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiPieChart,
  FiArrowUpRight,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../utils/format";
import Link from "next/link";

export default function VentasPage() {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    estado: "Todos",
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

  const fetchVentas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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

  const ventasOrdered = [...ventas].sort((a, b) => b.id - a.id);

  const filteredVentas = ventasOrdered.filter((venta) => {
    if (filters.estado !== "Todos" && venta.estado_venta !== filters.estado) return false;
    if (filters.montoMin && parseFloat(venta.saldo_actual) < parseFloat(filters.montoMin)) return false;
    if (filters.montoMax && parseFloat(venta.saldo_actual) > parseFloat(filters.montoMax)) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesCliente =
        venta.cliente.nombres.toLowerCase().includes(searchLower) ||
        venta.cliente.apellidos.toLowerCase().includes(searchLower) ||
        venta.cliente.identificacion.toLowerCase().includes(searchLower);
      const matchesVenta = venta.id.toString().includes(searchTerm);
      return matchesCliente || matchesVenta;
    }
    return true;
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filters]);

  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentVentas = filteredVentas.slice(indexOfFirstItem, indexOfLastItem);

  const getPageNumbers = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const summary = filteredVentas.reduce(
    (acc, venta) => {
      acc.totalVentas += 1;
      acc.saldoTotal += parseMoney(venta.saldo_actual);
      acc.abonosTotal += parseMoney(venta.total_abonado);
      if (venta.estado_venta === "Vencido") {
        acc.vencidas += 1;
        acc.perdidas += parseMoney(venta.perdida);
      }
      return acc;
    },
    { totalVentas: 0, saldoTotal: 0, vencidas: 0, perdidas: 0 }
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

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sincronizando Cartera Activa</p>
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
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Cartera de Créditos</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
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

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-2xl">
                  <FiShoppingBag size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Contratos</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {summary.totalVentas}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ventas Activas</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Número total de contratos de crédito que se encuentran en curso (Vigentes, Atrasados o Vencidos).
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                  <FiClock size={24} />
                </div>
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest animate-pulse font-black leading-none">Crítico</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {summary.vencidas}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ventas Vencidas</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Créditos que han superado su fecha de vencimiento sin haber sido cancelados en su totalidad.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                  <FiTrendingDown size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Riesgo</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {formatMoney(summary.perdidas)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Monto en Mora Crítica</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Total del saldo pendiente perteneciente exclusivamente a los créditos que ya están en estado Vencido.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-8">
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
                      <option value="Vigente">🟢 Vigente</option>
                      <option value="Atrasado">🟡 Atrasado</option>
                      <option value="Vencido">🔴 Vencido</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>

        {/* Table Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="hidden md:table-cell px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referencia</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Titular del Crédito</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha Venta</th>
                  <th className="px-12 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Venta</th>
                  <th className="px-12 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo Pendiente</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado / Mora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVentas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-24 text-center">
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
                    </td>
                  </tr>
                ) : (
                  currentVentas.map((venta) => (
                    <tr 
                      key={venta.id} 
                      onClick={() => router.push(`/dashboard/ventas/${venta.id}`)}
                      className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer"
                    >
                      <td className="hidden md:table-cell px-4 py-6 whitespace-nowrap">
                         <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600 transition-colors">#{venta.id}</span>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                            {venta.cliente.nombres.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1">
                              {venta.cliente.nombres} {venta.cliente.apellidos}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                              {venta.cliente.identificacion}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-slate-500">
                            <FiCalendar className="text-slate-300" />
                            <span className="text-xs font-bold">{venta.fecha_venta}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-none">
                          {formatMoney(venta.valor_venta)}
                        </p>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right">
                        <p className={`text-lg font-black tracking-tight leading-none mb-1 ${venta.saldo_actual > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                          {formatMoney(venta.saldo_actual)}
                        </p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Saldo Restante</p>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-2">
                           {getStatusBadge(venta.estado_venta)}
                           {venta.dias_atrasados > 0 && (
                             <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                               {Math.round(venta.dias_atrasados)} Días Mora
                             </span>
                           )}
                           {venta.dias_atrasados < 0 && (
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                               {Math.round(Math.abs(venta.dias_atrasados))} Días Adelantado
                             </span>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-30 hover:text-indigo-600 active:scale-95 transition-all shadow-sm"
            >
              <FiChevronLeft size={16} />
            </button>
            {getPageNumbers(currentPage, totalPages).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  currentPage === page
                    ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-lg"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-30 hover:text-indigo-600 active:scale-95 transition-all shadow-sm"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Financial Context Sidebar/Extra (Optional stats) */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
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

           <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
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

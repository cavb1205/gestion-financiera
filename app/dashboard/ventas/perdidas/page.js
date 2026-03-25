// app/dashboard/ventas/perdidas/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertTriangle,
  FiSearch,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiArrowLeft,
  FiShield,
  FiTrendingDown,
  FiXCircle,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../../utils/format";

export default function VentasPerdidasPage() {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVentasPerdidas();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchVentasPerdidas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/perdidas/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las ventas en pérdida");
      }

      const data = await response.json();
      if (data.message) {
        setVentas([]);
      } else {
        const ventasData = Array.isArray(data) ? data : [];
        setVentas(ventasData);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching lost sales:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const ventasOrdered = [...ventas].sort((a, b) => b.id - a.id);

  const filteredVentas = ventasOrdered.filter((venta) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const matchesCliente =
      venta.cliente.nombres.toLowerCase().includes(searchLower) ||
      venta.cliente.apellidos.toLowerCase().includes(searchLower) ||
      venta.cliente.identificacion.toLowerCase().includes(searchLower);
    const matchesVenta = venta.id.toString().includes(searchTerm);
    return matchesCliente || matchesVenta;
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

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
      acc.totalPerdidas += 1;
      acc.capitalPerdido += parseMoney(venta.valor_venta);
      acc.saldoPerdido += parseMoney(venta.saldo_actual);
      acc.totalAbonado += parseMoney(venta.total_abonado);
      return acc;
    },
    { totalPerdidas: 0, capitalPerdido: 0, saldoPerdido: 0, totalAbonado: 0 }
  );

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
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando Ventas en Pérdida</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/dashboard/ventas")}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 transition-all shadow-sm shrink-0"
            >
              <FiArrowLeft size={18} />
            </button>
            <div className="bg-rose-600 p-4 rounded-[1.5rem] shadow-xl shadow-rose-200 dark:shadow-none">
               <FiAlertTriangle className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Ventas en Pérdida</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                Registro de Pérdidas • <span className="text-rose-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchVentasPerdidas}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 active:scale-95 transition-all shadow-sm group"
            >
              <FiActivity size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                  <FiXCircle size={24} />
                </div>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse leading-none">Pérdida</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {summary.totalPerdidas}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Créditos en Pérdida</p>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-2xl">
                  <FiDollarSign size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Capital</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {formatMoney(summary.capitalPerdido)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Total Vendido</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-rose-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Suma del valor de venta original de todos los créditos marcados como pérdida.
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
                  <FiTrendingDown size={24} />
                </div>
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest leading-none">Irrecuperable</span>
              </div>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tighter mb-1">
                {formatMoney(summary.saldoPerdido)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Saldo No Recuperado</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-rose-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Monto que quedó pendiente al momento de marcar la venta como pérdida. Este dinero no se recuperará.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                  <FiShield size={24} />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">Recuperado</span>
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter mb-1">
                {formatMoney(summary.totalAbonado)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Abonado</p>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-emerald-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Total de pagos que se alcanzaron a recaudar antes de que el crédito fuera declarado como pérdida.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-8">
           <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="relative flex-1 w-full group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                  <FiSearch size={20} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, identificación o ID de venta..."
                  className="block w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-medium text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="px-5 py-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                  <span className="text-[11px] font-black text-rose-600 uppercase tracking-widest">
                    {filteredVentas.length} {filteredVentas.length === 1 ? "Registro" : "Registros"}
                  </span>
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
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha Venta</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Venta</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Abonado</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pérdida Neta</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVentas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-24 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <FiAlertTriangle className="text-4xl text-slate-200" />
                      </div>
                      <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Sin ventas en pérdida</h3>
                      <p className="text-sm font-bold text-slate-400 mt-2">No se encontraron créditos declarados como pérdida.</p>
                    </td>
                  </tr>
                ) : (
                  currentVentas.map((venta) => (
                    <tr
                      key={venta.id}
                      onClick={() => router.push(`/dashboard/ventas/${venta.id}`)}
                      className="group hover:bg-rose-50/30 dark:hover:bg-rose-500/5 transition-all cursor-pointer"
                    >
                      <td className="hidden md:table-cell px-4 py-6 whitespace-nowrap">
                         <span className="text-xs font-black text-slate-400 group-hover:text-rose-600 transition-colors">#{venta.id}</span>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 font-black text-sm group-hover:scale-110 transition-transform">
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
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">
                          {formatMoney(venta.total_abonado)}
                        </p>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right">
                        <p className="text-lg font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none mb-1">
                          {formatMoney(venta.saldo_actual)}
                        </p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No Recuperado</p>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap text-center">
                        <span className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                          Pérdida
                        </span>
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
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-30 hover:text-rose-600 active:scale-95 transition-all shadow-sm"
            >
              <FiChevronLeft size={16} />
            </button>
            {getPageNumbers(currentPage, totalPages).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  currentPage === page
                    ? "bg-slate-900 dark:bg-rose-600 text-white shadow-lg"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-30 hover:text-rose-600 active:scale-95 transition-all shadow-sm"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {filteredVentas.length > 0 && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Loss Analysis */}
            <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-rose-500 dark:bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-200 dark:shadow-none">
                  <FiTrendingDown size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Análisis de Pérdidas</h3>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Tasa de Pérdida</span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {summary.capitalPerdido > 0
                        ? ((summary.saldoPerdido / summary.capitalPerdido) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-1000 shadow-sm"
                      style={{ width: `${summary.capitalPerdido > 0 ? ((summary.saldoPerdido / summary.capitalPerdido) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mt-2">
                    Porcentaje del capital original que no se logró recuperar
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Promedio por Pérdida</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                      {formatMoney(summary.totalPerdidas > 0 ? summary.saldoPerdido / summary.totalPerdidas : 0)}
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tasa de Recupero</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {summary.capitalPerdido > 0
                        ? ((summary.totalAbonado / summary.capitalPerdido) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Protocol Info */}
            <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl shadow-lg shadow-slate-300 dark:shadow-none">
                  <FiShield size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Protocolo de Pérdidas</h3>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                  <p className="text-[10px] font-bold text-amber-600 leading-relaxed uppercase tracking-tighter">
                    Las ventas en pérdida son créditos cerrados permanentemente. El cliente asociado queda bloqueado automáticamente y el saldo restante se registra como pérdida neta.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <FiXCircle className="text-rose-500 mt-0.5 shrink-0" size={14} />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-relaxed">
                      El crédito no puede reactivarse una vez declarado en pérdida
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <FiUser className="text-amber-500 mt-0.5 shrink-0" size={14} />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-relaxed">
                      El cliente queda con estado &ldquo;Bloqueado&rdquo; y no puede acceder a nuevos créditos
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <FiDollarSign className="text-slate-500 mt-0.5 shrink-0" size={14} />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-relaxed">
                      El saldo pendiente se contabiliza como pérdida neta en los reportes de utilidad
                    </p>
                  </div>
                </div>
              </div>
              <FiAlertTriangle className="absolute -right-6 -bottom-6 text-rose-500/5 opacity-30" size={120} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

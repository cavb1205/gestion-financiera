// app/dashboard/ventas/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiClock,
  FiBarChart2,
  FiPercent,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiXCircle,
  FiAlertTriangle,
  FiActivity,
  FiShield,
  FiArrowUpRight,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { formatMoney, parseMoney } from "../../../utils/format";
import LoadingSpinner from "../../../components/LoadingSpinner";
import EliminarRecaudo from "@/app/components/recaudos/EliminarRecaudo";
import EditarRecaudo from "@/app/components/recaudos/EditarRecaudo";
import { toast } from "react-toastify";

export default function VentaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ventaId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();

  const [venta, setVenta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagos, setPagos] = useState([]);

  // Estados para el modal de pérdida
  const [showLossModal, setShowLossModal] = useState(false);
  const [isSendingLoss, setIsSendingLoss] = useState(false);
  const [lossError, setLossError] = useState(null);
  const [deletingRecaudo, setDeletingRecaudo] = useState(null);
  const [editingRecaudo, setEditingRecaudo] = useState(null);

  const [refreshData, setRefreshData] = useState(false);

  const handleRegistrarPago = () => {
    const valorAbono = Math.min(
      parseMoney(venta.saldo_actual),
      parseMoney(venta.valor_cuota)
    );
    const today = new Date();
    const selectedDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

    const abono = {
      fecha_recaudo: selectedDate,
      valor_recaudo: valorAbono,
      saldo_actual: venta.saldo_actual,
      venta: venta.id,
      tienda: selectedStore.tienda.id,
    };
    localStorage.setItem("abono", JSON.stringify(abono));
    localStorage.setItem("cliente", JSON.stringify(venta.cliente));
    router.push(`/dashboard/liquidar/abonar`);
  };

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVenta();
    }
  }, [loading, isAuthenticated, selectedStore, refreshData]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchVenta = async () => {
    try {
      setIsLoading(true);
      const ventaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!ventaResponse.ok) throw new Error("No se pudo cargar la información de la venta");
      const ventaData = await ventaResponse.json();
      setVenta(ventaData);

      const pagosResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${ventaId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!pagosResponse.ok) throw new Error("No se pudieron cargar los pagos de la venta");
      const pagosData = await pagosResponse.json();
      setPagos(Array.isArray(pagosData) ? pagosData : []);

      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const markAsLoss = async () => {
    setIsSendingLoss(true);
    setLossError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/perdida/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al marcar como pérdida");
      }

      toast.success("Venta marcada como pérdida");
      setRefreshData(prev => !prev);
      setShowLossModal(false);
    } catch (err) {
      setLossError(err.message);
    } finally {
      setIsSendingLoss(false);
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "Vigente":
        return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 dark:border-emerald-800">Vigente</span>;
      case "Vencido":
        return <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-200 dark:border-rose-800">Vencido</span>;
      case "Pagado":
        return <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200 dark:border-indigo-800">Pagado</span>;
      case "Perdida":
        return <span className="px-3 py-1 bg-slate-900 text-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-700">Perdida</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">{estado}</span>;
    }
  };

  const totalPagado = pagos.reduce((sum, pago) => sum + parseMoney(pago.valor_recaudo), 0);
  const progresoPago = venta ? (totalPagado / parseMoney(venta.total_a_pagar)) * 100 : 0;

  if (loading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando Hoja de Ruta del Crédito</p>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass p-12 text-center rounded-[2.5rem] border-rose-100 dark:border-rose-900/30 shadow-2xl">
          <FiAlertCircle className="mx-auto text-rose-500 text-5xl mb-6" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Error de Sincronización</h2>
          <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-widest">{error || "Información no disponible"}</p>
          <div className="flex justify-center gap-4">
            <button onClick={fetchVenta} className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Reintentar</button>
            <button onClick={() => router.push("/dashboard/ventas")} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700">Ir a Ventas</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {editingRecaudo && <EditarRecaudo editingRecaudo={editingRecaudo} onEditar={() => { setEditingRecaudo(null); setRefreshData(p => !p) }} onClose={() => setEditingRecaudo(null)} />}
      {deletingRecaudo && <EliminarRecaudo deletingRecaudo={deletingRecaudo} onEliminar={() => { setDeletingRecaudo(null); setRefreshData(p => !p) }} onClose={() => setDeletingRecaudo(null)} />}

      {/* Modal Perdida */}
      {showLossModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="glass max-w-md w-full rounded-[2.5rem] border-white/20 p-10 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-200">
                <FiAlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-4 uppercase">¿Activar Proceso de Pérdida?</h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8">
                Esta acción cerrará el crédito permanentemente sin posibilidad de recupero. El saldo se registrará como pérdida neta del ejercicio.
              </p>
            </div>

            {lossError && <div className="bg-rose-50 p-4 rounded-xl text-rose-600 text-[10px] font-black uppercase mb-6">{lossError}</div>}

            <div className="flex flex-col gap-3">
              <button onClick={markAsLoss} disabled={isSendingLoss} className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                {isSendingLoss ? "Procesando..." : "Confirmar Pérdida"}
              </button>
              <button onClick={() => setShowLossModal(false)} disabled={isSendingLoss} className="w-full py-5 bg-transparent text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar Proceso</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/dashboard/ventas")} className="p-3.5 bg-white dark:bg-slate-900 text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 active:scale-95 transition-all shadow-sm group shrink-0">
            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none capitalize truncate">{venta.cliente?.nombres} {venta.cliente?.apellidos}</h1>
              {getStatusBadge(venta.estado_venta)}
            </div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Crédito #{ventaId} • <span className="opacity-60">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button onClick={handleRegistrarPago} className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            <FiPlus size={16} /> Registrar Abono
          </button>
          <button onClick={() => router.push(`/dashboard/ventas/${ventaId}/editar`)} className="px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2">
            <FiEdit size={16} /> Editar
          </button>
          <button onClick={() => setShowLossModal(true)} className="px-5 py-3.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 active:scale-95 transition-all flex items-center gap-2">
            <FiAlertTriangle size={16} /> Pérdida
          </button>
        </div>

        {/* Resumen Financiero Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><FiDollarSign size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Valor Venta</span>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">{formatMoney(venta.valor_venta)}</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md inline-block">Capital Neto</p>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><FiBarChart2 size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total a recaudar</span>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">{formatMoney(venta.total_a_pagar)}</p>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Interés {venta.interes}% Incluido</p>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl"><FiTrendingDown size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Saldo Actual</span>
            </div>
            <p className={`text-3xl font-black tracking-tighter mb-1 select-all ${parseFloat(venta.saldo_actual) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMoney(venta.saldo_actual)}
            </p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(venta.pagos_pendientes)} Cuotas Pend.</p>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{progresoPago.toFixed(1)}%</p>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(progresoPago, 100)}%` }}
              />
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><FiCreditCard size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Valor Cuota</span>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">{formatMoney(venta.valor_cuota)}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{venta.cuotas} Cuotas Fijas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main Info Card */}
          <div className="lg:col-span-8 space-y-10">
            <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-100"><FiShield size={24} /></div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Datos del Contrato</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 mb-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Apertura</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{venta.fecha_venta}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Estimada Cierre</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{venta.fecha_vencimiento}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Mora</p>
                  <p className={`text-sm font-black ${venta.dias_atrasados > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {venta.dias_atrasados > 0 ? `${Math.round(venta.dias_atrasados)} Días de Atraso` : `${Math.round(venta.dias_atrasados) * -1} Días Adelantado`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eficiencia de Recaudo</p>
                  <p className="text-sm font-black text-indigo-600">{Math.round(venta.pagos_realizados)} de {venta.cuotas} Cuotas Liq.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Abono Diario</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{formatMoney(venta.promedio_pago)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plazo Original</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">{venta.plazo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa Pactada</p>
                  <p className="text-sm font-black text-indigo-600">{venta.interes}%</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 group">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progreso de Amortización</p>
                    <h3 className="text-2xl font-black text-indigo-600 tracking-tighter">{progresoPago.toFixed(1)}% Completo</h3>
                  </div>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{formatMoney(totalPagado)} / {formatMoney(venta.total_a_pagar)}</p>
                </div>
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-800">
                  <div
                    className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-1000"
                    style={{ width: `${progresoPago}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Comentarios Operativos</p>
                <p className="text-xs font-bold text-slate-500 italic leading-relaxed">&quot;{venta.comentario || "Sin notas adicionales registradas en este contrato."}&quot;</p>
              </div>
            </div>

            {/* Historial de Pagos Section */}
            <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><FiActivity size={20} /></div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Bitácora de Recaudos</h2>
                </div>
                <button onClick={handleRegistrarPago} className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                  <FiPlus /> Nuevo Registro
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Abono</th>
                      <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {pagos.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-8 py-20 text-center">
                          <FiActivity className="mx-auto text-4xl text-slate-200 mb-4" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin registros de pago vinculados</p>
                        </td>
                      </tr>
                    ) : (
                      pagos.map(pago => {
                        const valor = parseFloat(pago.valor_recaudo);
                        const isFallida = valor === 0 && pago.visita_blanco;
                        return (
                          <tr key={pago.id} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all">
                            <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-slate-500">{pago.fecha_recaudo}</td>
                            <td className="px-8 py-5">
                              {isFallida ? (
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Visita Fallida</span>
                                  <span className="text-[9px] text-slate-400 italic mt-0.5 truncate max-w-[150px]">{pago.visita_blanco.tipo_falla}: {pago.visita_blanco.comentario}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Abono Ordinario</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <span className={`text-sm font-black ${valor > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{formatMoney(valor)}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex items-center justify-center gap-3">
                                {valor > 0 && <button onClick={() => setEditingRecaudo(pago)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-indigo-600 transition-colors"><FiEdit size={14} /></button>}
                                <button onClick={() => setDeletingRecaudo(pago)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-rose-600 transition-colors"><FiTrash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Area: Client Snapshot */}
          <div className="lg:col-span-4 space-y-10">
            <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-100"><FiUser size={24} /></div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Titularización</h2>
              </div>

              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-800 border-4 border-white dark:border-slate-900 rounded-[2.5rem] flex items-center justify-center text-4xl text-indigo-500 font-black shadow-2xl mb-6">
                  {venta.cliente.nombres.charAt(0)}
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">{venta.cliente.nombres} {venta.cliente.apellidos}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{venta.cliente.identificacion}</p>
                <div className="mt-4">{venta.cliente.estado_cliente === "Activo" ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Solvente</span> : <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100">Bloqueado</span>}</div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <div className="p-2 bg-white dark:bg-slate-700 text-slate-400 rounded-xl shadow-sm"><FiMapPin size={18} /></div>
                  <div className="flex-1 truncate">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{venta.cliente.direccion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <div className="p-2 bg-white dark:bg-slate-700 text-slate-400 rounded-xl shadow-sm"><FiPhone size={18} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacto Directo</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{venta.cliente.telefono_principal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <div className="p-2 bg-white dark:bg-slate-700 text-slate-400 rounded-xl shadow-sm"><FiShield size={18} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Razon Social</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">{venta.cliente.nombre_local || "S/N"}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push(`/dashboard/clientes/${venta.cliente.id}`)}
                className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                Expediente Completo <FiArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 bg-indigo-600 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">Cartera Proyectada</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Capital de Giro</span>
                    <span className="text-lg font-black">{formatMoney(venta.valor_venta)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Utilidad Bruta</span>
                    <span className="text-lg font-black text-emerald-300">+{formatMoney(parseMoney(venta.total_a_pagar) - parseMoney(venta.valor_venta))}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-indigo-200">Total Recupero</span>
                    <span className="text-2xl font-black">{formatMoney(venta.total_a_pagar)}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

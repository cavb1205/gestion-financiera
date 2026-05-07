// app/dashboard/ventas/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiUser,
  FiBarChart2,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTrendingDown,
  FiAlertTriangle,
  FiActivity,
  FiShield,
  FiArrowUpRight,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiMessageCircle,
  FiCalendar,
  FiExternalLink,
  FiFilter,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import { formatMoney, parseMoney, calcularTotal, calcularCuota } from "../../../utils/format";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ConfirmModal from "@/app/components/ConfirmModal";
import EditarRecaudo from "@/app/components/recaudos/EditarRecaudo";
import { toast } from "react-toastify";

export default function VentaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ventaId = params.id;
  const { selectedStore, isAuthenticated, loading, user } = useAuth();
  const isWorker = !(user?.is_staff || user?.is_superuser);

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
  const [isDeletingRecaudo, setIsDeletingRecaudo] = useState(false);

  const [refreshData, setRefreshData] = useState(false);

  // Renovación
  const [showRenovarModal, setShowRenovarModal] = useState(false);
  const [renovarForm, setRenovarForm] = useState({ cuotas: 20, fecha_venta: "" });
  const [isRenovando, setIsRenovando] = useState(false);
  const [renovarError, setRenovarError] = useState(null);

  // Paginación historial
  const PAGOS_PER_PAGE = 8;
  const [pagosPage, setPagosPage] = useState(1);

  // Filtro historial
  const [filtroRecaudos, setFiltroRecaudos] = useState("todos");
  const setFiltro = (f) => { setFiltroRecaudos(f); setPagosPage(1); };

  // Confirmación pérdida
  const [lossConfirmText, setLossConfirmText] = useState("");

  const handleDeleteRecaudo = async () => {
    setIsDeletingRecaudo(true);
    try {
      const response = await apiFetch(`/recaudos/${deletingRecaudo.id}/delete/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar el recaudo");
      setDeletingRecaudo(null);
      setRefreshData(p => !p);
      toast.warning("Recaudo eliminado");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsDeletingRecaudo(false);
    }
  };

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
      const ventaResponse = await apiFetch(`/ventas/${ventaId}/`);

      if (!ventaResponse.ok) throw new Error("No se pudo cargar la información de la venta");
      const ventaData = await ventaResponse.json();
      setVenta(ventaData);

      const pagosResponse = await apiFetch(`/recaudos/list/${ventaId}/`);

      if (!pagosResponse.ok) throw new Error("No se pudieron cargar los pagos de la venta");
      const pagosData = await pagosResponse.json();
      setPagos(Array.isArray(pagosData) ? pagosData : []);

      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const openRenovarModal = () => {
    setRenovarForm({ cuotas: venta.cuotas ?? 20, fecha_venta: todayISO(), interes: venta.interes ?? 20 });
    setRenovarError(null);
    setShowRenovarModal(true);
  };

  const handleRenovar = async () => {
    if (!renovarForm.cuotas || renovarForm.cuotas < 1) {
      setRenovarError("El plazo debe ser al menos 1 cuota");
      return;
    }
    if (!renovarForm.fecha_venta) {
      setRenovarError("Debes ingresar una fecha de inicio");
      return;
    }
    setIsRenovando(true);
    setRenovarError(null);
    try {
      const saldoActual = parseMoney(venta.saldo_actual);

      // 1. Abonar el saldo completo → el backend marca el crédito como Pagado automáticamente
      const recaudoRes = await apiFetch(`/recaudos/create/t/${selectedStore.tienda.id}/`, {
        method: "POST",
        body: JSON.stringify({
          fecha_recaudo: renovarForm.fecha_venta,
          valor_recaudo: saldoActual,
          venta: venta.id,
        }),
      });
      if (!recaudoRes.ok) {
        const err = await recaudoRes.json();
        throw new Error(err.detail || "Error al liquidar el crédito anterior");
      }

      // 2. Crear nuevo crédito con el saldo anterior como capital
      const nuevaRes = await apiFetch(`/ventas/create/t/${selectedStore.tienda.id}/`, {
        method: "POST",
        body: JSON.stringify({
          fecha_venta: renovarForm.fecha_venta,
          valor_venta: saldoActual,
          interes: parseFloat(renovarForm.interes),
          cuotas: parseInt(renovarForm.cuotas),
          comentario: `Renovación de crédito #${ventaId}`,
          cliente: venta.cliente.id,
          id_tienda: selectedStore.tienda.id,
        }),
      });
      if (!nuevaRes.ok) {
        const err = await nuevaRes.json();
        throw new Error(err.detail || "Error al crear el nuevo crédito");
      }
      const nuevaVenta = await nuevaRes.json();
      toast.success("Crédito renovado exitosamente");
      setShowRenovarModal(false);
      router.push(`/dashboard/ventas/${nuevaVenta.id}`);
    } catch (err) {
      setRenovarError(err.message);
    } finally {
      setIsRenovando(false);
    }
  };

  const markAsLoss = async () => {
    setIsSendingLoss(true);
    setLossError(null);
    try {
      const response = await apiFetch(`/ventas/${ventaId}/perdida/`, {
        method: "PUT",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al marcar como pérdida");
      }

      toast.success("Venta marcada como pérdida");
      setRefreshData(prev => !prev);
      setShowLossModal(false);
      setLossConfirmText("");
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

  // Proyección de cierre real basada en promedio de pago
  const proyeccionCierre = (() => {
    const saldo = parseMoney(venta?.saldo_actual);
    const promedio = parseMoney(venta?.promedio_pago);
    if (promedio <= 0 || saldo <= 0) return null;
    const diasRestantes = Math.ceil(saldo / promedio);
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasRestantes);
    return fecha.toISOString().split("T")[0];
  })();

  // ID del pago más reciente
  const lastPagoId = pagos.length > 0
    ? pagos.reduce((a, b) => a.fecha_recaudo >= b.fecha_recaudo ? a : b).id
    : null;

  // Pagos filtrados según pestaña activa
  const pagosFiltrados = filtroRecaudos === "abonos"
    ? pagos.filter(p => parseFloat(p.valor_recaudo) > 0)
    : filtroRecaudos === "fallidas"
    ? pagos.filter(p => parseFloat(p.valor_recaudo) === 0 && p.visita_blanco)
    : pagos;

  const whatsappUrl = (() => {
    try {
      const prefijo = selectedStore?.tienda?.prefijo_telefono || '56';
      const digits = (venta?.cliente?.telefono_principal || "").replace(/[^0-9]/g, "");
      const raw = digits.startsWith(prefijo) ? digits : prefijo + digits;
      const nombre = venta?.cliente?.nombres || "";
      const saldo = formatMoney(venta?.saldo_actual);
      const cuota = formatMoney(venta?.valor_cuota);
      const abonado = formatMoney(venta?.total_abonado);
      const mora = Math.round(venta?.dias_atrasados || 0);
      const pagosRealizados = Math.round(venta?.pagos_realizados || 0);
      const totalCuotas = Math.round(venta?.cuotas || 0);
      const estadoTexto = venta?.estado_venta === "Vencido"
        ? `vencido con *${mora} días* de mora`
        : `con saldo pendiente`;
      const msg =
        `Hola ${nombre}, le recordamos que tiene un crédito ${estadoTexto}.\n\n` +
        `💰 Saldo pendiente: *${saldo}*\n` +
        `✅ Total abonado: *${abonado}*\n` +
        `📅 Progreso: *${pagosRealizados}/${totalCuotas} días*\n` +
        `📋 Valor cuota: *${cuota}*\n\n`;
      return `https://wa.me/${raw}?text=${encodeURIComponent(msg)}`;
    } catch { return "https://wa.me/"; }
  })();

  const totalAbonado = parseMoney(venta?.total_abonado);
  const progresoPago = venta ? (totalAbonado / parseMoney(venta.total_a_pagar)) * 100 : 0;

  if (loading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando crédito...</p>
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
      {deletingRecaudo && (
        <ConfirmModal
          isOpen={!!deletingRecaudo}
          onClose={() => setDeletingRecaudo(null)}
          onConfirm={handleDeleteRecaudo}
          title="¿Anular Recaudo?"
          message="Esta acción es irreversible y eliminará el registro de la auditoría de caja."
          confirmText="Confirmar Anulación"
          cancelText="Mantener Registro"
          isLoading={isDeletingRecaudo}
        >
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cliente</span>
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase truncate ml-4">
                {deletingRecaudo.venta?.cliente?.nombres} {deletingRecaudo.venta?.cliente?.apellidos}
              </span>
            </div>
            <div className="flex justify-between items-center px-1 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Monto a Reversar</span>
              <span className="text-lg font-black text-rose-600">
                {formatMoney(deletingRecaudo.valor_recaudo)}
              </span>
            </div>
          </div>
        </ConfirmModal>
      )}

      {/* Modal Renovación */}
      {showRenovarModal && venta && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="glass max-w-md w-full rounded-[2.5rem] border-white/20 p-10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 shrink-0">
                <FiRefreshCw size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Renovar Crédito</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crédito #{ventaId} · {venta.cliente?.nombres} {venta.cliente?.apellidos}</p>
              </div>
            </div>

            {/* Resumen del crédito anterior */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] p-5 mb-6 space-y-3 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto a renovar</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{formatMoney(venta.saldo_actual)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a recaudar</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatMoney(calcularTotal(parseMoney(venta.saldo_actual), parseFloat(renovarForm.interes || 0)))}
                </span>
              </div>
            </div>

            {/* Campos editables */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Interés (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={renovarForm.interes}
                  onChange={e => setRenovarForm(f => ({ ...f, interes: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fecha de inicio</label>
                <input
                  type="date"
                  value={renovarForm.fecha_venta}
                  onChange={e => setRenovarForm(f => ({ ...f, fecha_venta: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Plazo (cuotas)</label>
                <input
                  type="number"
                  min="1"
                  value={renovarForm.cuotas}
                  onChange={e => setRenovarForm(f => ({ ...f, cuotas: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                {renovarForm.cuotas > 0 && (
                  <p className="text-[10px] font-black text-indigo-500 mt-2 uppercase tracking-widest">
                    Cuota estimada: {formatMoney(calcularCuota(calcularTotal(parseMoney(venta.saldo_actual), parseFloat(renovarForm.interes || 0)), parseInt(renovarForm.cuotas)))}
                  </p>
                )}
              </div>
            </div>

            {renovarError && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 p-4 rounded-2xl text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-widest mb-4">
                {renovarError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRenovar}
                disabled={isRenovando}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isRenovando ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
                ) : (
                  <><FiRefreshCw size={15} /> Confirmar Renovación</>
                )}
              </button>
              <button
                onClick={() => setShowRenovarModal(false)}
                disabled={isRenovando}
                className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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

            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Escribe CONFIRMAR para continuar</p>
              <input
                type="text"
                value={lossConfirmText}
                onChange={e => setLossConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-500/60 transition-all"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={markAsLoss} disabled={isSendingLoss || lossConfirmText !== "CONFIRMAR"} className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all">
                {isSendingLoss ? "Procesando..." : "Confirmar Pérdida"}
              </button>
              <button onClick={() => { setShowLossModal(false); setLossConfirmText(""); }} disabled={isSendingLoss} className="w-full py-5 bg-transparent text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar Proceso</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <button onClick={() => router.push("/dashboard/ventas")} className="p-3 bg-white dark:bg-slate-900 text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 active:scale-95 transition-all shadow-sm group shrink-0">
            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <button
              onClick={() => router.push(`/dashboard/clientes/${venta.cliente.id}`)}
              className="block text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-tight capitalize hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left w-full"
            >
              {venta.cliente?.nombres} {venta.cliente?.apellidos}
            </button>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {getStatusBadge(venta.estado_venta)}
              {venta.estado_venta === "Vencido" && venta.dias_atrasados > 0 && (
                <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-200 dark:border-rose-800">
                  {Math.round(venta.dias_atrasados)}d mora
                </span>
              )}
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                Crédito #{ventaId}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 mb-8">
          {/* Primary action: full width on mobile */}
          <button onClick={handleRegistrarPago} className="w-full md:w-auto md:inline-flex px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2">
            <FiPlus size={16} /> Registrar Abono
          </button>

          {/* Secondary actions: 2-col grid on mobile, inline on desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 md:py-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <FiMessageCircle size={15} /> WhatsApp
            </a>
            {!isWorker && (
              <button onClick={() => router.push(`/dashboard/ventas/${ventaId}/editar`)} className="px-4 py-3 md:py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                <FiEdit size={15} /> Editar
              </button>
            )}
            {!isWorker && venta.estado_venta === "Vencido" && (
              <button onClick={openRenovarModal} className="px-4 py-3 md:py-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
                <FiRefreshCw size={15} /> Renovar
              </button>
            )}
            {!isWorker && (
              <button onClick={() => setShowLossModal(true)} className="px-4 py-3 md:py-3.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
                <FiAlertTriangle size={15} /> Pérdida
              </button>
            )}
            {!isWorker && (
              <button onClick={() => router.push(`/dashboard/ventas/${ventaId}/eliminar`)} className="px-4 py-3 md:py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 dark:text-rose-400 rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                <FiTrash2 size={15} /> Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Resumen Financiero Top Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
          <div className="glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl"><FiDollarSign size={18} className="md:hidden" /><FiDollarSign size={24} className="hidden md:block" /></div>
            </div>
            <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">{formatMoney(venta.valor_venta)}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Venta</p>
          </div>

          <div className="glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="p-2 md:p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl md:rounded-2xl"><FiBarChart2 size={18} className="md:hidden" /><FiBarChart2 size={24} className="hidden md:block" /></div>
            </div>
            <p className="text-xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter mb-1 select-all">{formatMoney(venta.total_abonado)}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Abonado</p>
          </div>

          <div className="glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="p-2 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl"><FiTrendingDown size={18} className="md:hidden" /><FiTrendingDown size={24} className="hidden md:block" /></div>
            </div>
            <p className={`text-xl md:text-3xl font-black tracking-tighter mb-1 select-all ${parseFloat(venta.saldo_actual) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMoney(venta.saldo_actual)}
            </p>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{progresoPago.toFixed(1)}%</p>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(progresoPago, 100)}%` }}
              />
            </div>
          </div>

          <div className="glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl"><FiBarChart2 size={18} className="md:hidden" /><FiBarChart2 size={24} className="hidden md:block" /></div>
            </div>
            <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">{formatMoney(venta.total_a_pagar)}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Recaudar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">

          {/* Main Info Card */}
          <div className="lg:col-span-8 space-y-6 md:space-y-10">
            <div className="glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6 md:mb-10 border-b border-slate-100 dark:border-slate-800 pb-4 md:pb-6">
                <div className="p-2.5 md:p-3 bg-indigo-500 text-white rounded-xl md:rounded-2xl shadow-lg"><FiShield size={20} /></div>
                <h2 className="text-base md:text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Datos del Contrato</h2>
              </div>

              <div className="grid grid-cols-2 gap-y-5 gap-x-4 md:gap-x-12 mb-8 md:mb-12">
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Apertura</p>
                  <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">{venta.fecha_venta}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Estimada Cierre</p>
                  <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">{venta.fecha_vencimiento}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Mora</p>
                  <p className={`text-xs md:text-sm font-black ${venta.dias_atrasados > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {venta.dias_atrasados > 0 ? `${Math.round(venta.dias_atrasados)}d Atraso` : `${Math.round(venta.dias_atrasados) * -1}d Adelantado`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuotas Pagadas</p>
                  <p className="text-xs md:text-sm font-black text-indigo-600">{Math.round(venta.pagos_realizados)} de {venta.cuotas}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Cuota</p>
                  <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">{formatMoney(venta.valor_cuota)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Abono</p>
                  <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">{formatMoney(venta.promedio_pago)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Plazo</p>
                  <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 uppercase">{venta.plazo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Interés</p>
                  <p className="text-xs md:text-sm font-black text-indigo-600">{venta.interes}%</p>
                </div>
                {proyeccionCierre && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyección de Cierre Real</p>
                    <p className="text-xs md:text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <FiCalendar size={13} /> {proyeccionCierre}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progreso de Amortización</p>
                    <h3 className="text-xl md:text-2xl font-black text-indigo-600 tracking-tighter">{progresoPago.toFixed(1)}% Completo</h3>
                  </div>
                  <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{formatMoney(totalAbonado)} / {formatMoney(venta.total_a_pagar)}</p>
                </div>
                <div className="h-3 md:h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-800">
                  <div
                    className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-1000"
                    style={{ width: `${progresoPago}%` }}
                  ></div>
                </div>
              </div>

              {venta.comentario && (
                <div className="mt-6 md:mt-10 pt-4 md:pt-6 border-t border-slate-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Comentarios</p>
                  <p className="text-xs font-bold text-slate-500 italic leading-relaxed">&quot;{venta.comentario}&quot;</p>
                </div>
              )}
            </div>

            {/* Historial de Pagos Section */}
            <div className="glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl">
              <div className="p-5 md:p-8 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl shrink-0"><FiActivity size={18} /></div>
                    <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Historial de Pagos</h2>
                  </div>
                  <button onClick={handleRegistrarPago} className="shrink-0 px-3 md:px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-1.5">
                    <FiPlus size={14} /> <span className="hidden md:inline">Nuevo Registro</span><span className="md:hidden">Nuevo</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FiFilter size={12} className="text-slate-400" />
                  {[
                    { key: "todos", label: "Todos" },
                    { key: "abonos", label: "Abonos" },
                    { key: "fallidas", label: "Fallidas" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFiltro(key)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRecaudos === key ? "bg-slate-900 dark:bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Empty state */}
              {pagosFiltrados.length === 0 && (
                <div className="px-8 py-16 md:py-20 text-center">
                  <FiActivity className="mx-auto text-4xl text-slate-200 mb-4" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin registros de pago</p>
                </div>
              )}

              {/* Desktop: Table */}
              {pagosFiltrados.length > 0 && (
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                        <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Abono</th>
                        {!isWorker && <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {pagosFiltrados.slice((pagosPage - 1) * PAGOS_PER_PAGE, pagosPage * PAGOS_PER_PAGE).map(pago => {
                        const valor = parseFloat(pago.valor_recaudo);
                        const isFallida = valor === 0 && pago.visita_blanco;
                        return (
                          <tr key={pago.id} className={`group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all ${pago.id === lastPagoId ? "bg-emerald-50/40 dark:bg-emerald-900/10" : ""}`}>
                            <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-slate-500">
                              <div className="flex flex-col gap-1">
                                {pago.fecha_recaudo}
                                {pago.id === lastPagoId && (
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md inline-block w-fit border border-emerald-100 dark:border-emerald-800">Último</span>
                                )}
                              </div>
                            </td>
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
                            {!isWorker && (
                              <td className="px-8 py-5 text-center">
                                <div className="flex items-center justify-center gap-3">
                                  {valor > 0 && <button onClick={() => setEditingRecaudo(pago)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-indigo-600 transition-colors"><FiEdit size={14} /></button>}
                                  <button onClick={() => setDeletingRecaudo(pago)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-rose-600 transition-colors"><FiTrash2 size={14} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile: Cards */}
              {pagosFiltrados.length > 0 && (
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {pagosFiltrados.slice((pagosPage - 1) * PAGOS_PER_PAGE, pagosPage * PAGOS_PER_PAGE).map(pago => {
                    const valor = parseFloat(pago.valor_recaudo);
                    const isFallida = valor === 0 && pago.visita_blanco;
                    return (
                      <div
                        key={pago.id}
                        className={`p-4 ${pago.id === lastPagoId ? "bg-emerald-50/40 dark:bg-emerald-900/10 border-l-4 border-emerald-400" : "border-l-4 border-transparent"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{pago.fecha_recaudo}</span>
                              {pago.id === lastPagoId && (
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Último</span>
                              )}
                            </div>
                            {isFallida ? (
                              <div>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Visita Fallida</p>
                                <p className="text-[10px] text-slate-400 italic mt-0.5 leading-snug">{pago.visita_blanco.tipo_falla}: {pago.visita_blanco.comentario}</p>
                              </div>
                            ) : (
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Abono Ordinario</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-base font-black ${valor > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{formatMoney(valor)}</p>
                            {!isWorker && (
                              <div className="flex items-center justify-end gap-1.5 mt-2">
                                {valor > 0 && <button onClick={() => setEditingRecaudo(pago)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg active:text-indigo-600 transition-colors"><FiEdit size={13} /></button>}
                                <button onClick={() => setDeletingRecaudo(pago)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg active:text-rose-600 transition-colors"><FiTrash2 size={13} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paginación */}
              {pagosFiltrados.length > PAGOS_PER_PAGE && (
                <div className="px-5 md:px-8 py-4 md:py-5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-3">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {(pagosPage - 1) * PAGOS_PER_PAGE + 1}–{Math.min(pagosPage * PAGOS_PER_PAGE, pagosFiltrados.length)} de {pagosFiltrados.length}
                  </p>
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => setPagosPage(p => Math.max(1, p - 1))}
                      disabled={pagosPage === 1}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <FiArrowLeft size={14} />
                    </button>
                    {Array.from({ length: Math.ceil(pagosFiltrados.length / PAGOS_PER_PAGE) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPagosPage(i + 1)}
                        className={`w-8 h-8 rounded-xl text-[11px] font-black transition-all ${pagosPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPagosPage(p => Math.min(Math.ceil(pagosFiltrados.length / PAGOS_PER_PAGE), p + 1))}
                      disabled={pagosPage === Math.ceil(pagosFiltrados.length / PAGOS_PER_PAGE)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <FiArrowUpRight size={14} className="rotate-90" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area: Client Snapshot */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shrink-0"><FiUser size={18} /></div>
                  <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">Información del Cliente</h2>
                </div>
                {venta.cliente.estado_cliente === "Activo" ? (
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 shrink-0">Solvente</span>
                ) : (
                  <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800 shrink-0">Bloqueado</span>
                )}
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl">
                  <div className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 rounded-lg shadow-sm shrink-0"><FiUser size={14} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{venta.cliente.identificacion}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl">
                  <div className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 rounded-lg shadow-sm shrink-0"><FiMapPin size={14} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dirección</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 break-words">{venta.cliente.direccion || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl">
                  <div className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 rounded-lg shadow-sm shrink-0"><FiPhone size={14} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{venta.cliente.telefono_principal || "—"}</p>
                  </div>
                </div>
                {venta.cliente.nombre_local && (
                  <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl">
                    <div className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 rounded-lg shadow-sm shrink-0"><FiShield size={14} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Razón Social</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{venta.cliente.nombre_local}</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push(`/dashboard/clientes/${venta.cliente.id}`)}
                className="w-full py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Ver Expediente Completo <FiArrowUpRight size={13} />
              </button>
            </div>

            {!isWorker && (
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 bg-indigo-600 text-white">
                <h3 className="text-base md:text-lg font-black uppercase tracking-tight mb-4">Resumen Financiero</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Capital</span>
                    <span className="text-base font-black">{formatMoney(venta.valor_venta)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Utilidad Bruta</span>
                    <span className="text-base font-black text-emerald-300">+{formatMoney(parseMoney(venta.total_a_pagar) - parseMoney(venta.valor_venta))}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total a Recaudar</span>
                    <span className="text-xl font-black">{formatMoney(venta.total_a_pagar)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// app/dashboard/ventas/[id]/editar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiPercent,
  FiSave,
  FiAlertCircle,
  FiLock,
  FiActivity,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

export default function EditarVentaPage() {
  const router = useRouter();
  const params = useParams();
  const ventaId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    fecha_venta: new Date(),
    valor_venta: "",
    interes: 0,
    cuotas: 0,
    comentario: "",
    cliente: ""
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [hasPagos, setHasPagos] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVenta();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchVenta = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("No se pudieron cargar los datos de la venta");
      const ventaData = await response.json();
      
      const pagosResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${ventaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let pagos = [];
      if (pagosResponse.ok) pagos = await pagosResponse.json();
      setHasPagos(pagos.length > 0);
      
      const fechaVenta = new Date(ventaData.fecha_venta);
      const offset = fechaVenta.getTimezoneOffset() * 60000;
      const fechaVentaLocal = new Date(fechaVenta.getTime() + offset);
      
      setFormData({
        fecha_venta: fechaVentaLocal,
        valor_venta: ventaData.valor_venta,
        interes: ventaData.interes,
        cuotas: ventaData.cuotas,
        comentario: ventaData.comentario || "",
        cliente: ventaData.cliente.id
      });
      
      setClienteSeleccionado(ventaData.cliente);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const calcularTotalAPagar = () => {
    const valorVenta = parseFloat(formData.valor_venta) || 0;
    const interesDecimal = parseFloat(formData.interes) / 100;
    return valorVenta * (1 + interesDecimal);
  };

  const calcularValorCuota = () => {
    const totalAPagar = calcularTotalAPagar();
    return totalAPagar / parseInt(formData.cuotas || 1);
  };

  const adjustDateToUTC = (date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setMinutes(adjustedDate.getMinutes() - adjustedDate.getTimezoneOffset());
    return adjustedDate.toISOString().split('T')[0];
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasPagos) {
      toast.error("Restricción de Integridad: No se permite editar ventas con pagos vinculados.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const ventaData = {
        fecha_venta: adjustDateToUTC(formData.fecha_venta),
        valor_venta: parseFloat(formData.valor_venta),
        interes: parseFloat(formData.interes),
        cuotas: parseInt(formData.cuotas),
        comentario: formData.comentario,
        tienda: selectedStore.tienda.id,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/update/t/${selectedStore.tienda.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Error al actualizar la venta");
      }

      toast.success("¡Contrato actualizado correctamente!");
      router.push(`/dashboard/ventas/${ventaId}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Recuperando parámetros del contrato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Modificar Operación</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Contrato #{ventaId} • <span className="opacity-60">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
        </div>

        {hasPagos && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 mb-6 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                <FiLock size={24} />
             </div>
             <div>
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight mb-1">Bloqueo de Seguridad</h3>
                <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-500/80 leading-relaxed uppercase tracking-widest">
                  Parámetros financieros bloqueados parcialmente debido a recaudos existentes. Solo comentarios editables.
                </p>
             </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
             <FiShield className="text-rose-600 shrink-0" />
             <p className="text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <div className="glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                
                {/* Left Column */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1 text-slate-400">
                       <FiUser size={14} className="text-indigo-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Procedencia</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 relative group">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Titular (Solo Lectura)</p>
                            <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">{clienteSeleccionado?.nombres} {clienteSeleccionado?.apellidos}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{clienteSeleccionado?.identificacion}</p>
                          </div>
                          <FiLock className="text-slate-300" size={14} />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1 text-slate-400">
                       <FiCalendar size={14} className="text-indigo-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Cronología</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha Original</label>
                        <div className={`relative group custom-datepicker ${hasPagos ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          <DatePicker
                            selected={formData.fecha_venta}
                            onChange={(date) => setFormData({ ...formData, fecha_venta: date })}
                            disabled={hasPagos}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            dateFormat="dd 'de' MMMM, yyyy"
                          />
                          <FiCalendar size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observaciones</label>
                        <textarea
                          value={formData.comentario}
                          onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none h-[80px]"
                          placeholder="Condiciones especiales..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8 flex flex-col justify-between">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1 text-slate-400">
                         <FiActivity size={14} className="text-indigo-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Estructura Financiera</span>
                      </div>
                      
                      <div className={`grid grid-cols-1 gap-4 ${hasPagos ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto del Préstamo *</label>
                            <div className="relative group">
                              <FiDollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" size={20} />
                              <input
                                type="number"
                                value={formData.valor_venta}
                                disabled={hasPagos}
                                onChange={(e) => setFormData({ ...formData, valor_venta: e.target.value })}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[18px] font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                              />
                            </div>
                         </div>
                      </div>

                      <div className={`grid grid-cols-2 gap-4 ${hasPagos ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tasa (%)</label>
                            <div className="relative group">
                              <FiPercent className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                              <input
                                type="number"
                                value={formData.interes}
                                disabled={hasPagos}
                                onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                              />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cuotas</label>
                            <div className="relative group">
                              <FiActivity className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                              <input
                                type="number"
                                value={formData.cuotas}
                                disabled={hasPagos}
                                onChange={(e) => setFormData({ ...formData, cuotas: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                              />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-900 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Retorno</p>
                            <p className="text-xl font-black text-emerald-400 tracking-tighter shadow-indigo-100">{formatMoney(calcularTotalAPagar())}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Por Cuota</p>
                            <p className="text-lg font-black text-white tracking-tight">{formatMoney(calcularValorCuota())}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:flex-1 flex items-center justify-center gap-3 py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-50 order-1 md:order-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FiSave size={18} />
                      Sincronizar Cambios
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
                  className="w-full md:w-auto px-8 py-4.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all order-2 md:order-1"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
      
      <style jsx global>{`
        .custom-datepicker .react-datepicker-wrapper { width: 100%; }
        .react-datepicker {
          font-family: inherit;
          border-radius: 2rem;
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          padding: 1.5rem;
          margin-top: 10px;
        }
        .dark .react-datepicker {
           background: #0f172a;
           color: white;
           border-color: #1e293b;
        }
        .react-datepicker__header {
          background: transparent;
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
        }
        .react-datepicker__current-month {
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: #4f46e5;
        }
        .react-datepicker__day--selected {
          background-color: #4f46e5 !important;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
// app/dashboard/gastos/crear/page.js
"use client";

import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiSave,
  FiArrowLeft,
  FiInfo,
  FiActivity,
  FiShield,
  FiArrowDownRight,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "../../../utils/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "../../../utils/format";

export default function CrearGastoPage() {
  const { selectedStore, isAuthenticated, loading: authLoading, user } = useAuth();
  const isWorker = !(user?.is_staff || user?.is_superuser);
  const router = useRouter();
  const [formData, setFormData] = useState({
    tipo_gasto: "",
    fecha: "",
    valor: "",
    comentario: "",
  });
  const [tiposGasto, setTiposGasto] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener tipos de gasto
  useEffect(() => {
    const fetchTiposGasto = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch(`/gastos/tipo/`);

        if (!response.ok) throw new Error("Error al obtener los tipos de gasto");
        const data = await response.json();
        setTiposGasto(Array.isArray(data) ? data : []);

        const today = new Date();
        const formattedDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, fecha: formattedDate }));
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) fetchTiposGasto();
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStore) {
       toast.error("Seleccione una tienda operativa.");
       return;
    }
    setIsSubmitting(true);

    try {
      const response = await apiFetch(`/gastos/create/t/${selectedStore.tienda.id}/`, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Error al crear el egreso.");
      }

      toast.success("Egreso sincronizado en caja.");
      router.push("/dashboard/gastos");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Consultando Categorías Contables</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        
        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/gastos")}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Reporte de Egreso</h1>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mt-1">
              Registro • <span className="opacity-60">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="glass p-6 md:p-12 pb-32 md:pb-12 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Categoría */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiTag className="text-rose-500" size={14} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipificación</span>
                           </div>
                           <div className="relative group">
                              <select
                                name="tipo_gasto"
                                value={formData.tipo_gasto}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all cursor-pointer appearance-none outline-none"
                              >
                                <option value="">Seleccione Categoría</option>
                                {tiposGasto.map((tipo) => (
                                  <option key={tipo.id} value={tipo.id}>{tipo.tipo_gasto}</option>
                                ))}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                 <FiArrowDownRight size={16} />
                              </div>
                           </div>
                        </div>

                        {/* Fecha */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiCalendar className="text-rose-500" size={14} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                           </div>
                           {isWorker ? (
                             <div className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                               <span className="text-[13px] font-black text-slate-800 dark:text-white">{formData.fecha}</span>
                               <FiCalendar className="text-slate-400" size={14} />
                             </div>
                           ) : (
                             <input
                               type="date"
                               name="fecha"
                               value={formData.fecha}
                               onChange={handleChange}
                               required
                               className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white outline-none"
                             />
                           )}
                        </div>

                        {/* Valor */}
                        <div className="md:col-span-2 space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiDollarSign className="text-rose-500" size={14} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</span>
                           </div>
                           <div className="relative group">
                              <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={24} />
                              <input
                                type="number"
                                name="valor"
                                value={formData.valor}
                                onChange={handleChange}
                                required
                                min="0"
                                step="any"
                                placeholder="0.00"
                                className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none"
                              />
                           </div>
                        </div>

                        {/* Comentario */}
                        <div className="md:col-span-2 space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiInfo className="text-rose-500" size={14} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Justificación</span>
                           </div>
                           <textarea
                             name="comentario"
                             value={formData.comentario}
                             onChange={handleChange}
                             rows="2"
                             className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none resize-none"
                             placeholder="Observaciones..."
                           ></textarea>
                        </div>
                     </div>

                     {/* Action Button - Sticky Mobile */}
                     <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto pt-4 md:pt-6">
                        <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-7xl mx-auto">
                          <button
                            type="submit"
                            disabled={isSubmitting || !formData.valor || !formData.tipo_gasto}
                            className="w-full md:w-auto md:px-10 flex items-center justify-center gap-3 py-4.5 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 order-1 md:order-2"
                          >
                            {isSubmitting ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <FiSave size={18} />
                                Sincronizar Egreso
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/gastos")}
                            className="w-full md:w-auto px-8 py-4.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                          >
                            Cancelar
                          </button>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden relative group">
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                         <FiActivity size={24} />
                      </div>
                      <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Audit Saldo</h2>
                   </div>

                   <div className="bg-slate-900 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Proyectado</p>
                      <p className="text-2xl font-black text-rose-500 tracking-tighter">
                         -{formatMoney(formData.valor)}
                      </p>
                   </div>

                   <div className="flex items-start gap-3 opacity-60">
                      <FiShield className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                         Validado bajo protocolos de caja chica. Soportes físicos requeridos.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

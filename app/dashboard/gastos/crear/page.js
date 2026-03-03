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
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function CrearGastoPage() {
  const { token, selectedStore, isAuthenticated, loading: authLoading } = useAuth();
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gastos/tipo/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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

    if (token) fetchTiposGasto();
  }, [token]);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gastos/create/t/${selectedStore.tienda.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
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
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/dashboard/gastos")}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 transition-all shadow-sm group"
            >
              <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Reporte de Egreso</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Generación de Registro • <span className="text-rose-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="glass p-8 md:p-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Categoría */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tipificación Contable *</label>
                           <div className="relative group">
                              <select
                                name="tipo_gasto"
                                value={formData.tipo_gasto}
                                onChange={handleChange}
                                required
                                className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all cursor-pointer appearance-none shadow-inner"
                              >
                                <option value="">Seleccione Categoría</option>
                                {tiposGasto.map((tipo) => (
                                  <option key={tipo.id} value={tipo.id}>{tipo.tipo_gasto}</option>
                                ))}
                              </select>
                              <FiTag size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-rose-500" />
                           </div>
                        </div>

                        {/* Fecha */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fecha de Ejecución *</label>
                           <div className="relative group">
                              <input
                                type="date"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleChange}
                                required
                                className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner"
                              />
                           </div>
                        </div>

                        {/* Valor */}
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Monto de la Transacción *</label>
                           <div className="relative group">
                              <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                              <input
                                type="number"
                                name="valor"
                                value={formData.valor}
                                onChange={handleChange}
                                required
                                min="0"
                                step="any"
                                placeholder="0.00"
                                className="w-full pl-14 pr-6 py-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl text-[24px] font-black text-slate-800 dark:text-white placeholder:text-slate-200 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner"
                              />
                           </div>
                        </div>

                        {/* Comentario */}
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Justificación & Auditoría</label>
                           <textarea
                             name="comentario"
                             value={formData.comentario}
                             onChange={handleChange}
                             rows="4"
                             className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-[15px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner resize-none"
                             placeholder="Describa el motivo o destino del fondo..."
                           ></textarea>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/gastos")}
                          className="w-full md:w-auto px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                        >
                          Cancelar Registro
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full md:w-auto flex items-center justify-center gap-4 px-16 py-5 bg-slate-900 dark:bg-rose-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FiSave size={20} />
                              Sincronizar Egreso
                            </>
                          )}
                        </button>
                     </div>
                  </form>
               </div>
               
               <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px]"></div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden relative group">
                <div className="relative z-10">
                   <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                      <FiActivity size={32} />
                   </div>
                   <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-4 uppercase">Flujo Operativo</h2>
                   <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed uppercase tracking-tighter">
                      Cada egreso registrado impacta directamente en el balance de caja chica. Asegúrese de que el valor coincida con el soporte físico.
                   </p>

                   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 space-y-6">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Saldo Proyectado Impactado</p>
                         <p className="text-2xl font-black text-rose-600 tracking-tighter shadow-rose-100">
                            -{formatMoney(formData.valor)}
                         </p>
                      </div>
                      <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                         <FiShield className="shrink-0" />
                         <p className="text-[9px] font-black uppercase tracking-widest">Verificación de Integridad Activa</p>
                      </div>
                   </div>
                </div>
                <div className="absolute -right-10 top-20 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl"></div>
             </div>

             <div className="px-8 flex items-start gap-4 opacity-50">
                <FiInfo className="text-slate-400 shrink-0 mt-1" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   Los registros de gasto son auditados para la conciliación bancaria mensual. Evite el uso de carácteres especiales en los comentarios.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

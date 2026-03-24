// app/dashboard/gastos/[id]/editar/page.js
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiSave,
  FiArrowLeft,
  FiLock,
  FiActivity,
  FiShield,
  FiInfo,
  FiArrowDownRight,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "../../../../utils/format";

export default function EditarGastoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    tipo_gasto: "",
    fecha: "",
    valor: "",
    comentario: "",
  });
  const [tiposGasto, setTiposGasto] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tipoGastoNombre, setTipoGastoNombre] = useState("");

  // Obtener tipos de gasto y gasto por ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [tiposResponse, gastoResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/gastos/tipo/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/gastos/${id}/`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!tiposResponse.ok) throw new Error("Error al obtener los tipos de gasto");
        if (!gastoResponse.ok) throw new Error("Error al obtener el gasto");
        const tiposData = await tiposResponse.json();
        setTiposGasto(Array.isArray(tiposData) ? tiposData : []);

        const gasto = await gastoResponse.json();
        
        const fecha = gasto.fecha.split("T")[0];
        const tipoNombre = tiposData.find(t => t.id === gasto.tipo_gasto)?.tipo_gasto || "Tipo no encontrado";
        setTipoGastoNombre(tipoNombre);
        
        setFormData({
          tipo_gasto: gasto.tipo_gasto,
          fecha: fecha,
          valor: gasto.valor,
          comentario: gasto.comentario || "",
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && id) fetchData();
  }, [token, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name !== "tipo_gasto") {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStore) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gastos/${id}/update/t/${selectedStore.tienda.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fecha: formData.fecha,
          valor: formData.valor,
          comentario: formData.comentario,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Error al actualizar el gasto.");
      }

      toast.success("Egreso rectificado en caja.");
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
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Recuperando Parámetros del Egreso</p>
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
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Rectificar Operación</h1>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mt-1">
              Egreso • <span className="opacity-60">ID #{id}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="glass p-8 md:p-12 pb-32 md:pb-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Categoría Bloqueada */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1 text-slate-400">
                              <FiTag size={14} className="text-rose-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Tipificación (Inamovible)</span>
                           </div>
                           <div className="relative group opacity-60">
                              <div className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                 {tipoGastoNombre}
                                 <FiLock size={14} className="text-slate-400" />
                              </div>
                           </div>
                        </div>

                        {/* Fecha */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1 text-slate-400">
                              <FiCalendar size={14} className="text-rose-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Fecha Operativa</span>
                           </div>
                           <input
                             type="date"
                             name="fecha"
                             value={formData.fecha}
                             onChange={handleChange}
                             required
                             className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none"
                           />
                        </div>

                        {/* Valor */}
                        <div className="md:col-span-2 space-y-4">
                           <div className="flex items-center gap-2 px-1 text-slate-400">
                              <FiDollarSign size={14} className="text-rose-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Monto Rectificado</span>
                           </div>
                           <div className="relative group">
                              <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none" size={24} />
                              <input
                                type="number"
                                name="valor"
                                value={formData.valor}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="any"
                                onWheel={(e) => e.target.blur()}
                                className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[24px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none"
                              />
                           </div>
                        </div>

                        {/* Comentario */}
                        <div className="md:col-span-2 space-y-4">
                           <div className="flex items-center gap-2 px-1 text-slate-400">
                              <FiInfo size={14} className="text-rose-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Justificación & Auditoría</span>
                           </div>
                           <textarea
                             name="comentario"
                             value={formData.comentario}
                             onChange={handleChange}
                             rows="2"
                             className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none resize-none"
                             placeholder="Describa el motivo del ajuste..."
                           ></textarea>
                        </div>
                     </div>

                     <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t md:border-slate-100 dark:md:border-slate-800 md:p-0 md:backdrop-blur-none md:z-auto md:pt-6">
                        <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-7xl mx-auto">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:flex-1 py-4 bg-slate-900 dark:bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50 order-1 md:order-2"
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <FiSave size={16} />
                                Guardar Ajustes
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/gastos")}
                            className="w-full md:w-auto px-8 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                          >
                            Descartar Cambios
                          </button>
                        </div>
                     </div>
                  </form>
               </div>
               
               <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden relative group">
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                         <FiActivity size={24} />
                      </div>
                      <h2 className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">Estado Operativo</h2>
                   </div>

                   <p className="text-[8px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest opacity-60">
                      La rectificación de montos recalibra el flujo de caja diario. Asegúrese de que el cambio impacte positivamente.
                   </p>

                   <div className="bg-slate-900 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Proyectado</p>
                      <p className="text-2xl font-black text-rose-500 tracking-tighter">
                         -{formatMoney(formData.valor)}
                      </p>
                   </div>
                </div>
                <div className="absolute -right-10 top-20 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// app/dashboard/utilidades/crear/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  FiTrendingUp,
  FiUser,
  FiCalendar,
  FiFileText,
  FiArrowLeft,
  FiSave,
  FiUsers,
  FiDollarSign,
  FiShield,
  FiInfo,
  FiActivity,
  FiArrowUpRight,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function NuevaUtilidadPage() {
  const { selectedStore, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(true);
  const [error, setError] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);

  const [formData, setFormData] = useState({
    trabajador: "",
    fecha: new Date().toISOString().split("T")[0],
    valor: "",
    comentario: "",
  });

  // Obtener lista de trabajadores
  useEffect(() => {
    const fetchTrabajadores = async () => {
      try {
        if (!selectedStore || !token) return;
        setLoadingTrabajadores(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trabajadores/t/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Error al cargar los trabajadores");

        const data = await response.json();
        setTrabajadores(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingTrabajadores(false);
      }
    };

    fetchTrabajadores();
  }, [selectedStore, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trabajador) {
       toast.error("Seleccione un beneficiario.");
       return;
    }
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilidades/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fecha: formData.fecha,
            valor: formData.valor,
            comentario: formData.comentario,
            trabajador: formData.trabajador,
            tienda: selectedStore.tienda.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar distribución.");
      }

      toast.success("Reparto de utilidad sincronizado.");
      router.push("/dashboard/utilidades");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (loadingTrabajadores) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Auditando Nómina de Colaboradores</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        
        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/utilidades")}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-emerald-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Reparto Utilidad</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">
              Giro • <span className="opacity-60">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="glass p-8 md:p-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Trabajador */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiUser className="text-emerald-500" size={14} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiario</span>
                           </div>
                           <div className="relative group">
                              <select
                                name="trabajador"
                                value={formData.trabajador}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer appearance-none outline-none"
                              >
                                <option value="">Seleccione...</option>
                                {trabajadores.map((t) => (
                                  <option key={t.id} value={t.id}>{t.trabajador}</option>
                                ))}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                 <FiArrowUpRight size={16} />
                              </div>
                           </div>
                        </div>

                        {/* Fecha */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiCalendar className="text-emerald-500" size={14} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                           </div>
                           <input
                             type="date"
                             name="fecha"
                             value={formData.fecha}
                             onChange={handleChange}
                             required
                             className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white outline-none"
                           />
                        </div>

                        {/* Valor */}
                        <div className="md:col-span-2 space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiDollarSign className="text-emerald-500" size={14} />
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
                                min="0.01"
                                step="any"
                                placeholder="0.00"
                                className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                              />
                           </div>
                        </div>

                        {/* Comentario */}
                        <div className="md:col-span-2 space-y-4">
                           <div className="flex items-center gap-2 px-1">
                              <FiInfo className="text-emerald-500" size={14} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</span>
                           </div>
                           <textarea
                             name="comentario"
                             value={formData.comentario}
                             onChange={handleChange}
                             rows="2"
                             className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none resize-none"
                             placeholder="Observaciones..."
                           ></textarea>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-6">
                        <button
                          type="submit"
                          disabled={loading || !formData.valor || !formData.trabajador}
                          className="w-full md:flex-1 flex items-center justify-center gap-3 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 order-1 md:order-2"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FiSave size={18} />
                              Sincronizar Giro
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/utilidades")}
                          className="w-full md:w-auto px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all order-2 md:order-1"
                        >
                          Cancelar
                        </button>
                     </div>
                  </form>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden relative group">
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                         <FiActivity size={24} />
                      </div>
                      <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Ejercicio Neto</h2>
                   </div>

                   <div className="bg-slate-900 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga al Ejercicio</p>
                      <p className="text-2xl font-black text-emerald-500 tracking-tighter">
                         {formatMoney(formData.valor)}
                      </p>
                   </div>

                   <div className="flex items-start gap-3 opacity-60">
                      <FiShield className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                         Validado bajo protocolos financieros de cierre.
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

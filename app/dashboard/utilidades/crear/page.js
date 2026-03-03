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
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
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
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/dashboard/utilidades")}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-emerald-600 transition-all shadow-sm group"
            >
              <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Registro de Utilidad</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Giro Operativo • <span className="text-emerald-500">{selectedStore?.tienda?.nombre}</span>
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
                        {/* Trabajador */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Colaborador Beneficiario *</label>
                           <div className="relative group">
                              <select
                                name="trabajador"
                                value={formData.trabajador}
                                onChange={handleChange}
                                required
                                className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer appearance-none shadow-inner"
                              >
                                <option value="">Seleccione Beneficiario</option>
                                {trabajadores.map((t) => (
                                  <option key={t.id} value={t.id}>{t.trabajador} • {t.identificacion}</option>
                                ))}
                              </select>
                              <FiUser size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-emerald-500" />
                           </div>
                        </div>

                        {/* Fecha */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fecha de Reparto *</label>
                           <div className="relative group">
                              <input
                                type="date"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleChange}
                                required
                                className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                              />
                           </div>
                        </div>

                        {/* Valor */}
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Monto a Distribuir *</label>
                           <div className="relative group">
                              <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                              <input
                                type="number"
                                name="valor"
                                value={formData.valor}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="any"
                                placeholder="0.00"
                                className="w-full pl-14 pr-6 py-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl text-[24px] font-black text-slate-800 dark:text-white placeholder:text-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                              />
                           </div>
                        </div>

                        {/* Comentario */}
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Descripción del Giro</label>
                           <textarea
                             name="comentario"
                             value={formData.comentario}
                             onChange={handleChange}
                             rows="4"
                             className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-[15px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner resize-none outline-none"
                             placeholder="¿Por qué o para qué se emite este pago? (Opcional)"
                           ></textarea>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/utilidades")}
                          className="w-full md:w-auto px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                        >
                          Cancelar Reparto
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full md:w-auto flex items-center justify-center gap-4 px-16 py-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FiSave size={20} />
                              Confirmar Giro
                            </>
                          )}
                        </button>
                     </div>
                  </form>
               </div>
               
               <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]"></div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden relative group">
                <div className="relative z-10">
                   <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                      <FiActivity size={32} />
                   </div>
                   <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-4 uppercase">Estado Operativo</h2>
                   <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed uppercase tracking-tighter">
                      Las distribuciones de utilidad son consideradas egresos especiales que impactan la rentabilidad neta de la sucursal.
                   </p>

                   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 space-y-6">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Carga Neta al Ejercicio</p>
                         <p className="text-2xl font-black text-emerald-600 tracking-tighter shadow-emerald-100">
                            {formatMoney(formData.valor)}
                         </p>
                      </div>
                      <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                         <FiShield className="shrink-0" />
                         <p className="text-[9px] font-black uppercase tracking-widest">Protocolo Antifraude Activo</p>
                      </div>
                   </div>
                </div>
                <div className="absolute -right-10 top-20 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
             </div>

             <div className="px-8 flex items-start gap-4 opacity-50">
                <FiInfo className="text-slate-400 shrink-0 mt-1" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   Todo reparto de capital debe estar alineado con los estados financieros del cierre parcial. Verifique sus flujos antes de confirmar.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

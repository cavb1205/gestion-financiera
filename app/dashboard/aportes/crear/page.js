"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiFileText,
  FiArrowLeft,
  FiSave,
  FiUsers,
  FiPackage,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { formatMoney } from "../../../utils/format";
import { apiFetch } from "../../../utils/api";

export default function NuevoAportePage() {
  const { selectedStore, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(true);
  const [error, setError] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);

  const [formData, setFormData] = useState({
    trabajador: "",
    fecha: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    valor: "",
    comentario: "",
  });

  useEffect(() => {
    const fetchTrabajadores = async () => {
      try {
        if (!selectedStore) return;

        const response = await apiFetch(
          `/trabajadores/t/${selectedStore.tienda.id}/`
        );

        if (!response.ok) {
          throw new Error("Error al cargar los trabajadores");
        }

        const data = await response.json();
        const trabajadoresData = Array.isArray(data) ? data : [];
        setTrabajadores(trabajadoresData);
      } catch (err) {
        setError(err.message);
        console.error("Error al obtener trabajadores:", err);
      } finally {
        setLoadingTrabajadores(false);
      }
    };

    fetchTrabajadores();
  }, [selectedStore]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.trabajador) {
        throw new Error("Debe seleccionar un trabajador");
      }

      if (!formData.valor || parseFloat(formData.valor) <= 0) {
        throw new Error("El valor debe ser mayor a cero");
      }

      const response = await apiFetch(
        `/aportes/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
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
        throw new Error(errorData.detail || errorData.message || "Error al crear el aporte");
      }

      toast.success("Inyección de capital registrada correctamente");
      router.push("/dashboard/aportes");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingTrabajadores) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 md:px-0">
        
        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Nueva Inyección</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Registro • <span className="opacity-60">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
             <FiShield className="text-rose-600 shrink-0" />
             <p className="text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="glass p-6 md:p-12 pb-32 md:pb-12 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                       <FiUsers className="text-indigo-500" size={14} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="trabajador" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Inversionista *</label>
                        <div className="relative group">
                          <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 pointer-events-none" />
                          <select
                            id="trabajador"
                            name="trabajador"
                            value={formData.trabajador}
                            onChange={handleChange}
                            className="w-full pl-14 pr-12 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none outline-none"
                            required
                          >
                            <option value="">Seleccionar...</option>
                            {trabajadores.map((trabajador) => (
                              <option key={trabajador.id} value={trabajador.id}>
                                {trabajador.trabajador}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="valor" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto a Inyectar *</label>
                        <div className="relative group">
                          <FiDollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" size={24} />
                          <input
                            id="valor"
                            type="number"
                            name="valor"
                            value={formData.valor}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                       <FiCalendar className="text-indigo-500" size={14} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contexto</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="fecha" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha *</label>
                        <input
                          id="fecha"
                          type="date"
                          name="fecha"
                          value={formData.fecha}
                          onChange={handleChange}
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="comentario" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción</label>
                        <textarea
                          id="comentario"
                          name="comentario"
                          value={formData.comentario}
                          onChange={handleChange}
                          rows={2}
                          placeholder="..."
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button - Sticky Mobile */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto pt-4 md:pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-7xl mx-auto">
                    <button
                      type="submit"
                      disabled={loading || !formData.valor || !formData.trabajador}
                      className="w-full md:w-auto md:px-10 py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-3 order-1 md:order-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FiSave size={18} />
                          Confirmar Inyección
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="w-full md:w-auto px-8 py-4.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl overflow-hidden relative group">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <FiPackage size={24} />
                     </div>
                     <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Impacto</h2>
                  </div>

                  <div className="bg-slate-900 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inyección a Capital</p>
                     <p className="text-2xl font-black text-emerald-500 tracking-tighter shadow-indigo-100">
                        +{formatMoney(formData.valor || 0)}
                     </p>
                  </div>

                  <div className="flex items-start gap-3 opacity-60">
                     <FiInfo size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Este capital se sumará al fondo operativo inmediatamente después de la confirmación.
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
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

export default function NuevoAportePage() {
  const { selectedStore, token, loading: authLoading } = useAuth();
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

  useEffect(() => {
    const fetchTrabajadores = async () => {
      try {
        if (!selectedStore || !token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trabajadores/t/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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
  }, [selectedStore, token]);

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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/aportes/create/t/${selectedStore.tienda.id}/`,
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
        throw new Error(errorData.message || "Error al crear el aporte");
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
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.back()}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Nueva Inyección</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Registro de Capital • <span className="text-indigo-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
             <FiShield className="text-rose-600" />
             <p className="text-rose-700 dark:text-rose-400 text-sm font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Side */}
          <div className="lg:col-span-12">
            <div className="glass p-8 md:p-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {/* Left Column: Origin & Value */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2 px-1">
                       <FiUsers className="text-indigo-500" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Procedencia de Fondos</span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Inversionista / Trabajador *</label>
                        <div className="relative group">
                          <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <select
                            name="trabajador"
                            value={formData.trabajador}
                            onChange={handleChange}
                            className="w-full pl-14 pr-12 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                            required
                          >
                            <option value="">Seleccione el responsable...</option>
                            {trabajadores.map((trabajador) => (
                              <option key={trabajador.id} value={trabajador.id}>
                                {trabajador.trabajador} ({trabajador.identificacion})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                             <FiUsers size={18} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto a Inyectar *</label>
                        <div className="relative group">
                          <FiDollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <input
                            type="number"
                            name="valor"
                            value={formData.valor}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.00"
                            min="0.01"
                            className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Context */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2 px-1">
                       <FiCalendar className="text-indigo-500" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Contexto de Operación</span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Registro *</label>
                        <input
                          type="date"
                          name="fecha"
                          value={formData.fecha}
                          onChange={handleChange}
                          className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción del Movimiento</label>
                        <div className="relative group">
                          <FiFileText className="absolute left-5 top-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <textarea
                            name="comentario"
                            value={formData.comentario}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Justificación del aporte (ej: Fondo para nuevos créditos)"
                            className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-8 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                      <FiPackage size={28} />
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">Impacto en Disponibilidad</h4>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                        Este capital se sumará inmediatamente al fondo operativo de <span className="text-indigo-600 dark:text-indigo-400">{selectedStore?.tienda?.nombre}</span>. 
                        
                      </p>
                   </div>
                   <div className="shrink-0 flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6 hidden md:flex">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Caja Referencia</p>
                         <p className="text-sm font-black text-indigo-600">ID #{selectedStore?.tienda?.id}</p>
                      </div>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full md:w-auto px-10 py-4.5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Descartar Registro
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-4.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FiSave size={20} />
                        Confirmar Inyección
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Guidelines Sidebar (Optional, but helps aesthetic) */}
          <div className="lg:col-span-12 mt-4">
             <div className="flex items-center gap-4 bg-white/40 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-white/60 dark:border-slate-800">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                   <FiInfo size={20} />
                </div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight">
                   El sistema registrará automáticamente al usuario <span className="text-indigo-500">{formData.trabajador ? trabajadores.find(t => t.id == formData.trabajador)?.trabajador : '...'}</span> como responsable del aporte.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
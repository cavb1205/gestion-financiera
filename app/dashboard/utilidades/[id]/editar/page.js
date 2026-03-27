// app/dashboard/utilidades/[id]/editar/page.js
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiCalendar,
  FiSave,
  FiArrowLeft,
  FiUser,
  FiActivity,
  FiInfo,
  FiLock,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "../../../../utils/format";
import { apiFetch } from "../../../../utils/api";

export default function EditarUtilidadPage() {
  const { id } = useParams();
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [utilidad, setUtilidad] = useState(null);
  const [formData, setFormData] = useState({ fecha: "", valor: "", comentario: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("utilidadEditar");
    if (!stored) {
      toast.error("No se encontraron datos de la utilidad.");
      router.push("/dashboard/utilidades");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUtilidad(parsed);
      setFormData({
        fecha: parsed.fecha?.split("T")[0] || parsed.fecha || "",
        valor: parsed.valor || "",
        comentario: parsed.comentario || "",
      });
    } catch {
      toast.error("Error al leer los datos.");
      router.push("/dashboard/utilidades");
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStore) return;
    setIsSubmitting(true);
    try {
      const response = await apiFetch(
        `/utilidades/${id}/update/t/${selectedStore.tienda.id}/`,
        {
          method: "PUT",
          body: JSON.stringify({
            fecha: formData.fecha,
            valor: formData.valor,
            comentario: formData.comentario,
            trabajador: utilidad.trabajador.id,
            tienda: selectedStore.tienda.id,
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || err.message || "Error al actualizar la utilidad.");
      }
      localStorage.removeItem("utilidadEditar");
      toast.success("Utilidad actualizada correctamente.");
      router.push("/dashboard/utilidades");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (!utilidad) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-0">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/utilidades")}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-emerald-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Ajustar Utilidad</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">
              Rectificación • <span className="opacity-60">{utilidad.trabajador.trabajador}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-8">
            <div className="glass p-8 md:p-12 pb-32 md:pb-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Beneficiario — bloqueado */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <FiUser size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiario (Inamovible)</span>
                      </div>
                      <div className="opacity-60">
                        <div className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          {utilidad.trabajador.trabajador}
                          <FiLock size={14} className="text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <FiCalendar size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Operativa</span>
                      </div>
                      <input
                        type="date"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                      />
                    </div>

                    {/* Valor */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <FiDollarSign size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Rectificado</span>
                      </div>
                      <div className="relative group">
                        <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" size={24} />
                        <input
                          type="number"
                          name="valor"
                          value={formData.valor}
                          onChange={handleChange}
                          required
                          min="0.01"
                          step="any"
                          onWheel={(e) => e.target.blur()}
                          className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[24px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Comentario */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <FiInfo size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto & Auditoría</span>
                      </div>
                      <textarea
                        name="comentario"
                        value={formData.comentario}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Motivo del ajuste..."
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none resize-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Sticky action bar (mobile) / inline (desktop) */}
                  <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto">
                    <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-7xl mx-auto">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:flex-1 py-4.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50 order-1 md:order-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><FiSave size={16} />Guardar Ajuste</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/utilidades")}
                        className="w-full md:w-auto px-8 py-4.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden relative">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <FiActivity size={24} />
                  </div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Ejercicio Neto</h2>
                </div>
                <div className="bg-slate-900 dark:bg-slate-800/50 rounded-2xl p-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevo Monto</p>
                  <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                    {formatMoney(formData.valor)}
                  </p>
                </div>
                <div className="flex items-start gap-3 opacity-60">
                  <FiInfo size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    El ajuste recalibra el ejercicio financiero. Verifique el monto antes de confirmar.
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

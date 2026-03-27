// app/components/recaudos/EditarRecaudo.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { FiEdit, FiDollarSign, FiCalendar, FiX, FiCheck } from "react-icons/fi";
import { apiFetch } from "../../utils/api";

export default function EditarRecaudo({ editingRecaudo, onEditar, onClose }) {
  const [isSaving, setIsSaving] = useState(false);
  const { selectedStore } = useAuth();
  const [formData, setFormData] = useState({
    fecha_recaudo: "",
    valor_recaudo: "",
  });

  useEffect(() => {
    if (editingRecaudo) {
      setFormData({
        fecha_recaudo: editingRecaudo.fecha_recaudo,
        valor_recaudo: editingRecaudo.valor_recaudo,
      });
    }
  }, [editingRecaudo]);

  const handleSaveEdit = async () => {
    if (!formData.valor_recaudo || formData.valor_recaudo < 0) {
      toast.error("El valor del recaudo no es válido.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch(
        `/recaudos/${editingRecaudo.id}/update/t/${selectedStore.tienda.id}/`,
        {
          method: "PUT",
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Error al actualizar el recaudo");
      }

      const updatedRecaudo = await response.json();
      onEditar(updatedRecaudo);
    } catch (error) {
      console.error("Error updating recaudo:", error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editingRecaudo) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="glass max-w-md w-full rounded-[2.5rem] border-white/20 overflow-hidden shadow-2xl relative">
        {/* Header Decorator */}
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
        
        <div className="p-10">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
               <FiEdit size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Editar Recaudo</h2>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Ajuste de Auditoría</p>
            </div>
            <button 
              onClick={onClose}
              className="ml-auto p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="space-y-8">
             <div className="space-y-3">
                <label htmlFor="fecha-recaudo" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fecha del Recaudo</label>
                <div className="relative group">
                   <FiCalendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                   <input
                      id="fecha-recaudo"
                      type="date"
                      value={formData.fecha_recaudo}
                      onChange={(e) => setFormData({ ...formData, fecha_recaudo: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                   />
                </div>
             </div>

             <div className="space-y-3">
                <label htmlFor="monto-recaudo" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Monto Actualizado</label>
                <div className="relative group">
                   <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 group-focus-within:scale-110 transition-transform" />
                   <input
                      id="monto-recaudo"
                      type="number"
                      value={formData.valor_recaudo}
                      onChange={(e) => setFormData({ ...formData, valor_recaudo: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                      placeholder="0"
                      min="0"
                   />
                </div>
             </div>

             <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm rounded-xl flex items-center justify-center shrink-0">
                   <FiCalendar className="text-amber-500" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">Nota de Auditoría</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                      La modificación de un recaudo afectará los reportes diarios y el saldo de la caja central.
                   </p>
                </div>
             </div>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <button 
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sincronizando...
                </>
              ) : (
                <>
                  <FiCheck size={18} />
                  Guardar Cambios
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Descartar Ajustes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

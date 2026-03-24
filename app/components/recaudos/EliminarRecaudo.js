// app/components/recaudos/EliminarRecaudo.js
"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import { FiTrash2, FiAlertCircle, FiX, FiCheck, FiUser, FiDollarSign } from "react-icons/fi";
import { formatMoney } from "../../utils/format";

export default function EliminarRecaudo({ deletingRecaudo, onEliminar, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();
  
  if (!deletingRecaudo) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/${deletingRecaudo.id}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el recaudo");
      }

      onEliminar();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="glass max-w-md w-full rounded-[2.5rem] border-white/20 overflow-hidden shadow-2xl relative">
        {/* Header Decorator */}
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
        
        <div className="p-10 text-center">
          <div className="w-24 h-24 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-rose-200">
             <FiAlertCircle size={48} />
          </div>

          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-4 uppercase">¿Anular Recaudo?</h2>
          <p className="text-sm font-bold text-slate-400 mb-10 leading-relaxed uppercase tracking-tighter mx-auto max-w-xs">
             Esta acción es irreversible y eliminará el registro de la auditoría de caja.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-10 space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm rounded-xl flex items-center justify-center">
                   <FiUser className="text-indigo-500" />
                </div>
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Cliente Impactado</p>
                   <p className="text-xs font-black text-slate-800 dark:text-white uppercase">
                      {deletingRecaudo.venta?.cliente?.nombres} {deletingRecaudo.venta?.cliente?.apellidos}
                   </p>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm rounded-xl flex items-center justify-center">
                   <FiDollarSign className="text-emerald-500" />
                </div>
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Monto a Reversar</p>
                   <p className="text-xs font-black text-rose-600">
                      {formatMoney(deletingRecaudo.valor_recaudo)}
                   </p>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <FiTrash2 size={18} />
                  Confirmar Anulación
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Mantener Registro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// app/components/utilidades/EliminarUtilidad.js
import { FiAlertCircle, FiX, FiCheck, FiShield } from "react-icons/fi";
import { formatMoney } from "../../utils/format";

export default function EliminarUtilidad({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Anular Distribución",
  cancelText = "Descartar",
  isLoading = false,
  utilidad = null // Datos adicionales para el resumen
}) {
  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
      <div className="glass max-w-md w-full rounded-[2.5rem] border-white/20 p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          {/* Header Icon */}
          <div className="text-center">
            <div className="w-24 h-24 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-rose-200/50 animate-bounce-subtle">
              <FiAlertCircle size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-4 uppercase">
              {title || "¿Anular Utilidad?"}
            </h2>
            <p className="text-sm font-bold text-slate-400 mb-10 leading-relaxed uppercase tracking-tighter">
              {message || "Esta acción reversará el pago al colaborador y reajustará el balance operativo global."}
            </p>
          </div>

          {/* Impact Summary Section */}
          {utilidad && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-10 shadow-inner">
               <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Beneficiario</span>
                     <span className="text-xs font-black text-slate-800 dark:text-white uppercase truncate ml-4">
                        {utilidad.trabajador.trabajador}
                     </span>
                  </div>
                  <div className="flex justify-between items-center px-1 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Monto Reclamable</span>
                     <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {formatMoney(utilidad.valor)}
                     </span>
                  </div>
               </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sincronizando Anulación...
                </>
              ) : (
                <>
                  <FiAlertCircle size={18} />
                  {confirmText}
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {cancelText}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
             <FiShield size={12} className="text-slate-400" />
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Proceso de Borrado Seguro Activo</p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
// app/components/ConfirmModal.js
import { FiAlertCircle, FiX } from "react-icons/fi";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Confirmar acción?",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="glass max-w-md w-full rounded-[2.5rem] border-white/20 p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute -top-4 -right-4 p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>

          {/* Icon & Title */}
          <div className="text-center">
            <div className="w-20 h-20 bg-rose-500 text-white rounded-[1.75rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-200/50 dark:shadow-none">
              <FiAlertCircle size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              {title}
            </h2>
            {message && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {message}
              </p>
            )}
          </div>

          {/* Optional custom content */}
          {children && <div className="mb-8">{children}</div>}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// app/components/ConfirmModal.js
import { FiAlertTriangle, FiX, FiCheck } from "react-icons/fi";

export default function EliminarUtilidad({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <FiAlertTriangle className="text-red-600 text-xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 text-base">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <FiCheck className="mr-2" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
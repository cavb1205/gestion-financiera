"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";

export default function EliminarRecaudo({ deletingRecaudo, onEliminar, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();
  

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingRecaudo) return;
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
      toast.success("Recaudo eliminado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Eliminar Recaudo
        </h2>
        <p className="mb-6 text-gray-600">
          ¿Estás seguro de eliminar este recaudo? Esta acción no se puede
          deshacer.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <FiTrash2 className="text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-500">
                {deletingRecaudo.venta?.cliente?.nombres}{" "}
                {deletingRecaudo.venta?.cliente?.apellidos}
              </p>
              <p className="text-sm text-gray-500">
                Valor: {deletingRecaudo.valor_recaudo.toLocaleString("")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
          >
            {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

export default function EditarRecaudo({ editingRecaudo, onEditar, onClose }) {
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useAuth();
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
    setIsSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/${editingRecaudo.id}/update/t/${selectedStore.tienda.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el recaudo");
      }

      const updatedRecaudo = await response.json();
      toast.success("Recaudo actualizado correctamente");
      onEditar(updatedRecaudo);
      onClose();
    } catch (error) {
      console.error("Error updating recaudo:", error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-blue-600">
          Editar Recaudo
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <input
            type="date"
            value={formData.fecha_recaudo}
            onChange={(e) =>
              setFormData({
                ...formData,
                fecha_recaudo: e.target.value,
              })
            }
            className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor
          </label>
          <input
            type="number"
            value={formData.valor_recaudo}
            onChange={(e) =>
              setFormData({
                ...formData,
                valor_recaudo: e.target.value,
              })
            }
            className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
            min="0"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// app/dashboard/gastos/[id]/editar/page.js
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiSave,
  FiArrowLeft,
  FiLock
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

export default function EditarGastoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, selectedStore } = useAuth();
  const [formData, setFormData] = useState({
    tipo_gasto: "",
    fecha: "",
    valor: "",
    comentario: "",
  });
  const [tiposGasto, setTiposGasto] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tipoGastoNombre, setTipoGastoNombre] = useState("");

  // Obtener tipos de gasto
  useEffect(() => {
    const fetchTiposGasto = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/gastos/tipo/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los tipos de gasto");
        }

        const data = await response.json();
        setTiposGasto(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      }
    };

    if (token) {
      fetchTiposGasto();
    }
  }, [token]);

  // Obtener gasto por ID
  useEffect(() => {
    const fetchGasto = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/gastos/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener el gasto");
        }

        const gasto = await response.json();
        const fecha = gasto.fecha.split("T")[0];
        
        // Obtener el nombre del tipo de gasto
        const tipoNombre = tiposGasto.find(t => t.id === gasto.tipo_gasto)?.tipo_gasto || "Tipo no encontrado";
        setTipoGastoNombre(tipoNombre);
        
        setFormData({
          tipo_gasto: gasto.tipo_gasto, // Mantenemos el ID para referencia
          fecha: fecha,
          valor: gasto.valor,
          comentario: gasto.comentario || "",
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchGasto();
    }
  }, [token, id, tiposGasto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Solo permitir cambios en campos editables
    if (name !== "tipo_gasto") {
      let parsedValue = value;
      
      if (name === "valor") {
        parsedValue = parseFloat(value);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gastos/${id}/update/t/${selectedStore.tienda.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            // No enviamos tipo_gasto ya que la API no lo permite actualizar
            fecha: formData.fecha,
            valor: formData.valor,
            comentario: formData.comentario,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error detallado del backend:", errorData);
        throw new Error(
          errorData.detail ||
          errorData.message ||
          "Error al actualizar el gasto. Por favor, intente de nuevo."
        );
      }

      toast.success("Gasto actualizado exitosamente");
      router.push("/dashboard/gastos");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/gastos")}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="mr-2" /> Volver a Gastos
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Editar Gasto
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 text-gray-500">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Gasto
              </label>
              <div className="relative">
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 flex items-center">
                  <span className="text-gray-700">{tipoGastoNombre}</span>
                  <FiLock className="ml-auto text-gray-400" />
                </div>
                <FiTag className="absolute right-3 top-3.5 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                El tipo de gasto no se puede modificar
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <FiDollarSign className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario
              </label>
              <div className="relative">
                <textarea
                  name="comentario"
                  value={formData.comentario}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descripción del gasto"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push("/dashboard/gastos")}
                className="mr-3 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Actualizar Gasto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
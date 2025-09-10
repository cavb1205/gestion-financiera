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
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";

export default function NuevoAportePage() {
  const { selectedStore, token } = useAuth();
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

  // Obtener lista de trabajadores
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
      // Validaciones
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
            comentario: formData.commentario,
            trabajador: formData.trabajador,
            tienda: selectedStore.tienda.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el aporte");
      }

      // Redirigir a la lista de aportes con mensaje de éxito
      toast.success("Aporte creado correctamente");
      router.push("/dashboard/aportes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingTrabajadores) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Link
              href="/dashboard/aportes"
              className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4 font-medium"
            >
              <FiArrowLeft className="mr-1" />
              Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Aporte</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando trabajadores...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard/aportes"
            className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4 font-medium"
          >
            <FiArrowLeft className="mr-1" />
            Volver a Aportes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Aporte</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Trabajador */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Trabajador *
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
                <select
                  name="trabajador"
                  value={formData.trabajador}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 appearance-none text-base"
                  required
                >
                  <option value="">Seleccione un trabajador</option>
                  {trabajadores.map((trabajador) => (
                    <option key={trabajador.id} value={trabajador.id}>
                      {trabajador.trabajador} - {trabajador.identificacion}
                    </option>
                  ))}
                </select>
                <FiUsers className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg pointer-events-none" />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {trabajadores.length} trabajadores disponibles
              </p>
            </div>

            {/* Campo Fecha */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Fecha *
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 text-base"
                  required
                />
              </div>
            </div>

            {/* Campo Valor */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Valor *
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
                <input
                  type="number"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 text-base"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            {/* Campo Comentario */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Comentario
              </label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-3 text-gray-500 text-lg" />
                <textarea
                  name="comentario"
                  value={formData.comentario}
                  onChange={handleChange}
                  rows={4}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 text-base"
                  placeholder="Descripción del aporte (opcional)"
                />
              </div>
            </div>

            {/* Información de la tienda (solo visual) */}
            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
              <h3 className="text-base font-semibold text-indigo-800 mb-3">
                Información de la Tienda
              </h3>
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <p className="text-indigo-600">Tienda:</p>
                  <p className="font-medium text-indigo-800">{selectedStore?.tienda?.nombre}</p>
                </div>
                <div>
                  <p className="text-indigo-600">ID:</p>
                  <p className="font-medium text-indigo-800">{selectedStore?.tienda?.id}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full bg-indigo-600 text-white px-4 py-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold shadow-md"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiSave className="mr-2 text-lg" />
                    Crear Aporte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-blue-800 mb-3">
            Información importante
          </h3>
          <ul className="text-base text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-800 mr-2">•</span>
              Los campos marcados con <span className="font-semibold mx-1">*</span> son obligatorios
            </li>
            <li className="flex items-start">
              <span className="text-blue-800 mr-2">•</span>
              El valor del aporte debe ser mayor a cero
            </li>
            <li className="flex items-start">
              <span className="text-blue-800 mr-2">•</span>
              La fecha por defecto es la actual, pero puede modificarla
            </li>
            <li className="flex items-start">
              <span className="text-blue-800 mr-2">•</span>
              El aporte se asociará automáticamente a esta tienda
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
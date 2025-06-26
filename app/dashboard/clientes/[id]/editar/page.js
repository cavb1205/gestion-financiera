// app/dashboard/clientes/[id]/editar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiUser,
  FiHome,
  FiPhone,
  FiArrowLeft,
  FiSave,
  FiCheck,
  FiX,
  FiMapPin,
  FiShield,
  FiEdit,
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import LoadingSpinner from "../../../../components/LoadingSpinner";

export default function EditarCliente() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    identificacion: "",
    nombres: "",
    apellidos: "",
    nombre_local: "",
    telefono_principal: "",
    telefono_opcional: "",
    direccion: "",
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clienteData, setClienteData] = useState(null);

  // Cargar datos del cliente al montar el componente
  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchClienteData();
    }
  }, [loading, isAuthenticated, selectedStore]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchClienteData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la información del cliente");
      }

      const data = await response.json();
      setClienteData(data);
      
      // Llenar el formulario con los datos del cliente
      setFormData({
        identificacion: data.identificacion || "",
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        nombre_local: data.nombre_local || "",
        telefono_principal: data.telefono_principal || "",
        telefono_opcional: data.telefono_opcional || "",
        direccion: data.direccion || "",
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching client data:", error);
      setSubmitError(error.message);
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (submitError) setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "identificacion",
      "nombres",
      "apellidos",
      "telefono_principal",
      "direccion",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = "Este campo es obligatorio";
      }
    });

    // Validación adicional para teléfono
    if (
      formData.telefono_principal &&
      !/^(\+\d{1,3})?\s?\d{6,15}$/.test(formData.telefono_principal)
    ) {
      newErrors.telefono_principal = "Teléfono no válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/update/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            tienda: selectedStore.tienda.id, // Asegurarse de enviar la tienda correcta
          }),
        }
      );

      if (!response.ok) {
        // Manejo mejorado de errores del backend
        const errorData = await response.json();
        
        // Mapear errores del backend a campos específicos
        const backendErrors = {};
        Object.keys(errorData).forEach((field) => {
          backendErrors[field] = Array.isArray(errorData[field])
            ? errorData[field].join(", ")
            : errorData[field];
        });

        setErrors(backendErrors);
        throw new Error("Error en la validación del servidor");
      }

      // Éxito
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/clientes"), 1500);
    } catch (err) {
      setSubmitError(err.message || "Error al actualizar el cliente");
      console.error("Error updating client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 text-gray-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/clientes")}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Volver a clientes
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <FiUser className="text-white text-xl" />
              </div>
              <h1 className="ml-4 text-2xl font-bold text-white">
                Editar Cliente
              </h1>
            </div>
            <p className="mt-2 text-indigo-100">
              Actualiza la información del cliente en {selectedStore.tienda.nombre}
            </p>
          </div>

          <div className="p-6">
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-700">
                  <FiX className="mr-2 flex-shrink-0" />
                  <p>{submitError}</p>
                </div>
              </div>
            )}

            {success ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <FiCheck className="text-green-600 text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Cliente actualizado con éxito!
                </h2>
                <p className="text-gray-600">
                  Redirigiendo a la lista de clientes...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-500">
                  {/* Columna izquierda */}
                  <div>
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Identificación <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="identificacion"
                          value={formData.identificacion}
                          onChange={handleChange}
                          placeholder="Ej: 13.386.262-5"
                          className={`w-full px-4 py-2 border  ${
                            errors.identificacion
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 `}
                        />
                        {errors.identificacion && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.identificacion}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombres <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="nombres"
                          value={formData.nombres}
                          onChange={handleChange}
                          placeholder="Ej: Juan Carlos"
                          className={`w-full px-4 py-2 border ${
                            errors.nombres
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                        {errors.nombres && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.nombres}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellidos <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleChange}
                          placeholder="Ej: Pérez López"
                          className={`w-full px-4 py-2 border ${
                            errors.apellidos
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                        {errors.apellidos && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.apellidos}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna derecha */}
                  <div>
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Negocio
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                        <div className="pl-4 text-gray-400">
                          <FiHome />
                        </div>
                        <input
                          type="text"
                          name="nombre_local"
                          value={formData.nombre_local}
                          onChange={handleChange}
                          placeholder="Ej: Tienda El Buen Precio"
                          className="w-full px-4 py-2 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Principal{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                        <div className="pl-4 text-gray-400">
                          <FiPhone />
                        </div>
                        <input
                          type="tel"
                          name="telefono_principal"
                          value={formData.telefono_principal}
                          onChange={handleChange}
                          placeholder="Ej: +56912345678"
                          className={`w-full px-4 py-2 focus:outline-none ${
                            errors.telefono_principal ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.telefono_principal && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.telefono_principal}
                        </p>
                      )}
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Opcional
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                        <div className="pl-4 text-gray-400">
                          <FiPhone />
                        </div>
                        <input
                          type="tel"
                          name="telefono_opcional"
                          value={formData.telefono_opcional}
                          onChange={handleChange}
                          placeholder="Ej: +56223456789"
                          className={`w-full px-4 py-2 focus:outline-none ${
                            errors.telefono_opcional ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.telefono_opcional && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.telefono_opcional}
                        </p>
                      )}
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                        <div className="pl-4 text-gray-400">
                          <FiMapPin />
                        </div>
                        <input
                          type="text"
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleChange}
                          placeholder="Ej: Av. Principal 1234"
                          className={`w-full px-4 py-2 focus:outline-none ${
                            errors.direccion ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.direccion && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.direccion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/clientes")}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-3 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Actualizar Cliente
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Información de tienda */}
        <div className="mt-6 bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-indigo-100 p-3 rounded-full">
            <FiShield className="text-indigo-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Tienda actual</p>
            <p className="font-medium">{selectedStore.tienda.nombre}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
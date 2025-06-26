// app/dashboard/clientes/[id]/eliminar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  FiTrash2, 
  FiX, 
  FiCheck, 
  FiArrowLeft,
  FiUser,
  FiAlertTriangle,
  FiCreditCard
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import LoadingSpinner from "../../../../components/LoadingSpinner";

export default function EliminarCliente() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  
  const [cliente, setCliente] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSales, setHasActiveSales] = useState(false);

  // Cargar datos del cliente
  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchCliente();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchCliente = async () => {
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
      setCliente(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching client:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError("");
    setHasActiveSales(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Manejar respuesta exitosa (204 No Content)
      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/clientes"), 1500);
        return;
      }

      // Manejar respuesta con error
      const responseData = await response.json();
      
      // Caso específico: cliente con ventas activas
      if (responseData.message === "No se puede eliminar el cliente ya que tiene ventas activas") {
        setHasActiveSales(true);
        setError("El cliente no puede ser eliminado porque tiene ventas activas");
        return;
      }

      // Otros errores
      setError(responseData.message || "Error al eliminar el cliente");
    } catch (err) {
      setError("Error de conexión al intentar eliminar el cliente");
      console.error("Error deleting client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore || isLoading) {
    return <LoadingSpinner />;
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <button 
            onClick={() => router.push("/dashboard/clientes")}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Volver a clientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/clientes/${clienteId}`)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Volver al cliente
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-red-200">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <FiTrash2 className="text-white text-xl" />
              </div>
              <h1 className="ml-4 text-2xl font-bold text-white">
                Eliminar Cliente
              </h1>
            </div>
            <p className="mt-2 text-red-100">
              ¿Estás seguro de que deseas eliminar este cliente de forma permanente?
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-700">
                  <FiX className="mr-2 flex-shrink-0" />
                  <div>
                    <p>{error}</p>
                    
                    {/* Mostrar acciones adicionales cuando hay ventas activas */}
                    {hasActiveSales && (
                      <div className="mt-3 bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-700 mb-2">
                          Para eliminar este cliente, primero debes:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                          <li>Cancelar todas las ventas activas asociadas</li>
                          <li>Liquidar los créditos pendientes</li>
                          <li>Marcar las ventas como completadas o perdidas</li>
                        </ul>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/ventas?cliente=${clienteId}`}
                            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            <FiCreditCard className="mr-2" />
                            Ver ventas del cliente
                          </Link>
                          <button
                            onClick={() => router.push(`/dashboard/clientes/${clienteId}`)}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Ver detalles del cliente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <FiCheck className="text-green-600 text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Cliente eliminado con éxito!
                </h2>
                <p className="text-gray-600">
                  Redirigiendo a la lista de clientes...
                </p>
              </div>
            ) : (
              <div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        <span className="font-bold">¡Atención!</span> Esta acción es irreversible. 
                        Toda la información del cliente, incluyendo sus créditos y pagos, 
                        será eliminada permanentemente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FiUser className="mr-2 text-indigo-600" />
                    Información del cliente
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre completo</p>
                      <p className="font-medium">{cliente.nombres} {cliente.apellidos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Identificación</p>
                      <p className="font-medium">{cliente.identificacion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono principal</p>
                      <p className="font-medium">{cliente.telefono_principal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nombre del negocio</p>
                      <p className="font-medium">{cliente.nombre_local || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-medium">{cliente.direccion || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {!hasActiveSales && (
                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/clientes/${clienteId}`)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center"
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
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <FiTrash2 className="mr-2" />
                          Sí, eliminar definitivamente
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-indigo-100 p-3 rounded-full">
            <FiUser className="text-indigo-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Cliente a eliminar</p>
            <p className="font-medium">{cliente.nombres} {cliente.apellidos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
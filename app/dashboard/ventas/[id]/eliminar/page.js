// app/dashboard/ventas/[id]/eliminar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiAlertTriangle,
  FiLock,
  FiXCircle
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { toast } from "react-toastify";

export default function EliminarVentaPage() {
  const router = useRouter();
  const params = useParams();
  const ventaId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [ventaData, setVentaData] = useState(null);
  const [hasPagos, setHasPagos] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVenta();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchVenta = async () => {
    try {
      setIsLoading(true);
      
      // Obtener venta por ID
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los datos de la venta");
      }

      const venta = await response.json();
      
      // Verificar si tiene pagos
      const pagosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${ventaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let pagos = [];
      if (pagosResponse.ok) {
        pagos = await pagosResponse.json();
      }

      const tienePagos = pagos.length > 0;
      setHasPagos(tienePagos);
      setVentaData(venta);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching venta:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStore || !selectedStore.id) {
      toast.error("No se ha seleccionado una tienda");
      return;
    }
    
    if (hasPagos) {
      toast.error("No se puede eliminar una venta con pagos registrados");
      return;
    }
    
    setIsDeleting(true);
    setError("");
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/delete/t/${selectedStore.tienda.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error deleting sale:", errorData);
        throw new Error(errorData.detail || errorData.message || "Error al eliminar la venta");
      }
      if (response.status === 204) {
        console.log("Venta eliminada exitosamente");
      }

      toast.success("Venta eliminada exitosamente!");
      router.push("/dashboard/ventas");
      
    } catch (err) {
      console.error("Error deleting sale:", err);
      setError(err.message || "Error al eliminar la venta");
      toast.error(err.message || "Error al eliminar la venta");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-800">Cargando datos de la venta...</p>
      </div>
    );
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Calcular total a pagar
  const calcularTotalAPagar = () => {
    if (!ventaData) return 0;
    const valorVenta = parseFloat(ventaData.valor_venta) || 0;
    const interesDecimal = parseFloat(ventaData.interes) / 100;
    return valorVenta * (1 + interesDecimal);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
            className="flex items-center text-indigo-800 hover:text-indigo-900 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Volver a detalle de venta
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiTrash2 className="mr-2 text-red-700" />
            Eliminar Venta a Crédito #{ventaId}
          </h1>
          <p className="text-gray-800 mt-2">
            Esta acción eliminará permanentemente esta venta a crédito y todos sus datos asociados
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-700 mr-2" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Confirmar Eliminación</h2>
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertTriangle className="text-red-700 text-2xl" />
            </div>
          </div>

          {hasPagos ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <FiLock className="text-yellow-600 mr-3 text-xl mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 text-lg mb-2">Eliminación restringida</h3>
                  <p className="text-yellow-800 mb-3">
                    Esta venta no puede ser eliminada porque tiene pagos registrados asociados.
                  </p>
                  <p className="text-yellow-800">
                    Para eliminar esta venta, primero debe eliminar todos los pagos asociados.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <FiAlertTriangle className="text-red-700 mr-3 text-xl mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 text-lg mb-2">¿Estás seguro que deseas eliminar esta venta?</h3>
                  <p className="text-red-800">
                    Esta acción es irreversible. Todos los datos asociados a esta venta serán eliminados permanentemente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resumen de la Venta */}
          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2 text-indigo-700" />
              Resumen de la Venta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 mb-1">Cliente</p>
                  <p className="font-medium text-gray-900">
                    {ventaData?.cliente?.nombres} {ventaData?.cliente?.apellidos}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-700 mb-1">Fecha de venta</p>
                  <p className="font-medium text-gray-900">
                    <FiCalendar className="inline mr-2 text-gray-600" />
                    {ventaData ? formatDate(ventaData.fecha_venta) : "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 mb-1">Valor de venta</p>
                  <p className="font-medium text-gray-900">
                    <FiDollarSign className="inline mr-2 text-gray-600" />
                    ${ventaData?.valor_venta?.toLocaleString("es-CL") || "0"}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-700 mb-1">Total a pagar</p>
                  <p className="font-medium text-gray-900">
                    <FiDollarSign className="inline mr-2 text-gray-600" />
                    ${calcularTotalAPagar().toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
            
            {ventaData?.comentario && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-1">Comentarios</p>
                <p className="text-gray-900 italic">{ventaData.comentario}</p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
              className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleDelete}
              className={`px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 font-medium flex items-center ${
                hasPagos ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isDeleting || hasPagos}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <FiTrash2 className="mr-2" />
                  Eliminar Venta
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <FiXCircle className="text-red-700 mr-3 text-xl" />
            <div>
              <h3 className="font-medium text-gray-900">Consecuencias de eliminar una venta</h3>
              <ul className="mt-2 text-gray-800 list-disc pl-5 space-y-1">
                <li>La venta será eliminada permanentemente de la base de datos</li>
                <li>No podrás recuperar esta información en el futuro</li>
                <li>Los registros asociados a esta venta también serán eliminados</li>
                <li>Esta acción afectará los reportes y estadísticas financieras</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
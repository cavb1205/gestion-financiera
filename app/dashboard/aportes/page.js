// app/aportes/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiDollarSign,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Link from "next/link";
import EliminarAporte from "@/app/components/aportes/EliminarAporte";
import { toast } from "react-toastify";

export default function AportesPage() {
  const { selectedStore, token } = useAuth();
  const [aportes, setAportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [aporteAEliminar, setAporteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchAportes = async () => {
    try {
      if (!selectedStore || !token) return;

      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/aportes/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los aportes");
      }

      const data = await response.json();
      const aportesData = Array.isArray(data) ? data : [];
      setAportes(aportesData);
      setCurrentPage(1); // Reset a la primera página al cargar nuevos datos
    } catch (err) {
      setError(err.message);
      console.error("Error al obtener aportes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarAporte = async () => {
    if (!aporteAEliminar) return;

    setEliminando(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/aportes/${aporteAEliminar.id}/delete/t/${selectedStore.tienda.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar el aporte");
      }

      // Actualizar la lista de aportes
      setAportes(aportes.filter((aporte) => aporte.id !== aporteAEliminar.id));
      toast.success("Aporte eliminado correctamente");
      setAporteAEliminar(null);
    } catch (err) {
      toast.error(err.message);
      console.error("Error al eliminar aporte:", err);
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    if (selectedStore && token) {
      fetchAportes();
    }
  }, [selectedStore, token]);

  // Filtrado de aportes
  const filteredAportes = aportes.filter(
    (aporte) =>
      aporte.trabajador.trabajador
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      aporte.comentario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculo de la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAportes = filteredAportes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredAportes.length / itemsPerPage);

  const totalAportes = filteredAportes.reduce(
    (total, aporte) => total + parseFloat(aporte.valor),
    0
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Aportes</h1>
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Cargando aportes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Aportes</h1>
            <p className="text-gray-500 mt-1">
              Gestión de aportes de capital para {selectedStore?.tienda?.nombre}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={fetchAportes}
              className="flex items-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <FiRefreshCw className="mr-2" />
              Actualizar
            </button>
            <Link
              href="/dashboard/aportes/crear"
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              Nuevo Aporte
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">
                <FiDollarSign />
              </div>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={fetchAportes}
              className="text-red-600 text-sm font-medium mt-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FiDollarSign className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Aportes</p>
                <p className="text-xl font-bold text-gray-800">
                  ${totalAportes.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <FiUser className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Registros</p>
                <p className="text-xl font-bold text-gray-800">
                  {filteredAportes.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <FiCalendar className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Último Aporte</p>
                <p className="text-xl font-bold text-gray-800">
                  {filteredAportes.length > 0
                    ? new Date(filteredAportes[0].fecha).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por trabajador o comentario..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value="5">5 por página</option>
                <option value="10">10 por página</option>
                <option value="25">25 por página</option>
                <option value="50">50 por página</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Aportes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trabajador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comentario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentAportes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <FiDollarSign className="text-3xl mx-auto" />
                      </div>
                      <p className="text-gray-500">
                        {searchTerm
                          ? "No se encontraron aportes con esos criterios"
                          : "No hay aportes registrados"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentAportes.map((aporte) => (
                    <tr key={aporte.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(aporte.fecha).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <FiUser className="text-blue-600 text-sm" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {aporte.trabajador.trabajador}
                            </div>
                            <div className="text-xs text-gray-500">
                              {aporte.trabajador.identificacion}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ${parseFloat(aporte.valor).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {aporte.comentario}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setAporteAEliminar(aporte)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filteredAportes.length > 0 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">{indexOfFirstItem + 1}</span> a{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredAportes.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium">{filteredAportes.length}</span>{" "}
                  resultados
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="mr-1" />
                    Anterior
                  </button>

                  {/* Números de página */}
                  <div className="hidden md:flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                            currentPage === page
                              ? "border-indigo-500 bg-indigo-500 text-white"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <FiChevronRight className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Modal de Confirmación */}
          <EliminarAporte
            isOpen={!!aporteAEliminar}
            onClose={() => setAporteAEliminar(null)}
            onConfirm={handleEliminarAporte}
            title="Confirmar eliminación"
            message={`¿Estás seguro de que deseas eliminar el aporte de ${aporteAEliminar?.trabajador?.trabajador} por valor de $${aporteAEliminar?.valor}?`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            isLoading={eliminando}
          />
        </div>
      </div>
    </div>
  );
}

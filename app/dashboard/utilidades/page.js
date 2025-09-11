"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiTrendingUp,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiSearch,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import EliminarUtilidad from "@/app/components/utilidades/EliminarUtilidad";
// import ConfirmModal from "../../components/ConfirmModal";

export default function UtilidadesPage() {
  const { selectedStore, token } = useAuth();
  const [utilidades, setUtilidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [utilidadAEliminar, setUtilidadAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUtilidades = async () => {
    try {
      if (!selectedStore || !token) return;

      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilidades/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las utilidades");
      }

      const data = await response.json();
      const utilidadesData = Array.isArray(data) ? data : [];
      setUtilidades(utilidadesData);
      setTotalPages(Math.ceil(utilidadesData.length / itemsPerPage));
    } catch (err) {
      setError(err.message);
      console.error("Error al obtener utilidades:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarUtilidad = async () => {
    if (!utilidadAEliminar) return;

    setEliminando(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilidades/${utilidadAEliminar.id}/delete/t/${selectedStore.tienda.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar la utilidad");
      }

      // Actualizar la lista de utilidades
      setUtilidades(
        utilidades.filter((utilidad) => utilidad.id !== utilidadAEliminar.id)
      );
      toast.success("Utilidad eliminada correctamente");
      setUtilidadAEliminar(null);
    } catch (err) {
      toast.error(err.message);
      console.error("Error al eliminar utilidad:", err);
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    if (selectedStore && token) {
      fetchUtilidades();
    }
  }, [selectedStore, token]);

  // Filtrar utilidades basado en el término de búsqueda
  const filteredUtilidades = utilidades.filter(
    (utilidad) =>
      utilidad.trabajador.trabajador
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      utilidad.comentario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular utilidades paginadas
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUtilidades = filteredUtilidades.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalUtilidades = filteredUtilidades.reduce(
    (total, utilidad) => total + parseFloat(utilidad.valor),
    0
  );

  // Calcular total de páginas
  useEffect(() => {
    setTotalPages(Math.ceil(filteredUtilidades.length / itemsPerPage));
    // Si la página actual es mayor que el total de páginas, volver a la primera página
    if (currentPage > Math.ceil(filteredUtilidades.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredUtilidades, itemsPerPage, currentPage]);

  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Ir a la página anterior
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Ir a la página siguiente
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbers = 5;

    if (totalPages <= maxPageNumbers) {
      // Si hay menos de 5 páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Si hay más de 5 páginas, mostrar un rango alrededor de la página actual
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

      if (endPage - startPage < maxPageNumbers - 1) {
        startPage = Math.max(1, endPage - maxPageNumbers + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Utilidades</h1>
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Cargando utilidades...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Utilidades</h1>
            <p className="text-gray-500 mt-1">
              Gestión de utilidades para {selectedStore?.tienda?.nombre}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={fetchUtilidades}
              className="flex items-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <FiRefreshCw className="mr-2" />
              Actualizar
            </button>
            <Link
              href="/dashboard/utilidades/crear"
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              Nueva Utilidad
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">
                <FiTrendingUp />
              </div>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={fetchUtilidades}
              className="text-red-600 text-sm font-medium mt-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <FiDollarSign className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Utilidades</p>
                <p className="text-xl font-bold text-gray-800">
                  ${totalUtilidades.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FiUser className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Registros</p>
                <p className="text-xl font-bold text-gray-800">
                  {filteredUtilidades.length}
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
                <p className="text-sm text-gray-500">Última Utilidad</p>
                <p className="text-xl font-bold text-gray-800">
                  {filteredUtilidades.length > 0
                    ? new Date(filteredUtilidades[0].fecha).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <FiTrendingUp className="text-indigo-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Página</p>
                <p className="text-xl font-bold text-gray-800">
                  {currentPage} / {totalPages}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 text-gray-500">
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
            <div className="flex space-x-2 text-gray-500">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Utilidades */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
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
                {currentUtilidades.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <FiTrendingUp className="text-3xl mx-auto" />
                      </div>
                      <p className="text-gray-500">
                        {searchTerm
                          ? "No se encontraron utilidades con esos criterios"
                          : "No hay utilidades registradas"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentUtilidades.map((utilidad) => (
                    <tr key={utilidad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(utilidad.fecha).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <FiUser className="text-blue-600 text-sm" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {utilidad.trabajador.trabajador}
                            </div>
                            <div className="text-xs text-gray-500">
                              {utilidad.trabajador.identificacion}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ${parseFloat(utilidad.valor).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {utilidad.comentario}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <FiEdit className="text-lg" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => setUtilidadAEliminar(utilidad)}
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
        </div>

        {/* Paginación */}
        {filteredUtilidades.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-xl shadow-sm p-4">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-700">
                Mostrando{" "}
                <span className="font-medium">
                  {Math.min(indexOfFirstItem + 1, filteredUtilidades.length)}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredUtilidades.length)}
                </span>{" "}
                de{" "}
                <span className="font-medium">{filteredUtilidades.length}</span>{" "}
                resultados
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Botón Primera Página */}
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronsLeft className="text-lg" />
              </button>

              {/* Botón Página Anterior */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="text-lg" />
              </button>

              {/* Números de Página */}
              {getPageNumbers().map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`w-10 h-10 rounded-md border ${
                    currentPage === number
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {number}
                </button>
              ))}

              {/* Botón Página Siguiente */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="text-lg" />
              </button>

              {/* Botón Última Página */}
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronsRight className="text-lg" />
              </button>
            </div>

            <div className="mt-4 md:mt-0">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>
        )}

        {/* Modal de Confirmación */}
        <EliminarUtilidad
          isOpen={!!utilidadAEliminar}
          onClose={() => setUtilidadAEliminar(null)}
          onConfirm={handleEliminarUtilidad}
          title="Confirmar eliminación"
          message={`¿Estás seguro de que deseas eliminar la utilidad de ${utilidadAEliminar?.trabajador?.trabajador} por valor de $${utilidadAEliminar?.valor}?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          isLoading={eliminando}
        />
      </div>
    </div>
  );
}

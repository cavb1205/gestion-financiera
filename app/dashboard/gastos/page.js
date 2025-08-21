// app/dashboard/gastos/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiDollarSign,
  FiCalendar,
  FiTrash2,
  FiEdit,
  FiChevronLeft,
  FiChevronRight,
  FiTag,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GastosPage() {
  const { token, selectedStore } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState(null); // Almacenar el gasto a eliminar

  // Paginación en el cliente
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Obtener tipos de gasto
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
      const tiposArray = Array.isArray(data) ? data : [];
      setTiposGasto(tiposArray);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    }
  };

  // Obtener gastos
  const fetchGastos = async () => {
    if (!selectedStore) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gastos/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener los gastos");
      }

      const data = await response.json();
      const gastosArray = Array.isArray(data) ? data : [];
      setGastos(gastosArray);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!gastoToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gastos/${gastoToDelete.id}/delete/t/${selectedStore.tienda.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error detallado del backend:", errorData);
        throw new Error(
          errorData.detail ||
            errorData.message ||
            "Error al eliminar el gasto. Por favor, intente de nuevo."
        );
      }

      toast.success("Gasto eliminado exitosamente");
      // Actualizar la lista de gastos sin recargar toda la página
      fetchGastos();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setGastoToDelete(null); // Limpiar el gasto a eliminar
    }
  };

  useEffect(() => {
    if (selectedStore && token) {
      fetchTiposGasto();
      fetchGastos();
    }
  }, [selectedStore, token]);

  // Aplicar filtros
  const filteredGastos = useMemo(() => {
    return gastos.filter((gasto) => {
      // Filtro por fecha
      if (filters.fechaInicio && gasto.fecha < filters.fechaInicio)
        return false;
      if (filters.fechaFin && gasto.fecha > filters.fechaFin) return false;

      // Filtro por valor
      const valor = parseFloat(gasto.valor);
      if (filters.minValor && valor < parseFloat(filters.minValor))
        return false;
      if (filters.maxValor && valor > parseFloat(filters.maxValor))
        return false;

      return true;
    });
  }, [gastos, filters]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGastos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros
  };

  const applyFilters = () => {
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      fechaInicio: "",
      fechaFin: "",
    });
    setCurrentPage(1);
  };

  if (!selectedStore) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value).toLocaleString("es-CO")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de Gastos
          </h1>
          <Link
            href="/dashboard/gastos/crear"
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="mr-2" /> Nuevo Gasto
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={filters.fechaInicio}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                name="fechaFin"
                value={filters.fechaFin}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={applyFilters}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <FiFilter className="mr-2" /> Aplicar Filtros
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              <FiRefreshCw className="mr-2" /> Limpiar
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Gastos
              </h3>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(
                  filteredGastos.reduce(
                    (acc, gasto) => acc + parseFloat(gasto.valor),
                    0
                  )
                )}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-gray-500 text-sm font-medium">
                Gastos Registrados
              </h3>
              <p className="text-2xl font-bold text-blue-400">
                {filteredGastos.length}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de gastos */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {gasto.fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {gasto.tipo_gasto.tipo_gasto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(gasto.valor)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {gasto.comentario || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/gastos/${gasto.id}/editar`}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <FiEdit className="inline" />
                        </Link>
                        <button
                          onClick={() => setGastoToDelete(gasto)} // Guardar el gasto a eliminar
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredGastos.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">No se encontraron gastos</p>
              </div>
            )}

            {/* Paginación */}
            {filteredGastos.length > itemsPerPage && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Siguiente
                  </button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{" "}
                      <span className="font-medium">
                        {indexOfFirstItem + 1}
                      </span>{" "}
                      a{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredGastos.length)}
                      </span>{" "}
                      de{" "}
                      <span className="font-medium">
                        {filteredGastos.length}
                      </span>{" "}
                      gastos
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <FiChevronLeft className="h-5 w-5" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Siguiente</span>
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {gastoToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Confirmar Eliminación
              </h2>
              <p className="text-gray-600 mb-2">
                ¿Estás seguro de que deseas eliminar este gasto?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-gray-500">
                <p className="font-medium">Detalles del gasto:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Tipo: {gastoToDelete.tipo_gasto.tipo_gasto}</li>
                  <li>Fecha: {gastoToDelete.fecha}</li>
                  <li>Valor: {formatCurrency(gastoToDelete.valor)}</li>
                  <li>Comentario: {gastoToDelete.comentario || "Ninguno"}</li>
                </ul>
              </div>
              <p className="text-red-500 font-medium mb-4">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setGastoToDelete(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// app/dashboard/recaudos/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  FiDollarSign,
  FiCalendar,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiSearch,
  FiCheck,
  FiX,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Link from "next/link";
import EditarRecaudo from "@/app/components/recaudos/EditarRecaudo";
import EliminarRecaudo from "@/app/components/recaudos/EliminarRecaudo";

export default function RecaudosPage() {
  const { token, selectedStore } = useAuth();
  const [recaudos, setRecaudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecaudos, setFilteredRecaudos] = useState([]);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [totalRecaudos, setTotalRecaudos] = useState(0);
  const [estadisticas, setEstadisticas] = useState({
    totalAbonos: 0,
    totalFallas: 0,
    porcentajeAbonos: 0,
    porcentajeFallas: 0,
  });

  // Estados para modificación y eliminación
  const [editingRecaudo, setEditingRecaudo] = useState(null);
  const [deletingRecaudo, setDeletingRecaudo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Establecer fecha inicial
  useEffect(() => {
    const storedDate = localStorage.getItem("liquidarFecha");
    if (storedDate) {
      setSelectedDate(storedDate);
    } else {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      setSelectedDate(formattedDate);
    }
  }, []);

  // Obtener recaudos
  useEffect(() => {
    const fetchRecaudos = async () => {
      if (!token || !selectedStore || !selectedDate) return;

      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${selectedDate}/t/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los recaudos");
        }

        const data = await response.json();

        // Asegurarse que data sea un array
        const recaudosArray = Array.isArray(data) ? data : [];

        setRecaudos(recaudosArray);
        setFilteredRecaudos(recaudosArray);

        // Calcular total recaudado
        const total = recaudosArray.reduce(
          (acc, recaudo) => acc + parseFloat(recaudo.valor_recaudo || 0),
          0
        );
        setTotalRecaudado(total);
        setTotalRecaudos(recaudosArray.length);

        // Calcular estadísticas
        const abonos = recaudosArray.filter(
          (r) => parseFloat(r.valor_recaudo) > 0
        );
        const fallas = recaudosArray.filter(
          (r) => parseFloat(r.valor_recaudo) === 0
        );

        setEstadisticas({
          totalAbonos: abonos.length,
          totalFallas: fallas.length,
          porcentajeAbonos:
            recaudosArray.length > 0
              ? Math.round((abonos.length / recaudosArray.length) * 100)
              : 0,
          porcentajeFallas:
            recaudosArray.length > 0
              ? Math.round((fallas.length / recaudosArray.length) * 100)
              : 0,
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
        setRecaudos([]);
        setFilteredRecaudos([]);
        setTotalRecaudado(0);
        setTotalRecaudos(0);
        setEstadisticas({
          totalAbonos: 0,
          totalFallas: 0,
          porcentajeAbonos: 0,
          porcentajeFallas: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) {
      fetchRecaudos();
    }
  }, [token, selectedStore, selectedDate]);

  // Filtrar recaudos por nombre del cliente
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRecaudos(recaudos);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = recaudos.filter((recaudo) => {
      const cliente = recaudo.venta?.cliente || {};
      const nombreCompleto = `${cliente.nombres || ""} ${
        cliente.apellidos || ""
      }`.toLowerCase();
      return nombreCompleto.includes(term);
    });

    setFilteredRecaudos(filtered);
    setCurrentPage(1);
  }, [searchTerm, recaudos]);

  // Guardar fecha en localStorage cuando cambia
  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem("liquidarFecha", selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value).toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecaudos.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredRecaudos.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Función para manejar la edición de recaudo
  const handleEdit = (recaudo) => {
    setEditingRecaudo(recaudo);
  };

  // Función para manejar la eliminación de recaudo
  const handleDelete = (recaudo) => {
    setDeletingRecaudo(recaudo);
  };

  // Callback para cuando se edita un recaudo exitosamente
  const handleRecaudoEditado = (updatedRecaudo) => {
    // Actualizar estado local
    setRecaudos((prev) =>
      prev.map((r) => (r.id === updatedRecaudo.id ? updatedRecaudo : r))
    );

    // Actualizar estadísticas y totales
    // Nota: Esto es una aproximación, lo ideal sería recargar los datos o tener el valor anterior
    // Para simplificar y asegurar consistencia, recargamos los datos si es posible, 
    // o recalculamos basándonos en el nuevo valor.
    // Dado que el componente EditarRecaudo devuelve el objeto actualizado, podemos usarlo.
    
    // Recalcular todo el array es más seguro
    const newRecaudos = recaudos.map((r) => (r.id === updatedRecaudo.id ? updatedRecaudo : r));
    
    const total = newRecaudos.reduce(
      (acc, recaudo) => acc + parseFloat(recaudo.valor_recaudo || 0),
      0
    );
    setTotalRecaudado(total);
    
    setEditingRecaudo(null);
    toast.success("Recaudo actualizado correctamente");
  };

  // Callback para cuando se elimina un recaudo exitosamente
  const handleRecaudoEliminado = () => {
    // El componente EliminarRecaudo ya maneja la eliminación en la API
    // Aquí solo actualizamos el estado local
    
    if (!deletingRecaudo) return;

    setRecaudos((prev) => prev.filter((r) => r.id !== deletingRecaudo.id));
    
    // Actualizar totales
    const updatedTotal =
      totalRecaudado - parseFloat(deletingRecaudo.valor_recaudo || 0);
    setTotalRecaudado(updatedTotal);
    setTotalRecaudos((prev) => prev - 1);
    
    // Actualizar estadísticas
    const newRecaudos = recaudos.filter((r) => r.id !== deletingRecaudo.id);
    const abonos = newRecaudos.filter((r) => parseFloat(r.valor_recaudo) > 0);
    const fallas = newRecaudos.filter((r) => parseFloat(r.valor_recaudo) === 0);
    const newTotal = newRecaudos.length;

    setEstadisticas({
      totalAbonos: abonos.length,
      totalFallas: fallas.length,
      porcentajeAbonos:
        newTotal > 0 ? Math.round((abonos.length / newTotal) * 100) : 0,
      porcentajeFallas:
        newTotal > 0 ? Math.round((fallas.length / newTotal) * 100) : 0,
    });

    setDeletingRecaudo(null);
    // El toast lo muestra el componente
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Modales para editar y eliminar */}
      {editingRecaudo && (
        <EditarRecaudo
          editingRecaudo={editingRecaudo}
          onEditar={handleRecaudoEditado}
          onClose={() => setEditingRecaudo(null)}
        />
      )}

      {deletingRecaudo && (
        <EliminarRecaudo
          deletingRecaudo={deletingRecaudo}
          onEliminar={handleRecaudoEliminado}
          onClose={() => setDeletingRecaudo(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FiChevronLeft className="mr-2" /> Volver al Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Recaudos del Día
        </h1>

        {/* Filtro de fecha y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0 w-full md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar fecha de recaudos
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {totalRecaudos} recaudos
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Total: {formatCurrency(totalRecaudado)}
                </div>
              </div>
            </div>

            {/* Campo de búsqueda */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escribe el nombre del cliente..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md text-gray-700"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de abonos y fallas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-gray-500 text-sm font-medium mb-1 flex items-center">
              <FiCheck className="mr-2 text-green-500" /> Abonos exitosos
            </h3>
            <div className="flex items-end">
              <p className="text-2xl font-bold text-green-500">
                {estadisticas.porcentajeAbonos}%
              </p>
              <p className="text-sm text-gray-500 ml-2">
                ({estadisticas.totalAbonos} de {totalRecaudos})
              </p>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${estadisticas.porcentajeAbonos}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-gray-500 text-sm font-medium mb-1 flex items-center">
              <FiX className="mr-2 text-red-500" /> Fallas reportadas
            </h3>
            <div className="flex items-end">
              <p className="text-2xl font-bold text-red-500">
                {estadisticas.porcentajeFallas}%
              </p>
              <p className="text-sm text-gray-500 ml-2">
                ({estadisticas.totalFallas} de {totalRecaudos})
              </p>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${estadisticas.porcentajeFallas}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Lista de recaudos - Versión móvil optimizada */}
        <div className="md:hidden space-y-3">
          {filteredRecaudos.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="bg-gray-100 inline-block p-4 rounded-full mb-4">
                <FiDollarSign className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {searchTerm ? "No se encontraron recaudos" : "No hay recaudos"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Intenta con otro nombre o cambia la fecha"
                  : "Cambia la fecha o intenta de nuevo más tarde."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="flex items-center justify-center mx-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 mb-3"
                >
                  <FiRefreshCw className="mr-2" /> Limpiar búsqueda
                </button>
              )}
              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setSelectedDate(today);
                }}
                className="flex items-center justify-center mx-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <FiRefreshCw className="mr-2" /> Hoy
              </button>
            </div>
          ) : (
            currentItems.map((recaudo) => {
              const cliente = recaudo.venta?.cliente || {};
              return (
                <div
                  key={recaudo.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden text-gray-500"
                >
                  <div className="flex items-center px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <FiUser className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {cliente.nombres} {cliente.apellidos}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Recaudo #{recaudo.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="text-sm">
                      <p className="text-gray-500">Valor recaudado</p>
                      <p
                        className={`font-medium ${
                          parseFloat(recaudo.valor_recaudo) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(recaudo.valor_recaudo)}
                      </p>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-500">Tipo</p>
                      <p className="font-medium">
                        {parseFloat(recaudo.valor_recaudo) > 0
                          ? "Abono"
                          : "Falla"}
                      </p>
                    </div>

                    <div className="text-sm col-span-2">
                      <p className="text-gray-500">Detalle</p>
                      {parseFloat(recaudo.valor_recaudo) > 0 ? (
                        <p className="font-medium text-green-600">
                          Pago registrado
                        </p>
                      ) : (
                        <p className="font-medium text-red-600">
                          {recaudo.visita_blanco?.tipo_falla ||
                            "Falla reportada"}
                        </p>
                      )}
                    </div>

                    <div className="text-sm col-span-2">
                      <p className="text-gray-500">Crédito</p>
                      <p className="font-medium">
                        #{recaudo.venta?.id} - Saldo:{" "}
                        {formatCurrency(recaudo.venta?.saldo_actual || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Botones de acciones en móvil */}
                  <div className="flex justify-end p-4 border-t border-gray-200 space-x-3">
                    <button
                      onClick={() => handleEdit(recaudo)}
                      className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      <FiEdit className="mr-1" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(recaudo)}
                      className="flex items-center text-red-600 hover:text-red-800 text-sm"
                    >
                      <FiTrash2 className="mr-1" /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Paginación móvil */}
          {filteredRecaudos.length > itemsPerPage && (
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400"
                    : "bg-white text-indigo-600 border border-indigo-300"
                }`}
              >
                Anterior
              </button>

              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400"
                    : "bg-white text-indigo-600 border border-indigo-300"
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Versión de escritorio */}
        <div className="hidden md:block">
          {/* Tabla de recaudos escritorio */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredRecaudos.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 inline-block p-4 rounded-full mb-4">
                  <FiDollarSign className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  {searchTerm
                    ? "No se encontraron recaudos"
                    : "No hay recaudos"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "Intenta con otro nombre o cambia la fecha"
                    : "No se encontraron recaudos para la fecha seleccionada."}
                </p>
                <div className="flex justify-center space-x-3">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      <FiRefreshCw className="mr-2" /> Limpiar búsqueda
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      setSelectedDate(today);
                    }}
                    className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <FiRefreshCw className="mr-2" /> Volver a hoy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Detalle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Crédito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((recaudo) => {
                        const cliente = recaudo.venta?.cliente || {};
                        return (
                          <tr key={recaudo.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {cliente.nombres} {cliente.apellidos}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {cliente.telefono_principal}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm font-medium ${
                                  parseFloat(recaudo.valor_recaudo) > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(recaudo.valor_recaudo)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {parseFloat(recaudo.valor_recaudo) > 0
                                  ? "Abono"
                                  : "Falla"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {parseFloat(recaudo.valor_recaudo) > 0 ? (
                                <span className="text-sm text-green-600">
                                  Pago registrado
                                </span>
                              ) : (
                                <span className="text-sm text-red-600">
                                  {recaudo.visita_blanco?.tipo_falla ||
                                    "Falla reportada"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>#{recaudo.venta?.id}</div>
                                <div className="text-gray-500">
                                  Saldo:{" "}
                                  {formatCurrency(
                                    recaudo.venta?.saldo_actual || 0
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEdit(recaudo)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <FiEdit className="inline mr-1" /> Editar
                              </button>
                              <button
                                onClick={() => handleDelete(recaudo)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="inline mr-1" /> Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginación escritorio */}
                {filteredRecaudos.length > itemsPerPage && (
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
                            {Math.min(indexOfLastItem, filteredRecaudos.length)}
                          </span>{" "}
                          de{" "}
                          <span className="font-medium">
                            {filteredRecaudos.length}
                          </span>{" "}
                          recaudos
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

                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
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
                          ))}

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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// app/dashboard/liquidar/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  FiDollarSign,
  FiCalendar,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiX,
  FiClock,
  FiUser,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LiquidarCreditosPage() {
  const { token, selectedStore } = useAuth();
  const [creditos, setCreditos] = useState([]);
  const [recaudos, setRecaudos] = useState([]);
  const [creditosActivos, setCreditosActivos] = useState([]);
  const [filteredCreditos, setFilteredCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCredito, setSelectedCredito] = useState(null);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Establecer fecha actual por defecto
  useEffect(() => {
    // Intentar obtener la fecha guardada del localStorage
    const storedDate = localStorage.getItem("liquidarFecha");

    // Si hay fecha guardada, usarla
    if (storedDate) {
      setSelectedDate(storedDate);
    }
    // Si no, establecer fecha actual
    else {
      const today = new Date();
      const formattedDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];

      setSelectedDate(formattedDate);
    }
  }, []);

  // Obtener créditos para liquidar
  useEffect(() => {
    const fetchCreditos = async () => {
      if (!token || !selectedStore || !selectedDate) return;

      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/liquidar/${selectedDate}/t/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los créditos para liquidar");
        }

        const data = await response.json();
        // Asegurarnos de que siempre sea un array
        if (Array.isArray(data)) {
          setCreditos(data);
          setFilteredCreditos(data); // Inicializar los créditos filtrados
        } else {
          setCreditos([]);
          setFilteredCreditos([]);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCreditosActivos = async () => {
      if (!token || !selectedStore || !selectedDate) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/t/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los créditos activos");
        }

        const data = await response.json();
        // Asegurarnos de que siempre sea un array
        if (Array.isArray(data)) {
          setCreditosActivos(data);
        } else {
          setCreditos([]);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecaudos = async () => {
      if (!token || !selectedStore || !selectedDate) return;
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
        // Asegurarnos de que siempre sea un array
        if (Array.isArray(data)) {
          setRecaudos(data);
        } else {
          setRecaudos([]);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      }
    };

    fetchCreditos();
    fetchRecaudos();
    fetchCreditosActivos();
  }, [token, selectedStore, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem("liquidarFecha", selectedDate);
    }
  }, [selectedDate]);

  // Filtrar créditos por nombre del cliente
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCreditos(creditos);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = creditos.filter((credito) => {
      const nombreCompleto =
        `${credito.cliente.nombres} ${credito.cliente.apellidos}`.toLowerCase();
      return nombreCompleto.includes(term);
    });

    setFilteredCreditos(filtered);
    setCurrentPage(1);
  }, [searchTerm, creditos]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCreditos.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCreditos.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setCurrentPage(1);
    localStorage.setItem("liquidarFecha", e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const handleAbonar = (credito) => {
    console.log("Abonar crédito:", credito);
    setSelectedCredito(credito);

    // Calcular el valor a abonar (mínimo entre saldo actual y valor cuota)
    const valorAbono = Math.min(
      parseFloat(credito.saldo_actual),
      parseFloat(credito.valor_cuota)
    );

    // Preparar el objeto de abono
    const abono = {
      fecha_recaudo: selectedDate,
      valor_recaudo: valorAbono,
      saldo_actual: credito.saldo_actual,
      venta: credito.id,
      tienda: selectedStore.tienda.id,
    };
    localStorage.setItem("abono", JSON.stringify(abono));
    localStorage.setItem("cliente", JSON.stringify(credito.cliente));

    // Navegar a la página de pago con los datos necesarios
    router.push(`/dashboard/liquidar/abonar`);
  };

  const handleReportarFalla = (credito) => {
    setSelectedCredito(credito);

    // Preparar el objeto de no pago
    const noPago = {
      fecha_recaudo: selectedDate,
      valor_recaudo: 0,
      venta: credito.id,
      tienda: selectedStore.tienda.id,
      visita_blanco: {
        comentario: "",
        tipo_falla: "Casa o Local Cerrado",
      },
    };

    localStorage.setItem("noPago", JSON.stringify(noPago));
    localStorage.setItem("cliente", JSON.stringify(credito.cliente));

    // Navegar a la página de reporte de falla
    router.push(`/dashboard/liquidar/reportar`);
  };

  // Calcular totales basados en créditos filtrados
  const totalRecaudar = creditosActivos.reduce(
    (acc, credito) => acc + parseFloat(credito.valor_cuota),
    0
  );

  const totalPendientes = filteredCreditos.reduce(
    (acc, credito) => acc + parseFloat(credito.valor_cuota),
    0
  );

  const totalRealizados = recaudos.reduce(
    (acc, recaudo) => acc + parseFloat(recaudo.valor_recaudo),
    0
  );

  if (loading && creditos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
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
          Liquidación de Créditos
        </h1>

        {/* Filtro de fecha y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0 w-full md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar fecha de liquidación
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

              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredCreditos.length} créditos
                </span>
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

        {/* Resumen móvil */}
        <div className="md:hidden grid grid-cols-3 gap-1 mb-4">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500">A recaudar</p>
            <p className="font-bold text-purple-600">
              {formatCurrency(totalRecaudar)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500">Pendientes</p>
            <p className="font-bold text-orange-500">
              {formatCurrency(totalPendientes)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500">Recaudado</p>
            <p className="font-bold text-green-500">
              {formatCurrency(totalRealizados)}
            </p>
          </div>
        </div>

        {/* Lista de créditos - Versión móvil optimizada */}
        <div className="md:hidden space-y-3">
          {filteredCreditos.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="bg-gray-100 inline-block p-4 rounded-full mb-4">
                <FiDollarSign className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {searchTerm
                  ? "No se encontraron créditos"
                  : "No hay créditos para liquidar"}
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
                  const today = new Date();
                  const formattedDate = new Date(
                    today.getTime() - today.getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .split("T")[0];
                  setSelectedDate(formattedDate);
                }}
                className="flex items-center justify-center mx-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <FiRefreshCw className="mr-2" /> Hoy
              </button>
            </div>
          ) : (
            currentItems.map((credito) => (
              <div
                key={credito.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden text-gray-500"
              >
                <Link
                  href={`/dashboard/ventas/${credito.id}/`}
                  className="flex items-center px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <FiUser className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {credito.cliente.nombres} {credito.cliente.apellidos}
                      </h3>
                      <p className="text-xs text-gray-500">#{credito.id}</p>
                    </div>
                  </div>
                </Link>

                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <p className="text-gray-500">Valor cuota</p>
                    <p className="font-medium">
                      {formatCurrency(credito.valor_cuota)}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">Saldo</p>
                    <p className="font-medium text-red-500">
                      {formatCurrency(credito.saldo_actual)}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">Pagos realizados</p>
                    <p className="font-medium text-green-600">
                      {credito.pagos_realizados.toFixed(0)}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">Pagos pendientes</p>
                    <p className="font-medium text-orange-500">
                      {credito.pagos_pendientes.toFixed(0)}
                    </p>
                  </div>

                  {credito.dias_atrasados == 0 ? (
                    <div className="text-sm col-span-2">
                      <p className="text-gray-500">Estado</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Al día
                      </span>
                    </div>
                  ) : credito.dias_atrasados < 0 ? (
                    <div className="text-sm col-span-2">
                      <p className="text-gray-500">Anticipado</p>
                      <div className="flex items-center">
                        <FiClock className="text-gray-400 mr-1" />
                        <span className="font-medium text-green-500">
                          {Math.abs(credito.dias_atrasados)} días
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm col-span-2">
                      <p className="text-gray-500">Atraso</p>
                      <div className="flex items-center">
                        <FiClock className="text-gray-400 mr-1" />
                        <span className="font-medium text-red-500">
                          {credito.dias_atrasados} días
                        </span>
                        <span
                          className={`ml-2 text-xs px-2 py-1 rounded-full ${
                            credito.dias_atrasados > 30
                              ? "bg-red-100 text-red-800"
                              : credito.dias_atrasados > 15
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {credito.estado_venta}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAbonar(credito)}
                    className="flex items-center justify-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    <FiCheck className="mr-2" /> Abonar
                  </button>
                  <button
                    onClick={() => handleReportarFalla(credito)}
                    className="flex items-center justify-center bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  >
                    <FiX className="mr-2" /> Reportar
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Paginación móvil */}
          {filteredCreditos.length > itemsPerPage && (
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
          {/* Resumen escritorio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Total a Recaudar
              </h3>
              <p className="text-2xl font-bold text-purple-500">
                {formatCurrency(totalRecaudar)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Pagos Pendientes
              </h3>
              <p className="text-2xl font-bold text-orange-500">
                {formatCurrency(totalPendientes)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Recaudado
              </h3>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totalRealizados)}
              </p>
            </div>
          </div>

          {/* Tabla de créditos escritorio */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredCreditos.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 inline-block p-4 rounded-full mb-4">
                  <FiDollarSign className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  {searchTerm
                    ? "No se encontraron créditos"
                    : "No hay créditos para liquidar"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "Intenta con otro nombre o cambia la fecha"
                    : "No se encontraron créditos pendientes para la fecha seleccionada."}
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
                      const today = new Date();
                      const formattedDate = new Date(
                        today.getTime() - today.getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .split("T")[0];
                      setSelectedDate(formattedDate);
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
                          Valor Cuota
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pagos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saldo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Atraso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((credito) => (
                        <tr key={credito.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Link
                                className="ml-4 hover:scale-105 transition-transform"
                                href={`/dashboard/ventas/${credito.id}/`}
                              >
                                <div className="text-sm font-medium text-gray-900 capitalize">
                                  {credito.cliente.nombres}{" "}
                                  {credito.cliente.apellidos}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {credito.cliente.telefono_principal}
                                </div>
                                <div className="text-xs text-gray-400">
                                  #{credito.id}
                                </div>
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(credito.valor_cuota)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <span className="text-green-500 mr-1">✓</span>
                                <span className="text-sm text-green-500">
                                  {credito.pagos_realizados} realizados
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-orange-500 mr-1">●</span>
                                <span className="text-sm text-orange-500">
                                  {credito.pagos_pendientes} pendientes
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Total: {credito.cuotas} cuotas
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-red-600">
                              {formatCurrency(credito.saldo_actual)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {credito.dias_atrasados < 0 ? (
                              <div className="flex items-center">
                                <FiClock className="text-gray-400 mr-1" />
                                <div className="text-sm font-medium text-green-500">
                                  {Math.abs(credito.dias_atrasados)} días
                                </div>
                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                  Anticipado
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-red-500">
                                  {credito.dias_atrasados} días
                                </div>
                                <div
                                  className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                    credito.dias_atrasados > 30
                                      ? "bg-red-100 text-red-800"
                                      : credito.dias_atrasados > 15
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {credito.estado_venta}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleAbonar(credito)}
                                className="flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                              >
                                <FiCheck className="mr-1" /> Abonar
                              </button>
                              <button
                                onClick={() => handleReportarFalla(credito)}
                                className="flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
                              >
                                <FiX className="mr-1" /> Reportar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación escritorio */}
                {filteredCreditos.length > itemsPerPage && (
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
                            {Math.min(indexOfLastItem, filteredCreditos.length)}
                          </span>{" "}
                          de{" "}
                          <span className="font-medium">
                            {filteredCreditos.length}
                          </span>{" "}
                          créditos
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

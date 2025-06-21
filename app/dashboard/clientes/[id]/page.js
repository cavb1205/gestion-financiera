// app/dashboard/clientes/[id]/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiUser,
  FiHome,
  FiPhone,
  FiMail,
  FiDollarSign,
  FiClock,
  FiEdit,
  FiTrash2,
  FiArrowLeft,
  FiCreditCard,
  FiCalendar,
  FiCheck,
  FiX,
  FiPlus,
  FiTrendingDown,
  FiTrendingUp,
  FiStar,
  FiAlertCircle,
} from "react-icons/fi";
import { FaStar, FaRegStar, FaBan } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorMessage from "../../../components/ErrorMessage";

export default function DetalleCliente({ params }) {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [creditos, setCreditos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  params = useParams();

  const clienteId = params.id;
  // Calcular los totales financieros
  const resumenFinanciero = useMemo(() => {
    let totalCreditos = 0;
    let totalMontoNeto = 0;
    let totalPerdidas = 0;
    let totalIngresos = 0;

    // Variables para calificación
    let creditosPagadosATiempo = 0;
    let creditosConAtraso = 0;
    let creditosPerdidos = 0;
    let creditosCompletados = 0;
    let totalDiasAtraso = 0;

    creditos.forEach((credito) => {
      const monto = parseInt(credito.valor_venta) || 0;
      const saldo = parseInt(credito.saldo_actual) || 0;
      const intereses = parseInt(credito.total_a_pagar) || 0;

      totalCreditos += 1;
      totalMontoNeto += monto;

      // Calcular pérdidas (créditos vencidos con saldo pendiente)
      if (credito.estado_venta === "Perdida") {
        totalPerdidas += saldo;
        creditosPerdidos += 1;
      }

      // Calcular ingresos (solo créditos pagados)
      if (credito.estado_venta === "Pagado") {
        // Ingresos = Monto inicial + Intereses - Saldo actual (debería ser 0)

        totalIngresos += intereses - monto;
        creditosCompletados += 1;

        // Calcular pagos a tiempo vs atrasados
        if (credito.dias_atrasados > 0) {
          creditosConAtraso += 1;
          totalDiasAtraso += credito.dias_atrasados;
        } else {
          creditosPagadosATiempo += 1;
        }
      }
    });

    // Calcular calificación (0-100 puntos)
    let calificacion = 0;
    let estrellas = 0;
    let bloqueado = creditosPerdidos > 0;

    if (!bloqueado && totalCreditos > 0) {
      // Base: Porcentaje de créditos pagados a tiempo (70% del puntaje)
      const porcentajeATiempo = (creditosPagadosATiempo / creditosCompletados) * 100 || 0;
      
      // Penalización por días de atraso (máximo 30% de reducción)
      const penalizacionAtraso = Math.min(30, totalDiasAtraso);
      
      // Bonus por cantidad de créditos completados
      const bonusExperiencia = Math.min(10, creditosCompletados);
      
      // Cálculo final
      calificacion = Math.max(0, Math.min(100, 
        (porcentajeATiempo * 0.7) - penalizacionAtraso + bonusExperiencia
      ));
      
      // Convertir a estrellas (1-5)
      estrellas = calificacion >= 90 ? 5 :
                  calificacion >= 70 ? 4 :
                  calificacion >= 50 ? 3 :
                  calificacion >= 30 ? 2 : 1;
    }

    return {
      totalCreditos,
      totalMontoNeto,
      totalPerdidas,
      totalIngresos,
      calificacion,
      estrellas,
      bloqueado,
      creditosPagadosATiempo,
      creditosConAtraso,
      creditosPerdidos,
      creditosCompletados,
      promedioAtraso: creditosConAtraso > 0 
        ? (totalDiasAtraso / creditosConAtraso).toFixed(1) 
        : "0.0",
    };
  }, [creditos]);

  console.log("creditos:", creditos);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
      return;
    }

    if (selectedStore && token && !loading) {
      fetchCliente();
    }
  }, [loading, isAuthenticated, selectedStore, token, router]);

  const fetchCliente = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Obtener detalles del cliente
      const clienteResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!clienteResponse.ok) {
        throw new Error("Error al obtener los detalles del cliente");
      }

      const clienteData = await clienteResponse.json();
      setCliente(clienteData);

      // Obtener créditos del cliente
      const creditosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/${clienteId}/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!creditosResponse.ok) {
        throw new Error("Error al obtener los créditos del cliente");
      }

      const creditosData = await creditosResponse.json();
      setCreditos(creditosData);
    } catch (err) {
      setError(err.message || "Error al cargar los datos del cliente");
      console.error("Error fetching client details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return "";

    // Eliminar cualquier carácter no numérico
    const cleaned = phone.replace(/\D/g, "");

    // Manejar diferentes longitudes de números
    if (cleaned.length === 10) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(
        2,
        3
      )} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    } else if (cleaned.length === 12) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(
        3,
        5
      )} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    }

    // Si no coincide con los formatos esperados, devolver el original
    return phone;
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "numeric", day: "numeric" };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Activo":
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            Activo
          </span>
        );
      case "Inactivo":
        return (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            Inactivo
          </span>
        );
      case "Moroso":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            Moroso
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
            {status}
          </span>
        );
    }
  };

  const getCreditStatus = (status) => {
    switch (status) {
      case "Activo":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            Activo
          </span>
        );
      case "Pagado":
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            Pagado
          </span>
        );
      case "Vencido":
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
            Vencido
          </span>
        );
      case "Renegociado":
        return (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
            Renegociado
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `https://api.carterafinanciera.com/clientes/${clienteId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el cliente");
      }

      router.push("/clientes");
    } catch (err) {
      setError(err.message || "Error al eliminar el cliente");
      console.error("Error deleting client:", err);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Cargando detalles del cliente...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchCliente} />;
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
        <p className="mt-4 text-lg text-gray-700">Cliente no encontrado</p>
        <button
          onClick={() => router.push("/clientes")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Volver a la lista de clientes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <button
              onClick={() => router.push("/dashboard/clientes")}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <FiArrowLeft className="mr-2" /> Volver a clientes
            </button>

            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full">
                <FiUser className="text-indigo-600 text-2xl" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {cliente.nombres} {cliente.apellidos}
                </h1>
                {/* Mostrar calificación como estrellas */}
                 {/* Mostrar calificación como estrellas o bloqueado */}
                  {resumenFinanciero.totalCreditos > 0 && (
                    <div className="ml-3 flex items-center">
                      {resumenFinanciero.bloqueado ? (
                        <span className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          <FaBan className="mr-1" /> BLOQUEADO
                        </span>
                      ) : (
                        <>
                          {[...Array(5)].map((_, i) => (
                            i < resumenFinanciero.estrellas ? (
                              <FaStar key={i} className="text-yellow-400 text-sm" />
                            ) : (
                              <FaRegStar key={i} className="text-gray-300 text-sm" />
                            )
                          ))}
                          <span className="ml-1 text-xs text-gray-500">
                            ({resumenFinanciero.calificacion.toFixed(1)})
                          </span>
                        </>
                      )}
                    </div>
                  )}
                <div className="flex items-center mt-1">
                  {getStatusBadge(cliente.estado_cliente)}
                  <span className="ml-3 text-gray-500 text-sm">
                    Registrado el {formatDate(cliente.fecha_creacion)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => router.push(`/clientes/${clienteId}/editar`)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <FiEdit className="mr-2" />
              Editar
            </button>

            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <FiTrash2 className="mr-2" />
              Eliminar
            </button>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="mb-5">
          {/* Información personal */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2 text-indigo-600" />
              Información del Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Identificación
                  </p>
                  <p className="font-medium text-gray-500">
                    {cliente.identificacion}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Teléfono Principal
                </p>
                <p className="font-medium text-gray-500">
                  {formatPhone(cliente.telefono_principal)}
                </p>
              </div>
              {cliente.telefono_opcional && (
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Teléfono Opcional
                  </p>
                  <p className="font-medium text-gray-500">
                    {formatPhone(cliente.telefono_opcional)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Nombre del Negocio
                </p>
                <p className="font-medium text-gray-500">
                  {cliente.nombre_local}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Dirección</p>
                <p className="font-medium text-gray-500">{cliente.direccion}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Total Créditos
              </h3>
              <FiCreditCard className="text-indigo-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-gray-500">
              {resumenFinanciero.totalCreditos}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Todos los créditos asignados
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Monto Neto</h3>
              <FiDollarSign className="text-green-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-gray-500">
              {resumenFinanciero.totalMontoNeto.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Suma de todos los créditos
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Pérdidas</h3>
              <FiTrendingDown className="text-red-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-red-400">
              {resumenFinanciero.totalPerdidas.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Créditos vencidos no recuperados
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Ingresos por Créditos
              </h3>
              <FiTrendingUp className="text-green-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {resumenFinanciero.totalIngresos.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              De créditos completamente pagados
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Calificación</h3>
              {resumenFinanciero.bloqueado ? (
                <FaBan className="text-red-600" />
              ) : (
                <FiStar className="text-yellow-400" />
              )}
            </div>
            <div className="mt-2">
              {resumenFinanciero.bloqueado ? (
                <div className="text-center py-4">
                  <div className="bg-red-100 rounded-full p-3 inline-block">
                    <FaBan className="text-red-600 text-2xl" />
                  </div>
                  <p className="mt-3 font-bold text-red-600">CLIENTE BLOQUEADO</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Tiene {resumenFinanciero.creditosPerdidos} crédito(s) perdido(s)
                  </p>
                </div>
              ) : resumenFinanciero.totalCreditos > 0 ? (
                <>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      i < resumenFinanciero.estrellas ? (
                        <FaStar key={i} className="text-yellow-400 text-2xl mx-1" />
                      ) : (
                        <FaRegStar key={i} className="text-gray-300 text-2xl mx-1" />
                      )
                    ))}
                  </div>
                  <p className="text-center text-lg font-bold text-gray-800">
                    {resumenFinanciero.calificacion.toFixed(1)}/100
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="flex items-center">
                      <FiCheck className="text-green-500 mr-1" /> 
                      {resumenFinanciero.creditosPagadosATiempo} pagos a tiempo
                    </p>
                    <p className="flex items-center">
                      <FiAlertCircle className="text-yellow-500 mr-1" /> 
                      {resumenFinanciero.creditosConAtraso} con atraso
                    </p>
                    <p className="flex items-center">
                      <FiClock className="text-blue-500 mr-1" /> 
                      {resumenFinanciero.promedioAtraso} días de atraso promedio
                    </p>
                    <p className="flex items-center">
                      <FiCreditCard className="text-indigo-500 mr-1" /> 
                      {resumenFinanciero.creditosCompletados} créditos completados
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Sin créditos para calificar
                </p>
              )}
            </div>
          </div>
        
        {/* Historial de créditos */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiCreditCard className="mr-2 text-indigo-600" />
              Historial de Créditos
            </h2>

            <button
              onClick={() =>
                router.push(`/clientes/${clienteId}/nuevo-credito`)
              }
              className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <FiPlus className="mr-2" />
              Nuevo Crédito
            </button>
          </div>

          {creditos.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-4 inline-block">
                <FiDollarSign className="text-gray-400 text-2xl mx-auto" />
              </div>
              <p className="mt-4 text-gray-600">
                Este cliente no tiene créditos registrados
              </p>
              <button
                onClick={() =>
                  router.push(`/clientes/${clienteId}/nuevo-credito`)
                }
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Crear primer crédito
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Crédito
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Monto
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fecha Inicio
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fecha Vencimiento
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Saldo Pendiente
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Estado
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditos.map((credito) => (
                    <tr key={credito.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          CR-{credito.id.toString().padStart(4, "0")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${parseInt(credito.valor_venta).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(credito.fecha_venta)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(credito.fecha_vencimiento)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${parseInt(credito.saldo_actual).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCreditStatus(credito.estado_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/creditos/${credito.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar eliminación
              </h3>
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar permanentemente a{" "}
              <span className="font-semibold">
                {cliente.nombres} {cliente.apellidos}
              </span>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

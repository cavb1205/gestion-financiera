// app/dashboard/ventas/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiClock,
  FiBarChart2,
  FiPercent,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiXCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function VentaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ventaId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();

  const [venta, setVenta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagos, setPagos] = useState([]);

  // Estados para el modal de pérdida
  const [showLossModal, setShowLossModal] = useState(false);
  const [isSendingLoss, setIsSendingLoss] = useState(false);
  const [lossError, setLossError] = useState(null);

  // Cargar datos de la venta y pagos
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

      // Obtener datos de la venta
      const ventaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!ventaResponse.ok) {
        throw new Error("No se pudo cargar la información de la venta");
      }

      const ventaData = await ventaResponse.json();
      setVenta(ventaData);

      // Obtener pagos de la venta
      const pagosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${ventaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!pagosResponse.ok) {
        throw new Error("No se pudieron cargar los pagos de la venta");
      }

      const pagosData = await pagosResponse.json();
      setPagos(Array.isArray(pagosData) ? pagosData : []);

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setPagos([]); // Asegurarse de que pagos sea un array vacío
      setIsLoading(false);
    }
  };

  // Función para marcar como pérdida
  const markAsLoss = async () => {
    setIsSendingLoss(true);
    setLossError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/perdida/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );



      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al marcar como pérdida");
      }

      const data = await response.json();
      console.log("Venta marcada como pérdida:", data);

      // Actualizar estado localmente y cerrar modal
      setVenta((prev) => ({
        ...prev,
        estado_venta: "Perdida",
      }));
      setShowLossModal(false);
    } catch (err) {
      console.error("Error al marcar como pérdida:", err);
      setLossError(err.message);
    } finally {
      setIsSendingLoss(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Activo":
        return "bg-green-100 text-green-800";
      case "Vencido":
        return "bg-red-100 text-red-800";
      case "Pagado":
        return "bg-blue-100 text-blue-800";
      case "Perdida":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPagado = pagos.reduce((sum, pago) => {
    const valor = parseFloat(pago.valor_recaudo) || 0;
    return valor > 0 ? sum + valor : sum;
  }, 0);

  const progresoPago = venta
    ? (totalPagado / parseFloat(venta.total_a_pagar)) * 100
    : 0;

  if (loading || !isAuthenticated || !selectedStore) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Cargando detalles de la venta...</p>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 rounded-xl p-6 text-center">
          <FiAlertCircle className="mx-auto text-red-500 text-4xl mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Error al cargar la venta
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "No se encontró información de la venta"}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchVenta}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push("/dashboard/ventas")}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Volver a ventas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-400">
      {/* Modal de confirmación para marcar como pérdida */}
      {showLossModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start mb-4">
                <FiAlertTriangle className="text-red-500 text-2xl mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Marcar crédito como pérdida
                  </h3>
                  <p className="text-gray-600 mt-2">
                    ¿Estás seguro de marcar este crédito como pérdida? Esta
                    acción es irreversible y se debe usar solo cuando el cliente
                    ha desaparecido o es imposible recuperar el crédito.
                  </p>
                </div>
              </div>

              {lossError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                  {lossError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowLossModal(false)}
                  disabled={isSendingLoss}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={markAsLoss}
                  disabled={isSendingLoss}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                >
                  {isSendingLoss ? (
                    <>
                      <FiClock className="animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FiAlertTriangle className="mr-2" />
                      Confirmar como pérdida
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/ventas")}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Volver a ventas
          </button>
        </div>

        {/* Encabezado */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-around mb-4">
            <div className="">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiCreditCard className="mr-2 text-indigo-600" />
                Venta #{venta.id}
                <span
                  className={`ml-3 text-xs px-2 py-1 rounded-full ${getEstadoColor(
                    venta.estado_venta
                  )}`}
                >
                  {venta.estado_venta}
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                Crédito a {venta.cliente.nombres} {venta.cliente.apellidos}
                <br />
                <span className="text-gray-500 text-sm">
                  {venta.fecha_venta}
                </span>
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2  ">
              <button
                onClick={() => router.push(`/dashboard/ventas/${ventaId}/pago`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <FiPlus className="mr-2" />
                Registrar pago
              </button>
              <button
                onClick={() =>
                  router.push(`/dashboard/ventas/${ventaId}/editar`)
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <FiEdit className="mr-2" />
                Editar
              </button>
              <button
                onClick={() =>
                  router.push(`/dashboard/ventas/${ventaId}/eliminar`)
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <FiTrash2 className="mr-2" />
                Eliminar
              </button>
              {venta.estado_venta !== "Perdida" && (
                <button
                  onClick={() => setShowLossModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <FiAlertTriangle className="mr-2" />
                  Marcar como pérdida
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Valor de la venta
              </h3>
              <FiDollarSign className="text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatMoney(venta.valor_venta)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Total a pagar
              </h3>
              <FiBarChart2 className="text-green-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatMoney(venta.total_a_pagar)}
            </p>
            <div className="mt-1 text-sm text-gray-500 flex items-center">
              <FiPercent className="mr-1" />
              Interés: {venta.interes}%
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Saldo actual
              </h3>
              {parseFloat(venta.saldo_actual) > 0 ? (
                <FiTrendingDown className="text-red-500" />
              ) : (
                <FiTrendingUp className="text-green-500" />
              )}
            </div>
            <p
              className={`mt-2 text-2xl font-bold ${
                parseFloat(venta.saldo_actual) > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatMoney(venta.saldo_actual)}
            </p>
            <div className="mt-1 text-sm text-gray-500">
              {Math.round(venta.pagos_pendientes)} pagos pendientes
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Valor de cuota
              </h3>
              <FiCreditCard className="text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatMoney(venta.valor_cuota)}
            </p>
            <div className="mt-1 text-sm text-gray-500">
              {venta.cuotas} cuotas · {venta.plazo}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Información del crédito */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiCreditCard className="mr-2 text-indigo-600" />
              Detalles del crédito
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Fecha de venta</p>
                <p className="font-medium">{venta.fecha_venta}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de vencimiento</p>
                <p className="font-medium">{venta.fecha_vencimiento}</p>
              </div>
              {venta.dias_atrasados > 0 ? (
                <div>
                  <p className="text-sm text-gray-500">Días atrasados</p>
                  <p className="font-medium text-red-600">
                    {Math.round(venta.dias_atrasados)} días
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">Días Adelantados</p>
                  <p className="font-medium text-green-600">
                    {Math.round(venta.dias_atrasados) * -1} días
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Pagos realizados</p>
                <p className="font-medium">
                  {Math.round(venta.pagos_realizados)} de {venta.cuotas}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total abonado</p>
                <p className="font-medium">
                  {formatMoney(venta.total_abonado)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Promedio de pago</p>
                <p className="font-medium">
                  {formatMoney(venta.promedio_pago)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Comentarios</p>
                <p className="font-medium">
                  {venta.comentario || "Sin comentarios"}
                </p>
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-900 mb-3">
              Progreso del pago
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-indigo-600 h-4 rounded-full"
                style={{ width: `${progresoPago}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatMoney(totalPagado)}</span>
              <span>{progresoPago.toFixed(1)}%</span>
              <span>{formatMoney(venta.total_a_pagar)}</span>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2 text-indigo-600" />
              Información del cliente
            </h2>

            <div className="flex items-start mb-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <FiUser className="text-indigo-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-lg">
                  {venta.cliente.nombres} {venta.cliente.apellidos}
                </h3>
                <p className="text-gray-600">{venta.cliente.identificacion}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Negocio</p>
                <p className="font-medium">
                  {venta.cliente.nombre_local || "No especificado"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Teléfono principal</p>
                <p className="font-medium">
                  {venta.cliente.telefono_principal}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Teléfono opcional</p>
                <p className="font-medium">
                  {venta.cliente.telefono_opcional || "No especificado"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium">{venta.cliente.direccion}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Estado del cliente</p>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    venta.cliente.estado_cliente === "Activo"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {venta.cliente.estado_cliente}
                </span>
              </div>

              <button
                onClick={() =>
                  router.push(`/dashboard/clientes/${venta.cliente.id}`)
                }
                className="mt-4 w-full py-2 text-center text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium"
              >
                Ver perfil completo del cliente
              </button>
            </div>
          </div>
        </div>

        {/* Historial de pagos */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FiCheckCircle className="mr-2 text-green-600" />
              Historial de pagos
            </h2>
            <button
              onClick={() => router.push(`/dashboard/ventas/${ventaId}/pago`)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center"
            >
              <FiPlus className="mr-1" /> Nuevo pago
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Valor
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Detalles
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!pagos || pagos.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-4 text-center text-sm text-gray-500"
                    >
                      No se han registrado pagos para esta venta
                    </td>
                  </tr>
                ) : (
                  pagos.map((pago) => {
                    const valorRecaudo = parseFloat(pago.valor_recaudo);
                    const isVisitaFallida =
                      valorRecaudo === 0 && pago.visita_blanco;

                    return (
                      <tr key={pago.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pago.fecha_recaudo}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          {isVisitaFallida ? (
                            <span className="text-red-600">Visita fallida</span>
                          ) : (
                            "Pago"
                          )}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
                            valorRecaudo > 0
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {formatMoney(valorRecaudo)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {isVisitaFallida ? (
                            <div>
                              <p>
                                <strong>Falla:</strong>{" "}
                                {pago.visita_blanco.tipo_falla}
                              </p>
                              <p>
                                {pago.visita_blanco.comentario ||
                                  "Sin comentarios"}
                              </p>
                            </div>
                          ) : (
                            "Pago registrado"
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {valorRecaudo > 0 ? (
                            <>
                              <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                                Editar
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                Eliminar
                              </button>
                            </>
                          ) : (
                            <button className="text-gray-600 hover:text-gray-900">
                              <FiXCircle className="inline mr-1" /> Eliminar
                              visita
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagos && pagos.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-700">
                Mostrando {pagos.length} registros
              </p>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  Pagos totales: {formatMoney(totalPagado)}
                </span>
                <button className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded text-sm">
                  Exportar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de pérdidas (solo si es aplicable) */}
        {venta.estado_venta === "Vencido" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-red-800">
                  Pérdida potencial
                </h3>
                <div className="mt-2 text-red-700">
                  <p>
                    Esta venta está marcada como vencida con{" "}
                    {Math.round(venta.dias_atrasados)} días de atraso.
                  </p>
                  <p className="mt-2 font-bold">
                    Pérdida estimada: {formatMoney(venta.perdida)}
                  </p>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                    Gestionar recuperación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

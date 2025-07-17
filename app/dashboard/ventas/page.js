// app/dashboard/ventas/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiShoppingBag,
  FiFilter,
  FiSearch,
  FiPlus,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiDollarSign,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function VentasPage() {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    estado: "Todos",
    montoMin: "",
    montoMax: "",
  });

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVentas();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchVentas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las ventas activas");
      }

      const data = await response.json();
      setVentas(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Filtrar ventas basado en los filtros y término de búsqueda

  let ventasOrdered = ventas.sort((a, b) => {
    return a.id - b.id; // Ordenar por ID ascendente
  });
  const filteredVentas = ventasOrdered.filter((venta) => {
    // Filtro por estado
    if (filters.estado !== "Todos" && venta.estado_venta !== filters.estado) {
      return false;
    }

    // Filtro por monto mínimo
    if (
      filters.montoMin &&
      parseFloat(venta.saldo_actual) < parseFloat(filters.montoMin)
    ) {
      return false;
    }

    // Filtro por monto máximo
    if (
      filters.montoMax &&
      parseFloat(venta.saldo_actual) > parseFloat(filters.montoMax)
    ) {
      return false;
    }

    // Búsqueda por nombre, identificación o ID de venta
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesCliente =
        venta.cliente.nombres.toLowerCase().includes(searchLower) ||
        venta.cliente.apellidos.toLowerCase().includes(searchLower) ||
        venta.cliente.identificacion.toLowerCase().includes(searchLower);

      const matchesVenta = venta.id.toString().includes(searchTerm);

      return matchesCliente || matchesVenta;
    }

    return true;
  });

  // Calcular resumen
  const calculateSummary = () => {
    return filteredVentas.reduce(
      (acc, venta) => {
        acc.totalVentas += 1;
        acc.saldoTotal += parseFloat(venta.saldo_actual);
        acc.abonosTotal += parseFloat(venta.total_abonado);

        if (venta.estado_venta === "Vencido") {
          acc.vencidas += 1;
          acc.perdidas += parseFloat(venta.perdida);
        }

        return acc;
      },
      {
        totalVentas: 0,
        saldoTotal: 0,
        abonosTotal: 0,
        vencidas: 0,
        perdidas: 0,
      }
    );
  };

  const summary = calculateSummary();

  // Formatear dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Navegar al detalle de venta
  const navigateToVentaDetail = (ventaId) => {
    router.push(`/dashboard/ventas/${ventaId}`);
  };

  // Estado con color
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Vigente":
        return "bg-green-100 text-green-800";
      case "Atrasado":
        return "bg-yellow-100 text-yellow-800";
      case "Vencido":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Cargando ventas activas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 rounded-xl p-6 text-center">
          <FiAlertCircle className="mx-auto text-red-500 text-4xl mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Error al cargar las ventas
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchVentas}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiShoppingBag className="mr-2 text-indigo-600" />
              Ventas Activas
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de créditos activos en {selectedStore.tienda.nombre}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/ventas/nueva")}
            className="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <FiPlus className="mr-2" />
            Nueva Venta
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Ventas
              </h3>
              <FiShoppingBag className="text-indigo-500" />
            </div>
            <p className="mt-1 text-2xl font-bold">{summary.totalVentas}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">Saldo Total</h3>
              <FiDollarSign className="text-green-500" />
            </div>
            <p className="mt-1 text-2xl font-bold">
              {formatMoney(summary.saldoTotal)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Abonos Total
              </h3>
              <FiTrendingUp className="text-blue-500" />
            </div>
            <p className="mt-1 text-2xl font-bold">
              {formatMoney(summary.abonosTotal)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Ventas Vencidas
              </h3>
              <FiClock className="text-red-500" />
            </div>
            <p className="mt-1 text-2xl font-bold">{summary.vencidas}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">
                Pérdidas Potenciales
              </h3>
              <FiTrendingDown className="text-purple-500" />
            </div>
            <p className="mt-1 text-2xl font-bold">
              {formatMoney(summary.perdidas)}
            </p>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cliente o ID de venta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) =>
                  setFilters({ ...filters, estado: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Todos">Todos</option>
                <option value="Vigente">Vigente</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Vencido">Vencido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de ventas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cliente
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha Venta
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Valor Venta
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Saldo Actual
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Días Atrasados
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVentas.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No se encontraron ventas activas
                    </td>
                  </tr>
                ) : (
                  filteredVentas.map((venta) => (
                    <tr
                      key={venta.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigateToVentaDetail(venta.id)}
                    >
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {venta.cliente.nombres} {venta.cliente.apellidos}
                            </div>
                            <div className="text-sm text-gray-500">
                              {venta.cliente.telefono_principal ||
                                "Sin teléfono"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venta.fecha_venta}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatMoney(venta.valor_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span
                          className={
                            venta.saldo_actual > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {formatMoney(venta.saldo_actual)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(
                            venta.estado_venta
                          )}`}
                        >
                          {venta.estado_venta}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venta.dias_atrasados > 0 ? (
                          <span className="text-red-600 font-medium">
                            {Math.round(venta.dias_atrasados)} días
                          </span>
                        ) : venta.dias_atrasados < 0 ? (
                          <span className="text-green-600 font-medium">
                            {parseInt(venta.dias_atrasados) * -1} días
                          </span>
                        ) : (
                          <span className="text-gray-500">En plazo</span>
                        )}
                      </td>
                     
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Distribución por Estado
            </h3>
            <div className="space-y-3">
              {["Vigente", "Atrasado", "Vencido"].map((estado) => {
                const count = filteredVentas.filter(
                  (v) => v.estado_venta === estado
                ).length;
                const percentage =
                  filteredVentas.length > 0
                    ? ((count / filteredVentas.length) * 100).toFixed(1)
                    : 0;

                return (
                  <div key={estado}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {estado}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          getEstadoColor(estado).split(" ")[0]
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resumen Financiero
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500">Valor Total de Ventas</p>
                <p className="text-xl font-bold">
                  {formatMoney(
                    filteredVentas.reduce(
                      (sum, v) => sum + parseFloat(v.valor_venta),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500">Interés Total Generado</p>
                <p className="text-xl font-bold text-green-600">
                  {formatMoney(
                    filteredVentas.reduce(
                      (sum, v) =>
                        sum +
                        (parseFloat(v.total_a_pagar) -
                          parseFloat(v.valor_venta)),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500">Total Abonado</p>
                <p className="text-xl font-bold">
                  {formatMoney(
                    filteredVentas.reduce(
                      (sum, v) => sum + parseFloat(v.total_abonado),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500">Pérdidas Potenciales</p>
                <p className="text-xl font-bold text-red-600">
                  {summary.perdidas > 0 ? formatMoney(summary.perdidas) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

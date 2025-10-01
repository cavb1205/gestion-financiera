// app/dashboard/reportes/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiPieChart,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart2,
  FiPercent,
} from "react-icons/fi";

export default function ReportesPage() {
  const { selectedStore, token } = useAuth();
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [datosReporte, setDatosReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [tienda, setTienda] = useState(null);

  // Función para ajustar fecha a la zona horaria local
  const ajustarFechaLocal = (fecha) => {
    const date = new Date(fecha);
    // Ajustar para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Establecer fechas por defecto (mes actual) - Corregido para zona horaria
  useEffect(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    setFechaInicio(ajustarFechaLocal(primerDiaMes));
    setFechaFin(ajustarFechaLocal(ultimoDiaMes));
  }, []);

  // Obtener datos de la tienda
  useEffect(() => {
    const fetchTienda = async () => {
      if (!selectedStore || !token) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tiendas/detail/admin/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const tiendaData = await response.json();
          setTienda(tiendaData);
        }
      } catch (error) {
        console.error("Error al obtener la tienda:", error);
      }
    };

    fetchTienda();
  }, [selectedStore, token]);

  const generarReporte = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setDatosReporte(null);

    try {
      // Validar que fechaInicio no sea mayor que fechaFin
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        throw new Error(
          "La fecha de inicio no puede ser mayor que la fecha de fin"
        );
      }

      console.log("Consultando con fechas:", { fechaInicio, fechaFin });

      // Obtener datos de ventas
      const ventasResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/list/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Obtener datos de gastos
      const gastosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gastos/list/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!ventasResponse.ok) {
        throw new Error(`Error en ventas: ${ventasResponse.status}`);
      }

      if (!gastosResponse.ok) {
        throw new Error(`Error en gastos: ${gastosResponse.status}`);
      }

      let ventasData = await ventasResponse.json();
      let gastosData = await gastosResponse.json();
      ventasData = Array.isArray(ventasData) ? ventasData : [];
      gastosData = Array.isArray(gastosData) ? gastosData : [];

      // Procesar y combinar datos
      const datosProcesados = procesarDatosReporte(ventasData, gastosData);
      setDatosReporte(datosProcesados);
    } catch (err) {
      setError(
        err.message ||
          "Error al generar el reporte. Por favor, verifica las fechas e intenta nuevamente."
      );
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const procesarDatosReporte = (ventas, gastos) => {
    // Crear objeto para agrupar por fecha
    const datosPorFecha = {};

    // Procesar ventas - usando fecha_venta como clave
    ventas.forEach((venta) => {
      const fecha = venta.fecha_venta;
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = {
          fecha,
          cantidadVentas: 0,
          totalVendido: 0, // valor_venta sin intereses
          interesesGenerados: 0, // total_a_pagar - valor_venta
          gastos: 0,
          perdidas: 0,
          utilidad: 0,
        };
      }

      datosPorFecha[fecha].cantidadVentas += 1;
      datosPorFecha[fecha].totalVendido += parseFloat(venta.valor_venta);

      // Calcular intereses generados (total_a_pagar - valor_venta)
      const intereses =
        parseFloat(venta.total_a_pagar) - parseFloat(venta.valor_venta);
      datosPorFecha[fecha].interesesGenerados += intereses;

      // Solo contar como pérdida si el estado es "Perdida"
      if (venta.estado_venta === "Perdida") {
        datosPorFecha[fecha].perdidas += parseFloat(venta.perdida);
      }
    });

    // Procesar gastos - usando fecha como clave
    gastos.forEach((gasto) => {
      const fecha = gasto.fecha;
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = {
          fecha,
          cantidadVentas: 0,
          totalVendido: 0,
          interesesGenerados: 0,
          gastos: 0,
          perdidas: 0,
          utilidad: 0,
        };
      }
      datosPorFecha[fecha].gastos += parseFloat(gasto.valor);
    });

    // Calcular utilidad por fecha (Intereses Generados - Gastos - Pérdidas)
    Object.keys(datosPorFecha).forEach((fecha) => {
      const datos = datosPorFecha[fecha];
      datos.utilidad = datos.interesesGenerados - datos.gastos - datos.perdidas;
    });

    // Filtrar solo las fechas que están dentro del rango solicitado
    const fechasFiltradas = Object.values(datosPorFecha).filter((fila) => {
      const fechaFila = new Date(fila.fecha);
      const fechaInicioObj = new Date(fechaInicio);
      const fechaFinObj = new Date(fechaFin);

      return fechaFila >= fechaInicioObj && fechaFila <= fechaFinObj;
    });

    // Ordenar por fecha (más reciente primero)
    return fechasFiltradas.sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
  };

  const exportarReporte = () => {
    if (!datosReporte) return;

    const csvContent = [
      [
        "Fecha",
        "Cantidad Ventas",
        "Total Vendido",
        "Intereses Generados",
        "Gastos",
        "Pérdidas",
        "Utilidad",
      ],
      ...datosReporte.map((row) => [
        row.fecha,
        row.cantidadVentas,
        `$${row.totalVendido.toLocaleString("es-CO")}`,
        `$${row.interesesGenerados.toLocaleString("es-CO")}`,
        `$${row.gastos.toLocaleString("es-CO")}`,
        `$${row.perdidas.toLocaleString("es-CO")}`,
        `$${row.utilidad.toLocaleString("es-CO")}`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte-${fechaInicio}-a-${fechaFin}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calcularTotales = () => {
    if (!datosReporte) return null;

    return datosReporte.reduce(
      (acc, curr) => ({
        cantidadVentas: acc.cantidadVentas + curr.cantidadVentas,
        totalVendido: acc.totalVendido + curr.totalVendido,
        interesesGenerados: acc.interesesGenerados + curr.interesesGenerados,
        gastos: acc.gastos + curr.gastos,
        perdidas: acc.perdidas + curr.perdidas,
        utilidad: acc.utilidad + curr.utilidad,
      }),
      {
        cantidadVentas: 0,
        totalVendido: 0,
        interesesGenerados: 0,
        gastos: 0,
        perdidas: 0,
        utilidad: 0,
      }
    );
  };

  const formatFecha = (fechaStr) => {
    return new Date(fechaStr).toLocaleDateString("es-ES", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calcular porcentaje de intereses sobre el total vendido
  const calcularPorcentajeIntereses = (intereses, totalVendido) => {
    if (totalVendido === 0) return 0;
    return ((intereses / totalVendido) * 100).toFixed(1);
  };

  if (!tienda) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="ml-4 text-gray-600 mt-3">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  // Calcular totales y porcentajes solo si hay datos del reporte
  const totales = datosReporte ? calcularTotales() : null;
  const porcentajeIntereses = totales
    ? calcularPorcentajeIntereses(
        totales.interesesGenerados,
        totales.totalVendido
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiBarChart2 className="mr-3 text-indigo-600" />
            Reportes Financieros
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta y analiza los movimientos de tu tienda por período
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 flex items-center">
              <FiAlertCircle className="mr-2" />
              <strong>Período consultado:</strong> {fechaInicio} al {fechaFin}
            </p>
          </div>
        </div>

        {/* Formulario de fechas */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={generarReporte} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FiCalendar className="inline mr-2 text-indigo-600" />
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FiCalendar className="inline mr-2 text-indigo-600" />
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center font-medium shadow-md transition-colors"
                >
                  {cargando ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FiPieChart className="mr-2" />
                      Generar Reporte
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-start">
            <FiAlertCircle className="text-red-600 text-xl mr-3 mt-0.5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {datosReporte && totales && (
          <>
            {/* Resumen de totales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Vendido
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${totales.totalVendido.toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Capital de ventas
                    </p>
                  </div>
                  <FiDollarSign className="text-green-500 text-2xl" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Ventas Totales
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totales.cantidadVentas}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cantidad de ventas
                    </p>
                  </div>
                  <FiShoppingCart className="text-blue-500 text-2xl" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Intereses Generados
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${totales.interesesGenerados.toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {porcentajeIntereses}% sobre ventas
                    </p>
                  </div>
                  <FiPercent className="text-amber-500 text-2xl" />
                </div>
              </div>

              <div
                className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                  totales.utilidad >= 0 ? "border-green-500" : "border-red-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Utilidad Neta
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        totales.utilidad >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${totales.utilidad.toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totales.utilidad >= 0 ? "Ganancia" : "Pérdida"}
                    </p>
                  </div>
                  {totales.utilidad >= 0 ? (
                    <FiTrendingUp className="text-green-500 text-2xl" />
                  ) : (
                    <FiTrendingDown className="text-red-500 text-2xl" />
                  )}
                </div>
              </div>
            </div>

            {/* Tabla de reportes */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FiCheckCircle className="mr-2 text-indigo-600" />
                  Detalle por Fecha ({datosReporte.length} días con movimientos)
                </h3>
                <button
                  onClick={exportarReporte}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm font-medium"
                >
                  <FiDownload className="mr-2" />
                  Exportar CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ventas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Vendido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Intereses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Gastos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Pérdidas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Utilidad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosReporte.map((fila, index) => {
                      const porcentajeInteresesFila =
                        calcularPorcentajeIntereses(
                          fila.interesesGenerados,
                          fila.totalVendido
                        );
                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {fila.fecha}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-semibold">
                            {fila.cantidadVentas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-semibold">
                            ${fila.totalVendido.toLocaleString("es-CO")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-amber-700 font-semibold">
                              ${fila.interesesGenerados.toLocaleString("es-CO")}
                            </div>
                            <div className="text-xs text-amber-600">
                              {porcentajeInteresesFila}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 font-semibold">
                            ${fila.gastos.toLocaleString("es-CO")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-700 font-semibold">
                            ${fila.perdidas.toLocaleString("es-CO")}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                              fila.utilidad >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            ${fila.utilidad.toLocaleString("es-CO")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOTALES
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-800">
                        {totales.cantidadVentas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-800">
                        ${totales.totalVendido.toLocaleString("es-CO")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-amber-800">
                          ${totales.interesesGenerados.toLocaleString("es-CO")}
                        </div>
                        <div className="text-xs text-amber-700">
                          {porcentajeIntereses}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-800">
                        ${totales.gastos.toLocaleString("es-CO")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-800">
                        ${totales.perdidas.toLocaleString("es-CO")}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                          totales.utilidad >= 0
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        ${totales.utilidad.toLocaleString("es-CO")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Tarjeta de Análisis de Rentabilidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FiTrendingDown className="mr-2 text-red-500" />
                  Resumen de Egresos
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gastos Operativos:</span>
                    <span className="font-semibold text-red-700">
                      ${totales.gastos.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pérdidas por Ventas:</span>
                    <span className="font-semibold text-orange-700">
                      ${totales.perdidas.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">
                        Total Egresos:
                      </span>
                      <span className="font-bold text-red-800">
                        $
                        {(totales.gastos + totales.perdidas).toLocaleString(
                          "es-CO"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FiTrendingUp className="mr-2 text-green-500" />
                  Análisis de Rentabilidad
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Ingresos por Intereses:
                    </span>
                    <span className="font-semibold text-amber-700">
                      ${totales.interesesGenerados.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Margen de Intereses:</span>
                    <span className="font-semibold text-amber-700">
                      {porcentajeIntereses}%
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">
                        Utilidad Neta:
                      </span>
                      <span
                        className={`font-bold ${
                          totales.utilidad >= 0
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        ${totales.utilidad.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        Rentabilidad sobre intereses:
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          totales.interesesGenerados > 0
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {totales.interesesGenerados > 0
                          ? `${(
                              (totales.utilidad / totales.interesesGenerados) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-yellow-600 text-xl mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    Información sobre el período
                  </h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    El reporte muestra los movimientos entre{" "}
                    <strong>{fechaInicio}</strong> y <strong>{fechaFin}</strong>
                    .
                    {datosReporte.length === 0
                      ? " No se encontraron movimientos en este período."
                      : ` Se encontraron movimientos en ${datosReporte.length} días del período.`}
                  </p>
                </div>
              </div>
            </div>

            {datosReporte.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <FiAlertCircle className="mx-auto text-gray-400 text-4xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay datos
                </h3>
                <p className="text-gray-600">
                  No se encontraron movimientos para el período seleccionado.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

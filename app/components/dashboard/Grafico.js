import { useState, useEffect } from "react";
import {
  FiPieChart,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function GraficoDona({ data }) {
  const [activeTab, setActiveTab] = useState("mes");
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!data || !data.tienda) return;

    // Calcular datos según la pestaña activa
    let utilidad, gastos, perdidas, ventasNetas, aportes, retiros;

    switch (activeTab) {
      case "mes":
        aportes = data.tienda.aportes_mes || 0;
        gastos = data.tienda.gastos_mes || 0;
        retiros = data.tienda.utilidades_mes || 0;
        perdidas = 0;
        utilidad = data.tienda.utilidad_estimada_mes || 0;
        ventasNetas = data.tienda.ventas_netas_mes || 0;
        break;
      case "ano":
        aportes = data.tienda.aportes_ano || 0;
        gastos = data.tienda.gastos_ano || 0;
        utilidad = data.tienda.utilidad_estimada_ano || 0;
        perdidas = data.tienda.perdidas_ano || 0;
        retiros = data.tienda.utilidades_ano || 0;
        ventasNetas = data.tienda.ventas_netas_ano || 0;
        break;
      default:
        // En general, usamos utilidad real (ingresos por ventas finalizadas)
        utilidad = data.tienda.ingresos_ventas_finalizadas || 0;
        aportes = data.tienda.inversion || 0;
        gastos = data.tienda.gastos || 0;
        retiros = data.tienda.utilidades || 0;
        perdidas = data.tienda.perdidas || 0;
        ventasNetas = data.tienda.ventas_netas || 0;
    }

    // Calcular beneficio neto
    const beneficioNeto = utilidad - gastos - perdidas;

    // Colores profesionales para el gráfico
    const colors = {
      utilidad: "rgba(16, 185, 129, 0.9)",      // Verde para utilidades
      gastos: "rgba(239, 68, 68, 0.9)",         // Rojo para gastos
      retiros: "rgba(139, 92, 246, 0.9)",       // Morado para retiros
      perdidas: "rgba(220, 38, 38, 0.9)",       // Rojo oscuro para pérdidas
      aportes: "rgba(59, 130, 246, 0.9)"        // Azul para aportes
    };

    // Determinar la etiqueta de utilidad según la pestaña
    const utilidadLabel = activeTab === "general" ? "Utilidad Real" : "Utilidad Estimada";

    // Datos para el gráfico de dona
    const chartDataConfig = {
      labels: [utilidadLabel, "Gastos", "Retiros Socios", "Pérdidas", "Aportes"],
      datasets: [
        {
          data: [utilidad, gastos, retiros, perdidas, aportes],
          backgroundColor: [
            colors.utilidad,
            colors.gastos,
            colors.retiros,
            colors.perdidas,
            colors.aportes
          ],
          borderColor: [
            "rgba(16, 185, 129, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(220, 38, 38, 1)",
            "rgba(59, 130, 246, 1)"
          ],
          borderWidth: 1,
        },
      ],
    };

    setChartData({
      chartData: chartDataConfig,
      utilidad,
      gastos,
      retiros,
      perdidas,
      beneficioNeto,
      ventasNetas,
      margen: utilidad > 0 ? (beneficioNeto / utilidad) * 100 : 0,
      utilidadLabel
    });
  }, [data, activeTab]);

  if (!chartData) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="ml-4 text-gray-600 mt-3">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            label += "$" + context.raw.toLocaleString();
            return label;
          },
        },
      },
    },
  };

  // Función para formatear números en millones o miles
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "$0";
    
    const numValue = parseFloat(value);
    if (numValue >= 1000000) {
      return "$" + (numValue / 1000000).toFixed(1) + "M";
    } else if (numValue >= 1000) {
      return "$" + (numValue / 1000).toFixed(1) + "K";
    }
    return "$" + numValue.toFixed(0);
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiPieChart className="mr-2 text-indigo-600" />
          Resumen Financiero
        </h2>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === "mes" 
                ? "bg-white shadow-sm text-indigo-700 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("mes")}
          >
            Mes
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === "ano" 
                ? "bg-white shadow-sm text-indigo-700 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("ano")}
          >
            Año
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === "general" 
                ? "bg-white shadow-sm text-indigo-700 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de dona */}
        <div className="h-72">
          <Doughnut data={chartData.chartData} options={options} />
        </div>

        {/* Información detallada */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">
            Resumen{" "}
            {activeTab === "mes"
              ? "del Mes"
              : activeTab === "ano"
              ? "del Año"
              : "General"}
          </h3>

          <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{chartData.utilidadLabel}:</span>
              <span className="font-semibold text-green-700">
                {formatCurrency(chartData.utilidad)}
              </span>
            </div>
            {activeTab !== "general" && (
              <div className="text-xs text-gray-500 mt-1">
                Proyección basada en ventas activas
              </div>
            )}
          </div>

          <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gastos:</span>
              <span className="font-semibold text-red-700">
                {formatCurrency(chartData.gastos)}
              </span>
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Retiros Socios:</span>
              <span className="font-semibold text-purple-700">
                {formatCurrency(chartData.retiros)}
              </span>
            </div>
          </div>

          {chartData.perdidas > 0 && (
            <div className="bg-red-100 p-3 rounded-lg border-l-4 border-red-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pérdidas:</span>
                <span className="font-semibold text-red-800">
                  {formatCurrency(chartData.perdidas)}
                </span>
              </div>
            </div>
          )}

          <div
            className={`p-3 rounded-lg border-l-4 ${
              chartData.beneficioNeto >= 0 
                ? "bg-green-50 border-green-500" 
                : "bg-red-50 border-red-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Beneficio Neto:</span>
              <span
                className={`font-semibold ${
                  chartData.beneficioNeto >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {formatCurrency(chartData.beneficioNeto)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Margen: {chartData.margen.toFixed(1)}%
            </div>
          </div>

          {chartData.beneficioNeto >= 0 ? (
            <div className="flex items-center text-green-600 text-sm">
              <FiTrendingUp className="mr-1" />
              <span>Rentabilidad positiva</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600 text-sm">
              <FiTrendingDown className="mr-1" />
              <span>Rentabilidad negativa</span>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Ventas Netas:</span>
            <span className="font-semibold">
              {formatCurrency(chartData.ventasNetas)}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Inversión Total:</span>
            <span className="font-semibold">
              {formatCurrency(data.tienda.inversion)}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Liquidez Actual:</span>
            <span className="font-semibold">{formatCurrency(data.caja)}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Por Cobrar:</span>
            <span className="font-semibold">
              {formatCurrency(data.tienda.dinero_x_cobrar)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
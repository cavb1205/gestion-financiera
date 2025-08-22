// app/components/dashboard/ResumenMes.js
"use client";

import {
  FiBarChart2,
  FiCreditCard,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiPieChart,
  FiDollarSign,
} from "react-icons/fi";
import { useState } from "react";

export default function ResumenMes({ tienda, loading = false }) {
  const [showTooltip, setShowTooltip] = useState(null);

  // Calcular utilidades mensuales (20% de ventas netas menos gastos)
  const utilidadesMes = tienda
    ? tienda.tienda.ventas_netas_mes * 0.2 - tienda.tienda.gastos_mes
    : 0;

  // Calcular margen de utilidad mensual
  const margenUtilidadMes =
    tienda && tienda.tienda.ventas_netas_mes > 0
      ? (utilidadesMes / tienda.tienda.ventas_netas_mes) * 100
      : 0;

  // Obtener el nombre del mes actual
  const obtenerNombreMes = () => {
    return new Date().toLocaleDateString("es-ES", { month: "long" });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex justify-between items-center">
              <div className="w-2/3">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FiBarChart2 className="mr-2 text-blue-500" />
          Resumen del Mes
          <div
            className="ml-2 relative"
            onMouseEnter={() => setShowTooltip("resumen")}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <FiInfo className="text-gray-400 text-sm cursor-help" />
            {showTooltip === "resumen" && (
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                Resumen financiero del mes actual. Incluye ingresos, gastos y
                utilidades.
              </div>
            )}
          </div>
        </h2>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs capitalize">
          {obtenerNombreMes()}
        </div>
      </div>

      <div className="space-y-4">
        {/* Ventas netas del mes */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-gray-500 text-sm flex items-center">
              Ventas netas
              <div
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip("ventas")}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === "ventas" && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Total de ventas del mes después de descuentos y
                    devoluciones.
                  </div>
                )}
              </div>
            </h3>
            <p className="text-xl font-bold text-blue-600">
              ${tienda.tienda.ventas_netas_mes?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiTrendingUp className="text-blue-500 text-xl" />
          </div>
        </div>

        {/* Gastos del mes */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-gray-500 text-sm flex items-center">
              Gastos
              <div
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip("gastos")}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === "gastos" && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Costos operativos y gastos incurridos durante el mes.
                  </div>
                )}
              </div>
            </h3>
            <p className="text-xl font-bold text-red-600">
              ${tienda.tienda.gastos_mes?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-2 bg-red-100 rounded-lg">
            <FiTrendingDown className="text-red-500 text-xl" />
          </div>
        </div>

        {/* Utilidades del mes */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <h3 className="text-gray-500 text-sm flex items-center">
              Utilidad del mes
              <div
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip("utilidad")}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === "utilidad" && (
                  <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Ganancia neta mensual (20% de las ventas netas menos
                    gastos).
                  </div>
                )}
              </div>
            </h3>
            <p
              className={`text-xl font-bold ${
                utilidadesMes >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${utilidadesMes.toLocaleString()}
            </p>
            {margenUtilidadMes !== 0 && (
              <span
                className={`text-xs ${
                  margenUtilidadMes >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {margenUtilidadMes >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(margenUtilidadMes).toFixed(1)}% de margen
              </span>
            )}
          </div>
          <div
            className={`p-2 rounded-lg ${
              utilidadesMes >= 0 ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {utilidadesMes >= 0 ? (
              <FiTrendingUp className="text-green-500 text-xl" />
            ) : (
              <FiTrendingDown className="text-red-500 text-xl" />
            )}
          </div>
        </div>

        {/* Aportes del mes (solo si son mayores a 0) */}
        {tienda.tienda.aportes_mes > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div>
              <h3 className="text-gray-500 text-sm flex items-center">
                Aportes de capital
                <div
                  className="ml-1 relative"
                  onMouseEnter={() => setShowTooltip("aportes")}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <FiInfo className="text-gray-400 text-xs cursor-help" />
                  {showTooltip === "aportes" && (
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                      Inyecciones de capital realizadas durante el mes.
                    </div>
                  )}
                </div>
              </h3>
              <p className="text-xl font-bold text-purple-600">
                ${tienda.tienda.aportes_mes.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiCreditCard className="text-purple-500 text-xl" />
            </div>
          </div>
        )}

        {/* Comparación con mes anterior (si los datos están disponibles) */}
        {tienda.tienda.utilidades_mes !== undefined && (
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-gray-500 text-sm mb-1">
              Comparación con mes anterior CORREGIR
            </h3>
            <div className="flex items-center">
              {utilidadesMes > tienda.tienda.utilidades_mes ? (
                <>
                  <FiTrendingUp className="text-green-500 mr-1" />
                  <span className="text-green-600 text-sm">
                    +
                    {(
                      ((utilidadesMes - tienda.tienda.utilidades_mes) /
                        tienda.tienda.utilidades_mes) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </>
              ) : (
                <>
                  <FiTrendingDown className="text-red-500 mr-1" />
                  <span className="text-red-600 text-sm">
                    {(
                      ((utilidadesMes - tienda.tienda.utilidades_mes) /
                        tienda.tienda.utilidades_mes) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

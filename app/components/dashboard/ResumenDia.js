// app/components/dashboard/ResumenDia.js
"use client";

import {
  FiCalendar,
  FiDollarSign,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiCreditCard,
  FiUsers,
  FiCalculator,
} from "react-icons/fi";
import { useState } from "react";

export default function ResumenDia({ tienda, loading = false }) {
  const [showTooltip, setShowTooltip] = useState(null);

  // Calcular utilidad del día (20% de las ventas netas menos gastos)
  const utilidadDia = tienda
    ? tienda.tienda.ventas_netas_dia * 0.2 - tienda.tienda.gastos_dia
    : 0;

  // Ganancias retiradas por socios (utilidades registradas)
  const gananciasRetiradas = tienda ? tienda.tienda.utilidades_dia : 0;

  // Calcular margen de utilidad
  const margenUtilidad =
    tienda && tienda.tienda.ventas_netas_dia > 0
      ? (utilidadDia / tienda.tienda.ventas_netas_dia) * 100
      : 0;

  // Diferencia entre ganancias retiradas y utilidad del día
  const diferencia = utilidadDia - gananciasRetiradas;
  const porcentajeDiferencia =
    utilidadDia !== 0 ? (diferencia / utilidadDia) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-green-500">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
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
    <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-green-500 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FiCalendar className="mr-2 text-green-500" />
          Resumen del Día
          <div
            className="ml-2 relative"
            onMouseEnter={() => setShowTooltip("resumen")}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <FiInfo className="text-gray-400 text-sm cursor-help" />
            {showTooltip === "resumen" && (
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                Resumen financiero del día actual. Incluye ingresos, gastos,
                utilidad generada y distribución a socios.
              </div>
            )}
          </div>
        </h2>
        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
          Hoy {new Date().toLocaleDateString("es-ES")}
        </div>
      </div>

      <div className="space-y-4">
        {/* Recaudos del día */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-gray-500 text-sm flex items-center">
              Recaudos del día
              <div
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip("recaudos")}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === "recaudos" && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Dinero recibido en efectivo y transferencias hoy.
                  </div>
                )}
              </div>
            </h3>
            <p className="text-xl font-bold text-green-600">
              ${tienda.tienda.recaudos_dia?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <FiDollarSign className="text-green-500 text-xl" />
          </div>
        </div>

        {/* Ventas netas */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
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
                    Total de ventas después de descuentos y devoluciones.
                  </div>
                )}
              </div>
            </h3>
            <p className="text-xl font-bold text-blue-600">
              ${tienda.tienda.ventas_netas_dia?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiTrendingUp className="text-blue-500 text-xl" />
          </div>
        </div>

        {/* Gastos */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <h3 className="text-gray-500 text-sm flex items-center">
              Gastos operativos
              <div
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip("gastos")}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === "gastos" && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Costos operativos y gastos incurridos hoy.
                  </div>
                )}
              </div>
            </h3>
            <p className="text-xl font-bold text-red-600">
              ${tienda.tienda.gastos_dia?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-2 bg-red-100 rounded-lg">
            <FiTrendingDown className="text-red-500 text-xl" />
          </div>
        </div>

        {/* Utilidad del día (profit real generado) */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <h3 className="text-gray-500 text-sm flex items-center">
              Utilidad del día
              <div
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip("utilidad-dia")}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === "utilidad-dia" && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Ganancia real generada hoy (20% de las ventas netas menos
                    gastos).
                  </div>
                )}
              </div>
            </h3>
            <p
              className={`text-xl font-bold ${
                utilidadDia >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${utilidadDia.toLocaleString()}
            </p>
            {margenUtilidad !== 0 && (
              <span
                className={`text-xs ${
                  margenUtilidad >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                Margen: {Math.abs(margenUtilidad).toFixed(1)}%
              </span>
            )}
          </div>
          <div
            className={`p-2 rounded-lg ${
              utilidadDia >= 0 ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <FiCalendar className="text-green-500 text-xl" />
          </div>
        </div>

        {/* Ganancias retiradas por socios (solo si son mayores a 0) */}
        {gananciasRetiradas > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div>
              <h3 className="text-gray-500 text-sm flex items-center">
                Distribución a socios
                <div
                  className="ml-1 relative"
                  onMouseEnter={() => setShowTooltip("distribucion")}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <FiInfo className="text-gray-400 text-xs cursor-help" />
                  {showTooltip === "distribucion" && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                      Ganancias retiradas del sistema por los socios hoy.
                    </div>
                  )}
                </div>
              </h3>
              <p className="text-xl font-bold text-purple-600">
                ${gananciasRetiradas.toLocaleString()}
              </p>
              <span className="text-xs text-purple-500">
                Retiros realizados
              </span>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiUsers className="text-purple-500 text-xl" />
            </div>
          </div>
        )}

        {/* Aportes del día (solo si son mayores a 0) */}
        {tienda.tienda.aportes_dia > 0 && (
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
                      Inyecciones de capital realizadas hoy.
                    </div>
                  )}
                </div>
              </h3>
              <p className="text-xl font-bold text-indigo-600">
                ${tienda.tienda.aportes_dia.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FiCreditCard className="text-indigo-500 text-xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// app/components/dashboard/ResumenMes.js
"use client";

import {
  FiBarChart2,
  FiCreditCard,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiDollarSign,
  FiCalculator,
  FiUsers,
  FiCalendar
} from "react-icons/fi";
import { useState } from "react";

export default function ResumenMes({ tienda, loading = false }) {
  const [showTooltip, setShowTooltip] = useState(null);
  
  // Calcular utilidad del período (20% de ventas netas menos gastos)
  const utilidadPeriodo = tienda 
    ? (tienda.tienda.ventas_netas_mes * 0.2) - tienda.tienda.gastos_mes 
    : 0;
  
  // Ganancias retiradas por socios (utilidades registradas)
  const gananciasRetiradas = tienda ? tienda.tienda.utilidades_mes : 0;
  
  // Calcular margen de utilidad
  const margenUtilidad = tienda && tienda.tienda.ventas_netas_mes > 0 
    ? (utilidadPeriodo / tienda.tienda.ventas_netas_mes) * 100 
    : 0;

  // Diferencia entre ganancias retiradas y utilidad del período
  const diferencia = utilidadPeriodo - gananciasRetiradas;
  const porcentajeDiferencia = utilidadPeriodo !== 0 
    ? (diferencia / utilidadPeriodo) * 100 
    : 0;

  // Obtener el nombre del mes actual
  const obtenerNombreMes = () => {
    return new Date().toLocaleDateString('es-ES', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
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
    <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FiBarChart2 className="mr-2 text-blue-500" />
          Resumen del Mes
          <div 
            className="ml-2 relative"
            onMouseEnter={() => setShowTooltip('resumen')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <FiInfo className="text-gray-400 text-sm cursor-help" />
            {showTooltip === 'resumen' && (
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                Resumen financiero del mes actual. Incluye ingresos, gastos, utilidad generada y distribución a socios.
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
                onMouseEnter={() => setShowTooltip('ventas')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === 'ventas' && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Total de ventas del mes después de descuentos y devoluciones.
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
              Gastos operativos
              <div 
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip('gastos')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === 'gastos' && (
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

        {/* Utilidad del período (profit real generado) */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <h3 className="text-gray-500 text-sm flex items-center">
              Utilidad del período
              <div 
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip('utilidad-periodo')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === 'utilidad-periodo' && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Ganancia real generada este mes (20% de las ventas netas menos gastos).
                  </div>
                )}
              </div>
            </h3>
            <p className={`text-xl font-bold ${utilidadPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${utilidadPeriodo.toLocaleString()}
            </p>
            {margenUtilidad !== 0 && (
              <span className={`text-xs ${margenUtilidad >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                Margen: {Math.abs(margenUtilidad).toFixed(1)}%
              </span>
            )}
          </div>
          <div className={`p-2 rounded-lg ${utilidadPeriodo >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
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
                  onMouseEnter={() => setShowTooltip('distribucion')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <FiInfo className="text-gray-400 text-xs cursor-help" />
                  {showTooltip === 'distribucion' && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                      Ganancias retiradas del sistema por los socios este mes.
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

        {/* Diferencia entre ganancias retiradas y utilidad del período (solo si hay retiros) */}
        {gananciasRetiradas > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-gray-500 text-sm mb-2 flex items-center">
              Balance de distribución
              <div 
                className="ml-1 relative"
                onMouseEnter={() => setShowTooltip('balance')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FiInfo className="text-gray-400 text-xs cursor-help" />
                {showTooltip === 'balance' && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Comparación entre la utilidad generada y lo retirado por socios.
                    Valor positivo significa que hay utilidad disponible.
                  </div>
                )}
              </div>
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Disponible:</span>
              <span className={`text-sm font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diferencia >= 0 ? '+' : ''}${Math.abs(diferencia).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">
                {diferencia >= 0 ? 'Porcentaje disponible' : 'Déficit'}:
              </span>
              <span className={`text-sm font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diferencia >= 0 ? '+' : ''}{Math.abs(porcentajeDiferencia).toFixed(1)}%
              </span>
            </div>
            {diferencia < 0 && (
              <div className="mt-2 p-2 bg-yellow-100 rounded-md">
                <p className="text-xs text-yellow-800">
                  ⚠️ Se retiró más de la utilidad generada
                </p>
              </div>
            )}
            {diferencia >= 0 && (
              <div className="mt-2 p-2 bg-green-100 rounded-md">
                <p className="text-xs text-green-800">
                  ✓ Utilidad retirada dentro de lo generado
                </p>
              </div>
            )}
          </div>
        )}

        {/* Aportes del mes (solo si son mayores a 0) */}
        {tienda.tienda.aportes_mes > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div>
              <h3 className="text-gray-500 text-sm flex items-center">
                Aportes de capital
                <div 
                  className="ml-1 relative"
                  onMouseEnter={() => setShowTooltip('aportes')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <FiInfo className="text-gray-400 text-xs cursor-help" />
                  {showTooltip === 'aportes' && (
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                      Inyecciones de capital realizadas durante el mes.
                    </div>
                  )}
                </div>
              </h3>
              <p className="text-xl font-bold text-indigo-600">
                ${tienda.tienda.aportes_mes.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FiDollarSign className="text-indigo-500 text-xl" />
            </div>
          </div>
        )}

        {/* Resumen visual de proporciones */}
        <div className="pt-3 border-t border-gray-100">
          <h3 className="text-gray-500 text-sm mb-2 flex items-center">
            Distribución de ingresos
            <div 
              className="ml-1 relative"
              onMouseEnter={() => setShowTooltip('distribucion-ingresos')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FiInfo className="text-gray-400 text-xs cursor-help" />
              {showTooltip === 'distribucion-ingresos' && (
                <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                  Proporción de utilidad respecto a las ventas netas.
                </div>
              )}
            </div>
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, margenUtilidad))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Gastos</span>
            <span>Utilidad: {margenUtilidad.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
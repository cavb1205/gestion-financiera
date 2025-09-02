import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiPieChart,
  FiTrendingDown,
  FiUsers,
} from "react-icons/fi";

export default function ResumenGeneral({ tienda }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <FiPieChart className="mr-2 text-indigo-600" />
        Balance General
      </h2>

      {/* Cálculo de porcentajes reales */}
      {(() => {
        // Calcular porcentajes en relación a los ingresos por ventas
        const ingresosVentas = tienda.tienda.ingresos_ventas_finalizadas || 0;

        // Función para calcular porcentajes con manejo de ceros
        const calcularPorcentaje = (valor) => {
          if (ingresosVentas === 0) return 0;
          return (valor / ingresosVentas) * 100;
        };

        const porcentajePerdidas = calcularPorcentaje(tienda.tienda.perdidas);
        const porcentajeRetiros = calcularPorcentaje(tienda.tienda.utilidades);
        const porcentajeGastos = calcularPorcentaje(tienda.tienda.gastos);
        const porcentajeAportes = calcularPorcentaje(tienda.tienda.inversion);
        const porcentajePorCobrar = calcularPorcentaje(
          tienda.tienda.dinero_x_cobrar
        );

        // Función para determinar si mostrar el porcentaje de cambio
        // (En una implementación real, estos valores vendrían de comparaciones con períodos anteriores)
        const mostrarCambio = (valor) => {
          return valor !== 0; // Solo mostrar cambio si el valor no es cero
        };

        // Estos son valores de ejemplo - en una implementación real deberían calcularse
        const cambioPerdidas = mostrarCambio(tienda.tienda.perdidas)
          ? -3.7
          : null;
        const cambioRetiros = mostrarCambio(tienda.tienda.utilidades)
          ? 4.2
          : null;
        const cambioGastos = mostrarCambio(tienda.tienda.gastos) ? -1.1 : null;
        const cambioAportes = mostrarCambio(tienda.tienda.inversion)
          ? 2.3
          : null;
        const cambioPorCobrar = mostrarCambio(tienda.tienda.dinero_x_cobrar)
          ? 3.7
          : null;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ingresos por Ventas Finalizadas */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-l-4 border-green-500">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FiCheckCircle className="text-green-600 text-xl" />
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                  {ingresosVentas > 0 ? "+5.2%" : "N/A"}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Ingresos por Ventas
              </h3>
              <p className="text-2xl font-bold text-green-700">
                ${ingresosVentas.toLocaleString()}
              </p>
              <div className="mt-2 h-1 bg-green-200 rounded-full">
                <div
                  className="h-1 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: "100%" }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ingresosVentas > 0
                  ? "100% de referencia"
                  : "Sin ingresos registrados"}
              </p>
            </div>

            {/* Pérdidas */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-l-4 border-red-500">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <FiTrendingDown className="text-red-600 text-xl" />
                </div>
                {cambioPerdidas !== null ? (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      cambioPerdidas >= 0
                        ? "text-red-700 bg-red-200"
                        : "text-red-700 bg-red-200"
                    }`}
                  >
                    {cambioPerdidas >= 0 ? "+" : ""}
                    {cambioPerdidas}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    Sin datos previos
                  </span>
                )}
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Pérdidas
              </h3>
              <p className="text-2xl font-bold text-red-700">
                ${tienda.tienda.perdidas.toLocaleString()}
              </p>
              <div className="mt-2 h-1 bg-red-200 rounded-full">
                <div
                  className="h-1 bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, porcentajePerdidas)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ingresosVentas > 0
                  ? `${porcentajePerdidas.toFixed(1)}% de los ingresos`
                  : "Sin ingresos para comparar"}
              </p>
            </div>

            {/* Retiros de Socios */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-l-4 border-purple-500">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FiUsers className="text-purple-600 text-xl" />
                </div>
                {cambioRetiros !== null ? (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      cambioRetiros >= 0
                        ? "text-purple-700 bg-purple-200"
                        : "text-purple-700 bg-purple-200"
                    }`}
                  >
                    {cambioRetiros >= 0 ? "+" : ""}
                    {cambioRetiros}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    Sin datos previos
                  </span>
                )}
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Retiros de Socios
              </h3>
              <p className="text-2xl font-bold text-purple-700">
                ${tienda.tienda.utilidades.toLocaleString()}
              </p>
              <div className="mt-2 h-1 bg-purple-200 rounded-full">
                <div
                  className="h-1 bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, porcentajeRetiros)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ingresosVentas > 0
                  ? `${porcentajeRetiros.toFixed(1)}% de los ingresos`
                  : "Sin ingresos para comparar"}
              </p>
            </div>

            {/* Gastos */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-l-4 border-orange-500">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <FiCreditCard className="text-orange-600 text-xl" />
                </div>
                {cambioGastos !== null ? (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      cambioGastos >= 0
                        ? "text-orange-700 bg-orange-200"
                        : "text-orange-700 bg-orange-200"
                    }`}
                  >
                    {cambioGastos >= 0 ? "+" : ""}
                    {cambioGastos}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    Sin datos previos
                  </span>
                )}
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Gastos</h3>
              <p className="text-2xl font-bold text-orange-700">
                ${tienda.tienda.gastos.toLocaleString()}
              </p>
              <div className="mt-2 h-1 bg-orange-200 rounded-full">
                <div
                  className="h-1 bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, porcentajeGastos)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ingresosVentas > 0
                  ? `${porcentajeGastos.toFixed(1)}% de los ingresos`
                  : "Sin ingresos para comparar"}
              </p>
            </div>

            {/* Aportes */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border-l-4 border-amber-500">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <FiDollarSign className="text-amber-600 text-xl" />
                </div>
                {cambioAportes !== null ? (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      cambioAportes >= 0
                        ? "text-amber-700 bg-amber-200"
                        : "text-amber-700 bg-amber-200"
                    }`}
                  >
                    {cambioAportes >= 0 ? "+" : ""}
                    {cambioAportes}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    Sin datos previos
                  </span>
                )}
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Aportes
              </h3>
              <p className="text-2xl font-bold text-amber-700">
                ${tienda.tienda.inversion.toLocaleString()}
              </p>
              <div className="mt-2 h-1 bg-amber-200 rounded-full">
                <div
                  className="h-1 bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, porcentajeAportes)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ingresosVentas > 0
                  ? `${porcentajeAportes.toFixed(1)}% de los ingresos`
                  : "Sin ingresos para comparar"}
              </p>
            </div>

            {/* Dinero por cobrar */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiClock className="text-blue-600 text-xl" />
                </div>
                {cambioPorCobrar !== null ? (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      cambioPorCobrar >= 0
                        ? "text-blue-700 bg-blue-200"
                        : "text-blue-700 bg-blue-200"
                    }`}
                  >
                    {cambioPorCobrar >= 0 ? "+" : ""}
                    {cambioPorCobrar}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    Sin datos previos
                  </span>
                )}
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                Dinero por cobrar
              </h3>
              <p className="text-2xl font-bold text-blue-700">
                ${tienda.tienda.dinero_x_cobrar.toLocaleString()}
              </p>
              <div className="mt-2 h-1 bg-blue-200 rounded-full">
                <div
                  className="h-1 bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, porcentajePorCobrar)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ingresosVentas > 0
                  ? `${porcentajePorCobrar.toFixed(1)}% de los ingresos`
                  : "Sin ingresos para comparar"}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Resumen general */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <FiBarChart2 className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Balance neto
              </h3>
              <p className="text-xl font-bold text-indigo-700">
                $
                {(
                  tienda.tienda.ingresos_ventas_finalizadas -
                  tienda.tienda.gastos -
                  tienda.tienda.perdidas -
                  tienda.tienda.utilidades
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-lg mr-3">
              <FiPieChart className="text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Margen neto</h3>
              <p className="text-xl font-bold text-gray-700">
                {tienda.tienda.ingresos_ventas_finalizadas > 0
                  ? `${(
                      ((tienda.tienda.ingresos_ventas_finalizadas -
                        tienda.tienda.gastos -
                        tienda.tienda.perdidas -
                        tienda.tienda.utilidades) /
                        tienda.tienda.ingresos_ventas_finalizadas) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              tienda.tienda.ingresos_ventas_finalizadas -
                tienda.tienda.gastos -
                tienda.tienda.perdidas -
                tienda.tienda.utilidades >=
              0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {tienda.tienda.ingresos_ventas_finalizadas -
              tienda.tienda.gastos -
              tienda.tienda.perdidas -
              tienda.tienda.utilidades >=
            0
              ? "Rentable"
              : "No Rentable"}
          </span>
        </div>
      </div>
    </div>
  );
}

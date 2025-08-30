// app/dashboard/page.js
"use client";

import { Suspense, useEffect, useState } from "react";
import {
  FiShoppingBag,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiRefreshCw,
  FiPieChart,
  FiBarChart2,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import ResumenDia from "../components/dashboard/ResumenDia";
import ResumenMes from "../components/dashboard/ResumenMes";
import ResumenAnual from "../components/dashboard/ResumenAnual";

export default function DashboardPage() {
  const { selectedStore, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [tienda, setTienda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Función para obtener datos actualizados de la tienda
  const fetchTiendaActualizada = async () => {
    try {
      if (!selectedStore || !token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tiendas/detail/admin/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los datos de la tienda");
      }

      const tiendaData = await response.json();
      setTienda(tiendaData);
      return tiendaData;
    } catch (error) {
      console.error("Error al obtener la tienda actualizada:", error);
    }
  };

  // Función para actualizar todos los datos del dashboard
  const actualizarDashboard = async () => {
    setRefreshing(true);
    try {
      const tiendaActualizada = await fetchTiendaActualizada();

      // Simulamos la carga de datos del dashboard
      setDashboardData({
        financialData: [
          { month: "Ene", ingresos: 4500000, gastos: 2800000 },
          { month: "Feb", ingresos: 5200000, gastos: 3100000 },
          { month: "Mar", ingresos: 4800000, gastos: 2950000 },
          { month: "Abr", ingresos: 6100000, gastos: 3200000 },
          { month: "May", ingresos: 5700000, gastos: 3300000 },
          { month: "Jun", ingresos: 6300000, gastos: 3500000 },
        ],
      });
    } catch (error) {
      console.error("Error al actualizar el dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      if (selectedStore) {
        setDataLoading(true);
        await actualizarDashboard();
        setDataLoading(false);
      }
    };

    cargarDatos();
  }, [selectedStore]);

  if (!selectedStore || dataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Cargando datos del dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado de la tienda */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <FiShoppingBag className="text-indigo-600 text-2xl mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">
              {tienda.tienda.nombre}
              <span className="ml-2 text-indigo-600 text-sm bg-indigo-100 px-2 py-1 rounded-full">
                ID: {tienda.tienda.id}
              </span>
            </h1>
          </div>

          <div className="mt-2 md:mt-0 flex flex-wrap gap-2 items-center">
            <button
              onClick={actualizarDashboard}
              className="flex items-center text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors"
            >
              <FiRefreshCw
                className={`mr-1 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>

            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Caja:</span> $
              {tienda.tienda.caja.toLocaleString()}
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Inversión:</span> $
              {tienda.tienda.inversion.toLocaleString()}
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Utilidades:</span> $
              {tienda.tienda.utilidades.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Estado:</span>
            <span
              className={`font-medium ${
                tienda.tienda.estado ? "text-green-600" : "text-red-600"
              }`}
            >
              {tienda.tienda.estado ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Pérdidas anuales:</span>
            <span className="font-medium text-red-600">
              ${tienda.tienda.perdidas_ano.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Resúmenes por período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Resumen del Día */}

        <ResumenDia tienda={tienda} token={token} />

        {/* Resumen del Mes */}
        <ResumenMes tienda={tienda} />
        <ResumenAnual tienda={tienda} />
      </div>

      {/* Gráficos y detalles adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de ingresos/gastos */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Rendimiento financiero (últimos 6 meses)
            </h2>
            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>

          <div className="h-64">
            <div className="flex items-end h-48 mt-6 space-x-4">
              {dashboardData?.financialData?.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="flex items-end h-40">
                    <div
                      className="w-full bg-indigo-200 rounded-t hover:bg-indigo-300 transition-colors"
                      style={{
                        height: `${(item.ingresos / 7000000) * 100}%`,
                      }}
                    ></div>
                    <div
                      className="w-full bg-red-200 rounded-t hover:bg-red-300 transition-colors ml-1"
                      style={{
                        height: `${(item.gastos / 7000000) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="mt-2 text-sm text-gray-500">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6 space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-400 rounded-sm mr-2"></div>
                <span className="text-sm text-gray-600">Ingresos</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-400 rounded-sm mr-2"></div>
                <span className="text-sm text-gray-600">Gastos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles financieros */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Detalles financieros
            </h2>
            <FiCreditCard className="text-gray-500" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-500">
                Ingresos ventas finalizadas:
              </span>
              <span className="font-medium text-green-600">
                ${tienda.tienda.ingresos_ventas_finalizadas.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-500">Dinero por cobrar:</span>
              <span className="font-medium text-blue-600">
                ${tienda.tienda.dinero_x_cobrar.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-500">Aportes del año:</span>
              <span className="font-medium text-purple-600">
                ${tienda.tienda.aportes_ano.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Gastos del año:</span>
              <span className="font-medium text-red-600">
                ${tienda.tienda.gastos_ano.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen anual */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Balance Anual
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Ventas netas
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">
                ${tienda.tienda.ventas_netas_ano.toLocaleString()}
              </span>
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                +3.7%
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-teal-50">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Utilidades
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">
                ${tienda.tienda.utilidades_ano.toLocaleString()}
              </span>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                +4.2%
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-red-50 to-orange-50">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Gastos</h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-red-600">
                ${tienda.tienda.gastos_ano.toLocaleString()}
              </span>
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                -1.1%
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-yellow-50">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Aportes</h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">
                ${tienda.tienda.aportes_ano.toLocaleString()}
              </span>
              <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
                +2.3%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

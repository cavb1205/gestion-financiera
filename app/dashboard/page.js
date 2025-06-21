// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { 
  FiShoppingBag,
  FiDollarSign,
  FiBell
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { selectedStore } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadDashboardData = async () => {
      try {
        setDataLoading(true);
        
        // Simular respuesta de la API
        setTimeout(() => {
          setDashboardData({
            financialData: [
              { month: "Ene", ingresos: 4500, gastos: 2800 },
              { month: "Feb", ingresos: 5200, gastos: 3100 },
              { month: "Mar", ingresos: 4800, gastos: 2950 },
              { month: "Abr", ingresos: 6100, gastos: 3200 },
              { month: "May", ingresos: 5700, gastos: 3300 },
              { month: "Jun", ingresos: 6300, gastos: 3500 },
            ],
            portfolioSummary: [
              {
                name: "Créditos activos",
                value: 24,
                amount: "$125,400",
                change: "+2.5%",
              },
              {
                name: "Créditos vencidos",
                value: 8,
                amount: "$42,800",
                change: "-1.2%",
              },
              {
                name: "Recuperado este mes",
                value: null,
                amount: "$28,500",
                change: "+4.3%",
              },
              {
                name: "Clientes nuevos",
                value: 12,
                amount: null,
                change: "+3.1%",
              },
            ],
          });
          setDataLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        setDataLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (dataLoading) {
    console.log("Cargando datos del dashboard...");
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Cargando datos del dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {/* Encabezado de la tienda */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <FiShoppingBag className="text-indigo-600 text-2xl mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedStore?.tienda.nombre}
              <span className="ml-2 text-indigo-600 text-sm bg-indigo-100 px-2 py-1 rounded-full">
                ID: {selectedStore?.tienda.id}
              </span>
            </h1>
          </div>
          <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Caja:</span> $
              {selectedStore?.tienda.caja?.toLocaleString()}
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Inversión:</span> $
              {selectedStore?.tienda.inversion?.toLocaleString()}
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Utilidades:</span> $
              {selectedStore?.tienda.utilidades?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {dashboardData?.portfolioSummary?.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-5"
          >
            <div className="flex justify-between">
              <h3 className="text-gray-500 text-sm font-medium">
                {item.name}
              </h3>
              {item.change && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.change.startsWith("+")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.change}
                </span>
              )}
            </div>

            <div className="mt-2">
              {item.value !== null ? (
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </span>
                  {item.amount && (
                    <span className="ml-2 text-gray-500">
                      {item.amount}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  {item.amount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de ingresos/gastos */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Rendimiento financiero
            </h2>
            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>

          <div className="h-64">
            <div className="flex items-end h-48 mt-6 space-x-4">
              {dashboardData?.financialData?.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="flex items-end h-40">
                    <div
                      className="w-full bg-indigo-200 rounded-t hover:bg-indigo-300 transition-colors"
                      style={{
                        height: `${(item.ingresos / 7000) * 100}%`,
                      }}
                    ></div>
                    <div
                      className="w-full bg-red-200 rounded-t hover:bg-red-300 transition-colors ml-1"
                      style={{
                        height: `${(item.gastos / 7000) * 100}%`,
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

        {/* Últimos movimientos */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Últimos movimientos
          </h2>

          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <FiDollarSign className="text-indigo-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="font-medium">Pago recibido</p>
                  <p className="text-sm text-gray-500">
                    Cliente: Juan Pérez
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">+$450</p>
                  <p className="text-sm text-gray-500">Hoy 10:30</p>
                </div>
              </div>
            ))}

            <div className="flex items-start">
              <div className="bg-red-100 p-2 rounded-lg">
                <FiDollarSign className="text-red-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium">Nuevo crédito</p>
                <p className="text-sm text-gray-500">
                  Cliente: María García
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-blue-600">-$1,200</p>
                <p className="text-sm text-gray-500">Ayer 15:45</p>
              </div>
            </div>
          </div>

          <button className="mt-4 w-full py-2 text-center text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium">
            Ver todos los movimientos
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Próximos vencimientos
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crédito
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha vencimiento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto pendiente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3, 4].map((item) => (
                <tr key={item} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          Cliente {item}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: 100{item}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-900">Crédito personal</p>
                    <p className="text-sm text-gray-500">#CR00{item}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-900">15/0{item}/2023</p>
                    <p
                      className={`text-sm ${
                        item === 1 ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {item === 1 ? "Vence hoy" : `En ${item} días`}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium">${item * 250}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item === 1
                          ? "bg-red-100 text-red-800"
                          : item === 2
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item === 1
                        ? "Vencido"
                        : item === 2
                        ? "Por vencer"
                        : "Al día"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Contactar
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Registrar pago
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Mostrando 4 de 24 créditos
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm">
              Anterior
            </button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { 
  FiShoppingBag,
  FiDollarSign,
  FiBell,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { selectedStore } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (selectedStore) {
      // Simular carga de datos adicionales
      setTimeout(() => {
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
        setDataLoading(false);
      }, 800);
    }
  }, [selectedStore]);

  if (!selectedStore || dataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Cargando datos del dashboard...</p>
      </div>
    );
  }

  // Datos financieros resumidos
  const portfolioSummary = [
    {
      name: "Recaudos del día",
      value: null,
      amount: `$${selectedStore.tienda.recaudos_dia.toLocaleString()}`,
      change: "+4.3%",
      icon: <FiDollarSign className="text-green-500" />,
    },
    {
      name: "Ventas netas mes",
      value: null,
      amount: `$${selectedStore.tienda.ventas_netas_mes.toLocaleString()}`,
      change: "+3.1%",
      icon: <FiTrendingUp className="text-blue-500" />,
    },
    {
      name: "Gastos del mes",
      value: null,
      amount: `$${selectedStore.tienda.gastos_mes.toLocaleString()}`,
      change: "-1.2%",
      icon: <FiTrendingDown className="text-red-500" />,
    },
    {
      name: "Utilidades del año",
      value: null,
      amount: `$${selectedStore.tienda.utilidades_ano.toLocaleString()}`,
      change: "+2.5%",
      icon: <FiCreditCard className="text-purple-500" />,
    },
  ];

  // Formateador de fechas
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <>
      {/* Encabezado de la tienda */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <FiShoppingBag className="text-indigo-600 text-2xl mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedStore.tienda.nombre}
              <span className="ml-2 text-indigo-600 text-sm bg-indigo-100 px-2 py-1 rounded-full">
                ID: {selectedStore.tienda.id}
              </span>
            </h1>
          </div>
          <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Caja:</span> $
              {selectedStore.tienda.caja.toLocaleString()}
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Inversión:</span> $
              {selectedStore.tienda.inversion.toLocaleString()}
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              <span className="font-medium">Utilidades:</span> $
              {selectedStore.tienda.utilidades.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Fecha registro:</span>
            <span className="font-medium">{formatDate(selectedStore.tienda.fecha_registro)}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Administrador:</span>
            <span className="font-medium">{selectedStore.tienda.administrador}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Estado:</span>
            <span className={`font-medium ${selectedStore.tienda.estado ? 'text-green-600' : 'text-red-600'}`}>
              {selectedStore.tienda.estado ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-500 block">Pérdidas anuales:</span>
            <span className="font-medium text-red-600">${selectedStore.tienda.perdidas_ano.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {portfolioSummary.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-5"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  {item.name}
                </h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {item.amount}
                  </span>
                </div>
              </div>
              
              <div className={`p-2 rounded-lg ${index === 0 ? 'bg-green-100' : index === 1 ? 'bg-blue-100' : index === 2 ? 'bg-red-100' : 'bg-purple-100'}`}>
                {item.icon}
              </div>
            </div>

            {item.change && (
              <div className="mt-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.change.startsWith("+")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.change}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

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
                <div
                  key={index}
                  className="flex flex-col items-center flex-1"
                >
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

        {/* Últimos movimientos */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Resumen financiero
            </h2>
            <FiBell className="text-gray-500" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-500">Ingresos ventas finalizadas:</span>
              <span className="font-medium text-green-600">${selectedStore.tienda.ingresos_ventas_finalizadas.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-500">Dinero por cobrar:</span>
              <span className="font-medium text-blue-600">${selectedStore.tienda.dinero_x_cobrar.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-500">Ventas netas año:</span>
              <span className="font-medium text-green-400">${selectedStore.tienda.ventas_netas_ano.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Pérdidas año:</span>
              <span className="font-medium text-red-600">${selectedStore.tienda.perdidas_ano.toLocaleString()}</span>
            </div>
          </div>

          
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Resumen anual
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Aportes</h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">${selectedStore.tienda.aportes_ano.toLocaleString()}</span>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                +2.3%
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Gastos</h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-red-600">${selectedStore.tienda.gastos_ano.toLocaleString()}</span>
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                -1.1%
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Utilidades</h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">${selectedStore.tienda.utilidades_ano.toLocaleString()}</span>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                +4.2%
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Ventas netas</h3>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">${selectedStore.tienda.ventas_netas_ano.toLocaleString()}</span>
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                +3.7%
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
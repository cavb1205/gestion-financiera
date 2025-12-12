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
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiActivity,
  FiTarget,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
  FiStar,
  FiAlertTriangle,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import ResumenDia from "../components/dashboard/ResumenDia";
import ResumenMes from "../components/dashboard/ResumenMes";
import ResumenAnual from "../components/dashboard/ResumenAnual";
import ResumenGeneral from "../components/dashboard/ResumenGeneral";
import Grafico from "../components/dashboard/Grafico";
import UltimosMovimientos from "../components/dashboard/UltimosMovimientos";

export default function DashboardPage() {
  const { selectedStore, token, updateStoreData } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [tienda, setTienda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

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
      
      // Actualizar el contexto con la información más reciente (importante para el layout)
      if (updateStoreData) {
          updateStoreData(tiendaData);
      }
      
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

      setDashboardData({
        financialData: [
          { month: "Ene", ingresos: 4500000, gastos: 2800000 },
          { month: "Feb", ingresos: 5200000, gastos: 3100000 },
          { month: "Mar", ingresos: 4800000, gastos: 2950000 },
          { month: "Abr", ingresos: 6100000, gastos: 3200000 },
          { month: "May", ingresos: 5700000, gastos: 3300000 },
          { month: "Jun", ingresos: 6300000, gastos: 3500000 },
        ],
        performanceMetrics: {
          clientGrowth: 12.5,
          paymentEfficiency: 85.2,
          collectionRate: 78.6,
        },
      });
    } catch (error) {
      console.error("Error al actualizar el dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      if (selectedStore?.tienda?.id) {
        setDataLoading(true);
        // Usar los datos de selectedStore como inicialización rápida para evitar pantalla de carga infinita si la API falla o tarda
        if (!tienda) {
            setTienda({
                tienda: selectedStore.tienda,
                membresia: selectedStore.membresia,
                fecha_vencimiento: selectedStore.fecha_vencimiento,
                // Valores por defecto seguros para evitar crash
                estado: "Activo" 
            });
        }
        
        await actualizarDashboard();
        setDataLoading(false);
      }
    };

    cargarDatos();
  }, [selectedStore?.tienda?.id]); // Solo recargar si cambia el ID de la tienda seleccionada

  if (!selectedStore || (dataLoading && !tienda)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="ml-4 text-gray-600 mt-3">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Protección adicional contra crashes si tienda es null
  if (!tienda) {
      return null; // O un estado de error
  }

  // Calcular días restantes para la membresía
  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return Number.MAX_SAFE_INTEGER; // Asumir no expirado si no hay fecha aún
    
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    
    if (isNaN(vencimiento.getTime())) return Number.MAX_SAFE_INTEGER; // Fecha inválida

    const diffTime = vencimiento - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const diasRestantesMembresia = calcularDiasRestantes(
    tienda.fecha_vencimiento
  );
  const estadoMembresia =
    diasRestantesMembresia > 7
      ? "healthy"
      : diasRestantesMembresia > 0
      ? "warning"
      : "expired";

  const isExpired = estadoMembresia === "expired";

  
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center">
          <div className="bg-red-50 p-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <FiAlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Membresía Expirada
            </h2>
            <p className="text-red-600 font-medium">
              La cuenta de "{tienda.tienda.nombre}" ha expirado.
            </p>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Tu plan <strong>{tienda.membresia?.nombre}</strong> venció el{" "}
              {new Date(tienda.fecha_vencimiento).toLocaleDateString()}. Para
              seguir disfrutando de todas las funcionalidades, por favor
              actualiza tu membresía ahora.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => window.open(`https://wa.me/573136706939?text=Hola,%20quisiera%20renovar%20mi%20membresía%20premim%20para%20la%20tienda%20${tienda.tienda.nombre} (ID: ${tienda.tienda.id})`, '_blank')}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors flex items-center justify-center"
              >
                <FiRefreshCw className="mr-2" />
                Renovar Membresía
              </button>
              
              <button
                onClick={actualizarDashboard}
                disabled={refreshing}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Comprobar estado
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
               <p className="text-sm text-gray-500">
                 ¿Necesitas ayuda? Contacta a soporte
               </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Encabezado de la tienda - Mejorado */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg mr-4">
              <FiShoppingBag className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {tienda.tienda.nombre}
              </h1>
              <p className="text-gray-500 flex items-center mt-1">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs mr-2">
                  ID: {tienda.tienda.id}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    tienda.tienda.estado
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {tienda.tienda.estado ? "Activo" : "Inactivo"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-2 items-center">
            <button
              onClick={actualizarDashboard}
              disabled={refreshing}
              className="flex items-center text-sm bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw
                className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Actualizando..." : "Actualizar datos"}
            </button>
          </div>
        </div>

        {/* Sección de Liquidez y Membresía */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Tarjeta de Liquidez */}
          <div
            className={`p-4 rounded-lg ${
              tienda.tienda.caja >= 0
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg ${
                    tienda.tienda.caja >= 0 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <FiDollarSign
                    className={`text-lg ${
                      tienda.tienda.caja >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">
                    Liquidez Actual
                  </h3>
                  <p
                    className={`text-2xl font-bold ${
                      tienda.tienda.caja >= 0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    ${tienda.tienda.caja.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {tienda.tienda.caja >= 0
                      ? "Disponible en caja"
                      : "Saldo negativo"}
                  </p>
                </div>
              </div>
              {tienda.tienda.caja < 0 && (
                <FiAlertTriangle className="text-red-500 text-xl" />
              )}
            </div>
          </div>

          {/* Tarjeta de Membresía */}
          <div
            className={`p-4 rounded-lg border ${
              estadoMembresia === "healthy"
                ? "bg-blue-50 border-blue-200"
                : estadoMembresia === "warning"
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg ${
                    estadoMembresia === "healthy"
                      ? "bg-blue-100"
                      : estadoMembresia === "warning"
                      ? "bg-amber-100"
                      : "bg-red-100"
                  }`}
                >
                  <FiStar
                    className={`text-lg ${
                      estadoMembresia === "healthy"
                        ? "text-blue-600"
                        : estadoMembresia === "warning"
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">
                    Membresía
                  </h3>
                  <p className="text-lg font-bold text-gray-800">
                    {tienda.membresia?.nombre}
                  </p>
                  <p className="text-xs mt-1">
                    <span className="text-gray-500">Estado: </span>
                    <span
                      className={
                        estadoMembresia === "healthy"
                          ? "text-green-600 font-medium"
                          : estadoMembresia === "warning"
                          ? "text-amber-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {tienda.estado}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vence:{" "}
                    {new Date(tienda.fecha_vencimiento).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-full ${
                  estadoMembresia === "healthy"
                    ? "bg-blue-100 text-blue-800"
                    : estadoMembresia === "warning"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {diasRestantesMembresia > 10000 
                  ? "Verificando..." 
                  : diasRestantesMembresia > 0
                  ? `${diasRestantesMembresia} días`
                  : "Expirada"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resúmenes por período */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ResumenDia tienda={tienda} token={token} />
        <ResumenMes tienda={tienda} />
        <ResumenAnual tienda={tienda} />
      </div>

      {/* Gráficos y detalles adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de ingresos/gastos */}
        <Grafico data={tienda} />
      </div>
      {/* Últimos movimientos - ocupa 1 columna */}
      <div className="lg:col-span-1 mb-6">
        <UltimosMovimientos tienda={tienda} />
      </div>

      {/* Resumen general */}
      <ResumenGeneral tienda={tienda} />
    </div>
  );
}


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
import LoadingSpinner from "../components/LoadingSpinner";

export default function DashboardPage() {
  const { selectedStore, token, updateStoreData, loading: authLoading } = useAuth();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore.tienda.id]); // Solo recargar si cambia el ID de la tienda seleccionada

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  // Protección adicional contra crashes si tienda es null
  if (!tienda) {
      return null; // O un estado de error
  }

  // Formatear fecha sin desfase de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Ajustar la fecha agregando el offset de la zona horaria para que se muestre tal cual viene (UTC)
    // Esto evita que una fecha como '2025-12-22' se muestre como '2025-12-21' en zonas horarias occidentales
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const offsetDate = new Date(date.getTime() + userTimezoneOffset);
    return offsetDate.toLocaleDateString();
  };

  // Calcular días restantes para la membresía
  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return Number.MAX_SAFE_INTEGER; // Asumir no expirado si no hay fecha aún
    
    // Asumimos formato YYYY-MM-DD que es el estándar de la API para fechas
    // Usamos split para asegurar que trabajamos con la fecha local, sin interpretación UTC automática del navegador
    const parts = fechaVencimiento.split('-');
    if (parts.length !== 3) return Number.MAX_SAFE_INTEGER; // Formato no reconocido, asumimos safe
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
    const day = parseInt(parts[2], 10);
    
    // Configurar vencimiento al FINAL del día local (23:59:59)
    const vencimiento = new Date(year, month, day, 23, 59, 59);
    const hoy = new Date();
    
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Elementos de fondo dinámicos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[130px] rounded-full animate-pulse opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[130px] rounded-full animate-pulse opacity-60" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-white/5 backdrop-blur-3xl border border-rose-500/20 rounded-[2.5rem] mb-6 shadow-2xl relative group">
              <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-full"></div>
              <FiAlertTriangle className="text-rose-500 text-5xl relative z-10 animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">
              ACCESO<span className="text-rose-500 not-italic ml-2">RESTRINGIDO</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">Membresía Caducada • Sincronización Detenida</p>
          </div>

          <div className="glass p-10 md:p-14 rounded-[3rem] border-rose-500/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl text-center">
            <div className="relative z-10">
              <div className="mb-10">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                  La cuenta de <span className="text-rose-500">&quot;{tienda.tienda.nombre}&quot;</span> ha ingresado en modo de suspensión total.
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 mb-10">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                       <span>Plan Anterior</span>
                       <span className="text-white">{tienda.membresia?.nombre}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                       <span>Fecha de Corte</span>
                       <span className="text-rose-500">{formatDate(tienda.fecha_vencimiento)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Estado de Auditoría</p>
                       <p className="text-xs font-black text-rose-500 uppercase tracking-tighter">Liquidación Bloqueada</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => window.open(`https://wa.me/56963511337?text=Hola,%20quisiera%20renovar%20mi%20membresía%20premim%20para%20la%20tienda%20${tienda.tienda.nombre} (ID: ${tienda.tienda.id})`, '_blank')}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                  <FiCheckCircle className="group-hover:rotate-12 transition-transform" size={18} />
                  Solicitar Renovación
                </button>
                
                <button
                  onClick={actualizarDashboard}
                  disabled={refreshing}
                  className="w-full py-5 bg-white/5 border border-white/5 text-slate-400 hover:text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <FiRefreshCw className={`text-indigo-500 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Verificando..." : "Comprobar Pago"}
                </button>
              </div>

              <div className="mt-10 flex items-center justify-center gap-4 opacity-50">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                   Auditoría de Seguridad Activa
                 </p>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 overflow-x-hidden">
      {/* Top Navigation / Header */}
      <header className="sticky top-0 z-40 w-full mb-8 pointer-events-none">
        <div className="w-full pt-6">
          <div className="glass px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between rounded-[2rem] pointer-events-auto">
            <div className="flex items-center gap-5">
            <div className="bg-indigo-600 rounded-xl p-3 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
              <FiShoppingBag className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {tienda.tienda.nombre}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                  ID: {tienda.tienda.id}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  tienda.tienda.estado ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tienda.tienda.estado ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                  {tienda.tienda.estado ? "En Línea" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button
              onClick={actualizarDashboard}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <FiRefreshCw className={`text-indigo-500 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Sincronizando..." : "Sincronizar"}
            </button>
            
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
            
            <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <FiTarget className="text-xl" />
            </button>
          </div>
          </div>
        </div>
      </header>

      <main className="w-full">

        {/* Main Strategic Overview */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FiActivity className="text-indigo-500" />
              Vista Estratégica
            </h2>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              Hoy: {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Liquidez Core Card */}
            <div className={`glass relative overflow-hidden group p-6 rounded-3xl ${tienda.tienda.caja >= 0 ? "border-emerald-500/10" : "border-rose-500/10"}`}>
              <div className={`absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110 ${tienda.tienda.caja >= 0 ? "text-emerald-500/5" : "text-rose-500/5"}`}>
                <FiDollarSign size={80} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Caja Disponible</p>
              <h3 className={`text-3xl font-black ${tienda.tienda.caja >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                ${tienda.tienda.caja.toLocaleString()}
              </h3>
              <div className="flex items-center gap-2 mt-4">
                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${tienda.tienda.caja >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"}`}>
                  {tienda.tienda.caja >= 0 ? "SALDO POSITIVO" : "REVISAR CAJA"}
                </div>
                {tienda.tienda.caja < 0 && <FiAlertTriangle className="text-rose-500 animate-bounce" />}
              </div>
            </div>

            {/* Ventas Mes Card */}
            <div className="glass p-6 rounded-3xl border-blue-500/10 group cursor-default">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ventas del Mes</p>
              <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">
                ${(tienda.tienda.ventas_netas_mes || 0).toLocaleString()}
              </h3>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <FiTrendingUp className="text-emerald-500" />
                <span className="text-emerald-500">+12%</span> vs mes anterior
              </div>
            </div>

            {/* Créditos Card */}
            <div className="glass p-6 rounded-3xl border-purple-500/10 group">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Por Cobrar</p>
              <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                ${(tienda.tienda.dinero_x_cobrar || 0).toLocaleString()}
              </h3>
              <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[65%] rounded-full"></div>
              </div>
            </div>

            {/* Membresía Status */}
            <div className={`glass p-6 rounded-3xl border-amber-500/10 relative overflow-hidden`}>
               <div className={`absolute top-0 right-0 p-4 transform translate-x-1 translate-y-1 ${
                  estadoMembresia === "healthy" ? "text-emerald-500/20" : 
                  estadoMembresia === "warning" ? "text-amber-500/20" : "text-rose-500/20"
               }`}>
                  <FiStar size={40} />
               </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Plan {tienda.membresia?.nombre}</p>
              <h3 className={`text-xl font-bold ${
                estadoMembresia === "healthy" ? "text-slate-800 dark:text-white" : "text-amber-600 dark:text-amber-400"
              }`}>
                {diasRestantesMembresia > 10000 ? "Validando" : isExpired ? "Expirada" : `${diasRestantesMembresia} Días restantes`}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                Vence: {formatDate(tienda.fecha_vencimiento)}
              </p>
            </div>
          </div>
        </section>

        {/* Financial Details Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Charts & Key Data */}
          <div className="lg:col-span-8 space-y-8">
            <Grafico data={tienda} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="transition-all duration-500 hover:-translate-y-2">
                 <ResumenMes tienda={tienda} />
               </div>
               <div className="transition-all duration-500 hover:-translate-y-2">
                 <ResumenAnual tienda={tienda} />
               </div>
            </div>
            
            <ResumenGeneral tienda={tienda} />
          </div>

          {/* Activity & Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="transition-all duration-500 hover:-translate-y-2">
              <ResumenDia tienda={tienda} token={token} />
            </div>
            
            <div className="transition-all duration-500 hover:-translate-y-2">
              <UltimosMovimientos tienda={tienda} />
            </div>

            {/* Motivational / Insight Card */}
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-[0_25px_60px_-15px_rgba(79,70,229,0.5)] dark:shadow-none group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              <FiTarget className="absolute -bottom-8 -right-8 text-indigo-400 opacity-20 transform -rotate-12 group-hover:scale-110 transition-transform duration-1000" size={200} />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-500 rounded-2xl">
                    <FiTarget className="text-white" />
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-widest">Meta Semanal</h4>
                </div>
                
                <p className="text-indigo-100 text-lg mb-8 leading-relaxed font-medium">
                  Estás a solo <span className="text-white font-black underline decoration-indigo-400 underline-offset-4">$2,300,000</span> de superar tu récord histórico.
                </p>
                
                <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Explorar Oportunidades
                </button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}


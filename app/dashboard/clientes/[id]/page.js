// app/dashboard/clientes/[id]/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiUser,
  FiHome,
  FiPhone,
  FiMail,
  FiDollarSign,
  FiClock,
  FiEdit,
  FiTrash2,
  FiArrowLeft,
  FiCreditCard,
  FiCalendar,
  FiCheck,
  FiX,
  FiPlus,
  FiTrendingDown,
  FiTrendingUp,
  FiStar,
  FiAlertCircle,
  FiActivity,
  FiMapPin,
  FiShield,
  FiPieChart,
  FiBarChart2,
  FiTarget
} from "react-icons/fi";
import { FaStar, FaRegStar, FaBan, FaSkullCrossbones } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorMessage from "../../../components/ErrorMessage";

export default function DetalleCliente({ params }) {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [creditos, setCreditos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  params = useParams();

  const clienteId = params.id;
  // Calcular los totales financieros
  console.log("creditos:", creditos);
  const resumenFinanciero = useMemo(() => {
    if (creditos.message || creditos.length === 0) {
      return {
        totalCreditos: 0,
        totalMontoNeto: 0,
        totalPerdidas: 0,
        totalIngresos: 0,
        utilidadNeta: 0,
        calificacion: 0,
        estrellas: 0,
        bloqueado: false,
        creditosPagadosATiempo: 0,
        creditosConAtraso: 0,
        creditosPerdidos: 0,
        creditosCompletados: 0,
        promedioAtraso: "0.0",
        montoRecomendado: 0,
        creditoVigente: false,
        estadoCreditoVigente: null,
        beneficioNeto: 0,
      };
    } else {
      let totalCreditos = 0;
      let totalMontoNeto = 0;
      let totalPerdidas = 0;
      let totalIngresos = 0;

      // Variables para calificación
      let creditosPagadosATiempo = 0;
      let creditosConAtraso = 0;
      let creditosPerdidos = 0;
      let creditosCompletados = 0;
      let totalDiasAtraso = 0;

      // Variables para crédito vigente
      let creditoVigente = false;
      let estadoCreditoVigente = null;
      let totalMontoCreditos = 0;

      creditos.forEach((credito) => {
        const monto = parseInt(credito.valor_venta) || 0;
        const saldo = parseInt(credito.saldo_actual) || 0;
        const intereses = parseInt(credito.total_a_pagar) || 0;

        totalCreditos += 1;
        totalMontoNeto += monto;
        totalMontoCreditos += monto;

        // Calcular pérdidas (créditos vencidos con saldo pendiente)
        if (credito.estado_venta === "Perdida") {
          totalPerdidas += saldo;
          creditosPerdidos += 1;
        }

        // Calcular ingresos (solo créditos pagados)
        if (credito.estado_venta === "Pagado") {
          // Ingresos = Monto inicial + Intereses - Saldo actual (debería ser 0)

          totalIngresos += intereses - monto;
          creditosCompletados += 1;

          // Calcular pagos a tiempo vs atrasados
          if (credito.dias_atrasados > 0) {
            creditosConAtraso += 1;
            totalDiasAtraso += credito.dias_atrasados;
          } else {
            creditosPagadosATiempo += 1;
          }
        }
        // Detectar crédito vigente (cualquier estado que no sea Pagado o Perdida)
        if (
          credito.estado_venta === "Vigente" ||
          credito.estado_venta === "Vencido" ||
          credito.estado_venta === "Atrasado"
        ) {
          creditoVigente = true;
          estadoCreditoVigente = credito.estado_venta;
        }
      });

      // Utilidad neta = Ingresos - Pérdidas
      const utilidadNeta = totalIngresos - totalPerdidas;
      const beneficioNeto = utilidadNeta;

      // Calcular calificación (0-100 puntos)
      let calificacion = 0;
      let estrellas = 0;
      let bloqueado = creditosPerdidos > 0;

      if (!bloqueado && totalCreditos > 0) {
        // Base: Porcentaje de créditos pagados a tiempo (70% del puntaje)
        const porcentajeATiempo =
          (creditosPagadosATiempo / creditosCompletados) * 100 || 0;

        // Penalización por días de atraso (máximo 30% de reducción)
        const penalizacionAtraso = Math.min(30, totalDiasAtraso);

        // Bonus por cantidad de créditos completados
        const bonusExperiencia = Math.min(10, creditosCompletados);

        // Cálculo final
        calificacion = Math.max(
          0,
          Math.min(
            100,
            porcentajeATiempo * 0.7 - penalizacionAtraso + bonusExperiencia
          )
        );

        // Convertir a estrellas (1-5)
        estrellas =
          calificacion >= 90
            ? 5
            : calificacion >= 70
            ? 4
            : calificacion >= 50
            ? 3
            : calificacion >= 30
            ? 2
            : 1;
      }

      // Calcular monto recomendado para nuevo crédito
      let montoRecomendado = 0;
      if (!bloqueado && totalCreditos > 0) {
        const promedioMonto = totalMontoCreditos / totalCreditos;

        // Factor de ajuste basado en calificación
        let factor = 1;
        if (calificacion >= 80) factor = 1.2; // Excelente historial
        else if (calificacion >= 60) factor = 1.0; // Buen historial
        else if (calificacion >= 40) factor = 0.8; // Historial regular
        else factor = 0.5; // Mal historial

        montoRecomendado = Math.round(promedioMonto * factor);

        // Si el cliente tiene atrasos, reducir el monto
        if (creditosConAtraso > 0) {
          montoRecomendado = Math.round(montoRecomendado * 0.7);
        }

        // Mínimo de $10,000 para no recomendar montos insignificantes
        montoRecomendado = Math.max(10000, montoRecomendado);
      }

      return {
        totalCreditos,
        totalMontoNeto,
        totalPerdidas,
        totalIngresos,
        utilidadNeta,
        calificacion,
        estrellas,
        bloqueado,
        creditosPagadosATiempo,
        creditosConAtraso,
        creditosPerdidos,
        creditosCompletados,
        promedioAtraso:
          creditosConAtraso > 0
            ? (totalDiasAtraso / creditosConAtraso).toFixed(1)
            : "0.0",
        montoRecomendado,
        creditoVigente,
        estadoCreditoVigente,
        beneficioNeto,
      };
    }
  }, [creditos]);

  console.log("creditos:", creditos);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
      return;
    }

    if (selectedStore && token && !loading) {
      fetchCliente();
    }
  }, [loading, isAuthenticated, selectedStore, token, router]);

  const fetchCliente = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Obtener detalles del cliente
      const clienteResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!clienteResponse.ok) {
        throw new Error("Error al obtener los detalles del cliente");
      }

      const clienteData = await clienteResponse.json();
      setCliente(clienteData);

      // Obtener créditos del cliente
      const creditosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/${clienteId}/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!creditosResponse.ok) {
        throw new Error("Error al obtener los créditos del cliente");
      }

      const creditosData = await creditosResponse.json();
      setCreditos(creditosData);
    } catch (err) {
      setError(err.message || "Error al cargar los datos del cliente");
      console.error("Error fetching client details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return "";

    // Eliminar cualquier carácter no numérico
    const cleaned = phone.replace(/\D/g, "");

    // Manejar diferentes longitudes de números
    if (cleaned.length === 10) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(
        2,
        3
      )} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    } else if (cleaned.length === 12) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(
        3,
        5
      )} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    }

    // Si no coincide con los formatos esperados, devolver el original
    return phone;
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "numeric", day: "numeric" };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Activo":
        return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Activo
        </span>;
      case "Inactivo":
        return <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Inactivo
        </span>;
      case "Moroso":
        return <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce"></span>
          Moroso
        </span>;
      case "Bloqueado":
        return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Bloqueado
        </span>;
      default:
        return <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit leading-none">
          {status}
        </span>;
    }
  };

  const getCreditStatus = (status) => {
    switch (status) {
      case "Vigente":
        return <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/30">Vigente</span>;
      case "Pagado":
        return <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/30">Liquidado</span>;
      case "Vencido":
        return <span className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-800/30">Vencido</span>;
      case "Atrasado":
        return <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-800/30">Atrasado</span>;
      case "Perdida":
        return <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600">Castigado</span>;
      default:
        return <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{status}</span>;
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `https://api.carterafinanciera.com/clientes/${clienteId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el cliente");
      }

      router.push("/dashboard/clientes");
    } catch (err) {
      setError(err.message || "Error al eliminar el cliente");
      console.error("Error deleting client:", err);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Auditando Historial Crediticio</p>
      </div>
    );
  }


  if (error) {
    return <ErrorMessage message={error} onRetry={fetchCliente} />;
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
        <p className="mt-4 text-lg text-gray-700">Cliente no encontrado</p>
        <button
          onClick={() => router.push("/clientes")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Volver a la lista de clientes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="w-full">

        {/* Encabezado Principal */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="flex items-start gap-6">
            <button
              onClick={() => router.push("/dashboard/clientes")}
              className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
            >
              <FiArrowLeft size={20} />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                 <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                    <FiUser className="text-white text-xl" />
                 </div>
                 {getStatusBadge(cliente.estado_cliente)}
                 {resumenFinanciero.bloqueado && (
                   <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2">
                     <FaSkullCrossbones /> Riesgo Crítico
                   </span>
                 )}
              </div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-4">
                {cliente.nombres} {cliente.apellidos}
              </h1>
              <div className="flex items-center gap-6 text-slate-400 font-bold text-xs uppercase tracking-[0.15em]">
                 <span className="flex items-center gap-2">
                    <FiShield className="text-indigo-500" /> ID: {cliente.identificacion}
                 </span>
                 <span className="flex items-center gap-2">
                    <FiCalendar className="text-indigo-500" /> Miembro desde {formatDate(cliente.fecha_creacion)}
                 </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button
                onClick={() => router.push(`/dashboard/clientes/${clienteId}/editar`)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
              >
                <FiEdit size={16} />
                Modificar Perfil
              </button>
              <button
                onClick={() => router.push(`/dashboard/clientes/${clienteId}/eliminar`)}
                className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/30"
              >
                <FiTrash2 size={20} />
              </button>
          </div>
        </div>

        {/* Malla de Indicadores Financieros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
           {/* Card: Calificación */}
          <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Score Crediticio</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Análisis de Confianza</h3>
                </div>
                {resumenFinanciero.bloqueado ? (
                  <div className="bg-rose-100 dark:bg-rose-900/40 p-3 rounded-2xl">
                    <FaBan className="text-rose-600 text-2xl" />
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl">
                    <FiStar className="text-amber-500 text-2xl fill-amber-500" />
                  </div>
                )}
              </div>

              {resumenFinanciero.totalCreditos > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-end gap-3">
                    <span className={`text-6xl font-black tracking-tighter leading-none ${resumenFinanciero.bloqueado ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {resumenFinanciero.calificacion.toFixed(0)}
                    </span>
                    <span className="text-xl font-black text-slate-300 mb-2">/100</span>
                  </div>
                  
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-2.5 flex-1 rounded-full transition-all duration-1000 ${
                        i < resumenFinanciero.estrellas 
                          ? (resumenFinanciero.estrellas > 3 ? 'bg-emerald-500' : 'bg-amber-500')
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`} />
                    ))}
                  </div>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {resumenFinanciero.bloqueado ? "Cliente con historial de pérdidas" : "Basado en comportamiento de pago"}
                  </p>
                </div>
              ) : (
                <div className="py-10 text-center">
                   <FiActivity className="mx-auto text-4xl text-slate-200 mb-2" />
                   <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sin historial previo</p>
                </div>
              )}
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
              <div className="glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                      <FiPieChart size={20} />
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cartera</span>
                </div>
                <div>
                   <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{resumenFinanciero.totalCreditos}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Créditos Totales</p>
                </div>
              </div>

              <div className="glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                      <FiTrendingUp size={20} />
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">Rendimiento</span>
                </div>
                <div>
                   <p className="text-xl font-black text-emerald-600 tracking-tight">${resumenFinanciero.totalIngresos.toLocaleString()}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Intereses Cobrados</p>
                </div>
              </div>

              <div className="glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                      <FiTrendingDown size={20} />
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Exposición</span>
                </div>
                <div>
                   <p className="text-xl font-black text-rose-600 tracking-tight">${resumenFinanciero.totalPerdidas.toLocaleString()}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Capital Perdido</p>
                </div>
              </div>

              <div className={`glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 flex flex-col justify-between group relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-4">
                   <div className={`p-2.5 ${resumenFinanciero.beneficioNeto >= 0 ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'} rounded-xl transition-all shadow-lg`}>
                      <FiDollarSign size={20} />
                   </div>
                   <span className={`text-[9px] font-black uppercase tracking-widest ${resumenFinanciero.beneficioNeto >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>
                     {resumenFinanciero.beneficioNeto >= 0 ? 'Beneficio Neto' : 'Pérdida Total'}
                   </span>
                </div>
                <div>
                   <p className={`text-xl font-black tracking-tight ${resumenFinanciero.beneficioNeto >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                     ${Math.abs(resumenFinanciero.beneficioNeto).toLocaleString()}
                   </p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     {resumenFinanciero.beneficioNeto >= 0 ? 'Ganancia Real' : 'Déficit Acumulado'}
                   </p>
                </div>
                {/* Visual feedback glow */}
                <div className={`absolute -right-5 -bottom-5 w-16 h-16 ${resumenFinanciero.beneficioNeto >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10'} rounded-full blur-xl animate-pulse`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Secciones de Detalle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Columna Izquierda: Información y Sugerencias */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Datos Maestros</h3>
               </div>
               
               <div className="space-y-8">
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                        <FiHome size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Local Comercial</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{cliente.nombre_local || "Ubicación Personal"}</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                        <FiPhone size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto Telefónico</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{formatPhone(cliente.telefono_principal)}</p>
                        {cliente.telefono_opcional && <p className="text-[11px] font-bold text-slate-400 mt-1">{formatPhone(cliente.telefono_opcional)}</p>}
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                        <FiMapPin size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referencia Domiciliaria</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{cliente.direccion}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Smart Recommendation Card */}
            {!resumenFinanciero.bloqueado && resumenFinanciero.totalCreditos > 0 && (
              <div className="bg-slate-900 dark:bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <FiTarget className="text-indigo-400" size={24} />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Recomendación IA</span>
                    </div>
                    <p className="text-slate-400 text-sm font-bold mb-2">Cupo Sugerido de Inversión:</p>
                    <div className="flex items-end gap-2 mb-8">
                       <span className="text-5xl font-black tracking-tighter">${resumenFinanciero.montoRecomendado.toLocaleString()}</span>
                       <span className="text-indigo-400 font-bold mb-2 tracking-widest uppercase text-[10px]">COP</span>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/5">
                          <FiCheck className="text-emerald-400" />
                          <span className="text-[11px] font-bold">Historial de cumplimiento sólido</span>
                       </div>
                       {resumenFinanciero.creditoVigente && (
                          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/5">
                             <FiAlertCircle className="text-amber-400" />
                             <span className="text-[11px] font-bold">Cuenta con crédito vigente</span>
                          </div>
                       )}
                    </div>
                 </div>
                 {/* Decorative spheres */}
                 <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Historial y Métricas Detalladas */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800">
               <div className="p-8 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600">
                        <FiBarChart2 size={24} />
                     </div>
                     <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Historial Transaccional</h3>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/dashboard/ventas/nueva?clienteId=${clienteId}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <FiPlus size={18} />
                    Apertura Crédito
                  </button>
               </div>
               <div className="p-0 overflow-hidden">
                  {creditos.message || !creditos.length ? (
                    <div className="py-20 text-center px-8">
                       <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                          <FiDollarSign size={32} className="text-slate-300" />
                       </div>
                       <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2 tracking-tight">Sin registros financieros</h4>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                          Este usuario no posee operaciones activas o históricas en el sistema.
                       </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referencia</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inversión</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vencimiento</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Balance</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                            <th className="px-8 py-5 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                          {creditos.map((credito) => (
                            <tr key={credito.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all cursor-pointer">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                   <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">Operación #{credito.id.toString().padStart(4, "0")}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-sm font-black text-slate-900 dark:text-white">${parseInt(credito.valor_venta).toLocaleString()}</span>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-xs font-bold text-slate-500">{formatDate(credito.fecha_vencimiento)}</span>
                              </td>
                              <td className="px-8 py-6 font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                                ${parseInt(credito.saldo_actual).toLocaleString()}
                              </td>
                              <td className="px-8 py-6">
                                {getCreditStatus(credito.estado_venta)}
                              </td>
                              <td className="px-8 py-6 text-right">
                                <button
                                  onClick={() => router.push(`/dashboard/ventas/${credito.id}`)}
                                  className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                >
                                   <FiArrowLeft size={16} className="rotate-180" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
           <div className="glass max-w-md w-full rounded-[2.5rem] border-white/60 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-rose-600 p-8 text-white relative overflow-hidden">
                 <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl">
                       <FiAlertCircle size={28} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Confirmación Requerida</p>
                       <h3 className="text-xl font-black tracking-tight leading-tight">Eliminar Registro Maestro</h3>
                    </div>
                 </div>
                 <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              </div>
              
              <div className="p-10 bg-white/80 dark:bg-slate-900">
                 <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-10">
                    ¿Está completamente seguro de eliminar a <span className="font-black text-slate-800 dark:text-white underline decoration-rose-500/30">{cliente.nombres} {cliente.apellidos}</span>? 
                    Esta acción purgará todo el historial transaccional asociado de forma irreversible.
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowDeleteConfirmation(false)}
                      className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none hover:scale-105 transition-all"
                    >
                      Confirmar Purga
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

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
import { FaBan, FaSkullCrossbones } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorMessage from "../../../components/ErrorMessage";
import { formatMoney } from "../../../utils/format";

export default function DetalleCliente({ params }) {
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading, user } = useAuth();
  const isWorker = !(user?.is_staff || user?.is_superuser);
  const [cliente, setCliente] = useState(null);
  const [creditos, setCreditos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [creditosPage, setCreditosPage] = useState(1);
  const [score, setScore] = useState(null);
  const CREDITOS_PER_PAGE = 5;
  params = useParams();

  const clienteId = params.id;
  // Calcular los totales financieros
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

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
      return;
    }

    if (selectedStore && isAuthenticated && !loading) {
      fetchCliente();
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchCliente = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [clienteResponse, creditosResponse, scoreResponse] = await Promise.all([
        apiFetch(`/clientes/${clienteId}/`),
        apiFetch(`/ventas/activas/${clienteId}/t/${selectedStore.tienda.id}/`),
        apiFetch(`/clientes/${clienteId}/score/t/${selectedStore.tienda.id}/`),
      ]);

      if (!clienteResponse.ok) throw new Error("Error al obtener los detalles del cliente");
      if (!creditosResponse.ok) throw new Error("Error al obtener los créditos del cliente");

      const [clienteData, creditosData] = await Promise.all([
        clienteResponse.json(),
        creditosResponse.json(),
      ]);

      setCliente(clienteData);
      setCreditos(creditosData);
      if (scoreResponse.ok) setScore(await scoreResponse.json());
    } catch (err) {
      setError(err.message || "Error al cargar los datos del cliente");
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
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        <div className="glass p-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiUser className="text-slate-300 text-2xl" />
          </div>
          <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Cliente no encontrado</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">El registro no existe o fue eliminado</p>
          <button
            onClick={() => router.push("/dashboard/clientes")}
            className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            Volver a Clientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="w-full">

        {/* Encabezado Principal */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/dashboard/clientes")}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 active:scale-95 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate">
                {cliente.nombres} {cliente.apellidos}
              </h1>
              {getStatusBadge(cliente.estado_cliente)}
              {resumenFinanciero.bloqueado && (
                <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <FaSkullCrossbones size={10} /> Riesgo Crítico
                </span>
              )}
            </div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">
              ID: {cliente.identificacion} • <span className="opacity-60">Desde {formatDate(cliente.fecha_creacion)}</span>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => router.push(`/dashboard/clientes/${clienteId}/editar`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
          >
            <FiEdit size={16} />
            Modificar Perfil
          </button>
          {!isWorker && (
            <button
              onClick={() => router.push(`/dashboard/clientes/${clienteId}/eliminar`)}
              className="p-3.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl hover:bg-rose-100 active:scale-95 transition-all border border-rose-100 dark:border-rose-900/30"
            >
              <FiTrash2 size={18} />
            </button>
          )}
        </div>

        {/* Malla de Indicadores Financieros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
           {/* Card: Score Crediticio (backend) */}
          <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Score Crediticio</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Análisis de Confianza</h3>
                </div>
                {score?.detalle?.perdidos > 0 ? (
                  <div className="bg-rose-100 dark:bg-rose-900/40 p-3 rounded-2xl">
                    <FaBan className="text-rose-600 text-2xl" />
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl">
                    <FiStar className="text-amber-500 text-2xl fill-amber-500" />
                  </div>
                )}
              </div>

              {score ? (
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <span className={`text-6xl font-black tracking-tighter leading-none ${
                      score.score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                      : score.score >= 60 ? 'text-slate-900 dark:text-white'
                      : score.score >= 40 ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {score.sin_historial ? '—' : score.score}
                    </span>
                    <span className="text-xl font-black text-slate-300 mb-2">/100</span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                      score.sin_historial
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        : score.nivel === 'Excelente'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : score.nivel === 'Bueno'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : score.nivel === 'Regular'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    }`}>
                      {score.sin_historial ? 'Sin historial' : score.nivel}
                    </span>
                  </div>

                  {!score.sin_historial && (
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => {
                        const umbral = i < Math.ceil(score.score / 20);
                        return (
                          <div key={i} className={`h-2.5 flex-1 rounded-full transition-all duration-700 ${
                            umbral
                              ? score.score >= 80 ? 'bg-emerald-500' : score.score >= 60 ? 'bg-indigo-500' : score.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`} />
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pagos registrados</span>
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{score.detalle.pagos}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No pagos</span>
                      <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{score.detalle.no_pagos}</span>
                    </div>
                    {score.detalle.perdidos > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Créditos perdidos</span>
                        <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">{score.detalle.perdidos}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Liquidados</span>
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">{score.detalle.liquidados} / {score.detalle.total_creditos}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                   <FiActivity className="mx-auto text-4xl text-slate-200 mb-2" />
                   <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Calculando score...</p>
                </div>
              )}
            </div>
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
                   <p className="text-xl font-black text-emerald-600 tracking-tight">{formatMoney(resumenFinanciero.totalIngresos)}</p>
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
                   <p className="text-xl font-black text-rose-600 tracking-tight">{formatMoney(resumenFinanciero.totalPerdidas)}</p>
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
                     {formatMoney(Math.abs(resumenFinanciero.beneficioNeto))}
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
                       <span className="text-4xl font-black tracking-tighter">{formatMoney(resumenFinanciero.montoRecomendado)}</span>
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
                     <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Créditos Activos</h3>
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
                       <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2 tracking-tight">Sin créditos activos</h4>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                          Este cliente no tiene créditos vigentes en este momento.
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                          {creditos.slice((creditosPage - 1) * CREDITOS_PER_PAGE, creditosPage * CREDITOS_PER_PAGE).map((credito) => (
                            <tr
                              key={credito.id}
                              onClick={() => router.push(`/dashboard/ventas/${credito.id}`)}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all cursor-pointer active:bg-indigo-50/50 dark:active:bg-indigo-900/10"
                            >
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                                   <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">Operación #{credito.id.toString().padStart(4, "0")}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-sm font-black text-slate-900 dark:text-white">{formatMoney(credito.valor_venta)}</span>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-xs font-bold text-slate-500">{formatDate(credito.fecha_vencimiento)}</span>
                              </td>
                              <td className="px-8 py-6 text-xs font-black text-indigo-600 dark:text-indigo-400">
                                {formatMoney(credito.saldo_actual)}
                              </td>
                              <td className="px-8 py-6">
                                {getCreditStatus(credito.estado_venta)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {creditos.length > CREDITOS_PER_PAGE && (
                        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 dark:border-slate-800/50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {(creditosPage - 1) * CREDITOS_PER_PAGE + 1}–{Math.min(creditosPage * CREDITOS_PER_PAGE, creditos.length)} de {creditos.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCreditosPage(p => p - 1)}
                              disabled={creditosPage === 1}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <FiArrowLeft size={14} />
                            </button>
                            {Array.from({ length: Math.ceil(creditos.length / CREDITOS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setCreditosPage(page)}
                                className={`w-8 h-8 rounded-xl text-[11px] font-black transition-all ${
                                  page === creditosPage
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => setCreditosPage(p => p + 1)}
                              disabled={creditosPage === Math.ceil(creditos.length / CREDITOS_PER_PAGE)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <FiArrowLeft size={14} className="rotate-180" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

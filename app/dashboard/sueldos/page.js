// app/dashboard/sueldos/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  FiDollarSign, 
  FiActivity,
  FiArrowLeft
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import CalculoSueldo from "../../components/CalculoSueldo";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function SueldoPage() {
  const { selectedStore, token, isAuthenticated, loading: authLoading } = useAuth();
  const [tienda, setTienda] = useState(null);
  const router = useRouter();

  useEffect(() => {
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
      } catch (error) {
        console.error("Error al obtener la tienda actualizada:", error);
      }
    };

    fetchTiendaActualizada();
  }, [selectedStore, token]);

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (!tienda) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sincronizando Parámetros Laborales</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
               <FiDollarSign className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Cálculo de Honorarios</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Liquidación Semanal • <span className="text-indigo-500">{tienda.nombre}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <CalculoSueldo tienda={tienda} token={token} />
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden relative group">
                <div className="relative z-10">
                   <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                      <FiActivity size={32} />
                   </div>
                   <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-4 uppercase">Modelo de Compensación</h2>
                   <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed uppercase tracking-tighter">
                      El cálculo se basa en el rendimiento operativo total de la sucursal durante el periodo seleccionado. Asegúrese de que todos los recaudos hayan sido sincronizados.
                   </p>

                   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span>Fuente de Datos</span>
                         <span className="text-indigo-600">Módulo Recaudos</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span>Precisión Auditoría</span>
                         <span className="text-emerald-500">100% Certificado</span>
                      </div>
                   </div>
                </div>
                <div className="absolute -right-10 top-20 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
             </div>

             <div className="px-8 flex items-start gap-4 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   Los cálculos realizados en este módulo son de carácter informativo para la conciliación de nómina. No generan registros contables automáticos sin aprobación.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
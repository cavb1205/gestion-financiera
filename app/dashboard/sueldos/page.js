// app/dashboard/sueldos/page.js
"use client";

import { useAuth } from "../../context/AuthContext";
import { FiDollarSign, FiActivity } from "react-icons/fi";
import CalculoSueldo from "../../components/CalculoSueldo";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function SueldoPage() {
  const { selectedStore, token, isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Cálculo de Honorarios</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Liquidación Semanal • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <CalculoSueldo tienda={selectedStore} token={token} />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <FiActivity size={24} />
                </div>
                <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight leading-none mb-3 uppercase">Modelo de Compensación</h2>
                <p className="text-[10px] font-bold text-slate-400 mb-6 leading-relaxed uppercase tracking-tighter">
                  El cálculo se basa en el rendimiento operativo total de la sucursal durante el periodo seleccionado. Asegúrese de que todos los recaudos hayan sido sincronizados.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Fuente de Datos</span>
                    <span className="text-indigo-600">Módulo Recaudos</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Precisión Auditoría</span>
                    <span className="text-emerald-500">Certificado</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 top-20 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            <div className="px-6 flex items-start gap-3 opacity-50">
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

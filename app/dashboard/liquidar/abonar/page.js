// app/dashboard/liquidar/abonar/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { 
  FiArrowLeft, 
  FiDollarSign, 
  FiCheck, 
  FiUser, 
  FiCalendar, 
  FiActivity, 
  FiShield, 
  FiInfo,
  FiTrendingDown,
  FiTarget
} from "react-icons/fi";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function PagarAbonoPage() {
  const { token, isAuthenticated, selectedStore, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [abono, setAbono] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [valorAbono, setValorAbono] = useState(0);
  const [maximoAbonable, setMaximoAbonable] = useState(0);

  useEffect(() => {
    const storedAbono = localStorage.getItem("abono");
    const storedCliente = localStorage.getItem("cliente");

    if (!storedAbono || !storedCliente) {
      toast.error("Faltan datos para realizar el pago.");
      router.push("/dashboard/liquidar");
      return;
    }

    try {
      const parsedAbono = JSON.parse(storedAbono);
      const parsedCliente = JSON.parse(storedCliente);

      setAbono(parsedAbono);
      setCliente(parsedCliente);
      setValorAbono(parseFloat(parsedAbono.valor_recaudo));
      setMaximoAbonable(parseFloat(parsedAbono.saldo_actual) || 0);
    } catch (error) {
      console.error("Error parsing data:", error);
      toast.error("Error al cargar los datos del pago.");
      router.push("/dashboard/liquidar");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const valorNumerico = parseFloat(valorAbono);

    if (!valorNumerico || valorNumerico <= 0) {
      toast.error("El valor a abonar debe ser mayor a cero.");
      return;
    }

    if (valorNumerico > maximoAbonable) {
      toast.error(`El valor máximo a abonar es ${formatMoney(maximoAbonable)}`);
      return;
    }

    setSubmitting(true);
    const abonoToSend = { ...abono, valor_recaudo: valorNumerico };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/create/t/${abono.tienda}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(abonoToSend),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar el abono");
      }

      localStorage.removeItem("abono");
      localStorage.removeItem("cliente");
      toast.success("Recaudo sincronizado correctamente.", { autoClose: 1000 });
      router.push("/dashboard/liquidar");
    } catch (error) {
      toast.error(error.message || "Ocurrió un error en la sincronización.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (loading) return <LoadingSpinner />;

  const nuevoSaldo = maximoAbonable - (parseFloat(valorAbono) || 0);

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.push("/dashboard/liquidar")}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Procesar Recaudo</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Abono a Crédito • <span className="text-indigo-500">#{abono.venta}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form Area */}
          <div className="lg:col-span-12 xl:col-span-8">
             <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl relative">
                <div className="p-10 md:p-14">
                   <div className="flex items-center gap-6 mb-12 pb-12 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner font-black text-xl">
                         {cliente?.nombres.charAt(0)}
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                            {cliente?.nombres} {cliente?.apellidos}
                         </h3>
                         <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Saldo Actual: {formatMoney(maximoAbonable)}</p>
                      </div>
                   </div>

                   <form onSubmit={handleSubmit} className="space-y-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Monto del Recaudo (COP)</label>
                         <div className="relative group">
                            <FiDollarSign className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-500 group-focus-within:scale-110 transition-transform" size={32} />
                            <input 
                              type="number"
                              value={valorAbono}
                              onChange={(e) => setValorAbono(e.target.value)}
                              onWheel={(e) => e.target.blur()}
                              max={maximoAbonable}
                              className="w-full pl-20 pr-10 py-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-4xl font-black text-slate-800 dark:text-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                         </div>
                         <div className="flex justify-between items-center px-4">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tope Máximo Permitido: {formatMoney(maximoAbonable)}</p>
                            <div className="flex gap-2">
                               {[0.5, 1, 2].map((mult) => (
                                 <button 
                                   key={mult}
                                   type="button"
                                   onClick={() => setValorAbono(Math.min(maximoAbonable, 100000 * mult))}
                                   className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                 >
                                   +{formatMoney(100000 * mult)}
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <FiCalendar className="text-indigo-500" size={24} />
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fecha de Operación</p>
                               <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{abono?.fecha_recaudo}</p>
                            </div>
                         </div>
                         <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <FiTarget className="text-emerald-500" size={24} />
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Estado del Registro</p>
                               <p className="text-sm font-black text-emerald-600 uppercase">Listo para Sincronizar</p>
                            </div>
                         </div>
                      </div>

                      <div className="pt-6">
                         <button 
                           type="submit"
                           disabled={submitting}
                           className="w-full md:w-auto px-16 py-6 bg-slate-900 dark:bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                         >
                           {submitting ? (
                             <>
                               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               Sincronizando Bóveda...
                             </>
                           ) : (
                             <>
                               <FiCheck size={20} />
                               Registrar Recaudo Efectivo
                             </>
                           )}
                         </button>
                      </div>
                   </form>
                </div>
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
             </div>
          </div>

          {/* Context Sidebar */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-8">
             <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden relative group">
                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Impacto Operativo</h4>
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Nuevo Saldo Proyectado</p>
                         <p className={`text-2xl font-black tracking-tight ${nuevoSaldo === 0 ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                            {formatMoney(nuevoSaldo)}
                         </p>
                      </div>
                      <div className={`p-4 rounded-2xl ${nuevoSaldo === 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                         <FiTrendingDown size={28} />
                      </div>
                   </div>

                   <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                   <div className="space-y-6">
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <FiActivity size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">Rendimiento de Cartera</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">El abono reduce directamente el riesgo de mora del cliente.</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <FiShield size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">Protocolo Seguro</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">La transacción genera un hash de auditoría único e inmutable.</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="absolute -right-10 -bottom-10 text-slate-50 dark:text-white/5 opacity-30 group-hover:scale-110 transition-transform">
                   <FiActivity size={180} />
                </div>
             </div>

             <div className="px-8 flex items-start gap-4 opacity-50">
                <FiInfo className="text-slate-400 mt-1 shrink-0" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   Al presionar &quot;Registrar&quot;, usted certifica que el monto ingresado coincide exactamente con el efectivo recibido. Toda discrepancia será reportada al supervisor.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

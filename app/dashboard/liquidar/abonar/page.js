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
    return "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (loading) return <LoadingSpinner />;

  const nuevoSaldo = Math.max(0, maximoAbonable - (parseFloat(valorAbono) || 0));

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push("/dashboard/liquidar")}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">
               {cliente?.nombres} {cliente?.apellidos}
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
               Procesar Recaudo • Saldo: <span className="text-emerald-500">{formatMoney(maximoAbonable)}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main Payment Area */}
          <div className="xl:col-span-8">
             <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl relative">
                <div className="p-6 md:p-12 pb-32 md:pb-12"> {/* Extra padding bottom on mobile for sticky button */}
                   <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monto del Recaudo</label>
                           <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">Obligatorio</span>
                         </div>
                         <div className="relative group">
                            <FiDollarSign className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-emerald-500 group-focus-within:scale-110 transition-transform" size={28} />
                            <input 
                              type="number"
                              value={valorAbono}
                              onChange={(e) => setValorAbono(e.target.value)}
                              onWheel={(e) => e.target.blur()}
                              max={maximoAbonable}
                              className="w-full pl-16 md:pl-20 pr-6 py-6 md:py-8 bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-3xl md:text-5xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                              placeholder="0"
                            />
                         </div>
                         
                         {/* Quick Select Amounts */}
                         <div className="grid grid-cols-3 gap-2 mt-2">
                            {[0.5, 1, 2].map((mult) => (
                              <button 
                                key={mult}
                                type="button"
                                onClick={() => setValorAbono(Math.min(maximoAbonable, 100000 * mult))}
                                className="py-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-300 active:scale-95 transition-all uppercase tracking-widest shadow-sm ring-1 ring-transparent focus:ring-indigo-500/20"
                              >
                                +{mult * 100}K
                              </button>
                            ))}
                         </div>
                      </div>

                      {/* Sticky Mobile Action Bar */}
                      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto">
                         <div className="flex flex-row items-center gap-3 max-w-7xl mx-auto px-0 lg:px-8">
                             <div className="flex flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 items-center gap-3">
                                <FiCalendar className="text-indigo-500 shrink-0" size={16} />
                                <div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Fecha</p>
                                   <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none">{abono?.fecha_recaudo}</p>
                                </div>
                             </div>

                             <button
                               type="submit"
                               disabled={submitting || !valorAbono || valorAbono <= 0}
                               className="w-full flex-[2] py-4.5 bg-emerald-600 text-white rounded-2xl font-black text-xs md:text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-3"
                             >
                               {submitting ? (
                                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               ) : (
                                 <>
                                   <FiCheck size={18} />
                                   Registrar Recaudo
                                 </>
                               )}
                             </button>
                         </div>
                      </div>

                   </form>
                </div>
             </div>
          </div>

          {/* Secondary Stats Area - Moved after Main on Mobile */}
          <div className="xl:col-span-4 space-y-6">
             <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative group shadow-xl">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <FiActivity className="text-indigo-500" />
                  Impacto Operativo
                </h4>
                <div className="space-y-6 relative z-10">
                   <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Nuevo Saldo</p>
                         <p className={`text-xl font-black tracking-tight ${nuevoSaldo === 0 ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                            {formatMoney(nuevoSaldo)}
                         </p>
                      </div>
                      <div className={`p-3 rounded-xl ${nuevoSaldo === 0 ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-400'}`}>
                         <FiTrendingDown size={20} />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <FiShield size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">Operación Segura</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Registro inmutable en bóveda central.</p>
                         </div>
                      </div>
                   </div>
                </div>
                <FiActivity className="absolute -right-6 -bottom-6 text-indigo-500/5 opacity-30 group-hover:scale-110 transition-transform" size={120} />
             </div>

             <div className="px-4 flex items-start gap-3 opacity-40">
                <FiInfo className="text-slate-400 mt-0.5 shrink-0" size={14} />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   Usted certifica que el monto ingresado coincide con el efectivo recibido.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// app/dashboard/liquidar/reportar/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { 
  FiArrowLeft, 
  FiAlertTriangle, 
  FiCheck, 
  FiUser, 
  FiCalendar, 
  FiMessageSquare, 
  FiShield, 
  FiInfo,
  FiXCircle,
  FiActivity
} from "react-icons/fi";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { apiFetch } from "@/app/utils/api";

export default function ReportarFallaPage() {
  const { isAuthenticated, selectedStore, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noPago, setNoPago] = useState(null);
  const [tipoFalla, setTipoFalla] = useState("");
  const [comentario, setComentario] = useState("");
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    const storedNoPago = localStorage.getItem("noPago");
    const storedCliente = localStorage.getItem("cliente");

    if (!storedNoPago) {
      toast.error("No se encontró el registro a reportar.");
      router.push("/dashboard/liquidar");
      return;
    }

    try {
      const parsedNoPago = JSON.parse(storedNoPago);
      const parsedCliente = storedCliente ? JSON.parse(storedCliente) : null;
      setNoPago(parsedNoPago);
      setCliente(parsedCliente);
      setTipoFalla(parsedNoPago.visita_blanco?.tipo_falla || "Casa o Local Cerrado");
    } catch (e) {
      console.error("Error parsing data:", e);
      toast.error("Error al leer los datos de auditoría.");
      router.push("/dashboard/liquidar");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!tipoFalla) {
      toast.error("Por favor, selecciona un tipo de falla.");
      return;
    }

    setSubmitting(true);
    const updatedNoPago = {
      ...noPago,
      visita_blanco: { comentario, tipo_falla: tipoFalla },
    };

    try {
      const response = await apiFetch(
        `/recaudos/create/nopay/t/${noPago.tienda}/`,
        {
          method: "POST",
          body: JSON.stringify(updatedNoPago),
        }
      );

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.detail || "Error al reportar el no pago");
      }

      localStorage.removeItem("noPago");
      localStorage.removeItem("cliente");
      toast.warning("Reporte de visita sin recaudo sincronizado.", { autoClose: 1500 });
      router.push("/dashboard/liquidar");
    } catch (error) {
       toast.error(error.message || "Ocurrió un error en la sincronización.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (loading) return <LoadingSpinner />;

  const fallaOptions = [
    "Casa o Local Cerrado",
    "Cliente no Tiene Dinero",
    "Cliente de Viaje",
    "Cliente no Aparece",
    "Cliente Enfermo",
    "Dirección Errónea",
    "Otro Motivo",
  ];

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => {
              localStorage.removeItem("noPago");
              localStorage.removeItem("cliente");
              router.push("/dashboard/liquidar");
            }}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">
               {cliente?.nombres} {cliente?.apellidos}
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
               Reportar Incidencia • <span className="text-rose-500">Gst. Riesgo</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main Action Area */}
          <div className="xl:col-span-8">
             <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl relative">
                <div className="p-6 md:p-10 pb-32 md:pb-10"> {/* Extra padding bottom on mobile for sticky button */}
                   <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                      
                      {/* Motivo de la Falla */}
                      <div className="space-y-4 order-1">
                         <div className="flex items-center justify-between px-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Selección de Causa</span>
                           <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-md">Obligatorio</span>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {fallaOptions.map((option) => (
                               <button
                                 key={option}
                                 type="button"
                                 onClick={() => setTipoFalla(option)}
                                 className={`p-4 md:p-4 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-[0.98] ${
                                   tipoFalla === option 
                                     ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none ring-2 ring-rose-600/20 ring-offset-2 dark:ring-offset-slate-900' 
                                     : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                                 }`}
                               >
                                  <span className="text-[11px] font-black uppercase tracking-tight leading-none">{option}</span>
                                  {tipoFalla === option ? (
                                    <FiCheck size={16} className="shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700 shrink-0"></div>
                                  )}
                               </button>
                            ))}
                         </div>
                      </div>

                      {/* Sticky Mobile Action Bar */}
                      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto order-3 md:order-last">
                         <div className="flex flex-row items-center gap-3 max-w-7xl mx-auto px-0 lg:px-8">
                             <div className="flex flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 items-center gap-3">
                                <FiCalendar className="text-indigo-500 shrink-0" size={16} />
                                <div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Fecha</p>
                                   <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none">{noPago?.fecha_recaudo}</p>
                                </div>
                             </div>
                             
                             <button 
                               type="submit"
                               disabled={submitting || !tipoFalla}
                               className="w-full md:flex-[2] py-4.5 bg-rose-600 text-white rounded-2xl font-black text-xs md:text-[11px] uppercase tracking-widest shadow-xl shadow-rose-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-3"
                             >
                               {submitting ? (
                                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               ) : (
                                 <>
                                   <FiCheck size={18} />
                                   Reportar Incidencia
                                 </>
                               )}
                             </button>
                         </div>
                      </div>

                      {/* Observaciones extra - Moved below options, above buttons on desktop, above buttons logically on mobile */}
                      <div className="space-y-4 order-2">
                         <label htmlFor="observaciones" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Observaciones</label>
                         <textarea
                            id="observaciones"
                            placeholder="Detalles sobre la falla (opcional)..."
                            rows="2"
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none resize-none placeholder:text-slate-400"
                         />
                      </div>

                   </form>
                </div>
             </div>
          </div>

          {/* Secondary Info Area - Moved after Main on Mobile */}
          <div className="xl:col-span-4 space-y-6">
             <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden relative group shadow-xl">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <FiShield className="text-rose-500" />
                  Protocolo de Riesgo
                </h4>
                <div className="space-y-4 relative z-10">
                   <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                      <p className="text-[10px] font-bold text-rose-500 leading-relaxed uppercase tracking-tighter">
                         Este reporte afectará el score del cliente automáticamente. Asegúrese de que el motivo sea correcto antes de confirmar.
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impacto</p>
                         <p className="text-[10px] font-black text-rose-500 uppercase">-15 Pts</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Visibilidad</p>
                         <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">Supervisor</p>
                      </div>
                   </div>
                </div>
                <FiAlertTriangle className="absolute -right-6 -bottom-6 text-rose-500/5 opacity-30 group-hover:scale-110 transition-transform" size={120} />
             </div>

             <div className="px-4 flex items-start gap-3 opacity-40">
                <FiInfo className="text-slate-400 mt-0.5 shrink-0" size={14} />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   La clasificación de fallas es una herramienta crítica de auditoría. Use con precaución.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

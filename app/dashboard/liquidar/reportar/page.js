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

export default function ReportarFallaPage() {
  const { token, isAuthenticated, selectedStore, loading: authLoading } = useAuth();
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/create/nopay/t/${noPago.tienda}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.push("/dashboard/liquidar")}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 transition-all shadow-sm"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Reportar Incidencia</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Visita sin Recaudo • <span className="text-rose-500">Alerta de Riesgo</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Area */}
          <div className="lg:col-span-12 xl:col-span-7">
             <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl relative">
                <div className="p-10 md:p-14">
                   <div className="flex items-center gap-6 mb-12 pb-12 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-inner font-black text-xl">
                         <FiXCircle size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                            {cliente?.nombres} {cliente?.apellidos}
                         </h3>
                         <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">ID Venta: #{noPago.venta}</p>
                      </div>
                   </div>

                   <form onSubmit={handleSubmit} className="space-y-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Clasificación de la Falla</label>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {fallaOptions.map((option) => (
                               <button
                                 key={option}
                                 type="button"
                                 onClick={() => setTipoFalla(option)}
                                 className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                                   tipoFalla === option 
                                     ? 'bg-rose-600 border-rose-500 text-white shadow-xl shadow-rose-200 dark:shadow-none' 
                                     : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-rose-300 dark:hover:border-rose-900'
                                 }`}
                               >
                                  <span className="text-[12px] font-black uppercase tracking-tight">{option}</span>
                                  {tipoFalla === option && <FiCheck size={18} />}
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Evidencia / Comentarios de Campo</label>
                         <div className="relative group">
                            <FiMessageSquare className="absolute left-6 top-6 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                            <textarea 
                               placeholder="Detalle la situación encontrada para auditoría posterior..."
                               rows="4"
                               value={comentario}
                               onChange={(e) => setComentario(e.target.value)}
                               className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-sm font-bold text-slate-700 dark:text-white focus:ring-8 focus:ring-rose-500/5 focus:border-rose-500 transition-all outline-none resize-none placeholder:text-slate-300 uppercase tracking-tighter"
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                         <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <FiCalendar className="text-indigo-500" size={24} />
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Registro Temporal</p>
                               <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{noPago?.fecha_recaudo}</p>
                            </div>
                         </div>
                         <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-4">
                            <FiAlertTriangle className="text-rose-600" size={24} />
                            <div>
                               <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Monto Procesado</p>
                               <p className="text-sm font-black text-rose-600 uppercase">$0.00 (Falla)</p>
                            </div>
                         </div>
                      </div>

                      <div className="pt-6">
                         <button 
                           type="submit"
                           disabled={submitting}
                           className="w-full md:w-auto px-16 py-6 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                         >
                           {submitting ? (
                             <>
                               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               Sincronizando Alerta...
                             </>
                           ) : (
                             <>
                               <FiCheck size={20} />
                               Confirmar Reporte de Visita
                             </>
                           )}
                         </button>
                      </div>
                   </form>
                </div>
             </div>
          </div>

          {/* Context Area */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-8">
             <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden relative group shadow-2xl">
                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Análisis de Riesgo</h4>
                <div className="space-y-8">
                   <div className="p-8 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] border border-rose-100 dark:border-rose-900/30">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mb-3">Consecuencia del Reporte</p>
                      <p className="text-sm font-bold text-rose-500 leading-relaxed uppercase tracking-tighter">
                         Este registro aumenta el indicador de riesgo del cliente. Si las fallas son recurrentes, el sistema marcará automáticamente la cuenta para auditoría externa.
                      </p>
                   </div>

                   <div className="space-y-6 px-2">
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                            <FiActivity size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">Impacto en Score</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">-15 Puntos Score Crediticio</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                            <FiShield size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">Transparencia</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Registro visible para Supervisión Central.</p>
                         </div>
                      </div>
                   </div>
                </div>
                <FiAlertTriangle className="absolute -right-10 -bottom-10 text-rose-500/10 opacity-50 group-hover:scale-110 transition-transform" size={200} />
             </div>

             <div className="px-8 flex items-start gap-4 opacity-50">
                <FiInfo className="text-slate-400 mt-1 shrink-0" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                   El reporte de falla es una herramienta de gestión. Asegúrese de que la clasificación seleccionada refleje fielmente el motivo indicado por el cliente o la situación encontrada en el predio.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

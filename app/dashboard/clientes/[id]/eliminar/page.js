// app/dashboard/clientes/[id]/eliminar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  FiTrash2, 
  FiX, 
  FiCheck, 
  FiArrowLeft,
  FiUser,
  FiAlertTriangle,
  FiCreditCard,
  FiShield,
  FiAlertCircle,
  FiInfo,
  FiTrendingDown
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import LoadingSpinner from "../../../../components/LoadingSpinner";

export default function EliminarCliente() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  
  const [cliente, setCliente] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSales, setHasActiveSales] = useState(false);

  // Cargar datos del cliente
  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchCliente();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchCliente = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la información del cliente");
      }

      const data = await response.json();
      setCliente(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching client:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError("");
    setHasActiveSales(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Manejar respuesta exitosa
      if (response.status === 200 || response.status === 204) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/clientes"), 1500);
        return;
      }

      // Manejar respuesta con error
      const responseData = await response.json();
      
      // Caso específico: cliente con ventas activas
      if (responseData.message === "No se puede eliminar el cliente ya que tiene ventas activas") {
        setHasActiveSales(true);
        setError("Bloqueo de Seguridad: Registro con Carteras Activas");
        return;
      }

      // Otros errores
      setError(responseData.message || "Fallo en la purga del registro");
    } catch (err) {
      setError("Error crítico de sincronización central");
      console.error("Error deleting client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore || isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sincronizando Protocolos de Purga</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass p-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 text-center max-w-md w-full">
           <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <FiX size={32} />
           </div>
           <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 leading-tight">Error de Localización</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">{error || "El registro no existe o ha sido modificado recientemente."}</p>
           <button 
             onClick={() => router.push("/dashboard/clientes")}
             className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
           >
             Regresar al HUB
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.push(`/dashboard/clientes/${clienteId}`)}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Protocolo de Purga</h1>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Eliminación Permanente de Registro Maestro</p>
          </div>
        </div>

        <div className="glass rounded-[3rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl relative">
          <div className="bg-rose-600 p-10 text-white relative overflow-hidden">
             <div className="relative z-10 flex items-center gap-6">
                <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-md shadow-inner">
                   <FiTrash2 className="text-4xl text-white" />
                </div>
                <div>
                   <p className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-1 leading-none">Acción Irreversible</p>
                   <h2 className="text-3xl font-black tracking-tighter leading-tight">¿Desea purgar este registro?</h2>
                </div>
             </div>
             <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="p-10 md:p-14 bg-white/40 dark:bg-transparent">
            {error && (
              <div className="mb-10 p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-start gap-5">
                <div className="bg-rose-100 dark:bg-rose-900/40 p-3 rounded-2xl flex-shrink-0">
                   <FiAlertTriangle className="text-rose-600 text-xl" />
                </div>
                <div className="flex-1">
                   <p className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-4">{error}</p>
                   
                   {hasActiveSales && (
                     <div className="bg-white/60 dark:bg-slate-900/40 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Requisitos de Desbloqueo:</p>
                        <div className="space-y-3 mb-8">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Liquidar saldos pendientes de crédito</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Marcar ventas activas como &quot;Perdida&quot; o &quot;Pagado&quot;</span>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <Link
                             href={`/dashboard/ventas?cliente=${clienteId}`}
                             className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                           >
                             <FiCreditCard />
                             Auditar Carteras
                           </Link>
                           <button
                             onClick={() => router.push(`/dashboard/clientes/${clienteId}`)}
                             className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                           >
                             Detalle Maestro
                           </button>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            )}

            {success ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-10 relative">
                   <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                   <FiCheck className="text-emerald-600 text-5xl relative z-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tighter uppercase">Purga Certificada</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Redirigiendo a la base central de datos...</p>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="p-8 bg-rose-50/50 dark:bg-rose-900/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 relative overflow-hidden group">
                   <div className="relative z-10 flex items-start gap-6">
                      <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-200 dark:shadow-none shrink-0">
                         <FiAlertCircle size={24} className="animate-pulse" />
                      </div>
                      <div>
                         <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest leading-none mb-2">Advertencia de Seguridad</p>
                         <p className="text-[13px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-tighter">
                            Esta operación purgará irreversiblemente el expediente de <span className="text-slate-900 dark:text-white font-black underline decoration-rose-500/30">{cliente.nombres} {cliente.apellidos}</span>. 
                            Se perderán historiales crediticios, métricas de cumplimiento y registros maestros.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-8">
                     <FiShield size={18} className="text-indigo-500" />
                     <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">Información de Verificación</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nombre del Titular</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase">{cliente.nombres} {cliente.apellidos}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">ID Identificación</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">{cliente.identificacion}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Punto de Gestión</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase">{cliente.nombre_local || "Ubicación Particular"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Contacto Vinculado</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">{cliente.telefono_principal}</p>
                    </div>
                  </div>
                </div>

                {!hasActiveSales && (
                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/clientes/${clienteId}`)}
                      className="px-10 py-5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
                    >
                      Descartar Purga
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-12 py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Iniciando Purga...
                        </>
                      ) : (
                        <>
                          <FiTrash2 size={18} />
                          Confirmar Purga Permanente
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Footer Info */}
        <div className="mt-12 glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 flex items-center gap-8 relative overflow-hidden group">
           <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl relative z-10 shrink-0">
              <FiInfo size={28} />
           </div>
           <div className="relative z-10">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">Registro Maestro Seleccionado</h4>
              <p className="text-[12px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                 {cliente.nombres} {cliente.apellidos}
              </p>
           </div>
           <FiTrendingDown className="absolute -right-8 -bottom-8 text-indigo-500/5 group-hover:scale-125 transition-transform" size={160} />
        </div>
      </div>
    </div>
  );
}
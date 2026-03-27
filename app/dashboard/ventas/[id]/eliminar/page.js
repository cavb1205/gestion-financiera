// app/dashboard/ventas/[id]/eliminar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiAlertTriangle,
  FiLock,
  FiXCircle,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import { apiFetch } from "../../../../utils/api";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { toast } from "react-toastify";
import { formatMoney } from "../../../../utils/format";

export default function EliminarVentaPage() {
  const router = useRouter();
  const params = useParams();
  const ventaId = params.id;
  const { selectedStore, isAuthenticated, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [ventaData, setVentaData] = useState(null);
  const [hasPagos, setHasPagos] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVenta();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchVenta = async () => {
    try {
      setIsLoading(true);
      const [response, pagosResponse] = await Promise.all([
        apiFetch(`/ventas/${ventaId}/`),
        apiFetch(`/recaudos/list/${ventaId}/`),
      ]);

      if (!response.ok) throw new Error("No se pudieron cargar los datos de la venta");
      const venta = await response.json();

      let pagos = [];
      if (pagosResponse.ok) pagos = await pagosResponse.json();
      
      setHasPagos(pagos.length > 0);
      setVentaData(venta);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (hasPagos) {
      toast.error("Restricción de Integridad: No es posible eliminar ventas con recaudos activos.");
      return;
    }
    
    setIsDeleting(true);
    setError("");
    
    try {
      const response = await apiFetch(`/ventas/${ventaId}/delete/t/${selectedStore.tienda.id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Error al eliminar la venta");
      }

      toast.success("¡Contrato removido del sistema!");
      router.push("/dashboard/ventas");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };


  if (loading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] animate-pulse">Auditando Dependencias del Contrato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 active:scale-95 transition-all shadow-sm group shrink-0"
          >
            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Depuración de Contrato</h1>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mt-1">
              Remoción Permanente • <span className="opacity-60">ID #{ventaId}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
             <FiShield className="text-rose-600" />
             <p className="text-rose-700 dark:text-rose-400 text-sm font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}

        <div className="glass p-10 md:p-14 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-12">
               <div className="w-20 h-20 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200 dark:shadow-none animate-pulse">
                  <FiAlertTriangle size={36} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">Confirmar Acción Destructiva</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sincronización Crítica de Datos</p>
               </div>
            </div>

            {hasPagos ? (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-8 mb-10">
                 <div className="flex items-start gap-4">
                    <FiLock className="text-amber-600 mt-1 shrink-0" size={24} />
                    <div className="space-y-2">
                       <h3 className="text-base font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">Acción Denegada por Trazabilidad</h3>
                       <p className="text-sm font-bold text-amber-700/80 dark:text-amber-500 leading-relaxed uppercase tracking-tighter">
                         Este contrato posee recaudos históricos. Eliminarlo generaría una inconsistencia en los libros contables. Si desea proceder, debe anular manualmente cada abono vinculado primero.
                       </p>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-8 mb-10">
                 <div className="flex items-start gap-4">
                    <FiInfo className="text-rose-600 mt-1 shrink-0" size={24} />
                    <div className="space-y-2">
                       <h3 className="text-base font-black text-rose-900 dark:text-rose-400 uppercase tracking-tight">Advertencia de Eliminación</h3>
                       <p className="text-sm font-bold text-rose-700/80 dark:text-rose-500 leading-relaxed uppercase tracking-tighter">
                         Al confirmar, se eliminará toda la proyección de cuotas y registros del contrato. Esta operación es <span className="underline decoration-2">irreversible</span>.
                       </p>
                    </div>
                 </div>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 mb-12">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Snapshot del Objeto</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Titular</p>
                     <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                        {ventaData?.cliente?.nombres} {ventaData?.cliente?.apellidos}
                     </p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Apertura</p>
                     <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                        {ventaData?.fecha_venta}
                     </p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Capital Base</p>
                     <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                        {formatMoney(ventaData?.valor_venta)}
                     </p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Plan Contratado</p>
                     <p className="text-lg font-black text-slate-800 dark:text-white leading-tight uppercase">
                        {ventaData?.cuotas} Cuotas @ {ventaData?.interes}%
                     </p>
                  </div>
               </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-end gap-6">
               <button
                 type="button"
                 onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
                 className="w-full md:w-auto px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
               >
                 Abortar Operación
               </button>
               <button
                 type="button"
                 onClick={handleDelete}
                 disabled={isDeleting || hasPagos}
                 className="w-full md:w-auto flex items-center justify-center gap-4 px-16 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-rose-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
               >
                 {isDeleting ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : (
                   <>
                     <FiTrash2 size={20} />
                     Eliminar Definitivamente
                   </>
                 )}
               </button>
            </div>
          </div>

          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="mt-10 flex items-center gap-4 px-8 opacity-40">
           <FiShield className="text-slate-400 shrink-0" />
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
             Protocolo de seguridad activo: La remoción de registros está auditada para prevenir fugas de información financiera en {selectedStore?.tienda?.nombre}.
           </p>
        </div>
      </div>
    </div>
  );
}
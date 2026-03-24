// app/select-store/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { 
  FiArrowLeft, 
  FiCheck, 
  FiLogOut, 
  FiShoppingCart, 
  FiTrendingUp, 
  FiDollarSign,
  FiShoppingBag,
  FiActivity
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "../utils/format";

export default function SelectStorePage() {
  const { token, logout, selectStore, user } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tiendas/list/tiendas/admin/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener las tiendas asociadas");
        }

        const data = await response.json();
        setStores(data);
      } catch (err) {
        setError(err.message || "Error al cargar las tiendas");
        toast.error("Error al sincronizar sucursales");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [token, router]);

  const handleSelectStore = (store) => {
    if (!store) return;
    selectStore(store);
    toast.success(`Accediendo a ${store.tienda.nombre}`, { autoClose: 1500 });
    router.push("/dashboard");
  };


  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <LoadingSpinner />
      <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Sucursales</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[130px] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/15 blur-[130px] rounded-full animate-pulse opacity-60" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-6xl w-full relative z-10 pt-6 md:pt-12 pb-16 md:pb-24">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 md:mb-16 gap-4">
          <div>
             <div className="flex items-center gap-3 md:gap-4 mb-2">
                <div className="p-2.5 md:p-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-xl md:rounded-2xl shrink-0">
                   <FiShoppingBag className="text-emerald-500 text-lg md:text-2xl" />
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">
                  Seleccionar<span className="text-emerald-500 ml-2">Sucursal</span>
                </h1>
             </div>
             {user && (
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
                 {user.username || user.email || "Administrador"}
               </p>
             )}
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl md:rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl group shrink-0"
          >
            <FiLogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>

        {error ? (
          <div className="glass p-12 rounded-[3rem] border-rose-500/20 text-center max-w-lg mx-auto backdrop-blur-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <FiActivity className="text-rose-500 text-3xl" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Error de Sincronización</h2>
            <p className="text-slate-400 text-sm font-medium mb-8 uppercase tracking-tighter">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-emerald-600 transition-all"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleSelectStore(store)}
                className="glass group cursor-pointer border-white/5 hover:border-emerald-500/50 transition-all duration-300 rounded-[2.5rem] overflow-hidden hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
              >
                {/* Visual indicator of selection on hover */}
                <div className="absolute top-0 right-0 p-8 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500 opacity-0 group-hover:opacity-100">
                   <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                      <FiCheck size={24} />
                   </div>
                </div>

                <div className="p-10">
                  <div className="mb-8">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2 px-1">Sucursal Activa</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase truncate group-hover:text-emerald-400 transition-colors">
                      {store.tienda.nombre}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Caja Actual</p>
                        <p className={`text-lg font-black tracking-tight ${store.tienda.caja >= 0 ? 'text-white' : 'text-rose-500'}`}>
                          {formatMoney(store.tienda.caja)}
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                         <FiDollarSign size={18} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cuentas x Cobrar</p>
                        <p className="text-sm font-black text-slate-300">
                          {formatMoney(store.tienda.dinero_x_cobrar)}
                        </p>
                      </div>
                      <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/10 flex flex-col justify-center">
                        <p className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest mb-1 font-extrabold">Total Valor</p>
                        <p className="text-sm font-black text-emerald-500 tracking-tighter">
                          {formatMoney(store.tienda.caja + store.tienda.dinero_x_cobrar)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-10 py-6 bg-white/5 border-t border-white/5 flex items-center justify-center gap-3 group-hover:bg-emerald-600 transition-all duration-500">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Ingresar a Gestión</span>
                   <FiActivity className="text-slate-500 group-hover:text-white animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {stores.length === 0 && !loading && !error && (
          <div className="glass p-20 rounded-[3rem] border-white/10 text-center max-w-2xl mx-auto backdrop-blur-2xl">
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-300">
               <FiShoppingCart size={40} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-6 italic leading-none">Sin Sucursales Asignadas</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose mb-12">No hemos detectado ninguna sucursal operativa vinculada a su perfil de administrador core.</p>
            <button
              onClick={logout}
              className="px-12 py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 mx-auto"
            >
              <FiLogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* Subtle Bottom Decoration */}
      <div className="absolute bottom-10 left-10 opacity-5 pointer-events-none rotate-12">
        <FiTrendingUp size={300} className="text-white" />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiActivity,
  FiArrowRight,
  FiUserCheck,
  FiRefreshCw,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function TrabajadoresPage() {
  const { selectedStore, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTrabajadores = async () => {
    if (!selectedStore?.tienda?.id) return;
    try {
      setLoading(true);
      const response = await apiFetch(
        `/trabajadores/t/${selectedStore.tienda.id}/`
      );
      if (response.ok) {
        const data = await response.json();
        setTrabajadores(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrabajadores();
  }, [selectedStore]);

  const filteredTrabajadores = trabajadores.filter(
    (t) =>
      t.trabajador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.identificacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Auditando Nómina de Colaboradores</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="w-full">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Nómina de Personal</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Recurso Humano • <span className="text-slate-400">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchTrabajadores}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
            >
              <FiRefreshCw size={18} />
            </button>
            <button
              onClick={() => router.push("/dashboard/trabajadores/crear")}
              className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
            >
              <FiPlus size={16} />
              <span className="hidden md:inline">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass rounded-[2rem] p-5 border-white/60 dark:border-slate-800 mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o identificación..."
                className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <FiUserCheck className="text-emerald-500" size={16} />
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{filteredTrabajadores.length}</span>
            </div>
          </div>
        </div>

        {/* Workers Grid */}
        {filteredTrabajadores.length === 0 ? (
          <div className="glass py-20 rounded-[3rem] border-white/60 dark:border-slate-800 text-center shadow-xl">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <FiUsers size={36} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
              {searchTerm ? "Sin coincidencias" : "Sin trabajadores"}
            </h3>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
              {searchTerm
                ? "Ningún colaborador coincide con tu búsqueda."
                : "Agrega tu primer trabajador para asignar rutas de cobro."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push("/dashboard/trabajadores/crear")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all"
              >
                Agregar Primer Trabajador
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrabajadores.map((trabajador) => (
              <div
                key={trabajador.id}
                onClick={() => router.push(`/dashboard/trabajadores/${trabajador.id}`)}
                className="glass rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className="p-8 relative">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-slate-900 dark:bg-indigo-600 rounded-[1.1rem] flex items-center justify-center text-white font-black text-xl uppercase shadow-lg group-hover:scale-110 transition-transform">
                        {trabajador.trabajador.charAt(0)}
                      </div>
                      <span className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30">
                        Activo
                      </span>
                    </div>

                    <div className="space-y-0.5 mb-6">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight capitalize">
                        {trabajador.trabajador.toLowerCase()}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                        <FiActivity size={11} />
                        Colaborador Operativo
                      </div>
                    </div>

                    <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                          <FiCreditCard size={13} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{trabajador.identificacion}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                          <FiPhone size={13} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{trabajador.telefono || "Sin registro"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                          <FiMapPin size={13} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 truncate">{trabajador.direccion || "No registrada"}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID #{trabajador.id.toString().padStart(3, '0')}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                        Ver Detalle
                        <FiArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

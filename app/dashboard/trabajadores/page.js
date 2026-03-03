"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { 
  FiUsers, 
  FiSearch, 
  FiPlus, 
  FiPhone, 
  FiMapPin, 
  FiCreditCard, 
  FiActivity, 
  FiShield,
  FiFilter,
  FiArrowRight,
  FiUserCheck,
  FiInfo
} from "react-icons/fi";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function TrabajadoresPage() {
  const { selectedStore, token, loading: authLoading } = useAuth();
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTrabajadores = async () => {
      if (!selectedStore?.tienda?.id || !token) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trabajadores/t/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTrabajadores(Array.isArray(data) ? data : []);
        } else {
          console.error("Error al cargar trabajadores");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrabajadores();
  }, [selectedStore, token]);

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
    <div className="min-h-screen bg-transparent pb-20">
      <div className="w-full">

        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
               <FiUsers className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Nómina de Personal</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Recurso Humano • <span className="text-indigo-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Personal Activo</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{trabajadores.length}</span>
               </div>
               <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FiUserCheck size={20} />
               </div>
            </div>
          </div>
        </div>

        {/* Search & Statistics Banner */}
        <div className="glass rounded-[2.5rem] p-8 border-white/60 dark:border-slate-800 mb-10 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative group">
           <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 w-full relative group/input">
                 <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" size={20} />
                 <input
                   type="text"
                   placeholder="Localizar por nombre, identificación o cargo..."
                   className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-[14px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner outline-none"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-6 divide-x divide-slate-100 dark:divide-slate-800">
                 <div className="flex items-center gap-3">
                    <FiFilter className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredTrabajadores.length} Coincidencias</span>
                 </div>
                 <div className="pl-6 flex items-center gap-4">
                    <FiInfo className="text-indigo-400" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter max-w-[150px] leading-tight">Gestión centralizada de permisos y roles operativos.</p>
                 </div>
              </div>
           </div>
           {/* Decorative background circle */}
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        </div>

        {/* Workers Grid */}
        {filteredTrabajadores.length === 0 ? (
          <div className="glass py-24 rounded-[3rem] border-white/60 dark:border-slate-800 text-center shadow-xl">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
              <FiUsers size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">No se detectaron registros</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              {searchTerm 
                ? "El criterio de búsqueda no coincide con ningún colaborador activo." 
                : "Aún no se han vinculado colaboradores para esta sucursal."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrabajadores.map((trabajador) => (
              <div
                key={trabajador.id}
                className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="p-10 relative">
                  {/* Card Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-16 h-16 bg-slate-900 dark:bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl uppercase shadow-xl group-hover:scale-110 transition-transform">
                        {trabajador.trabajador.charAt(0)}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                           Estatus: Activo
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mt-2">ID #{trabajador.id.toString().padStart(3, '0')}</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-8">
                       <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-tight capitalize">
                          {trabajador.trabajador.toLowerCase()}
                       </h3>
                       <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                          <FiActivity size={12} />
                          Colaborador Operativo
                       </div>
                    </div>

                    <div className="space-y-5 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-4 group/info">
                         <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover/info:text-indigo-500 transition-colors border border-transparent group-hover/info:border-indigo-100">
                           <FiCreditCard size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Identificación</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">{trabajador.identificacion}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 group/info">
                         <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover/info:text-indigo-500 transition-colors border border-transparent group-hover/info:border-indigo-100">
                           <FiPhone size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Contacto Directo</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">{trabajador.telefono || "Sin Registro"}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 group/info">
                         <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover/info:text-indigo-500 transition-colors border border-transparent group-hover/info:border-indigo-100">
                           <FiMapPin size={14} />
                         </div>
                         <div className="flex flex-col overflow-hidden">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ubicación</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight truncate">{trabajador.direccion || "No Detectada"}</span>
                         </div>
                      </div>
                    </div>
                    
                    <button className="w-full mt-10 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 hover:text-white dark:hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                       Detalle de Colaborador
                       <FiArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Global Security Disclaimer */}
        <div className="mt-16 flex items-center gap-6 px-10 py-8 bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] border border-white/60 dark:border-slate-800/50">
           <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
              <FiShield size={28} />
           </div>
           <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">Protección de Datos & Roles</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                 Toda la información personal de los colaboradores está bajo el protocolo de privacidad de <span className="text-indigo-600">Gestión Financiera Central</span>. 
                 Los cambios en perfiles impactarán directamente en la auditoría de cajas y liquidaciones.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
// app/dashboard/layout.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiUser,
  FiDollarSign,
  FiBarChart2,
  FiLogOut,
  FiSettings,
  FiBell,
  FiShoppingBag,
  FiRefreshCw,
  FiTrendingDown,
  FiMenu,
  FiX,
  FiPocket,
  FiCreditCard,
  FiShoppingCart,
  FiCheckCircle,
  FiTrendingUp,
  FiFileText,
  FiPieChart,
  FiClipboard,
  FiDollarSign as FiDollar,
  FiUsers,
  FiPackage,
  FiActivity,
  FiCalendar,
  FiTablet,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";
import SessionTimeout from "../components/SessionTimeout";

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiHome },
  { path: '/dashboard/clientes', label: 'Clientes', icon: FiUsers },
  { path: '/dashboard/aportes', label: 'Gestión Aportes', icon: FiDollar },
  { path: '/dashboard/ventas', label: 'Ventas Activas', icon: FiShoppingCart },
  { path: '/dashboard/ventas/perdidas', label: 'Ventas Pérdida', icon: FiTrendingDown },
  { path: '/dashboard/gastos', label: 'Control Gastos', icon: FiTrendingDown },
  { path: '/dashboard/utilidades', label: 'Utilidades', icon: FiTrendingUp },
  { path: '/dashboard/trabajadores', label: 'Trabajadores', icon: FiUsers },
  { path: '/dashboard/sueldos', label: 'Cálculo Sueldo', icon: FiTablet },
  { path: '/dashboard/liquidar', label: 'Liquidación', icon: FiCheckCircle },
  { path: '/dashboard/recaudos', label: 'Recaudos', icon: FiPackage },
  { path: '/dashboard/cierre-caja', label: 'Cierre de Caja', icon: FiCreditCard },
  { path: '/dashboard/reportes/utilidad', label: 'Inteligencia', icon: FiPieChart },
  { path: '/dashboard/membresias', label: 'Membresía', icon: FiShield },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, logout, selectedStore, isAuthenticated, loading } =
    useAuth();
  const [storeInfo, setStoreInfo] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/login");
    } else if (selectedStore) {
      setStoreInfo({
        nombre: selectedStore.tienda.nombre,
        id: selectedStore.tienda.id,
      });
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (selectedStore) {
      // Ajuste de Zona Horaria: Crear fecha local 00:00 basada en la fecha UTC parseada
      const fechaBase = new Date(selectedStore.fecha_vencimiento);
      const vencimiento = new Date(
        fechaBase.getUTCFullYear(),
        fechaBase.getUTCMonth(),
        fechaBase.getUTCDate()
      );

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const diffTime = vencimiento - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Permitimos el acceso hasta el final del día de vencimiento (diffDays >= 0)
      const expired = diffDays < 0;
      setIsExpired(expired);

      // Si está expirado, solo permitir dashboard y membresías (para poder renovar)
      if (expired && pathname !== '/dashboard' && !pathname.includes('/select-store') && !pathname.includes('/membresias')) {
         router.push('/dashboard');
      }
    }
  }, [selectedStore, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !selectedStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  const isActive = (path) => {
    if (path === '/dashboard/ventas') {
      return pathname === '/dashboard/ventas' || (pathname.startsWith('/dashboard/ventas/') && !pathname.startsWith('/dashboard/ventas/perdidas'));
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen h-[100svh] bg-slate-50 dark:bg-slate-950 md:flex-row overflow-hidden font-sans antialiased text-slate-900">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <FiShoppingBag className="text-white text-lg" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800 dark:text-white">
            {isActive("/dashboard/clientes") ? "Clientes" : 
             isActive("/dashboard/aportes") ? "Aportes" :
             isActive("/dashboard/ventas") ? "Ventas" :
             isActive("/dashboard/gastos") ? "Gastos" :
             isActive("/dashboard/utilidades") ? "Utilidades" :
             isActive("/dashboard/trabajadores") ? "Trabajadores" :
             isActive("/dashboard/sueldos") ? "Sueldos" :
             isActive("/dashboard/liquidar") ? "Créditos" :
             isActive("/dashboard/recaudos") ? "Recaudos" :
             isActive("/dashboard/cierre-caja") ? "Cierre de Caja" :
             isActive("/dashboard/reportes") ? "Reportes" :
             isActive("/dashboard/membresias") ? "Membresía" : "Dashboard"}
          </h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
        >
          {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 w-80 h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col p-6 slide-in-from-left duration-300">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-indigo-600 p-2.5 rounded-2xl">
                <FiShoppingBag className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">Cartera</h1>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Enterprise Edition</p>
              </div>
            </div>
            
            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive(item.path) && (item.path !== '/dashboard' || (pathname === '/dashboard'))
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-x-1"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 pt-6 pb-8 border-t border-slate-100 dark:border-slate-800 space-y-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[1rem] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-black text-indigo-600">
                  {profile?.trabajador?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-xs font-black truncate">{profile?.trabajador || "Usuario"}</p>
                  <p className="text-[10px] text-slate-400 font-bold truncate max-w-[180px]">{storeInfo?.nombre}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/select-store");
                  }}
                  className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95"
                >
                  <FiRefreshCw size={16} />
                  Ruta
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center gap-2 py-3.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all active:scale-95"
                >
                  <FiLogOut size={16} />
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 transition-all duration-300">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <FiShoppingBag className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white">Cartera</h1>
              <span className="text-[9px] font-black text-indigo-500 tracking-[0.3em] uppercase">Control Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-5 overflow-y-auto custom-scrollbar space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between group px-5 py-3.5 rounded-[1.25rem] text-[13px] font-bold transition-all relative overflow-hidden ${
                isActive(item.path) && (item.path !== '/dashboard' || (pathname === '/dashboard'))
                  ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-2xl shadow-slate-400/20 dark:shadow-none"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <item.icon size={18} className={`${isActive(item.path) ? "text-white" : "group-hover:text-indigo-600"}`} />
                <span className="tracking-tight">{item.label}</span>
              </div>
              {isActive(item.path) && (
                <div className="w-1 h-5 bg-white rounded-full relative z-10"></div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Info & Actions */}
        <div className="p-6 mt-auto">
          <div className="glass rounded-[2rem] p-5 shadow-2xl shadow-slate-200 dark:shadow-none border-slate-100 dark:border-slate-800 group">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200 dark:shadow-none group-hover:rotate-[10deg] transition-transform">
                {profile?.trabajador?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-black text-slate-800 dark:text-white truncate">{profile?.trabajador || "Usuario"}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <FiShoppingBag className="text-indigo-500" />
                  <span className="truncate">{storeInfo?.nombre}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => router.push("/select-store")}
                title="Cambiar Ruta"
                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 transition-all flex justify-center"
              >
                <FiRefreshCw size={16} />
              </button>
              <button 
                onClick={logout}
                title="Cerrar Sesión"
                className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all flex justify-center"
              >
                <FiLogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 relative">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-10 py-8 bg-transparent">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 text-indigo-600">
               <FiActivity size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
               Evolución de Negocio
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <button className="relative p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-all shadow-sm group">
                <FiBell size={20} />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full group-hover:scale-125 transition-transform"></span>
             </button>
             <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
             <div className="flex items-center gap-4 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Operación Activa</p>
                  <p className="text-[13px] font-black text-slate-800 dark:text-white">{profile?.trabajador}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-xl flex items-center justify-center font-black text-slate-500">
                  {profile?.trabajador?.charAt(0)}
                </div>
             </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
           <div className="max-w-full mx-auto px-4 md:px-8 pb-10 pt-0">
             {children}
           </div>
        </main>

      </div>

      {/* Modal de inactividad con renovación de sesión */}
      <SessionTimeout />
    </div>
  );
}
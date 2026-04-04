// app/dashboard/layout.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiBarChart2,
  FiLogOut,
  FiBell,
  FiShoppingBag,
  FiRefreshCw,
  FiTrendingDown,
  FiMenu,
  FiX,
  FiCreditCard,
  FiShoppingCart,
  FiCheckCircle,
  FiTrendingUp,
  FiPieChart,
  FiDollarSign as FiDollar,
  FiUsers,
  FiPackage,
  FiActivity,
  FiTablet,
  FiShield,
  FiChevronDown,
  FiEye,
  FiSun,
  FiMoon,
  FiHelpCircle,
  FiBookOpen,
  FiKey,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/format";
import { useTheme } from "../context/ThemeContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";
import SessionTimeout from "../components/SessionTimeout";
import OnboardingTour from "../components/OnboardingTour";

// Menu items with role restrictions: adminOnly = true means only visible to admins (is_staff)
const allMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiHome, adminOnly: true },
  { path: '/dashboard/aportes', label: 'Gestión Aportes', icon: FiDollar, adminOnly: true },
  { path: '/dashboard/gastos', label: 'Control Gastos', icon: FiTrendingDown },
  { path: '/dashboard/utilidades', label: 'Utilidades', icon: FiTrendingUp, adminOnly: true },
  { path: '/dashboard/ventas', label: 'Ventas Activas', icon: FiShoppingCart },
  { path: '/dashboard/ventas/perdidas', label: 'Ventas Pérdida', icon: FiTrendingDown, adminOnly: true },
  { path: '/dashboard/liquidar', label: 'Liquidación', icon: FiCheckCircle },
  { path: '/dashboard/recaudos', label: 'Recaudos', icon: FiPackage },
  { path: '/dashboard/clientes', label: 'Clientes', icon: FiUsers },
  { path: '/dashboard/trabajadores', label: 'Trabajadores', icon: FiUsers, adminOnly: true },
  { path: '/dashboard/sueldos', label: 'Cálculo Sueldo', icon: FiTablet, adminOnly: true },
  { path: '/dashboard/cierre-caja', label: 'Cierre de Caja', icon: FiCreditCard },
  {
    label: 'Reportes', icon: FiBarChart2, adminOnly: true, submenu: [
      { path: '/dashboard/reportes/utilidad', label: 'Utilidad', icon: FiPieChart },
      { path: '/dashboard/reportes/cartera', label: 'Cartera', icon: FiActivity },
      { path: '/dashboard/reportes/gastos', label: 'Gastos', icon: FiDollar },
      { path: '/dashboard/reportes/visitas', label: 'Visitas', icon: FiEye },
      { path: '/dashboard/reportes/comparativo', label: 'Comparativo', icon: FiBarChart2 },
    ]
  },
  { path: '/dashboard/membresias', label: 'Membresía', icon: FiShield, adminOnly: true },
  { path: '/dashboard/admin/rutas', label: 'Administrar Rutas', icon: FiShield, rootOnly: true },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, logout, selectedStore, isAuthenticated, loading } =
    useAuth();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = user?.is_staff || user?.is_superuser;
  const isWorker = !isAdmin;

  // Filter menu items based on role
  const menuItems = allMenuItems.filter(item => {
    if (item.rootOnly && !user?.is_superuser) return false;
    if (item.adminOnly && isWorker) return false;
    if (item.workerOnly && isAdmin) return false;
    return true;
  });

  const [storeInfo, setStoreInfo] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportesOpen, setReportesOpen] = useState(() => false);
  const [showTour, setShowTour] = useState(false);

  // Auto-open reportes submenu when on a report page
  useEffect(() => {
    if (pathname.startsWith('/dashboard/reportes')) {
      setReportesOpen(true);
    }
  }, [pathname]);

  // Show onboarding tour for first-time users
  useEffect(() => {
    if (isAuthenticated && selectedStore) {
      const tourDone = localStorage.getItem('cartera_tour_done');
      if (!tourDone) {
        setShowTour(true);
      }
    }
  }, [isAuthenticated, selectedStore]);

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

  // Route guard: redirect workers away from admin-only pages
  const workerAllowedPaths = ['/dashboard/liquidar', '/dashboard/recaudos', '/dashboard/cierre-caja', '/dashboard/ventas', '/dashboard/clientes', '/dashboard/gastos', '/dashboard/perfil'];
  useEffect(() => {
    if (!loading && isAuthenticated && isWorker) {
      const isAllowed = workerAllowedPaths.some(p => pathname.startsWith(p));
      if (!isAllowed) {
        router.push('/dashboard/liquidar');
      }
    }
  }, [loading, isAuthenticated, isWorker, pathname, router]);

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
      if (expired && pathname !== '/dashboard' && !pathname.includes('/select-store') && !pathname.includes('/membresias') && !pathname.includes('/admin/rutas')) {
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTour(true)}
            title="Tour de ayuda"
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-indigo-500 dark:text-indigo-400"
          >
            <FiHelpCircle size={18} />
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
          >
            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
          >
            {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
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
              {menuItems.map((item) => item.submenu ? (
                <div key={item.label}>
                  <button
                    onClick={() => setReportesOpen(!reportesOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${pathname.startsWith('/dashboard/reportes')
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      {item.label}
                    </div>
                    <FiChevronDown size={14} className={`transition-transform duration-200 ${reportesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {reportesOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all ${pathname.startsWith(sub.path)
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-x-1"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                          <sub.icon size={16} />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive(item.path) && (item.path !== '/dashboard' || (pathname === '/dashboard'))
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
                  {isWorker && selectedStore?.tienda?.caja !== undefined && (
                    <div className={`mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit ${selectedStore.tienda.caja >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                      <FiDollar size={10} />
                      Caja: {formatMoney(selectedStore.tienda.caja)}
                    </div>
                  )}
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
                <Link
                  href="/guia-rapida"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-95"
                >
                  <FiBookOpen size={16} />
                  Guía
                </Link>
                <Link
                  href="/dashboard/perfil"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all active:scale-95"
                >
                  <FiKey size={16} />
                  Clave
                </Link>
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
          {menuItems.map((item) => item.submenu ? (
            <div key={item.label}>
              <button
                onClick={() => setReportesOpen(!reportesOpen)}
                className={`w-full flex items-center justify-between group px-5 py-3.5 rounded-[1.25rem] text-[13px] font-bold transition-all ${pathname.startsWith('/dashboard/reportes')
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={18} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                <FiChevronDown size={14} className={`transition-transform duration-200 ${reportesOpen ? 'rotate-180' : ''}`} />
              </button>
              {reportesOpen && (
                <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.path}
                      href={sub.path}
                      className={`flex items-center justify-between group px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all relative overflow-hidden ${pathname.startsWith(sub.path)
                        ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-lg shadow-slate-400/20 dark:shadow-none"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                        }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <sub.icon size={15} className={`${pathname.startsWith(sub.path) ? "text-white" : "group-hover:text-indigo-600"}`} />
                        <span className="tracking-tight">{sub.label}</span>
                      </div>
                      {pathname.startsWith(sub.path) && (
                        <div className="w-1 h-4 bg-white rounded-full relative z-10"></div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between group px-5 py-3.5 rounded-[1.25rem] text-[13px] font-bold transition-all relative overflow-hidden ${isActive(item.path) && (item.path !== '/dashboard' || (pathname === '/dashboard'))
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
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest ${isAdmin ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                    {isAdmin ? 'ADMIN' : 'COBRADOR'}
                  </span>
                </div>
                {isWorker && selectedStore?.tienda?.caja !== undefined && (
                  <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit ${selectedStore.tienda.caja >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                    <FiDollar size={10} />
                    Caja: {formatMoney(selectedStore.tienda.caja)}
                  </div>
                )}
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
                onClick={toggleTheme}
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                className="p-3 bg-slate-50 dark:bg-slate-800 text-amber-500 dark:text-indigo-400 rounded-xl hover:bg-amber-50 dark:hover:bg-indigo-900/40 transition-all flex justify-center"
              >
                {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
              <button
                onClick={() => setShowTour(true)}
                title="Tour de ayuda"
                className="p-3 bg-slate-50 dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all flex justify-center"
              >
                <FiHelpCircle size={16} />
              </button>
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all flex justify-center"
              >
                <FiLogOut size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              <Link
                href="/guia-rapida"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
              >
                <FiBookOpen size={13} />
                Guía
              </Link>
              <Link
                href="/dashboard/perfil"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
              >
                <FiKey size={13} />
                Contraseña
              </Link>
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

      {/* Tour de bienvenida */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => {
          localStorage.setItem('cartera_tour_done', '1');
          setShowTour(false);
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
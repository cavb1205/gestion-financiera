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
  FiTablet
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !selectedStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Redirigiendo a login...</p>
      </div>
    );
  }

  const isActive = (path) => pathname.startsWith(path);

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
      {/* Menú móvil - Botón hamburguesa */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-700 rounded-md"
          >
            {isMobileMenuOpen ? (
              <FiX className="text-2xl" />
            ) : (
              <FiMenu className="text-2xl" />
            )}
          </button>
          <h1 className="text-xl font-semibold ml-4">
            {isActive("/dashboard") &&
              !isActive("/dashboard/clientes") &&
              "Dashboard"}
            {isActive("/dashboard/clientes") && "Clientes"}
            {isActive("/dashboard/creditos") && "Créditos"}
            {isActive("/dashboard/reportes") && "Reportes"}
            {isActive("/dashboard/configuracion") && "Configuración"}
            {isActive("/dashboard/gastos") && "Gastos"}
            {isActive("/dashboard/aportes") && "Aportes"}
            {isActive("/dashboard/utilidades") && "Utilidades"}
            {isActive("/dashboard/sueldos") && "Cálculo de Sueldo"}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <FiBell className="text-xl" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Menú móvil - Sidebar desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-64 h-full bg-indigo-800 text-white z-50 flex flex-col">
            <div className="p-6 flex-shrink-0">
              <h1 className="text-2xl font-bold">Cartera Financiera</h1>
              <p className="text-indigo-200 text-sm">Sistema de gestión</p>
            </div>

            <nav className="flex-1 px-4 py-4 overflow-y-auto">
              <Link
                href="/dashboard"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard") &&
                  !isActive("/dashboard/clientes") &&
                  !isActive("/dashboard/ventas")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiHome className="mr-3" />
                Dashboard
              </Link>

              <Link
                href="/dashboard/clientes"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/clientes")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiUser className="mr-3" />
                Clientes
              </Link>

              <Link
                href="/dashboard/aportes"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/aportes")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiDollar className="mr-3" />
                Aportes
              </Link>

              <Link
                href="/dashboard/ventas"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/ventas")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiShoppingCart className="mr-3" />
                Ventas Activas
              </Link>
              
              <Link
                href="/dashboard/gastos"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/gastos")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiTrendingDown className="mr-3" />
                Gastos
              </Link>
              
              <Link
                href="/dashboard/utilidades"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/utilidades")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiTrendingUp className="mr-3" />
                Utilidades
              </Link>

              <Link
                href="/dashboard/sueldos"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/sueldos")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiTablet className="mr-3" />
                Cálculo de Sueldo
              </Link>
              
              <Link
                href="/dashboard/liquidar"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/liquidar")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiCheckCircle className="mr-3" />
                Liquidación de Créditos
              </Link>
              
              <Link
                href="/dashboard/recaudos"
                className={`flex items-center w-full p-3 rounded-lg mb-2 ${
                  isActive("/dashboard/recaudos")
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-700"
                }`}
              >
                <FiPackage className="mr-3" />
                Recaudos
              </Link>
            </nav>

            <div className="p-4 border-t border-indigo-700 flex-shrink-0">
              <div className="flex items-center mb-3">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                <div className="ml-3">
                  <p className="font-medium">
                    {profile?.trabajador || "Usuario"}
                  </p>
                  <p className="text-sm text-indigo-300 flex items-center">
                    <FiShoppingBag className="mr-1" />
                    {storeInfo?.nombre ||
                      selectedStore?.tienda.nombre ||
                      "Tienda"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    router.push("/select-store");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-800 bg-white hover:bg-gray-100"
                >
                  <FiRefreshCw className="mr-2" />
                  Cambiar tienda
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <FiLogOut className="mr-2" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar para escritorio */}
      <div className="hidden md:flex md:w-64 bg-indigo-800 text-white flex-col h-full">
        <div className="p-6 flex-shrink-0">
          <h1 className="text-2xl font-bold">Cartera Financiera</h1>
          <p className="text-indigo-200 text-sm">Sistema de gestión</p>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <Link
            href="/dashboard"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard") &&
              !isActive("/dashboard/clientes") &&
              !isActive("/dashboard/ventas")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiHome className="mr-3" />
            Dashboard
          </Link>

          <Link
            href="/dashboard/clientes"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/clientes")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiUser className="mr-3" />
            Clientes
          </Link>
          
          <Link
            href="/dashboard/aportes"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/aportes")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiDollar className="mr-3" />
            Aportes
          </Link>

          <Link
            href="/dashboard/ventas"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/ventas")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiShoppingCart className="mr-3" />
            Ventas Activas
          </Link>
          
          <Link
            href="/dashboard/gastos"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/gastos")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiTrendingDown className="mr-3" />
            Gastos
          </Link>
          
          <Link
            href="/dashboard/utilidades"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/utilidades")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiTrendingUp className="mr-3" />
            Utilidades
          </Link>

          <Link
            href="/dashboard/sueldos"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/sueldos")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiTablet className="mr-3" />
            Cálculo de Sueldo
          </Link>
          
          <Link
            href="/dashboard/liquidar"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/liquidar")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiCheckCircle className="mr-3" />
            Liquidación de Créditos
          </Link>
          
          <Link
            href="/dashboard/recaudos"
            className={`flex items-center w-full p-3 rounded-lg mb-2 ${
              isActive("/dashboard/recaudos")
                ? "bg-indigo-700"
                : "hover:bg-indigo-700"
            }`}
          >
            <FiPackage className="mr-3" />
            Recaudos
          </Link>
        </nav>

        <div className="p-4 border-t border-indigo-700 flex-shrink-0">
          <div className="flex items-center mb-3">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
            <div className="ml-3">
              <p className="text-md text-indigo-300 flex items-center">
                <FiShoppingBag className="mr-1" />
                {storeInfo?.nombre || selectedStore?.tienda.nombre || "Tienda"}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => router.push("/select-store")}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-800 bg-white hover:bg-gray-100"
            >
              <FiRefreshCw className="mr-2" />
              Cambiar Ruta
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FiLogOut className="mr-2" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header para escritorio */}
        <header className="hidden md:block bg-white shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {isActive("/dashboard") && "Dashboard"}
                {isActive("/dashboard/clientes") && "Clientes"}
                {isActive("/dashboard/creditos") && "Créditos"}
                {isActive("/dashboard/aportes") && "Aportes"}
                {isActive("/dashboard/ventas") && "Ventas Activas"}
                {isActive("/dashboard/gastos") && "Gastos"}
                {isActive("/dashboard/utilidades") && "Utilidades"}
                {isActive("/dashboard/sueldos") && "Cálculo de Sueldo"}
                {isActive("/dashboard/liquidar") && "Liquidación de Créditos"}
                {isActive("/dashboard/recaudos") && "Recaudos"}
                {isActive("/dashboard/reportes") && "Reportes"}
                {isActive("/dashboard/configuracion") && "Configuración"}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <FiBell className="text-xl" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                <div className="ml-2 text-right">
                  <p className="text-gray-700 font-medium">
                    {profile?.trabajador || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <FiShoppingBag className="mr-1" />
                    {storeInfo?.nombre || selectedStore?.tienda.nombre}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido dinámico */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
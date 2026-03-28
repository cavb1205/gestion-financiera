"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiArrowRight,
  FiShoppingBag,
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { toast } from "react-toastify";

const features = [
  { icon: FiTrendingUp, label: "Cartera de créditos en tiempo real" },
  { icon: FiDollarSign, label: "Control de gastos y aportes" },
  { icon: FiPieChart, label: "Reportes e inteligencia de negocio" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, selectStore } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Credenciales inválidas");
      }

      login(data);
      toast.success("¡Bienvenido!", {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });

      // Workers: auto-select their store and go to liquidar
      const isWorker = !(data.user.is_staff || data.user.is_superuser);
      if (isWorker) {
        try {
          const storeRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tiendas/detail/`,
            { headers: { Authorization: `Bearer ${data.token}` } }
          );
          if (storeRes.ok) {
            const storeData = await storeRes.json();
            selectStore(storeData);
            router.push("/dashboard/liquidar");
          } else {
            router.push("/dashboard");
          }
        } catch {
          router.push("/dashboard");
        }
        return;
      }

      router.push("/select-store");
    } catch (err) {
      const errorMsg = err.message || "Error en el inicio de sesión";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-center",
        autoClose: 4000,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">

      {/* ── Left Panel (branding) — always indigo ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-indigo-600 dark:bg-indigo-950 relative overflow-hidden p-14">
        {/* Glow blobs */}
        <div className="absolute top-[-20%] left-[-15%] w-[70%] h-[70%] bg-white/10 dark:bg-indigo-600/30 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/20 blur-[140px] rounded-full pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 dark:bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-black/20">
            <FiShoppingBag className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">Cartera</h1>
            <p className="text-[9px] font-black text-indigo-200 dark:text-indigo-400 uppercase tracking-[0.3em]">Control Panel</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-[11px] font-black text-indigo-200 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4">
              Plataforma de gestión
            </p>
            <h2 className="text-5xl font-black text-white leading-[1.05] tracking-tighter">
              Tu negocio,<br />bajo control.
            </h2>
            <p className="mt-5 text-white/70 dark:text-slate-400 font-medium text-base leading-relaxed max-w-xs">
              Gestiona créditos, recaudos, gastos y utilidades desde un solo lugar.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/15 dark:bg-indigo-600/20 border border-white/20 dark:border-indigo-500/20 flex items-center justify-center text-white dark:text-indigo-400 shrink-0">
                  <Icon size={16} />
                </div>
                <span className="text-sm font-semibold text-white/80 dark:text-slate-300">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tag */}
        <p className="relative z-10 text-[10px] font-bold text-indigo-200/60 dark:text-slate-600 uppercase tracking-widest">
          © {new Date().getFullYear()} Cartera Enterprise
        </p>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Mobile glow */}
        <div className="absolute top-0 right-0 w-[60%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none lg:hidden" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="absolute top-5 right-5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all z-10"
        >
          {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <FiShoppingBag className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Cartera</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.25em]">Control Panel</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
              Iniciar sesión
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                  <FiUser size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="nombre_usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm dark:shadow-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                  <FiLock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm dark:shadow-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl animate-shake">
                <FiAlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-snug">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/50 hover:shadow-indigo-300 dark:hover:shadow-indigo-700/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Register link */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 text-center">
            <p className="text-sm text-slate-500">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.4s ease both; }
      `}</style>
    </div>
  );
}

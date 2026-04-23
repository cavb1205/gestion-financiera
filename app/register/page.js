"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";
import { useAuth } from "@/app/context/AuthContext";
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
  FiMapPin,
  FiPhone,
  FiSun,
  FiMoon,
  FiCheckCircle,
  FiGift,
} from "react-icons/fi";

const features = [
  { icon: FiTrendingUp, label: "Cartera de créditos en tiempo real" },
  { icon: FiDollarSign, label: "Control de gastos y aportes" },
  { icon: FiPieChart, label: "Reportes e inteligencia de negocio" },
];

function getPasswordStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: "Débil", color: "bg-rose-500", text: "text-rose-500" };
  if (score === 2) return { level: 2, label: "Regular", color: "bg-amber-500", text: "text-amber-500" };
  if (score === 3) return { level: 3, label: "Buena", color: "bg-yellow-500", text: "text-yellow-500" };
  return { level: 4, label: "Fuerte", color: "bg-emerald-500", text: "text-emerald-500" };
}

function translateBackendError(data) {
  if (!data || typeof data !== "object") return "Error al registrar. Intenta de nuevo.";
  const fieldLabels = {
    username: "Usuario",
    first_name: "Nombre",
    last_name: "Apellido",
    password: "Contraseña",
    nombre_ruta: "Nombre del negocio",
    telefono: "Teléfono",
  };
  const errorMap = {
    "already exists": "ya está en uso. Elige otro.",
    "may not be blank": "es obligatorio.",
    "This field is required": "es obligatorio.",
    "Enter a valid": "tiene un valor no válido.",
    "too short": "es muy corta (mínimo 6 caracteres).",
    "too similar": "es muy similar a tus datos personales.",
    "too common": "es demasiado común.",
    "entirely numeric": "no puede ser solo números.",
  };

  for (const [field, msgs] of Object.entries(data)) {
    const raw = Array.isArray(msgs) ? msgs[0] : String(msgs);
    const label = fieldLabels[field] || field;
    for (const [key, suffix] of Object.entries(errorMap)) {
      if (raw.toLowerCase().includes(key.toLowerCase())) {
        return `El campo "${label}" ${suffix}`;
      }
    }
    return `${label}: ${raw}`;
  }
  return data.detail || "Error al registrar. Intenta de nuevo.";
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    nombre_ruta: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { login, selectStore } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          telefono: form.telefono.trim(),
          password: form.password,
          nombre_ruta: form.nombre_ruta.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(translateBackendError(data));
      }

      // Guardar sesión directamente (no redirigir a /login)
      login(data);

      // Marcar que debe mostrar el wizard de onboarding al entrar al dashboard
      localStorage.setItem("cartera_onboarding_new", "1");

      // Buscar tiendas con el token recién recibido
      const storeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tiendas/list/tiendas/admin/`,
        { headers: { Authorization: `Bearer ${data.token}` } }
      );
      const stores = await storeRes.json();

      // Si solo tiene 1 tienda (la recién creada), entrar directo al dashboard
      if (Array.isArray(stores) && stores.length === 1) {
        selectStore(stores[0]);
        router.push("/dashboard");
      } else {
        router.push("/select-store");
      }
    } catch (err) {
      setError(err.message || "Error en el registro");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm dark:shadow-none";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">

      {/* ── Panel izquierdo (branding) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-indigo-600 dark:bg-indigo-950 relative overflow-hidden p-14">
        <div className="absolute top-[-20%] left-[-15%] w-[70%] h-[70%] bg-white/10 dark:bg-indigo-600/30 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/20 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 dark:bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-black/20">
            <FiShoppingBag className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">Cartera</h1>
            <p className="text-[9px] font-black text-indigo-200 dark:text-indigo-400 uppercase tracking-[0.3em]">Control Panel</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-[11px] font-black text-indigo-200 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4">
              Crea tu cuenta
            </p>
            <h2 className="text-5xl font-black text-white leading-[1.05] tracking-tighter">
              Empieza a<br />gestionar hoy.
            </h2>
            <p className="mt-5 text-white/70 dark:text-slate-400 font-medium text-base leading-relaxed max-w-xs">
              Registra tu negocio y accede a todas las herramientas de gestión de cartera.
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

          {/* Trial badge */}
          <div className="flex items-center gap-3 p-4 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/15">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <FiGift className="text-amber-300" size={16} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-widest">Prueba gratuita</p>
              <p className="text-[10px] font-medium text-white/60">7 días completos · Sin tarjeta de crédito</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-[10px] font-bold text-indigo-200/60 dark:text-slate-600 uppercase tracking-widest">
          © {new Date().getFullYear()} Cartera Enterprise
        </p>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
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

          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <FiShoppingBag className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Cartera</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.25em]">Control Panel</p>
            </div>
          </div>

          {/* Trial badge mobile */}
          <div className="flex items-center gap-2 mb-6 lg:hidden p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20">
            <FiGift className="text-amber-500 shrink-0" size={14} />
            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
              7 días gratis · Sin tarjeta
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
              Crear cuenta
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Registra tu negocio y comienza a operar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre del negocio */}
            <div className="space-y-2">
              <label htmlFor="nombre_ruta" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Nombre del Negocio *
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                  <FiMapPin size={18} />
                </div>
                <input
                  id="nombre_ruta"
                  name="nombre_ruta"
                  type="text"
                  required
                  placeholder="Ej: Ruta Norte, Tienda Centro..."
                  value={form.nombre_ruta}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Nombre *
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                    <FiUser size={18} />
                  </div>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    placeholder="Juan"
                    value={form.first_name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="last_name" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Apellido *
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                    <FiUser size={18} />
                  </div>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    placeholder="Pérez"
                    value={form.last_name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Usuario */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Usuario *
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                  <FiUser size={18} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="nombre_usuario"
                  value={form.username}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 ml-1">
                Lo usarás para iniciar sesión. Sin espacios ni caracteres especiales.
              </p>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label htmlFor="telefono" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Teléfono *
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                  <FiPhone size={18} />
                </div>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  required
                  placeholder="+573001234567"
                  value={form.telefono}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 ml-1">
                Incluye el código de país. Ej: +57 Colombia · +56 Chile · +52 México
              </p>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Contraseña *
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                  <FiLock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={handleChange}
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

            {/* Indicador de fortaleza */}
            {form.password && (() => {
              const s = getPasswordStrength(form.password);
              return (
                <div className="space-y-1.5 -mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= s.level ? s.color : "bg-slate-200 dark:bg-slate-700"}`} />
                    ))}
                  </div>
                  <p className={`text-[9px] font-black uppercase tracking-widest ml-1 ${s.text}`}>
                    Contraseña {s.label}
                  </p>
                </div>
              );
            })()}

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Confirmar Contraseña *
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                  <FiLock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Repetir contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={inputClass}
                />
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
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta</span>
                    <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Mini checklist */}
            <div className="flex items-center justify-center gap-4 pt-1">
              {["7 días gratis", "Sin tarjeta", "Acceso inmediato"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <FiCheckCircle size={11} className="text-emerald-500" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{item}</span>
                </div>
              ))}
            </div>
          </form>

          {/* Link al login */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 text-center">
            <p className="text-sm text-slate-500">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Iniciar sesión
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

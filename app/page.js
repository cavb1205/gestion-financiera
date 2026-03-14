"use client";

import Link from "next/link";
import {
  FiArrowRight,
  FiTrendingUp,
  FiUsers,
  FiShield,
  FiSmartphone,
  FiPieChart,
  FiActivity,
  FiDollarSign,
  FiCheckCircle,
  FiPackage,
  FiCalendar,
  FiLayers,
} from "react-icons/fi";

const features = [
  {
    icon: FiLayers,
    title: "Cartera Activa",
    desc: "Controla cada crédito en tiempo real. Visualiza mora, adelantos y estado de cobro por cliente.",
  },
  {
    icon: FiUsers,
    title: "Gestión de Clientes",
    desc: "Directorio completo con historial de créditos, datos de contacto y seguimiento por sucursal.",
  },
  {
    icon: FiPackage,
    title: "Recaudos Diarios",
    desc: "Registra cobros, visitas fallidas y abonos. El flujo de caja siempre actualizado al momento.",
  },
  {
    icon: FiPieChart,
    title: "Inteligencia de Utilidad",
    desc: "Reportes de rentabilidad por periodo. Analiza intereses, gastos y márgenes netos reales.",
  },
  {
    icon: FiSmartphone,
    title: "Diseño para Campo",
    desc: "Interfaz optimizada para móvil. Tu equipo puede operar desde cualquier dispositivo en ruta.",
  },
  {
    icon: FiShield,
    title: "Multi-Sucursal",
    desc: "Administra varias tiendas desde una sola cuenta. Cada sucursal con sus propios datos y personal.",
  },
];

const modules = [
  { label: "Ventas / Créditos", color: "bg-indigo-500" },
  { label: "Clientes", color: "bg-emerald-500" },
  { label: "Recaudos", color: "bg-blue-500" },
  { label: "Gastos", color: "bg-rose-500" },
  { label: "Aportes", color: "bg-amber-500" },
  { label: "Utilidades", color: "bg-purple-500" },
  { label: "Liquidación", color: "bg-cyan-500" },
  { label: "Trabajadores", color: "bg-orange-500" },
  { label: "Reportes", color: "bg-emerald-600" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/8 blur-[120px] rounded-full" />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/40">
              <FiActivity className="text-white" size={18} />
            </div>
            <span className="text-lg font-black tracking-tight">
              Cartera<span className="text-indigo-400">Core</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
            <a href="#modulos" className="hover:text-white transition-colors">Módulos</a>
          </nav>

          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-900/30"
          >
            Iniciar Sesión
            <FiArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sistema de Cartera y Crédito</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6">
                Controla tu<br />
                <span className="text-indigo-400">cartera</span> con<br />
                precisión total.
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
                Gestiona créditos, recaudos y clientes desde una plataforma diseñada para negocios de campo. Todo en tiempo real, desde cualquier dispositivo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-900/30 group"
                >
                  Entrar al Sistema
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-8">
                <div className="flex items-center gap-2 text-slate-500">
                  <FiCheckCircle className="text-emerald-500" size={15} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Multi-sucursal</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <FiCheckCircle className="text-emerald-500" size={15} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Acceso móvil</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <FiCheckCircle className="text-emerald-500" size={15} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Tiempo real</span>
                </div>
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full" />
              <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">

                {/* Mockup header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-2 w-24 bg-white/20 rounded-full mb-1.5" />
                    <div className="h-1.5 w-16 bg-white/10 rounded-full" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="h-1.5 w-12 bg-emerald-500/30 rounded-full" />
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-indigo-600/90 rounded-2xl p-4">
                    <div className="h-1.5 w-10 bg-white/40 rounded-full mb-3" />
                    <div className="h-5 w-20 bg-white/90 rounded-lg mb-1" />
                    <div className="h-1.5 w-14 bg-white/30 rounded-full" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="h-1.5 w-10 bg-white/20 rounded-full mb-3" />
                    <div className="h-5 w-16 bg-white/50 rounded-lg mb-1" />
                    <div className="h-1.5 w-12 bg-white/15 rounded-full" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="h-1.5 w-10 bg-white/20 rounded-full mb-3" />
                    <div className="h-5 w-14 bg-white/50 rounded-lg mb-1" />
                    <div className="h-1 w-full bg-white/10 rounded-full mt-2">
                      <div className="h-full w-3/5 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="h-1.5 w-10 bg-white/20 rounded-full mb-3" />
                    <div className="h-5 w-18 bg-white/50 rounded-lg mb-1" />
                    <div className="h-1.5 w-10 bg-amber-500/40 rounded-full" />
                  </div>
                </div>

                {/* Chart mockup */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="h-1.5 w-20 bg-white/20 rounded-full mb-4" />
                  <div className="flex items-end gap-2 h-16">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-lg ${i === 7 ? "bg-indigo-500" : "bg-white/15"}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent items */}
                <div className="mt-4 space-y-2">
                  {[
                    { color: "bg-emerald-500", w: "w-32" },
                    { color: "bg-blue-500", w: "w-24" },
                    { color: "bg-indigo-500", w: "w-28" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg ${item.color} opacity-70`} />
                      <div className="flex-1">
                        <div className={`h-1.5 ${item.w} bg-white/20 rounded-full`} />
                      </div>
                      <div className="h-1.5 w-10 bg-white/15 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Módulos ─────────────────────────────────────────────────── */}
      <section id="modulos" className="py-20 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] text-center mb-8">Todo en un solo lugar</p>
          <div className="flex flex-wrap justify-center gap-3">
            {modules.map((m, i) => (
              <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="funciones" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Funciones Principales</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Todo lo que necesita<br />
              <span className="text-slate-500">para operar su negocio.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <div
                key={i}
                className="group p-7 bg-white/[0.03] border border-white/8 hover:border-indigo-500/30 hover:bg-white/[0.06] rounded-3xl transition-all duration-300"
              >
                <div className="w-11 h-11 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <feat.icon size={20} />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">{feat.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-12 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <FiDollarSign size={26} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">
                Listo para gestionar<br />
                <span className="text-indigo-400">tu cartera.</span>
              </h2>
              <p className="text-slate-500 text-base mb-10 leading-relaxed">
                Accede al sistema y empieza a controlar tus créditos, recaudos y clientes desde hoy.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-900/30 group"
              >
                Ingresar al Sistema
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-xl">
              <FiActivity className="text-indigo-400" size={16} />
            </div>
            <span className="font-black tracking-tight text-slate-400">
              Cartera<span className="text-indigo-400">Core</span>
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} — Sistema de Gestión de Cartera
          </p>
          <Link
            href="/login"
            className="text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            Iniciar Sesión <FiArrowRight size={12} />
          </Link>
        </div>
      </footer>

    </div>
  );
}

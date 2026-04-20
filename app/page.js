"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiArrowRight,
  FiUsers,
  FiShield,
  FiPieChart,
  FiCheckCircle,
  FiPackage,
  FiLayers,
  FiMessageCircle,
  FiStar,
  FiRefreshCw,
  FiBookOpen,
  FiBarChart2,
  FiMapPin,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiTrendingDown,
  FiSmartphone,
  FiPlus,
  FiMinus,
  FiUserPlus,
  FiDollarSign,
  FiNavigation,
  FiZap,
} from "react-icons/fi";

const painPoints = [
  {
    icon: FiFileText,
    title: "Excel desordenado",
    desc: "Hojas de cálculo que crecen sin control, fórmulas rotas y archivos duplicados entre varios dispositivos.",
  },
  {
    icon: FiTrendingDown,
    title: "Créditos perdidos",
    desc: "No saber con certeza cuánto te deben, quién está al día y quién lleva semanas sin pagar.",
  },
  {
    icon: FiAlertCircle,
    title: "Sin control de cobradores",
    desc: "Imposible verificar si tu equipo realmente visitó a los clientes o a qué hora pasó por cada dirección.",
  },
  {
    icon: FiClock,
    title: "Vencimientos por sorpresa",
    desc: "Te enteras que un crédito venció cuando el cliente ya está en mora, sin alertas preventivas.",
  },
];

const steps = [
  {
    num: "01",
    icon: FiUserPlus,
    title: "Registra a tu cliente",
    desc: "Agrega nombre, teléfono, dirección y documento. Queda disponible en toda tu base para dar créditos.",
  },
  {
    num: "02",
    icon: FiDollarSign,
    title: "Otorga el crédito",
    desc: "Define monto, interés, número de cuotas y frecuencia. El sistema calcula el plan de pagos automáticamente.",
  },
  {
    num: "03",
    icon: FiNavigation,
    title: "Cobra en ruta",
    desc: "Tu cobrador abre la lista del día, registra pagos y el GPS captura dónde fue cada cobro — sin intervención manual.",
  },
];

const features = [
  {
    icon: FiLayers,
    title: "Cartera Activa",
    desc: "Controla cada crédito en tiempo real. Visualiza mora, adelantos y estado de cobro por cliente.",
  },
  {
    icon: FiMessageCircle,
    title: "WhatsApp Integrado",
    desc: "Envía recordatorios con un toque. El mensaje se arma solo con saldo, cuota y total abonado.",
  },
  {
    icon: FiStar,
    title: "Score de Clientes",
    desc: "Puntaje automático 0–100 por cliente según historial de pagos, atrasos y comportamiento.",
  },
  {
    icon: FiMapPin,
    title: "GPS en Cada Cobro",
    desc: "Cada recaudo registra la ubicación exacta donde se recibió el pago. Sin trampas ni dudas.",
  },
  {
    icon: FiNavigation,
    title: "Mapa de Ruta",
    desc: "Visualiza en un mapa la ruta completa de tus cobradores durante el día. Cobros y visitas fallidas.",
  },
  {
    icon: FiAlertCircle,
    title: "Alertas Preventivas",
    desc: "Avisos automáticos cuando un crédito está por vencer en los próximos 3 días. Nunca más te sorprendas.",
  },
  {
    icon: FiRefreshCw,
    title: "Renovación de Créditos",
    desc: "Renueva créditos vencidos sin perder historial. El capital anterior pasa automáticamente al nuevo.",
  },
  {
    icon: FiPieChart,
    title: "Reportes de Utilidad",
    desc: "Analiza intereses, gastos y márgenes netos por período. Sabe exactamente cuánto gana tu negocio.",
  },
  {
    icon: FiPackage,
    title: "Cierre de Caja Diario",
    desc: "Registra el efectivo al cierre del día. Historial completo de balances para auditar cualquier jornada.",
  },
];

const differentiators = [
  {
    icon: FiMapPin,
    title: "GPS en tiempo real",
    desc: "Verificas que tu equipo realmente fue al cliente.",
  },
  {
    icon: FiZap,
    title: "Score automático",
    desc: "La app te dice a quién prestarle sin que lo pienses.",
  },
  {
    icon: FiSmartphone,
    title: "Funciona en celular",
    desc: "Instalable como app. Úsala en campo sin conexión estable.",
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
  { label: "Cierre de Caja", color: "bg-teal-500" },
  { label: "Sueldos", color: "bg-orange-500" },
  { label: "Reportes", color: "bg-emerald-600" },
];

const faqs = [
  {
    q: "¿Necesito instalar algo en mi computador o celular?",
    a: "No. La plataforma funciona directamente en el navegador. En el celular puedes instalarla como app desde el mismo navegador (tocar «Agregar a pantalla de inicio»).",
  },
  {
    q: "¿Puedo tener varios cobradores trabajando a la vez?",
    a: "Sí. Cada cobrador tiene su propio usuario y contraseña. Desde el panel de administrador ves en tiempo real quién cobró qué y dónde.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. La información se guarda con conexión cifrada y acceso protegido por autenticación. Cada tienda ve solo sus propios datos, nunca los de otras.",
  },
  {
    q: "¿Funciona si el cobrador se queda sin internet en campo?",
    a: "La app está optimizada para conexiones débiles. Si se pierde la señal, el cobrador puede continuar viendo su ruta y los datos se sincronizan al volver a tener conexión.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Ofrecemos un período de prueba gratuito para que explores la plataforma sin compromiso. Luego puedes escoger entre planes mensuales o anuales. Contáctanos por WhatsApp para conocer los precios actualizados.",
  },
];

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
      >
        <span className="text-sm md:text-base font-black text-white tracking-tight">{q}</span>
        <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-indigo-400">
          {open ? <FiMinus size={14} /> : <FiPlus size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-6 pb-6 -mt-2">
          <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);

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
              <FiBarChart2 className="text-white" size={18} />
            </div>
            <span className="text-lg font-black tracking-tight">
              Cartera<span className="text-indigo-400">Financiera</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
            <a href="#faq" className="hover:text-white transition-colors">Preguntas</a>
            <Link href="/guia-rapida" className="hover:text-white transition-colors flex items-center gap-1.5">
              <FiBookOpen size={13} />
              Guía
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:flex items-center px-4 py-2.5 text-slate-300 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-900/30"
            >
              Comenzar Gratis
              <FiArrowRight size={14} />
            </Link>
          </div>
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
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sistema profesional de cartera</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6">
                Deja el Excel.<br />
                Administra tu<br />
                <span className="text-indigo-400">cartera de verdad.</span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
                La plataforma diseñada para tus necesidades profesionales. Controla créditos, cobradores y utilidades desde un solo lugar — con GPS, alertas y WhatsApp integrados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-900/30 group"
                >
                  Comenzar Gratis
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                </Link>
                <Link
                  href="/guia-rapida"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                >
                  <FiBookOpen size={16} />
                  Ver Demo
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500">
                  <FiCheckCircle className="text-emerald-500" size={15} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Prueba gratis</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <FiCheckCircle className="text-emerald-500" size={15} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Sin instalación</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <FiCheckCircle className="text-emerald-500" size={15} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Soporte en español</span>
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
                  <div className="bg-emerald-600/20 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="h-1.5 w-10 bg-emerald-400/30 rounded-full mb-3" />
                    <div className="h-5 w-18 bg-emerald-400/50 rounded-lg mb-1" />
                    <div className="h-1.5 w-10 bg-emerald-500/40 rounded-full" />
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

      {/* ── Pain Points ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-4">El problema</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              ¿Te suena familiar?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {painPoints.map((p, i) => (
              <div key={i} className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
                <div className="w-11 h-11 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mb-4">
                  <p.icon size={20} />
                </div>
                <h3 className="text-sm font-black text-white tracking-tight mb-2">{p.title}</h3>
                <p className="text-slate-400 text-[13px] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ───────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">La solución</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Tu cartera operando<br />
              <span className="text-slate-500">en 3 pasos.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="p-8 bg-white/[0.03] border border-white/8 rounded-3xl h-full">
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-4xl font-black text-indigo-400/30 tracking-tighter">{s.num}</span>
                    <div className="w-11 h-11 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                      <s.icon size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight mb-3">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border border-white/10 items-center justify-center text-indigo-400 z-10">
                    <FiArrowRight size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciadores ─────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {differentiators.map((d, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
                  <d.icon className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight mb-1.5">{d.title}</h3>
                  <p className="text-slate-400 text-[13px] leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="funciones" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Funciones Principales</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Todo lo que necesitas<br />
              <span className="text-slate-500">para operar tu negocio.</span>
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

      {/* ── Módulos ─────────────────────────────────────────────────── */}
      <section id="modulos" className="py-20 px-6 border-t border-white/5">
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

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Preguntas Frecuentes</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Todo lo que te<br />
              <span className="text-slate-500">preguntas antes de empezar.</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FAQItem
                key={i}
                q={f.q}
                a={f.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
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
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-900/40">
                <FiBarChart2 className="text-white" size={26} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">
                Empieza hoy.<br />
                <span className="text-indigo-400">Tu cartera te lo agradecerá.</span>
              </h2>
              <p className="text-slate-500 text-base mb-10 leading-relaxed max-w-lg mx-auto">
                Crea tu cuenta gratis y prueba la plataforma sin compromiso. Sin tarjeta de crédito, sin instalación.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-900/30 group"
                >
                  Comenzar Gratis
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                >
                  Iniciar Sesión
                </Link>
              </div>
              <p className="text-[11px] font-bold text-slate-500 mt-8 uppercase tracking-widest">
                ¿Dudas sobre planes? <a href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '56963511337'}?text=${encodeURIComponent('Hola, quisiera información sobre los planes de Cartera Financiera')}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">Escríbenos por WhatsApp</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-xl">
              <FiBarChart2 className="text-indigo-400" size={16} />
            </div>
            <span className="font-black tracking-tight text-slate-400">
              Cartera<span className="text-indigo-400">Financiera</span>
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} — Sistema de Gestión de Cartera
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/guia-rapida"
              className="text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              <FiBookOpen size={12} /> Guía Rápida
            </Link>
            <Link
              href="/login"
              className="text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              Iniciar Sesión <FiArrowRight size={12} />
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

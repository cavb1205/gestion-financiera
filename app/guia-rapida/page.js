"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiExternalLink,
  FiHelpCircle,
  FiHome,
  FiMapPin,
  FiMessageCircle,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTrendingDown,
  FiUsers,
} from "react-icons/fi";

const MIGRATION_DATE = "24 de agosto de 2026";

const ROLES = {
  ambos: { label: "Todos", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  trabajador: { label: "Trabajador", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  administrador: { label: "Administrador", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
};

const QUICK_STARTS = [
  {
    id: "trabajador",
    role: "trabajador",
    icon: FiCheckCircle,
    eyebrow: "Para salir a cobrar",
    title: "Iniciar jornada",
    text: "Abre Liquidación, atiende los pendientes del día y cierra la caja al terminar.",
    href: "/dashboard/liquidar",
    action: "Ir a Liquidación",
    tone: "emerald",
  },
  {
    id: "administrador",
    role: "administrador",
    icon: FiShield,
    eyebrow: "Para controlar el negocio",
    title: "Revisar cartera",
    text: "Mira los créditos que requieren gestión, sus saldos y los riesgos por ruta.",
    href: "/dashboard/reportes/cartera",
    action: "Abrir cartera",
    tone: "indigo",
  },
];

const GUIDE_SECTIONS = [
  {
    id: "inicio",
    number: "01",
    role: "ambos",
    icon: FiHome,
    eyebrow: "Primeros pasos",
    title: "Entrar y elegir la ruta correcta",
    description: "El sistema nuevo conserva tus credenciales, pero debes confirmar que estás trabajando en la ruta correcta antes de registrar cualquier movimiento.",
    href: "/select-store",
    action: "Seleccionar ruta",
    tone: "indigo",
    steps: [
      "Abre app.carterafinanciera.com en tu celular o computador. No uses el dominio antiguo www.carterafinanciera.com.",
      "Ingresa tu usuario y contraseña de siempre.",
      "El trabajador entra directamente a Liquidación y el administrador selecciona una ruta antes de llegar al panel.",
      "Confirma el nombre de la ruta que aparece en la parte superior. Si necesitas cambiarla, usa el botón «Ruta».",
    ],
    note: "Puedes agregar la aplicación a la pantalla de inicio desde las opciones del navegador para abrirla como una app.",
  },
  {
    id: "jornada",
    number: "02",
    role: "trabajador",
    icon: FiCheckCircle,
    eyebrow: "Flujo diario del trabajador",
    title: "Cobrar, reportar y terminar la jornada",
    description: "Liquidación es tu lista de trabajo. Solo muestra los clientes que todavía están pendientes de pasar durante el día.",
    href: "/dashboard/liquidar",
    action: "Abrir Liquidación",
    tone: "emerald",
    steps: [
      "Entra a «Liquidación» y busca al cliente por su nombre.",
      "Si paga, pulsa «Abonar Cuota», confirma el monto recibido y verifica el resultado.",
      "Si no paga o no lo encuentras, pulsa el botón de incidencia, elige el motivo y agrega una observación si hace falta.",
      "Cuando un cliente ya abonó ese día, desaparece de la lista de pendientes. Actualiza la vista si acabas de registrar un pago.",
      "Al terminar, entra a «Cierre de Caja» y registra el cierre calculado por el sistema.",
    ],
    note: "El GPS ayuda a comprobar dónde ocurrió el cobro, pero el cobro puede registrarse sin GPS. Si está bloqueado, quedará sin ubicación.",
  },
  {
    id: "nueva-venta",
    number: "03",
    role: "ambos",
    icon: FiShoppingCart,
    eyebrow: "Otorgar un crédito",
    title: "Crear una nueva venta correctamente",
    description: "Antes de activar un crédito revisa el comportamiento del cliente, el cupo disponible y la frecuencia de cobro.",
    href: "/dashboard/ventas/nueva",
    action: "Crear venta",
    tone: "violet",
    steps: [
      "Ve a «Ventas Activas» y pulsa «Nueva Venta».",
      "Busca y selecciona el cliente. Revisa su score, sus créditos vigentes y el cupo disponible.",
      "Ingresa capital, interés y número de cuotas.",
      "Selecciona la frecuencia: Diario, Semanal o Mensual. El trabajador solo puede usar Diario; el administrador puede elegir las tres.",
      "Revisa la proyección y pulsa «Activar Crédito» para confirmar.",
    ],
    frequency: [
      ["Diario", "1 cuota cada día", "Atención desde 3 días"],
      ["Semanal", "1 cuota cada 7 días", "Atención desde 9 días"],
      ["Mensual", "1 cuota cada 30 días", "Atención desde 35 días"],
    ],
    note: "Tener otro crédito activo no significa que siempre convenga otorgar uno nuevo. Si el sistema muestra cupo bloqueado o señales de riesgo, el administrador debe revisar antes de continuar.",
  },
  {
    id: "seguimiento",
    number: "04",
    role: "administrador",
    icon: FiBell,
    eyebrow: "Control preventivo",
    title: "Leer la cartera y las alertas a tiempo",
    description: "Las señales separan la gestión del día del deterioro real del crédito. No todo cliente que no abonó hoy está atrasado.",
    href: "/dashboard/alertas",
    action: "Abrir alertas",
    tone: "amber",
    steps: [
      "En «Ventas Activas» usa los filtros «Gestionar hoy», «Sin abono», «Con cuotas atrasadas» y los niveles de riesgo.",
      "Revisa «días sin abono» como jornadas completas cerradas. El día actual no se cuenta antes de terminar.",
      "«Ayer» indica cuándo fue el último abono; no significa por sí solo que exista atraso.",
      "«Para ponerse al día» muestra el monto de cuotas atrasadas y nunca debe superar el saldo actual.",
      "En el «Centro de alertas» revisa solo las señales activas de la ruta seleccionada. Puedes marcarlas como revisadas o resueltas.",
    ],
    note: "Las alertas informan y ayudan a priorizar; no bloquean automáticamente un crédito. Si el cliente vuelve a estar al día, la señal operativa deja de ser prioritaria.",
  },
  {
    id: "telegram",
    number: "05",
    role: "administrador",
    icon: FiMessageCircle,
    eyebrow: "Notificaciones sin ruido",
    title: "Qué esperar de Telegram",
    description: "Telegram está pensado para avisar lo importante, no para convertir cada visita fallida en una notificación inmediata.",
    href: "/dashboard/alertas",
    action: "Ver señales",
    tone: "sky",
    steps: [
      "Las alertas importantes se generan cuando una venta cruza un umbral de gestión o riesgo.",
      "Las fallas de no pago y los movimientos del día se revisan principalmente en el panel y en el reporte nocturno.",
      "El reporte diario resume las rutas administradas por el usuario autorizado y lo ocurrido durante la jornada cerrada.",
      "Si revisas una alerta, conserva el contexto: ruta, cliente, venta, saldo, días sin abono y cuotas atrasadas.",
    ],
    note: "Si Telegram muestra una ruta que no corresponde, primero verifica la ruta seleccionada y el usuario administrador que recibe el reporte.",
  },
  {
    id: "caja",
    number: "06",
    role: "ambos",
    icon: FiCreditCard,
    eyebrow: "Control del efectivo",
    title: "Cerrar caja y consultar el historial",
    description: "El cierre deja una fotografía diaria del balance. El historial de movimientos permite seguir quién cambió la caja y cómo quedó el saldo.",
    href: "/dashboard/cierre-caja",
    action: "Abrir Cierre de Caja",
    tone: "slate",
    steps: [
      "Al finalizar la jornada entra a «Cierre de Caja».",
      "Revisa el resumen del día: aportes, recaudos, créditos, gastos y utilidades.",
      "El sistema calcula automáticamente el valor del cierre. No debes inventar ni ingresar otro saldo en un campo manual.",
      "Pulsa «Registrar Cierre». El trabajador cierra su día actual; el administrador puede consultar y gestionar fechas permitidas.",
      "En «Movimientos de Caja» revisa fecha, usuario, tipo, saldo anterior, variación y saldo posterior.",
    ],
    note: "El historial auditable registra movimientos desde que fue habilitado. Los cierres antiguos siguen siendo referencias independientes y no siempre tienen el detalle histórico de cada movimiento.",
  },
  {
    id: "reportes",
    number: "07",
    role: "administrador",
    icon: FiBarChart2,
    eyebrow: "Análisis del negocio",
    title: "Usar cada reporte para la decisión correcta",
    description: "No todos los reportes responden la misma pregunta ni usan el mismo filtro de fecha.",
    href: "/dashboard/reportes/cartera",
    action: "Abrir reportes",
    tone: "purple",
    reports: [
      ["Utilidad", "Capital recuperado primero, interés cobrado, gastos, pérdidas y utilidad estimada o cobrada.", "/dashboard/reportes/utilidad"],
      ["Cartera", "Saldo activo, mora, capital expuesto, cuotas equivalentes vencidas y créditos para gestionar.", "/dashboard/reportes/cartera"],
      ["Gastos", "Total por periodo, categorías, días con gasto y detalle exportable.", "/dashboard/reportes/gastos"],
      ["Visitas", "Abonos y visitas fallidas de una fecha, con filtros por motivo y trabajador.", "/dashboard/reportes/visitas"],
      ["Comparativo", "Compara dos periodos y muestra variaciones de ventas, gastos, pérdidas y utilidad.", "/dashboard/reportes/comparativo"],
      ["Mapas", "Mapa de Cobros y Mapa de Publicidad: muestran registros con GPS, no un recorrido continuo.", "/dashboard/reportes/ubicaciones"],
    ],
    note: "Para una fecha puntual usa Visitas o Mapas. Para analizar un periodo usa Utilidad, Cartera, Gastos o Comparativo.",
  },
  {
    id: "cliente-riesgo",
    number: "08",
    role: "administrador",
    icon: FiStar,
    eyebrow: "Decisiones de crédito",
    title: "Consultar clientes, renovar o declarar pérdida",
    description: "El perfil del cliente reúne el comportamiento histórico y las decisiones que pueden afectar el capital del negocio.",
    href: "/dashboard/clientes",
    action: "Abrir clientes",
    tone: "rose",
    steps: [
      "En «Clientes» busca por nombre, teléfono o documento y abre el perfil.",
      "Revisa el score sobre 100, la etiqueta —Excelente, Bueno, Regular, Riesgo o Sin historial—, el cupo recomendado y las señales activas.",
      "Para un crédito vencido, el administrador puede usar «Renovar». El crédito anterior queda identificado como Renovado y el nuevo usa el saldo pendiente como base.",
      "Marca como «Pérdida» solo después de revisar el caso. Es una acción permanente: exige escribir CONFIRMAR, cierra el crédito y bloquea al cliente para nuevos créditos.",
      "Consulta «Ventas en Pérdida» para revisar el capital no recuperado y el análisis de pérdidas.",
    ],
    note: "El score orienta la decisión, pero no reemplaza el criterio del administrador ni la revisión del saldo vigente.",
  },
  {
    id: "publicidad",
    number: "09",
    role: "ambos",
    icon: FiMapPin,
    eyebrow: "Trabajo en terreno",
    title: "Registrar y revisar publicidad",
    description: "Los trabajadores marcan locales desde el terreno y el administrador puede analizar la distribución por fecha y trabajador.",
    href: "/dashboard/publicidad",
    action: "Marcar publicidad",
    tone: "cyan",
    steps: [
      "El trabajador entra a «Publicidad», permite la ubicación y pulsa «Marcar punto aquí».",
      "Agrega una nota opcional, por ejemplo el nombre del local, y confirma el registro.",
      "El administrador entra a «Reportes» → «Mapa de Publicidad», selecciona fecha y puede filtrar por trabajador.",
      "Los puntos sin GPS o sin nota deben interpretarse como registros incompletos, no como una ruta confirmada.",
    ],
    note: "La ubicación debe estar permitida en el navegador. Si aparece el aviso rojo, habilita el permiso del sitio antes de marcar.",
  },
];

const FAQS = [
  ["No veo al cliente en Liquidación", "Confirma que estás en la ruta correcta, actualiza la lista y revisa si ya abonó durante el día. Los clientes pagados desaparecen de los pendientes."],
  ["El mapa no muestra un cobro", "El registro puede existir sin coordenadas. Revisa la lista de operaciones sin GPS y verifica que el navegador tenga permiso de ubicación."],
  ["La alerta dice Ayer, ¿está atrasado?", "No necesariamente. Ayer solo identifica el día del último abono. El atraso se interpreta con cuotas atrasadas y con la frecuencia del crédito."],
  ["La caja no coincide", "Revisa primero Movimientos de Caja: tipo, usuario, saldo anterior y posterior. Luego compara el cierre con los recaudos, gastos, aportes y utilidades del día."],
];

function RoleBadge({ role }) {
  const config = ROLES[role] || ROLES.ambos;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${config.className}`}>
      {role === "trabajador" ? <FiUsers size={11} /> : role === "administrador" ? <FiShield size={11} /> : <FiCheckCircle size={11} />}
      {config.label}
    </span>
  );
}

function GuideCard({ section }) {
  const Icon = section.icon;
  const toneClasses = {
    indigo: { bar: "bg-indigo-500", icon: "bg-indigo-600", soft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300", border: "border-indigo-100 dark:border-indigo-900/30" },
    emerald: { bar: "bg-emerald-500", icon: "bg-emerald-600", soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300", border: "border-emerald-100 dark:border-emerald-900/30" },
    violet: { bar: "bg-violet-500", icon: "bg-violet-600", soft: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300", border: "border-violet-100 dark:border-violet-900/30" },
    amber: { bar: "bg-amber-500", icon: "bg-amber-600", soft: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300", border: "border-amber-100 dark:border-amber-900/30" },
    sky: { bar: "bg-sky-500", icon: "bg-sky-600", soft: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300", border: "border-sky-100 dark:border-sky-900/30" },
    slate: { bar: "bg-slate-500", icon: "bg-slate-700", soft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700" },
    purple: { bar: "bg-purple-500", icon: "bg-purple-600", soft: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300", border: "border-purple-100 dark:border-purple-900/30" },
    rose: { bar: "bg-rose-500", icon: "bg-rose-600", soft: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300", border: "border-rose-100 dark:border-rose-900/30" },
    cyan: { bar: "bg-cyan-500", icon: "bg-cyan-600", soft: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300", border: "border-cyan-100 dark:border-cyan-900/30" },
  }[section.tone] || {};

  return (
    <article id={section.id} className="guide-card scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`h-1.5 ${toneClasses.bar}`} />
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClasses.icon} text-white shadow-lg`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.18em] text-slate-400">{section.number}</span>
                <RoleBadge role={section.role} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{section.eyebrow}</p>
              <h2 className="mt-1 text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white">{section.title}</h2>
            </div>
          </div>
          <a href={`#${section.id}`} aria-label={`Enlace a ${section.title}`} className="hidden shrink-0 text-slate-300 transition hover:text-indigo-500 sm:block">
            <FiExternalLink size={15} />
          </a>
        </div>

        <p className="mt-5 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{section.description}</p>

        {section.steps && (
          <ol className="mt-6 space-y-3">
            {section.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black ${toneClasses.soft} ${toneClasses.border}`}>
                  {index + 1}
                </span>
                <span className="text-[12px] font-semibold leading-relaxed text-slate-600 dark:text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        )}

        {section.frequency && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-[0.8fr_1.3fr_1fr] bg-slate-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-800/70">
              <span>Plan</span><span>Ritmo</span><span>Atención</span>
            </div>
            {section.frequency.map(([plan, ritmo, umbral]) => (
              <div key={plan} className="grid grid-cols-[0.8fr_1.3fr_1fr] border-t border-slate-100 px-3 py-3 text-[10px] font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <span className="font-black text-slate-800 dark:text-white">{plan}</span><span>{ritmo}</span><span>{umbral}</span>
              </div>
            ))}
          </div>
        )}

        {section.reports && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {section.reports.map(([name, description, href]) => (
              <Link key={name} href={href} className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-800 dark:hover:bg-indigo-900/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-slate-800 dark:text-white">{name}</span>
                  <FiChevronRight className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" size={13} />
                </div>
                <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400">{description}</p>
              </Link>
            ))}
          </div>
        )}

        <div className={`mt-6 flex items-start gap-2 rounded-2xl border p-3.5 ${toneClasses.soft} ${toneClasses.border}`}>
          <FiAlertCircle className="mt-0.5 shrink-0" size={14} />
          <p className="text-[11px] font-bold leading-relaxed">{section.note}</p>
        </div>

        <Link href={section.href} className={`mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${toneClasses.soft.split(" ")[1] || "text-indigo-600"} transition hover:gap-3`}>
          {section.action} <FiArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}

export default function GuiaRapidaPage() {
  const [roleFilter, setRoleFilter] = useState("todos");
  const [showFaq, setShowFaq] = useState(false);

  const visibleSections = GUIDE_SECTIONS.filter((section) => roleFilter === "todos" || section.role === "ambos" || section.role === roleFilter);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8fc] text-slate-900 dark:bg-slate-950 dark:text-white">
      <style>{`
        html { scroll-behavior: smooth; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-root { background: white !important; padding: 0 !important; }
          .print-content { max-width: 100% !important; padding: 12px !important; }
          .print-cover { background: white !important; color: #0f172a !important; border: 2px solid #4f46e5 !important; box-shadow: none !important; page-break-after: avoid; }
          .print-cover * { color: #0f172a !important; }
          .print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .guide-card { box-shadow: none !important; page-break-inside: avoid !important; break-inside: avoid !important; }
          .guide-card a[href^="/dashboard"] { display: none !important; }
          .guide-card p, .guide-card span { color: #334155 !important; }
        }
      `}</style>

      <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#arriba" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"><FiBookOpen size={17} /></div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-slate-900 dark:text-white">Guía rápida</p>
              <p className="hidden truncate text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:block">Sistema nuevo · referencia operativa</p>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <a href="#secciones" className="hidden rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 sm:block dark:text-slate-400 dark:hover:bg-slate-800">Secciones</a>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95 dark:shadow-none">
              <FiPrinter size={14} /><span className="hidden sm:inline">Imprimir / PDF</span><span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main id="arriba" className="print-root">
        <div className="print-content mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <section className="print-cover relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-indigo-200/40 sm:px-10 sm:py-12 dark:shadow-none">
            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="relative max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1.5">Guía v2.0</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Actualizada agosto 2026</span>
              </div>
              <h1 className="max-w-2xl text-3xl font-black leading-[0.98] tracking-[-0.04em] sm:text-5xl">Trabaja con claridad. Controla la cartera a tiempo.</h1>
              <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">Una referencia práctica para cobrar, registrar créditos, revisar riesgos y mantener la caja bajo control desde el sistema nuevo.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-300">
                <span className="inline-flex items-center gap-2"><FiCheckCircle className="text-emerald-400" /> Trabajador y administrador</span>
                <span className="inline-flex items-center gap-2"><FiHome className="text-cyan-300" /> Celular o computador</span>
              </div>
            </div>
          </section>

          <section className="no-print mt-5 flex flex-col gap-4 rounded-[2rem] border border-amber-200 bg-amber-50/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-500 p-3 text-white"><FiRefreshCw size={17} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Transición en curso</p>
                <h2 className="mt-1 text-base font-black text-amber-950 dark:text-amber-100">El sistema antiguo se descontinúa el {MIGRATION_DATE}.</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-amber-800/80 dark:text-amber-200/70">Desde ahora usa <strong>app.carterafinanciera.com</strong> para acostumbrarte al flujo nuevo y evitar registros en la plataforma anterior.</p>
              </div>
            </div>
            <a href="https://app.carterafinanciera.com" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-amber-700">Abrir sistema nuevo <FiExternalLink size={13} /></a>
          </section>

          <section className="no-print mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Accesos según tu trabajo</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Empieza por aquí</h2>
              </div>
              <a href="#secciones" className="hidden items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:text-indigo-600 sm:flex">Ver guía completa <FiArrowRight size={13} /></a>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {QUICK_STARTS.map((item) => {
                const Icon = item.icon;
                const isEmerald = item.tone === "emerald";
                return (
                  <Link key={item.id} href={item.href} className={`group relative overflow-hidden rounded-[2rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${isEmerald ? "border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/30 dark:bg-emerald-900/10" : "border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/30 dark:bg-indigo-900/10"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ${isEmerald ? "bg-emerald-600" : "bg-indigo-600"}`}><Icon size={20} /></div>
                      <RoleBadge role={item.role} />
                    </div>
                    <p className={`mt-6 text-[10px] font-black uppercase tracking-[0.18em] ${isEmerald ? "text-emerald-600" : "text-indigo-600"}`}>{item.eyebrow}</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
                    <span className={`mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isEmerald ? "text-emerald-700" : "text-indigo-700"}`}>{item.action} <FiArrowRight className="transition group-hover:translate-x-1" size={13} /></span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="no-print mt-8 rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FiSearch size={17} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Filtrar la guía</p>
                  <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">Muestra solo lo que necesitas leer</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["todos", "trabajador", "administrador"].map((role) => (
                  <button key={role} type="button" onClick={() => setRoleFilter(role)} className={`rounded-xl px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition ${roleFilter === role ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"}`}>
                    {role === "todos" ? "Toda la guía" : ROLES[role].label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <nav id="secciones" className="no-print mt-8 scroll-mt-28 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-max items-center gap-1">
              {GUIDE_SECTIONS.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300">{section.number} · {section.title.split(" ").slice(0, 3).join(" ")}</a>
              ))}
            </div>
          </nav>

          <div className="print-grid mt-6 grid gap-5 md:grid-cols-2">
            {visibleSections.map((section) => <GuideCard key={section.id} section={section} />)}
          </div>

          <section className="no-print mt-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button type="button" onClick={() => setShowFaq((value) => !value)} className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6">
              <span className="flex items-center gap-3"><span className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FiHelpCircle size={18} /></span><span><span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ayuda rápida</span><span className="mt-1 block text-base font-black text-slate-900 dark:text-white">Problemas frecuentes</span></span></span>
              <FiChevronRight className={`text-slate-400 transition-transform ${showFaq ? "rotate-90" : ""}`} />
            </button>
            {showFaq && <div className="grid gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:grid-cols-2 sm:p-6">{FAQS.map(([question, answer]) => <div key={question} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50"><p className="text-xs font-black text-slate-800 dark:text-white">{question}</p><p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">{answer}</p></div>)}</div>}
          </section>

          <footer className="print-footer mt-8 rounded-[2rem] border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FiMessageCircle className="mx-auto text-indigo-500" size={22} />
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">¿Necesitas ayuda?</p>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Contacta a tu administrador o usa el soporte por WhatsApp desde el menú «?».</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">app.carterafinanciera.com · Guía v2.0 · Actualizada agosto 2026</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  FiShoppingBag,
  FiHome,
  FiShoppingCart,
  FiUsers,
  FiCheckCircle,
  FiPackage,
  FiTrendingDown,
  FiTrendingUp,
  FiBarChart2,
  FiCreditCard,
  FiX,
  FiArrowRight,
  FiArrowLeft,
  FiDollarSign,
  FiTablet,
} from "react-icons/fi";

// ── Step definitions ─────────────────────────────────────────────────────────

const adminSteps = [
  {
    icon: FiShoppingBag,
    iconBg: "bg-indigo-500",
    iconGlow: "shadow-indigo-500/40",
    tag: "Bienvenida",
    title: "¡Bienvenido a Cartera!",
    description:
      "Tu plataforma completa para gestionar créditos, cobros y el negocio en general. En los próximos pasos te mostramos cómo funciona cada módulo.",
    features: [
      "Gestión de créditos y cartera activa",
      "Control de gastos, aportes y utilidades",
      "Equipo de cobradores con roles diferenciados",
      "Reportes de rentabilidad en tiempo real",
    ],
  },
  {
    icon: FiHome,
    iconBg: "bg-blue-500",
    iconGlow: "shadow-blue-500/40",
    tag: "Módulo 1",
    title: "Panel Principal",
    description:
      "El Dashboard te da un resumen en tiempo real de todo el negocio: dinero en caja, cartera activa, recaudos del día y alertas de mora.",
    features: [
      "Saldo en caja y dinero en calle",
      "Recaudos totales del período",
      "Alertas de clientes en mora",
      "Métricas de rentabilidad",
    ],
  },
  {
    icon: FiShoppingCart,
    iconBg: "bg-violet-500",
    iconGlow: "shadow-violet-500/40",
    tag: "Módulo 2",
    title: "Ventas Activas",
    description:
      "Aquí registras y gestionas todos los créditos otorgados. Cada venta tiene su cronograma de cuotas, estado de pago y detalle completo.",
    features: [
      "Crear nueva venta con monto y cuotas",
      "Ver detalle, editar o liquidar un crédito",
      "Ventas en pérdida (cartera vencida)",
      "Filtros por cliente y estado",
    ],
  },
  {
    icon: FiUsers,
    iconBg: "bg-emerald-500",
    iconGlow: "shadow-emerald-500/40",
    tag: "Módulo 3",
    title: "Clientes",
    description:
      "Directorio completo de tus clientes con datos de contacto e historial de créditos. Busca rápido por nombre o teléfono.",
    features: [
      "Crear, editar y eliminar clientes",
      "Ver historial completo de créditos",
      "Buscar por nombre o número de teléfono",
      "Acceso rápido al WhatsApp del cliente",
    ],
  },
  {
    icon: FiCheckCircle,
    iconBg: "bg-teal-500",
    iconGlow: "shadow-teal-500/40",
    tag: "Módulo 4",
    title: "Liquidación Diaria",
    description:
      "El módulo de trabajo en ruta. Aquí tu equipo registra cobros, visitas fallidas y abonos a los créditos activos cada día.",
    features: [
      "Lista de clientes a cobrar en el período",
      "Reportar pago recibido o visita fallida",
      "Registrar abonos parciales",
      "Porcentaje de avance del día",
    ],
  },
  {
    icon: FiPackage,
    iconBg: "bg-orange-500",
    iconGlow: "shadow-orange-500/40",
    tag: "Módulo 5",
    title: "Recaudos",
    description:
      "Historial completo de todos los cobros y visitas registradas. Puedes filtrar por fecha y eliminar registros erróneos.",
    features: [
      "Historial con filtro por fecha",
      "Detalle de cada cobro (monto, cliente, cobrador)",
      "Editar o eliminar registros",
      "Exportar y auditar cobros",
    ],
  },
  {
    icon: FiDollarSign,
    iconBg: "bg-amber-500",
    iconGlow: "shadow-amber-500/40",
    tag: "Módulo 6",
    title: "Gastos y Aportes",
    description:
      "Registra los gastos operativos del negocio y los aportes de capital de los socios. Ambos afectan el balance en tiempo real.",
    features: [
      "Categorizar gastos por tipo",
      "Registrar aportes de socios o inversionistas",
      "Impacto directo en el flujo de caja",
      "Historial con filtros por período",
    ],
  },
  {
    icon: FiTrendingUp,
    iconBg: "bg-emerald-600",
    iconGlow: "shadow-emerald-600/40",
    tag: "Módulo 7",
    title: "Utilidades",
    description:
      "Calcula y distribuye las ganancias generadas en un período a los colaboradores. Cada distribución queda registrada en el historial.",
    features: [
      "Calcular utilidad neta del período",
      "Distribuir a trabajadores por porcentaje",
      "Historial de distribuciones",
      "Revertir distribuciones si es necesario",
    ],
  },
  {
    icon: FiUsers,
    iconBg: "bg-blue-600",
    iconGlow: "shadow-blue-600/40",
    tag: "Módulo 8",
    title: "Trabajadores",
    description:
      "Gestiona tu equipo de cobradores y administradores. Asigna roles, cambia contraseñas y controla el acceso por ruta.",
    features: [
      "Crear cobradores (rol Cobrador) o admins",
      "Asignar a tiendas y rutas",
      "Cambiar contraseñas desde el admin",
      "Calcular sueldos con comisiones",
    ],
  },
  {
    icon: FiBarChart2,
    iconBg: "bg-purple-500",
    iconGlow: "shadow-purple-500/40",
    tag: "Módulo 9",
    title: "Reportes",
    description:
      "Inteligencia de negocio con datos históricos. Analiza rentabilidad, cartera, gastos y compara períodos mes a mes.",
    features: [
      "Reporte de utilidad neta por período",
      "Cartera activa y mora histórica",
      "Comparativo mensual de ingresos",
      "Visitas fallidas por cobrador",
    ],
  },
  {
    icon: FiCreditCard,
    iconBg: "bg-slate-500",
    iconGlow: "shadow-slate-500/40",
    tag: "Módulo 10",
    title: "Cierre de Caja",
    description:
      "Registra el balance diario del negocio. El cierre deja un snapshot del estado financiero al final de cada jornada.",
    features: [
      "Balance de caja al final del día",
      "Historial de cierres anteriores",
      "Comparar saldo real vs calculado",
      "Imprescindible para auditorías",
    ],
  },
];

const workerSteps = [
  {
    icon: FiShoppingBag,
    iconBg: "bg-indigo-500",
    iconGlow: "shadow-indigo-500/40",
    tag: "Bienvenida",
    title: "¡Bienvenido, Cobrador!",
    description:
      "Esta plataforma es tu herramienta de trabajo en ruta. Aquí registras los cobros, visitas y el balance del día de forma sencilla.",
    features: [
      "Registrar cobros diarios en ruta",
      "Reportar visitas fallidas",
      "Ver historial de recaudos",
      "Cierre de caja al final del día",
    ],
  },
  {
    icon: FiCheckCircle,
    iconBg: "bg-teal-500",
    iconGlow: "shadow-teal-500/40",
    tag: "Tu módulo principal",
    title: "Liquidación",
    description:
      "Tu módulo central de trabajo. Aquí ves todos los clientes que debes cobrar y registras cada cobro o visita fallida.",
    features: [
      "Lista de clientes del período activo",
      "Botón de llamada y WhatsApp por cliente",
      "Reportar pago recibido",
      "Reportar visita fallida o registrar abono",
    ],
  },
  {
    icon: FiPackage,
    iconBg: "bg-orange-500",
    iconGlow: "shadow-orange-500/40",
    tag: "Historial",
    title: "Recaudos",
    description:
      "Consulta el historial de todos los cobros que has registrado. Puedes filtrar por fecha para revisar períodos anteriores.",
    features: [
      "Ver todos tus cobros registrados",
      "Filtrar por rango de fechas",
      "Detalle de cada recaudo",
      "Corregir registros equivocados",
    ],
  },
  {
    icon: FiCreditCard,
    iconBg: "bg-slate-500",
    iconGlow: "shadow-slate-500/40",
    tag: "Cierre del día",
    title: "Cierre de Caja",
    description:
      "Al final de cada jornada registra el balance de caja. Esto permite que el administrador lleve el control diario del negocio.",
    features: [
      "Registrar saldo en efectivo al cierre",
      "Ver cierres de días anteriores",
      "Comparar con el saldo calculado",
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingTour({ isOpen, onClose, isAdmin = true }) {
  const steps = isAdmin ? adminSteps : workerSteps;
  const [current, setCurrent] = useState(0);

  if (!isOpen) return null;

  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handleBack = () => setCurrent((c) => c - 1);

  const handleClose = () => {
    setCurrent(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40">
        {/* Top color bar */}
        <div className={`h-1 w-full ${step.iconBg} opacity-80`} />

        <div className="p-8">
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiX size={18} />
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-8">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? `w-6 h-2 ${step.iconBg}`
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-2xl ${step.iconBg} shadow-xl ${step.iconGlow} flex items-center justify-center mb-6`}
          >
            <Icon className="text-white" size={26} />
          </div>

          {/* Tag */}
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-2">
            {step.tag}
          </p>

          {/* Title */}
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-tight mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Feature list */}
          <ul className="space-y-2.5 mb-8">
            {step.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-lg ${step.iconBg} opacity-80 flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <FiCheckCircle className="text-white" size={11} />
                </div>
                <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                  {f}
                </span>
              </li>
            ))}
          </ul>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <FiArrowLeft size={14} />
                Atrás
              </button>
            )}

            <button
              onClick={handleNext}
              className={`flex-1 flex items-center justify-center gap-2 py-3 ${step.iconBg} text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg ${step.iconGlow} group`}
            >
              {isLast ? "¡Empezar!" : "Siguiente"}
              <FiArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={handleClose}
              className="w-full mt-4 text-[10px] font-bold text-slate-400 hover:text-slate-500 uppercase tracking-widest transition-colors"
            >
              Saltar tour
            </button>
          )}
        </div>

        {/* Progress counter */}
        <div className="px-8 pb-6 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {current + 1} / {steps.length}
          </span>
          <div className="h-1 flex-1 mx-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${step.iconBg} rounded-full transition-all duration-500`}
              style={{ width: `${((current + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

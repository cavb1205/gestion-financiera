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
  FiMessageCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiStar,
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
      "Plataforma completa para gestionar créditos, cobros y el negocio en general. El mismo usuario y contraseña de siempre — solo mejoramos la experiencia.",
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
      "El Dashboard te da un resumen en tiempo real de todo el negocio: dinero en caja, cartera activa, recaudos del día y alertas críticas.",
    features: [
      "Saldo en caja y dinero en calle",
      "Alerta automática de créditos vencidos",
      "Alerta de visitas fallidas del día",
      "Alerta de membresía próxima a vencer",
    ],
  },
  {
    icon: FiShoppingCart,
    iconBg: "bg-violet-500",
    iconGlow: "shadow-violet-500/40",
    tag: "Módulo 2",
    title: "Ventas Activas",
    description:
      "Registra y gestiona todos los créditos otorgados. Cada crédito tiene su cronograma, estado de pago y acciones rápidas desde el detalle.",
    features: [
      "Crear nueva venta con monto, cuotas e interés",
      "Renovar créditos vencidos en un clic",
      "Marcar como pérdida con registro en historial",
      "Enviar recordatorio de pago por WhatsApp",
    ],
  },
  {
    icon: FiStar,
    iconBg: "bg-emerald-500",
    iconGlow: "shadow-emerald-500/40",
    tag: "Módulo 3",
    title: "Clientes",
    description:
      "Directorio completo con datos de contacto, historial de créditos y score de comportamiento. Identifica rápido quién paga bien y quién no.",
    features: [
      "Score de comportamiento 0–100 (Excelente / Regular / Riesgo)",
      "Historial completo de créditos con paginación",
      "Búsqueda por nombre, teléfono o documento",
      "Promedio de días de atraso por cliente",
    ],
  },
  {
    icon: FiCheckCircle,
    iconBg: "bg-teal-500",
    iconGlow: "shadow-teal-500/40",
    tag: "Módulo 4",
    title: "Liquidación Diaria",
    description:
      "El módulo de trabajo en ruta. Tu equipo registra cobros y visitas fallidas. El teléfono y dirección del cliente siempre visibles.",
    features: [
      "Lista de clientes a cobrar con contacto visible",
      "WhatsApp pre-llenado con saldo y cuota",
      "Registrar pago recibido o visita fallida",
      "Ordenamiento por días de mora",
    ],
  },
  {
    icon: FiPackage,
    iconBg: "bg-orange-500",
    iconGlow: "shadow-orange-500/40",
    tag: "Módulo 5",
    title: "Recaudos",
    description:
      "Auditoría completa de todos los cobros y visitas registradas. Edita o elimina registros erróneos con confirmación.",
    features: [
      "Historial con filtro por fecha",
      "Detalle de cada cobro (monto, cliente, tipo)",
      "Editar o eliminar registros equivocados",
      "KPIs de efectividad del equipo cobrador",
    ],
  },
  {
    icon: FiDollarSign,
    iconBg: "bg-amber-500",
    iconGlow: "shadow-amber-500/40",
    tag: "Módulo 6",
    title: "Gastos y Aportes",
    description:
      "Registra los gastos operativos y los aportes de capital de los socios. Ambos afectan el balance en tiempo real.",
    features: [
      "Categorizar gastos por tipo",
      "Registrar aportes de socios o inversionistas",
      "Filtros por fecha y categoría",
      "Impacto directo en el flujo de caja",
    ],
  },
  {
    icon: FiTrendingUp,
    iconBg: "bg-emerald-600",
    iconGlow: "shadow-emerald-600/40",
    tag: "Módulo 7",
    title: "Utilidades",
    description:
      "Registra y distribuye las ganancias generadas a los colaboradores. Cada distribución queda en el historial.",
    features: [
      "Registrar distribución de utilidades",
      "Asignar a colaborador con concepto",
      "Historial de distribuciones por período",
      "Editar o eliminar registros",
    ],
  },
  {
    icon: FiUsers,
    iconBg: "bg-blue-600",
    iconGlow: "shadow-blue-600/40",
    tag: "Módulo 8",
    title: "Trabajadores",
    description:
      "Gestiona tu equipo. Crea cobradores y administradores, controla el acceso y cambia contraseñas sin tocar el sistema.",
    features: [
      "Crear colaboradores con rol Cobrador o Administrador",
      "Activar o desactivar cuentas en un toggle",
      "Cambiar contraseña desde el panel admin",
      "Calcular sueldos con base en recaudos",
    ],
  },
  {
    icon: FiBarChart2,
    iconBg: "bg-purple-500",
    iconGlow: "shadow-purple-500/40",
    tag: "Módulo 9",
    title: "Reportes",
    description:
      "Inteligencia de negocio con datos históricos. Cinco reportes para analizar cada ángulo del negocio.",
    features: [
      "Utilidad neta por período",
      "Cartera activa, mora y envejecimiento",
      "Gastos operativos por categoría",
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
      "Registra el balance diario. El cierre deja un snapshot financiero al final de cada jornada para control y auditoría.",
    features: [
      "Balance de caja al final del día",
      "Historial de cierres con paginación",
      "Comparar saldo real vs calculado",
      "Imprescindible para control diario",
    ],
  },
  {
    icon: FiMessageCircle,
    iconBg: "bg-green-500",
    iconGlow: "shadow-green-500/40",
    tag: "Tip de uso",
    title: "WhatsApp integrado",
    description:
      "Desde Liquidación y el detalle de cada venta puedes contactar al cliente directamente con un mensaje pre-llenado con su saldo, abonado y progreso.",
    features: [
      "Mensaje automático con saldo pendiente",
      "Total abonado y progreso en días",
      "Valor de la cuota incluido",
      "Un toque — abre WhatsApp listo para enviar",
    ],
  },
  {
    icon: FiRefreshCw,
    iconBg: "bg-rose-500",
    iconGlow: "shadow-rose-500/40",
    tag: "Tip de uso",
    title: "Renovación de créditos",
    description:
      "Cuando un crédito vence, puedes renovarlo desde el detalle de la venta. El saldo actual se convierte en el capital del nuevo crédito.",
    features: [
      "Solo disponible para créditos con estado Vencido",
      "Configura nuevas cuotas, interés y fecha",
      "El crédito anterior queda como Pagado automáticamente",
      "El nuevo crédito abre con el saldo anterior",
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
      "Tu herramienta de trabajo en ruta. El mismo usuario y contraseña de siempre — solo mejoramos la experiencia para que cobrar sea más fácil.",
    features: [
      "Registrar cobros diarios en ruta",
      "Contacto rápido por WhatsApp con mensaje listo",
      "Reportar visitas fallidas",
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
      "Tu módulo central de trabajo. Ves todos los clientes que debes cobrar con teléfono y dirección visibles. Un toque para llamar o enviar WhatsApp.",
    features: [
      "Teléfono y dirección del cliente siempre visibles",
      "WhatsApp pre-llenado con saldo y cuota",
      "Registrar pago recibido en segundos",
      "Reportar visita fallida con comentario",
    ],
  },
  {
    icon: FiMessageCircle,
    iconBg: "bg-green-500",
    iconGlow: "shadow-green-500/40",
    tag: "Novedad",
    title: "WhatsApp integrado",
    description:
      "Al tocar el botón de WhatsApp en cualquier cliente, se abre la app con un mensaje ya escrito que incluye el saldo, abonado y cuota del cliente.",
    features: [
      "Mensaje con saldo pendiente ya escrito",
      "Total abonado y días de progreso incluidos",
      "Solo debes tocar Enviar",
      "Sin copiar ni escribir nada manualmente",
    ],
  },
  {
    icon: FiPackage,
    iconBg: "bg-orange-500",
    iconGlow: "shadow-orange-500/40",
    tag: "Historial",
    title: "Recaudos",
    description:
      "Consulta el historial de todos los cobros que has registrado. Filtra por fecha para revisar cualquier período.",
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
      "Al final de cada jornada registra el balance de caja. Permite que el administrador lleve el control diario del negocio.",
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
          <div className="flex items-center gap-1.5 mb-8 flex-wrap">
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

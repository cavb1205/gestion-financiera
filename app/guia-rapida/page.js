"use client";

import { useRef } from "react";
import {
  FiPrinter,
  FiCheckCircle,
  FiShoppingCart,
  FiUsers,
  FiHome,
  FiPackage,
  FiMessageCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiStar,
  FiCreditCard,
  FiBarChart2,
  FiTrendingDown,
} from "react-icons/fi";

const GUIDE_SECTIONS = [
  {
    id: "login",
    color: "indigo",
    icon: FiHome,
    title: "1. Ingresar al sistema",
    steps: [
      "Abre carterafinanciera.com en tu celular o computador",
      'Ingresa tu usuario y contraseña (los mismos de siempre)',
      "Si eres cobrador, el sistema te lleva directo a Liquidación",
      "Si eres administrador, llegas al Panel Principal",
    ],
    tip: "Puedes instalar la app en tu celular: toca el botón «Agregar a inicio» que aparece en el navegador.",
  },
  {
    id: "credito",
    color: "violet",
    icon: FiShoppingCart,
    title: "2. Registrar un nuevo crédito",
    steps: [
      'Ve a "Ventas Activas" en el menú lateral',
      'Toca el botón "+ Nueva Venta"',
      "Selecciona el cliente (búscalo por nombre o teléfono)",
      "Ingresa el monto, el % de interés y el número de cuotas",
      'Toca "Registrar Venta" para confirmar',
    ],
    tip: "Si el cliente ya tiene un crédito activo, verás una alerta en amarillo. Puedes continuar de todas formas — el sistema permite múltiples créditos por cliente.",
  },
  {
    id: "cobro",
    color: "teal",
    icon: FiCheckCircle,
    title: "3. Registrar un cobro en ruta",
    steps: [
      'Ve a "Liquidación" en el menú lateral',
      "Busca al cliente en la lista (usa el buscador si hay muchos)",
      'Toca "Registrar Pago" cuando el cliente pague',
      "Ingresa el monto recibido y confirma",
      'Si no encontraste al cliente, usa "Visita Fallida" y escribe el motivo',
    ],
    tip: "El teléfono y la dirección del cliente siempre están visibles en la lista — no necesitas salir a buscarlo.",
  },
  {
    id: "whatsapp",
    color: "green",
    icon: FiMessageCircle,
    title: "4. Enviar recordatorio por WhatsApp",
    steps: [
      "En Liquidación, toca el ícono verde de WhatsApp del cliente",
      "Se abre WhatsApp con el mensaje ya escrito",
      "El mensaje incluye: saldo pendiente, total abonado y valor de la cuota",
      "Solo tienes que tocar Enviar",
    ],
    tip: "También puedes enviar WhatsApp desde el detalle de cualquier venta — útil para recordatorios programados.",
  },
  {
    id: "renovar",
    color: "rose",
    icon: FiRefreshCw,
    title: "5. Renovar un crédito vencido",
    steps: [
      'Ve a "Ventas Activas" y busca el crédito con estado "Vencido"',
      "Abre el detalle del crédito tocando sobre él",
      'Toca el botón "Renovar Crédito" (color naranja)',
      "Ajusta las cuotas, el interés y la fecha de inicio",
      'Confirma — el crédito anterior queda Pagado y se crea uno nuevo',
    ],
    tip: "El nuevo crédito usa el saldo actual del vencido como capital. No pierdes el historial del crédito anterior.",
  },
  {
    id: "cliente",
    color: "emerald",
    icon: FiStar,
    title: "6. Ver el perfil de un cliente",
    steps: [
      'Ve a "Clientes" y busca por nombre, teléfono o documento',
      "Toca sobre el cliente para ver su perfil completo",
      "Verás su score de comportamiento (0–100) y su etiqueta (Excelente / Regular / Riesgo)",
      "Más abajo está el historial completo de créditos con paginación",
      "El score se calcula automático según pagos a tiempo y atrasos",
    ],
    tip: "Un cliente con score alto es confiable. Uno con score bajo o etiqueta «Riesgo» requiere más cuidado antes de otorgar nuevo crédito.",
  },
  {
    id: "perdida",
    color: "slate",
    icon: FiTrendingDown,
    title: "7. Marcar un crédito como pérdida",
    steps: [
      "Abre el detalle del crédito desde Ventas Activas",
      'Toca "Marcar como Pérdida" (solo administradores)',
      "Lee el mensaje de confirmación — esta acción es permanente",
      "El cliente queda bloqueado automáticamente para nuevos créditos",
      "El crédito pasa al historial de Ventas en Pérdida",
    ],
    tip: "Las pérdidas quedan registradas en reportes para calcular la tasa de recupero del negocio.",
  },
  {
    id: "cierre",
    color: "slate",
    icon: FiCreditCard,
    title: "8. Hacer el cierre de caja",
    steps: [
      'Al final del día ve a "Cierre de Caja"',
      "Verifica el saldo calculado por el sistema",
      "Ingresa el saldo real en efectivo que tienes",
      "Registra el cierre — queda guardado con fecha y hora",
      "Puedes consultar cierres anteriores en el historial",
    ],
    tip: "Haz el cierre todos los días — es la base para que los reportes de rentabilidad sean exactos.",
  },
  {
    id: "reportes",
    color: "purple",
    icon: FiBarChart2,
    title: "9. Consultar reportes",
    steps: [
      'Ve a "Reportes" en el menú lateral (solo administradores)',
      "Selecciona el tipo: Utilidad, Cartera, Gastos, Visitas o Comparativo",
      "Elige el rango de fechas que quieres analizar",
      "Los datos se calculan automático con toda la información registrada",
    ],
    tip: "El reporte de Cartera muestra el envejecimiento de la mora: cuánto lleva 1–5 días, 6–15 días, 16–30 días y más de 30 días.",
  },
];

function ColorClass(color, type) {
  const map = {
    indigo: { bg: "bg-indigo-500", light: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-800", text: "text-indigo-600 dark:text-indigo-400", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
    violet: { bg: "bg-violet-500", light: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", text: "text-violet-600 dark:text-violet-400", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
    teal:   { bg: "bg-teal-500",   light: "bg-teal-50 dark:bg-teal-900/20",   border: "border-teal-200 dark:border-teal-800",   text: "text-teal-600 dark:text-teal-400",   badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
    green:  { bg: "bg-green-500",  light: "bg-green-50 dark:bg-green-900/20",  border: "border-green-200 dark:border-green-800",  text: "text-green-600 dark:text-green-400",  badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    rose:   { bg: "bg-rose-500",   light: "bg-rose-50 dark:bg-rose-900/20",   border: "border-rose-200 dark:border-rose-800",   text: "text-rose-600 dark:text-rose-400",   badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
    emerald:{ bg: "bg-emerald-500",light: "bg-emerald-50 dark:bg-emerald-900/20",border: "border-emerald-200 dark:border-emerald-800",text: "text-emerald-600 dark:text-emerald-400",badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    slate:  { bg: "bg-slate-500",  light: "bg-slate-50 dark:bg-slate-800/50",  border: "border-slate-200 dark:border-slate-700",  text: "text-slate-600 dark:text-slate-400",  badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    purple: { bg: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", text: "text-purple-600 dark:text-purple-400", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  };
  return map[color]?.[type] ?? "";
}

export default function GuiaRapidaPage() {
  const printRef = useRef(null);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Guía Rápida</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cartera Financiera — Referencia de uso</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
        >
          <FiPrinter size={15} />
          Imprimir / PDF
        </button>
      </div>

      <div ref={printRef} className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Cover */}
        <div className="glass rounded-[2rem] p-10 text-center border border-white/60 dark:border-slate-800 mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 dark:shadow-none">
            <FiHome className="text-white" size={28} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">
            Guía Rápida de Uso
          </h2>
          <p className="text-base font-bold text-indigo-600 mb-1">carterafinanciera.com</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Referencia paso a paso para las acciones más frecuentes del sistema.
            El mismo usuario y contraseña de siempre.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {["Administradores", "Cobradores", "Acceso desde celular o PC"].map(tag => (
              <span key={tag} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[11px] font-black uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Sections grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDE_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className={`glass rounded-[1.5rem] overflow-hidden border border-white/60 dark:border-slate-800 shadow-sm`}
              >
                {/* Color top bar */}
                <div className={`h-1 w-full ${ColorClass(section.color, "bg")}`} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${ColorClass(section.color, "bg")} flex items-center justify-center shrink-0`}>
                      <Icon className="text-white" size={18} />
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                      {section.title}
                    </h3>
                  </div>

                  {/* Steps */}
                  <ol className="space-y-2 mb-4">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className={`w-5 h-5 rounded-lg ${ColorClass(section.color, "badge")} text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5`}>
                          {i + 1}
                        </span>
                        <span className="text-[13px] text-slate-600 dark:text-slate-300 font-medium leading-snug">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {/* Tip */}
                  <div className={`p-3 rounded-xl ${ColorClass(section.color, "light")} border ${ColorClass(section.color, "border")}`}>
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className={`${ColorClass(section.color, "text")} shrink-0 mt-0.5`} size={13} />
                      <p className={`text-[11px] font-semibold ${ColorClass(section.color, "text")} leading-snug`}>
                        {section.tip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="glass rounded-[1.5rem] p-6 border border-white/60 dark:border-slate-800 text-center mt-4">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
            ¿Necesitas ayuda?
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
            Contacta a tu administrador o escríbenos directamente por WhatsApp.
          </p>
          <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">
            carterafinanciera.com · Guía v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

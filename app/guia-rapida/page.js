"use client";

import {
  FiPrinter,
  FiCheckCircle,
  FiShoppingCart,
  FiHome,
  FiPackage,
  FiMessageCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiStar,
  FiCreditCard,
  FiBarChart2,
  FiTrendingDown,
  FiMapPin,
} from "react-icons/fi";

const GUIDE_SECTIONS = [
  {
    id: "login",
    colorHex: "#6366f1",
    colorLight: "#eef2ff",
    colorBorder: "#c7d2fe",
    icon: FiHome,
    title: "1. Ingresar al sistema",
    steps: [
      "Abre carterafinanciera.com en tu celular o computador",
      "Ingresa tu usuario y contraseña (los mismos de siempre)",
      "Si eres cobrador, el sistema te lleva directo a Liquidación",
      "Si eres administrador, llegas al Panel Principal",
    ],
    tip: "Puedes instalar la app en tu celular: toca el botón «Agregar a inicio» que aparece en el navegador.",
  },
  {
    id: "credito",
    colorHex: "#7c3aed",
    colorLight: "#f5f3ff",
    colorBorder: "#ddd6fe",
    icon: FiShoppingCart,
    title: "2. Registrar un nuevo crédito",
    steps: [
      'Ve a "Ventas Activas" en el menú lateral',
      'Toca el botón "+ Nueva Venta"',
      "Selecciona el cliente (búscalo por nombre o teléfono)",
      "Ingresa el monto, el % de interés y el número de cuotas",
      'Toca "Registrar Venta" para confirmar',
    ],
    tip: "Si el cliente ya tiene un crédito activo verás una alerta en amarillo. Puedes continuar — el sistema permite múltiples créditos.",
  },
  {
    id: "cobro",
    colorHex: "#0d9488",
    colorLight: "#f0fdfa",
    colorBorder: "#99f6e4",
    icon: FiCheckCircle,
    title: "3. Registrar un cobro en ruta",
    steps: [
      'Ve a "Liquidación" en el menú lateral',
      "Busca al cliente en la lista (usa el buscador si hay muchos)",
      'Toca "Registrar Pago" cuando el cliente pague',
      "Ingresa el monto recibido y confirma",
      'Si no encontraste al cliente, usa "Visita Fallida" con el motivo',
      "El sistema captura tu ubicación GPS automáticamente al confirmar",
    ],
    tip: "Permite el acceso a tu ubicación cuando el navegador lo solicite — así queda registrado dónde se realizó cada cobro.",
  },
  {
    id: "whatsapp",
    colorHex: "#16a34a",
    colorLight: "#f0fdf4",
    colorBorder: "#bbf7d0",
    icon: FiMessageCircle,
    title: "4. Enviar recordatorio por WhatsApp",
    steps: [
      "En Liquidación, toca el ícono verde de WhatsApp del cliente",
      "Se abre WhatsApp con el mensaje ya escrito",
      "El mensaje incluye saldo pendiente, total abonado y valor de la cuota",
      "Solo tienes que tocar Enviar",
    ],
    tip: "También puedes enviar WhatsApp desde el detalle de cualquier venta — útil para recordatorios programados.",
  },
  {
    id: "renovar",
    colorHex: "#e11d48",
    colorLight: "#fff1f2",
    colorBorder: "#fecdd3",
    icon: FiRefreshCw,
    title: "5. Renovar un crédito vencido",
    steps: [
      'Ve a "Ventas Activas" y busca el crédito con estado "Vencido"',
      "Abre el detalle del crédito tocando sobre él",
      'Toca el botón "Renovar Crédito"',
      "Ajusta las cuotas, el interés y la fecha de inicio",
      "Confirma — el crédito anterior queda Pagado y se crea uno nuevo",
    ],
    tip: "El nuevo crédito usa el saldo actual del vencido como capital. No pierdes el historial del crédito anterior.",
  },
  {
    id: "cliente",
    colorHex: "#059669",
    colorLight: "#ecfdf5",
    colorBorder: "#a7f3d0",
    icon: FiStar,
    title: "6. Ver el perfil de un cliente",
    steps: [
      'Ve a "Clientes" y busca por nombre, teléfono o documento',
      "Toca sobre el cliente para ver su perfil completo",
      "Verás su score (0–100) y etiqueta: Excelente / Regular / Riesgo",
      "Más abajo está el historial completo de créditos",
      "El score se calcula automático según pagos a tiempo y atrasos",
    ],
    tip: "Un cliente con score bajo o etiqueta «Riesgo» requiere más cuidado antes de otorgar nuevo crédito.",
  },
  {
    id: "perdida",
    colorHex: "#64748b",
    colorLight: "#f8fafc",
    colorBorder: "#e2e8f0",
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
    colorHex: "#475569",
    colorLight: "#f8fafc",
    colorBorder: "#e2e8f0",
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
    colorHex: "#9333ea",
    colorLight: "#faf5ff",
    colorBorder: "#e9d5ff",
    icon: FiBarChart2,
    title: "9. Consultar reportes",
    steps: [
      'Ve a "Reportes" en el menú lateral (solo administradores)',
      "Selecciona el tipo: Utilidad, Cartera, Gastos, Visitas o Comparativo",
      "Elige el rango de fechas que quieres analizar",
      "Los datos se calculan automático con toda la información registrada",
    ],
    tip: "El reporte de Cartera muestra el envejecimiento de la mora: 1–5 días, 6–15 días, 16–30 días y más de 30 días.",
  },
  {
    id: "mapa",
    colorHex: "#4f46e5",
    colorLight: "#eef2ff",
    colorBorder: "#c7d2fe",
    icon: FiMapPin,
    title: "10. Mapa de cobros en campo",
    steps: [
      'Ve a "Reportes" → "Mapa de Cobros" (solo administradores)',
      "Selecciona la fecha que quieres revisar",
      "El mapa muestra la ruta exacta que hizo el cobrador ese día",
      "Punto verde = cobro recibido · Punto rojo = visita fallida",
      "Los cobros sin ubicación aparecen en la lista inferior",
    ],
    tip: "Verifica que los cobradores realmente salieron a campo: si un cobro no tiene punto en el mapa, el GPS estaba desactivado al momento de registrarlo.",
  },
];

export default function GuiaRapidaPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-root {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-content {
            max-width: 100% !important;
            padding: 16px !important;
          }
          .print-cover {
            background: white !important;
            border: 2px solid #6366f1 !important;
            backdrop-filter: none !important;
            page-break-after: avoid;
            margin-bottom: 16px !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .print-card {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            overflow: visible !important;
            backdrop-filter: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-footer {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            backdrop-filter: none !important;
            page-break-inside: avoid !important;
          }
          .print-tip {
            border-width: 1px !important;
          }
        }
      `}</style>

      {/* Header — solo pantalla */}
      <div className="no-print sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Guía Rápida</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cartera Financiera — Referencia de uso</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
        >
          <FiPrinter size={15} />
          Imprimir / PDF
        </button>
      </div>

      <div className="print-root">
        <div className="print-content max-w-4xl mx-auto px-4 py-10 space-y-6">

          {/* Cover */}
          <div className="print-cover glass rounded-[2rem] p-8 text-center border border-white/60 dark:border-slate-800">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
              <FiHome className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
              Guía Rápida de Uso
            </h2>
            <p className="text-sm font-bold text-indigo-600 mb-1">carterafinanciera.com</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Referencia paso a paso para las acciones más frecuentes. El mismo usuario y contraseña de siempre.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Administradores", "Cobradores", "Celular o PC"].map(tag => (
                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-indigo-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="print-grid grid grid-cols-1 md:grid-cols-2 gap-5">
            {GUIDE_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="print-card bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
                  style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
                >
                  {/* Color bar */}
                  <div style={{ height: 4, background: section.colorHex }} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: section.colorHex }}
                      >
                        <Icon className="text-white" size={16} />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                        {section.title}
                      </h3>
                    </div>

                    {/* Steps */}
                    <ol className="space-y-2 mb-4">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span
                            className="w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: section.colorLight, color: section.colorHex, border: `1px solid ${section.colorBorder}` }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-[12px] text-slate-600 dark:text-slate-300 font-medium leading-snug">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>

                    {/* Tip */}
                    <div
                      className="print-tip p-3 rounded-xl flex items-start gap-2"
                      style={{ background: section.colorLight, border: `1px solid ${section.colorBorder}` }}
                    >
                      <FiAlertCircle size={12} className="shrink-0 mt-0.5" style={{ color: section.colorHex }} />
                      <p className="text-[11px] font-semibold leading-snug" style={{ color: section.colorHex }}>
                        {section.tip}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="print-footer glass rounded-2xl p-5 border border-white/60 dark:border-slate-800 text-center"
            style={{ pageBreakInside: "avoid" }}
          >
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">¿Necesitas ayuda?</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
              Contacta a tu administrador o escríbenos por WhatsApp.
            </p>
            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">
              carterafinanciera.com · Guía v1.1 · Actualizado abril 2026
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

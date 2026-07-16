"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiFlag,
  FiUser,
  FiShoppingCart,
  FiCheckCircle,
  FiCreditCard,
  FiChevronRight,
  FiX,
  FiBookOpen,
  FiCheck,
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

const doneKey = (tiendaId) => `cartera_primeros_pasos_done_${tiendaId}`;

/**
 * Checklist de primeros pasos para rutas nuevas.
 * Cada paso se verifica contra datos reales del servidor (no localStorage),
 * por lo que funciona en cualquier dispositivo y se completa solo.
 * Se oculta definitivamente cuando todos los pasos están completos o al descartarlo.
 */
export default function PrimerosPasos({ detail, activos = [] }) {
  const router = useRouter();
  const tiendaId = detail?.tienda?.id;

  const [dismissed, setDismissed] = useState(true); // oculto hasta verificar
  const [extra, setExtra] = useState(null); // { tieneClientes, tieneCierres }

  // Verificar flag local y consultar clientes + cierres (solo si aún no está completado)
  useEffect(() => {
    if (!tiendaId) return;
    if (localStorage.getItem(doneKey(tiendaId)) === "1") {
      setDismissed(true);
      return;
    }
    setDismissed(false);
    let ignore = false;
    const fetchArr = (path) =>
      apiFetch(path)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    Promise.all([
      fetchArr(`/clientes/tienda/${tiendaId}/`),
      fetchArr(`/tiendas/cierres/t/${tiendaId}/`),
    ]).then(([clientes, cierres]) => {
      if (ignore) return;
      setExtra({
        tieneClientes: Array.isArray(clientes) && clientes.length > 0,
        tieneCierres: Array.isArray(cierres) && cierres.length > 0,
      });
    });
    return () => { ignore = true; };
  }, [tiendaId]);

  const t = detail?.tienda || {};
  const ventaOk =
    (parseFloat(t.ventas_netas) || 0) > 0 || (activos?.length || 0) > 0;
  const cobroOk =
    (parseFloat(t.ingresos_ventas_finalizadas) || 0) > 0 ||
    (parseFloat(t.recaudos_dia) || 0) > 0 ||
    (activos || []).some((v) => (parseFloat(v.pagos_realizados) || 0) > 0);

  const steps = [
    {
      id: "cliente",
      done: !!extra?.tieneClientes,
      icon: FiUser,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      title: "Registra tu primer cliente",
      desc: "Nombre, documento, teléfono y dirección",
      href: "/dashboard/clientes/crear",
    },
    {
      id: "venta",
      done: ventaOk,
      icon: FiShoppingCart,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      title: "Crea tu primera venta a crédito",
      desc: "Monto, interés y número de cuotas",
      href: "/dashboard/ventas/nueva",
    },
    {
      id: "cobro",
      done: cobroOk,
      icon: FiCheckCircle,
      color: "text-teal-500",
      bg: "bg-teal-50 dark:bg-teal-900/20",
      title: "Registra tu primer cobro",
      desc: "Desde Liquidar, el módulo de trabajo en ruta",
      href: "/dashboard/liquidar",
    },
    {
      id: "cierre",
      done: !!extra?.tieneCierres,
      icon: FiCreditCard,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      title: "Haz tu primer cierre de caja",
      desc: "El balance del día, al final de la jornada",
      href: "/dashboard/cierre-caja",
    },
  ];

  const completados = steps.filter((s) => s.done).length;
  const allDone = !!extra && completados === steps.length;

  // Al completar todo, persistir para no volver a consultar en próximas sesiones
  useEffect(() => {
    if (allDone && tiendaId) {
      localStorage.setItem(doneKey(tiendaId), "1");
    }
  }, [allDone, tiendaId]);

  if (dismissed || !extra) return null;

  const handleDismiss = () => {
    if (tiendaId) localStorage.setItem(doneKey(tiendaId), "1");
    setDismissed(true);
  };

  return (
    <div className="glass rounded-[1.75rem] border-white/60 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 md:px-6 pt-5 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none">
          <FiFlag className="text-white" size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-tight">
            {allDone ? "¡Tu ruta ya está operando!" : "Primeros pasos"}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {allDone
              ? "Completaste todos los pasos"
              : "Completa estos pasos para empezar a operar"}
          </p>
        </div>
        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest shrink-0">
          {completados}/{steps.length}
        </span>
        <button
          onClick={handleDismiss}
          title="Ocultar guía"
          aria-label="Ocultar guía de primeros pasos"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
        >
          <FiX size={15} />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="mx-5 md:mx-6 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${(completados / steps.length) * 100}%` }}
        />
      </div>

      {/* Pasos */}
      <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => !step.done && router.push(step.href)}
              disabled={step.done}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all group ${
                step.done
                  ? "border-transparent bg-slate-50/60 dark:bg-slate-800/40 opacity-70"
                  : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 active:scale-[0.98]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  step.done
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : step.bg
                }`}
              >
                {step.done ? (
                  <FiCheck className="text-emerald-600" size={16} />
                ) : (
                  <Icon className={step.color} size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[12px] font-black tracking-tight leading-tight ${
                    step.done
                      ? "text-slate-400 line-through"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {i + 1}. {step.title}
                </p>
                <p className="text-[10px] font-bold text-slate-400 truncate">
                  {step.desc}
                </p>
              </div>
              {!step.done && (
                <FiChevronRight
                  className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0"
                  size={15}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 md:px-6 pb-4 flex items-center justify-between gap-3">
        <Link
          href="/guia-rapida"
          className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-colors"
        >
          <FiBookOpen size={12} />
          Ver guía completa
        </Link>
        {allDone && (
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiHelpCircle,
  FiBookOpen,
  FiMessageCircle,
  FiPlay,
  FiChevronRight,
} from "react-icons/fi";

const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";

/**
 * Menú de ayuda unificado: agrupa el tour de la app, la guía rápida
 * y el contacto de soporte por WhatsApp en un solo botón "?".
 * `direction`: "down" (top bar móvil) | "up" (footer del sidebar desktop).
 */
export default function HelpMenu({ onStartTour, direction = "down", buttonClassName = "" }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const waHref = SUPPORT_WHATSAPP
    ? `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hola, necesito ayuda con la plataforma.")}`
    : null;

  const itemClass =
    "w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Ayuda"
        aria-label="Ayuda"
        aria-expanded={open}
        className={buttonClassName}
      >
        <FiHelpCircle size={direction === "down" ? 18 : 16} />
      </button>

      {open && (
        <>
          {/* Backdrop para cerrar al tocar fuera */}
          <div className="fixed inset-0 z-[90]" onClick={close} />

          <div
            className={`absolute z-[91] w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/20 ${
              direction === "up" ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"
            }`}
          >
            <p className="px-2.5 pt-1.5 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
              ¿Necesitas ayuda?
            </p>

            <button
              type="button"
              onClick={() => { close(); onStartTour?.(); }}
              className={itemClass}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <FiPlay className="text-indigo-500" size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-tight">Tour de la app</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recorrido por los módulos</p>
              </div>
              <FiChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" size={13} />
            </button>

            <Link href="/guia-rapida" onClick={close} className={itemClass}>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <FiBookOpen className="text-emerald-500" size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-tight">Guía rápida</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Manual paso a paso · imprimible</p>
              </div>
              <FiChevronRight className="text-slate-300 group-hover:text-emerald-400 transition-colors shrink-0" size={13} />
            </Link>

            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={close} className={itemClass}>
                <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <FiMessageCircle className="text-green-500" size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-tight">Soporte por WhatsApp</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Escríbenos directamente</p>
                </div>
                <FiChevronRight className="text-slate-300 group-hover:text-green-400 transition-colors shrink-0" size={13} />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

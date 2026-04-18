"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiUser, FiArrowRight, FiX,
  FiHome, FiShoppingCart, FiUsers, FiCheckCircle,
  FiPackage, FiTrendingDown, FiCreditCard, FiBarChart2,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";

const PAGES = [
  { label: "Dashboard", path: "/dashboard", icon: FiHome, adminOnly: true },
  { label: "Clientes", path: "/dashboard/clientes", icon: FiUsers },
  { label: "Ventas Activas", path: "/dashboard/ventas", icon: FiShoppingCart },
  { label: "Liquidación", path: "/dashboard/liquidar", icon: FiCheckCircle },
  { label: "Recaudos", path: "/dashboard/recaudos", icon: FiPackage },
  { label: "Gastos", path: "/dashboard/gastos", icon: FiTrendingDown },
  { label: "Cierre de Caja", path: "/dashboard/cierre-caja", icon: FiCreditCard },
  { label: "Reportes Utilidad", path: "/dashboard/reportes/utilidad", icon: FiBarChart2, adminOnly: true },
  { label: "Trabajadores", path: "/dashboard/trabajadores", icon: FiUsers, adminOnly: true },
];

export default function GlobalSearch({ isOpen, onClose }) {
  const router = useRouter();
  const { selectedStore, user } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;

  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen || loaded || !selectedStore?.tienda?.id) return;
    setLoadingClientes(true);
    apiFetch(`/clientes/tienda/${selectedStore.tienda.id}/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setClientes(Array.isArray(data) ? data : []); setLoaded(true); })
      .catch(() => setClientes([]))
      .finally(() => setLoadingClientes(false));
  }, [isOpen, loaded, selectedStore]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  const q = query.toLowerCase().trim();

  const filteredPages = PAGES.filter((p) => {
    if (p.adminOnly && !isAdmin) return false;
    return q ? p.label.toLowerCase().includes(q) : true;
  }).slice(0, q ? 6 : 4);

  const filteredClients = q
    ? clientes
        .filter((c) => {
          const haystack = `${c.nombres} ${c.apellidos} ${c.identificacion} ${c.nombre_local || ""}`.toLowerCase();
          return haystack.includes(q);
        })
        .slice(0, 8)
    : [];

  const allResults = [
    ...filteredPages.map((p) => ({ type: "page", ...p })),
    ...filteredClients.map((c) => ({ type: "client", ...c })),
  ];

  const navigate = useCallback(
    (item) => {
      router.push(item.type === "page" ? item.path : `/dashboard/clientes/${item.id}`);
      onClose();
    },
    [router, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allResults.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && allResults[activeIndex]) navigate(allResults[activeIndex]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, allResults, activeIndex, navigate, onClose]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] px-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">

        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <FiSearch className="text-indigo-500 shrink-0" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, página..."
            className="flex-1 bg-transparent text-[14px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <FiX size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">Esc</kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto">
          {loadingClientes && (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}

          {!loadingClientes && q && allResults.length === 0 && (
            <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-widest py-10">Sin resultados</p>
          )}

          {/* Pages */}
          {filteredPages.length > 0 && (
            <div>
              <p className="px-5 pt-3 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {q ? "Páginas" : "Accesos rápidos"}
              </p>
              {filteredPages.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate({ type: "page", ...item })}
                    className={`w-full flex items-center justify-between px-5 py-3 transition-all ${
                      activeIndex === idx ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Icon size={13} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                    </div>
                    <FiArrowRight size={13} className="text-slate-300" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Clients */}
          {filteredClients.length > 0 && (
            <div>
              <p className="px-5 pt-3 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Clientes</p>
              {filteredClients.map((c, idx) => {
                const globalIdx = filteredPages.length + idx;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate({ type: "client", ...c })}
                    className={`w-full flex items-center gap-3 px-5 py-3 transition-all ${
                      activeIndex === globalIdx ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <FiUser size={13} className="text-indigo-500" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                        {c.nombres} {c.apellidos}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.identificacion}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 ${
                      c.estado_cliente === "Activo"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                        : c.estado_cliente === "Bloqueado"
                        ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                      {c.estado_cliente}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!q && !loadingClientes && (
            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-6">
              Escribe para buscar clientes
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 font-black">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 font-black">↵</kbd> abrir
          </span>
        </div>
      </div>
    </div>
  );
}

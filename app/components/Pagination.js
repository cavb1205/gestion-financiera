// app/components/Pagination.js
"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function getPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

/**
 * Componente de paginación reutilizable.
 *
 * @param {number} currentPage - Página actual (1-indexed)
 * @param {number} totalPages - Total de páginas
 * @param {(page: number) => void} onPageChange - Callback al cambiar página
 * @param {number} [totalItems] - Total de items (para mostrar rango "1–10 de 50")
 * @param {number} [itemsPerPage] - Items por página (para calcular rango)
 * @param {(value: number) => void} [onItemsPerPageChange] - Si se pasa, muestra selector de items por página
 * @param {number[]} [itemsPerPageOptions] - Opciones del selector (default: [5, 10, 25])
 * @param {string} [accentColor] - Color de acento: "indigo" (default) o "rose"
 * @param {boolean} [centered] - Si true, centra la paginación sin mostrar rango
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 25],
  accentColor = "indigo",
  centered = false,
}) {
  if (totalPages <= 1) return null;

  const indexOfFirstItem = (currentPage - 1) * (itemsPerPage || 1);
  const indexOfLastItem = indexOfFirstItem + (itemsPerPage || 1);

  const activeClass =
    accentColor === "rose"
      ? "bg-slate-900 dark:bg-rose-600 text-white shadow-lg"
      : "bg-slate-900 dark:bg-indigo-600 text-white shadow-lg";

  const hoverAccent =
    accentColor === "rose" ? "hover:text-rose-600" : "hover:text-indigo-600";

  const hoverBorder =
    accentColor === "rose"
      ? "hover:border-rose-300"
      : "hover:border-indigo-300";

  return (
    <div
      className={`px-6 md:px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center ${
        centered ? "justify-center" : "justify-between"
      } gap-4`}
    >
      {/* Left side: items-per-page selector or item range */}
      {!centered && (
        <div className="items-center gap-3 hidden sm:flex">
          {onItemsPerPageChange && (
            <select
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {totalItems != null && itemsPerPage && (
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, totalItems)} de{" "}
              {totalItems}
            </p>
          )}
        </div>
      )}

      {/* Page buttons */}
      <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 ${hoverAccent} disabled:opacity-30 transition-all shadow-sm active:scale-95`}
        >
          <FiChevronLeft size={16} />
        </button>

        {getPageNumbers(currentPage, totalPages).map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
              currentPage === n
                ? activeClass
                : `bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 ${hoverBorder}`
            }`}
          >
            {n}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 ${hoverAccent} disabled:opacity-30 transition-all shadow-sm active:scale-95`}
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

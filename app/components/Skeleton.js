"use client";

// Predefined width cycle — no random values to avoid hydration mismatch
const WS = ["w-3/4", "w-1/2", "w-2/3", "w-4/5", "w-1/3", "w-3/5", "w-2/5", "w-5/6"];

// KPI card skeleton — matches glass p-8 rounded-[2.5rem] layout used in clientes/ventas/recaudos
export function SkeletonCard({ className = "" }) {
  return (
    <div className={`glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="w-14 h-3 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
      <div className="w-28 h-8 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl mb-2" />
      <div className="w-36 h-3 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
    </div>
  );
}

// Table body rows skeleton — renders <tr> elements, must be placed inside <tbody>
export function SkeletonTableRows({ rows = 6, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-5">
              <div className={`h-4 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${WS[(i * cols + j) % WS.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Card-style list rows (for pages without tables)
export function SkeletonListRows({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 bg-white/40 dark:bg-slate-800/30 rounded-2xl">
          <div className="w-10 h-10 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className={`h-4 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${WS[i % WS.length]}`} />
            <div className="w-1/4 h-3 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

// Wrapper: label + arbitrary input/select/textarea + inline error message
export default function FormField({ label, error, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[9px] text-rose-500 font-black uppercase tracking-tight ml-1">
          {error}
        </p>
      )}
    </div>
  );
}

// Returns the Tailwind className for an input, styled consistently across the app.
// Pass hasError=true to switch border to rose.
// px: override padding when the input has a leading icon (e.g. "pl-12 pr-5")
export function inputClass(hasError = false, px = "px-5") {
  return [
    `w-full ${px} py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl`,
    "text-[13px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400",
    "focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none",
    hasError
      ? "border border-rose-400"
      : "border border-slate-100 dark:border-slate-700",
  ].join(" ");
}

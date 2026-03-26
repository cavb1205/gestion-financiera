import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/15 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-rose-600/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <p className="text-[120px] md:text-[180px] font-black text-white/5 leading-none tracking-tighter select-none">404</p>

        <div className="-mt-16 md:-mt-24">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mb-3">
            Ruta no <span className="text-indigo-500">encontrada</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mb-10">
            La página que buscas no existe o fue movida.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-900/30"
            >
              Ir al Dashboard
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

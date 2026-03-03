// app/login/page.js
"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  FiUser, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiShield, 
  FiAlertCircle,
  FiActivity,
  FiArrowRight,
  FiCheckCircle
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Credenciales inválidas");
      }

      login(data);
      toast.success("¡Autenticación exitosa!", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      router.push("/select-store");
    } catch (err) {
      const errorMsg = err.message || "Error en el inicio de sesión";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-center",
        autoClose: 4000,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Elementos de fondo dinámicos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[130px] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/15 blur-[130px] rounded-full animate-pulse opacity-60" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-[30%] right-[15%] w-[30%] h-[30%] bg-blue-600/10 blur-[110px] rounded-full opacity-40"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Sección de Logo/Branding */}
        <div className="text-center mb-10 transform hover:scale-105 transition-all duration-500">
          <div className="inline-flex p-5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] mb-6 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <FiShield className="text-emerald-500 text-5xl relative z-10" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 uppercase italic">
            MONEY<span className="text-emerald-500 not-italic">APP</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">Sistema de Gestión Financiera</p>
        </div>

        {/* Tarjeta de Login (Glassmorphism) */}
        <div className="glass p-10 md:p-14 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="relative z-10">
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-3 uppercase">Bienvenido</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ingrese su firma digital de acceso</p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Input de Usuario */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificador de Usuario</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300">
                        <FiUser size={20} />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-[15px] font-bold text-white placeholder:text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all outline-none"
                      placeholder="nombre_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                {/* Input de Contraseña */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Token de Seguridad</label>
                    <button type="button" className="text-[9px] font-black text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest outline-none">Recuperar Acceso</button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300">
                        <FiLock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-14 pr-16 py-5 bg-white/5 border border-white/5 rounded-2xl text-[15px] font-bold text-white placeholder:text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all outline-none"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all p-1 outline-none"
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Manejo de Recordarme */}
              <div className="flex items-center gap-3 px-1">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input type="checkbox" className="sr-only" />
                        <div className="w-5 h-5 border-2 border-white/10 rounded-lg group-hover:border-emerald-500/50 transition-all"></div>
                        <FiCheckCircle className="absolute inset-0 text-emerald-500 opacity-0 scale-50 transition-all" size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Sesión Persistente</span>
                 </label>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-shake overflow-hidden relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-rose-500"></div>
                  <FiAlertCircle className="text-rose-500 shrink-0" size={18} />
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-tight">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group/btn overflow-hidden relative"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verificando Identidad...</span>
                    </>
                  ) : (
                    <>
                      <FiActivity className="group-hover/btn:rotate-180 transition-transform duration-700" size={18} />
                      <span>Autenticar Acceso</span>
                      <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Decoración sutil superior e inferior */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="absolute -left-20 -bottom-20 opacity-5 pointer-events-none rotate-12">
            <FiShield size={320} className="text-white" />
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-12 space-y-4">
           <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
             <FiShield className="text-emerald-900" /> 
             Cifrado AES-256 Activo
           </p>
           <div className="flex items-center justify-center gap-6 opacity-30">
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
// app/dashboard/perfil/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import { toast } from "react-toastify";

export default function PerfilPage() {
  const router = useRouter();
  const { user, profile, selectedStore } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(`/trabajadores/password/${profile.id}/`, {
        method: "POST",
        body: JSON.stringify({ passwordNuevo: newPassword }),
      });
      if (!response.ok) throw new Error("Error al cambiar la contraseña");
      toast.success("Contraseña actualizada correctamente");
      router.push("/dashboard/liquidar");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 active:scale-95 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Mi Perfil</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              {selectedStore?.tienda?.nombre}
            </p>
          </div>
        </div>

        {/* User info card */}
        <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              {profile?.trabajador?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-base font-black text-slate-800 dark:text-white">{profile?.trabajador || "Usuario"}</p>
              <div className="flex items-center gap-2 mt-1">
                <FiUser size={11} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.username || user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Password change form */}
        <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-7">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl">
              <FiLock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Cambiar Contraseña</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mínimo 6 caracteres</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full px-5 py-3.5 pr-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetir contraseña"
                required
                className="block w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-amber-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave size={15} />
                  Actualizar Contraseña
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 mt-6 px-2 opacity-60">
          <FiShield className="text-slate-400 mt-0.5 shrink-0" size={13} />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Tu contraseña es personal e intransferible. Nunca la compartas con nadie.
          </p>
        </div>

      </div>
    </div>
  );
}

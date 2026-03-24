// app/dashboard/trabajadores/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiEdit2,
  FiTrash2,
  FiActivity,
  FiShield,
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiX,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function TrabajadorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [trabajador, setTrabajador] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchTrabajador = async () => {
      if (!token || !id) return;
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trabajadores/${id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("No se pudo cargar el colaborador.");
        const data = await response.json();
        setTrabajador(data);
      } catch (error) {
        toast.error(error.message);
        router.push("/dashboard/trabajadores");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrabajador();
  }, [token, id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trabajadores/${id}/delete/`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Error al eliminar el colaborador.");
      toast.success("Colaborador eliminado correctamente.");
      router.push("/dashboard/trabajadores");
    } catch (error) {
      toast.error(error.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trabajadores/password/${id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        }
      );
      if (!response.ok) throw new Error("Error al cambiar la contraseña");
      toast.success("Contraseña actualizada correctamente");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  if (authLoading || !isAuthenticated) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando Ficha</p>
      </div>
    );
  }

  if (!trabajador) return null;

  const fullName = `${trabajador.first_name} ${trabajador.last_name}`.trim() || trabajador.username;
  const initials = (trabajador.first_name?.charAt(0) || trabajador.username?.charAt(0) || "?").toUpperCase();

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 md:px-0">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/trabajadores")}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">{fullName}</h1>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">
              <span className={trabajador.is_staff ? "text-amber-500" : "text-indigo-500"}>
                {trabajador.is_staff ? "Administrador" : "Colaborador"}
              </span>
              {" • "}
              <span className={trabajador.is_active ? "text-emerald-500" : "text-slate-400"}>
                {trabajador.is_active ? "Activo" : "Inactivo"}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => router.push(`/dashboard/trabajadores/${id}/editar`)}
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <FiEdit2 size={15} />
            Editar
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-900 text-rose-500 border border-rose-100 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10"
          >
            <FiTrash2 size={15} />
            Eliminar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Profile Card */}
          <div className="lg:col-span-4">
            <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-slate-900 dark:bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl uppercase shadow-xl mb-5">
                  {initials}
                </div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight capitalize mb-1">{fullName.toLowerCase()}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">@{trabajador.username}</p>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${trabajador.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    {trabajador.is_active ? "Activo" : "Inactivo"}
                  </span>
                  {trabajador.is_staff && (
                    <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-800/30 rounded-xl text-[9px] font-black uppercase tracking-widest">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-8 space-y-5">

            {/* Personal Info */}
            <div className="glass p-7 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-5">
                <FiUser className="text-indigo-500" size={14} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Datos Personales</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={<FiCreditCard size={14} />} label="Identificación" value={trabajador.identificacion} />
                <InfoRow icon={<FiPhone size={14} />} label="Teléfono" value={trabajador.telefono || "—"} />
                <InfoRow icon={<FiMapPin size={14} />} label="Dirección" value={trabajador.direccion || "—"} className="md:col-span-2" />
              </div>
            </div>

            {/* Account Info */}
            <div className="glass p-7 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-5">
                <FiShield className="text-indigo-500" size={14} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuenta del Sistema</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={<FiActivity size={14} />} label="Usuario" value={trabajador.username} />
                <InfoRow icon={<FiShield size={14} />} label="Rol" value={trabajador.is_staff ? "Administrador" : "Colaborador"} />
                <InfoRow icon={<FiCalendar size={14} />} label="Registro" value={formatDate(trabajador.date_joined)} />
                <InfoRow icon={<FiClock size={14} />} label="Último acceso" value={formatDate(trabajador.last_login)} />
              </div>
            </div>

            {/* Change Password */}
            <div className="glass p-7 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-5">
                <FiLock className="text-amber-500" size={14} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar Contraseña</span>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="block w-full px-5 py-3.5 pr-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-amber-500/10 transition-all"
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                      Confirmar Contraseña
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetir contraseña"
                      className="block w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-amber-100 dark:shadow-none"
                >
                  {changingPassword ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiLock size={15} />
                  )}
                  {changingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass w-full max-w-sm p-8 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center">
                <FiAlertTriangle className="text-rose-600" size={24} />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Eliminar Colaborador</h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-8">
              Esta acción eliminará permanentemente a <span className="text-slate-800 dark:text-white">{fullName}</span> y su cuenta de acceso. No se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><FiTrash2 size={15} /> Confirmar Eliminación</>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, className = "" }) {
  return (
    <div className={`flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 ${className}`}>
      <div className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate">{value}</p>
      </div>
    </div>
  );
}

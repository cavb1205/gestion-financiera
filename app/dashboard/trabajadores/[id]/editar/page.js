// app/dashboard/trabajadores/[id]/editar/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiShield,
  FiLock,
  FiAlertCircle,
  FiCheck,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { apiFetch } from "@/app/utils/api";

export default function EditarTrabajadorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    identificacion: "",
    telefono: "",
    direccion: "",
    is_active: true,
    is_staff: false,
  });
  const [passData, setPassData] = useState({ nueva: "", confirmar: "" });
  const [errors, setErrors] = useState({});
  const [passError, setPassError] = useState("");

  useEffect(() => {
    const fetchTrabajador = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await apiFetch(
          `/trabajadores/${id}/`
        );
        if (!response.ok) throw new Error("No se pudo cargar el colaborador.");
        const data = await response.json();
        setFormData({
          username: data.username || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          identificacion: data.identificacion || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          is_active: data.is_active ?? true,
          is_staff: data.is_staff ?? false,
        });
      } catch (error) {
        toast.error(error.message);
        router.push("/dashboard/trabajadores");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrabajador();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const toggleBool = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};
    ["username", "first_name", "last_name", "identificacion"].forEach((field) => {
      if (!formData[field].trim()) newErrors[field] = "Campo obligatorio";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const response = await apiFetch(
        `/trabajadores/${id}/update/`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...formData,
            tienda: selectedStore.tienda.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const backendErrors = {};
        Object.keys(errorData).forEach((field) => {
          backendErrors[field] = Array.isArray(errorData[field])
            ? errorData[field].join(", ")
            : errorData[field];
        });
        setErrors(backendErrors);
        throw new Error("Revise los errores en el formulario.");
      }

      toast.success("Colaborador actualizado correctamente.");
      router.push(`/dashboard/trabajadores/${id}`);
    } catch (err) {
      toast.error(err.message || "Error al actualizar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError("");
    if (!passData.nueva || passData.nueva.length < 6) {
      setPassError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passData.nueva !== passData.confirmar) {
      setPassError("Las contraseñas no coinciden.");
      return;
    }
    setIsChangingPass(true);
    try {
      const response = await apiFetch(
        `/trabajadores/password/${id}/`,
        {
          method: "POST",
          body: JSON.stringify({ passwordNuevo: passData.nueva }),
        }
      );
      if (!response.ok) throw new Error("Error al cambiar la contraseña.");
      toast.success("Contraseña actualizada correctamente.");
      setPassData({ nueva: "", confirmar: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsChangingPass(false);
    }
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando Ficha</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-0">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/dashboard/trabajadores/${id}`)}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Editar Colaborador</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">ID #{id}</p>
          </div>
        </div>

        {/* Main Edit Form */}
        <div className="glass rounded-[2rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl mb-6">
          <div className="p-6 md:p-10 bg-white/40 dark:bg-transparent">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">

                {/* Left: Identidad */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <FiUser className="text-indigo-500" size={14} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad Personal</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label htmlFor="first_name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombres *</label>
                      <input
                        id="first_name"
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.first_name ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                      />
                      {errors.first_name && <p className="text-[9px] text-rose-500 font-black uppercase tracking-tight ml-1">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last_name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellidos *</label>
                      <input
                        id="last_name"
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.last_name ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                      />
                      {errors.last_name && <p className="text-[9px] text-rose-500 font-black uppercase tracking-tight ml-1">{errors.last_name}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="identificacion" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documento *</label>
                    <div className="relative">
                      <FiCreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                      <input
                        id="identificacion"
                        type="text"
                        name="identificacion"
                        value={formData.identificacion}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.identificacion ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                      />
                    </div>
                    {errors.identificacion && <p className="text-[9px] text-rose-500 font-black uppercase tracking-tight ml-1">{errors.identificacion}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="telefono" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
                    <div className="relative">
                      <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                      <input
                        id="telefono"
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="direccion" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                      <input
                        id="direccion"
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Cuenta y Permisos */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <FiShield className="text-indigo-500" size={14} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuenta y Permisos</span>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="username" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuario (Login) *</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.username ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                    />
                    {errors.username && <p className="text-[9px] text-rose-500 font-black uppercase tracking-tight ml-1">{errors.username}</p>}
                  </div>

                  {/* Toggle: Activo */}
                  <div
                    onClick={() => toggleBool("is_active")}
                    className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-300 transition-all"
                  >
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Estado de Cuenta</p>
                      <p className={`text-[12px] font-black uppercase tracking-wide ${formData.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formData.is_active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    {formData.is_active
                      ? <FiToggleRight className="text-emerald-500" size={32} />
                      : <FiToggleLeft className="text-slate-300" size={32} />
                    }
                  </div>

                  {/* Toggle: Admin */}
                  <div
                    onClick={() => toggleBool("is_staff")}
                    className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-300 transition-all"
                  >
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Rol de Sistema</p>
                      <p className={`text-[12px] font-black uppercase tracking-wide ${formData.is_staff ? 'text-amber-600' : 'text-indigo-500'}`}>
                        {formData.is_staff ? "Administrador" : "Colaborador"}
                      </p>
                    </div>
                    {formData.is_staff
                      ? <FiToggleRight className="text-amber-500" size={32} />
                      : <FiToggleLeft className="text-slate-300" size={32} />
                    }
                  </div>
                </div>
              </div>

              {/* Sticky Action Bar */}
              <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t md:border-slate-100 dark:md:border-slate-800 md:p-0 md:backdrop-blur-none md:z-auto md:pt-6">
                <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-4xl mx-auto">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto md:px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 order-1 md:order-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><FiSave size={16} /> Guardar Cambios</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/trabajadores/${id}`)}
                    className="w-full md:w-auto px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="glass rounded-[2rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-xl">
          <div className="p-6 md:p-10">
            <div className="flex items-center gap-2 mb-6">
              <FiLock className="text-indigo-500" size={14} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar Contraseña</span>
            </div>

            {passError && (
              <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
                <FiAlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">{passError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="nueva-contrasena" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                <input
                  id="nueva-contrasena"
                  type="password"
                  value={passData.nueva}
                  onChange={(e) => { setPassData(p => ({ ...p, nueva: e.target.value })); setPassError(""); }}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmar-contrasena" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar</label>
                <input
                  id="confirmar-contrasena"
                  type="password"
                  value={passData.confirmar}
                  onChange={(e) => { setPassData(p => ({ ...p, confirmar: e.target.value })); setPassError(""); }}
                  placeholder="Repetir contraseña"
                  autoComplete="new-password"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isChangingPass ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FiCheck size={15} /> Actualizar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

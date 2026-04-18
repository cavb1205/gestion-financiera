// app/dashboard/trabajadores/crear/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiArrowLeft,
  FiSave,
  FiCheck,
  FiAlertCircle,
  FiShield,
  FiLock,
  FiCreditCard,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { apiFetch } from "@/app/utils/api";
import { useForm } from "@/app/hooks/useForm";
import FormField, { inputClass } from "@/app/components/FormField";

const INITIAL = {
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  identificacion: "",
  telefono: "",
  direccion: "",
};

export default function CrearTrabajadorPage() {
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading } = useAuth();
  const { values, errors, setErrors, handleChange } = useForm(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const validateForm = () => {
    const newErrors = {};
    ["first_name", "last_name", "username", "password", "identificacion"].forEach((field) => {
      if (!values[field].trim()) newErrors[field] = "Campo obligatorio";
    });
    if (values.password && values.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const response = await apiFetch(
        `/trabajadores/create/t/${selectedStore.tienda.id}/`,
        { method: "POST", body: JSON.stringify(values) }
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

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/trabajadores"), 1500);
    } catch (err) {
      setSubmitError(err.message || "Error al crear el colaborador.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-0">

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/trabajadores")}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Nuevo Colaborador</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Alta de Personal</p>
          </div>
        </div>

        <div className="glass rounded-[2rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl">
          <div className="hidden md:block bg-slate-900 dark:bg-indigo-600 p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-5">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                <FiUser className="text-3xl text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-1">Registro de Ingreso</p>
                <h2 className="text-2xl font-black tracking-tight">Ficha de Colaborador</h2>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="p-6 md:p-10 bg-white/40 dark:bg-transparent">
            {submitError && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
                <FiAlertCircle className="text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">{submitError}</p>
              </div>
            )}

            {success ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-[1.5rem] animate-ping opacity-20"></div>
                  <FiCheck className="text-emerald-600 text-3xl relative z-10" />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">¡Colaborador Registrado!</h2>
                <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Sincronizando con la nómina...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">

                  {/* Identidad */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 px-1">
                      <FiShield className="text-indigo-500" size={14} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad Personal</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Nombres *" error={errors.first_name}>
                        <input id="first_name" type="text" name="first_name" value={values.first_name} onChange={handleChange} className={inputClass(!!errors.first_name)} />
                      </FormField>
                      <FormField label="Apellidos *" error={errors.last_name}>
                        <input id="last_name" type="text" name="last_name" value={values.last_name} onChange={handleChange} className={inputClass(!!errors.last_name)} />
                      </FormField>
                    </div>

                    <FormField label="Documento *" error={errors.identificacion}>
                      <div className="relative">
                        <FiCreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        <input id="identificacion" type="text" name="identificacion" value={values.identificacion} onChange={handleChange} placeholder="Número de identificación" className={inputClass(!!errors.identificacion, "pl-12 pr-5")} />
                      </div>
                    </FormField>

                    <FormField label="Teléfono">
                      <div className="relative">
                        <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        <input id="telefono" type="tel" name="telefono" value={values.telefono} onChange={handleChange} className={inputClass(false, "pl-12 pr-5")} />
                      </div>
                    </FormField>

                    <FormField label="Dirección">
                      <div className="relative">
                        <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        <input id="direccion" type="text" name="direccion" value={values.direccion} onChange={handleChange} className={inputClass(false, "pl-12 pr-5")} />
                      </div>
                    </FormField>
                  </div>

                  {/* Credenciales */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 px-1">
                      <FiLock className="text-indigo-500" size={14} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credenciales de Acceso</span>
                    </div>

                    <FormField label="Usuario (Login) *" error={errors.username}>
                      <input id="username" type="text" name="username" value={values.username} onChange={handleChange} placeholder="Nombre de usuario único" autoComplete="off" className={inputClass(!!errors.username)} />
                    </FormField>

                    <FormField label="Contraseña *" error={errors.password}>
                      <input id="password" type="password" name="password" value={values.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" autoComplete="new-password" className={inputClass(!!errors.password)} />
                    </FormField>

                    <div className="mt-4 p-5 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-relaxed">
                        El usuario y contraseña serán las credenciales que el colaborador usará para ingresar al sistema. Asegúrese de comunicarlas de forma segura.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto md:pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-4xl mx-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto md:px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 order-1 md:order-2"
                    >
                      {isSubmitting ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Guardando...</>
                      ) : (
                        <><FiSave size={16} />Registrar Colaborador</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/trabajadores")}
                      className="w-full md:w-auto px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

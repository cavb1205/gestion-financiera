// app/dashboard/clientes/crear/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiHome,
  FiPhone,
  FiArrowLeft,
  FiSave,
  FiCheck,
  FiX,
  FiMapPin,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function CrearCliente() {
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    identificacion: "",
    nombres: "",
    apellidos: "",
    nombre_local: "",
    telefono_principal: "",
    direccion: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (submitError) setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "identificacion",
      "nombres",
      "apellidos",
      "telefono_principal",
      "direccion",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = "Este campo es obligatorio";
      }
    });

    // Validación adicional para teléfono
    if (
      formData.telefono_principal &&
      !/^(\+\d{1,3})?\s?\d{6,15}$/.test(formData.telefono_principal)
    ) {
      newErrors.telefono_principal = "Teléfono no válido";
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
      // URL CORREGIDA: sin /create/t/ en la ruta
      const response = await apiFetch(
        `/clientes/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            tienda: selectedStore.tienda.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const backendErrors = {};
        let globalError = "Por favor revise los errores en el formulario";

        Object.keys(errorData).forEach((field) => {
          let errorMessage = Array.isArray(errorData[field])
            ? errorData[field].join(", ")
            : errorData[field];

          if (field === 'identificacion' &&
            (errorMessage.includes('unique') || errorMessage.includes('exists') || errorMessage.includes('ya existe'))) {
            errorMessage = "Ya existe un cliente con esta identificación.";
            globalError = "No se pudo crear el cliente: La identificación ya está registrada.";
          }

          backendErrors[field] = errorMessage;
        });

        setErrors(backendErrors);
        throw new Error(globalError);
      }

      // Éxito
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/clientes"), 1500);
    } catch (err) {
      setSubmitError(err.message || "Error al crear el cliente");
      console.error("Error creating client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-6">
      <div className="max-w-md mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button
            onClick={() => router.push("/dashboard/clientes")}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
              <FiUser className="text-white" size={16} />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Nuevo Cliente</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registro rápido</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-[2rem] overflow-hidden border-white/60 dark:border-slate-800">

          {success ? (
            <div className="py-20 text-center flex flex-col items-center px-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-[1.5rem] animate-ping opacity-20"></div>
                <FiCheck className="text-emerald-600 text-3xl relative z-10" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">¡Registro Exitoso!</h2>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Redirigiendo...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">

              {submitError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
                  <FiAlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">{submitError}</p>
                </div>
              )}

              {/* Documento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FiShield size={11} className="text-indigo-500" /> Documento *
                </label>
                <input
                  id="identificacion"
                  type="text"
                  name="identificacion"
                  value={formData.identificacion}
                  onChange={handleChange}
                  placeholder="Número de identificación"
                  className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.identificacion ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                />
                {errors.identificacion && <p className="text-[10px] text-rose-500 font-black">{errors.identificacion}</p>}
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombres *</label>
                  <input
                    id="nombres"
                    type="text"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.nombres ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                  />
                  {errors.nombres && <p className="text-[10px] text-rose-500 font-black">{errors.nombres}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apellidos *</label>
                  <input
                    id="apellidos"
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.apellidos ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                  />
                  {errors.apellidos && <p className="text-[10px] text-rose-500 font-black">{errors.apellidos}</p>}
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FiMapPin size={11} className="text-indigo-500" /> Dirección *
                </label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Barrio, calle, número de casa"
                  className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.direccion ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                />
                {errors.direccion && <p className="text-[10px] text-rose-500 font-black">{errors.direccion}</p>}
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FiPhone size={11} className="text-indigo-500" /> Teléfono *
                </label>
                <input
                  id="telefono_principal"
                  type="tel"
                  name="telefono_principal"
                  value={formData.telefono_principal}
                  onChange={handleChange}
                  placeholder="Número de teléfono"
                  className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.telefono_principal ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                />
                {errors.telefono_principal && <p className="text-[10px] text-rose-500 font-black">{errors.telefono_principal}</p>}
              </div>

              {/* Establecimiento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Establecimiento</label>
                <input
                  id="nombre_local"
                  type="text"
                  name="nombre_local"
                  value={formData.nombre_local}
                  onChange={handleChange}
                  placeholder="Nombre del negocio (opcional)"
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/clientes")}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FiSave size={14} /> Confirmar Registro</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [hasChanges, setHasChanges] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const handleDocBlur = async () => {
    const doc = formData.identificacion.trim();
    if (doc.length < 4) return;
    try {
      const res = await apiFetch(
        `/clientes/buscar-doc/${doc}/t/${selectedStore.tienda.id}/`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.found) setClienteEncontrado(data);
      }
    } catch (_) {}
  };

  const aplicarPreRelleno = () => {
    setFormData((prev) => ({
      ...prev,
      nombres: clienteEncontrado.nombres,
      apellidos: clienteEncontrado.apellidos,
      telefono_principal: clienteEncontrado.telefono_principal,
      direccion: clienteEncontrado.direccion,
      nombre_local: clienteEncontrado.nombre_local || "",
    }));
    setClienteEncontrado(null);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm("¿Descartar los cambios?")) return;
    router.push("/dashboard/clientes");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasChanges(true);

    if (name === "identificacion") setClienteEncontrado(null);

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
        // Si el cuerpo no es JSON (500, proxy caído), no fingir errores de campos
        const errorData = await response.json().catch(() => null);
        if (!errorData) throw new Error("Error de conexión con el servidor. Intenta de nuevo.");
        const backendErrors = {};
        let globalError = "Por favor revise los errores en el formulario";

        Object.keys(errorData).forEach((field) => {
          let errorMessage = Array.isArray(errorData[field])
            ? errorData[field].join(", ")
            : errorData[field];

          if (field === 'identificacion' &&
            (errorMessage.includes('unique') || errorMessage.includes('exists') || errorMessage.includes('ya existe'))) {
            errorMessage = "Este cliente ya está registrado en esta ruta.";
            globalError = "No se pudo crear el cliente: la identificación ya existe en esta ruta.";
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
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-0">

        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleCancel}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Nuevo Cliente</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Registro rápido</p>
          </div>
        </div>

        <div className="glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl">

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
            <form onSubmit={handleSubmit} className="p-6 md:p-10 pb-32 md:pb-10 space-y-6">

              {submitError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
                  <FiAlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">{submitError}</p>
                </div>
              )}

              {clienteEncontrado && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <FiUser className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                        Encontrado en tu ruta &ldquo;{clienteEncontrado.ruta_origen}&rdquo;
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-0.5">
                        {clienteEncontrado.nombres} {clienteEncontrado.apellidos}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={aplicarPreRelleno}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-amber-600 transition-colors"
                    >
                      Pre-rellenar
                    </button>
                    <button
                      type="button"
                      onClick={() => setClienteEncontrado(null)}
                      className="p-1.5 text-amber-400 hover:text-amber-600 transition-colors"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {/* Identidad */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <FiShield className="text-indigo-500" size={14} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documento *</label>
                    <input
                      id="identificacion"
                      type="text"
                      name="identificacion"
                      value={formData.identificacion}
                      onChange={handleChange}
                      onBlur={handleDocBlur}
                      placeholder="Número de identificación"
                      className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border ${errors.identificacion ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                    />
                    {errors.identificacion && <p className="text-[10px] text-rose-500 font-black">{errors.identificacion}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombres *</label>
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellidos *</label>
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
                </div>

                {/* Contacto */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <FiHome className="text-indigo-500" size={14} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Establecimiento</label>
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
                </div>
              </div>

              {/* Sticky Mobile Action Bar */}
              <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto md:pt-6">
                <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-4xl mx-auto">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto md:px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 order-1 md:order-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><FiSave size={16} /> Confirmar Registro</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full md:w-auto px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

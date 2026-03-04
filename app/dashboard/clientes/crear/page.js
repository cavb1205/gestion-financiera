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
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function CrearCliente() {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    identificacion: "",
    nombres: "",
    apellidos: "",
    nombre_local: "",
    telefono_principal: "",
    telefono_opcional: "",
    direccion: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [corsError, setCorsError] = useState(false);

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

    if (corsError) setCorsError(false);
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
    setCorsError(false);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // URL CORREGIDA: sin /create/t/ en la ruta
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            tienda: selectedStore.tienda.id,
          }),
        }
      );

      if (!response.ok) {
        // Manejo mejorado de errores del backend
        const errorData = await response.json();

        // Mapear errores del backend a campos específicos
        const backendErrors = {};
        Object.keys(errorData).forEach((field) => {
          let errorMessage = Array.isArray(errorData[field])
            ? errorData[field].join(", ")
            : errorData[field];
            
          // Mejorar mensaje para error de identificación duplicada
          if (field === 'identificacion' && 
             (errorMessage.includes('unique') || errorMessage.includes('exists') || errorMessage.includes('ya existe'))) {
            errorMessage = "Ya existe un cliente registrado con esta identificación. Por favor verifique el número o busque el cliente en la lista.";
            
            // También mostrar un mensaje global para que sea más evidente
            setSubmitError("No se pudo crear el cliente: La identificación ya está registrada.");
          }
          
          backendErrors[field] = errorMessage;
        });

        setErrors(backendErrors);
        if (!submitError) { // Solo lanzar error genérico si no pusimos uno específico
             throw new Error("Por favor revise los errores en el formulario");
        }
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
            onClick={() => router.push("/dashboard/clientes")}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Nuevo Registro</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Apertura de Cuenta Cliente</p>
          </div>
        </div>

        <div className="glass rounded-[2rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl relative">
          {/* Header decoration - simplified for mobile */}
          <div className="hidden md:block bg-slate-900 dark:bg-indigo-600 p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-5">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                 <FiUser className="text-3xl text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-1">Formulario de Ingreso</p>
                <h2 className="text-2xl font-black tracking-tight">Expediente de Cliente</h2>
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
                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">¡Registro Exitoso!</h2>
                <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Sincronizando con la red...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                       <FiShield className="text-indigo-500" size={14} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documento *</label>
                        <input
                          type="text"
                          name="identificacion"
                          value={formData.identificacion}
                          onChange={handleChange}
                          placeholder="Número de identificación"
                          className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.identificacion ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                        />
                        {errors.identificacion && <p className="text-[9px] text-rose-500 font-black uppercase tracking-tight ml-1">{errors.identificacion}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombres *</label>
                          <input
                            type="text"
                            name="nombres"
                            value={formData.nombres}
                            onChange={handleChange}
                            className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.nombres ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellidos *</label>
                          <input
                            type="text"
                            name="apellidos"
                            value={formData.apellidos}
                            onChange={handleChange}
                            className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.apellidos ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                       <FiHome className="text-indigo-500" size={14} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto & Local</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Establecimiento</label>
                        <input
                          type="text"
                          name="nombre_local"
                          value={formData.nombre_local}
                          onChange={handleChange}
                          placeholder="Nombre del local"
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono *</label>
                          <input
                            type="tel"
                            name="telefono_principal"
                            value={formData.telefono_principal}
                            onChange={handleChange}
                            className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.telefono_principal ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white transition-all outline-none`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Opcional</label>
                          <input
                            type="tel"
                            name="telefono_opcional"
                            value={formData.telefono_opcional}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección Exacta</label>
                        <input
                          type="text"
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleChange}
                          className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.direccion ? 'border-rose-400' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white transition-all outline-none`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button - Sticky Mobile */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto md:pt-8 md:mt-8">
                  <div className="flex flex-col md:flex-row items-center justify-end gap-3 max-w-4xl mx-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto md:px-12 py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 order-1 md:order-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FiSave size={18} />
                          Confirmar Registro
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/clientes")}
                      className="w-full md:w-auto px-8 py-4.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
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

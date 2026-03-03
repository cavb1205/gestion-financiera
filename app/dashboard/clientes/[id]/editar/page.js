// app/dashboard/clientes/[id]/editar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  FiEdit,
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import LoadingSpinner from "../../../../components/LoadingSpinner";

export default function EditarCliente() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    identificacion: "",
    nombres: "",
    apellidos: "",
    nombre_local: "",
    telefono_principal: "",
    telefono_opcional: "",
    direccion: "",
    estado_cliente: "Activo",
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clienteData, setClienteData] = useState(null);

  // Cargar datos del cliente al montar el componente
  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchClienteData();
    }
  }, [loading, isAuthenticated, selectedStore]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchClienteData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la información del cliente");
      }

      const data = await response.json();
      setClienteData(data);
      
      // Llenar el formulario con los datos del cliente
      setFormData({
        identificacion: data.identificacion || "",
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        nombre_local: data.nombre_local || "",
        telefono_principal: data.telefono_principal || "",
        telefono_opcional: data.telefono_opcional || "",
        direccion: data.direccion || "",
        estado_cliente: data.estado_cliente || "Activo",
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching client data:", error);
      setSubmitError(error.message);
      setIsLoading(false);
    }
  };

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/${clienteId}/update/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            tienda: selectedStore.tienda.id, // Asegurarse de enviar la tienda correcta
          }),
        }
      );

      if (!response.ok) {
        // Manejo mejorado de errores del backend
        const errorData = await response.json();
        
        // Mapear errores del backend a campos específicos
        const backendErrors = {};
        Object.keys(errorData).forEach((field) => {
          backendErrors[field] = Array.isArray(errorData[field])
            ? errorData[field].join(", ")
            : errorData[field];
        });

        setErrors(backendErrors);
        throw new Error("Error en la validación del servidor");
      }

      // Éxito
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/clientes"), 1500);
    } catch (err) {
      setSubmitError(err.message || "Error al actualizar el cliente");
      console.error("Error updating client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.push("/dashboard/clientes")}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Editar Expediente</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-tight">Actualización de Registro Maestro</p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="bg-slate-900 dark:bg-indigo-600 p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-5">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                 <FiEdit className="text-3xl text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-1">Modificación de Datos</p>
                <h2 className="text-2xl font-black tracking-tight">{formData.nombres} {formData.apellidos}</h2>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="p-8 md:p-12 bg-white/40 dark:bg-transparent">
            {submitError && (
              <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-4">
                <div className="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-lg">
                   <FiX className="text-rose-600" />
                </div>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{submitError}</p>
              </div>
            )}

            {success ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-8 relative">
                   <div className="absolute inset-0 bg-emerald-400 rounded-[2rem] animate-ping opacity-20"></div>
                   <FiCheck className="text-emerald-600 text-4xl relative z-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                  ¡Actualización Exitosa!
                </h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  Guardando cambios en el servidor central...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {/* Sección Personal */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                       <FiShield className="text-indigo-500" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Datos de Identidad</span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificación</label>
                        <input
                          type="text"
                          name="identificacion"
                          value={formData.identificacion}
                          onChange={handleChange}
                          className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.identificacion ? 'border-rose-300' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombres</label>
                          <input
                            type="text"
                            name="nombres"
                            value={formData.nombres}
                            onChange={handleChange}
                            className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.nombres ? 'border-rose-300' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellidos</label>
                          <input
                            type="text"
                            name="apellidos"
                            value={formData.apellidos}
                            onChange={handleChange}
                            className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.apellidos ? 'border-rose-300' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 tracking-widest">Estado Operacional</label>
                        <select
                          name="estado_cliente"
                          value={formData.estado_cliente}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                        >
                          <option value="Activo">Activo ✅</option>
                          <option value="Inactivo">Inactivo ❌</option>
                          <option value="Bloqueado">Bloqueado 🚫</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sección Ubicación/Negocio */}
                  <div className="space-y-8">
                     <div className="flex items-center gap-3 mb-2">
                       <FiHome className="text-indigo-500" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Negocio y Contacto</span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Establecimiento</label>
                        <input
                          type="text"
                          name="nombre_local"
                          value={formData.nombre_local}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono Principal</label>
                        <input
                          type="tel"
                          name="telefono_principal"
                          value={formData.telefono_principal}
                          onChange={handleChange}
                          className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.telefono_principal ? 'border-rose-300' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección Exacta</label>
                        <input
                          type="text"
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleChange}
                          className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.direccion ? 'border-rose-300' : 'border-slate-100 dark:border-slate-700'} rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/clientes")}
                    className="px-10 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Descartar Cambios
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FiSave size={18} />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
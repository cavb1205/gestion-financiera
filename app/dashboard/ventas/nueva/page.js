// app/dashboard/ventas/nueva/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiPercent,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiSearch,
  FiShield,
  FiActivity,
  FiArrowUpRight,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

function NuevaVentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");
  
  const { token, selectedStore, isAuthenticated, loading } = useAuth();

  const [formData, setFormData] = useState({
    fecha_venta: new Date(),
    valor_venta: "",
    interes: 20,
    cuotas: 20,
    comentario: "",
    cliente: "",
  });

  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchClientes();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/activos/t/${selectedStore.tienda.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("No se pudieron cargar los clientes");

      const data = await response.json();
      setClientes(data);
      
      if (clienteIdParam) {
        const found = data.find(c => c.id.toString() === clienteIdParam);
        if (found) {
          setFormData(prev => ({ ...prev, cliente: found.id }));
          setClienteSeleccionado(found);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const filtrarClientes = (busqueda) => {
    setBusquedaCliente(busqueda);
    if (!busqueda.trim()) {
      setClientesFiltrados([]);
      return;
    }

    const filtrados = clientes.filter(
      (cliente) =>
        `${cliente.nombres} ${cliente.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.identificacion.toLowerCase().includes(busqueda.toLowerCase())
    );
    setClientesFiltrados(filtrados);
  };

  const seleccionarCliente = (cliente) => {
    setFormData({ ...formData, cliente: cliente.id });
    setClienteSeleccionado(cliente);
    setBusquedaCliente("");
    setClientesFiltrados([]);
  };

  const calcularTotalAPagar = () => {
    const valorVenta = parseFloat(formData.valor_venta) || 0;
    const interesDecimal = parseFloat(formData.interes) / 100;
    return valorVenta * (1 + interesDecimal);
  };

  const calcularValorCuota = () => {
    const totalAPagar = calcularTotalAPagar();
    return totalAPagar / parseInt(formData.cuotas || 1);
  };

  const formatDateToLocalISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!formData.cliente) {
      toast.error("Debe seleccionar un cliente");
      setIsSubmitting(false);
      return;
    }

    try {
      const ventaData = {
        fecha_venta: formatDateToLocalISO(formData.fecha_venta),
        valor_venta: parseFloat(formData.valor_venta),
        interes: parseFloat(formData.interes),
        cuotas: parseInt(formData.cuotas),
        comentario: formData.comentario,
        cliente: formData.cliente,
        id_tienda: selectedStore.tienda.id,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ventaData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la venta");
      }

      const result = await response.json();
      toast.success("¡Venta activada correctamente!");
      router.push(`/dashboard/ventas/${result.id}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header section with context */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.back()}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Nueva Operación</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Apertura de Créditos • <span className="text-indigo-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
             <FiShield className="text-rose-600" />
             <p className="text-rose-700 dark:text-rose-400 text-sm font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form Area */}
          <div className="lg:col-span-12">
            <div className="glass p-8 md:p-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
                
                {/* Left Column: Client & Core Terms */}
                <div className="space-y-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2 px-1">
                       <FiUser className="text-indigo-500" />
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Procedencia & Titularidad</span>
                    </div>

                    <div className="space-y-4">
                      {clienteSeleccionado ? (
                        <div className="bg-slate-900 dark:bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200 dark:shadow-none">
                          <div className="relative z-10 flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Cliente Vinculado</p>
                              <h3 className="text-xl font-black tracking-tight leading-tight">{clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}</h3>
                              <div className="flex items-center gap-3 text-white/80 mt-2">
                                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">{clienteSeleccionado.identificacion}</span>
                                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-lg truncate max-w-[150px]">{clienteSeleccionado.nombre_local}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setFormData({ ...formData, cliente: "" }); setClienteSeleccionado(null); }}
                              className="p-3 bg-white/10 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                            >
                              <FiAlertCircle size={20} />
                            </button>
                          </div>
                          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Buscar cliente por nombre o identificación..."
                            autoComplete="off"
                            className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl text-[15px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                            value={busquedaCliente}
                            onChange={(e) => filtrarClientes(e.target.value)}
                          />
                          {clientesFiltrados.length > 0 && (
                            <div className="absolute z-20 w-full mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden p-3 animate-in slide-in-from-top-2 duration-300">
                              {clientesFiltrados.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  className="w-full text-left p-5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border-b border-slate-50 dark:border-slate-800 last:border-0 group"
                                  onClick={() => seleccionarCliente(c)}
                                >
                                  <div className="font-black text-slate-800 dark:text-white text-sm group-hover:text-indigo-600">{c.nombres} {c.apellidos}</div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 group-hover:text-slate-500">{c.identificacion} · <span className="text-slate-300 dark:text-slate-600">{c.nombre_local}</span></div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2 px-1">
                       <FiCalendar className="text-indigo-500" />
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Temporización Operativa</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Fecha de Venta *</label>
                        <div className="relative group custom-datepicker">
                          <DatePicker
                            selected={formData.fecha_venta}
                            onChange={(date) => setFormData({ ...formData, fecha_venta: date })}
                            className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                            dateFormat="dd 'de' MMMM, yyyy"
                          />
                          <FiCalendar size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Notas Rápidas</label>
                        <textarea
                          value={formData.comentario}
                          onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                          className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner resize-none h-[58px]"
                          placeholder="Obs..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Financial Parameters & Projections */}
                <div className="space-y-10">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-2 px-1">
                         <FiDollarSign className="text-indigo-500" />
                         <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Parámetros Financieros</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Capital de Giro (Monto) *</label>
                            <div className="relative group">
                              <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                              <input
                                type="number"
                                value={formData.valor_venta}
                                onChange={(e) => setFormData({ ...formData, valor_venta: e.target.value })}
                                onWheel={(e) => e.target.blur()}
                                placeholder="0"
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl text-[20px] font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                              />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Costo Crédito (Int. %)</label>
                            <div className="relative group">
                              <FiPercent className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                              <input
                                type="number"
                                value={formData.interes}
                                onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
                                onWheel={(e) => e.target.blur()}
                                className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                              />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Total Cuotas</label>
                            <div className="relative group">
                              <FiActivity className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                              <input
                                type="number"
                                value={formData.cuotas}
                                onChange={(e) => setFormData({ ...formData, cuotas: e.target.value })}
                                onWheel={(e) => e.target.blur()}
                                className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                              />
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Proyectos Card */}
                   <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden">
                      <div className="relative z-10 space-y-4">
                         <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Proyectado</p>
                               <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{formatMoney(calcularTotalAPagar())}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Cuota</p>
                               <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{formatMoney(calcularValorCuota())}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 text-slate-400">
                            <FiInfo size={16} className="shrink-0" />
                            <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tight">
                               Cálculo basado en sistema de amortización simple por un periodo de {formData.cuotas} cuotas fijas.
                            </p>
                         </div>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
                   </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="mt-16 pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-end gap-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full md:w-auto px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Descartar Operación
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto flex items-center justify-center gap-4 px-16 py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FiSave size={20} />
                      Activar Crédito
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </form>

        {/* Global Hints */}
        <div className="mt-8 flex flex-col md:flex-row gap-6">
           <div className="flex-1 glass p-6 rounded-[2rem] flex items-center gap-4 border-white/60 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                 <FiCheckCircle size={22} />
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-relaxed">
                 Esta operación se activará inmediatamente en el estado <span className="text-emerald-500">Vigente</span> una vez sea confirmada.
              </p>
           </div>
           <div className="flex-1 glass p-6 rounded-[2rem] flex items-center gap-4 border-white/60 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
                 <FiArrowUpRight size={22} />
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-relaxed">
                 Las cuotas se generarán de forma automática siguiendo la periodicidad configurada en el perfil del cliente.
              </p>
           </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-datepicker .react-datepicker-wrapper { width: 100%; }
        .react-datepicker {
          font-family: inherit;
          border-radius: 2rem;
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          padding: 1.5rem;
          margin-top: 10px;
        }
        .dark .react-datepicker {
          background: rgba(15, 23, 42, 0.95);
          border-color: rgba(30, 41, 59, 0.8);
          color: white;
        }
        .react-datepicker__header {
          background: transparent;
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
          padding-bottom: 1rem;
        }
        .dark .react-datepicker__header {
          border-color: rgba(30, 41, 59, 0.4);
        }
        .react-datepicker__current-month {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          color: #4f46e5;
        }
        .react-datepicker__day--selected {
          background-color: #4f46e5 !important;
          border-radius: 12px;
          color: white !important;
        }
        .react-datepicker__day {
          transition: all 0.2s;
          border-radius: 10px;
          padding: 0.2rem;
        }
        .react-datepicker__day:hover {
          background-color: #f1f5f9;
        }
        .dark .react-datepicker__day:hover {
          background-color: #1e293b;
        }
        .dark .react-datepicker__day {
          color: #94a3b8;
        }
        .dark .react-datepicker__day-name {
          color: #475569;
        }
      `}</style>
    </div>
  );
}

export default function NuevaVentaPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NuevaVentaContent />
    </Suspense>
  );
}

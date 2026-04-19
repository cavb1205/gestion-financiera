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
  FiArrowRight,
  FiXCircle,
  FiPlus,
  FiX,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { formatMoney, calcularTotal, calcularCuota } from "../../../utils/format";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

function NuevaVentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");
  
  const { selectedStore, isAuthenticated, loading, user } = useAuth();
  const isWorker = !(user?.is_staff || user?.is_superuser);

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
  const [creditosActivosCliente, setCreditosActivosCliente] = useState(0);

  // Create client inline
  const [showCrearCliente, setShowCrearCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    identificacion: "", nombres: "", apellidos: "",
    nombre_local: "", telefono_principal: "", telefono_opcional: "", direccion: "",
  });
  const [erroresCliente, setErroresCliente] = useState({});
  const [creandoCliente, setCreandoCliente] = useState(false);

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
      const response = await apiFetch(
        `/clientes/activos/t/${selectedStore.tienda.id}/`
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

  const seleccionarCliente = async (cliente) => {
    setFormData({ ...formData, cliente: cliente.id });
    setClienteSeleccionado(cliente);
    setBusquedaCliente("");
    setClientesFiltrados([]);
    setCreditosActivosCliente(0);
    try {
      const res = await apiFetch(`/ventas/activas/${cliente.id}/t/${selectedStore.tienda.id}/`);
      if (res.ok) {
        const data = await res.json();
        setCreditosActivosCliente(Array.isArray(data) ? data.filter(v => ["Vigente","Atrasado","Vencido"].includes(v.estado_venta)).length : 0);
      }
    } catch { /* silencioso */ }
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    const requeridos = ["identificacion", "nombres", "apellidos", "telefono_principal", "direccion"];
    const errs = {};
    requeridos.forEach((f) => { if (!nuevoCliente[f].trim()) errs[f] = "Requerido"; });
    if (Object.keys(errs).length) { setErroresCliente(errs); return; }

    setCreandoCliente(true);
    try {
      const res = await apiFetch(`/clientes/create/t/${selectedStore.tienda.id}/`, {
        method: "POST",
        body: JSON.stringify({ ...nuevoCliente, tienda: selectedStore.tienda.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        const errsBack = {};
        Object.keys(data).forEach((k) => { errsBack[k] = Array.isArray(data[k]) ? data[k].join(" ") : data[k]; });
        setErroresCliente(errsBack);
        return;
      }
      const creado = await res.json();
      setClientes((prev) => [...prev, creado]);
      seleccionarCliente(creado);
      setShowCrearCliente(false);
      setNuevoCliente({ identificacion: "", nombres: "", apellidos: "", nombre_local: "", telefono_principal: "", telefono_opcional: "", direccion: "" });
      setErroresCliente({});
      toast.success("Cliente creado y seleccionado");
    } catch {
      toast.error("Error al crear el cliente");
    } finally {
      setCreandoCliente(false);
    }
  };

  const calcularTotalAPagar = () => {
    return calcularTotal(formData.valor_venta, formData.interes);
  };

  const calcularValorCuota = () => {
    return calcularCuota(calcularTotalAPagar(), formData.cuotas);
  };

  const formatDateToLocalISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

    const capital = parseFloat(formData.valor_venta);
    const cuotas = parseInt(formData.cuotas);
    const interes = parseFloat(formData.interes);

    if (isNaN(capital) || capital <= 0) {
      toast.error("El capital debe ser mayor a cero");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(cuotas) || cuotas < 1 || cuotas > 120) {
      toast.error("Las cuotas deben estar entre 1 y 120");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(interes) || interes < 0 || interes > 100) {
      toast.error("El interés debe estar entre 0% y 100%");
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

      const response = await apiFetch(
        `/ventas/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
          body: JSON.stringify(ventaData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear la venta");
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
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        
        {/* Compact Mobile Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Nueva Operación</h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
               Apertura de Créditos • <span className="text-indigo-500">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
             <FiShield className="text-rose-600 shrink-0" />
             <p className="text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
            <div className="glass p-8 md:p-12 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 pb-28 md:pb-0">
                {/* Left Column: Client & Core Terms */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                       <FiUser className="text-indigo-500" size={14} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular</span>
                    </div>

                    <div className="space-y-4">
                      {clienteSeleccionado ? (
                        <div className="bg-slate-900 dark:bg-indigo-600 rounded-[1.5rem] p-6 text-white relative overflow-hidden group shadow-xl">
                          <div className="relative z-10 flex justify-between items-center">
                            <div className="min-w-0">
                              <h3 className="text-lg font-black tracking-tight leading-tight truncate">{clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}</h3>
                              <p className="text-[10px] font-bold text-white/60 uppercase mt-1">{clienteSeleccionado.identificacion}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setFormData({ ...formData, cliente: "" }); setClienteSeleccionado(null); setCreditosActivosCliente(0); }}
                              className="p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition-all shrink-0"
                            >
                              <FiXCircle size={18} />
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {clienteSeleccionado && creditosActivosCliente > 0 && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl">
                          <FiAlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                          <div>
                            <p className="text-xs font-black text-amber-700 dark:text-amber-400 leading-snug">
                              Este cliente ya tiene {creditosActivosCliente} crédito{creditosActivosCliente > 1 ? "s" : ""} activo{creditosActivosCliente > 1 ? "s" : ""}
                            </p>
                            <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 mt-0.5 uppercase tracking-wider">
                              Puedes continuar — el sistema permite múltiples créditos
                            </p>
                          </div>
                        </div>
                      )}

                      {!clienteSeleccionado && (
                        <div className="relative group">
                          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Buscar cliente..."
                            autoComplete="off"
                            className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            value={busquedaCliente}
                            onChange={(e) => filtrarClientes(e.target.value)}
                          />
                          {busquedaCliente.trim().length > 0 && (
                            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-2">
                              {clientesFiltrados.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border-b border-slate-50 dark:border-slate-800 last:border-0 group flex items-center justify-between"
                                  onClick={() => seleccionarCliente(c)}
                                >
                                  <div className="min-w-0">
                                    <div className="font-black text-slate-800 dark:text-white text-[13px] truncate">{c.nombres} {c.apellidos}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.identificacion}</div>
                                  </div>
                                  <FiArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => { setShowCrearCliente(true); setBusquedaCliente(""); setClientesFiltrados([]); }}
                                className="w-full flex items-center gap-3 p-4 mt-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all group border-t border-slate-100 dark:border-slate-800"
                              >
                                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                                  <FiPlus size={14} className="text-white" />
                                </div>
                                <div className="text-left min-w-0">
                                  <div className="text-[12px] font-black text-indigo-600 dark:text-indigo-400">Crear nuevo cliente</div>
                                  {clientesFiltrados.length === 0 && (
                                    <div className="text-[10px] font-bold text-slate-400">No se encontró &quot;{busquedaCliente}&quot;</div>
                                  )}
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capital — visible en móvil en la columna izquierda (order-last en lg) */}
                  <div className="space-y-4 lg:hidden">
                    <div className="flex items-center gap-2 px-1">
                       <FiDollarSign className="text-indigo-500" size={14} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión (Capital)</span>
                    </div>
                    <div className="relative group">
                      <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 transition-colors pointer-events-none" size={24} />
                      <input
                        type="number"
                        value={formData.valor_venta}
                        onChange={(e) => setFormData({ ...formData, valor_venta: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0"
                        className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Fecha */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                         <FiCalendar className="text-indigo-500" size={14} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                      </div>
                      {isWorker ? (
                        <div className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                          <span className="text-[13px] font-black text-slate-800 dark:text-white">
                            {formData.fecha_venta instanceof Date
                              ? `${String(formData.fecha_venta.getDate()).padStart(2,'0')}/${String(formData.fecha_venta.getMonth()+1).padStart(2,'0')}/${formData.fecha_venta.getFullYear()}`
                              : ""}
                          </span>
                          <FiCalendar className="text-slate-400" size={14} />
                        </div>
                      ) : (
                        <div className="relative group custom-datepicker">
                          <DatePicker
                            selected={formData.fecha_venta}
                            onChange={(date) => setFormData({ ...formData, fecha_venta: date })}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white transition-all outline-none"
                            dateFormat="dd/MM/yyyy"
                          />
                        </div>
                      )}
                    </div>
                    {/* Cuotas */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                         <FiActivity className="text-indigo-500" size={14} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuotas</span>
                      </div>
                      <input
                        type="number"
                        value={formData.cuotas}
                        onChange={(e) => setFormData({ ...formData, cuotas: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                    {/* Interés % — visible en móvil dentro de la columna izquierda */}
                    <div className="space-y-4 lg:hidden">
                      <div className="flex items-center gap-2 px-1">
                         <FiPercent className="text-indigo-500" size={14} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interés %</span>
                      </div>
                      {isWorker ? (
                        <div className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                          <span className="text-[13px] font-black text-slate-800 dark:text-white">{formData.interes}%</span>
                          <FiPercent className="text-slate-400" size={14} />
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={formData.interes}
                          onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        />
                      )}
                    </div>
                    {/* Nota — visible en móvil dentro de la columna izquierda */}
                    <div className="space-y-4 lg:hidden">
                      <div className="flex items-center gap-2 px-1">
                         <FiInfo className="text-indigo-500" size={14} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota</span>
                      </div>
                      <input
                        type="text"
                        value={formData.comentario}
                        onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                        placeholder="Ob..."
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Financial Parameters — solo visible en desktop (lg+) */}
                <div className="hidden lg:block space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                       <FiDollarSign className="text-indigo-500" size={14} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión (Capital)</span>
                    </div>
                    <div className="relative group">
                      <FiDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 transition-colors pointer-events-none" size={24} />
                      <input
                        type="number"
                        value={formData.valor_venta}
                        onChange={(e) => setFormData({ ...formData, valor_venta: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0"
                        className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                           <FiPercent className="text-indigo-500" size={14} />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interés %</span>
                        </div>
                        {isWorker ? (
                          <div className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                            <span className="text-[13px] font-black text-slate-800 dark:text-white">{formData.interes}%</span>
                            <FiPercent className="text-slate-400" size={14} />
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={formData.interes}
                            onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                          />
                        )}
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                           <FiInfo className="text-indigo-500" size={14} />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota</span>
                        </div>
                        <input
                          type="text"
                          value={formData.comentario}
                          onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                          placeholder="Ob..."
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        />
                     </div>
                  </div>
                </div>
              </div>

              {/* Action Button - Sticky Mobile */}
              <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-[100] md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:backdrop-blur-none md:z-auto mt-0 md:mt-10">
                <div className="flex flex-col md:flex-row items-center gap-3 max-w-7xl mx-auto">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.cliente || !formData.valor_venta}
                    className="w-full md:flex-[2] py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-3 order-1 md:order-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FiCheckCircle size={18} />
                        Activar Crédito
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full md:flex-1 py-4.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all order-2 md:order-1"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area - Moved after form on mobile */}
          <div className="xl:col-span-4 space-y-6">
            <div className="glass p-8 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl relative overflow-hidden group">
               <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Proyección Financiera</h4>
               
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                     <div className="min-w-0">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Total a Recaudar</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter truncate">
                           {formatMoney(calcularTotalAPagar())}
                        </p>
                     </div>
                     <FiArrowUpRight size={24} className="text-indigo-300 shrink-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Vlr. Cuota</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{formatMoney(calcularValorCuota())}</p>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Interés</p>
                        <p className="text-sm font-black text-emerald-500">{formData.interes}%</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-3 opacity-60">
                     <FiInfo size={14} className="text-slate-400 mt-0.5 shrink-0" />
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Sistema de amortización simple por un periodo de {formData.cuotas} cuotas fijas.
                     </p>
                  </div>
               </div>
               <FiActivity className="absolute -right-6 -bottom-6 text-indigo-500/5 opacity-30 group-hover:scale-110 transition-transform" size={120} />
            </div>

            <div className="px-4 space-y-4">
               <div className="flex items-start gap-3 opacity-40">
                  <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     Esta operación se activará en estado Vigente inmediatamente.
                  </p>
               </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* ── Modal Crear Cliente ── */}
      {showCrearCliente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowCrearCliente(false)} />
          <div className="relative w-full max-w-md glass rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <FiPlus className="text-white" size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Nuevo Cliente</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registro rápido</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCrearCliente(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearCliente} className="p-7 space-y-4">
              {/* Identificación */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FiShield size={11} className="text-indigo-500" /> Documento *
                </label>
                <input
                  type="text"
                  value={nuevoCliente.identificacion}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, identificacion: e.target.value }))}
                  placeholder="Número de identificación"
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${erroresCliente.identificacion ? "border-rose-400" : "border-slate-100 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                />
                {erroresCliente.identificacion && <p className="text-[10px] text-rose-500 font-black">{erroresCliente.identificacion}</p>}
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombres *</label>
                  <input
                    type="text"
                    value={nuevoCliente.nombres}
                    onChange={(e) => setNuevoCliente((p) => ({ ...p, nombres: e.target.value }))}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${erroresCliente.nombres ? "border-rose-400" : "border-slate-100 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                  />
                  {erroresCliente.nombres && <p className="text-[10px] text-rose-500 font-black">{erroresCliente.nombres}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apellidos *</label>
                  <input
                    type="text"
                    value={nuevoCliente.apellidos}
                    onChange={(e) => setNuevoCliente((p) => ({ ...p, apellidos: e.target.value }))}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${erroresCliente.apellidos ? "border-rose-400" : "border-slate-100 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                  />
                  {erroresCliente.apellidos && <p className="text-[10px] text-rose-500 font-black">{erroresCliente.apellidos}</p>}
                </div>
              </div>

              {/* Teléfono + Opcional */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <FiPhone size={11} className="text-indigo-500" /> Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={nuevoCliente.telefono_principal}
                    onChange={(e) => setNuevoCliente((p) => ({ ...p, telefono_principal: e.target.value }))}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${erroresCliente.telefono_principal ? "border-rose-400" : "border-slate-100 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                  />
                  {erroresCliente.telefono_principal && <p className="text-[10px] text-rose-500 font-black">{erroresCliente.telefono_principal}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alternativo</label>
                  <input
                    type="tel"
                    value={nuevoCliente.telefono_opcional}
                    onChange={(e) => setNuevoCliente((p) => ({ ...p, telefono_opcional: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FiMapPin size={11} className="text-indigo-500" /> Dirección *
                </label>
                <input
                  type="text"
                  value={nuevoCliente.direccion}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, direccion: e.target.value }))}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${erroresCliente.direccion ? "border-rose-400" : "border-slate-100 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                />
                {erroresCliente.direccion && <p className="text-[10px] text-rose-500 font-black">{erroresCliente.direccion}</p>}
              </div>

              {/* Nombre local (opcional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Establecimiento</label>
                <input
                  type="text"
                  value={nuevoCliente.nombre_local}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, nombre_local: e.target.value }))}
                  placeholder="Nombre del negocio (opcional)"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCrearCliente(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoCliente}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {creandoCliente ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FiCheckCircle size={14} /> Crear y Seleccionar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

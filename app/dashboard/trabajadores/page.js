"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch, getApiError } from "@/app/utils/api";
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiActivity,
  FiArrowRight,
  FiUserCheck,
  FiUserPlus,
  FiUserMinus,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { toast } from "react-toastify";

export default function TrabajadoresPage() {
  const { selectedStore, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [candidatos, setCandidatos] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const fetchTrabajadores = useCallback(async () => {
    if (!selectedStore?.tienda?.id) return;
    try {
      setLoading(true);
      const response = await apiFetch(
        `/trabajadores/t/${selectedStore.tienda.id}/`
      );
      if (response.ok) {
        const data = await response.json();
        setTrabajadores(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.tienda?.id]);

  useEffect(() => {
    fetchTrabajadores();
  }, [fetchTrabajadores]);

  const fetchCandidatos = async () => {
    if (!selectedStore?.tienda?.id) return;
    setLoadingCandidates(true);
    try {
      const response = await apiFetch(
        "/trabajadores/candidatos/t/" + selectedStore.tienda.id + "/"
      );
      if (!response.ok) {
        throw new Error(await getApiError(response, "No se pudieron cargar los trabajadores disponibles."));
      }
      const data = await response.json();
      setCandidatos(Array.isArray(data) ? data : []);
    } catch (error) {
      setCandidatos([]);
      console.error("Error al cargar candidatos:", error);
      toast.error(error.message || "No se pudieron cargar los trabajadores disponibles.");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const openAssignModal = () => {
    setShowAssignModal(true);
    fetchCandidatos();
  };

  const handleAssign = async (worker) => {
    if (!selectedStore?.tienda?.id || !worker?.id) return;
    setAssigningId(worker.id);
    try {
      const response = await apiFetch(
        "/trabajadores/" + worker.id + "/asignar/t/" + selectedStore.tienda.id + "/",
        { method: "POST" }
      );
      if (!response.ok) {
        throw new Error(await getApiError(response, "No se pudo asignar el trabajador."));
      }
      setCandidatos((current) => current.filter((item) => item.id !== worker.id));
      toast.success(`${worker.trabajador} fue asignado a esta ruta.`);
      await fetchTrabajadores();
    } catch (error) {
      console.error("Error al asignar trabajador:", error);
      toast.error(error.message || "No se pudo asignar el trabajador.");
    } finally {
      setAssigningId(null);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!removeTarget || !selectedStore?.tienda?.id) return;
    setRemoving(true);
    try {
      const response = await apiFetch(
        "/trabajadores/" + removeTarget.id + "/asignar/t/" + selectedStore.tienda.id + "/",
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error(await getApiError(response, "No se pudo retirar la asignación."));
      }
      setRemoveTarget(null);
      toast.success("Se retiró el acceso a esta ruta. La cuenta y sus otras rutas se conservan.");
      await fetchTrabajadores();
    } catch (error) {
      console.error("Error al retirar asignación:", error);
      toast.error(error.message || "No se pudo retirar la asignación.");
    } finally {
      setRemoving(false);
    }
  };

  const filteredTrabajadores = trabajadores.filter(
    (t) =>
      t.trabajador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.identificacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Auditando Nómina de Colaboradores</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-12">
      <div className="w-full">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Nómina de Personal</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Recurso Humano • <span className="text-slate-400">{selectedStore?.tienda?.nombre}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openAssignModal}
              className="flex items-center gap-2 px-4 py-3.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 rounded-2xl border border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-indigo-300 transition-all"
            >
              <FiUserPlus size={16} />
              <span className="hidden sm:inline">Asignar existente</span>
            </button>
            <button
              onClick={fetchTrabajadores}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
            >
              <FiRefreshCw size={18} />
            </button>
            <button
              onClick={() => router.push("/dashboard/trabajadores/crear")}
              className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
            >
              <FiPlus size={16} />
              <span className="hidden md:inline">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass rounded-[2rem] p-5 border-white/60 dark:border-slate-800 mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o identificación..."
                className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <FiUserCheck className="text-emerald-500" size={16} />
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{filteredTrabajadores.length}</span>
            </div>
          </div>
        </div>

        {/* Workers Grid */}
        {filteredTrabajadores.length === 0 ? (
          <div className="glass py-20 rounded-[3rem] border-white/60 dark:border-slate-800 text-center shadow-xl">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <FiUsers size={36} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
              {searchTerm ? "Sin coincidencias" : "Sin trabajadores"}
            </h3>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
              {searchTerm
                ? "Ningún colaborador coincide con tu búsqueda."
                : "Agrega tu primer trabajador para asignar rutas de cobro."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push("/dashboard/trabajadores/crear")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all"
              >
                Agregar Primer Trabajador
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrabajadores.map((trabajador) => (
              <div
                key={trabajador.id}
                className="glass rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="p-8 relative">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-slate-900 dark:bg-indigo-600 rounded-[1.1rem] flex items-center justify-center text-white font-black text-xl uppercase shadow-lg group-hover:scale-110 transition-transform">
                        {trabajador.trabajador.charAt(0)}
                      </div>
                      <span className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30">
                        Activo
                      </span>
                    </div>

                    <div className="space-y-0.5 mb-6">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight capitalize">
                        {trabajador.trabajador.toLowerCase()}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                        <FiActivity size={11} />
                        Colaborador Operativo
                      </div>
                    </div>

                    <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                          <FiCreditCard size={13} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{trabajador.identificacion}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                          <FiPhone size={13} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{trabajador.telefono || "Sin registro"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                          <FiMapPin size={13} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 truncate">{trabajador.direccion || "No registrada"}</span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID #{trabajador.id.toString().padStart(3, '0')}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(trabajador)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          aria-label={`Quitar ${trabajador.trabajador} de esta ruta`}
                        >
                          <FiUserMinus size={13} />
                          Quitar ruta
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/trabajadores/${trabajador.id}`)}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700"
                        >
                          Ver Detalle
                          <FiArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-worker-title"
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <h2 id="assign-worker-title" className="text-lg font-black text-slate-900 dark:text-white">Asignar trabajador existente</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Solo aparecen trabajadores de rutas del mismo administrador. Se conserva su cuenta y contraseña.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Cerrar"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
              {loadingCandidates ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : candidatos.length ? (
                candidatos.map((worker) => (
                  <div key={worker.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-800 dark:text-white">{worker.trabajador}</p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {worker.identificacion} · Ruta principal: {worker.ruta_origen}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={assigningId !== null}
                      onClick={() => handleAssign(worker)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {assigningId === worker.id ? <LoadingSpinner /> : <FiUserPlus size={15} />}
                      Asignar
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  No hay trabajadores elegibles sin asignar a esta ruta.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-worker-title"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500"><FiUserMinus size={20} /></span>
              <h2 id="remove-worker-title" className="text-lg font-black text-slate-900 dark:text-white">Quitar de esta ruta</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {removeTarget.trabajador} dejará de acceder a <strong>{selectedStore?.tienda?.nombre}</strong>. Su cuenta y las asignaciones a otras rutas no se eliminarán.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={removing} onClick={() => setRemoveTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
              <button type="button" disabled={removing} onClick={handleRemoveAssignment} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-500 disabled:opacity-60">
                {removing ? "Procesando…" : "Quitar acceso"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// app/select-store/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  FiCheck,
  FiLogOut,
  FiShoppingCart,
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiActivity,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "../utils/format";
import { apiFetch } from "../utils/api";

export default function SelectStorePage() {
  const { logout, selectStore, user } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [creating, setCreating] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [newPrefijo, setNewPrefijo] = useState("57");
  const [newCupo, setNewCupo] = useState("");

  const PAISES = [
    { code: "CO", name: "Colombia",  prefijo: "57",  cupo: 100000, emoji: "🇨🇴" },
    { code: "CL", name: "Chile",     prefijo: "56",  cupo: 50000,  emoji: "🇨🇱" },
    { code: "MX", name: "México",    prefijo: "52",  cupo: 2000,   emoji: "🇲🇽" },
    { code: "PE", name: "Perú",      prefijo: "51",  cupo: 300,    emoji: "🇵🇪" },
    { code: "EC", name: "Ecuador",   prefijo: "593", cupo: 200,    emoji: "🇪🇨" },
    { code: "OTHER", name: "Otro",   prefijo: "",    cupo: "",     emoji: "🌎" },
  ];

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/tiendas/list/tiendas/admin/`);
      if (!response.ok) throw new Error("Error al obtener las tiendas asociadas");
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setStores(list);
    } catch (err) {
      setError(err.message || "Error al cargar las tiendas");
      toast.error("Error al sincronizar sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Leer localStorage directamente — evita race conditions con el estado de React
    const storedToken = localStorage.getItem('authToken');
    const tokenTimestamp = localStorage.getItem('tokenTimestamp');

    if (!storedToken || !tokenTimestamp) {
      router.push("/login");
      return;
    }

    const tokenAge = Date.now() - parseInt(tokenTimestamp, 10);
    if (tokenAge > 60 * 60 * 1000) {
      router.push("/login");
      return;
    }

    const storedUser = localStorage.getItem('userData');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const isWorker = !(parsedUser?.is_staff || parsedUser?.is_superuser);

    if (isWorker) {
      const autoSelectWorkerStore = async () => {
        try {
          const res = await apiFetch(`/tiendas/detail/`);
          if (res.ok) {
            const storeData = await res.json();
            selectStore(storeData);
          }
        } catch (err) {
          console.error("Error auto-selecting worker store:", err);
        }
        router.push("/dashboard/liquidar");
      };
      autoSelectWorkerStore();
      return;
    }

    fetchStores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectStore = (store) => {
    if (!store) return;
    selectStore(store);
    toast.success(`Accediendo a ${store.tienda.nombre}`, { autoClose: 1500 });
    router.push("/dashboard");
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await apiFetch(`/tiendas/${removeTarget.tienda.id}/admin/remove/`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${removeTarget.tienda.nombre}" quitada de tu lista`);
      setRemoveTarget(null);
      fetchStores();
    } catch {
      toast.error("No se pudo quitar la tienda");
    } finally {
      setRemoving(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!newNombre.trim()) return;
    setCreating(true);
    try {
      const response = await apiFetch("/tiendas/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newNombre.trim(), administrador: user.id }),
      });
      if (!response.ok) throw new Error("Error al crear la ruta");
      const created = await response.json();
      const tiendaId = created.id;

      if (tiendaId && (newPrefijo || newCupo)) {
        const settings = {};
        if (newPrefijo) settings.prefijo_telefono = newPrefijo;
        if (newCupo) settings.cupo_minimo_nuevo = parseFloat(newCupo);
        await apiFetch(`/tiendas/${tiendaId}/settings/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
      }

      toast.success(`Ruta "${newNombre.trim()}" creada — membresía de prueba 7 días activa`);
      setNewNombre("");
      setNewPrefijo("57");
      setNewCupo("");
      setShowCreateModal(false);
      fetchStores();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <LoadingSpinner />
      <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Sucursales</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[130px] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/15 blur-[130px] rounded-full animate-pulse opacity-60" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-6xl w-full relative z-10 pt-6 md:pt-12 pb-16 md:pb-24">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 md:mb-16 gap-4">
          <div>
             <div className="flex items-center gap-3 md:gap-4 mb-2">
                <div className="p-2.5 md:p-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-xl md:rounded-2xl shrink-0">
                   <FiShoppingBag className="text-emerald-500 text-lg md:text-2xl" />
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">
                  Seleccionar<span className="text-emerald-500 ml-2">Sucursal</span>
                </h1>
             </div>
             {user && (
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
                 {user.username || user.email || "Administrador"}
               </p>
             )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl md:rounded-2xl border border-indigo-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/30 active:scale-95"
            >
              <FiPlus size={14} />
              <span className="hidden md:inline">Nueva Ruta</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl md:rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl group shrink-0"
            >
              <FiLogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="glass p-12 rounded-[3rem] border-rose-500/20 text-center max-w-lg mx-auto backdrop-blur-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <FiActivity className="text-rose-500 text-3xl" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Error de Sincronización</h2>
            <p className="text-slate-400 text-sm font-medium mb-8 uppercase tracking-tighter">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-emerald-600 transition-all"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleSelectStore(store)}
                className="glass group cursor-pointer border-white/5 hover:border-emerald-500/50 transition-all duration-300 rounded-[2.5rem] overflow-hidden hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
              >
                {/* Botón quitar (siempre visible en móvil, hover en desktop) */}
                <button
                  onClick={(e) => { e.stopPropagation(); setRemoveTarget(store); }}
                  className="absolute top-4 left-4 z-10 p-2 rounded-xl bg-white/5 text-slate-500 md:opacity-0 md:group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400 active:bg-rose-500/20 active:text-rose-400 transition-all"
                  title="Quitar de mi lista"
                >
                  <FiX size={14} />
                </button>
                {/* Visual indicator of selection on hover */}
                <div className="absolute top-0 right-0 p-8 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500 opacity-0 group-hover:opacity-100">
                   <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                      <FiCheck size={24} />
                   </div>
                </div>

                <div className="p-10">
                  <div className="mb-8">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2 px-1">Sucursal Activa</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase truncate group-hover:text-emerald-400 transition-colors">
                      {store.tienda.nombre}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Caja Actual</p>
                        <p className={`text-lg font-black tracking-tight ${store.tienda.caja >= 0 ? 'text-white' : 'text-rose-500'}`}>
                          {formatMoney(store.tienda.caja)}
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                         <FiDollarSign size={18} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cuentas x Cobrar</p>
                        <p className="text-sm font-black text-slate-300">
                          {formatMoney(store.tienda.dinero_x_cobrar)}
                        </p>
                      </div>
                      <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/10 flex flex-col justify-center">
                        <p className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest mb-1">Total Valor</p>
                        <p className="text-sm font-black text-emerald-500 tracking-tighter">
                          {formatMoney(store.tienda.caja + store.tienda.dinero_x_cobrar)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-10 py-6 bg-white/5 border-t border-white/5 flex items-center justify-center gap-3 group-hover:bg-emerald-600 transition-all duration-500">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Ingresar a Gestión</span>
                   <FiActivity className="text-slate-500 group-hover:text-white animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {stores.length === 0 && !loading && !error && (
          <div className="glass p-20 rounded-[3rem] border-white/10 text-center max-w-2xl mx-auto backdrop-blur-2xl">
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-300">
               <FiShoppingCart size={40} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-6 italic leading-none">Sin Sucursales Asignadas</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose mb-12">
              Aún no tienes rutas creadas. Crea tu primera ruta para comenzar.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 mx-auto active:scale-95"
            >
              <FiPlus size={16} />
              Crear Primera Ruta
            </button>
          </div>
        )}
      </div>

      {/* Subtle Bottom Decoration */}
      <div className="absolute bottom-10 left-10 opacity-5 pointer-events-none rotate-12">
        <FiTrendingUp size={300} className="text-white" />
      </div>

      {/* ── Modal Quitar tienda ──────────────────────────────────── */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setRemoveTarget(null)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-black text-white uppercase tracking-tight mb-2">
              Quitar de tu lista
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {removeTarget.tienda.nombre}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-7">
              La tienda y sus datos no se eliminan — solo deja de aparecer en tu panel.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 py-3.5 bg-white/5 text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {removing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Quitar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nueva Ruta ──────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-slate-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl">
                  <FiPlus className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tight">
                    Nueva Ruta
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Membresía de prueba · 7 días
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCrear} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Nombre de la ruta
                </label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Ruta Norte, Tienda Centro..."
                  autoFocus
                  required
                  className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-[13px] font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  País / Prefijo telefónico
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAISES.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => {
                        setNewPrefijo(p.prefijo);
                        if (p.cupo) setNewCupo(String(p.cupo));
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-[11px] font-black uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                        newPrefijo === p.prefijo
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-indigo-500/50"
                      }`}
                    >
                      <span>{p.emoji}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Cupo base para nuevos clientes
                </label>
                <input
                  type="number"
                  value={newCupo}
                  onChange={(e) => setNewCupo(e.target.value)}
                  placeholder="Ej: 100000"
                  min="0"
                  className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-[13px] font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 pl-1">
                  Valor de crédito sugerido al registrar un cliente nuevo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3.5 bg-white/5 text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newNombre.trim()}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiPlus size={14} />
                      Crear Ruta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

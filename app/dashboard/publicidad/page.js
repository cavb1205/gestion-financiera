"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch, getApiError } from "@/app/utils/api";
import { getAppDateString, formatAppTime, shiftAppDate } from "@/app/utils/datetime";
import { capturarUbicacionPublicidad, claveAutor, esPropio, nombreAutor, tieneCoordenadas, validarRangoPublicidad, colorAutor } from "@/app/utils/publicidad";
import { FiAlertCircle, FiCrosshair, FiMapPin, FiPlus, FiRefreshCw, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useRouter } from "next/navigation";

const MapaPublicidad = dynamic(() => import("@/app/components/maps/MapaPublicidad"), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>,
});
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const controlClass = "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-indigo-400 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed";

function DialogPublicidad({ titulo, busy, onClose, children, estrecho = false }) {
  const dialogRef = useRef(null);
  const controlRef = useRef({ busy, onClose });
  controlRef.current = { busy, onClose };
  useEffect(() => {
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    const selector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]';
    document.body.style.overflow = 'hidden';
    (dialogRef.current?.querySelector('input:not([disabled])') || dialogRef.current?.querySelector(selector) || dialogRef.current)?.focus();
    const teclado = event => {
      if (event.key === 'Escape' && !controlRef.current.busy) { event.preventDefault(); controlRef.current.onClose(); }
      if (event.key !== 'Tab') return;
      const elementos = dialogRef.current?.querySelectorAll(selector);
      if (!elementos?.length) { event.preventDefault(); return; }
      const primero = elementos[0], ultimo = elementos[elementos.length - 1];
      if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo.focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
      else if (!dialogRef.current.contains(document.activeElement)) { event.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', teclado);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', teclado); anterior?.focus?.(); };
  }, []);
  return <div className="fixed inset-0 z-[1100] bg-slate-950/60 p-4 flex items-center justify-center">
    <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titulo}
      className={"w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xl " + (estrecho ? "max-w-sm" : "max-w-md")}>
      {children}
    </section>
  </div>;
}

export default function PublicidadPage() {
  const { selectedStore, user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const tiendaId = selectedStore?.tienda?.id;
  const zona = selectedStore?.tienda?.zona_horaria;
  const hoy = getAppDateString(0, new Date(), zona);
  const [rango, setRango] = useState({ tiendaId: null, desde: "", hasta: "" });
  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [ubicacion, setUbicacion] = useState(null);
  const [localizando, setLocalizando] = useState(false);
  const [secuencia, setSecuencia] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const requestRef = useRef(0);
  const operationRef = useRef(false);
  const routeRef = useRef(tiendaId);
  routeRef.current = tiendaId;
  const clave = [tiendaId, rango.desde, rango.hasta].join(":");
  const rangoError = rango.tiendaId === tiendaId ? validarRangoPublicidad(rango.desde, rango.hasta, hoy) : "";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!tiendaId) return;
    setRango({ tiendaId, desde: getAppDateString(0, new Date(), zona), hasta: getAppDateString(0, new Date(), zona) });
    setPuntos([]); setLoadedKey(""); setFiltro(""); setSoloMios(false); setBusqueda("");
    setUbicacion(null); setDraft(null); setDeleteTarget(null);
    return () => { requestRef.current += 1; };
  }, [tiendaId, zona]);

  const fetchPuntos = useCallback(async () => {
    if (!isAuthenticated || !tiendaId || rango.tiendaId !== tiendaId || rangoError) return;
    const requestId = ++requestRef.current;
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/publicidad/rango/" + rango.desde + "/" + rango.hasta + "/t/" + tiendaId + "/");
      if (!res.ok) throw new Error(await getApiError(res, "No se pudieron cargar los puntos."));
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("El servidor devolvió una lista inválida.");
      if (requestId === requestRef.current) { setPuntos(data); setLoadedKey(clave); }
    } catch (err) {
      if (requestId === requestRef.current) { setError(err.message); setPuntos([]); setLoadedKey(""); }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [isAuthenticated, tiendaId, rango.tiendaId, rango.desde, rango.hasta, rangoError, clave]);

  useEffect(() => {
    if (!authLoading) fetchPuntos();
    return () => { requestRef.current += 1; };
  }, [authLoading, fetchPuntos]);

  const vigentes = loadedKey === clave && !error && !rangoError ? puntos : [];
  const autores = useMemo(() => [...new Map(puntos.map(p => [claveAutor(p), nombreAutor(p)])).entries()], [puntos]);
  const visibles = vigentes.filter(p =>
    (!soloMios || esPropio(p, user?.id, profile?.id)) &&
    (!filtro || claveAutor(p) === filtro) &&
    (nombreAutor(p) + " " + (p.nota || "")).toLowerCase().includes(busqueda.trim().toLowerCase()));
  const propios = vigentes.filter(p => esPropio(p, user?.id, profile?.id)).length;
  const conGPS = visibles.filter(tieneCoordenadas).length;
  const bajaPrecision = visibles.filter(p => p.precision_gps == null || Number(p.precision_gps) > 100).length;

  const elegirPeriodo = dias => {
    setRango({ tiendaId, desde: shiftAppDate(hoy, -dias), hasta: hoy });
  };
  const localizar = async () => {
    if (operationRef.current) return;
    operationRef.current = true; setLocalizando(true);
    const rutaOperacion = tiendaId;
    try {
      const coords = await capturarUbicacionPublicidad();
      if (routeRef.current === rutaOperacion) setUbicacion(coords);
    } catch (err) { toast.error(err.message); }
    finally { operationRef.current = false; setLocalizando(false); }
  };
  const preparar = async () => {
    if (operationRef.current || error || rangoError || loading) return;
    operationRef.current = true; setLocalizando(true);
    const rutaOperacion = tiendaId;
    try {
      const coords = await capturarUbicacionPublicidad();
      if (routeRef.current === rutaOperacion) {
        setUbicacion(coords);
        setDraft({ tiendaId: rutaOperacion, ruta: selectedStore.tienda.nombre, coords,
          nota: "", solicitud_id: crypto.randomUUID(), submitted: false });
      }
    } catch (err) { toast.error(err.message); }
    finally { operationRef.current = false; setLocalizando(false); }
  };
  const guardar = async () => {
    if (!draft || operationRef.current || draft.tiendaId !== tiendaId) return;
    operationRef.current = true; setSaving(true);
    const entrega = { ...draft, submitted: true };
    setDraft(entrega);
    try {
      const res = await apiFetch("/publicidad/create/t/" + entrega.tiendaId + "/", {
        method: "POST", body: JSON.stringify({ ...entrega.coords, nota: entrega.nota.trim() || null, solicitud_id: entrega.solicitud_id }),
      });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo guardar la entrega."));
      const data = await res.json();
      if (!data.id || data.solicitud_id !== entrega.solicitud_id) throw new Error("No se pudo confirmar el guardado. Reintenta con la misma entrega.");
      toast.success("Entrega registrada en " + entrega.ruta);
      if (routeRef.current === entrega.tiendaId) {
        setDraft(null);
        setRango({ tiendaId: entrega.tiendaId, desde: data.fecha, hasta: data.fecha });
        // Si se estaba consultando hoy, actualizar sin esperar un cambio de fechas.
        if (rango.desde === data.fecha && rango.hasta === data.fecha) fetchPuntos();
      }
    } catch (err) {
      toast.error(err.message + " No se confirmó el guardado; reintentar esta entrega no la duplicará.");
    } finally { operationRef.current = false; setSaving(false); }
  };
  const eliminar = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const punto = deleteTarget;
    try {
      const res = await apiFetch("/publicidad/" + punto.id + "/delete/", { method: "DELETE" });
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo eliminar el punto."));
      toast.success("Punto eliminado");
      if (routeRef.current === punto.tienda) { setDeleteTarget(null); fetchPuntos(); }
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };
  const cerrarRegistro = () => {
    if (!draft?.submitted || window.confirm("El guardado no fue confirmado. Es más seguro reintentar esta entrega. Si cierras, revisa la lista antes de registrar otra vez. ¿Cerrar de todos modos?")) setDraft(null);
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  return (
    <div className="pb-10 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">{selectedStore.tienda.nombre} · Trabajo en terreno</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Publicidad</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Dónde estuvo el equipo. Un registro por entrega, con su responsable.</p>
        </div>
        <button type="button" onClick={preparar} disabled={localizando || saving || loading || Boolean(error || rangoError)} className={primaryClass}>
          <FiPlus size={18} />{localizando ? "Capturando GPS…" : "Registrar entrega aquí"}
        </button>
      </header>

      <section className="glass rounded-2xl p-4 md:p-5 space-y-4" aria-label="Filtros de publicidad">
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => elegirPeriodo(0)} className={controlClass}>Hoy</button>
          <button type="button" onClick={() => elegirPeriodo(6)} className={controlClass}>Últimos 7 días</button>
          <span className="text-xs text-slate-500 ml-auto">Hasta 93 días por consulta</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="space-y-1 text-xs font-bold text-slate-500">Desde
            <input aria-label="Desde" type="date" max={hoy} value={rango.desde} onChange={e => setRango({ ...rango, desde: e.target.value })} className={inputClass} />
          </label>
          <label className="space-y-1 text-xs font-bold text-slate-500">Hasta
            <input aria-label="Hasta" type="date" max={hoy} value={rango.hasta} onChange={e => setRango({ ...rango, hasta: e.target.value })} className={inputClass} />
          </label>
          <label className="col-span-2 lg:col-span-1 space-y-1 text-xs font-bold text-slate-500">Responsable
            <select aria-label="Responsable" value={filtro} onChange={e => setFiltro(e.target.value)} className={inputClass}>
              <option value="">Todo el equipo</option>
              {filtro && !autores.some(([id]) => id === filtro) && <option value={filtro}>Responsable sin registros en este período</option>}
              {autores.map(([key, nombre]) => <option key={key} value={key}>{nombre}</option>)}
            </select>
          </label>
          <label className="col-span-2 lg:col-span-1 space-y-1 text-xs font-bold text-slate-500">Buscar
            <input aria-label="Buscar publicidad" placeholder="Local, nota o responsable" value={busqueda} onChange={e => setBusqueda(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="flex flex-wrap gap-3 items-center text-sm text-slate-600 dark:text-slate-300">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={soloMios} onChange={e => setSoloMios(e.target.checked)} />Solo mis registros</label>
          <span className="text-xs text-slate-400 flex-1">Puedes consultar todo el equipo de esta ruta.</span>
          <button type="button" onClick={fetchPuntos} disabled={loading || Boolean(rangoError)} className={controlClass} aria-label="Actualizar publicidad"><FiRefreshCw className="inline mr-1" />Actualizar</button>
        </div>
      </section>

      {(error || rangoError) && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
        <FiAlertCircle className="shrink-0 mt-0.5" /><div><p>{rangoError || error}</p><p className="mt-1 text-xs">No se muestran resultados parciales ni se confunde este error con una ruta sin publicidad.</p></div>
      </div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Registros de la ruta", vigentes.length, "En el período completo"],
          ["Mis registros", propios, "En el período completo"],
          ["Puntos del filtro", visibles.length, "Mapa y lista"],
          ["Ubicaciones válidas", conGPS, "No es cobertura del territorio"],
        ].map(([label, valor, ayuda]) => <div key={label} role="region" aria-label={label} className="glass rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">{label}</p><p className="my-1 text-2xl font-black text-slate-900 dark:text-white">{loading || error || rangoError ? "—" : valor}</p>
          <p className="text-[11px] text-slate-400">{ayuda}</p>
        </div>)}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        <section className="glass rounded-2xl overflow-hidden min-w-0" aria-label="Mapa de publicidad">
          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-white inline-flex items-center gap-2"><FiMapPin />Mapa del equipo</h2>
            <button type="button" onClick={localizar} disabled={localizando || saving} className={controlClass + " ml-auto"}><FiCrosshair className="inline mr-1" />Mi ubicación</button>
            <label className="text-xs text-slate-500 inline-flex gap-2 items-center"><input type="checkbox" checked={secuencia} onChange={e => setSecuencia(e.target.checked)} />Ver secuencias</label>
          </div>
          <div className="h-[400px] md:h-[520px] relative isolate">
            {loading && !rangoError ? <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>
              : <MapaPublicidad puntos={visibles} ubicacion={ubicacion} mostrarSecuencia={secuencia} zonaHoraria={zona} />}
          </div>
          <div className="p-4 text-xs text-slate-500 space-y-1 border-t border-slate-200 dark:border-slate-800">
            <p>Los colores diferencian responsables. Las líneas unen registros del mismo responsable y día; no muestran un recorrido GPS real.</p>
            <p>No hay objetivos definidos todavía: este mapa no calcula lugares pendientes ni porcentaje de cobertura.</p>
            {bajaPrecision > 0 && <p className="text-amber-700 dark:text-amber-400">{bajaPrecision} registro(s) con precisión mayor a 100 m o desconocida. Revisa su ubicación.</p>}
            {conGPS < visibles.length && <p className="text-amber-700 dark:text-amber-400">{visibles.length - conGPS} registro(s) sin coordenadas válidas no aparecen en el mapa.</p>}
          </div>
        </section>
        <section className="glass rounded-2xl p-4 min-w-0" aria-label="Lista de publicidad">
          <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-slate-800 dark:text-white">Entregas registradas</h2><FiUsers className="text-slate-400" /></div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto">
            {!loading && !visibles.length && !error && !rangoError && <p className="py-8 text-sm text-slate-500 text-center">No hay registros para estos filtros.</p>}
            {visibles.map(p => <article key={p.id} data-publicidad-id={p.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex gap-2 items-start">
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: colorAutor(p) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold break-words text-slate-800 dark:text-white">{p.nota || "Entrega sin nota"}</p>
                  <p className="text-xs text-slate-500 mt-1">{nombreAutor(p)} · {p.autor_rol || "Histórico"}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{p.fecha} · {formatAppTime(p.hora, { hour: "2-digit", minute: "2-digit" }, zona)} · GPS {p.precision_gps == null ? "desconocido" : "±" + Math.round(p.precision_gps) + " m"}</p>
                </div>
                {p.permite_eliminar === true && <button type="button" aria-label={"Eliminar punto " + p.id} onClick={() => setDeleteTarget(p)} className="rounded-lg p-2 text-slate-400 hover:text-rose-600"><FiTrash2 size={16} /></button>}
              </div>
            </article>)}
          </div>
        </section>
      </div>

      {draft && draft.tiendaId === tiendaId && <DialogPublicidad titulo="registrar-publicidad-titulo" busy={saving} onClose={cerrarRegistro}>
          <div className="flex items-center justify-between"><h2 id="registrar-publicidad-titulo" className="font-black text-slate-900 dark:text-white">Registrar entrega</h2>
            <button type="button" aria-label="Cerrar registro" disabled={saving} onClick={cerrarRegistro} className={controlClass}><FiX /></button></div>
          <p className="text-sm text-slate-500">Se registra en {draft.ruta}, en la fecha operativa actual. Registrar no significa completar un objetivo planificado.</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">Precisión GPS: ±{Math.round(draft.coords.precision_gps)} m</p>
          {draft.coords.precision_gps > 100 && <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">La ubicación es poco precisa. Puedes cerrar y recapturar el GPS; si continúas, esta precisión quedará visible.</p>}
          {draft.submitted && <p className="text-xs text-amber-700 dark:text-amber-400">Si hubo un error, reintenta esta misma entrega sin modificarla para evitar duplicados.</p>}
          <label className="block text-sm text-slate-600 dark:text-slate-300">Nota opcional
            <input aria-label="Nota de la entrega" value={draft.nota} maxLength={150} disabled={saving || draft.submitted}
              onChange={e => setDraft({ ...draft, nota: e.target.value })} placeholder="Nombre del local o referencia" className={inputClass + " mt-1"} /></label>
          <button type="button" disabled={saving} onClick={guardar} className={primaryClass + " w-full"}>{saving ? "Guardando…" : draft.submitted ? "Reintentar guardado" : "Guardar entrega"}</button>
      </DialogPublicidad>}

      {deleteTarget && <DialogPublicidad titulo="eliminar-publicidad-titulo" busy={deleting} onClose={() => setDeleteTarget(null)} estrecho>
          <h2 id="eliminar-publicidad-titulo" className="font-black text-slate-900 dark:text-white">Eliminar punto</h2>
          <p className="text-sm text-slate-500">{deleteTarget.nota || "Entrega sin nota"} · {nombreAutor(deleteTarget)}</p>
          <p className="text-xs text-rose-600">Esta eliminación es definitiva. La anulación con historial queda para una etapa posterior.</p>
          <div className="flex gap-2"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className={controlClass + " flex-1"}>Cancelar</button>
            <button type="button" disabled={deleting} onClick={eliminar} className="flex-1 rounded-xl bg-rose-600 px-3 py-3 text-sm font-bold text-white disabled:opacity-40">{deleting ? "Eliminando…" : "Eliminar"}</button></div>
      </DialogPublicidad>}
    </div>
  );
}

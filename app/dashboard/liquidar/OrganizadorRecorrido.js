"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowUp, FiArrowDown, FiList, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { apiFetch, getApiError } from '@/app/utils/api';
import { mismoOrden, moverCliente, textoRecorrido, validarRecorrido } from '@/app/utils/recorrido';

const boton = 'min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-200';
const campo = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
const nombre = c => `${c.nombres || ''} ${c.apellidos || ''}`.trim();
const coincide = (c, texto) => textoRecorrido(`${nombre(c)} ${c.direccion || ''}`).includes(textoRecorrido(texto));

export default function OrganizadorRecorrido({ tiendaId, tiendaNombre, zonaHoraria, onSaved, vistaPrevia }) {
  const [recorrido, setRecorrido] = useState(null);
  const [draft, setDraft] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listo, setListo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [conflicto, setConflicto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [limite, setLimite] = useState(25);
  const [seleccionado, setSeleccionado] = useState(null);
  const [busquedaDestino, setBusquedaDestino] = useState('');
  const [destino, setDestino] = useState('');
  const [ubicacion, setUbicacion] = useState('antes');
  const [anuncio, setAnuncio] = useState('');
  const dialogRef = useRef(null);
  const secuencia = useRef(0);
  const guardando = useRef(false);
  const activo = useRef(true);
  const busquedaRef = useRef(null);
  const abrirRef = useRef(null);
  const movimientoRef = useRef(null);

  const cargar = useCallback(async () => {
    const solicitud = ++secuencia.current;
    setLoading(true); setListo(false); setError(''); setConflicto(false);
    try {
      const res = await apiFetch(`/tiendas/recorrido/t/${tiendaId}/`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await getApiError(res, 'No se pudo cargar el recorrido.'));
      const data = validarRecorrido(await res.json(), tiendaId);
      if (!activo.current || solicitud !== secuencia.current) return;
      setRecorrido(data); setDraft(data.clientes); setSeleccionado(null);
      setListo(true);
      setDestino(''); setBusquedaDestino(''); setAnuncio('');
    } catch (err) {
      if (activo.current && solicitud === secuencia.current) setError(err.message);
    } finally {
      if (activo.current && solicitud === secuencia.current) setLoading(false);
    }
  }, [tiendaId]);

  useEffect(() => {
    activo.current = true;
    cargar();
    return () => { activo.current = false; secuencia.current += 1; };
  }, [cargar]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) { dialog.close(); abrirRef.current?.focus(); }
  }, [open]);

  useEffect(() => {
    if (open && !loading) busquedaRef.current?.focus();
  }, [open, loading]);

  useEffect(() => {
    if (seleccionado !== null) {
      movimientoRef.current?.scrollIntoView({ block: 'nearest' });
      movimientoRef.current?.querySelector('input')?.focus();
    }
  }, [seleccionado]);

  const cerrar = () => {
    if (guardando.current) return;
    secuencia.current += 1;
    setLoading(false);
    setDraft(recorrido?.clientes || []);
    setOpen(false);
  };
  const abrir = () => {
    setOpen(true); setBusqueda(''); setLimite(25);
    cargar(); // Tomar la versión más reciente antes de editar.
  };
  const mover = (id, accion, destinoId) => {
    const siguiente = moverCliente(draft, id, accion, destinoId);
    setDraft(siguiente);
    const indice = siguiente.findIndex(c => c.id === id);
    if (siguiente !== draft) setAnuncio(`${nombre(siguiente[indice])}: posición ${indice + 1} de ${siguiente.length}. Cambio sin guardar.`);
  };
  const guardar = async () => {
    if (guardando.current || loading || !listo || conflicto || !recorrido) return;
    guardando.current = true; setSaving(true); setError('');
    try {
      const res = await apiFetch(`/tiendas/recorrido/t/${tiendaId}/`, {
        method: 'PUT', body: JSON.stringify({ version: recorrido.version, clientes: draft.map(c => c.id) }),
      });
      if (!res.ok) {
        if (activo.current && res.status === 409) setConflicto(true);
        throw new Error(await getApiError(res, 'No se pudo guardar. Tus cambios siguen en pantalla.'));
      }
      const data = validarRecorrido(await res.json(), tiendaId);
      if (!activo.current) return;
      setRecorrido(data); setDraft(data.clientes); onSaved(data);
      setOpen(false); toast.success('Orden de visita guardado para esta ruta.');
    } catch (err) {
      if (activo.current) setError(err.message);
    } finally {
      guardando.current = false;
      if (activo.current) setSaving(false);
    }
  };

  const cambios = listo && recorrido && (!recorrido.configurado || !mismoOrden(draft, recorrido.clientes));
  const filtrados = draft.map((cliente, indice) => ({ cliente, indice })).filter(({ cliente }) => coincide(cliente, busqueda));
  const clienteSeleccionado = draft.find(c => c.id === seleccionado);
  const destinos = draft.filter(c => c.id !== seleccionado && coincide(c, busquedaDestino));
  const fecha = recorrido?.actualizado_en ? new Date(recorrido.actualizado_en).toLocaleString('es-CL', {
    timeZone: zonaHoraria || 'America/Santiago', dateStyle: 'short', timeStyle: 'short',
  }) : '';

  return <section aria-label="Orden de visita" className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <FiList aria-hidden="true" className="mt-1 text-indigo-600" size={20} />
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Orden de visita</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {loading && !open ? 'Consultando recorrido…' : recorrido?.configurado
              ? `Recorrido compartido · ${recorrido.actualizado_por} · ${fecha}`
              : 'Sin configurar: se conserva el orden actual de los créditos.'}
          </p>
          {!open && error && <p role="alert" className="mt-1 text-xs text-rose-600">{error} Puedes seguir liquidando.</p>}
          {vistaPrevia && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Vuelve a hoy para organizar el recorrido.</p>}
        </div>
      </div>
      <button ref={abrirRef} type="button" onClick={abrir} disabled={vistaPrevia}
        className={boton + ' inline-flex items-center gap-2'}><FiList aria-hidden="true" /> Organizar recorrido</button>
    </div>

    <dialog ref={dialogRef} aria-labelledby="recorrido-titulo" aria-describedby="recorrido-ayuda"
      onCancel={e => { e.preventDefault(); cerrar(); }}
      className="m-auto w-[calc(100%-1.5rem)] max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col">
        <header className="shrink-0 border-b border-slate-200 p-4 sm:p-5 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{tiendaNombre}</p>
              <h2 id="recorrido-titulo" className="mt-1 text-xl font-bold">Organizar recorrido</h2></div>
            <button type="button" onClick={cerrar} disabled={saving} aria-label="Cerrar organizador" className={boton}><FiX aria-hidden="true" size={18} /></button>
          </div>
          <p id="recorrido-ayuda" className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Organiza la secuencia habitual de visitas de esta ruta. No modifica cuotas, fechas, saldos ni calificaciones.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Aquí aparecen todos los clientes con crédito activo, aunque hoy no les corresponda pagar. Liquidar conserva las reglas de cobro del día.</p>
        </header>

        <div className="overflow-y-auto p-4 sm:p-5">
          {loading ? <p role="status" className="py-8 text-center text-sm">Cargando clientes de la ruta…</p> : <>
            {error && <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
              <p>{error}</p>
              {conflicto && <p className="mt-1">Recargar descartará los cambios sin guardar y traerá el recorrido actual.</p>}
              <button type="button" disabled={saving} onClick={cargar} className={boton + ' mt-3'}>{conflicto ? 'Recargar orden actual' : 'Reintentar carga'}</button>
            </div>}
            {recorrido && listo && <fieldset disabled={saving || conflicto} className="min-w-0 space-y-4">
              <div><label htmlFor="recorrido-buscar" className="mb-2 block text-sm font-semibold">Buscar cliente o dirección</label>
                <div className="relative"><FiSearch aria-hidden="true" className="absolute left-3 top-3.5 text-slate-400" />
                  <input ref={busquedaRef} id="recorrido-buscar" value={busqueda} onChange={e => { setBusqueda(e.target.value); setLimite(25); }} className={campo + ' pl-9'} placeholder="Nombre, apellido o sector" /></div>
                <p className="mt-2 text-xs text-slate-500">{draft.length} clientes en el recorrido{busqueda ? ` · ${filtrados.length} coincidencias` : ''}. Buscar no cambia las posiciones.</p>
              </div>

              {clienteSeleccionado && <div ref={movimientoRef} className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
                <p className="text-sm font-bold">Ubicar a {nombre(clienteSeleccionado)}</p>
                <label htmlFor="recorrido-destino-buscar" className="mt-3 mb-1 block text-xs font-semibold">Buscar el cliente de referencia</label>
                <input id="recorrido-destino-buscar" value={busquedaDestino} onChange={e => { setBusquedaDestino(e.target.value); setDestino(''); }} className={campo} placeholder="Nombre o dirección" />
                <div className="mt-3 grid grid-cols-[7rem_1fr] gap-2">
                  <div><label htmlFor="recorrido-ubicacion" className="mb-1 block text-xs">Ubicación</label>
                    <select id="recorrido-ubicacion" value={ubicacion} onChange={e => setUbicacion(e.target.value)} className={campo}><option value="antes">Antes de</option><option value="despues">Después de</option></select></div>
                  <div className="min-w-0"><label htmlFor="recorrido-destino" className="mb-1 block text-xs">Cliente de referencia</label>
                    <select id="recorrido-destino" value={destino} onChange={e => setDestino(e.target.value)} className={campo}>
                      <option value="">Seleccionar cliente</option>{destinos.slice(0, 100).map(c => <option key={c.id} value={c.id}>{nombre(c)} · {c.direccion}</option>)}
                    </select></div>
                </div>
                {destinos.length > 100 && <p className="mt-2 text-xs">Busca por nombre o dirección para acotar las opciones.</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={!destino} onClick={() => { mover(seleccionado, ubicacion, Number(destino)); setSeleccionado(null); }} className={boton}>Aplicar movimiento</button>
                  <button type="button" onClick={() => setSeleccionado(null)} className={boton}>Cerrar movimiento</button>
                </div>
              </div>}

              <ol aria-label="Clientes del recorrido" className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtrados.slice(0, limite).map(({ cliente: c, indice }) => <li key={c.id} data-recorrido-cliente={c.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-slate-100 px-1 font-bold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">{indice + 1}</span>
                    <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{nombre(c)}</p><p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">{c.direccion || 'Sin dirección registrada'}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" className={boton} disabled={indice === 0} onClick={() => mover(c.id, 'inicio')} aria-label={`Mover al inicio a ${nombre(c)}`}>Al inicio</button>
                        <button type="button" className={boton} onClick={() => { setSeleccionado(c.id); setDestino(''); setBusquedaDestino(''); }} aria-label={`Ubicar a ${nombre(c)}`}>Antes / después</button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" className={boton} disabled={indice === 0} onClick={() => mover(c.id, 'subir')} aria-label={`Subir a ${nombre(c)}`}><FiArrowUp aria-hidden="true" /></button>
                      <button type="button" className={boton} disabled={indice === draft.length - 1} onClick={() => mover(c.id, 'bajar')} aria-label={`Bajar a ${nombre(c)}`}><FiArrowDown aria-hidden="true" /></button>
                    </div>
                  </div>
                </li>)}
              </ol>
              {!filtrados.length && <p className="py-4 text-center text-sm text-slate-500">{draft.length ? 'No hay clientes que coincidan con la búsqueda.' : 'Esta ruta no tiene clientes con créditos activos.'}</p>}
              {filtrados.length > limite && <button type="button" onClick={() => setLimite(n => n + 25)} className={boton + ' w-full'}>Mostrar 25 más ({filtrados.length - limite} restantes)</button>}
            </fieldset>}
          </>}
          <p role="status" aria-live="polite" className="mt-3 text-xs text-indigo-700 dark:text-indigo-300">{anuncio}</p>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="mb-3 text-xs text-slate-500">{saving ? 'Guardando recorrido…' : cambios ? 'El nuevo orden se aplicará a toda esta ruta cuando guardes.' : 'No hay cambios pendientes.'}</p>
          <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={cerrar} className={boton}>Cancelar</button>
            <button type="button" disabled={saving || loading || conflicto || !cambios || !draft.length} onClick={guardar} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"><FiCheck aria-hidden="true" />{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
        </footer>
      </div>
    </dialog>
  </section>;
}

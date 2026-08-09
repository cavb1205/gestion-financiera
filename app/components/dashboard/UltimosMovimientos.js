// app/components/dashboard/UltimosMovimientos.js
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FiShoppingCart,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPlus,
  FiMinus,
  FiRefreshCw,
  FiCalendar,
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";
import { useRouter } from "next/navigation";
import { formatMoney, parseMoney, parseLocalDate, formatDate as formatFechaDisplay } from "../../utils/format";

const CHILE_TIME_ZONE = "America/Santiago";

const getChileToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = parts.reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = Number(part.value);
    return result;
  }, {});
  return new Date(values.year, values.month - 1, values.day);
};

const formatDateForApi = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const PERIODOS = {
  semana: { label: "Últimos 7 días", dias: 7 },
  mes: { label: "Últimos 30 días", dias: 30 },
  trimestre: { label: "Últimos 90 días", dias: 90 },
};

const getDateRange = (periodo) => {
  const fechaFin = getChileToday();
  const fechaInicio = new Date(fechaFin);
  const dias = PERIODOS[periodo]?.dias || PERIODOS.semana.dias;
  fechaInicio.setDate(fechaInicio.getDate() - (dias - 1));

  return {
    fechaInicio: formatDateForApi(fechaInicio),
    fechaFin: formatDateForApi(fechaFin),
  };
};

const getTipoLabel = (tipo) => ({
  venta: "Venta",
  gasto: "Gasto",
  aporte: "Aporte",
  retiro: "Retiro",
}[tipo] || "Movimiento");

const mapearMovimientos = (datos) => {
  const aportesArray = Array.isArray(datos?.aportes) ? datos.aportes : [];
  const gastosArray = Array.isArray(datos?.gastos) ? datos.gastos : [];
  const utilidadesArray = Array.isArray(datos?.utilidades) ? datos.utilidades : [];
  const ventasArray = Array.isArray(datos?.ventas) ? datos.ventas : [];

  return [
    ...aportesArray.map((aporte) => ({
      id: aporte.id,
      tipo: "aporte",
      descripcion: `Aporte de ${aporte.comentario || "socio"}`,
      monto: parseMoney(aporte.valor),
      fecha: aporte.fecha,
    })),
    ...gastosArray.map((gasto) => ({
      id: gasto.id,
      tipo: "gasto",
      descripcion: gasto.tipo_gasto?.tipo_gasto || "Gasto registrado",
      monto: -parseMoney(gasto.valor),
      fecha: gasto.fecha,
    })),
    ...utilidadesArray.map((utilidad) => ({
      id: utilidad.id,
      tipo: "retiro",
      descripcion: "Retiro de utilidades",
      monto: -parseMoney(utilidad.valor),
      fecha: utilidad.fecha,
    })),
    ...ventasArray.map((venta) => ({
      id: venta.id,
      tipo: "venta",
      descripcion: `Venta a ${venta.cliente?.nombres || "cliente"} ${venta.cliente?.apellidos || ""}`.trim(),
      monto: parseMoney(venta.valor_venta),
      fecha: venta.fecha_venta,
    })),
  ];
};

const cargarMovimientosLegacy = async (tiendaId, fechaInicio, fechaFin) => {
  const obtenerLista = async (path, mapear) => {
    const response = await apiFetch(path);
    if (!response.ok) throw new Error("No se pudo cargar el historial financiero.");
    const datos = await response.json();
    return mapear(Array.isArray(datos) ? datos : []);
  };

  const [aportes, gastos, utilidades, ventas] = await Promise.all([
    obtenerLista(
      `/aportes/list/${fechaInicio}/${fechaFin}/t/${tiendaId}/`,
      (datos) => datos.map((aporte) => ({
        id: aporte.id,
        tipo: "aporte",
        descripcion: `Aporte de ${aporte.comentario || "socio"}`,
        monto: parseMoney(aporte.valor),
        fecha: aporte.fecha,
      }))
    ),
    obtenerLista(
      `/gastos/list/${fechaInicio}/${fechaFin}/t/${tiendaId}/`,
      (datos) => datos.map((gasto) => ({
        id: gasto.id,
        tipo: "gasto",
        descripcion: gasto.tipo_gasto?.tipo_gasto || "Gasto registrado",
        monto: -parseMoney(gasto.valor),
        fecha: gasto.fecha,
      }))
    ),
    obtenerLista(
      `/utilidades/list/${fechaFin}/t/${tiendaId}/`,
      (datos) => datos.map((utilidad) => ({
        id: utilidad.id,
        tipo: "retiro",
        descripcion: "Retiro de utilidades",
        monto: -parseMoney(utilidad.valor),
        fecha: utilidad.fecha,
      }))
    ),
    obtenerLista(
      `/ventas/list/${fechaInicio}/${fechaFin}/t/${tiendaId}/`,
      (datos) => datos.map((venta) => ({
        id: venta.id,
        tipo: "venta",
        descripcion: `Venta a ${venta.cliente?.nombres || "cliente"} ${venta.cliente?.apellidos || ""}`.trim(),
        monto: parseMoney(venta.valor_venta),
        fecha: venta.fecha_venta,
      }))
    ),
  ]);

  return [...aportes, ...gastos, ...utilidades, ...ventas];
};

const UltimosMovimientos = ({ tienda, refreshKey = 0 }) => {
  const router = useRouter();
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState("semana");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const tiendaId = tienda?.tienda?.id;

  // Función principal para cargar todos los movimientos
  const cargarMovimientos = useCallback(async () => {
    if (!tiendaId) return;
    try {
      setCargando(true);
      setError(null);

      const { fechaInicio, fechaFin } = getDateRange(periodo);

      let todosMovimientos;
      try {
        const response = await apiFetch(
          `/tiendas/dashboard/movimientos/${fechaInicio}/${fechaFin}/t/${tiendaId}/`
        );

        if (!response.ok) {
          throw new Error("Error al cargar movimientos consolidados");
        }

        todosMovimientos = mapearMovimientos(await response.json());
      } catch (consolidatedError) {
        // Respaldo reversible mientras todos los entornos tengan el endpoint
        // nuevo y también cubre una caída parcial del servicio consolidado.
        console.warn(
          "Se usará el respaldo del Stream de Actividad:",
          consolidatedError
        );
        todosMovimientos = await cargarMovimientosLegacy(tiendaId, fechaInicio, fechaFin);
      }

      // Ordenar por fecha (más recientes primero)
      todosMovimientos.sort((a, b) => parseLocalDate(b.fecha) - parseLocalDate(a.fecha));

      // Limitar a los últimos 10 movimientos
      setMovimientos(todosMovimientos.slice(0, 10));
      setUltimaActualizacion(new Date());
    } catch (err) {
      setError(err.message);
      console.error("Error al cargar movimientos:", err);
    } finally {
      setCargando(false);
    }
  }, [tiendaId, periodo]);

  const obtenerIcono = (tipo) => {
    switch (tipo) {
      case "venta":
        return <FiShoppingCart className="text-blue-500" />;
      case "gasto":
        return <FiCreditCard className="text-red-500" />;
      case "aporte":
        return <FiTrendingUp className="text-green-500" />;
      case "retiro":
        return <FiTrendingDown className="text-purple-500" />;
      default:
        return <FiDollarSign className="text-gray-500" />;
    }
  };

  const obtenerColorTipo = (tipo) => {
    switch (tipo) {
      case "venta":
        return "text-blue-600 bg-blue-50";
      case "gasto":
        return "text-red-600 bg-red-50";
      case "aporte":
        return "text-green-600 bg-green-50";
      case "retiro":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Las fechas son DateField (sin hora), así que la granularidad mínima es el día
  const obtenerTextoAmigable = (fecha) => {
    const fechaMovimiento = parseLocalDate(fecha);
    if (!fechaMovimiento) return "—";
    const hoy = getChileToday();
    const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const movimientoUtc = Date.UTC(fechaMovimiento.getFullYear(), fechaMovimiento.getMonth(), fechaMovimiento.getDate());
    const diffDias = Math.round((hoyUtc - movimientoUtc) / 86400000);

    if (diffDias <= 0) return "Hoy";
    if (diffDias === 1) return "Ayer";
    if (diffDias < 7) return `Hace ${diffDias} d`;
    return formatFechaDisplay(fecha);
  };

  useEffect(() => {
    void cargarMovimientos();
  }, [cargarMovimientos, refreshKey]);

  if (cargando) {
    return (
      <div className="glass rounded-[2rem] p-8 border-indigo-500/10">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-24 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-32"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-20"></div>
                </div>
              </div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rango = getDateRange(periodo);
  const rangoTexto = `${formatFechaDisplay(rango.fechaInicio, { day: "numeric", month: "short" })} – ${formatFechaDisplay(rango.fechaFin, { day: "numeric", month: "short" })}`;

  return (
    <div className="glass rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 border-indigo-500/10 group">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-7">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
              <FiCalendar className="text-indigo-600 dark:text-indigo-400" />
            </div>
            Stream de Actividad
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">
            {PERIODOS[periodo].label} · {rangoTexto}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <label className="sr-only" htmlFor="periodo-movimientos">Período de movimientos</label>
          <select
            id="periodo-movimientos"
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value)}
            className="min-w-0 flex-1 lg:flex-none px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {Object.entries(PERIODOS).map(([value, option]) => (
              <option key={value} value={value}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void cargarMovimientos()}
            disabled={cargando}
            aria-label="Actualizar movimientos"
            title={ultimaActualizacion ? `Última actualización: ${ultimaActualizacion.toLocaleTimeString("es-CL", { timeZone: CHILE_TIME_ZONE, hour: "2-digit", minute: "2-digit" })}` : "Actualizar movimientos"}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
          >
            <FiRefreshCw className={`transition-transform duration-700 ${cargando ? "animate-spin" : "group-hover:rotate-180"}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-6 px-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {ultimaActualizacion
            ? `Actualizado ${ultimaActualizacion.toLocaleTimeString("es-CL", { timeZone: CHILE_TIME_ZONE, hour: "2-digit", minute: "2-digit" })}`
            : "Esperando actualización"}
        </p>
        <p className="text-[10px] font-bold text-slate-400">Máximo 10 eventos</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
          <FiRefreshCw className="text-amber-500 shrink-0" size={15} />
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => void cargarMovimientos()}
            className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {movimientos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
            <FiCalendar className="text-4xl text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin movimientos en este período</p>
        </div>
      ) : (
        <div className="space-y-3">
          {movimientos.map((movimiento, idx) => (
            <div
              key={`${movimiento.tipo}-${movimiento.id}-${idx}`}
              onClick={() => movimiento.tipo === "venta" && router.push(`/dashboard/ventas/${movimiento.id}`)}
              role={movimiento.tipo === "venta" ? "button" : undefined}
              tabIndex={movimiento.tipo === "venta" ? 0 : undefined}
              onKeyDown={(event) => {
                if (movimiento.tipo === "venta" && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  router.push(`/dashboard/ventas/${movimiento.id}`);
                }
              }}
              className={`flex items-center justify-between p-4 rounded-[1.75rem] hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-xl hover:shadow-indigo-500/5 border border-transparent hover:border-indigo-500/10 transition-all group/item ${movimiento.tipo === "venta" ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all group-hover/item:scale-110 ${
                  movimiento.tipo === 'venta' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                  movimiento.tipo === 'gasto' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' :
                  movimiento.tipo === 'aporte' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                }`}>
                  {obtenerIcono(movimiento.tipo)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white line-clamp-1 group-hover/item:text-indigo-600 transition-colors">
                    {movimiento.descripcion}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                      movimiento.tipo === 'venta' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                      movimiento.tipo === 'gasto' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' :
                      movimiento.tipo === 'aporte' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                      'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    }`}>
                      {getTipoLabel(movimiento.tipo)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 italic">
                      {obtenerTextoAmigable(movimiento.fecha)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-lg font-black tracking-tighter ${
                  movimiento.monto < 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {movimiento.monto < 0 ? '-' : '+'}{formatMoney(Math.abs(movimiento.monto))}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{movimiento.monto < 0 ? "Salida" : "Entrada"}</p>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => router.push("/dashboard/reportes/utilidad")}
            className="w-full mt-6 py-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-500/30 transition-all"
          >
            Ver historial financiero completo
          </button>
        </div>
      )}
    </div>
  );
};

export default UltimosMovimientos;

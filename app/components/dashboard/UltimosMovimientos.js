// app/components/dashboard/UltimosMovimientos.js
import { useState, useEffect } from "react";
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
import { useAuth } from "../../context/AuthContext";

import { useRouter } from "next/navigation";

const UltimosMovimientos = ({ tienda }) => {
  const router = useRouter();
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState("semana"); // semana, mes, custom
  const { token } = useAuth();

  // Función para formatear fechas en YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Obtener fechas según el período seleccionado
  const getDateRange = () => {
    const hoy = new Date();
    let fechaInicio;

    switch (periodo) {
      case "semana":
        fechaInicio = new Date();
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case "mes":
        fechaInicio = new Date();
        fechaInicio.setMonth(hoy.getMonth() - 1);
        break;
      case "custom":
        // Para custom necesitarías un selector de fechas
        fechaInicio = new Date();
        fechaInicio.setDate(hoy.getDate() - 15);
        break;
      default:
        fechaInicio = new Date();
        fechaInicio.setDate(hoy.getDate() - 7);
    }

    return {
      fechaInicio: formatDate(fechaInicio),
      fechaFin: formatDate(hoy),
    };
  };

  // Función para obtener movimientos de aportes
  const obtenerAportes = async (fechaInicio, fechaFin) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/aportes/list/${fechaInicio}/${fechaFin}/t/${tienda.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar aportes");
      }

      const datos = await response.json();
      const aportesArray = Array.isArray(datos) ? datos : [];

      // Mapear los datos de aportes al formato común de movimientos
      return aportesArray.map((aporte) => ({
        id: aporte.id,
        tipo: `aporte`,
        descripcion: `Aporte de ${aporte.comentario || "socio"} `,
        monto: parseFloat(aporte.valor),
        fecha: aporte.fecha,
        icono: "trending-up",
      }));
    } catch (err) {
      console.error("Error al obtener aportes:", err);
      return [];
    }
  };

  // Función para obtener movimientos de gastos
  const obtenerGastos = async (fechaInicio, fechaFin) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gastos/list/${fechaInicio}/${fechaFin}/t/${tienda.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar gastos");
      }

      const datos = await response.json();
      const gastosArray = Array.isArray(datos) ? datos : [];

      return gastosArray.map((gasto) => ({
        id: gasto.id,
        tipo: "gasto",
        descripcion: gasto.tipo_gasto.tipo_gasto || "Gasto registrado",
        monto: -parseFloat(gasto.valor), // Negativo porque es un gasto
        fecha: gasto.fecha,
        icono: "credit-card",
      }));
    } catch (err) {
      console.error("Error al obtener gastos:", err);
      return [];
    }
  };

  //Función para obtener movimientos de utilidades (retiros)
  const obtenerUtilidades = async (fechaFin) => {
    console.log("fechaFin:", fechaFin);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilidades/list/${fechaFin}/t/${tienda.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar utilidades");
      }

      const datos = await response.json();
      const utilidadesArray = Array.isArray(datos) ? datos : [];

      return utilidadesArray.map((utilidad) => ({
        id: utilidad.id,
        tipo: "retiro",
        descripcion: `Retiro de utilidades`,
        monto: -parseFloat(utilidad.valor), // Negativo porque es un retiro
        fecha: utilidad.fecha,
        icono: "trending-down",
        estado: "completado",
        origen: "utilidad",
      }));
    } catch (err) {
      console.error("Error al obtener utilidades:", err);
      return [];
    }
  };

  // Función para obtener movimientos de ventas
  const obtenerVentas = async (fechaInicio, fechaFin) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/list/${fechaInicio}/${fechaFin}/t/${tienda.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar ventas");
      }

      const datos = await response.json();
      const ventasArray = Array.isArray(datos) ? datos : [];

      return ventasArray.map((venta) => ({
        id: venta.id,
        tipo: "venta",
        descripcion: `Venta a ${venta.cliente.nombres || "cliente"} ${
          venta.cliente.apellidos || ""
        }`,
        monto: parseFloat(venta.valor_venta),
        fecha: venta.fecha_venta,
        icono: "shopping-cart",
      }));
    } catch (err) {
      console.error("Error al obtener ventas:", err);
      return [];
    }
  };

  // Función principal para cargar todos los movimientos
  const cargarMovimientos = async () => {
    try {
      setCargando(true);
      setError(null);

      const { fechaInicio, fechaFin } = getDateRange();

      // Obtener todos los tipos de movimientos en paralelo
      const [aportesData, gastosData, ventasData, utilidadesData] =
        await Promise.all([
          obtenerAportes(fechaInicio, fechaFin),
          obtenerGastos(fechaInicio, fechaFin),
          obtenerUtilidades(fechaFin),
          obtenerVentas(fechaInicio, fechaFin),
        ]);

      // Combinar todos los movimientos
      const todosMovimientos = [
        ...aportesData,
        ...gastosData,
        ...utilidadesData,
        ...ventasData,
      ];

      // Ordenar por fecha (más recientes primero)
      todosMovimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      // Limitar a los últimos 10 movimientos
      setMovimientos(todosMovimientos.slice(0, 10));
    } catch (err) {
      setError(err.message);
      console.error("Error al cargar movimientos:", err);
    } finally {
      setCargando(false);
    }
  };

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

  const obtenerTextoAmigable = (fecha) => {
    const ahora = new Date();
    const fechaMovimiento = new Date(fecha);
    const diffMs = ahora - fechaMovimiento;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHoras < 24) {
      return `Hace ${diffHoras} h`;
    } else if (diffDias < 7) {
      return `Hace ${diffDias} d`;
    } else {
      return new Date(fecha).toLocaleDateString();
    }
  };

  useEffect(() => {
    if (tienda && token) {
      cargarMovimientos();
    }
  }, [tienda, token, periodo]);

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

  return (
    <div className="glass rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 border-indigo-500/10 group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
              <FiCalendar className="text-indigo-600 dark:text-indigo-400" />
            </div>
            Stream de Actividad
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">Últimos Eventos</p>
        </div>
        <button 
          onClick={cargarMovimientos}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
        >
          <FiRefreshCw className={`transition-transform duration-700 ${cargando ? 'animate-spin' : 'group-hover:rotate-180'}`} />
        </button>
      </div>

      {movimientos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
            <FiCalendar className="text-4xl text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin registros recientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {movimientos.map((movimiento, idx) => (
            <div
              key={`${movimiento.tipo}-${movimiento.id}-${idx}`}
              onClick={() => movimiento.tipo === "venta" && router.push(`/dashboard/ventas/${movimiento.id}`)}
              className="flex items-center justify-between p-4 rounded-[1.75rem] hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-xl hover:shadow-indigo-500/5 border border-transparent hover:border-indigo-500/10 transition-all cursor-pointer group/item"
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
                      {movimiento.tipo}
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
                  {movimiento.monto < 0 ? '-' : '+'}${Math.abs(movimiento.monto).toLocaleString()}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto</p>
              </div>
            </div>
          ))}
          
          <button className="w-full mt-6 py-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-500/30 transition-all">
            Ver Todo el Historial
          </button>
        </div>
      )}
    </div>
  );
};

export default UltimosMovimientos;

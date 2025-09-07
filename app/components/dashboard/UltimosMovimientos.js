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

const UltimosMovimientos = ({ tienda }) => {
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Últimos Movimientos
          </h2>
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600"></div>
        </div>

        {/* Selector de período */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
          <button
            className={`px-3 py-1 text-xs rounded-md ${
              periodo === "semana" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setPeriodo("semana")}
          >
            Semana
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-md ${
              periodo === "mes" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setPeriodo("mes")}
          >
            Mes
          </button>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Últimos Movimientos
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={cargarMovimientos}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center mx-auto"
          >
            <FiRefreshCw className="mr-1" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Movimientos últimos 7 días
        </h2>
        <button
          onClick={cargarMovimientos}
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
        >
          <FiRefreshCw className="mr-1" /> Actualizar
        </button>
      </div>

      {movimientos.length === 0 ? (
        <div className="text-center py-8">
          <FiCalendar className="text-gray-400 text-3xl mx-auto mb-3" />
          <p className="text-gray-500">No hay movimientos en este período</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {movimientos.map((movimiento) => (
              <div
                key={`${movimiento.tipo}-${movimiento.id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${obtenerColorTipo(
                      movimiento.tipo
                    )}`}
                  >
                    {obtenerIcono(movimiento.tipo)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {movimiento.descripcion}
                    </p>
                    <p className="text-xs text-gray-500">
                      {obtenerTextoAmigable(movimiento.fecha)}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center ${
                    movimiento.monto < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {movimiento.monto < 0 ? (
                    <FiMinus className="mr-1" />
                  ) : (
                    <FiPlus className="mr-1" />
                  )}
                  <span className="font-semibold text-sm">
                    ${Math.abs(movimiento.monto).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UltimosMovimientos;

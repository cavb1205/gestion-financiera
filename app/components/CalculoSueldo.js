// app/components/dashboard/CalculoSueldo.js
"use client";

import { useState, useEffect } from "react";
import { 
  FiDollarSign, 
  FiCalendar, 
  FiPercent, 
  FiRefreshCw,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from "react-icons/fi";

const CalculoSueldo = ({ tienda, token }) => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [porcentaje, setPorcentaje] = useState(3.0);
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Función para obtener la fecha local en formato YYYY-MM-DD
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para obtener el lunes de la semana actual
  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  };

  // Calcular fechas por defecto (lunes a sábado de la semana actual)
  useEffect(() => {
    const lunes = getMondayOfCurrentWeek();
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    
    setFechaInicio(getLocalDateString(lunes));
    setFechaFin(getLocalDateString(sabado));
  }, []);

  const resetearFormulario = () => {
    setResultados(null);
    setError("");
    
    // Restablecer fechas por defecto
    const lunes = getMondayOfCurrentWeek();
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    
    setFechaInicio(getLocalDateString(lunes));
    setFechaFin(getLocalDateString(sabado));
    setPorcentaje(3.0);
  };

  const calcularSueldo = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/sueldo/${fechaInicio}/${fechaFin}/${porcentaje}/t/${tienda.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Error al calcular el sueldo");
      }
      
      const data = await response.json();
      setResultados(data);
    } catch (err) {
      setError("Error al calcular el sueldo. Por favor, verifica las fechas e intenta nuevamente.");
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  // Función para formatear fecha en formato local para mostrar
  const formatDisplayDate = (dateString) => {
    // Crear fecha en la zona horaria local
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiDollarSign className="mr-3 text-indigo-600 text-3xl" />
            Cálculo de Sueldo
          </h2>
          <p className="text-gray-600 mt-2 flex items-center">
            <FiInfo className="mr-1 text-indigo-500" />
            Calcula el sueldo semanal basado en los recaudos de la tienda
          </p>
        </div>
        <button
          onClick={resetearFormulario}
          className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
        >
          <FiRefreshCw className="mr-2" /> Reiniciar
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-indigo-800 mb-2">Información importante</h3>
        <p className="text-indigo-700 text-sm">
          Por defecto, el sistema calcula de lunes a sábado de la semana actual. 
          Si hoy es domingo, se calculará la semana anterior.
        </p>
      </div>

      <form onSubmit={calcularSueldo} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              <FiCalendar className="inline mr-2 text-indigo-600" /> Fecha Inicio (Lunes)
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              <FiCalendar className="inline mr-2 text-indigo-600" /> Fecha Fin (Sábado)
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              <FiPercent className="inline mr-2 text-indigo-600" /> Porcentaje (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={porcentaje}
              onChange={(e) => setPorcentaje(parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              required
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center w-full md:w-auto text-base font-medium shadow-md transition-colors"
          disabled={cargando}
        >
          {cargando ? (
            <>
              <FiRefreshCw className="animate-spin mr-2" /> Calculando...
            </>
          ) : (
            <>
              <FiTrendingUp className="mr-2" /> Calcular Sueldo
            </>
          )}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-start">
          <FiAlertCircle className="text-red-600 text-xl mr-3 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      
      {resultados && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FiCheckCircle className="mr-2" />
              Resultados del Cálculo
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-gray-800 font-medium">Período:</span>
              <span className="font-semibold text-gray-900 text-right">
                {formatDisplayDate(resultados.fecha_inicio)} <br />
                al <br />
                {formatDisplayDate(resultados.fecha_fin)}
              </span>
            </div>
            
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-gray-800 font-medium">Total Recaudado:</span>
              <span className="font-semibold text-green-700 text-lg">
                ${resultados.total_recaudado.toLocaleString('es-CO')}
              </span>
            </div>
            
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-gray-800 font-medium">Porcentaje Aplicado:</span>
              <span className="font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                {resultados.porcentaje_aplicado}%
              </span>
            </div>
            
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-gray-800 font-medium">Cantidad de Recaudos:</span>
              <span className="font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                {resultados.cantidad_recaudos}
              </span>
            </div>
            
            <div className="px-5 py-5 flex justify-between items-center bg-indigo-50 border-t-4 border-indigo-500">
              <span className="text-gray-900 font-bold text-lg">Sueldo Calculado:</span>
              <span className="text-2xl font-bold text-indigo-800">
                ${resultados.sueldo_calculado.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculoSueldo;
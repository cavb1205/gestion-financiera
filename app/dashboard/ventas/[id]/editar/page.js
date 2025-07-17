// app/dashboard/ventas/[id]/editar/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiPercent,
  FiSave,
  FiAlertCircle,
  FiLock
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

export default function EditarVentaPage() {
  const router = useRouter();
  const params = useParams();
  const ventaId = params.id;
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    fecha_venta: new Date(),
    valor_venta: "",
    interes: 0,
    cuotas: 0,
    comentario: "",
    cliente: ""
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [hasPagos, setHasPagos] = useState(false);
  const [ventaOriginal, setVentaOriginal] = useState(null);

  useEffect(() => {
    if (!loading && isAuthenticated && selectedStore) {
      fetchVenta();
    }
  }, [loading, isAuthenticated, selectedStore]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push("/select-store");
    }
  }, [loading, isAuthenticated, selectedStore, router]);

  const fetchVenta = async () => {
    try {
      setIsLoading(true);
      
      // Obtener venta por ID
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los datos de la venta");
      }

      const ventaData = await response.json();
      
      // Verificar si tiene pagos
      const pagosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${ventaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let pagos = [];
      if (pagosResponse.ok) {
        pagos = await pagosResponse.json();
      }

      const tienePagos = pagos.length > 0;
      setHasPagos(tienePagos);
      
      // Ajustar la fecha para mostrar correctamente
      const fechaVenta = new Date(ventaData.fecha_venta);
      const offset = fechaVenta.getTimezoneOffset() * 60000; // offset en milisegundos
      const fechaVentaLocal = new Date(fechaVenta.getTime() + offset);
      
      setFormData({
        fecha_venta: fechaVentaLocal,
        valor_venta: ventaData.valor_venta,
        interes: ventaData.interes,
        cuotas: ventaData.cuotas,
        comentario: ventaData.comentario || "",
        cliente: ventaData.cliente.id
      });
      
      setVentaOriginal(ventaData);
      setClienteSeleccionado(ventaData.cliente);
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching venta:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const calcularTotalAPagar = () => {
    const valorVenta = parseFloat(formData.valor_venta) || 0;
    const interesDecimal = parseFloat(formData.interes) / 100;
    return valorVenta * (1 + interesDecimal);
  };

  const calcularValorCuota = () => {
    const totalAPagar = calcularTotalAPagar();
    return totalAPagar / parseInt(formData.cuotas);
  };

  // Función para ajustar la fecha a medianoche UTC
  const adjustDateToUTC = (date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setMinutes(adjustedDate.getMinutes() - adjustedDate.getTimezoneOffset());
    return adjustedDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (hasPagos) {
      toast.error("No se puede editar una venta con pagos registrados");
      return;
    }
    
    // Validar que tenemos una tienda seleccionada
    if (!selectedStore || !selectedStore.id) {
      toast.error("No se ha seleccionado una tienda");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    // Validaciones
    if (!formData.valor_venta || parseFloat(formData.valor_venta) <= 0) {
      setError("El valor de venta debe ser mayor a cero");
      setIsSubmitting(false);
      return;
    }

    if (formData.cuotas <= 0) {
      setError("El número de cuotas debe ser mayor a cero");
      setIsSubmitting(false);
      return;
    }

    if (formData.interes < 0) {
      setError("El interés no puede ser negativo");
      setIsSubmitting(false);
      return;
    }

    try {
      // Preparar datos para el backend con fechas ajustadas
      const ventaData = {
        fecha_venta: adjustDateToUTC(formData.fecha_venta),
        valor_venta: parseFloat(formData.valor_venta),
        interes: parseFloat(formData.interes),
        cuotas: parseInt(formData.cuotas),
        comentario: formData.comentario,
        tienda: selectedStore.tienda.id,
      };

      // Endpoint de actualización
      const url = `${process.env.NEXT_PUBLIC_API_URL}/ventas/${ventaId}/update/t/${selectedStore.tienda.id}/`;
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Error al actualizar la venta");
      }

      const result = await response.json();
      toast.success("Venta actualizada exitosamente!");
      router.push(`/dashboard/ventas/${ventaId}`);
      
    } catch (err) {
      console.error("Error updating sale:", err);
      setError(err.message || "Error al actualizar la venta");
      toast.error(err.message || "Error al actualizar la venta");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-800">Cargando datos de la venta...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
            className="flex items-center text-indigo-800 hover:text-indigo-900 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Volver a detalle de venta
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiCreditCard className="mr-2 text-indigo-800" />
            Editar Venta a Crédito #{ventaId}
          </h1>
          <p className="text-gray-800 mt-2">
            Actualiza los detalles de esta venta a crédito
          </p>
        </div>

        {hasPagos && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiLock className="text-yellow-600 mr-2 text-xl" />
              <div>
                <h3 className="font-medium text-yellow-900">Edición restringida</h3>
                <p className="text-yellow-800">
                  Esta venta no puede ser editada porque ya tiene pagos registrados.
                  Solo puedes editar ventas sin pagos.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-700 mr-2" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          {/* Sección de Cliente */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2 text-indigo-800" />
              Información del Cliente
            </h2>
            
            {clienteSeleccionado && (
              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900">
                      {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                    </h3>
                    <p className="text-gray-800">
                      {clienteSeleccionado.identificacion} · {clienteSeleccionado.telefono_principal}
                    </p>
                  </div>
                  <FiLock className="text-gray-700 text-xl" title="Cliente no editable" />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Fecha de la venta
              </label>
              <DatePicker
                selected={formData.fecha_venta}
                onChange={(date) => setFormData({ ...formData, fecha_venta: date })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                dateFormat="dd/MM/yyyy"
                disabled={hasPagos}
              />
              <p className="text-sm text-gray-800 mt-1">
                {formData.fecha_venta.toLocaleDateString("es-CL")}
              </p>
            </div>
          </div>

          {/* Sección de Montos */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiDollarSign className="mr-2 text-indigo-800" />
              Términos del Crédito
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Valor de la venta ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_venta}
                    onChange={(e) => setFormData({ ...formData, valor_venta: e.target.value })}
                    className={`w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                      hasPagos ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    required
                    disabled={hasPagos}
                  />
                  <FiDollarSign className="absolute left-3 top-2.5 text-gray-700 text-lg" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Interés (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.interes}
                    onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
                    className={`w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                      hasPagos ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    required
                    disabled={hasPagos}
                  />
                  <FiPercent className="absolute left-3 top-2.5 text-gray-700 text-lg" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Número de cuotas
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.cuotas}
                  onChange={(e) => setFormData({ ...formData, cuotas: e.target.value })}
                  className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                    hasPagos ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                  disabled={hasPagos}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Comentarios
              </label>
              <textarea
                value={formData.comentario}
                onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                  hasPagos ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                rows="3"
                placeholder="Descripción de la venta, términos especiales, etc..."
                disabled={hasPagos}
              ></textarea>
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiCreditCard className="mr-2 text-indigo-800" />
              Resumen del Crédito
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Total a pagar</h3>
                  <FiDollarSign className="text-indigo-700" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${calcularTotalAPagar().toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  (Valor venta + {formData.interes}% interés)
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Valor de cuota</h3>
                  <FiCalendar className="text-green-700" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${calcularValorCuota().toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  {formData.cuotas} cuotas
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}
              className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 font-medium flex items-center ${
                hasPagos ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting || hasPagos}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Actualizar Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
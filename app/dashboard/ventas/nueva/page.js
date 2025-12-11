// app/dashboard/ventas/nueva/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiPercent,
  FiSave,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

export default function NuevaVentaPage() {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();

  // Estado basado en los campos requeridos por el backend
  const [formData, setFormData] = useState({
    fecha_venta: new Date(),
    valor_venta: "",
    interes: 20,
    cuotas: 20,
    comentario: "",
    cliente: "",
    fecha_vencimiento: "",
    plazo: "",
  });

  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  console.log("Selected Store:", selectedStore);

  // Cargar datos iniciales (solo clientes)
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/activos/t/${selectedStore.tienda.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los clientes");
      }

      const data = await response.json();
      setClientes(data);
      setClientesFiltrados(data);

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const filtrarClientes = (busqueda) => {
    setBusquedaCliente(busqueda);
    if (!busqueda.trim()) {
      setClientesFiltrados(clientes);
      return;
    }

    const filtrados = clientes.filter(
      (cliente) =>
        `${cliente.nombres} ${cliente.apellidos}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        cliente.identificacion.toLowerCase().includes(busqueda.toLowerCase())
    );

    setClientesFiltrados(filtrados);
  };

  const seleccionarCliente = (cliente) => {
    setFormData({ ...formData, cliente: cliente.id });
    setClienteSeleccionado(cliente);
    setBusquedaCliente("");
    setClientesFiltrados([]);
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

  const formatDateToLocalISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatMoney = (amount) => {
    const val = parseFloat(amount) || 0;
    const hasDecimals = val % 1 !== 0;

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validaciones
    if (!formData.cliente) {
      setError("Debe seleccionar un cliente");
      setIsSubmitting(false);
      return;
    }

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
      // Calcular valores derivados
      const total_a_pagar = calcularTotalAPagar();
      const valor_cuota = calcularValorCuota();

      // Preparar datos para el backend
      const ventaData = {
        fecha_venta: formatDateToLocalISO(formData.fecha_venta),
        valor_venta: parseFloat(formData.valor_venta),
        interes: parseFloat(formData.interes),
        cuotas: parseInt(formData.cuotas),
        comentario: formData.comentario,
        cliente: formData.cliente,
        id_tienda: selectedStore.tienda.id,
        saldo_actual: "",
        fecha_vencimiento: "",
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ventaData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(errorData.message || "Error al crear la venta");
      }

      const result = await response.json();
      toast.success("Venta a crédito creada exitosamente!");
      router.push(`/dashboard/ventas/${result.id}`);
    } catch (err) {
      console.error("Error creating sale:", err);
      setError(err.message || "Error al crear la venta");
      toast.error(err.message || "Error al crear la venta");
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
        <p className="ml-4 text-gray-700">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-400">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/ventas")}
            className="flex items-center text-indigo-700 hover:text-indigo-900 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Volver a ventas
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiCreditCard className="mr-2 text-indigo-700" />
            Nueva Venta a Crédito
          </h1>
          <p className="text-gray-700 mt-2">
            Registra una nueva venta a crédito
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-600 mr-2" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100"
        >
          {/* Sección de Cliente */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2 text-indigo-700" />
              Seleccionar Cliente
            </h2>

            {clienteSeleccionado ? (
              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-lg">
                      {clienteSeleccionado.nombres}{" "}
                      {clienteSeleccionado.apellidos}
                    </h3>
                    <p className="text-gray-700">
                      {clienteSeleccionado.identificacion} ·{" "}
                      {clienteSeleccionado.telefono_principal}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, cliente: "" });
                      setClienteSeleccionado(null);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiAlertCircle className="text-xl" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, apellido o identificación..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={busquedaCliente}
                  onChange={(e) => filtrarClientes(e.target.value)}
                />

                {clientesFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clientesFiltrados.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        onClick={() => seleccionarCliente(cliente)}
                      >
                        <div className="font-medium">
                          {cliente.nombres} {cliente.apellidos}
                        </div>
                        <div className="text-sm text-gray-600">
                          {cliente.identificacion} ·{" "}
                          {cliente.telefono_principal}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de la venta
                </label>
                <DatePicker
                  selected={formData.fecha_venta}
                  onChange={(date) =>
                    setFormData({ ...formData, fecha_venta: date })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>

          {/* Sección de Montos */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiDollarSign className="mr-2 text-indigo-700" />
              Montos y Términos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor de la venta ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_venta}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_venta: e.target.value })
                    }
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <FiDollarSign className="absolute left-3 top-2.5 text-gray-500 text-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interés (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.interes}
                    onChange={(e) =>
                      setFormData({ ...formData, interes: e.target.value })
                    }
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <FiPercent className="absolute left-3 top-2.5 text-gray-500 text-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de cuotas
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.cuotas}
                  onChange={(e) =>
                    setFormData({ ...formData, cuotas: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios
              </label>
              <textarea
                value={formData.comentario}
                onChange={(e) =>
                  setFormData({ ...formData, comentario: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
                placeholder="Descripción de la venta, términos especiales, etc..."
              ></textarea>
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiCreditCard className="mr-2 text-indigo-700" />
              Resumen del Crédito
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Total a pagar
                  </h3>
                  <FiDollarSign className="text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMoney(calcularTotalAPagar())}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  (Valor venta + {formData.interes}% interés)
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Valor de cuota
                  </h3>
                  <FiCalendar className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMoney(calcularValorCuota())}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.cuotas} cuotas
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Plazo</h3>
                  <FiCalendar className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formData.cuotas} días
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/ventas")}
              className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Crear Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

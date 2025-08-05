// app/dashboard/liquidar/abonar/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiArrowLeft, FiDollarSign, FiCheck } from "react-icons/fi";
import Link from "next/link";
import { FaCalendar } from "react-icons/fa";

export default function PagarAbonoPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [abono, setAbono] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [saldoActual, setSaldoActual] = useState(0);
  const [valorCuota, setValorCuota] = useState(0);
  const [valorAbono, setValorAbono] = useState(0);
  const [maximoAbonable, setMaximoAbonable] = useState(0);

  // Obtener datos del localStorage
  useEffect(() => {
    const storedAbono = localStorage.getItem("abono");
    const storedCliente = localStorage.getItem("cliente");

    if (!storedAbono || !storedCliente) {
      toast.error("Faltan datos para realizar el pago.");
      router.push("/dashboard/liquidar");
      return;
    }

    try {
      const parsedAbono = JSON.parse(storedAbono);
      const parsedCliente = JSON.parse(storedCliente);

      setAbono(parsedAbono);
      setCliente(parsedCliente);
      setSaldoActual(parseFloat(parsedAbono.saldo_actual)); // Valor inicial es el mínimo
      setValorAbono(parseFloat(parsedAbono.valor_recaudo)); // Mismo valor inicial
      console.log("Abono cargado:", parsedAbono);
      // Calcular el máximo abonable (mínimo entre valor cuota y saldo actual)
      const maximo = parseFloat(parsedAbono.saldo_actual) || 0;

      setMaximoAbonable(maximo);
    } catch (error) {
      console.error("Error parsing data:", error);
      toast.error("Error al cargar los datos del pago.");
      router.push("/dashboard/liquidar");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (valorAbono <= 0) {
      toast.error("El valor a abonar debe ser mayor a cero.");
      return;
    }

    if (valorAbono > maximoAbonable) {
      toast.error(
        `El valor máximo a abonar es ${formatCurrency(maximoAbonable)}`
      );
      return;
    }

    setSubmitting(true);

    // Actualizar el objeto abono con el valor ingresado
    const abonoToSend = {
      ...abono,
      valor_recaudo: valorAbono,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/create/t/${abono.tienda}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(abonoToSend),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar el abono");
      }

      // Limpiar localStorage después del pago
      localStorage.removeItem("abono");
      localStorage.removeItem("cliente");

      toast.success("Abono registrado correctamente.");
      router.push("/dashboard/liquidar");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Ocurrió un error al registrar el abono.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return `$${parseFloat(value).toLocaleString("es-CL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/liquidar"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="mr-2" /> Volver a liquidación
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-500 p-4">
            <h1 className="text-xl font-bold text-white flex items-center">
              <FiDollarSign className="mr-2" /> Registrar Pago
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 capitalize">
                Cliente: {cliente?.nombres} {cliente?.apellidos}
              </h2>
              <p className="text-gray-600 text-sm">
                ID Crédito: #{abono.venta}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor a abonar
              </label>
              <input
                type="number"
                value={valorAbono}
                onChange={(e) => setValorAbono(parseFloat(e.target.value) || 0)}
                min="0"
                max={maximoAbonable}
                step="100"
                className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
              />
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">
                  Máximo a abonar: {formatCurrency(maximoAbonable)}
                </p>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700 text-sm inline-flex items-center">
                  <FaCalendar className="inline mr-1" />{" "} {abono.fecha_recaudo}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white ${
                  submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting ? (
                  "Registrando..."
                ) : (
                  <>
                    <FiCheck className="mr-2" /> Registrar Pago
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

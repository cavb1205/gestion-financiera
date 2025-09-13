// app/dashboard/liquidar/reportar/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiArrowLeft, FiAlertTriangle, FiCheck } from "react-icons/fi";
import Link from "next/link";

export default function ReportarFallaPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noPago, setNoPago] = useState(null);
  const [tipoFalla, setTipoFalla] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [cliente, setCliente] = useState(null);

  // Cargar el objeto noPago del localStorage
  useEffect(() => {
    const storedNoPago = localStorage.getItem("noPago");
    const storedCliente = localStorage.getItem("cliente");

    if (!storedNoPago) {
      setError(
        "No se encontró el crédito a reportar. Por favor, inténtalo de nuevo."
      );
      setLoading(false);
      return;
    }

    try {
      const parsedNoPago = JSON.parse(storedNoPago);
      const parsedCliente = storedCliente ? JSON.parse(storedCliente) : null;
      setNoPago(parsedNoPago);
      setCliente(parsedCliente);
      // Establecer el tipo de falla por defecto
      setTipoFalla(
        parsedNoPago.visita_blanco?.tipo_falla || "Casa o Local Cerrado"
      );
    } catch (e) {
      setError(
        "Error al leer los datos del crédito. Por favor, inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tipoFalla) {
      toast.error("Por favor, selecciona un tipo de falla.");
      return;
    }

    setSubmitting(true);

    // Actualizar el objeto noPago con los datos del formulario
    const updatedNoPago = {
      ...noPago,
      visita_blanco: {
        comentario: comentario,
        tipo_falla: tipoFalla,
      },
    };

    

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/create/nopay/t/${noPago.tienda}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedNoPago),
        }
      );
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
            responseData.message ||
            "Error al reportar el no pago"
        );
      }

      // Limpiar localStorage después de enviar
      localStorage.removeItem("noPago");
      localStorage.removeItem("cliente");

      toast.success("Reporte de no pago enviado correctamente.", { autoClose: 1000 });
      router.push("/dashboard/liquidar");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Ocurrió un error al enviar el reporte.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
          <div className="flex flex-col items-center">
            <FiAlertTriangle className="text-red-500 text-5xl mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4 text-center">{error}</p>
            <Link
              href="/dashboard/liquidar"
              className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <FiArrowLeft className="mr-2" />
              Volver a liquidación
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Opciones de tipo de falla
  const fallaOptions = [
    "Casa o Local Cerrado",
    "Cliente no Tiene Dinero",
    "Cliente de Viaje",
    "Cliente no Aparece",
    "Cliente Enfermo",
    "Otro Motivo",
  ];

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
          <div className="bg-red-500 p-4">
            <h1 className="text-xl font-bold text-white flex items-center capitalize">
              <FiAlertTriangle className="mr-2" />
              Reportar No Pago a{" "}
              {cliente ? `${cliente.nombres} ${cliente.apellidos}` : "Cliente"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6 text-gray-500">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Falla <span className="text-red-500">*</span>
              </label>
              <select
                value={tipoFalla}
                onChange={(e) => setTipoFalla(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {fallaOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 text-gray-500">
              <label
                htmlFor="comentario"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Comentario (Opcional)
              </label>
              <textarea
                id="comentario"
                rows="3"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                placeholder="Describe la razón del no pago..."
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white ${
                  submitting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <FiCheck className="mr-2" /> Enviar Reporte
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

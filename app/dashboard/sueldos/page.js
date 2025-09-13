// app/dashboard/sueldo/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import CalculoSueldo from "../../components/CalculoSueldo";

export default function SueldoPage() {
  const { selectedStore, token } = useAuth();
  const [tienda, setTienda] = useState(null);

  useEffect(() => {
    const fetchTiendaActualizada = async () => {
      try {
        if (!selectedStore || !token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tiendas/detail/admin/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar los datos de la tienda");
        }

        const tiendaData = await response.json();
        setTienda(tiendaData);
      } catch (error) {
        console.error("Error al obtener la tienda actualizada:", error);
      }
    };

    fetchTiendaActualizada();
  }, [selectedStore, token]);

  if (!tienda) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="ml-4 text-gray-600 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <CalculoSueldo tienda={tienda} token={token} />
      </div>
    </div>
  );
}
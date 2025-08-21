// app/select-store/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext"; // Asegúrate de que la ruta sea correcta
import { FiArrowLeft, FiCheck } from "react-icons/fi";

export default function SelectStorePage() {
  const { token, logout, selectStore } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tiendas/list/tiendas/admin`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener las tiendas");
        }

        const data = await response.json();
        setStores(data);
      } catch (err) {
        setError(err.message || "Error al cargar las tiendas");
        console.error("Error fetching stores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [token, router]);

  const handleSelectStore = (store) => {
    if (!store) {
      return;
    }
    selectStore(store);

    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error al cargar tiendas
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={logout}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-2" />
            Cerrar sesión
          </button>
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Seleccione una tienda
          </h1>
          <div className="w-20"></div> {/* Spacer para alinear */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all hover:scale-105 ${
                selectedStore?.id === store.id ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleSelectStore(store)}
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div>
                    <h3 className="text-2xl capitalize font-semibold text-gray-700">
                      {store.tienda.nombre}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Caja</p>
                    <p
                      className={`font-medium ${
                        store.tienda.caja >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${store.tienda.caja.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Por Cobrar</p>
                    <p className="font-medium text-gray-500">
                      ${store.tienda.dinero_x_cobrar.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-extrabold">
                      Total tienda
                    </p>
                    <p className=" text-green-600 font-bold">
                      $
                      {(
                        store.tienda.caja + store.tienda.dinero_x_cobrar
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`px-4 py-3 text-center ${
                  selectedStore?.id === store.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {selectedStore?.id === store.id ? (
                  <div className="flex items-center justify-center">
                    <FiCheck className="mr-2" /> Seleccionada
                  </div>
                ) : (
                  "Seleccionar"
                )}
              </div>
            </div>
          ))}
        </div>

        {stores.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleSelectStore}
              disabled={!selectedStore}
              className={`px-6 py-3 rounded-full text-lg font-medium ${
                selectedStore
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continuar a la tienda
            </button>
          </div>
        )}

        {stores.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mt-8">
            <div className="text-5xl mb-4">🏬</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No tienes tiendas asignadas
            </h2>
            <p className="text-gray-600 mb-6">
              Parece que no tienes ninguna tienda asignada a tu cuenta. Por
              favor, contacta al administrador del sistema.
            </p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

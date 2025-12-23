"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { FiUsers, FiSearch, FiPlus, FiPhone, FiMapPin, FiCreditCard } from "react-icons/fi";
import Link from "next/link";

export default function TrabajadoresPage() {
  const { selectedStore, token } = useAuth();
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTrabajadores = async () => {
      if (!selectedStore?.tienda?.id || !token) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trabajadores/t/${selectedStore.tienda.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTrabajadores(data);
        } else {
          console.error("Error al cargar trabajadores");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrabajadores();
  }, [selectedStore, token]);

  const filteredTrabajadores = trabajadores.filter(
    (t) =>
      t.trabajador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.identificacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiUsers className="mr-3 text-indigo-600" />
            Trabajadores
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión del personal de {selectedStore?.tienda?.nombre}
          </p>
        </div>
        
        {/*
        <Link
          href="/dashboard/trabajadores/crear"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
        >
          <FiPlus className="mr-2" />
          Nuevo Trabajador
        </Link>
        */}
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o identificación..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Workers List */}
      {filteredTrabajadores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="text-3xl text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {searchTerm ? "No se encontraron resultados" : "No hay trabajadores registrados"}
          </h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            {searchTerm
              ? "Intenta con otros términos de búsqueda."
              : "Los trabajadores asociados a esta tienda aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrabajadores.map((trabajador) => (
            <div
              key={trabajador.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 h-10 w-10 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg mr-3 uppercase">
                      {trabajador.trabajador.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {trabajador.trabajador}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Activo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiCreditCard className="mr-2 text-gray-400" />
                    <span className="font-medium mr-1">ID:</span>
                    {trabajador.identificacion}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FiPhone className="mr-2 text-gray-400" />
                    <span className="font-medium mr-1">Tel:</span>
                    {trabajador.telefono || "No registrado"}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMapPin className="mr-2 text-gray-400" />
                    <span className="font-medium mr-1">Dir:</span>
                    <span className="truncate">{trabajador.direccion || "No registrada"}</span>
                  </div>
                </div>
              </div>
              
              {/* Footer Actions (Commented out until functionality exists)
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end space-x-2">
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Editar
                </button>
              </div>
              */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
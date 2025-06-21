// components/GlobalLoader.js
"use client";

import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta

export default function GlobalLoader() {
  const { loading } = useAuth();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-700">Verificando sesión...</p>
      </div>
    </div>
  );
}
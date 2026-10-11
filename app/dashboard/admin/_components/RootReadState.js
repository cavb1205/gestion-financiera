"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getApiError } from "@/app/utils/api";

// Las respuestas tardías no pueden reemplazar una lectura más reciente.
export function useRootRead() {
  const requestRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => () => { requestRef.current += 1; }, []);
  const read = useCallback(async (path, apply, message) => {
    const request = ++requestRef.current;
    setLoading(true);
    setLoadError("");
    try {
      const response = await apiFetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(await getApiError(response, message));
      const data = await response.json();
      if (request !== requestRef.current) return false;
      apply(data);
      setHasLoaded(true);
      return true;
    } catch (error) {
      if (request === requestRef.current) setLoadError(error.message || message);
      return false;
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);
  return { read, loading, loadError, hasLoaded };
}

export default function RootReadError({ message, onRetry, hasLoaded }) {
  return <div role="alert" className="glass mx-auto max-w-xl rounded-2xl p-6 border border-amber-200 text-slate-700 dark:text-slate-200">
    <h1 className="font-bold mb-2">No se pudo actualizar la información</h1>
    <p className="mb-2">{message}</p>
    <p className="text-sm mb-4">{hasLoaded ? "La última lectura se conserva, pero no está confirmada como actual."
      : "No podemos confirmar los datos. Esto no significa que no haya rutas, pagos o ingresos."} Las acciones quedan bloqueadas hasta volver a cargar.</p>
    <button onClick={onRetry} className="rounded-xl bg-indigo-600 text-white px-4 py-3 font-bold">Reintentar</button>
  </div>;
}

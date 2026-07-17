"use client";

import { useState, useEffect, useRef } from "react";
import { FiWifiOff, FiWifi } from "react-icons/fi";

/**
 * Banner global de conectividad. Los cobradores trabajan en la calle con
 * señal intermitente: avisar ANTES de que intenten registrar un abono evita
 * confusión cuando el envío falla. Al recuperar la señal muestra una
 * confirmación breve y desaparece.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    const goOffline = () => {
      clearTimeout(reconnectTimer.current);
      setReconnected(false);
      setOffline(true);
    };
    const goOnline = () => {
      setOffline(false);
      setReconnected(true);
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(() => setReconnected(false), 3000);
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) setOffline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      clearTimeout(reconnectTimer.current);
    };
  }, []);

  if (!offline && !reconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 px-4 py-2.5 shadow-lg text-white ${
        offline ? "bg-rose-600" : "bg-emerald-600"
      }`}
    >
      {offline ? <FiWifiOff size={13} className="shrink-0" /> : <FiWifi size={13} className="shrink-0" />}
      <p className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">
        {offline
          ? "Sin conexión — tus registros no se guardarán hasta recuperar la señal"
          : "Conexión restablecida"}
      </p>
    </div>
  );
}

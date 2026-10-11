"use client";
import { useCallback, useEffect, useState } from "react";
import RootReadError, { useRootRead } from "./RootReadState";
import { formatAppDateTime } from "@/app/utils/datetime";

export default function RootConfigurationHistory({ tipo, rows }) {
  const [data, setData] = useState([]);
  const { read, loading, loadError, hasLoaded } = useRootRead();
  const fetchHistory = useCallback(() => read(`/tiendas/configuracion/historial/?tipo=${tipo}`, (json) => {
    if (!Array.isArray(json)) throw new Error("Historial de configuración inválido.");
    setData(json);
  }, "No se pudo cargar el historial."), [read, tipo]);
  useEffect(() => { if (rows === undefined) fetchHistory(); }, [rows, fetchHistory]);
  if (rows === undefined && loadError) return <RootReadError message={loadError} onRetry={fetchHistory} hasLoaded={hasLoaded} />;
  return <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
    <h2 className="font-bold mb-3">Historial de {tipo === "cuenta" ? "cuenta bancaria" : "tarifas"}</h2>
    {rows === undefined && loading ? <p>Cargando historial…</p> : (rows || data).length === 0 ? <p className="text-sm">Sin cambios registrados desde la activación de esta bitácora.</p> :
      (rows || data).map((entry) => <details key={entry.id} className="mb-3 text-sm break-words">
        <summary>{formatAppDateTime(entry.fecha)} · @{entry.usuario_nombre} · {entry.motivo}</summary>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[['Antes', entry.anterior], ['Después', entry.nuevo]].map(([label, value]) => <div key={label}>
            <p className="font-bold">{label}</p>
            {Object.entries(value || {}).map(([key, item]) => <p key={key}>
              {typeof item === 'object' && item !== null ? `${item.nombre}: $${item.precio} (versión ${item.version})` : `${key}: ${item}`}
            </p>)}
          </div>)}
        </div>
      </details>)}
  </section>;
}

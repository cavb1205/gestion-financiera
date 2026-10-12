"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { apiFetch, getApiError } from "../../utils/api";
import { consultaAlertas, validarPendientes } from "../../utils/alertas.mjs";

export default function PendientesRevision({ refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let vigente = true;
    setLoading(true);
    const cargar = async () => {
      try {
        const response = await apiFetch(consultaAlertas({ resumen: true }));
        if (!response.ok)
          throw new Error(
            await getApiError(
              response,
              "No se pudieron consultar los pendientes.",
            ),
          );
        const next = validarPendientes(await response.json(), {
          soloResumen: true,
        });
        if (vigente) {
          setData(next);
          setError("");
        }
      } catch (err) {
        if (vigente)
          setError(
            err.message || "No se pudo confirmar el estado de revisión.",
          );
      } finally {
        if (vigente) setLoading(false);
      }
    };
    void cargar();
    return () => {
      vigente = false;
    };
  }, [refreshKey, retry]);
  return (
    <section
      aria-label="Pendientes administrativos de todas mis rutas"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-start gap-3">
        <FiAlertTriangle className="mt-1 shrink-0 text-amber-500" size={20} />
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            Pendientes de revisión · todas mis rutas
          </h2>
          {loading ? (
            <p role="status" className="mt-1 text-xs text-slate-500">
              Consultando excepciones…
            </p>
          ) : error ? (
            <p
              role="alert"
              className="mt-1 max-w-xl text-xs text-amber-700 dark:text-amber-300"
            >
              {error} No se pudo confirmar la información.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              {data.resumen.total} casos administrativos ·{" "}
              {data.resumen.criticas} críticas, incluidas las revisadas. No
              equivale a pérdidas confirmadas.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        {error && (
          <button
            onClick={() => setRetry((v) => v + 1)}
            disabled={loading}
            aria-label="Reintentar pendientes"
            className="rounded-lg border border-slate-300 p-2 dark:border-slate-700"
          >
            <FiRefreshCw />
          </button>
        )}
        <Link
          href="/dashboard/alertas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300"
        >
          Ver pendientes <FiArrowRight />
        </Link>
      </div>
    </section>
  );
}

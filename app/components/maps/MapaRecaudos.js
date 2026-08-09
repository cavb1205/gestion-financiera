"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatMoney } from "@/app/utils/format";

// Fix default icon paths broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const iconAbono = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

const iconFalla = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#f43f5e;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

function tieneCoordenadas(recaudo) {
  const latitud = Number(recaudo?.latitud);
  const longitud = Number(recaudo?.longitud);
  return Number.isFinite(latitud) && Number.isFinite(longitud)
    && latitud >= -90 && latitud <= 90
    && longitud >= -180 && longitud <= 180;
}

function AjustarVista({ posiciones }) {
  const map = useMap();

  useEffect(() => {
    if (posiciones.length === 0) return;
    if (posiciones.length === 1) {
      map.setView(posiciones[0], 16);
      return;
    }
    map.fitBounds(L.latLngBounds(posiciones), { padding: [32, 32], maxZoom: 16 });
  }, [map, posiciones]);

  return null;
}

export default function MapaRecaudos({ recaudos }) {
  const conGPS = useMemo(
    () => recaudos
      .filter(tieneCoordenadas)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0)),
    [recaudos]
  );

  const polyline = useMemo(
    () => conGPS.map((r) => [Number(r.latitud), Number(r.longitud)]),
    [conGPS]
  );
  const center = polyline[0];

  if (conGPS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-slate-400">
        <div className="text-4xl">📍</div>
        <p className="text-[10px] font-black uppercase tracking-widest">Sin ubicaciones registradas</p>
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Los cobros de este día no tienen GPS</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "100%", width: "100%", borderRadius: "1.5rem" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AjustarVista posiciones={polyline} />

      {/* Ruta cronológica */}
      <Polyline positions={polyline} color="#6366f1" weight={2} opacity={0.5} dashArray="6 4" />

      {conGPS.map((r, i) => {
        const esFalla = !!r.visita_blanco;
        const cliente = r.venta?.cliente;
        const nombre = cliente ? `${cliente.nombres} ${cliente.apellidos}` : "Cliente";
        const precision = r.precision_gps ? `${Math.round(r.precision_gps)}m` : "—";

        return (
          <Marker
            key={r.id}
            position={[Number(r.latitud), Number(r.longitud)]}
            icon={esFalla ? iconFalla : iconAbono}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", minWidth: "160px" }}>
                <p style={{ fontWeight: 900, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>
                  {nombre}
                </p>
                <p style={{ fontSize: "9px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                  Venta #{r.venta?.id || "—"}
                </p>
                <p style={{ fontSize: "10px", color: esFalla ? "#f43f5e" : "#10b981", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                  {esFalla ? `Falla: ${r.visita_blanco?.tipo_falla || ""}` : `Abono: ${formatMoney(r.valor_recaudo)}`}
                </p>
                <p style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase" }}>
                  GPS ±{precision} · Punto #{i + 1}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

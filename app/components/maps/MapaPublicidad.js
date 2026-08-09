"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const iconPunto = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#4f46e5;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

function obtenerOrden(punto) {
  const timestamp = Date.parse(punto?.hora || "");
  return Number.isFinite(timestamp) ? timestamp : Number(punto?.id) || 0;
}

function tieneCoordenadas(punto) {
  const latitud = Number(punto?.latitud);
  const longitud = Number(punto?.longitud);
  return Number.isFinite(latitud) && Number.isFinite(longitud)
    && latitud >= -90 && latitud <= 90
    && longitud >= -180 && longitud <= 180;
}

function formatHora(horaStr) {
  if (!horaStr) return "—";
  const date = new Date(horaStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function AjustarVista({ posiciones }) {
  const map = useMap();

  useEffect(() => {
    if (posiciones.length === 1) {
      map.setView(posiciones[0], 16);
    } else if (posiciones.length > 1) {
      map.fitBounds(L.latLngBounds(posiciones), { padding: [32, 32], maxZoom: 16 });
    }
  }, [map, posiciones]);

  return null;
}

export default function MapaPublicidad({ puntos = [] }) {
  const conGPS = useMemo(
    () => puntos
      .filter(tieneCoordenadas)
      .sort((a, b) => obtenerOrden(a) - obtenerOrden(b)),
    [puntos]
  );

  const posiciones = useMemo(
    () => conGPS.map((punto) => [Number(punto.latitud), Number(punto.longitud)]),
    [conGPS]
  );

  if (conGPS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-slate-400">
        <div className="text-4xl">📍</div>
        <p className="text-[10px] font-black uppercase tracking-widest">Sin ubicaciones registradas</p>
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">No hay puntos de publicidad con GPS válido para este filtro</p>
      </div>
    );
  }

  const center = posiciones[0];

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
      <AjustarVista posiciones={posiciones} />
      {posiciones.length > 1 && (
        <Polyline positions={posiciones} color="#4f46e5" weight={2} opacity={0.5} dashArray="6 4" />
      )}
      {conGPS.map((punto, index) => (
        <Marker
          key={punto.id}
          position={posiciones[index]}
          icon={iconPunto}
        >
          <Popup>
            <div style={{ fontFamily: "sans-serif", minWidth: "180px" }}>
              <p style={{ fontWeight: 900, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>
                {punto.nota || "Sin nota"}
              </p>
              <p style={{ fontSize: "10px", color: "#4f46e5", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                {formatHora(punto.hora)} · Punto #{index + 1}
              </p>
              {punto.trabajador_nombre && (
                <p style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                  {punto.trabajador_nombre}
                </p>
              )}
              <p style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase" }}>
                GPS ±{punto.precision_gps !== null && punto.precision_gps !== undefined ? `${Math.round(Number(punto.precision_gps))}m` : "—"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

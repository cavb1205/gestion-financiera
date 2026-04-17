"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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

function calcCenter(puntos) {
  const sum = puntos.reduce(
    (acc, p) => ({ lat: acc.lat + parseFloat(p.latitud), lng: acc.lng + parseFloat(p.longitud) }),
    { lat: 0, lng: 0 }
  );
  return [sum.lat / puntos.length, sum.lng / puntos.length];
}

function formatHora(horaStr) {
  if (!horaStr) return "—";
  const d = new Date(horaStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MapaPublicidad({ puntos }) {
  const conGPS = puntos.filter((p) => p.latitud && p.longitud);

  if (conGPS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-slate-400">
        <div className="text-4xl">📍</div>
        <p className="text-[10px] font-black uppercase tracking-widest">Sin ubicaciones registradas</p>
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">No hay puntos de publicidad para este filtro</p>
      </div>
    );
  }

  const center = calcCenter(conGPS);
  const polyline = conGPS.map((p) => [parseFloat(p.latitud), parseFloat(p.longitud)]);

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
      <Polyline positions={polyline} color="#4f46e5" weight={2} opacity={0.5} dashArray="6 4" />
      {conGPS.map((p, i) => (
        <Marker
          key={p.id}
          position={[parseFloat(p.latitud), parseFloat(p.longitud)]}
          icon={iconPunto}
        >
          <Popup>
            <div style={{ fontFamily: "sans-serif", minWidth: "160px" }}>
              <p style={{ fontWeight: 900, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>
                {p.nota || "Sin nota"}
              </p>
              <p style={{ fontSize: "10px", color: "#4f46e5", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                {formatHora(p.hora)}
              </p>
              {p.trabajador_nombre && (
                <p style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                  {p.trabajador_nombre}
                </p>
              )}
              <p style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase" }}>
                GPS ±{p.precision_gps ? `${Math.round(p.precision_gps)}m` : "—"} · #{i + 1}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

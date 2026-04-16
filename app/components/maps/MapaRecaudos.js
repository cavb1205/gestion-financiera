"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function calcCenter(recaudos) {
  const sum = recaudos.reduce(
    (acc, r) => ({ lat: acc.lat + parseFloat(r.latitud), lng: acc.lng + parseFloat(r.longitud) }),
    { lat: 0, lng: 0 }
  );
  return [sum.lat / recaudos.length, sum.lng / recaudos.length];
}

export default function MapaRecaudos({ recaudos }) {
  const conGPS = recaudos.filter((r) => r.latitud && r.longitud);

  if (conGPS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-slate-400">
        <div className="text-4xl">📍</div>
        <p className="text-[10px] font-black uppercase tracking-widest">Sin ubicaciones registradas</p>
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Los cobros de este día no tienen GPS</p>
      </div>
    );
  }

  const center = calcCenter(conGPS);
  const polyline = conGPS.map((r) => [parseFloat(r.latitud), parseFloat(r.longitud)]);

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
            position={[parseFloat(r.latitud), parseFloat(r.longitud)]}
            icon={esFalla ? iconFalla : iconAbono}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", minWidth: "160px" }}>
                <p style={{ fontWeight: 900, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>
                  {nombre}
                </p>
                <p style={{ fontSize: "10px", color: esFalla ? "#f43f5e" : "#10b981", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                  {esFalla ? `Falla: ${r.visita_blanco?.tipo_falla || ""}` : `Abono: $${r.valor_recaudo}`}
                </p>
                <p style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase" }}>
                  GPS ±{precision} · #{i + 1}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

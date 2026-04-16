// app/utils/geolocation.js

/**
 * Captures the current GPS location.
 * Always resolves — never rejects.
 * Returns { latitud, longitud, precision_gps } on success, or null on failure.
 */
export function captureLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitud: parseFloat(pos.coords.latitude.toFixed(7)),
          longitud: parseFloat(pos.coords.longitude.toFixed(7)),
          precision_gps: pos.coords.accuracy,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

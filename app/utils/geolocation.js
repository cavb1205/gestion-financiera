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
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision_gps: pos.coords.accuracy,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

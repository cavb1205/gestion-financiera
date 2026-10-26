const DESTINATIONS = new Set([
  '/dashboard', '/register', '/select-store', '/dashboard/clientes', '/dashboard/clientes/crear',
  '/dashboard/ventas', '/dashboard/ventas/nueva', '/dashboard/ventas/perdidas',
  '/dashboard/liquidar', '/dashboard/recaudos', '/dashboard/cierre-caja',
  '/dashboard/gastos', '/dashboard/gastos/crear', '/dashboard/aportes',
  '/dashboard/aportes/crear', '/dashboard/utilidades', '/dashboard/utilidades/crear',
  '/dashboard/trabajadores', '/dashboard/trabajadores/crear', '/dashboard/sueldos',
  '/dashboard/membresias', '/dashboard/publicidad', '/dashboard/reportes/utilidad',
  '/dashboard/reportes/gastos', '/dashboard/reportes/visitas', '/dashboard/reportes/ubicaciones',
]);

export function migrationDestination(value) {
  if (typeof value !== 'string') return '/dashboard';
  if (DESTINATIONS.has(value)) return value;
  if (/^\/dashboard\/(clientes|ventas|trabajadores)\/[0-9]{1,20}(\/editar)?$/.test(value)) return value;
  if (/^\/dashboard\/(gastos|aportes|utilidades)\/[0-9]{1,20}\/editar$/.test(value)) return value;
  return '/dashboard';
}

export function migrationContinuation({ isAuthenticated, user, selectedStore, destination }) {
  if (!isAuthenticated) return destination === '/register' ? '/register' : '/login';
  if (user?.username === 'root') return '/dashboard/admin';
  if (!selectedStore?.tienda?.id) return '/select-store';
  return migrationDestination(destination);
}

export function installationPlatform(userAgent = '', touchPoints = 0) {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && touchPoints > 1)) return 'ios';
  return /Android/i.test(userAgent) ? 'android' : 'other';
}

export async function requestPwaInstall(event) {
  if (!event || typeof event.prompt !== 'function') return 'manual';
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'manual';
  }
}

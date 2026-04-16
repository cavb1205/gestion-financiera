import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // Prevenir clickjacking — solo permitir carga en mismo origen
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevenir MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy — no filtrar datos sensibles en URLs
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permisos de funcionalidades del navegador
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // Forzar HTTPS en producción
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas excepto archivos estáticos y API interna de Next.js
    '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)',
  ],
};

# Transición del frontend antiguo

Publicación autorizada el 26 de octubre de 2026. Solo cambia las navegaciones
de `carterafinanciera.com` y `www`; la API conserva su configuración y permisos.

`destinations.conf` se incluye en contexto http, como archivo de conf.d.
`site.conf` sustituye únicamente el sitio raíz de Nginx. Redirige con 302 y
no-store a `/actualizar-app`, con destinos internos permitidos. Descarta queries
entrantes; conserva ACME, manifiesto e iconos de las aplicaciones antiguas.

Los iconos antiguos siguen iniciando en su origen anterior y reciben la
redirección al abrirse con conexión. Una PWA no puede cambiar automáticamente
su origen por el de otra; la pantalla explica cómo instalar la nueva en Android
e iOS. El manifiesto nuevo conserva su identidad `/dashboard` y ahora añade PNG
192/512 y apple-touch-icon 180. No se altera el manifiesto antiguo ni sus iconos.

Las pestañas que ya ejecutan la aplicación anterior pueden terminar operaciones
por la API. No se recargan, se borran sesiones ni se bloquean pagos en esta fase.
Sin conexión no se puede garantizar una navegación nueva entre dominios.

## Publicación verificable

1. Partir del frontend GitHub publicado, conservando los checkouts locales ajenos.
2. Ejecutar tests de migración, pruebas de sesión, lint y build. Revisar la
   pantalla pública con datos ficticios y en ancho móvil/escritorio.
3. Preparar un directorio privado `/root/cartera-legacy-transition-*` en
   `167.71.158.237`; transferir estos tres archivos desde el código revisado.
4. Ejecutar `python3 remote.py preview` dentro del directorio remoto: Nginx
   independiente en loopback 18889/18489, TLS validado, mapas de URLs, protección
   de archivos privados, manifiesto antiguo y ACME. Se detiene en finally.
5. Comprometer y publicar en GitHub main. Esperar Vercel READY y comprobar que
   `app.carterafinanciera.com` apunta exactamente al commit publicado.
6. Crear `release.json` privado: `commit`, `frontendVerifiedCommit`,
   `frontendDeployment`, `githubMainVerified=true`, `expectedPreviousSiteSHA256`
   y hashes `files` de `site.conf`, `destinations.conf` y `remote.py`. Obtener
   los archivos del commit mediante git show; no publicar una carpeta sucia.
7. Ejecutar `python3 remote.py apply`. Hace backup del sitio vigente, verifica
   concurrencia y hashes, valida Nginx y recarga. Ante fallo restaura el sitio.
8. Verificar dominio público, rutas antiguas, manifiestos, iconos, API, Telegram
   y simulación de renovación Certbot. Guardar commit, despliegue y hashes.

No poner un return global delante del desafío ACME. No añadir comodines que
redirijan `api.carterafinanciera.com`. No transmitir credenciales entre dominios
en URLs ni trasladar artificialmente movimientos para probar la transición.

Tras revisar el uso residual durante 24–48 horas se puede proponer la redirección
permanente. Cualquier cierre del cliente antiguo a nivel API requiere comprobar
formularios pendientes y probar su rechazo antes de escribir; no basta quitar
CORS ni conviene revocar sesiones del nuevo frontend.

# Publicidad: un único acceso

Toda la operación y consulta de entregas se mantiene en
`/dashboard/publicidad`, para administradores y trabajadores autorizados.

- Se retira «Mapa de Publicidad» de Reportes en escritorio y móvil.
- El buscador global ofrece solamente «Publicidad».
- Se retira el enlace «Abrir reporte de publicidad» de la sección principal.
- La guía rápida dirige mapa, historial y filtros a la sección única.
- La pantalla duplicada se retira; su código anterior permanece en el historial
  de Git. No se eliminan puntos, datos, permisos ni endpoints del backend.
- Los enlaces guardados a `/dashboard/reportes/publicidad` redirigen mediante
  HTTP 308 antes de cargar el layout y sus controles de acceso. Los parámetros
  de consulta se conservan en la URL; no se añaden filtros nuevos.

Se utiliza [la configuración de redirecciones de Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects).
El destino conserva su autenticación y el aislamiento por ruta.

## Verificación

```bash
node --test tests/publicidad-navegacion.test.mjs
npm run build
```

La prueba en navegador usa datos sintéticos e intercepta todas las llamadas a
la API: no se registran ni eliminan entregas reales.

Este cambio requiere únicamente un despliegue del frontend desde un commit
subido a GitHub. No ejecutar migraciones ni desplegar el backend por este ajuste.
El manifiesto de `PRODUCTION_BASELINE.md` identifica la publicación anterior;
las diferencias de esta rama con ese manifiesto son intencionales hasta desplegar.

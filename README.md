# Cartera Financiera

Frontend de la plataforma de créditos, recaudos y operación de rutas. La API Django vive en el repositorio [sellsystem](https://github.com/cavb1205/sellsystem).

## Para retomar el proyecto

- [Estado actual](docs/ESTADO-ACTUAL-PROYECTO.md) — arquitectura, versiones verificadas y módulos.
- [Operación y entrega](docs/OPERACION.md) — acceso autorizado, desarrollo local, pruebas y despliegue.
- [Referencia de la API](docs/API.md) — contratos entre el frontend y el backend.
- [Guía rápida](https://app.carterafinanciera.com/guia-rapida) — uso de la aplicación por trabajadores y administradores.

En el checkout de operación, el manual privado está en `operacion-local/ACCESO-Y-OPERACION.md`. Consulta [Operación y entrega](docs/OPERACION.md) para localizarlo y pedir acceso.

## Desarrollo

Usa Node 24 y ejecuta `npm ci`. Configura `NEXT_PUBLIC_API_URL` en `.env.local` con una API local o de pruebas y ejecuta `npm run dev`. La aplicación abre en `http://localhost:3000`. El manual de operación incluye los comandos de prueba y el entorno aislado del backend.

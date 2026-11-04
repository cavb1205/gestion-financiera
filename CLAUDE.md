# Retomar Cartera Financiera

- [Estado actual del proyecto](docs/ESTADO-ACTUAL-PROYECTO.md) reúne la arquitectura, las funciones vigentes y los puntos de entrada.
- [Operación y entrega](docs/OPERACION.md) describe accesos, pruebas locales, publicación y verificación.
- [Referencia de la API](docs/API.md) documenta contratos. Para un cambio, contrasta la sección con el código del backend canónico.

El backend vive en el repositorio separado `cavb1205/sellsystem`. En el frontend, `app/context/AuthContext.js` gestiona la sesión y la ruta seleccionada, y `app/utils/api.js` centraliza las llamadas autenticadas. Los identificadores de ruta en la interfaz no sustituyen la autorización del backend.

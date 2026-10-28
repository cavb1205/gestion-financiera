# Búsqueda de nombres y carga de listados

Los buscadores locales comparten las reglas de `app/utils/text.js`: ignoran mayúsculas, tildes y espacios repetidos. Todas las palabras deben coincidir en el mismo registro, aunque se escriban en otro orden. Por ejemplo, `JOSE PEREZ` y `perez josé` encuentran a «José Antonio Pérez Gómez».

Clientes, selección de titular en un crédito, ventas activas y en pérdida, liquidación y búsqueda global también admiten documento, local y teléfonos cuando la respuesta de la API incluye esos datos. Recaudos admite documento y números de recaudo y crédito; se limita a la fecha seleccionada. No se amplía el acceso a otras rutas ni a otras fechas.

Los listados se cargan por ruta y se filtran en memoria: escribir no vuelve a pedirlos al servidor. Clientes y Ventas ya no añaden una espera de 300 ms a un filtro local. El orden de la cartera se conserva mientras se escribe y solo se recalcula al actualizar los créditos. El buscador global vuelve a consultar la caché compartida al abrirse, en lugar de conservar indefinidamente su primera lista.

Recaudos vuelve a la primera página al cambiar la búsqueda o la fecha y limita la página visible al resultado actual. Los recaudos pueden mostrarse mientras se completa el resumen de cartera; el resumen informa que está cargando o que falló. Las respuestas antiguas se descartan al cambiar de consulta y las pantallas de Clientes y Recaudos se reinician al cambiar de ruta.

La búsqueda respeta los demás filtros. No modifica calendarios, deudas ni importes financieros: en Liquidar, «Total a cobrar del día» sigue siendo el total de cuotas correspondiente al día, con independencia de la búsqueda.

## Comprobaciones

```bash
node --test tests/buscadores.test.mjs tests/cartera-report.test.mjs tests/liquidar-total-cuotas-contrato.test.mjs tests/liquidar-gestiones.test.mjs tests/recorrido.test.mjs tests/root-reportes.test.mjs
npm run build
```

Casos de navegador: buscar desde la segunda página; variar tildes, mayúsculas y espacios; vaciar el campo; cambiar de fecha mientras una respuesta anterior tarda; comprobar que una cartera lenta no bloquea los recaudos; diferenciar una falla de conexión de una búsqueda sin coincidencias. Usar datos ficticios para las pruebas de errores y no crear cobros o créditos reales.

# Guía de usuario — revisión v2.3

Referencia para usuarios en `/guia-rapida`, actualizada en octubre de 2026. Se conservó la presentación por tarjetas, filtros de lectura y versión imprimible. La aclaración de Liquidar acompaña la restauración de la base de cuotas del día calculada en el backend; no modifica permisos ni registros financieros.

## Correcciones importantes

- Los créditos mensuales nuevos usan mes calendario, no un intervalo fijo de 30 días. Las propuestas son 20 cuotas diarias, 4 semanales o 1 mensual; el número puede ajustarse antes de guardar. Los históricos no se convierten.
- Liquidación no es solo una lista de clientes que desaparecen al pagar: semanales/mensuales pueden conservar cobros voluntarios y anticipos sin exigir fallas.
- «Total a cobrar del día» suma solo las cuotas correspondientes a la fecha de toda la ruta, antes de sus cobros; descuenta anticipos anteriores que cubren la cuota. No suma atrasos de otras fechas ni cobros voluntarios. Pagos del día, fallas, filtros y cancelaciones completas no alteran esta base. Corregir un contrato o un pago anterior puede cambiarla. El pendiente responde a la búsqueda; el cobrado real permanece separado y puede superar la base.
- Declarar pérdida conserva evidencia y saldo; no implica que una recuperación posterior sea imposible ni representa una pérdida neta definitiva del período.

## Contenido añadido

1. Tres indicadores de Liquidación, anticipos y consulta futura sin operaciones.
2. Recorrido compartido: arrastre, teclado, alternativas, guardar/cancelar y conflictos de edición.
3. Interpretación del reporte de utilidad, ayudas, retiros, renovaciones, fechas de pérdidas, datos no disponibles y CSV.
4. Membresías, renovaciones y bloqueo manual sin borrar información.
5. Corrección de membresías solo para root, anulación opcional de ingreso y auditoría.
6. Diferencia entre gastos, aportes y retiros efectivamente realizados.
7. Registro de clientes, identificación y verificación del destinatario de WhatsApp/Telegram.
8. Prevención de movimientos duplicados cuando la respuesta de una operación es incierta.

El filtro Root es una ayuda de lectura de una guía pública; no concede acceso ni cambia el rol. El índice solo enlaza las secciones visibles del filtro. Los botones de filtro y de preguntas frecuentes indican su estado mediante atributos accesibles.

## Base contrastada

Se revisaron los formularios y controles de clientes, nueva venta, detalle de crédito, Liquidación, recorrido, caja, gastos, aportes, utilidades, membresías y el reporte de utilidad. La corrección root se contrastó con el frontend/backend publicados en GitHub y su documentación de suscripciones manuales. Se conservaron las instrucciones existentes de Telegram y Publicidad que corresponden al flujo actual.

## Verificación

```sh
node --test tests/guia-rapida.test.mjs
npm run lint -- --file app/guia-rapida/page.js
# Con servidor local en 127.0.0.1:3052 y Playwright/Chrome disponibles:
node tests/guia-rapida-browser.cjs
```

Las 7 pruebas editoriales pasaron. Lint del archivo sin advertencias ni errores. La compilación local de `/guia-rapida` respondió HTTP 200. La prueba en Chrome verificó 17 secciones, filtros por rol, correspondencia del índice, preguntas frecuentes, escritorio, 390 px, modo oscuro y visibilidad de impresión. Sin errores JavaScript ni solicitudes a la API; las conexiones externas y las escrituras se bloquearon. Se revisaron las capturas de calendario móvil y membresías en escritorio.

Esta revisión no prueba nuevamente las operaciones financieras descritas ni equivale a una compilación completa de producción. La comprobación de impresión usa el modo print del navegador, no una inspección exhaustiva de todas las páginas de un PDF exportado.

## Publicación

La restauración de la base de cuotas parte del frontend `f049104` y backend `ef4b2c1`, conservando la retirada del bloque informativo, la guía y las suscripciones manuales. Primero se publica el backend compatible: `?resumen=1` entrega créditos y `resumen_cobranza` con criterio `cuotas_del_dia`; sin ese parámetro conserva el contrato anterior. Después se publica el frontend que consume y valida esa base, sin reconstruirla con pendiente + cobrado.

El despliegue editorial anterior se registra en `outputs/GUIA-LIQUIDAR-DESPLIEGUE.json`; la corrección de cuotas en `outputs/LIQUIDAR-CUOTAS-DIA-DESPLIEGUE.json`. Se añaden pruebas numéricas, de contrato y navegador para impedir que una publicación vuelva a la fórmula pendiente + cobrado. La publicación debe conservar las mejoras de producción y los cambios locales ajenos.

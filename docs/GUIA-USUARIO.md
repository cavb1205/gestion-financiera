# Guía de usuario — revisión v2.6

Referencia para usuarios en `/guia-rapida`, actualizada en octubre de 2026. Se conservó la presentación por tarjetas, filtros de lectura y versión imprimible. La aclaración de Liquidar acompaña la restauración de la base de cuotas del día calculada en el backend; no modifica permisos ni registros financieros.

Actualización v2.6 del 22 de octubre: Liquidar vuelve a una lista única, sin pestañas ni accesos que dupliquen Recaudos. La guía indica dónde revisar lo registrado y cómo añadir otro abono desde el detalle del crédito, usando el nombre actual «Registrar Abono». El pendiente financiero sigue incluyendo a los clientes con registro; el total fijo del día no cambia. Esta actualización es solo frontend y está pendiente de desplegar.

## Correcciones importantes

- Los créditos mensuales nuevos usan mes calendario, no un intervalo fijo de 30 días. Las propuestas son 20 cuotas diarias, 4 semanales o 1 mensual; el número puede ajustarse antes de guardar. Los históricos no se convierten.
- Liquidación conserva una sola lista: un abono o falla retira el crédito en esa fecha. Lo registrado se consulta en Recaudos desde el menú, sin pestañas ni accesos duplicados. Los anticipos sin registro del día permanecen disponibles sin exigir fallas; otro abono se registra desde el detalle del crédito.
- «Total a cobrar del día» suma solo las cuotas correspondientes a la fecha de toda la ruta, antes de sus cobros; descuenta anticipos anteriores que cubren la cuota. No suma atrasos de otras fechas ni cobros voluntarios. Pagos del día, fallas, filtros y cancelaciones completas no alteran esta base. Corregir un contrato o un pago anterior puede cambiarla. El pendiente responde a la búsqueda; el cobrado real permanece separado y puede superar la base.
- Declarar pérdida conserva evidencia y saldo; no implica que una recuperación posterior sea imposible ni representa una pérdida neta definitiva del período.

## Contenido añadido

1. Tres indicadores de Liquidación, anticipos y consulta futura sin operaciones.
2. Recorrido compartido: arrastre, teclado, alternativas, guardar/cancelar y conflictos de edición.
3. Interpretación del reporte de utilidad, ayudas, retiros, renovaciones, fechas de pérdidas, datos no disponibles y CSV.
4. Membresías, renovaciones y consultas al soporte cuando el acceso siga suspendido, sin borrar información.
5. Diferencia entre gastos, aportes y retiros efectivamente realizados.
6. Registro de clientes, identificación y verificación del destinatario de WhatsApp/Telegram.
7. Prevención de movimientos duplicados cuando la respuesta de una operación es incierta.

La guía pública está dirigida únicamente a trabajadores y administradores. No contiene opciones, enlaces ni procedimientos de operación interna de la plataforma. El índice solo enlaza las secciones visibles del filtro. Los botones de filtro y de preguntas frecuentes indican su estado mediante atributos accesibles. Esta retirada de contenido no modifica funciones ni permisos internos.

## Base contrastada

Se revisaron los formularios y controles de clientes, nueva venta, detalle de crédito, Liquidación, recorrido, caja, gastos, aportes, utilidades, membresías y el reporte de utilidad. Se conservaron las instrucciones existentes de Telegram y Publicidad que corresponden al flujo actual. Las preguntas frecuentes también explican la base de cuotas del día vigente.

## Verificación

```sh
node --test tests/guia-rapida.test.mjs
npm run lint -- --file app/guia-rapida/page.js
# Con servidor local en 127.0.0.1:3052 y Playwright/Chrome disponibles:
node tests/guia-rapida-browser.cjs
```

Las pruebas editoriales comprueban 16 secciones con numeración continua, roles públicos, calendario, base de cuotas y ausencia de procedimientos internos. La prueba en Chrome revisa filtros por rol, correspondencia del índice, preguntas frecuentes, escritorio, 390 px, modo oscuro y visibilidad de impresión, con comprobaciones explícitas de contenido público en cada vista. Las conexiones externas y las escrituras se bloquean.

Esta revisión no prueba nuevamente las operaciones financieras descritas. La comprobación de impresión usa el modo print del navegador, no una inspección exhaustiva de todas las páginas de un PDF exportado.

## Publicación

La revisión v2.4 parte del frontend publicado `3b8c9d2`. Solo modifica la guía y sus pruebas; no necesita cambios del backend y conserva el total de cuotas del día ya desplegado. Queda preparada para una publicación posterior desde un commit verificado en GitHub.

El despliegue editorial anterior se registra en `outputs/GUIA-LIQUIDAR-DESPLIEGUE.json`; la corrección de cuotas en `outputs/LIQUIDAR-CUOTAS-DIA-DESPLIEGUE.json`. Se añaden pruebas numéricas, de contrato y navegador para impedir que una publicación vuelva a la fórmula pendiente + cobrado. La publicación debe conservar las mejoras de producción y los cambios locales ajenos.

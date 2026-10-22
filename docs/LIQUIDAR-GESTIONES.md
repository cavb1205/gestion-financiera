# Liquidar: una lista de cobro, sin duplicar Recaudos

Liquidar muestra una sola lista de créditos activos sin abono ni visita en la fecha consultada. No tiene pestañas «Por gestionar»/«Gestionados» ni un acceso adicional a registros: para consultar lo ocurrido se utiliza «Recaudos» desde el menú existente. Incluye anticipos con saldo sin registro de ese día, aunque sean cobros voluntarios sin obligación de pago o falla.

Al registrar una falla o abono, el crédito deja de aparecer en la lista de esa fecha. Si luego paga otra vez, se abre el crédito desde Recaudos y se usa «Registrar Abono» en el detalle. El servidor conserva el rechazo de una segunda falla para ese crédito y fecha, incluso desde un formulario antiguo. Un abono parcial no se confunde con una falla.

La exclusión se aplica por crédito, fecha y ruta, no por cliente global. Al día siguiente un crédito con deuda exigible vuelve a la lista. No es necesario esperar otra semana para recuperar una cuota vencida. Los créditos totalmente pagados o declarados pérdida conservan su exclusión del listado; sus registros siguen en Recaudos/detalle.

Las tarjetas financieras se calculan antes de retirar de la lista los créditos con registro:

- «Total a cobrar del día» conserva la base contractual del backend sin cambios de fórmula.
- «Pendiente por cobrar» incluye la deuda pendiente de créditos con y sin registro; la búsqueda de cliente sí modifica ese indicador, incluso cuando la coincidencia ya salió de la lista. En diarios, un abono parcial deja únicamente el resto de la cuota de esa jornada, no una cuota adicional completa.
- «Total cobrado del día» sigue mostrando los abonos reales de toda la ruta.

Una fecha futura sigue siendo una proyección de solo lectura y no presenta grupos de gestión ficticios. El orden de recorrido y los permisos de ruta no cambian.

## Contrato técnico

Liquidar solicita `incluir_gestionados=1` además de `resumen=1`. Esto permite recuperar también los diarios ya gestionados; sin el parámetro se conserva la exclusión diaria anterior para otros consumidores.

La respuesta añade `gestionado_hoy`, `falla_registrada_hoy` e `importe_pendiente_jornada`, relativos a la fecha consultada aunque sus nombres contengan «hoy». Las anotaciones evitan consultas adicionales por fila. En semanal/mensual el calendario también bloquea `permite_falla` cuando ya hay una visita sin abono.

No se crean migraciones, nuevos registros operativos automáticos ni nuevos cálculos de score. Una falla sigue sin mover caja ni reducir saldo. Los registros de renovación no cuentan como visitas o abonos del recorrido.

## Pruebas

`Ventas.test_gestiones_liquidar` cubre las tres modalidades, duplicados, abono posterior, anticipos, fechas, renovación, compatibilidad y permisos. `tests/liquidar-gestiones.test.mjs` verifica la lista única y el dinero. `tests/liquidar-gestiones-browser.cjs` recorre la aplicación compilada con la API Django de `ops/prueba_gestiones_local.py`, SQLite en memoria y red externa bloqueada; incluye Recaudos → detalle → Registrar Abono.

La simplificación del 22 de octubre es solo frontend y usa el contrato backend ya desplegado en `4571ac2`; no requiere migraciones ni una nueva publicación del backend. No publicar la compilación de pruebas, que usa `127.0.0.1:3050`. Este documento no implica autorización de despliegue.

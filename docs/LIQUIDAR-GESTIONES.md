# Liquidar: recorrido y deuda separados

La vista inicial «Por gestionar» muestra créditos activos sin abono ni visita en la fecha consultada. Incluye anticipos con saldo, aunque sean cobros voluntarios sin obligación de pago o falla.

Al registrar una falla o abono, el crédito activo pasa a «Gestionados». Allí se puede registrar otro abono. Una falla ya registrada queda deshabilitada y el servidor rechaza un segundo registro para ese crédito y fecha, incluso desde un formulario antiguo. Un abono parcial no se confunde con una falla.

La separación se aplica por crédito, fecha y ruta, no por cliente global. Al día siguiente un crédito con deuda exigible vuelve a «Por gestionar». No es necesario esperar otra semana para recuperar una cuota vencida. Los créditos totalmente pagados o declarados pérdida conservan su exclusión del listado; sus registros siguen en Recaudos/detalle.

Las tarjetas financieras no dependen del grupo seleccionado:

- «Total a cobrar del día» conserva la base contractual del backend sin cambios de fórmula.
- «Pendiente por cobrar» incluye la deuda pendiente de ambos grupos; la búsqueda de cliente sí modifica ese indicador. En diarios, un abono parcial deja únicamente el resto de la cuota de esa jornada, no una cuota adicional completa.
- «Total cobrado del día» sigue mostrando los abonos reales de toda la ruta.

Una fecha futura sigue siendo una proyección de solo lectura y no presenta grupos de gestión ficticios. El orden de recorrido y los permisos de ruta no cambian.

## Contrato técnico

Liquidar solicita `incluir_gestionados=1` además de `resumen=1`. Esto permite recuperar también los diarios ya gestionados; sin el parámetro se conserva la exclusión diaria anterior para otros consumidores.

La respuesta añade `gestionado_hoy`, `falla_registrada_hoy` e `importe_pendiente_jornada`, relativos a la fecha consultada aunque sus nombres contengan «hoy». Las anotaciones evitan consultas adicionales por fila. En semanal/mensual el calendario también bloquea `permite_falla` cuando ya hay una visita sin abono.

No se crean migraciones, nuevos registros operativos automáticos ni nuevos cálculos de score. Una falla sigue sin mover caja ni reducir saldo. Los registros de renovación no cuentan como visitas o abonos del recorrido.

## Pruebas

`Ventas.test_gestiones_liquidar` cubre las tres modalidades, duplicados, abono posterior, anticipos, fechas, renovación, compatibilidad y permisos. `tests/liquidar-gestiones.test.mjs` verifica agrupación y dinero. `tests/liquidar-gestiones-browser.cjs` recorre la aplicación compilada con la API Django de `ops/prueba_gestiones_local.py`, SQLite en memoria y red externa bloqueada.

El cambio requiere backend antes de frontend al desplegar. No publicar la compilación de pruebas, que usa `127.0.0.1:3050`. Este documento no implica autorización de despliegue.

# Pendientes de revisión

Implementación de octubre de 2026. Centro privado de `cavb1205`: solo sus rutas activas vinculadas mediante `Tienda_Administrador`. No es un módulo global para clientes de la plataforma.

## Uso

- El dashboard tiene un acceso compacto a pendientes de todas las rutas administradas. La etiqueta hace explícito ese alcance, independiente de la ruta operativa seleccionada.
- Alertas abre excepciones actuales: créditos con señales al otorgarse, atrasos importantes, inconsistencias de crédito/pagos, integridad del historial de caja y cierres pendientes agrupados por ruta.
- Las cuotas ordinarias y seguimientos leves siguen en Liquidar, Ventas activas y Reporte de cartera. El centro no cambia sus reglas.
- Las críticas revisadas siguen contando como críticas abiertas. Los números cuentan casos, no clientes distintos ni pérdidas confirmadas.
- Ruta, prioridad, motivo, estado y búsqueda se filtran en el backend sobre la colección completa. Se pagina en grupos de 25. La búsqueda se aplica al enviar el formulario.
- Las revisiones de alertas persistidas guardan nota, actor, fecha y transición de estado. Terminar una revisión requiere explicación. Una condición de cobranza que continúa vigente solo admite seguimiento, no una resolución administrativa que borre la deuda.
- Los controles calculados de integridad no admiten una marca que oculte una contradicción aún vigente: se revisa el crédito/ruta y la señal desaparece al corregir su causa.
- Al abrir un caso de otra ruta se consulta su detalle autorizado y se cambia el contexto antes de navegar.
- El historial resuelto contiene alertas persistidas; las incidencias calculadas en vivo no generan por sí solas registros históricos durables.

## Caja: significado y límites

Se retiró la comparación incompleta «cierre anterior + aportes + recaudos - gastos - utilidades», que omitía desembolsos. No se reemplazó por una reconstrucción parcial de operaciones históricas.

El control nuevo consulta `MovimientoCaja`: comprueba delta vs. saldos, continuidad entre movimientos y último saldo vs. caja actual. Incluye las salidas, correcciones y reversas efectivamente auditadas, aunque los documentos tengan fechas retroactivas.

No confirma el efectivo físico, no atribuye responsabilidades y no demuestra fraude. Una ruta sin movimientos auditados se indica como no comprobable. No se reconstruyen movimientos históricos ni cierres antiguos. Un histórico internamente coherente tampoco acredita que esté completo.

## Confiabilidad

- El monitor resuelve alertas de cartera de créditos `Pagado`/`Perdida`, incluidos diarios, sin modificar el estado ni el saldo del crédito. Las pérdidas conservan su proceso separado.
- Registrar el cierre pendiente reconcilia la alerta correspondiente. El mantenimiento también resuelve omisiones anteriores cuyo cierre ya existe.
- Abrir Alertas no guarda ni sincroniza estados: filtra condiciones obsoletas en lectura hasta que una escritura autorizada o el mantenimiento registra la resolución durable.
- La sincronización conserva las notas de revisión. Los cambios web tienen bloqueo de fila y verificación de `actualizada`, para no sobrescribir una revisión de otra sesión.
- Telegram revalida el alcance del monitor y deja actor/origen de su revisión. No se presenta el bot como conectado sin comprobarlo ni se promete entrega individual de cada aviso.
- Una respuesta HTTP fallida o incompleta produce un error persistente, no ceros que aparenten ausencia de problemas. Si quedan datos anteriores, se identifican y las acciones quedan deshabilitadas hasta actualizar.

## Contratos

`GET /tiendas/alertas/pendientes/`: `version: 1`, `casos`, `rutas`, `resumen`, `paginacion`, `caja_sin_historial`, `actualizado`. Filtros: `tienda`, `severidad`, `tipo`, `estado`, `q`, `page`, `limit`; `solo_resumen=1` omite las filas para el bloque del dashboard.

`GET /tiendas/alertas/`: conserva el feed persistido; añade búsqueda insensible a acentos, prioridad explícita y paginación. El historial web pide `estado=resuelta`.

`PATCH /tiendas/alertas/<id>/estado/`: `estado`, `nota` y `actualizada` del caso leído. Nota: máximo 1000 caracteres; para resolución, mínimo cinco. Conflictos de versión o cobranza vigente: 409. No cambia saldos ni movimientos financieros.

El cambio no requiere nuevas migraciones. No incluye una depuración ejecutada contra producción ni una publicación automática. Backend antes del frontend al autorizar el despliegue, siempre desde commits publicados en GitHub.

## Verificación local

API ficticia: `PYTHONPATH=<runtime Django 4.1 local> python3 ops/prueba_alertas_local.py`, desde el backend; SQLite en memoria, puerto 3042, notificaciones prohibidas.

Frontend: compilar con `NEXT_PUBLIC_API_URL=http://127.0.0.1:3042 npm run build`; servir en `127.0.0.1:3039`. Esa compilación es exclusivamente para pruebas y no se debe desplegar a producción.

Navegador: `PLAYWRIGHT_MODULE=<módulo Playwright> CHROME_PATH=<Chrome> node tests/alertas-browser.cjs`. La prueba bloquea destinos externos; únicamente guarda notas ficticias. Verifica paginación, búsqueda antigua con acentos, revisión, respuesta perdida, historial, cierres agrupados, ruta correcta, fallos recuperables y conservación de datos financieros en escritorio/móvil.

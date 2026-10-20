# Cambiar la modalidad de un crédito

En Ventas activas → detalle del crédito → Editar, el administrador de la ruta
puede elegir Diario, Semanal o Mensual si todavía no existe ningún recaudo,
abono, visita sin pago ni movimiento por renovación asociado al crédito.
Los créditos cerrados o relacionados con renovaciones no admiten esta conversión.

Al seleccionar otra modalidad se proponen 20 cuotas diarias, 4 semanales o 1
mensual. Son valores iniciales editables, no un cambio del capital o del interés.
Abrir el formulario sin cambiar modalidad no reemplaza la cantidad pactada.

La vista previa muestra total, importe por cuota, primer pago, última cuota y
vencimiento contractual. Semanal utiliza siete días por cuota; cuatro semanas
son 28 días. Mensual convertido utiliza meses calendario, ajustando al último
día del mes cuando corresponda. Diario conserva sus reglas históricas.

Un crédito mensual histórico que conserva su modalidad mantiene el intervalo
de 30 días y la tolerancia original. No se migran calendarios por editar otro
campo. La versión del calendario la decide el servidor, nunca el navegador.

Si ya hay abonos o visitas, la modalidad permanece deshabilitada. La corrección
administrativa existente sigue limitada a fecha y cantidad de cuotas, con motivo
obligatorio, conservando los pagos y el estado financiero. Incluir `plazo` en esa
petición se rechaza explícitamente para no simular un cambio que no se aplica.

El formulario no permite editar un crédito de otra ruta ni supone que no hay
movimientos si no puede verificar el historial. El servidor vuelve a consultar
los movimientos dentro del bloqueo: una visita registrada después de abrir
el formulario impide guardar la edición normal (409).

No hay migraciones de base de datos ni cambios de las reglas compartidas de
Liquidar. Las pruebas cubren conversiones, fin de mes, año bisiesto, permisos,
concurrencia, preservación de históricos y cuota del día tras la conversión.

## Pruebas locales

```sh
python manage.py test Ventas.test_editar_modalidad Ventas.test_calendario \
  Ventas.test_total_liquidacion --settings=sell_system.settings_pruebas_reportes
node --experimental-default-type=module --test app/utils/edicionCredito.test.mjs
```

Para el navegador: iniciar `ops/prueba_editar_modalidad_local.py` desde el backend
con el entorno de pruebas, compilar el frontend con la API en 127.0.0.1:3047 y
servirlo en 127.0.0.1:3048. Ejecutar `tests/editar-modalidad-browser.cjs` con
Playwright. Son datos ficticios en SQLite; todos los accesos externos del navegador
y todas las notificaciones de Django están bloqueados. No ejecutar este fixture
con configuración ni datos de producción.

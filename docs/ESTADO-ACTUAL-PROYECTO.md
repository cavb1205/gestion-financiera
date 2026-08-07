# Estado actual del proyecto

Última actualización: 7 de agosto de 2026.

Este documento resume lo implementado en la plataforma Cartera Financiera y sirve como memoria de continuidad para los siguientes cambios.

## 1. Operación de cartera

### Ventas activas

La lista está orientada a detectar rápidamente créditos que necesitan gestión:

- prioridad de cobranza visible y ordenada de mayor a menor;
- días desde el último abono real;
- cuotas atrasadas;
- monto necesario para ponerse al día;
- saldo actual, frecuencia de pago, contacto y acciones principales;
- filtros para gestión del día, urgentes, días sin abono y cuotas vencidas.

El monto para ponerse al día nunca puede superar el saldo actual. Los pagos suficientes o adelantados no se marcan como atraso solo por el paso del tiempo.

### Liquidar

La lista conserva el orden original por antigüedad del crédito. Los clientes que ya abonaron durante el día desaparecen de la lista, para que el trabajador vea únicamente lo pendiente.

Se agregaron días completos sin abono, cuotas atrasadas y monto para ponerse al día. El día actual no se suma mientras la jornada siga abierta; si el último abono fue ayer, se muestra “Ayer” sin etiquetarlo como atraso. En escritorio se redujo el ancho de la tabla: el contacto muestra solo los iconos de teléfono y WhatsApp, se quitó el icono junto al nombre y el seguimiento queda debajo de cada línea.

## 2. Frecuencias y reglas de riesgo

- Diario es el valor predeterminado al crear una venta.
- El trabajador no puede modificar la frecuencia; siempre registra créditos diarios.
- Solo los administradores pueden elegir Diario, Semanal o Mensual.
- El backend aplica la misma restricción, no depende únicamente del formulario.
- Los umbrales se calculan según la frecuencia y los días desde el último abono real.
- El primer abono del día actual no se considera atrasado antes de que termine ese día.
- Las renovaciones técnicas no se confunden con pagos reales.

Umbrales actuales:

| Frecuencia | Atención | Riesgo alto | Crítico |
|---|---:|---:|---:|
| Diario | 3 días | 7 días | 14 días |
| Semanal | 9 días | 16 días | 30 días |
| Mensual | 35 días | 45 días | 75 días |

También existe una señal de posible pérdida desde 90 días sin abono, como alerta administrativa y no como castigo contable automático.

## 3. Alertas dentro del panel

El panel `/dashboard/alertas` quedó organizado por ruta:

- al entrar desde una ruta se muestran primero sus alertas;
- se puede cambiar a la vista global de las rutas administradas;
- una venta permanece como una sola alerta activa, aunque el panel se consulte varias veces;
- si la venta vuelve a estar al día, la alerta desaparece;
- el umbral se recalcula con los abonos y fallas reales;
- una falta de pago aislada no se interpreta automáticamente como pérdida si el cliente compensa después con dos cuotas.

El Centro de anomalías muestra exposición deteriorada, créditos sin primer abono cuando ya corresponde, créditos críticos, saldos altos expuestos y diferencias de caja. Las diferencias son señales para revisar; no bloquean operaciones ni declaran una pérdida automáticamente.

## 4. Telegram y reportes diarios

Telegram operativo está limitado al usuario `cavb1205` y a sus rutas administradas. No se mezclan rutas de otros usuarios.

La política actual es:

- no enviar una notificación individual por cada falla de no pago o cierre ausente;
- guardar y mostrar esas señales en el panel;
- enviar en el reporte consolidado las excepciones importantes y los umbrales de riesgo;
- mantener separadas las dos comunicaciones:
  - **Resumen de membresías:** estado de suscripciones, actividad e ingresos de membresías;
  - **Resumen de cartera:** cobro programado, recaudo, pendientes, fallas, cierres y riesgos por ruta.

El cron de producción quedó configurado a las **08:00 de `America/Santiago`**. El comando usa la fecha local de Chile y reporta la jornada anterior, evitando que el reloj UTC del servidor cierre el día antes de tiempo.

Comando:

```bash
python manage.py mantenimiento_membresias
```

El 7 de agosto de 2026 se ejecutó manualmente para validar el reporte del 6 de agosto. Terminó correctamente: envió ambos reportes, procesó 5 rutas, registró 6 alertas nuevas de riesgo y detectó 5 cierres ausentes.

## 5. Despliegue y repositorios

- Frontend: `https://app.carterafinanciera.com`.
- Frontend en GitHub: `cavb1205/gestion-financiera`, rama `main`.
- Vercel está conectado al repositorio; cada push a `main` inicia el despliegue automático.
- Último commit frontend relacionado: `06ed36c`.
- Backend en GitHub: `cavb1205/sellsystem`, rama `main`.
- Último commit backend: `cd7fadf`.
- Backend publicado en `https://api.carterafinanciera.com` y Gunicorn recargado después de los cambios.
- Verificaciones realizadas: `manage.py check`, `npm run lint` y `npm run build` correctos.

Antes de actualizar el backend se conservan respaldos remotos en `.deploy-backups`.

## 6. Siguiente punto recomendado

El siguiente paso es convertir el Centro de anomalías en un flujo de investigación y seguimiento, sin generar ruido:

1. historial de revisiones por anomalía;
2. nota administrativa y acción acordada;
3. responsable y fecha de próxima gestión;
4. estados `pendiente`, `en gestión`, `resuelta` y `descartada`;
5. filtros por ruta, trabajador, severidad y antigüedad;
6. detección de renovaciones o refinanciaciones repetidas.

La meta es que el administrador pueda pasar de “hay una señal rara” a “esta persona debe ser contactada por X motivo, por un monto de Y, antes de Z fecha”, conservando el historial de lo realizado.

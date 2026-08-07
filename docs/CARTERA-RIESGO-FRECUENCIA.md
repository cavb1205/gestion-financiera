# Cartera: seguimiento por frecuencia y riesgo

Estado: implementado y desplegado el 5 de agosto de 2026.

Esta documentación resume la primera etapa de mejoras para que el administrador pueda detectar a tiempo clientes atrasados, sin depender de abrir el detalle de cada crédito.

## Objetivo

La cartera ahora separa dos señales distintas:

1. **Prioridad de cobranza:** qué cliente debe gestionarse hoy.
2. **Deterioro:** qué crédito está aumentando su probabilidad de pérdida y requiere una acción administrativa.

Esto evita usar un único umbral de 15 días para todos los créditos. Un crédito diario, semanal y mensual no puede medirse con la misma regla.

## Frecuencias y umbrales

| Frecuencia | Intervalo | Atención | Riesgo alto | Crítico |
|---|---:|---:|---:|---:|
| Diario | 1 día | 3 días | 7 días | 14 días |
| Semanal | 7 días | 9 días | 16 días | 30 días |
| Mensual | 30 días | 35 días | 45 días | 75 días |

Los umbrales de deterioro se calculan según los **días desde el último abono real**, excluyendo registros técnicos de renovación. Los créditos sin primer abono también son detectables: no esperan a acumular 15 días para aparecer como una gestión pendiente.

Existe además un candidato a castigo cuando alcanza 90 días sin abono, sin reemplazar todavía el proceso contable o administrativo de castigo.

## Prioridad operativa

La prioridad que aparece en las listas sigue esta lógica:

- **Al día / Vigilar:** no requiere presión inmediata.
- **Gestionar hoy:** ya venció el ciclo esperado o no tiene el primer abono cuando ya correspondía.
- **Urgente:** acumula varios ciclos o superó el umbral de atención.
- **Crítico:** superó el umbral crítico de su frecuencia.

El orden de ventas activas es:

1. Prioridad de cobranza, de mayor a menor.
2. Más días desde el último abono real.
3. Más cuotas atrasadas.
4. Crédito más reciente como desempate técnico.

En **Liquidar** se conserva deliberadamente el orden original por antigüedad del crédito. Los clientes que ya abonaron en el día siguen desapareciendo de esa lista, para que el trabajador vea únicamente lo pendiente de pasar.

## Datos visibles sin abrir el detalle

### Ventas activas

La lista muestra, entre otros datos:

- estado y prioridad de cobranza;
- frecuencia del crédito;
- fecha y días desde el último abono real;
- cuotas atrasadas;
- monto para ponerse al día;
- saldo actual;
- contacto y acciones principales.

Los filtros permiten separar gestión del día, urgentes, créditos con días sin abono y créditos con cuotas vencidas. El filtro de “por vencer” usa un máximo de tres cuotas pendientes.

### Liquidar

La lista muestra:

- días desde el último abono real;
- cuotas atrasadas;
- monto para ponerse al día;
- frecuencia;
- señales de prioridad y deterioro;
- teléfono y WhatsApp como iconos, sin ocupar la columna con el número completo.

El seguimiento permanece debajo de cada línea para evitar que la tabla se vuelva demasiado ancha en escritorio.

## Cálculos importantes

- **Días sin abono:** se calculan contra el último abono real; si nunca ha abonado, se cuentan desde la fecha de venta.
- **Cuotas atrasadas:** se calculan con el intervalo de la frecuencia. Si aún no existe un primer abono real, se estima el número de ciclos vencidos con los días transcurridos.
- **Monto para ponerse al día:** cuotas atrasadas multiplicadas por el valor de la cuota, limitado al saldo actual. Por eso nunca debe mostrar un valor superior al saldo; por ejemplo, con saldo de `$80`, el atraso máximo visible será `$80`.
- **Créditos adelantados:** no se marcan como atrasados solo porque hayan pasado días si el cliente tiene pagos suficientes registrados.

El backend es la fuente principal del riesgo cuando entrega `riesgo_cartera`. El frontend conserva un cálculo de respaldo para no romper la visualización con payloads antiguos o durante una actualización gradual.

## Nueva venta y permisos

El formulario de nueva venta ya incluye la frecuencia de pago:

- **Diario** es el valor predeterminado.
- El trabajador no puede cambiar la frecuencia y siempre opera con Diario.
- Solo un administrador puede seleccionar Diario, Semanal o Mensual.
- La fecha de vencimiento se recalcula con la frecuencia seleccionada.

La misma regla se aplica en el backend, de modo que no depende únicamente de ocultar un campo en la interfaz.

## Archivos principales modificados

Frontend:

- `app/utils/cartera.js`: intervalos, umbrales, prioridades y cálculos compartidos.
- `app/dashboard/ventas/nueva/page.js`: frecuencia y permisos en nueva venta.
- `app/dashboard/ventas/page.js`: indicadores, filtros y orden de ventas activas.
- `app/dashboard/liquidar/page.js`: indicadores y orden operativo de liquidación.
- `app/dashboard/liquidar/abonar/page.js`: cuotas atrasadas en el flujo de abono.
- `app/dashboard/page.js`: resumen de riesgo en el dashboard.
- `app/dashboard/reportes/cartera/page.js`: reporte por cuotas y frecuencia.

Backend:

- `Ventas/riesgo.py`: regla central de frecuencia, vencimiento y riesgo.
- `Ventas/views.py`: normalización, permisos, anotaciones y fechas de vencimiento.
- `Ventas/serializers.py`: exposición de `riesgo_cartera` en las listas.
- `Ventas/models.py`: cálculo de pagos reales y días sin abono.
- `Clientes/views.py`, `Recaudos/views.py`, `Tiendas/alertas_operativas.py` y `Tiendas/telegram_assistant.py`: alineación con la regla compartida.

## Despliegue y verificación

- Frontend publicado en [app.carterafinanciera.com](https://app.carterafinanciera.com).
- Backend actualizado en la instancia de producción de `api.carterafinanciera.com`.
- Se creó respaldo remoto previo del backend en:
  `/home/cavb1205/sellsystem/.deploy-backups/20260805-frecuencia-riesgo`
- Backend: `manage.py check` correcto y no había migraciones pendientes.
- Frontend: `npm run lint` correcto, con advertencias de hooks ya existentes.
- Frontend: `npm run build` correcto.
- Verificación adicional: frontend respondió HTTP 200 y Gunicorn quedó ejecutándose.

## Centro de anomalías: primera versión

Implementado en el frontend el 6 de agosto de 2026 dentro de `/dashboard/alertas`. Esta primera versión reutiliza los endpoints existentes y no crea registros ni bloquea operaciones.

El panel administrativo ahora muestra:

- saldo total de créditos con deterioro;
- créditos sin primer abono cuando ya correspondía iniciar el cobro;
- créditos críticos y candidatos a posible pérdida por 90 o más días;
- los seis créditos con mayor saldo expuesto;
- conciliación de caja por ruta cuando existen cierres consecutivos, comparando saldo esperado contra saldo cerrado.

Si alguna ruta no responde, el panel lo informa como información incompleta y no presenta ese cero como ausencia de riesgo. Las diferencias de caja son señales para revisión, no declaraciones automáticas de pérdida.

La primera versión ya fue desplegada en producción. Como refinamiento, el centro web quedará abierto por defecto en la ruta activa del administrador; “Todas mis rutas” será una vista global opcional. Telegram conserva el consolidado de todas las rutas administradas por `cavb1205`.

## Siguiente refinamiento de la lista

El siguiente refinamiento será convertir las señales calculadas en un flujo más completo de investigación: historial de revisiones, notas administrativas, filtros por trabajador/ruta y detección de renovaciones o refinanciaciones repetidas.

El Centro de anomalías no reemplaza las listas operativas. Debe responder rápidamente: **qué está raro, cuánto dinero está expuesto, desde cuándo y cuál es la acción sugerida**.

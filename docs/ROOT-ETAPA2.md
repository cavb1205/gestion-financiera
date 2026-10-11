# Panel root — etapa 2: estados fiables y conciliación

Documento interno, 11-10-2026. Continúa la etapa 1 (`bdab5794f7533256806ae659761b6a8ad9b7b768`); no agrega funciones root a la guía pública ni modifica Liquidar.

## Operación

- Las seis pantallas separan carga, error y vacío real. Ante un fallo aparece un aviso persistente con Reintentar; no se muestran ceros engañosos ni formularios sensibles como si hubieran cargado. Las respuestas antiguas no sustituyen una lectura más reciente.
- Rutas distingue Pre-activada (acceso temporal, pago por verificar) de Activa. Usa la fecha temporal y el calendario de la ruta; conserva las reglas de gracia y bloqueo. Incluye filtro y corrige la página al reducirse los resultados.
- Conciliación permite consultar 30, 90 o 365 días de confirmadas, vencidas con comprobante y rechazadas/revertidas. Las pendientes se muestran independientemente del período.
- Confirmar exige verificar ingreso bancario e importe; no basta la imagen o el monto detectado. Las solicitudes antiguas sin precio conservado requieren introducir el importe comprobado. Se informa el efecto previsto en la vigencia y el servidor lo recalcula al guardar.
- Rechazar y revertir tienen textos distintos y motivo obligatorio. Revertir anula el ingreso y restaura la suscripción cuando corresponde; no realiza un reembolso. La respuesta muestra el estado real resultante y conserva los controles de cambios posteriores de la etapa 1.
- Un pago vencido requiere la acción explícita Revisar excepción, verificación bancaria y motivo. Telegram no puede usar esta excepción. No se cambió la regla existente de plazo: tres días desde la creación de la solicitud, o fin de preactivación cuando corresponda.
- Cuenta bancaria exige los cuatro campos completos, revisión antes/después, motivo y versión. Dos sesiones no pueden sobrescribirse silenciosamente. Cuenta y precios tienen bitácora privada con actor, fecha y valores anteriores/nuevos (últimos 20 cambios mostrados).
- Las solicitudes nuevas conservan la cuenta informada, además del precio acordado. Las antiguas sin cuenta conservada se identifican como tales y piden consultar soporte; no se les atribuye retroactivamente la cuenta actual.
- Después de un error de escritura o respuesta perdida se debe recargar para comprobar el estado, sin reintentar automáticamente. Hay protección inmediata contra doble envío. Los modales conservan el foco al escribir, permiten teclado y desplazan el contenido en móvil.

## Verificación local

```sh
node --test app/utils/rootSubscriptions.test.mjs
npx eslint app/dashboard/admin app/dashboard/membresias/page.js app/components/ConfirmModal.js
NEXT_PUBLIC_API_URL=https://api.carterafinanciera.com npm run build
```

Pruebas de integración (Playwright y Chrome; `PLAYWRIGHT_MODULE`, `CHROME_PATH` y `ROOT_EVIDENCE` opcionales):

1. Servir el build en 127.0.0.1:3039.
2. En el backend ejecutar `ROOT_ETAPA2=1 python3 ops/prueba_root_local.py` (SQLite en memoria, 3041).
3. Ejecutar `node tests/root-estados-browser.cjs`.
4. Reiniciar la API sin ROOT_ETAPA2 y ejecutar `node tests/root-integridad-browser.cjs`.

Los scripts interceptan el host API hacia loopback y bloquean otros hosts externos. Solo usan datos ficticios. Resultado: 6 pruebas unitarias correctas; 12 recuperaciones de errores de lectura en escritorio/móvil; excepción y reversión, dos sesiones de cuenta, respuesta perdida, teclado, preactivación y reducción simulada de resultados correctas. Cinco escrituras ficticias de etapa 2 y ocho en la regresión de etapa 1; cero errores JS; caja, saldo, clientes y recaudos conservados.

Build correcto; avisos previos de hooks en páginas ajenas al alcance permanecen. Backend: 159 pruebas correctas y migración 0027 → 0028 verificada con historia ficticia. Esto no certifica concurrencia o carga bajo PostgreSQL ni la operación real del bot.

## Publicación pendiente

Rama `codex/root-etapa2-estados` basada en etapa 1, sin merge a main ni despliegue. Backend y migraciones 0027/0028 deben estar publicados antes del frontend; los navegadores antiguos deben recargar. Exige autorización de despliegue y verificar ambos commits en GitHub.

No incluye la etapa 3: métricas comerciales comparables/cohortes, optimización de consultas, búsquedas/exportación y navegación. Los GET del backend todavía normalizan vencimientos; no se probaron contra datos reales.

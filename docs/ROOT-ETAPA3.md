# Panel root — gestión e indicadores (etapa 3)

Documento interno, 11-10-2026. Base frontend publicada: `1f40d5439cebfa755b48905587fcebd114e49a75`; base backend: `0535d81ca56544eeb497ea8f75e5f260fa2b80ba`. Rama `codex/root-etapa3-gestion`. No modifica Liquidar ni la guía pública. No autoriza despliegue.

## Interpretación y operación

- Registrado este mes: pagos vigentes del libro hasta el corte, excluyendo fechas futuras y anulados. No es utilidad ni certificación bancaria. Las activaciones manuales también son registros; el número de pagos no se llama renovaciones.
- Comparación mensual: mismos días transcurridos del mes actual y anterior, limitados por el mes más corto. Ejemplo 31 de marzo: comparación 1–28 de marzo vs 1–28 de febrero; el total real de marzo sigue incluyendo el 29–31. Ambos rangos e importes quedan visibles. Sin importe anterior positivo se muestra sin base de comparación.
- Comparación anual: año actual hasta la misma fecha del anterior; años terminados completos. El 29 de febrero se limita al 28 en ambos períodos comparados. La tendencia marca el mes actual como parcial.
- Proyección mensual: tarifas actuales de rutas activas no archivadas de pago, anual/12. No es efectivo, ingreso recibido, tarifa histórica contratada ni beneficio. Cambiar un precio puede cambiar esta proyección sin cambiar el libro.
- Suspensiones manuales del mes: eventos fechados existentes, separados del número de rutas distintas. Vencidas sin primer pago es un estado actual, no un historial de pérdidas. No se estima un historial de bloqueos automáticos desde las fechas de vencimiento actuales.
- Primer pago por mes de registro: seis cohortes de rutas existentes, incluidas archivadas. Primer pago positivo vigente de plan Mensual/Anual en días 0–29 desde registro; las rutas sin 30 días completos quedan en observación, fuera del denominador. No supone que toda ruta tuvo prueba gratuita; no reconstruye rutas eliminadas ni acredita transferencia bancaria. Anulaciones pueden cambiar el resultado porque se usa el libro vigente.
- Rutas, ingresos y conciliación buscan por ruta, administrador completo, @usuario e ID; las dos últimas también por código, y conciliación por referencia bancaria. Tolera tildes y mayúsculas. Un administrador sin nombre se identifica por su usuario.
- Ingresos permite mes con selector accesible y consulta opcional de anulados con motivo; los filtros y el CSV no cambian los totales ni el gráfico. Conciliación muestra visibles de totales, sin anunciar todo al día al ocultar pendientes con un filtro. Conserva las confirmaciones y verificaciones de etapa 2.
- CSV exporta las coincidencias cargadas (en rutas, todas las páginas del filtro). Incluye estados y administrador. Celdas externas que podrían ser fórmulas se neutralizan; no se exportan imágenes de comprobantes.
- Solo una sección root activa del menú, también en móvil, identificada con `aria-current`. El menú móvil incluye cierre accesible dentro del panel y permite Escape; el botón superior queda cubierto por la capa del menú abierto.

## Verificación

```sh
node --test tests/*.test.mjs tests/*.test.js app/utils/rootSubscriptions.test.mjs
npx eslint app/dashboard/admin app/dashboard/layout.js app/utils/rootReports.mjs
NEXT_PUBLIC_API_URL=https://api.carterafinanciera.com npm run build
```

Backend local: settings aislados, SQLite en memoria y red externa prohibida. Para integración: build en 127.0.0.1:3039; API ficticia `ROOT_ETAPA3=1 python3 ops/prueba_root_local.py` en 3041; `node tests/root-reportes-browser.cjs`. Variables opcionales `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `ROOT_EVIDENCE`. El script intercepta TODAS las llamadas del navegador a la API hacia loopback y rechaza escrituras; nunca ejecutar la fixture como servicio de producción. Sin la URL pública de compilación, el frontend no puede cargar el contrato esperado de las pruebas.

Resultado: 177 pruebas backend (18 nuevas); 37 unitarias frontend (3 nuevas); build y ESLint del alcance correctos. Integración nueva en escritorio/móvil: comparaciones, cohortes, búsqueda, anulados, CSV seguro, navegación y cero escrituras/errores JS. Regresiones previas: estado de error, excepción/reversión, respuesta perdida, paginación, precio congelado, archivado y borrado protegido. Caja/cartera/clientes/recaudos ficticios conservados. Los avisos de hooks anteriores en páginas ajenas permanecen.

## Límites y publicación

Los GET de resumen, listado y revisión todavía pueden normalizar vencimientos. Se evita abrir consultas/bloqueos por cada ruta sana; las candidatas se vuelven a comprobar bajo el bloqueo existente. No es una certificación de lectura pura ni de concurrencia PostgreSQL/carga real. El endpoint de listado histórico, sin `vista=lista`, conserva su serialización y no recibe esta optimización completa.

Quedan separados para una mejora posterior: eventos automáticos de bloqueo con causas fiables, mantenimiento de estados fuera de los GET, métricas de abandono/retenido basadas en esa historia, y modo de consulta operativo root. No se hace backfill inventado de fechas, pruebas, cuentas o transferencias.

Sin migraciones nuevas. Cuando el usuario autorice publicar, verificar ambos commits en GitHub, publicar backend antes del frontend y recargar sesiones; usar exclusivamente esos commits. No desplegar los workspaces originales sucios. Credenciales, clientes, comprobantes y configuración real quedan fuera de GitHub.

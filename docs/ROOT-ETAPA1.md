# Panel root — etapa 1

Implementación interna del 11-10-2026 sobre `4e8c24ae3db27af4489eb88b01099c913f6d3cbc`.
No se agrega contenido root a la guía pública.

- El botón de eliminar depende de `puede_eliminar === true` del backend, no de contar
  solo clientes/ventas. “Sin cartera” no significa “sin historial”. Confirmación
  explica que el servidor revalida la política antes del borrado definitivo.
- El panel general usa el rol `is_superuser`, no el nombre de usuario, para salir
  de una ruta al entrar al modo administración.
- Guardar precios envía versión por plan y solo los cambios. Campo vacío no equivale
  a cero; un plan gratuito requiere escribir 0. Guardado en curso impide doble envío.
  Tras error o respuesta perdida se exige recargar antes de volver a guardar.
- Archivar/restaurar envía versión y evita doble envío inmediato. Tras conflicto
  se recarga para mostrar la situación real; no se reintenta automáticamente el POST.
- Conciliación muestra la cotización congelada. Una solicitud histórica sin monto
  guardado exige revisar comprobante/ingreso bancario e introducir el importe antes
  de habilitar Confirmar. Las acciones se acomodan también en pantallas pequeñas.
- La pantalla pública de membresía muestra “Monto por verificar” y ayuda de soporte
  cuando corresponde; nunca presenta NULL como un pago de cero.

## Comprobación

Build de Next.js correcto, ESLint sin avisos en las cinco páginas modificadas y
`git diff --check` correcto. El build conserva avisos de hooks previos en páginas
ajenas a esta etapa; no se corrigieron cambiando operaciones fuera del alcance.

Integración real local: `tests/root-integridad-browser.cjs` contra la API de pruebas
`ops/prueba_root_local.py` del backend y la compilación servida en 127.0.0.1:3039.
Configurar `NEXT_PUBLIC_API_URL=https://api.carterafinanciera.com` al compilar: el
script intercepta ese host hacia loopback y bloquea otros hosts externos.

```sh
node tests/root-integridad-browser.cjs
```

Playwright instalado; `PLAYWRIGHT_MODULE` y `CHROME_PATH` opcionales para runtimes
externos. `ROOT_EVIDENCE` opcional guarda capturas exclusivamente de datos ficticios.
Verifica escritorio/móvil, botones no recortados, borrado protegido, conflicto de
archivado, importe antiguo, dos sesiones de precios y respuesta perdida después
del guardado. Ocho escrituras en SQLite, cero errores JS, caja/saldo/clientes/recaudos
conservados. Backend: 144 pruebas correctas y migración 0027 verificada en memoria.

## Estado de entrega

Rama `codex/root-etapa1-seguridad`, sin merge a main ni despliegue de producción.
La publicación exige autorización, commits de ambos repositorios en GitHub y
coordinación con migración 0027; versiones antiguas de la interfaz deben recargarse.
Las siguientes etapas del informe de auditoría no se incluyen en estos cambios.

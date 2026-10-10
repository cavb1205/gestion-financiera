# Orden de visita — etapa 1

En Liquidar, **Organizar recorrido** permite al administrador o trabajador autorizado ordenar los clientes de su ruta. El orden es compartido y permanente, no una prioridad financiera ni una obligación de visitar clientes que no deben pagar hoy.

## Uso

1. Buscar por nombre, apellido o dirección.
2. Usar Subir/Bajar, Al inicio o Antes/después (con búsqueda de la referencia).
3. Guardar cambios para aplicar el recorrido a toda la ruta; Cancelar descarta la edición.

El organizador incluye todos los clientes con créditos activos, no solamente los visibles en la fecha o página de Liquidar. Liquidar conserva los calendarios y anticipos existentes; se ordena la misma colección antes de paginar. No se escriben créditos, clientes, recaudos, fallas, caja ni calificaciones.

## Contrato

`GET /tiendas/recorrido/t/{tienda_id}/` no escribe. Devuelve `tienda`, `configurado`, `version`, `actualizado_en`, `actualizado_por` y `clientes` (`id`, nombres, apellidos, dirección).

`PUT` al mismo endpoint recibe `{version, clientes: [id, ...]}`. La lista debe contener una vez cada cliente con crédito activo de esa ruta. Valida el acceso operativo existente. Guarda atómicamente el recorrido y una auditoría con autor, momento y orden anterior/nuevo.

- HTTP 409: versión o clientes activos cambiaron. No sobrescribe; recargar antes de editar de nuevo.
- HTTP 400: lista inválida, duplicada o con clientes ajenos.
- HTTP 403: ruta no autorizada.
- Fallo de conexión: no mostrar éxito; conservar la edición para reintentar.

Sin configuración, el listado sigue exactamente como antes. Tras guardar, agrupa créditos del mismo cliente conservando su orden interno. Nuevos clientes sin posición se agregan al final, ordenados por su primera venta activa. Las posiciones guardadas de clientes temporalmente sin crédito activo se conservan; una renovación del mismo cliente recupera esa posición. El organizador no permite editar desde una vista previa futura de Liquidar.

## Entrega y pruebas

Backend requiere migración `Tiendas.0025_orden_visita`, que únicamente crea las tablas del recorrido y su auditoría. No hace backfill ni reescribe información financiera. Publicar backend/migración antes que frontend, desde commits verificados en GitHub, cuando el usuario autorice el despliegue.

Pruebas frontend: `node --experimental-default-type=module --test tests/recorrido.test.mjs`.

Pruebas Django aisladas: `python3 manage.py test Tiendas.test_orden_visita Ventas.test_calendario --settings=sell_system.settings_pruebas_reportes`.

Prueba integrada local: iniciar `ops/prueba_recorrido_local.py` en el backend (SQLite en memoria, puerto 3040), iniciar el build frontend en puerto 3039 con `NEXT_PUBLIC_API_URL=https://api.carterafinanciera.com` y ejecutar `tests/recorrido-browser.cjs`. Playwright intercepta todas las llamadas de API y deriva únicamente recorrido/Liquidar a la API local; las demás se sustituyen por datos ficticios y el resto de la red se bloquea. No se conecta a producción. Opcionalmente definir `PLAYWRIGHT_MODULE` y `CHROME_PATH` según el entorno.

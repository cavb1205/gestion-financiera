# Orden de visita — etapas 1 y 2

En Liquidar, **Organizar recorrido** permite al administrador o trabajador autorizado ordenar los clientes de su ruta. El orden es compartido y permanente, no una prioridad financiera ni una obligación de visitar clientes que no deben pagar hoy.

## Uso

1. Buscar por nombre, apellido o dirección.
2. Arrastrar desde el asa junto al número de un cliente. La línea indica si quedará antes o después del cliente de referencia. Soltar actualiza únicamente el borrador.
3. También se pueden usar Subir/Bajar, Al inicio o Antes/después (con búsqueda de la referencia).
4. Guardar cambios para aplicar el recorrido a toda la ruta; Cancelar descarta la edición.

## Arrastrar y soltar — etapa 2

- Compatible con ratón y eventos táctiles. Solo el asa captura el gesto; deslizar desde el nombre o dirección conserva el desplazamiento normal en celular.
- Un toque/clic sin movimiento no cambia posiciones. El gesto se activa tras mover al menos 6 píxeles.
- La tarjeta de origen se resalta, aparece una etiqueta junto al puntero y una línea marca el destino. Cerca de los bordes del área desplazable, la lista avanza automáticamente.
- Soltar fuera de las filas, Escape, interrupción del gesto o pérdida de foco cancela ese movimiento. Escape durante un arrastre mantiene abierto el organizador.
- Arrastrar con búsqueda activa ubica al cliente respecto de una referencia visible dentro del recorrido completo; no elimina clientes ocultos ni altera su orden relativo.
- Para distancias largas: cargar más filas con «Mostrar 25 más» antes de arrastrar, o usar «Antes / después». No se cargan clientes adicionales automáticamente durante el gesto.
- Sobre el asa enfocada, las flechas arriba/abajo mueven un puesto. Los botones siguen disponibles como alternativa accesible.
- Guardar está deshabilitado durante el arrastre. Soltar no realiza solicitudes de escritura; persisten las mismas validaciones de versión, permisos y reintento de la etapa 1.
- Esta etapa solo modifica el frontend: no requiere nuevas migraciones ni cambios en el contrato API.

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

Pruebas frontend: `node --experimental-default-type=module --test tests/recorrido.test.mjs tests/arrastre-recorrido.test.mjs`.

Pruebas Django aisladas: `python3 manage.py test Tiendas.test_orden_visita Ventas.test_calendario --settings=sell_system.settings_pruebas_reportes`.

Prueba integrada local: iniciar `ops/prueba_recorrido_local.py` en el backend (SQLite en memoria, puerto 3040), iniciar el build frontend en puerto 3039 con `NEXT_PUBLIC_API_URL=https://api.carterafinanciera.com` y ejecutar `tests/recorrido-browser.cjs`. Playwright intercepta todas las llamadas de API y deriva únicamente recorrido/Liquidar a la API local; las demás se sustituyen por datos ficticios y el resto de la red se bloquea. No se conecta a producción. Opcionalmente definir `PLAYWRIGHT_MODULE` y `CHROME_PATH` según el entorno.

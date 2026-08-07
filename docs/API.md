# API Reference — Cartera Financiera (sell_system)

Documentación completa de la API REST (Django REST Framework) que consume esta app.

- **Backend**: `/Users/camilo/Documents/django_projects/sellsystem`
- **Producción**: `https://api.carterafinanciera.com`
- **Variable de entorno del frontend**: `NEXT_PUBLIC_API_URL`
- **Generada desde el código fuente** (urls.py + views.py + serializers.py + models.py) el 2026-07-18.

---

## 1. Información general

### Autenticación

JWT (`djangorestframework-simplejwt`). Todas las peticiones autenticadas llevan:

```
Authorization: Bearer <access_token>
```

| Parámetro | Valor |
|-----------|-------|
| `ACCESS_TOKEN_LIFETIME` | 60 minutos |
| `REFRESH_TOKEN_LIFETIME` | 60 minutos |
| `ROTATE_REFRESH_TOKENS` | `False` |
| Algoritmo | HS256 |
| Header | `Bearer` |

> ⚠️ El refresh token dura lo mismo que el access token (60 min). Por eso el frontend refresca proactivamente a los ~55 minutos: si se deja expirar, no hay forma de recuperar la sesión sin volver a hacer login.

**Permisos por defecto**: `IsAuthenticated` sobre toda la API. Los únicos endpoints públicos son `POST /login/`, `POST /register/` y `POST /tiendas/telegram/webhook/` (este último valida un secreto por header).

### Throttling

Solo en los dos endpoints públicos sensibles, keyeado por la IP real (`X-Real-IP`, inyectada por nginx):

| Endpoint | Límite |
|----------|--------|
| `POST /login/` | 20/min por IP |
| `POST /register/` | 10/hora por IP |

El cache es `LocMemCache` por worker de gunicorn, así que el límite efectivo es ~3× el declarado.

### CORS

En producción se permiten: `app.carterafinanciera.com`, `carterafinanciera.com`, `www.carterafinanciera.com` y cualquier `*.vercel.app` (preview deployments).

---

## 2. Convenciones transversales

### 2.1 El sufijo `/t/<tienda_id>/`

Casi todos los endpoints existen en dos variantes:

- **Sin `tienda_id`** — opera sobre la ruta del perfil del usuario autenticado (`request.user.perfil.tienda`).
- **Con `/t/<tienda_id>/`** — opera sobre la ruta indicada. Se usa cuando un admin maneja varias rutas o cuando el root impersona una.

Cuando la URL trae `tienda_id`, el decorador `@requiere_acceso_tienda` verifica la propiedad y devuelve **403** si el usuario no tiene relación con esa ruta.

### 2.2 Respuestas vacías (¡importante para el frontend!)

Los endpoints de listado **no devuelven `[]` cuando no hay datos**. Devuelven `200 OK` con un objeto:

```json
{ "message": "No se han creado clientes" }
```

El frontend debe verificar `Array.isArray(data)` antes de iterar. Esto aplica a todos los `list_*` de Clientes, Ventas, Recaudos, Gastos, Aportes, Utilidades, Trabajadores y Cierres de caja. Las excepciones son Publicidad y `GET /tiendas/list/tiendas/admin/`, que sí devuelven `[]`.

### 2.3 Formato de errores

No hay un formato único. Conviven tres:

| Origen | Forma | Ejemplo |
|--------|-------|---------|
| Vistas manuales | `{"message": "..."}` | `{"message": "No se encontró la venta"}` |
| Vistas nuevas / permisos | `{"error": "..."}` | `{"error": "No tiene permiso para acceder a los datos de esta ruta."}` |
| Serializers de DRF | `{"<campo>": ["..."]}` | `{"identificacion": ["Ya existe un cliente..."]}` |

Por eso el frontend usa `getApiError()` de `app/utils/api.js` en todas las ramas de error.

### 2.4 Códigos de estado

Algunas vistas devuelven códigos poco convencionales — no asumir semántica estándar:

- `200 OK` se usa también para "no hay datos" e incluso para errores de negocio (p. ej. `202` al intentar borrar un cliente con ventas).
- `400` es el error genérico, incluyendo "no encontrado" en la mayoría de vistas antiguas.
- `404` solo lo devuelven las vistas nuevas (renovar, score, membresías, publicidad).
- `403` = sin permiso sobre la ruta o rol insuficiente.
- `406` al borrar una venta con pagos; `409` en conflictos de estado (renovar, membresías).

### 2.5 Fechas

- Los parámetros de fecha en URL son siempre `YYYY-MM-DD`.
- Los campos son `DateField` (sin hora, sin zona horaria).
- ⚠️ En el frontend, `new Date("YYYY-MM-DD")` se interpreta como UTC y muestra el día anterior en zonas UTC-5. Usar siempre `parseLocalDate()` / `formatDate()` de `app/utils/format.js`.

### 2.6 Dinero

`DecimalField` en el backend, serializado como **string** en JSON (`"150000.00"`). El frontend debe convertir con `Number()` antes de operar. Formateo con `formatMoney()` (locale genérico, sin decimales, multi-país).

---

## 3. Modelo de permisos

Definido en `Tiendas/permissions.py`.

### Roles

| Rol | Marca | Alcance |
|-----|-------|---------|
| **root** | `is_superuser=True` (username `root`) | Todo. Panel de administración, membresías, impersonación de rutas |
| **admin de ruta** | `is_staff=True` | CRUD completo sobre sus rutas, incluida la nómina de trabajadores |
| **cobrador / trabajador** | ninguna marca | Operación diaria de su ruta. **No** puede gestionar trabajadores |

> Corregido en 2026-06-13: el registro creaba superusuarios por error. Hoy `register_user` fuerza `is_staff=True, is_superuser=False`.

### `usuario_puede_acceder_tienda(user, tienda_id)`

Devuelve `True` si el usuario:
1. es root (`is_superuser`), **o**
2. es el `Tienda.administrador` dueño de la ruta, **o**
3. tiene una fila en `Tienda_Administrador` para esa ruta, **o**
4. su `Perfil.tienda_id` coincide con la ruta.

Se aplica de dos formas:
- `@requiere_acceso_tienda` — decorador para vistas con `tienda_id` en la URL.
- Llamada directa contra `objeto.tienda_id` — en vistas que reciben `pk` de un recurso.

---

## 4. Autenticación

### `POST /login/`
Público. Throttle 20/min por IP.

**Body**
```json
{ "username": "cobrador1", "password": "secreto123" }
```

**200**
```json
{
  "token": "<access JWT>",
  "refresh": "<refresh JWT>",
  "user": { "id": 12, "username": "cobrador1", "first_name": "...", "is_staff": false, "...": "campos completos de auth.User" },
  "perfil": { "id": 8, "trabajador": "Juan Pérez", "identificacion": "...", "telefono": "...", "direccion": "...", "tienda": 3 },
  "membresia": null
}
```

`membresia` es el retorno de `comprobar_estado_membresia()`, que recalcula el estado de la suscripción como efecto secundario y **devuelve `None`** — el valor no es útil, el estado real se consulta en `/tiendas/detail/`.

**Errores**
| Código | Cuerpo | Causa |
|--------|--------|-------|
| 400 | `{"error": "Usuario o contraseña incorrectos."}` | Credenciales inválidas |
| 400 | `{"error": "Tu usuario no tiene un perfil de ruta asociado. Contacta al soporte."}` | `User` sin `Perfil` |
| 403 | `{"error": "Tu cuenta está desactivada. Contacta al administrador de tu ruta."}` | Contraseña correcta pero `is_active=False` |

### `POST /register/`
Público. Throttle 10/hora por IP. Crea usuario + ruta + trial de 7 días y devuelve sesión iniciada (auto-login).

**Body**
```json
{
  "username": "nuevoadmin",
  "password": "minimo8chars",
  "first_name": "Ana",
  "last_name": "Gómez",
  "nombre_ruta": "Ruta Centro",
  "telefono": "3001234567"
}
```

**Efectos**: crea `User` (`is_staff=True`, email autogenerado `<username>@carterafinanciera.com`), `Tienda`, `Cierre_Caja` de ayer con la caja inicial, `Tienda_Membresia` plan *Prueba* con vencimiento a 7 días, `Tienda_Administrador` y `Perfil`. Envía alerta de nuevo usuario por Telegram.

**200**: misma estructura que `/login/`.
**400**: `{"error": "La contraseña debe tener al menos 8 caracteres."}` o errores del serializer (p. ej. username duplicado).

### `POST /token/refresh/`
**Body**: `{ "refresh": "<refresh JWT>" }` → **200**: `{ "access": "<nuevo access JWT>" }`

### `POST /token/`
`TokenObtainPairView` estándar de simplejwt. No se usa desde la app (usa `/login/`, que además devuelve perfil).

---

## 5. Tiendas (rutas)

### 5.1 Consulta y gestión

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| GET | `/tiendas/detail/` | autenticado | Ruta del usuario + membresía + **todos los KPIs** |
| GET | `/tiendas/detail/admin/<pk>/` | acceso a la ruta | Igual, para una ruta específica |
| GET | `/tiendas/list/` | root | Todas las membresías/rutas del sistema |
| GET | `/tiendas/list/admin/` | `is_staff` | Rutas donde el usuario es `administrador` |
| GET | `/tiendas/list/tiendas/admin/` | `is_staff` | Rutas vía `Tienda_Administrador` (devuelve `[]` si no hay) |
| POST | `/tiendas/create/` | autenticado | Crear ruta |
| PUT | `/tiendas/<pk>/update/` | acceso a la ruta | Actualizar ruta |
| PATCH | `/tiendas/<pk>/settings/` | acceso a la ruta | Ajustes puntuales |
| DELETE | `/tiendas/<pk>/delete/` | **root** | Eliminar ruta (sin validaciones) |
| DELETE | `/tiendas/<pk>/admin/delete/` | **root** | Eliminar ruta solo si está vacía |
| DELETE | `/tiendas/<pk>/admin/remove/` | autenticado | Quitar la ruta de *mi* lista (`Tienda_Administrador`) |

#### `GET /tiendas/list/`
Solo si `user.username == 'root'` (comparación literal, no `is_superuser`). Recalcula estados de membresía antes de listar. Query param `?archivadas=1` incluye las archivadas (por defecto se ocultan). Anota `ultima_actividad` = máximo entre el último recaudo y el último cierre de caja.

Si el usuario no es root devuelve **200** con `{"message": "No tiene permisos para acceder a esta vista"}` (no 403).

#### `POST /tiendas/create/`
**Body**: `{ "nombre": "Ruta Norte", "administrador": <user_id> }`

La **primera** ruta de un admin recibe trial de 7 días. Las siguientes nacen en `Pendiente Pago` (sin trial) y disparan alerta de Telegram. Valida nombre único por administrador (case-insensitive).

#### `PATCH /tiendas/<pk>/settings/`
Solo acepta tres campos: `prefijo_telefono`, `telefono`, `cupo_minimo_nuevo`. Devuelve `{"prefijo_telefono": "..."}`.

#### `DELETE /tiendas/<pk>/admin/delete/`
Requiere `username == 'root'`. **409** si la ruta tiene clientes o ventas — se archivan, no se borran, para preservar los datos financieros.

### 5.2 Campos devueltos por `TiendaSerializer`

Datos base: `id`, `nombre`, `telefono`, `prefijo_telefono`, `fecha_registro`, `administrador` (nombre), `administrador_id`, `caja` (= `caja_inicial`), `estado`, `cupo_minimo_nuevo`, `cantidad_clientes`, `cantidad_ventas`.

KPIs calculados:

| Grupo | Campos |
|-------|--------|
| Histórico | `inversion`, `gastos`, `utilidades`, `perdidas`, `ingresos_ventas_finalizadas`, `dinero_x_cobrar` |
| Día | `aportes_dia`, `gastos_dia`, `utilidades_dia`, `recaudos_dia`, `ventas_netas_dia`, `utilidad_estimada_dia` |
| Mes | `aportes_mes`, `gastos_mes`, `utilidades_mes`, `ventas_netas_mes`, `utilidad_estimada_mes` |
| Año | `aportes_ano`, `gastos_ano`, `utilidades_ano`, `ventas_netas_ano`, `perdidas_ano`, `utilidad_estimada_ano` |

> Cada KPI es una agregación SQL independiente y `utilidad_estimada_*` itera venta por venta en Python. `/tiendas/detail/` es el endpoint más costoso de la API.

`TiendaMembresiaSerializer` envuelve lo anterior: `{ id, tienda: {…}, membresia: { id, nombre, precio }, fecha_activacion, fecha_vencimiento, estado, pre_activada_hasta, archivada, fecha_archivado, ultima_actividad }`.

### 5.3 Cierres de caja

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/tiendas/cierres/` · `/tiendas/cierres/t/<tienda_id>/` | Todos los cierres, orden `-id` |
| GET | `/tiendas/cierre/<fecha>/` · `…/t/<tienda_id>/` | Cierre del **día anterior** a `<fecha>` |
| POST | `/tiendas/cierre/post/<fecha>/` · `…/t/<tienda_id>/` | Guarda snapshot de la caja |
| DELETE | `/tiendas/cierre/delete/<pk>/` | Elimina un cierre |

`POST` no recibe body: toma el valor de `tienda.caja_inicial` en ese momento. **No es idempotente** — llamarlo dos veces con la misma fecha crea dos registros.

`Cierre_Caja`: `id`, `fecha_cierre`, `valor` (decimal, 0 decimales), `tienda`.

### 5.4 Membresías — ciclo de vida

**Estados**: `Activa` · `Pendiente Pago` · `Pre-activada` · `Vencida`

**Transiciones automáticas** (`_actualizar_estados_membresias()` / `comprobar_estado_membresia()`):

| De | A | Cuándo |
|----|---|--------|
| `Activa` | `Pendiente Pago` | Vencimiento + 1 día (único día de gracia) |
| `Pendiente Pago` | `Vencida` | Vencimiento + 2 días → **bloqueo de acceso** |
| `Pre-activada` | `Pendiente Pago` | `pre_activada_hasta` ya pasó |

El recálculo se dispara al hacer login, al listar recaudos por fecha, al listar rutas como root y en el cron diario `mantenimiento_membresias` (08:00 de `America/Santiago` en el VPS).

**Planes**: `Prueba` (7 días), `Mensual` (+30 días), `Anual` (+365 días). La extensión se calcula desde `max(fecha_vencimiento, hoy)`, así que renovar antes de vencer no pierde días. Al pagar, una ruta archivada se desarchiva automáticamente.

### 5.5 Membresías — activación manual (root)

| Método | Endpoint | Efecto |
|--------|----------|--------|
| POST | `/tiendas/activate/mounth/<pk>/` | Plan Mensual, vencimiento = hoy + 30 |
| POST | `/tiendas/activate/year/<pk>/` | Plan Anual, vencimiento = hoy + 365 |

`<pk>` es el id de **`Tienda_Membresia`**, no de `Tienda`. Requiere `is_superuser`. Registra el ingreso en `PagoMembresia` con `origen='manual'`, idempotente por (tienda, plan, día). Nota: a diferencia de `extender_membresia()`, aquí el vencimiento se calcula desde hoy, no desde el vencimiento previo.

### 5.6 Membresías — flujo de pago con comprobante

Flujo de 4 pasos con modelo de confianza (pre-activación inmediata + confirmación posterior del admin por Telegram).

#### `POST /tiendas/solicitar-pago/`
**Body**: `{ "plan": "Mensual" }` o `{ "membresia_id": 2 }`, opcionalmente `{ "tienda_id": 3 }`.

**201**
```json
{
  "codigo": "MM-A3F1",
  "expira": "2026-07-19T14:30:00Z",
  "monto": "12000",
  "plan": "Mensual",
  "wa_link": "https://wa.me/...",
  "cuenta": { "banco": "...", "numero": "...", "titular": "...", "tipo": "...", "actualizada": "..." }
}
```
El código es `MM-XXXX` (mensual) o `AA-XXXX` (anual) y expira en 24 h.

#### `POST /tiendas/solicitud-pago/<codigo>/comprobante/`
`multipart/form-data`: `comprobante` (imagen, opcional) y `referencia` (string, opcional).

**Efectos**: comprime la imagen (Pillow), pone la membresía en `Pre-activada` por **3 días**, desarchiva la ruta si estaba archivada, marca la solicitud como `pendiente_confirmacion` y notifica al admin por Telegram con foto y botones inline.

**200**
```json
{
  "estado": "pendiente_confirmacion",
  "mensaje": "Tu acceso ya está activo. Confirmaremos tu pago en las próximas horas.",
  "pre_activada_hasta": "2026-07-21"
}
```
**409** si la solicitud ya fue procesada (`aprobada`/`confirmada`/`rechazada`).

#### `GET /tiendas/solicitud-pago/<codigo>/`
Polling del estado. Marca como `expirada` si sigue `pendiente` y pasó `expira`. Devuelve `SolicitudPagoSerializer`: `id`, `codigo`, `estado`, `plan`, `monto_plan`, `tienda_nombre`, `tienda_id`, `solicitante`, `revisor`, `tiene_comprobante`, `monto_detectado`, `motivo_rechazo`, `confianza_ia`, `referencia_bancaria`, `creada`, `procesada`, `expira`.

> Este endpoint no verifica propiedad de la solicitud: cualquier usuario autenticado que conozca un código puede consultar su estado.

#### `POST /tiendas/telegram/webhook/`
Público (`AllowAny`), autenticado con el header `X-Telegram-Bot-Api-Secret-Token` contra `settings.TELEGRAM_WEBHOOK_SECRET`. Además valida que el `chat_id` sea `TELEGRAM_ADMIN_CHAT_ID`. Procesa `callback_query` con `data = "confirmar:<codigo>"` o `"rechazar:<codigo>"`. Siempre responde `{"ok": true}` para que Telegram no reintente.

#### Panel de conciliación (root)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/tiendas/solicitudes/revision/` | `{ pendientes: [...], confirmadas: [...] }` — pendientes de confirmación + confirmadas de los últimos 30 días |
| GET | `/tiendas/solicitud/<codigo>/comprobante/ver/` | Devuelve la imagen (`FileResponse`, `image/jpeg`) |
| POST | `/tiendas/solicitud/<codigo>/revisar/` | `{"resultado": "confirmar"}` o `{"resultado": "rechazar", "motivo": "..."}` |

`revisar` con `rechazar` sobre una solicitud **ya confirmada** la revierte: restaura `fecha_vencimiento_previa` y borra el `PagoMembresia` asociado. Confirmar dos veces devuelve **409**.

#### `GET|PUT /tiendas/cuenta-destino/`
Root. Datos bancarios de destino (singleton). PUT parcial sobre `banco`, `numero`, `titular`, `tipo`.

#### `GET|PUT /tiendas/planes/`
Root. GET lista los `Membresia`. PUT recibe `[{"id": 1, "precio": 12000}, ...]` (o `{"planes": [...]}`) y actualiza solo precios. Rechaza precios negativos o no numéricos. Los precios históricos ya están congelados en `PagoMembresia`.

### 5.7 Panel de administración root

#### `GET /tiendas/admin/resumen/`
KPIs globales en una sola respuesta. Recalcula estados antes de contar.

```json
{
  "rutas": { "total": 0, "activas": 0, "pendientes": 0, "vencidas": 0, "preactivadas": 0, "archivadas": 0 },
  "por_vencer": 0,
  "ingresos_mes": 0.0,
  "ingresos_anio": 0.0,
  "ingresos_mes_anterior": 0.0,
  "renovaciones_mes": 0,
  "mrr_estimado": 0,
  "conciliacion_pendiente": 0,
  "ingresos_6m": [{ "label": "Feb", "anio": 2026, "mes": 2, "total": 0.0 }],
  "distribucion_plan": { "Mensual": 0, "Anual": 0 },
  "nuevas_rutas_mes": 0,
  "retencion": {
    "bloqueadas_mes": 0,
    "conversion_trial": null,
    "trials_en_curso": 0,
    "trials_perdidos": 0
  }
}
```

`mrr_estimado` = mensuales activas × precio mensual + anuales activas × (precio anual / 12). `por_vencer` = activas que vencen en los próximos 3 días. `conversion_trial` es un porcentaje histórico o `null` si no hay base.

#### `GET /tiendas/<pk>/admin/detalle/`
Drill-down de una ruta. `<pk>` es id de **`Tienda`**. Devuelve `tienda` (contadores), `admin` (contacto y último login), `membresia`, `actividad` (`ultimo_recaudo`, `ultimo_cierre`, `ventas_activas`), `pagos` (historial del ledger) y `total_pagado`.

#### `POST /tiendas/<pk>/archivar/`
Root. `<pk>` es id de **`Tienda_Membresia`**. Body `{"archivar": true|false}`. Reversible, no borra datos. Responde `{"archivada": bool, "fecha_archivado": "YYYY-MM-DD"|null}`.

#### `GET /tiendas/ingresos/?year=2026`
Root. Informe anual de ingresos por membresías.

```json
{
  "year": 2026,
  "anios_disponibles": [2026, 2025],
  "total_anual": 0.0,
  "total_anio_anterior": 0.0,
  "por_mes": [{ "mes": 1, "total": 0, "cantidad": 0, "mensuales": 0, "anuales": 0, "monto_mensuales": 0, "monto_anuales": 0 }],
  "pagos": [{ "id": 1, "tienda": "Ruta Centro", "tienda_id": 3, "plan": "Mensual", "monto": 12000.0, "fecha": "2026-07-01", "origen": "telegram", "codigo": "MM-A3F1" }]
}
```
`por_mes` siempre trae los 12 meses. Si la ruta fue eliminada, `tienda` cae al snapshot `tienda_nombre` o a `"Ruta eliminada"`.

---

## 6. Trabajadores (nómina)

Todos los endpoints requieren rol **admin** (`is_staff` o `is_superuser`), salvo el cambio de contraseña propia. Un cobrador recibe **403** en cualquier otro.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/trabajadores/` · `/trabajadores/t/<tienda_id>/` | Lista los `Perfil` de la ruta |
| GET | `/trabajadores/<pk>/` | Detalle (mezcla `User` + `Perfil`) |
| POST | `/trabajadores/create/` · `/trabajadores/create/t/<tienda_id>/` | Crear |
| PUT | `/trabajadores/<pk>/update/` | Actualizar |
| DELETE | `/trabajadores/<pk>/delete/` | Eliminar |
| POST | `/trabajadores/password/<pk>/` | Cambiar contraseña |

### `GET /trabajadores/<pk>/`
```json
{
  "id": 8, "username": "cobrador1", "identificacion": "1234567",
  "first_name": "Juan", "last_name": "Pérez", "email": "",
  "telefono": "300...", "direccion": "...",
  "is_active": true, "is_staff": false,
  "last_login": "...", "date_joined": "...", "tienda": 3
}
```

### `POST /trabajadores/create/`
**Body**: `username`, `password` (**mínimo 8**), `first_name`, `last_name`, `identificacion`, `telefono`, `direccion`.
Crea el `User` y su `Perfil`. La ruta sale de `tienda_id` o del perfil del solicitante.

### `PUT /trabajadores/<pk>/update/`
**Body** (todos requeridos, se leen con `request.data['…']`): `username`, `first_name`, `last_name`, `is_active`, `is_staff`, `identificacion`, `telefono`, `direccion`, `tienda`.
`is_staff` permite promover a admin de ruta. Desactivar con `is_active=false` es la forma recomendada de bloquear un acceso.

### `DELETE /trabajadores/<pk>/delete/`
**Blindaje anti-cascada**: si el `User` es `Tienda.administrador` de alguna ruta devuelve **400** y no borra nada. `Tienda.administrador` es FK con `CASCADE` — borrarlo destruiría la ruta completa con clientes, ventas y recaudos.

### `POST /trabajadores/password/<pk>/`
**Body**: `{ "passwordNuevo": "minimo8chars" }`
Un trabajador puede cambiar **su propia** contraseña; cambiar la de otro requiere rol admin. Mínimo 8 caracteres (400 si no).

---

## 7. Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/clientes/` · `/clientes/tienda/<tienda_id>/` | Todos, orden por `nombres` |
| GET | `/clientes/activos/` · `/clientes/activos/t/<tienda_id>/` | Solo `estado_cliente='Activo'` |
| GET | `/clientes/disponibles/` · `/clientes/disponibles/t/<tienda_id>/` | Activos **sin** créditos en curso |
| GET | `/clientes/<pk>/` | Detalle |
| POST | `/clientes/create/` · `/clientes/create/t/<tienda_id>/` | Crear |
| PUT | `/clientes/<pk>/update/` | Actualizar |
| DELETE | `/clientes/<pk>/delete/` | Eliminar |
| GET | `/clientes/buscar-doc/<doc>/t/<tienda_id>/` | Buscar en otras rutas propias |
| GET | `/clientes/<pk>/score/t/<tienda_id>/` | Score crediticio individual |
| GET | `/clientes/scores/t/<tienda_id>/` | Score de todos (bulk) |

> ⚠️ Nota de ruteo: `/clientes/tienda/<tienda_id>/` usa el prefijo `tienda/`, no `t/` como el resto de la API.

### Modelo `Cliente`
`id`, `identificacion` (≤12), `nombres`, `apellidos`, `nombre_local`, `telefono_principal`, `telefono_opcional`, `direccion`, `estado_cliente` (`Activo`|`Inactivo`|`Bloqueado`), `tienda`, `fecha_creacion` (auto).

**Constraint**: `identificacion` única **por ruta**. Duplicar devuelve `400` con `{"identificacion": ["Ya existe un cliente con esta identificación en esta ruta."]}`.

### `POST /clientes/create/`
`tienda` se inyecta desde la URL o el perfil. `estado_cliente` y `fecha_creacion` no se aceptan en el body (el cliente nace `Activo`).

### `DELETE /clientes/<pk>/delete/`
Si el cliente tiene **cualquier** venta (incluidas pagadas y perdidas), devuelve **202** con `{"message": "No se puede eliminar el cliente ya que tiene ventas activas"}` y no borra. Ojo: `202` no es un código de error, verificar el `message`.

### `GET /clientes/buscar-doc/<doc>/t/<tienda_id>/`
Busca el documento en **otras rutas del mismo administrador** para precargar el formulario al dar de alta un cliente que ya existe en otra ruta. Nunca expone datos de rutas ajenas.

**200**: `{"found": false}` o
```json
{ "found": true, "ruta_origen": "Ruta Norte", "nombres": "...", "apellidos": "...", "telefono_principal": "...", "direccion": "...", "nombre_local": "..." }
```

### Score crediticio (v2)

`GET /clientes/<pk>/score/t/<tienda_id>/` — respuesta:

```json
{
  "score": 72,
  "nivel": "Bueno",
  "sin_historial": false,
  "cupo_recomendado": 180000,
  "cupo_disponible": 60000,
  "saldo_vigente": 120000,
  "senales": ["3 fallas consecutivas"],
  "justificacion": {
    "base_historica": 150000, "monto_maximo_pagado": 150000,
    "capacidad_cuota": 200000, "promedio_pago_real": 6600, "cuotas_tipicas": 30,
    "factor_score": 1.0, "factor_recencia": 1.0, "factor_vigente": 1.0, "factor_tendencia": 1.0,
    "dias_desde_ultima_actividad": 2, "bloqueado": false,
    "razon": "Basado en 3 crédito(s) pagado(s). Score Bueno (72/100)."
  },
  "detalle": {
    "comp_reciente": 27.0, "comp_historico": 13.5, "comp_activos": 25,
    "comp_perdidos": 20.0, "comp_historial": 6.0,
    "tasa_reciente": 90, "tasa_historica": 90,
    "racha_fallas": 0, "dias_sin_abono_max": 2,
    "pagos": 45, "no_pagos": 5, "total_creditos": 4, "perdidos": 0, "liquidados": 3
  }
}
```

**Componentes del score (0-100)**

| Componente | Puntos | Criterio |
|-----------|--------|----------|
| `comp_reciente` | 30 | Tasa de pago en las últimas 20 visitas (15 si no hay datos) |
| `comp_historico` | 15 | Tasa de pago histórica (7.5 si no hay datos) |
| `comp_activos` | 25 | Salud de créditos vigentes: 25 sano · 18 leve/atrasado · 10 grave · 0 si hay vencidos, renovaciones o deterioro crítico |
| `comp_perdidos` | 20 | `(1 − tasa de perdidos) × 20` |
| `comp_historial` | 10 | `min(liquidados/5, 1) × 10` (excluye créditos cerrados por renovación) |

**Umbrales de días sin abono** (`sano`, `leve`, `grave`) según el plazo:

| Plazo | Sano | Leve | Grave |
|-------|------|------|-------|
| Diario | ≤3 | ≤7 | ≤14 |
| Semanal | ≤9 | ≤16 | ≤30 |
| Mensual | ≤35 | ≤45 | ≤75 |

**Señales duras** — aplican tope al score aunque el historial sea bueno:

| Señal | Tope |
|-------|------|
| Créditos perdidos | 30 |
| Días sin abono en tramo crítico | 40 |
| ≥5 fallas consecutivas | 50 |
| Renovación de deuda en los últimos 90 días | 55 |
| Tasa reciente ≥15 pts por debajo del histórico | (sin tope, solo señal + factor 0.6 al cupo) |

**Niveles**: ≥80 `Excelente` · ≥60 `Bueno` · ≥40 `Regular` · resto `Riesgo`.

**Cupo recomendado**: 0 y `bloqueado: true` si hay créditos perdidos o vencidos. Para clientes nuevos, `tienda.cupo_minimo_nuevo`. Si no, *progressive lending*: la base crece solo sobre montos **demostrados** (créditos realmente liquidados, excluyendo los cerrados por renovación), acotada por la capacidad de cuota, multiplicada por factores de score/recencia/atraso/tendencia, con piso (50 % del último pagado, solo con score ≥60) y techo (1.5× el último pagado, máx 2× el máximo demostrado).

`cupo_disponible = max(0, cupo_recomendado − saldo_vigente)` — limita la exposición total del cliente.

`GET /clientes/scores/t/<tienda_id>/` devuelve un diccionario `{ "<cliente_id>": {…mismo objeto…} }`. Es **O(n) consultas por cliente**: usar solo en vistas que realmente necesiten todos los scores.

---

## 8. Ventas (créditos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/ventas/activas/` · `…/t/<tienda_id>/` | Cartera activa (excluye `Pagado` y `Perdida`) |
| GET | `/ventas/activas/liquidar/<date>/` · `…/t/<tienda_id>/` | Pendientes de cobro en esa fecha |
| GET | `/ventas/activas/<pk>/` · `…/t/<tienda_id>/` | **Todas** las ventas de un cliente (`pk` = cliente), orden `-id` |
| GET | `/ventas/perdidas/` · `…/t/<tienda_id>/` | Ventas en pérdida |
| GET | `/ventas/list/<date>/` · `…/t/<tienda_id>/` | Ventas creadas en una fecha |
| GET | `/ventas/list/<date1>/<date2>/` · `…/t/<tienda_id>/` | Ventas en un rango |
| GET | `/ventas/<pk>/` | Detalle |
| POST | `/ventas/create/` · `/ventas/create/t/<tienda_id>/` | Crear crédito |
| PUT | `/ventas/<pk>/update/` · `…/t/<tienda_id>/` | Actualizar |
| PUT | `/ventas/<pk>/perdida/` | Marcar como pérdida |
| POST | `/ventas/<pk>/renovar/` · `…/t/<tienda_id>/` | Renovar crédito vencido |
| DELETE | `/ventas/<pk>/delete/` · `…/t/<tienda_id>/` | Eliminar |

> `/ventas/activas/<pk>/` devuelve todas las ventas del cliente, no solo las activas, pese al nombre.

### Modelo `Venta`
`id`, `fecha_venta`, `cliente` (FK), `valor_venta` (decimal), `interes` (int %, default 20), `cuotas` (int, default 20), `plazo` (`Diario`|`Semanal`|`Mensual`), `comentario`, `estado_venta` (`Vigente`|`Vencido`|`Pagado`|`Perdida`|`Atrasado`), `saldo_actual`, `fecha_vencimiento`, `tienda`, `origen_renovacion` (FK self, nullable).

### Campos calculados de `VentaDetailSerializer`

| Campo | Fórmula |
|-------|---------|
| `total_a_pagar` | `valor_venta + (interes/100) × valor_venta` |
| `valor_cuota` | `total_a_pagar / cuotas` |
| `total_abonado` | `total_a_pagar − saldo_actual` |
| `pagos_realizados` | `total_abonado / valor_cuota` (con decimales) |
| `pagos_pendientes` | `saldo_actual / valor_cuota` |
| `promedio_pago` | `total_abonado / número de recaudos` |
| `dias_atrasados` | `((valor_cuota × nº recaudos) − total_abonado) / valor_cuota` |
| `perdida` | `saldo_actual` |
| `dias_sin_abono` | Días **calendario** desde el último recaudo con `valor > 0` (o desde `fecha_venta`) |
| `fue_renovada` / `renovacion_id` | Si este crédito fue cerrado por una renovación |
| `origen_renovacion_id` | Crédito del que proviene, si es una renovación |

> ⚠️ **`dias_atrasados` no son días calendario** — son *cuotas/visitas* de atraso y se congela cuando el cobrador deja de visitar. La señal real de deterioro es `dias_sin_abono`.

`VentaDetailSerializer` anida el objeto `cliente` completo. `VentaSerializer` (usado en create/list simple) devuelve `cliente` como id.

### `POST /ventas/create/`
**Body**: `cliente` (id), `fecha_venta` (`YYYY-MM-DD`), `valor_venta`, `interes`, `cuotas`, `plazo`, `comentario`.

El backend calcula: `tienda` (URL o perfil), `saldo_actual = valor_venta × (1 + interes/100)` y `fecha_vencimiento = fecha_venta + (cuotas + 4) días` (independientemente del `plazo`).

**Efecto en caja**: `caja_inicial −= valor_venta`, atómico.

### `PUT /ventas/<pk>/update/`
Usa `VentaUpdateSerializer` (excluye `cliente` — el cliente de un crédito no se puede cambiar). Recalcula `saldo_actual` y `fecha_vencimiento`. Si cambió `valor_venta`, ajusta la caja por la diferencia.

> El `saldo_actual` se **recalcula desde cero**, ignorando los abonos ya registrados. Editar una venta con pagos deja el saldo inflado.

### `PUT /ventas/<pk>/perdida/`
Marca la venta como `Perdida`, sobrescribe `comentario` con `"Venta en pérdida, cliente bloqueado"` y pone el cliente en `Bloqueado`. No mueve la caja.

### `DELETE /ventas/<pk>/delete/`
**406** si la venta ya tiene recaudos. Si no, borra y devuelve `valor_venta` a la caja.

### `POST /ventas/<pk>/renovar/`
Renueva atómicamente un crédito no pagado: cierra el viejo con un `Recaudo` marcado `es_renovacion=True` (que **no cuenta como pago** en el score) y crea uno nuevo por el saldo pendiente, vinculado vía `origen_renovacion`.

**Body**: `{ "fecha_venta": "2026-07-18", "interes": 20, "cuotas": 20 }`

**201**: `{ "venta_anterior_id": 41, "nueva_venta_id": 87, "saldo_renovado": "120000.00" }`

**Errores**: `404` crédito o tienda no encontrada · `409` si ya está `Pagado` o `Perdida` · `400` si faltan campos, `cuotas < 1`, `interes < 0` o no hay saldo pendiente.

**Caja**: neto 0 (entra el saldo como recaudo, sale como capital nuevo).

### Recálculo del estado de la venta

Cada vez que se crea, edita o borra un recaudo, el backend reevalúa `estado_venta` en este orden (los `if` son secuenciales, el último que se cumple gana):

1. `promedio_pago >= valor_cuota` → `Vigente`
2. `promedio_pago < valor_cuota` → `Atrasado`
3. `cuotas < nº de recaudos` → `Vencido`
4. `saldo_actual <= 0` → `Pagado`

---

## 9. Recaudos (cobros)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/recaudos/` | Todos los de mi ruta |
| GET | `/recaudos/list/<venta_id>/` | Por venta, orden `-id` |
| GET | `/recaudos/list/<date>/` · `…/t/<tienda_id>/` | Por fecha |
| GET | `/recaudos/<pk>/` | Detalle |
| POST | `/recaudos/create/` · `/recaudos/create/t/<tienda_id>/` | Registrar un pago |
| POST | `/recaudos/create/nopay/` · `…/t/<tienda_id>/` | Registrar visita fallida |
| PUT | `/recaudos/<pk>/update/` · `…/t/<tienda_id>/` | Editar |
| DELETE | `/recaudos/<pk>/delete/` | Eliminar |
| GET | `/recaudos/sueldo/<date1>/<date2>/<porcentaje>/t/<tienda_id>/` | Cálculo de sueldo |

> `/recaudos/list/<venta_id>/` (int) y `/recaudos/list/<date>/` (str) comparten patrón: Django resuelve por tipo, un id numérico nunca cae en la vista de fecha.

### Modelo `Recaudo`
`id`, `fecha_recaudo`, `valor_recaudo` (decimal), `venta` (FK), `tienda` (FK), `visita_blanco` (FK nullable), `latitud` / `longitud` (`DecimalField(max_digits=10, decimal_places=7)`, nullable), `precision_gps` (float, nullable), `es_renovacion` (bool, indexado).

`Visita_Blanco`: `id`, `tipo_falla`, `comentario`.
**Tipos de falla**: `Casa o Local Cerrado` · `Cliente no Tiene Dinero` · `Cliente de Viaje` · `Cliente no Aparece` · `Cliente Enfermo` · `Otro Motivo`.

### `POST /recaudos/create/`
**Body**
```json
{
  "fecha_recaudo": "2026-07-18",
  "valor_recaudo": 6000,
  "venta": 87,
  "latitud": "6.2518400",
  "longitud": "-75.5635900",
  "precision_gps": 35.2
}
```
`tienda` se inyecta. Coordenadas opcionales, **redondeadas a 7 decimales** (`.toFixed(7)`) para respetar el `DecimalField`; enviar más precisión provoca un error de validación.

**Efectos atómicos**: `caja_inicial += valor_recaudo`, `venta.saldo_actual -= valor_recaudo` y recálculo del estado de la venta.

### `POST /recaudos/create/nopay/`
Visita sin pago. Requiere `visita_blanco` como **objeto anidado**:
```json
{
  "fecha_recaudo": "2026-07-18",
  "valor_recaudo": 0,
  "venta": 87,
  "visita_blanco": { "tipo_falla": "Casa o Local Cerrado", "comentario": "" },
  "latitud": "6.2518400", "longitud": "-75.5635900", "precision_gps": 35.2
}
```
Crea la `Visita_Blanco` y el `Recaudo` en una transacción; si el recaudo es inválido, hace rollback de la visita. Aunque `valor_recaudo` suele ser 0, el código aplica la misma lógica de caja/saldo, así que un valor distinto de 0 sí se contabiliza.

### `PUT /recaudos/<pk>/update/`
Solo acepta `fecha_recaudo` y `valor_recaudo` (`RecaudoUpdateSerializer`). Si cambia el valor, revierte el anterior y aplica el nuevo sobre caja y saldo, y recalcula el estado.

### `DELETE /recaudos/<pk>/delete/`
Revierte caja y saldo. Nota: el recálculo de estado aquí usa `elif` encadenados (en create/update son `if` independientes), así que el estado resultante puede diferir del que tendría la misma venta por otro camino.

### `GET /recaudos/sueldo/<date1>/<date2>/<porcentaje>/t/<tienda_id>/`
`<porcentaje>` va en la URL como número (p. ej. `3` o `3.5`); default 3.0.

**200**
```json
{
  "fecha_inicio": "2026-07-01",
  "fecha_fin": "2026-07-15",
  "total_recaudado": 1250000.0,
  "porcentaje_aplicado": 3.0,
  "sueldo_calculado": 37500.0,
  "cantidad_recaudos": 210
}
```
Suma **todos** los recaudos de la ruta en el rango, sin distinguir trabajador ni excluir los de renovación.

**400** si el formato de fecha es inválido, si `date1 > date2` o si el porcentaje no es numérico.

---

## 10. Gastos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/gastos/` · `/gastos/t/<tienda_id>/` | Todos |
| GET | `/gastos/list/<date>/` · `…/t/<tienda_id>/` | Por fecha |
| GET | `/gastos/list/<date1>/<date2>/` · `…/t/<tienda_id>/` | Por rango |
| GET | `/gastos/<pk>/` | Detalle |
| POST | `/gastos/create/` · `…/t/<tienda_id>/` | Crear |
| PUT | `/gastos/<pk>/update/` · `…/t/<tienda_id>/` | Actualizar |
| DELETE | `/gastos/<pk>/delete/` · `…/t/<tienda_id>/` | Eliminar |

**Tipos de gasto** (catálogo **global**, no por ruta):

| Método | Endpoint |
|--------|----------|
| GET | `/gastos/tipo/` |
| GET | `/gastos/tipo/<pk>/` |
| POST | `/gastos/tipo/create/` — body `{ "tipo_gasto": "Combustible" }` |
| PUT | `/gastos/tipo/<pk>/update/` |
| DELETE | `/gastos/tipo/<pk>/delete/` |

> Los endpoints de `tipo/` no verifican propiedad de ruta: cualquier usuario autenticado puede leer, crear, editar y borrar tipos de gasto, y son compartidos por todas las rutas del sistema.

### Modelo `Gasto`
`id`, `fecha`, `tipo_gasto` (FK), `valor`, `comentario`, `trabajador` (FK `Perfil`), `tienda`.

**POST body**: `fecha`, `tipo_gasto` (id), `valor`, `comentario`. `tienda` y `trabajador` se inyectan desde el usuario autenticado.
**PUT body**: solo `fecha`, `valor`, `comentario` (`GastoUpdateSerializer` excluye `tienda`, `trabajador`, `tipo_gasto` — **el tipo no se puede cambiar al editar**).

**Caja**: crear resta, borrar suma, editar ajusta la diferencia. Todo atómico.

`GET` de listas usa `GastoDetailSerializer` (anida `tipo_gasto` completo).

---

## 11. Aportes (capital)

| Método | Endpoint |
|--------|----------|
| GET | `/aportes/` · `/aportes/t/<tienda_id>/` |
| GET | `/aportes/list/<date>/` · `…/t/<tienda_id>/` |
| GET | `/aportes/list/<date1>/<date2>/` · `…/t/<tienda_id>/` |
| GET | `/aportes/<pk>/` |
| POST | `/aportes/create/` · `…/t/<tienda_id>/` |
| PUT | `/aportes/<pk>/update/` · `…/t/<tienda_id>/` |
| DELETE | `/aportes/<pk>/delete/` · `…/t/<tienda_id>/` |

**Modelo `Aporte`**: `id`, `fecha`, `valor`, `comentario`, `trabajador` (FK `Perfil`), `tienda`.

**POST body**: `fecha`, `valor`, `comentario`, `trabajador` (id de Perfil — a diferencia de Gastos, **no** se inyecta automáticamente). `tienda` sí se inyecta.
**PUT body**: `fecha`, `valor`, `comentario` (excluye `tienda` y `trabajador`).

**Caja**: crear suma, borrar resta, editar ajusta la diferencia. Es la entrada de capital de la ruta.

Si el POST falla la validación, devuelve `{"message": "Por favor completar los campos del formulario."}` en vez de los errores del serializer.

---

## 12. Utilidades (retiros de ganancia)

| Método | Endpoint |
|--------|----------|
| GET | `/utilidades/` · `/utilidades/t/<tienda_id>/` |
| GET | `/utilidades/list/<date>/` · `…/t/<tienda_id>/` |
| GET | `/utilidades/<pk>/` |
| POST | `/utilidades/create/` · `…/t/<tienda_id>/` |
| PUT | `/utilidades/<pk>/update/` · `…/t/<tienda_id>/` |
| DELETE | `/utilidades/<pk>/delete/` · `…/t/<tienda_id>/` |

**Modelo `Utilidad`**: `id`, `fecha`, `comentario`, `valor`, `trabajador` (FK `Perfil`), `tienda`.

**POST body**: `fecha`, `valor`, `comentario`, `trabajador`. **PUT body**: excluye `trabajador`.

**Caja**: crear **resta** (es un retiro), borrar suma, editar ajusta la diferencia.

No existe endpoint de rango de fechas para utilidades (solo fecha exacta).

---

## 13. Publicidad (marcas GPS de campo)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/publicidad/list/<date>/t/<tienda_id>/` | Todos los puntos de la ruta en esa fecha |
| GET | `/publicidad/worker/<date>/t/<tienda_id>/` | Solo los del trabajador autenticado |
| POST | `/publicidad/create/t/<tienda_id>/` | Marcar un punto |
| DELETE | `/publicidad/<pk>/delete/` | Borrar un punto |

**Modelo `Publicidad`**: `id`, `fecha` (auto), `hora` (auto), `trabajador` (FK `Perfil`), `tienda`, `latitud`, `longitud` (obligatorias, 7 decimales), `precision_gps` (nullable), `nota` (≤150, nullable). Orden por `-hora`.

**POST body**: `{ "latitud": "6.2518400", "longitud": "-75.5635900", "precision_gps": 22.5, "nota": "Volanteo parque" }` → **201** con el objeto completo, que incluye `trabajador_nombre`.

**DELETE**: un admin puede borrar cualquier punto de su ruta; un cobrador solo los **suyos y del día de hoy** (403 en caso contrario). Devuelve **204** sin cuerpo.

Estos endpoints sí devuelven `[]` cuando no hay datos.

---

## 14. Efectos sobre la caja (`Tienda.caja_inicial`)

`caja_inicial` es el saldo de caja **vivo** de la ruta, no un valor de apertura. Toda operación de dinero lo mueve dentro de `transaction.atomic()`.

| Operación | Efecto |
|-----------|--------|
| Crear venta | `− valor_venta` |
| Editar venta (cambia el valor) | ajusta la diferencia |
| Eliminar venta | `+ valor_venta` |
| Renovar venta | **neto 0** |
| Crear recaudo | `+ valor_recaudo` |
| Editar recaudo | ajusta la diferencia |
| Eliminar recaudo | `− valor_recaudo` |
| Crear gasto | `− valor` |
| Eliminar gasto | `+ valor` |
| Crear aporte | `+ valor` |
| Eliminar aporte | `− valor` |
| Crear utilidad | `− valor` |
| Eliminar utilidad | `+ valor` |
| Cierre de caja | no mueve nada (snapshot) |
| Marcar venta como pérdida | no mueve nada |

---

## 15. Resumen de modelos

### Tiendas
- **`Tienda`** — `id`, `nombre`, `telefono`, `prefijo_telefono` (default `'56'`), `fecha_registro`, `administrador` (FK User, **CASCADE**), `caja_inicial`, `estado`, `cupo_minimo_nuevo` (default 100000). Único: (`nombre`, `administrador`).
- **`Cierre_Caja`** — `fecha_cierre`, `valor`, `tienda`.
- **`Tienda_Administrador`** — `tienda`, `administrador`. Permite que un admin maneje varias rutas.
- **`AlertaOperativa`** — tipo, severidad, estado, clave de deduplicación,
  referencias de ruta/cliente/venta, trabajador, detalle y mensaje de Telegram.
- **`Membresia`** — `nombre` (`Prueba`|`Mensual`|`Anual`), `precio`.
- **`Tienda_Membresia`** — `tienda` (1:1), `membresia`, `fecha_activacion`, `fecha_vencimiento`, `estado`, `pre_activada_hasta`, `archivada`, `fecha_archivado`.
- **`SolicitudPago`** — `tienda`, `membresia`, `codigo` (único), `estado`, `comprobante` (imagen), `solicitada_por`, `telegram_message_id`, `revisada_por`, `fecha_vencimiento_previa`, `referencia_bancaria`, `monto_detectado`, `motivo_rechazo`, `creada`, `procesada`, `expira`. Campos legacy del flujo WhatsApp/IA: `wa_from_number`, `wa_message_id`, `extraccion_ia`, `confianza_ia`.
- **`CuentaDestino`** — singleton (pk=1): `banco`, `numero`, `titular`, `tipo`, `actualizada`.
- **`PagoMembresia`** — ledger inmutable de ingresos: `tienda` (**SET_NULL**), `tienda_nombre` (snapshot), `membresia`, `monto`, `fecha`, `origen` (`telegram`|`panel`|`manual`), `solicitud`, `registrado_por`, `creado`.

### Trabajadores
- **`Perfil`** — `trabajador` (OneToOne `auth.User`), `identificacion`, `telefono`, `direccion`, `tienda`.

### Operación
- **`Cliente`**, **`Venta`** (incluye `creado_por`), **`Recaudo`**, **`Visita_Blanco`**, **`Gasto`**, **`Tipo_Gasto`**, **`Aporte`**, **`Utilidad`**, **`Publicidad`** — detallados en sus secciones.

---

## 16. Notas de mantenimiento

- **Drift de migraciones en `Tiendas`**: nunca usar `makemigrations` autogenerado en esa app; el estado de las migraciones no coincide con los modelos.
- **Cron diario** (VPS, 08:00 de `America/Santiago`, crontab de `cavb1205`): `python manage.py mantenimiento_membresias` → recalcula estados, cierra la jornada anterior y envía por separado los resúmenes de membresías y cartera. Log en `/home/cavb1205/mantenimiento_membresias.log`.
- **Credenciales del bot** en `variables.py` del VPS: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `CUENTA_DESTINO_*`.
- **Nunca probar flujos que mutan datos** (crear ventas, recaudos, activar membresías) contra registros reales de producción.

## 17. Alertas operativas por Telegram

El mismo bot de membresías envía alertas operativas al chat configurado en
`TELEGRAM_ADMIN_CHAT_ID`. Las alertas son informativas: crear un crédito nunca
se bloquea por estas reglas.

- Una venta nueva genera un mensaje agrupado si el cliente ya tiene un crédito
  activo en la ruta, aparece con crédito activo en otra ruta administrada,
  excede su `cupo_disponible`, está bloqueado o tiene señales de riesgo.
- La renovación hecha por `POST /ventas/<pk>/renovar/` queda vinculada y no se
  considera una venta duplicada.
- El mantenimiento diario registra los cruces de riesgo según la frecuencia del
  crédito y los incluye en el resumen consolidado. No envía una notificación
  individual por cada falla de no pago o cierre ausente.
- `/alertas [Ruta]` consulta alertas nuevas desde el asistente privado de
  Telegram. También están disponibles `/resumen`, `/riesgo` y `/vencidos`.
- `AlertaOperativa` conserva el tipo, severidad, deduplicación, venta, cliente,
  trabajador y `telegram_message_id` para auditoría.
- El umbral de retiro de utilidades de $14M no es un límite de cartera ni una
  alerta crítica en esta fase; se incorporará como meta configurable por ruta.

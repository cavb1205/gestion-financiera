# API Reference

Base URL: `NEXT_PUBLIC_API_URL` (Django REST Framework backend)

All endpoints require `Authorization: Bearer <token>` unless noted.
Store-scoped endpoints use `/t/{tienda_id}/` suffix.

## Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/login/` | Login → `{ token, refresh, user, perfil }` |
| POST | `/token/refresh/` | Refresh token → `{ access }` |

## Clientes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/clientes/tienda/{tienda_id}/` | List clients by store |
| GET | `/clientes/{id}/` | Get single client |
| GET | `/clientes/activos/t/{tienda_id}/` | Active clients only |
| POST | `/clientes/create/t/{tienda_id}/` | Create client |
| PUT | `/clientes/{id}/update/` | Update client |
| DELETE | `/clientes/{id}/delete/` | Delete client |

## Ventas (Credits)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ventas/activas/t/{tienda_id}/` | Active sales |
| GET | `/ventas/activas/{cliente_id}/t/{tienda_id}/` | Client's active sales |
| GET | `/ventas/{id}/` | Sale detail |
| GET | `/ventas/list/{fecha_inicio}/{fecha_fin}/t/{tienda_id}/` | Sales by date range |
| GET | `/ventas/perdidas/t/{tienda_id}/` | Lost sales (estado_venta = Perdida) |
| GET | `/ventas/activas/liquidar/{fecha}/t/{tienda_id}/` | Sales due for liquidation |
| POST | `/ventas/create/t/{tienda_id}/` | Create sale |
| PUT | `/ventas/{id}/update/t/{tienda_id}/` | Update sale |
| DELETE | `/ventas/{id}/delete/t/{tienda_id}/` | Delete sale |
| PUT | `/ventas/{id}/perdida/` | Mark as loss |

## Recaudos (Payments/Collections)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recaudos/list/{fecha}/t/{tienda_id}/` | Payments by date |
| GET | `/recaudos/list/{venta_id}/` | Payments for a sale |
| POST | `/recaudos/create/t/{tienda_id}/` | Create payment |
| POST | `/recaudos/create/nopay/t/{tienda_id}/` | Report failed visit |
| PUT | `/recaudos/{id}/update/t/{tienda_id}/` | Update payment |
| DELETE | `/recaudos/{id}/delete/` | Delete payment |
| GET | `/recaudos/sueldo/{inicio}/{fin}/{porcentaje}/t/{tienda_id}/` | Salary calculation |

## Gastos (Expenses)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/gastos/tipo/` | Expense types |
| GET | `/gastos/t/{tienda_id}/` | List expenses |
| GET | `/gastos/{id}/` | Single expense |
| GET | `/gastos/list/{inicio}/{fin}/t/{tienda_id}/` | Expenses by date range |
| POST | `/gastos/create/t/{tienda_id}/` | Create expense |
| PUT | `/gastos/{id}/update/t/{tienda_id}/` | Update expense |
| DELETE | `/gastos/{id}/delete/t/{tienda_id}/` | Delete expense |

## Aportes (Capital Contributions)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/aportes/t/{tienda_id}/` | List contributions |
| GET | `/aportes/list/{inicio}/{fin}/t/{tienda_id}/` | By date range |
| POST | `/aportes/create/t/{tienda_id}/` | Create contribution |
| PUT | `/aportes/{id}/update/t/{tienda_id}/` | Update contribution |
| DELETE | `/aportes/{id}/delete/t/{tienda_id}/` | Delete contribution |

## Utilidades (Profits)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/utilidades/t/{tienda_id}/` | List profits |
| GET | `/utilidades/list/{fecha_fin}/t/{tienda_id}/` | By end date |
| POST | `/utilidades/create/t/{tienda_id}/` | Create profit record |
| PUT | `/utilidades/{id}/update/t/{tienda_id}/` | Update profit |
| DELETE | `/utilidades/{id}/delete/t/{tienda_id}/` | Delete profit |

## Trabajadores (Workers)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/trabajadores/t/{tienda_id}/` | List workers |
| GET | `/trabajadores/{id}/` | Single worker |
| POST | `/trabajadores/create/t/{tienda_id}/` | Create worker |
| PUT | `/trabajadores/{id}/update/` | Update worker |
| DELETE | `/trabajadores/{id}/delete/` | Delete worker |
| PUT | `/trabajadores/password/{id}/` | Change password |

## Tiendas (Stores & Subscriptions)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tiendas/list/tiendas/admin/` | List admin's stores |
| GET | `/tiendas/detail/admin/{id}/` | Store details + stats |
| PUT | `/tiendas/activate/mounth/{membresia_id}/` | Activate monthly plan |
| PUT | `/tiendas/activate/year/{membresia_id}/` | Activate annual plan |

## Cierre de Caja (Cash Closing)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tiendas/cierres/t/{tienda_id}/` | List all closings |
| GET | `/tiendas/cierre/{fecha}/t/{tienda_id}/` | Previous day's closing |
| POST | `/tiendas/cierre/post/{fecha}/t/{tienda_id}/` | Create closing (valor auto-set) |
| DELETE | `/tiendas/cierre/delete/{id}/` | Delete closing |

## Notes

- Date format: `YYYY-MM-DD`
- Money values: DecimalField with 0 decimal places (integers)
- Responses: JSON, HTTP 200 for success, `{"message": "..."}` for empty results
- Auth: JWT via Simple JWT, 60-minute access token lifetime

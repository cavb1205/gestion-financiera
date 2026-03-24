# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with Turbopack (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite is configured.

## Environment Variables

- `NEXT_PUBLIC_API_URL` — Base URL for the backend REST API (used in all fetch calls)

## Architecture

This is a **Next.js 15 App Router** frontend for a credit/portfolio management system ("Cartera"). The app connects to an external Django REST API.

### Auth Flow

`app/context/AuthContext.js` is the central auth system. It stores `authToken`, `refreshToken`, `userData`, `userProfile`, and `selectedStore` in `localStorage`. Token lifetime is 60 minutes, checked via timestamp. After login, the user must select a store (`/select-store`) before accessing the dashboard.

All dashboard pages guard auth by checking `isAuthenticated` and `selectedStore` from `useAuth()` — redirecting to `/login` if missing. There is also a `selectedStore.fecha_vencimiento` check in `app/dashboard/layout.js` that restricts access if the store subscription has expired.

API calls are made directly with `fetch()` using `Authorization: Bearer <token>` headers. A centralized `apiFetch` utility exists in `app/utils/api.js` that automatically adds auth headers, handles 401 responses with token refresh via `/token/refresh/`, and forces logout on failure. Token refresh is also done proactively at ~55 minutes and via the `SessionTimeout` inactivity modal in the dashboard layout.

### Route Structure

```
/login                          → Login page
/select-store                   → Store selector (post-login)
/dashboard                      → Main dashboard with charts & summaries
/dashboard/clientes             → Client CRUD
/dashboard/ventas               → Active credit sales (cartera)
/dashboard/ventas/[id]          → Sale detail, edit, delete
/dashboard/gastos               → Expense tracking
/dashboard/aportes              → Capital contributions
/dashboard/utilidades           → Profit management
/dashboard/liquidar             → Credit liquidation flow
/dashboard/liquidar/reportar    → Report a payment
/dashboard/liquidar/abonar      → Apply a payment
/dashboard/recaudos             → Collections
/dashboard/sueldos              → Salary calculator
/dashboard/cierre-caja          → Cash closing (daily balance snapshots)
/dashboard/reportes/utilidad    → Business intelligence/reports
/dashboard/membresias           → Subscription management
```

### Key Conventions

- **All pages are `"use client"`** — no server components beyond the root layout.
- **Styling**: Tailwind CSS v4 with a custom `.glass` utility class (defined in `globals.css`) used pervasively for cards. Color palette centers on `indigo-600` (primary), `slate-*` (neutrals), `rose-*` (danger), `emerald-*` (success), `amber-*` (warning).
- **UI patterns**: `react-icons/fi` (Feather icons) throughout. `react-toastify` for notifications (dark theme, bottom-right). `LoadingSpinner` component for loading states.
- **Money formatting**: `formatMoney()` from `app/utils/format.js` — generic locale with `"$"` prefix, no decimals. Import: `import { formatMoney } from '../../utils/format';`
- **`selectedStore.tienda.id`** is passed as a path parameter to most API endpoints to scope data to the active store.
- The dashboard layout (`app/dashboard/layout.js`) renders the sidebar nav and handles responsive mobile menu — individual pages only render their content area.

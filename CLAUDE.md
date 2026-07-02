@AGENTS.md

# Mogo — Gestión de negocio

App de gestión para un negocio de venta de bebidas alcohólicas: Inventario, Precios, Pedidos,
Proyección de ganancias, Control de inversión, Control de gastos, Cierre de caja, Contactos y
Calendario. Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui, para desplegar en Vercel.

**Fase actual: solo frontend.** No hay backend ni base de datos — todo el estado vive en memoria
(Zustand), sembrado desde datos mock en código. Ver `docs/DECISIONS.md` antes de agregar
persistencia real o autenticación.

**Requisito no negociable: mobile-first / responsive.** La app se debe ver y usar bien en celular,
no solo en escritorio. Todo componente/página nueva debe seguir las convenciones responsive
descritas en `docs/ARCHITECTURE.md` (sección "Responsive / mobile") — navegación con `MobileNav`
en pantallas chicas, grids `grid-cols-1 sm:grid-cols-N`, encabezados `flex flex-wrap`, etc.

Antes de trabajar en este proyecto, leer:
- `docs/README.md` — índice de la documentación.
- `docs/ARCHITECTURE.md` — estructura de carpetas y flujo de datos (types → mocks → stores →
  repositories → hooks de módulo → componentes → rutas). Los componentes nunca importan un store
  directamente si existe un hook de módulo equivalente.
- `docs/RBAC.md` — el sistema de roles/permisos (módulo × acción, matriz editable por el admin,
  `PermissionGuard`/`RouteGuard`, `usePermission`).
- `docs/MODULES.md` — qué módulo ya está construido (Inventario, Admin) vs. cuáles son stubs
  "Próximamente", y el patrón a seguir para construir el siguiente módulo.
- `docs/DECISIONS.md` — **importante**: Next.js 16 (no 14/15, `params` es `Promise`), shadcn/ui
  sobre Base UI (no Radix — usar prop `render` en vez de `asChild`), Biome en vez de ESLint+Prettier,
  patrón de tipado para zod `coerce` con react-hook-form.

Comandos: `npm run dev`, `npm run build`, `npm run lint` (Biome), `npm run format`.

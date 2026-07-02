# Arquitectura

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Base UI), desplegable en Vercel.
Por ahora es solo frontend: no hay backend ni base de datos, los datos viven en memoria (Zustand)
sembrados desde mocks en código. Ver [DECISIONS.md](./DECISIONS.md) para el porqué de estas
elecciones.

## Flujo de datos

```
types/*.ts          contratos de dominio puros (sin lógica)
  → mock-data/*.ts   datos semilla (hoy), reemplazables por respuesta de API a futuro
  → stores/*.ts      estado en memoria (Zustand), inicializado desde mock-data
  → data/repositories/*.ts   capa de indirección: interfaz async sobre los stores
  → modules/*/hooks/*.ts     hooks que exponen los stores/repos a los componentes
  → modules/*/components/*.tsx   componentes de UI del módulo
  → app/**/page.tsx  rutas que componen los componentes del módulo
```

**Regla clave**: los componentes de página/UI nunca importan un store directamente si existe un
hook de módulo equivalente (`modules/inventario/hooks/use-products.ts`,
`modules/admin-permisos/hooks/use-roles.ts`). Esto es lo que permite, el día que haya backend real,
reescribir solo el hook (para usar `fetch`/React Query contra una API) sin tocar ni un componente.

`data/repositories/` ya expone esa interfaz async (`list/getById/create/update/remove`) operando
hoy sobre los stores — es el punto de enchufe para el futuro backend.

## Estructura de carpetas

- `src/app/` — rutas. `(app)` es un route group que comparte layout (sidebar + topbar) entre los
  9 secciones (8 módulos + admin). No aparece en la URL.
- `src/modules/<modulo>/` — todo lo específico de un dominio: `components/`, `hooks/`, `lib/`,
  `mock-data/`. Mantiene cada módulo autocontenido.
- `src/types/` — contratos TypeScript compartidos (barrel en `index.ts`).
- `src/stores/` — Zustand: `product-store`, `catalog-store` (categorías+proveedores), `auth-store`
  (usuario/rol activo simulado), `rbac-store` (roles y permisos editables).
- `src/lib/rbac/` — `can()`, `usePermission()`, lista de módulos/acciones. Ver
  [RBAC.md](./RBAC.md).
- `src/components/guards/` — `PermissionGuard` (oculta UI) y `RouteGuard` (bloquea página completa
  y redirige a `/acceso-denegado`).
- `src/components/data-table/` — wrapper genérico sobre `@tanstack/react-table` + `Table` de
  shadcn, reutilizado por las tablas de inventario y roles.

## Estado del proyecto

Ver [MODULES.md](./MODULES.md) para qué módulo está construido y cuál es solo un stub
"Próximamente".

## Responsive / mobile

**Requisito explícito del negocio, no opcional**: la app debe verse y funcionar bien en dispositivos
móviles, no solo en escritorio. Todo componente nuevo debe pensarse mobile-first.

Convenciones ya establecidas que hay que seguir en módulos nuevos:

- **Navegación**: `AppSidebar` (`src/components/layout/app-sidebar.tsx`) solo se muestra en
  `md:` y superior. En mobile, `AppTopbar` incluye `MobileNav`
  (`src/components/layout/mobile-nav.tsx`), un `Sheet` con hamburguesa que reutiliza la misma lista
  de navegación filtrada por permisos (`NavList` en `nav-list.tsx`). Si se agrega una navegación
  secundaria (tabs, breadcrumbs), aplicar el mismo patrón: un solo componente de lista de items,
  consumido por la versión desktop y la versión mobile.
- **Layout de página**: usar `grid-cols-1 sm:grid-cols-2` (o `sm:grid-cols-3`) en vez de columnas
  fijas — ver `product-form.tsx` y `product-detail.tsx`.
- **Encabezados con acción** (título + botón "Nuevo X"): usar
  `flex flex-wrap items-center justify-between gap-3`, no `flex items-center justify-between` a
  secas, para que el botón baje de línea en pantallas angostas en vez de comprimir el título.
- **Tablas**: `Table` (shadcn) ya envuelve su contenido en un `div` con `overflow-x-auto` — las
  tablas anchas (inventario, matriz de permisos) hacen scroll horizontal en mobile en vez de
  romper el layout. Es una solución aceptada para esta fase; si una tabla concreta se vuelve
  ilegible en mobile, considerar una vista de tarjetas alternativa en `sm:hidden` antes que forzar
  más columnas.
- **Barras de filtros**: `flex flex-wrap` (ver `product-filters.tsx`) para que los `Select` se
  acomoden en varias filas en vez de desbordar.
- **Topbar**: elementos secundarios (texto de "Probando como rol", nombre completo del usuario)
  se ocultan con `hidden sm:block`/`hidden sm:flex` en mobile, dejando solo lo esencial (selector
  de rol compacto + avatar).

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
- `src/components/data-table/` — `DataTable`, wrapper estandarizado sobre `@tanstack/react-table` +
  `Table` de shadcn. Toda tabla del sistema (Inventario, Precios, Admin → Usuarios/Roles,
  Categorías/Proveedores) usa este componente, no `<Table>` a mano. Provee:
  - **Orden y filtro por columna**: cada `columnDef.header` usa `DataTableColumnHeader`
    (`data-table-column-header.tsx`), que muestra un dropdown junto al título con ordenar
    asc/desc, un filtro inline (`filter: { type: "select", options }` para checkboxes o
    `{ type: "text" }` para texto libre) y ocultar columna.
  - **Visibilidad de columnas**: `DataTableViewOptions` (`data-table-view-options.tsx`) en la
    toolbar — único lugar para volver a mostrar una columna oculta desde el dropdown de cabecera.
    Usa `columnDef.meta.title` como etiqueta (augmentado en `data-table/types.ts`).
  - **Toolbar** (`data-table-toolbar.tsx`): búsqueda global (prop `searchPlaceholder` +
    `globalFilterFn` de `DataTable` cuando hay que buscar por campos derivados, no por IDs crudos
    — ver `product-table.tsx`) y `toolbarActions` (slot para botones propios de la tabla, p. ej.
    "+ Nueva categoría").
  - **Acciones por fila**: `DataTableRowActions` (`data-table-row-actions.tsx`) en una columna
    `id: "actions"`; soporta acciones tipo link (`href`), destructivas (`variant="destructive"`) y
    con permiso (`permission`, envuelve en `PermissionGuard`).
  - **Mobile**: por debajo de `sm`, `DataTable` reemplaza la tabla por `DataTableMobileCards`
    (`data-table-mobile-cards.tsx`) — una tarjeta por fila en vez de forzar scroll horizontal. La
    primera columna visible (que no sea `id: "actions"`) se destaca como título de la tarjeta; el
    resto se muestra en una grilla etiqueta/valor usando `columnDef.meta.title`. Los controles de
    orden/filtro por columna (`DataTableColumnHeader`) siguen disponibles arriba de las tarjetas.
  El patrón por módulo es un archivo `build<Entidad>Columns()` (ver `product-table-columns.tsx`,
  `role-table-columns.tsx`) que arma las `ColumnDef` con estos primitivos, consumido por un
  componente `<Entidad>Table` que solo pasa `columns` + `data` cruda a `DataTable`.

**Origen del diseño**: este patrón (menú por columna, tarjetas en mobile, colores de estado de
stock) viene del proyecto "Módulo Inventario Mogo" en claude.ai/design, importado vía el MCP
`claude_design`. El color de marca (`--primary`/`--sidebar-accent`, tono ámbar) y los tokens
`--stock-ok-*`/`--stock-bajo-*`/`--stock-critico-*` en `globals.css` (con variantes light/dark)
salen de ese mismo diseño — no cambiarlos sin revisar el archivo fuente en claude.ai/design.

## Modo claro/oscuro

**Requisito no negociable**: la app debe soportar cambiar entre modo claro y oscuro. Todo
componente nuevo debe usar los tokens semánticos de `globals.css` (`bg-background`,
`text-foreground`, `text-muted-foreground`, `bg-card`, `border`, etc.) — **nunca** colores
hardcodeados (`bg-white`, `text-black`, hex, o utilidades de escala de grises tipo `bg-gray-100`),
porque esos no cambian con el tema y rompen en modo oscuro.

Mecanismo: `next-themes` (`src/providers/theme-provider.tsx`, montado en
`src/app/layout.tsx` con `attribute="class"` + `suppressHydrationWarning` en `<html>`) agrega/quita
la clase `.dark`, que activa el bloque de variables `.dark` ya definido en `globals.css`
(`@custom-variant dark (&:is(.dark *));`). El selector de tema (`ThemeToggle`,
`src/components/layout/theme-toggle.tsx`, con opciones Claro/Oscuro/Sistema) vive en `AppTopbar` —
cubre desktop y mobile porque `AppTopbar` es el header compartido de ambos.

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

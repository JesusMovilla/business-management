# Arquitectura

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Base UI), desplegable en Vercel.
Empezó siendo solo frontend (todo en memoria, sembrado desde mocks); ya tiene backend real en
Postgres para Contactos, Roles/Usuarios + autenticación (better-auth), e Inventario (productos,
categorías y movimientos de stock) — el resto de los módulos sigue en memoria
(Zustand). Ver [DECISIONS.md](./DECISIONS.md) para el porqué de estas elecciones.

## Flujo de datos

La mayoría de los módulos todavía sigue el flujo original en memoria:

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

`data/repositories/` expone esa interfaz async (`list/getById/create/update/remove`); en los
módulos aún no migrados sigue operando sobre los stores, pero **importante**: hasta que un módulo
se migra explícitamente, ningún hook lo importa — los hooks hablan directo con Zustand y el
repositorio de ese módulo es código muerto. No asumir que "existe el repositorio" implica "el flujo
ya pasa por él"; confirmarlo mirando el hook del módulo en cuestión.

### Módulos ya migrados a backend real (Postgres + Drizzle)

**Contactos**, **Roles/Usuarios** (junto con autenticación real vía better-auth) e **Inventario**
tienen persistencia real (ver [DECISIONS.md](./DECISIONS.md#postgres-vercel-postgres--drizzle-orm)
y [DECISIONS.md](./DECISIONS.md#autenticación-better-auth-email--contraseña) para el porqué de cada
decisión técnica). Su flujo de datos es distinto al del resto:

```
types/*.ts                  contratos de dominio (sin cambios respecto al flujo en memoria)
  → db/schema.ts             tabla Drizzle — fuente de verdad de la forma persistida
  → data/repositories/*.ts   queries reales contra Postgres (ya no envuelve un store)
  → modules/*/actions.ts     Server Actions ("use server"): validan con zod, llaman al
                              repositorio, revalidan la ruta (escritura)
  → app/**/page.tsx          Server Component async: llama al repositorio directo (lectura
                              inicial, sin round-trip HTTP)
  → modules/*/hooks/*.ts     hook de módulo que envuelve las Server Actions con
                              `useOptimistic`/`useTransition` (React 19) para UI instantánea
  → modules/*/components/*.tsx   igual que antes — reciben los datos ya resueltos
```

Para Contactos no hay store de Zustand — se eliminó junto con la migración. **Roles es la
excepción**: `useRbacStore` sigue existiendo, pero cambió de rol — ya no tiene mutaciones (esas se
movieron a `src/modules/admin-permisos/actions.ts`), solo guarda `roles` como caché de lectura
hidratado una vez por request desde `(app)/layout.tsx` (ver `src/providers/rbac-hydrator.tsx`),
porque `usePermission`/`PermissionGuard`/`RouteGuard` se usan de forma síncrona en decenas de
componentes de toda la app y no podían pasar a depender de un fetch por componente. Las pantallas
de administración (`/admin/roles`, `/admin/usuarios`) en cambio sí siguen el patrón genérico de
arriba al pie de la letra: `initialRoles`/`initialUsers` por prop desde su propio Server Component,
`useOptimistic` local, sin pasar por el store compartido.

Migrar otro módulo a este patrón es mecánico: crear su tabla en `db/schema.ts` (o
`db/schema/<dominio>.ts` si el schema ya está partido en varios archivos, como pasó al sumar las
tablas de better-auth), reescribir su repositorio para usar `db` (Drizzle) en vez de
`useXStore.getState()`, agregar sus Server Actions (con `requirePermission`/`checkPermission` al
inicio de cada una — ver [RBAC.md](./RBAC.md#verificación-server-side-requirepermission)), y
re-cablear su hook + su `page.tsx` + sus componentes de la misma forma que Contactos. Módulos con
estado derivado o transacciones cruzadas entre entidades (ej. Inventario: `stock.quantity` derivado
del ledger de movimientos, `addProduct` que también registra un movimiento) necesitan resolver esa
parte con más cuidado — no es un simple find-and-replace, ver la variante de Inventario abajo.

**Variante para datos leídos síncronamente desde muchas rutas anidadas (Inventario)**: Contactos y
Roles/Usuarios tienen una sola pantalla dueña de su lista (`initialX` por prop + `useOptimistic`
local). Inventario, en cambio, comparte productos/categorías/movimientos entre varias rutas
distintas, con componentes anidados 2-3 niveles (ej. `QuickProductDialog` dentro de
`BulkEntradaDialog`) — prop-drilling manual en cada ruta repetiría el mismo fetch en cada una. Es
el mismo problema que ya resolvió RBAC con un layout + hidratación compartida
(`src/providers/rbac-hydrator.tsx`), pero aquí se resuelve con un **Context dedicado** en vez de un
store de Zustand (para no reintroducir un store mutable, que fue justamente lo que se eliminó al
migrar):

```
db/schema/inventory.ts        tablas products/categories/stock_movements
  → data/repositories/*.ts    product/category/stock-movement-repository (Drizzle)
  → app/(app)/inventario/layout.tsx   Server Component async, un solo fetch en paralelo de las
                                colecciones, `dynamic = "force-dynamic"`
  → modules/inventario/inventory-provider.tsx   Context, `useOptimistic` sobre las colecciones
                                combinadas, reducer en inventory-reducer.ts
  → modules/inventario/actions.ts       Server Actions (checkPermission/checkAdmin + zod + repo +
                                `revalidatePath("/inventario", "layout")`)
  → modules/inventario/hooks/*.ts       misma firma pública que antes (useProducts, useCategories,
                                etc.); las mutaciones esperan la Server Action y solo entonces
                                aplican el cambio confirmado al Context — no hay UI especulativa
                                previa a la confirmación, porque un rollback cruzado entre varias
                                rutas sería más complejo que esperar una escritura de un solo
                                registro
  → modules/inventario/components/*.tsx   sin cambios en su mayoría; solo los que importaban un
                                store directo (`category-manager.tsx`, `category-form.tsx`, etc.)
                                pasaron a usar los hooks del módulo, como exige la regla de arriba
```

Ver [DECISIONS.md](./DECISIONS.md#inventario-context-compartido-en-vez-de-useoptimistic-por-página)
para el detalle de esta decisión.

## Estructura de carpetas

- `src/app/` — rutas. `(app)` es un route group que comparte layout (sidebar + topbar) entre las
  10 secciones (Inicio + 8 módulos + admin). No aparece en la URL.
- `src/modules/<modulo>/` — todo lo específico de un dominio: `components/`, `hooks/`, `lib/`,
  `mock-data/`. Mantiene cada módulo autocontenido.
- `src/types/` — contratos TypeScript compartidos (barrel en `index.ts`).
- `src/stores/` — Zustand: `auth-store` (caché del usuario de la sesión real, hidratado desde el
  servidor — ver `RbacHydrator`), `rbac-store` (caché de solo lectura de `roles`, mismo mecanismo
  de hidratación). Inventario y Contactos ya no usan store propio — ver la sección de módulos
  migrados a backend real, arriba.
- `src/lib/rbac/` — `can()`, `usePermission()`, lista de módulos/acciones. Ver
  [RBAC.md](./RBAC.md).
- `src/components/guards/` — `PermissionGuard` (oculta UI) y `RouteGuard` (bloquea página completa
  y redirige a `/acceso-denegado`).
- `src/components/data-table/` — `DataTable`, wrapper estandarizado sobre `@tanstack/react-table` +
  `Table` de shadcn. Toda tabla del sistema (Inventario, Precios, Admin → Usuarios/Roles,
  Categorías) usa este componente, no `<Table>` a mano. Provee:
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
- **Topbar**: elementos secundarios (nombre completo del usuario) se ocultan con
  `hidden sm:block`/`hidden sm:flex` en mobile, dejando solo lo esencial (avatar + menú de
  usuario).

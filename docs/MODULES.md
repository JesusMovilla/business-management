# Estado de los módulos

| Módulo | Ruta | Estado |
|---|---|---|
| Inventario + Precios | `/inventario` | ✅ Construido — backend real (Postgres) |
| Pedidos | `/pedidos` | 🚧 Stub "Próximamente" |
| Proyección de ganancias | `/proyeccion` | 🚧 Stub |
| Control de inversión | `/inversion` | 🚧 Stub |
| Control de gastos | `/gastos` | 🚧 Stub |
| Cierre de caja | `/cierre-caja` | ✅ Construido — backend real (Postgres) |
| Libreta de contactos | `/contactos` | ✅ Construido — backend real (Postgres) |
| Calendario | `/calendario` | ✅ Construido |
| Administración (roles/usuarios) | `/admin` | ✅ Construido — backend real (Postgres + better-auth) |

## Inventario + Precios

Vistas: listado con filtros (`/inventario`), alta/edición (`/inventario/nuevo`,
`/inventario/[id]/editar`), detalle de solo lectura (`/inventario/[id]`), alertas de stock bajo
(`/inventario/alertas`), precios/márgenes (`/inventario/precios`), movimientos globales
(`/inventario/movimientos`), y CRUD de categorías (`/inventario/categorias`).

Modelo de producto: cada presentación es un producto independiente (sin variantes), sin SKU
propio, sin distinción de bodega/ubicación ni proveedor — el negocio no maneja esos datos (ver
`docs/DECISIONS.md`). **Backend real (Postgres + Drizzle)** — productos, categorías y
movimientos viven en `db/schema/inventory.ts`; los mocks en
`src/modules/inventario/mock-data/*.mock.ts` solo alimentan `src/db/seed.ts` para no arrancar el
ambiente de desarrollo con las tablas vacías. Ver
[ARCHITECTURE.md](./ARCHITECTURE.md#módulos-ya-migrados-a-backend-real-postgres--drizzle) para el
flujo de datos (Context compartido en vez de `useOptimistic` por página, por las 8 rutas que leen
estos datos) y [DECISIONS.md](./DECISIONS.md) para el detalle de cada decisión.

### Movimientos (cantidad derivada)

`product.stock.quantity` no es una columna: se calcula con un `SUM(delta)` agregado por producto en
`productRepository.listWithQuantity()` (ver `docs/DECISIONS.md`). El formulario de producto solo
permite capturar una "Cantidad inicial" al crear (se registra como el primer movimiento `entrada`,
en la misma transacción que la creación del producto); en edición ese campo desaparece por
completo.

Tipos de movimiento (`src/types/stock-movement.ts`): `entrada`, `venta`, `merma`
(vencimiento/rotura/derrame/otro, motivo obligatorio) y `ajuste` (corrección de conteo físico). El
registro es de solo-adición (append-only): no se edita ni se borra un movimiento ya creado, ni
siquiera si el producto asociado se elimina — `stock_movements.product_id` no tiene FK a `products`
a propósito, para permitir que el producto se borre sin arrastrar (ni bloquear por) su historial.
El nombre del autor en el historial (`StockMovementHistory`, tabla de `/inventario/movimientos`)
sale de usuarios reales (`userRepository.list()`), no de un mock.

**Dos caminos para registrar un movimiento, con permisos distintos:**

- **Manual, desde el detalle de un producto** (`StockMovementActions` en `/inventario/[id]`):
  reservado al rol Administrador sin excepción (`useIsAdmin()` en cliente para ocultar los botones,
  `checkAdmin()` en la Server Action `createManualStockMovementAction` como límite de confianza
  real — ver [RBAC.md](./RBAC.md)) — es la vía de excepción para corregir un producto puntual
  (cualquier tipo, incluido el ajuste manual).
- **Entrada masiva por compra** (`BulkEntradaDialog` en `/inventario/movimientos`, permiso
  `inventario.crear`): la vía normal para registrar una compra con varias líneas de producto en un
  solo paso — cada línea genera un movimiento `entrada` independiente en su producto, con la misma
  nota. Si el pedido trae un producto que todavía no existe en el catálogo, `QuickProductDialog`
  (botón "+ Producto nuevo" dentro del mismo diálogo) permite darlo de alta sin cerrar el flujo de
  entrada: crea el producto con cantidad 0 (sin movimiento propio) y agrega automáticamente una
  línea nueva con ese producto ya seleccionado, lista para indicarle la cantidad recibida. Las
  ventas, mientras no exista Cierre de caja, no tienen una UI de registro propia (se seguirán
  canalizando por ese módulo cuando se construya, contra este mismo sistema de movimientos).

UI: `StockMovementHistory` (solo lectura) en el detalle del producto para cualquier rol;
`StockMovementActions` (acciones) solo visible para Administrador; tabla global
`/inventario/movimientos` (`DataTable` con filtro por producto/tipo) para ver todos los
movimientos de todos los productos, con el botón de entrada masiva en su header.

## Cierre de caja

Vistas: historial (`/cierre-caja`), registro del día (`/cierre-caja/nuevo`) y detalle
(`/cierre-caja/[id]`, con edición inline solo para Administrador). **Backend real (Postgres +
Drizzle)** desde el día 1 — tablas `cash_closings`/`cash_closing_items` en
`db/schema/cash-closing.ts`.

Flujo: se registra qué producto y cuánta cantidad se vendió (`ProductQuantityRows`, componente
compartido con `BulkEntradaDialog` de Inventario), y al guardar se generan automáticamente
movimientos `venta` en `stock_movements` — el enganche que ya dejaba listo `docs/DECISIONS.md`. El
servidor recalcula, de forma autoritativa (nunca confía en lo que mande el cliente), el ingreso
esperado (Σ cantidad × precio de venta vigente) y bloquea si alguna cantidad excede el stock
disponible. Si el dinero real contado no coincide con el ingreso esperado, un motivo en texto libre
es obligatorio.

**Edición reservada al Administrador, sin excepción** — mismo patrón `useIsAdmin()`/`checkAdmin()`
que ya usa Inventario para movimientos manuales (ver [RBAC.md](./RBAC.md)), no la matriz de
permisos configurable (que sí controla la acción `crear`, disponible para cualquier rol con
permiso). El admin puede corregir productos y cantidades; como `stock_movements` es un ledger
append-only (sin update/delete), la edición no muta el historial — genera movimientos `ajuste`
compensatorios con la diferencia entre las cantidades viejas y nuevas de cada producto. Ver
[DECISIONS.md](./DECISIONS.md) para el detalle.

## Calendario

Vista mensual (`/calendario`) con feriados colombianos, pedidos (datos de ejemplo — el módulo
Pedidos aún no existe, ver `pedidos.mock.ts`) y eventos propios del negocio (crear/eliminar).
Cada día muestra hasta 3 puntos de color según tipo de evento; el panel del día seleccionado y
"Próximos eventos" listan el detalle. Solo los eventos tipo "evento" son editables/eliminables —
feriados y pedidos son datos semilla de solo lectura, combinados en tiempo de render por
`useCalendarEvents` (`src/modules/calendario/hooks/use-calendar.ts`). Origen del diseño: proyecto
"Módulo Inventario Mogo" en claude.ai/design (mismo proyecto usado para Inventario).

## Libreta de contactos

CRUD simple (`/contactos`): nombre, teléfono y descripción de a qué se dedica la persona (ej.
mantenimiento, arrendador, trabajador). Tabla estandarizada (`DataTable`) con búsqueda, filtro de
texto por columna y acciones de editar/eliminar; un solo `ContactFormDialog` controlado sirve
tanto para crear como editar.

**Primer módulo migrado a persistencia real** (Postgres vía Drizzle) — fue el piloto elegido para
arrancar el backend por ser el CRUD más simple del proyecto: sin campos derivados ni side-effects
entre stores. El resto de los módulos, salvo Administración (ver abajo), sigue en memoria/mocks.
Ver [ARCHITECTURE.md](./ARCHITECTURE.md#módulos-ya-migrados-a-backend-real-postgres--drizzle)
para el flujo de datos y [DECISIONS.md](./DECISIONS.md#postgres-vercel-postgres--drizzle-orm) para
las decisiones técnicas (driver, ORM, patrón Server Actions + `useOptimistic`).

## Administración

`/admin/roles` (listar/crear/editar roles + matriz de permisos) y `/admin/usuarios` (crear
usuarios, reasignar rol, activar/desactivar) — backend real en Postgres, segundo módulo migrado
después de Contactos, junto con autenticación real (`/login`, better-auth). Crear un usuario genera
una contraseña temporal que se muestra una sola vez; el usuario la cambia después desde "Cambiar
contraseña" en su menú de cuenta (`SidebarFooter`). Ver [RBAC.md](./RBAC.md) para el modelo de
permisos y [DECISIONS.md](./DECISIONS.md#autenticación-better-auth-email--contraseña) para las
decisiones de autenticación.

## Cómo construir el siguiente módulo (patrón a seguir)

Usar Inventario como plantilla:

1. `src/types/<dominio>.ts` — interfaces del dominio, exportarlas desde `src/types/index.ts`.
2. `src/modules/<modulo>/mock-data/*.mock.ts` — datos semilla.
3. `src/stores/<modulo>-store.ts` — Zustand con CRUD in-memory.
4. `src/data/repositories/<dominio>-repository.ts` — wrapper async sobre el store.
5. `src/modules/<modulo>/hooks/use-<algo>.ts` — hook que expone el store a componentes (los
   componentes nunca importan el store directo).
6. `src/modules/<modulo>/components/*.tsx` — UI del módulo.
7. `src/app/(app)/<modulo>/page.tsx` (y subrutas) — reemplazar el `ComingSoon` existente.
8. El módulo ya tiene su entrada en `NAV_ITEMS` y su fila en la matriz de permisos desde el día 1
   (ver [RBAC.md](./RBAC.md)) — no hace falta tocar nada ahí salvo que cambie el nombre del módulo.

## Cómo migrar un módulo existente al backend real (Postgres + Drizzle)

Usar Contactos como plantilla (ver el diagrama en
[ARCHITECTURE.md](./ARCHITECTURE.md#módulos-ya-migrados-a-backend-real-postgres--drizzle)):

1. `src/db/schema/<dominio>.ts` — agregar la tabla del dominio (`pgTable`), re-exportarla desde
   `src/db/schema/index.ts`.
2. `npm run db:generate && npm run db:migrate` — genera y aplica la migración.
3. `src/data/repositories/<dominio>-repository.ts` — reescribir para usar `db` (Drizzle) en vez de
   `useXStore.getState()`.
4. `src/modules/<modulo>/actions.ts` (`"use server"`) — una Server Action por mutación: primero
   `checkPermission(module, action)` (`src/lib/rbac/require-permission.ts`, ver
   [RBAC.md](./RBAC.md#verificación-server-side-requirepermission)), después valida con zod, llama
   al repositorio, `revalidatePath`.
5. `src/modules/<modulo>/hooks/use-<algo>.ts` — reescribir para envolver las Server Actions con
   `useOptimistic`/`useTransition` en vez de leer el store.
6. `src/app/(app)/<modulo>/page.tsx` — pasa a Server Component `async`, llama al repositorio
   directo para la carga inicial, agrega `export const dynamic = "force-dynamic"` (los datos ya no
   son un snapshot de build), y pasa el resultado como prop al componente de la tabla.
7. Eliminar `src/stores/<modulo>-store.ts` y actualizar `src/db/seed.ts` para poblar la tabla nueva
   desde el mock existente (así el ambiente de desarrollo no arranca vacío).

Módulos con estado derivado (ej. `ProductWithMargin.stock.quantity`, calculado sumando
`StockMovement.delta`) o transacciones cruzadas entre stores (ej. `addProduct` que también
registra un movimiento) necesitan resolver esa lógica explícitamente al migrar — no es un
find-and-replace mecánico como en Contactos.

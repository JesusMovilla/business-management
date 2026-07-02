# Estado de los módulos

| Módulo | Ruta | Estado |
|---|---|---|
| Inventario + Precios | `/inventario` | ✅ Construido |
| Pedidos | `/pedidos` | 🚧 Stub "Próximamente" |
| Proyección de ganancias | `/proyeccion` | 🚧 Stub |
| Control de inversión | `/inversion` | 🚧 Stub |
| Control de gastos | `/gastos` | 🚧 Stub |
| Cierre de caja | `/cierre-caja` | 🚧 Stub |
| Libreta de contactos | `/contactos` | ✅ Construido |
| Calendario | `/calendario` | ✅ Construido |
| Administración (roles/usuarios) | `/admin` | ✅ Construido |

## Inventario + Precios

Vistas: listado con filtros (`/inventario`), alta/edición (`/inventario/nuevo`,
`/inventario/[id]/editar`), detalle de solo lectura (`/inventario/[id]`), alertas de stock bajo
(`/inventario/alertas`), precios/márgenes (`/inventario/precios`), movimientos globales
(`/inventario/movimientos`), y CRUD de categorías/proveedores (`/inventario/categorias`,
`/inventario/proveedores`).

Modelo de producto: cada presentación es un producto independiente (sin variantes), una sola
bodega/ubicación. Datos mock de bebidas alcohólicas en
`src/modules/inventario/mock-data/products.mock.ts`.

### Movimientos (cantidad derivada)

`product.stock.quantity` no es un campo editable: es un valor **derivado** de la suma de sus
`StockMovement.delta` (ver `docs/DECISIONS.md`). El formulario de producto solo permite capturar
una "Cantidad inicial" al crear (se registra como el primer movimiento `entrada`); en edición ese
campo desaparece por completo.

Tipos de movimiento (`src/types/stock-movement.ts`): `entrada`, `venta`, `merma`
(vencimiento/rotura/derrame/otro, motivo obligatorio) y `ajuste` (corrección de conteo físico). El
registro es de solo-adición (append-only): no se edita ni se borra un movimiento ya creado, ni
siquiera si el producto asociado se elimina.

**Dos caminos para registrar un movimiento, con permisos distintos:**

- **Manual, desde el detalle de un producto** (`StockMovementActions` en `/inventario/[id]`):
  reservado al rol Administrador sin excepción (`useIsAdmin()`, ver [RBAC.md](./RBAC.md)) — es la
  vía de excepción para corregir un producto puntual (cualquier tipo, incluido el ajuste manual).
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

## Administración

`/admin/roles` (listar/crear/editar roles + matriz de permisos) y `/admin/usuarios` (reasignar rol,
activar/desactivar). Ver [RBAC.md](./RBAC.md).

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

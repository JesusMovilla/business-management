# Estado de los módulos

| Módulo | Ruta | Estado |
|---|---|---|
| Inventario + Precios | `/inventario` | ✅ Construido |
| Pedidos | `/pedidos` | 🚧 Stub "Próximamente" |
| Proyección de ganancias | `/proyeccion` | 🚧 Stub |
| Control de inversión | `/inversion` | 🚧 Stub |
| Control de gastos | `/gastos` | 🚧 Stub |
| Cierre de caja | `/cierre-caja` | 🚧 Stub |
| Libreta de contactos | `/contactos` | 🚧 Stub |
| Calendario | `/calendario` | 🚧 Stub |
| Administración (roles/usuarios) | `/admin` | ✅ Construido |

## Inventario + Precios

Vistas: listado con filtros (`/inventario`), alta/edición (`/inventario/nuevo`,
`/inventario/[id]/editar`), detalle de solo lectura (`/inventario/[id]`), alertas de stock bajo
(`/inventario/alertas`), precios/márgenes (`/inventario/precios`), y CRUD de categorías/proveedores
(`/inventario/categorias`, `/inventario/proveedores`).

Modelo de producto: cada presentación es un producto independiente (sin variantes), una sola
bodega/ubicación. Datos mock de bebidas alcohólicas en
`src/modules/inventario/mock-data/products.mock.ts`.

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

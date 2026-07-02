# Decisiones técnicas y peculiaridades a tener en cuenta

## Next.js 16 (no Next 14/15)

`create-next-app@latest` instaló Next.js 16, que tiene cambios de convención respecto a lo que la
mayoría del material de referencia asume. Confirmado contra `node_modules/next/dist/docs/` (ver
también `AGENTS.md` en la raíz, que apunta ahí):

- `params` y `searchParams` en páginas/layouts siguen siendo `Promise` — hay que `await`-earlos
  (igual que en Next 15). Los componentes de página bajo rutas dinámicas (`[productId]`, `[roleId]`)
  son `async function` que hacen `await params` y le pasan el valor ya resuelto a un componente
  cliente (ver `src/app/(app)/inventario/[productId]/page.tsx`).
- `middleware.ts` se renombró a `proxy.ts` (exporta `proxy`, no `middleware`). No aplica todavía
  porque no hay middleware en el proyecto, pero si se agrega uno, usar el nombre nuevo.
- Route groups `(carpeta)` funcionan igual que siempre.
- Tailwind v4: se configura vía `@tailwindcss/postcss` en `postcss.config.mjs` y
  `@import "tailwindcss";` en `globals.css` — no hay `tailwind.config.js` ni directivas
  `@tailwind base/components/utilities`.

Si algo relacionado con routing/params/middleware se comporta distinto a lo esperado, revisar
`node_modules/next/dist/docs/01-app/` antes de asumir el comportamiento de versiones anteriores.

## shadcn/ui sobre Base UI, no Radix

La versión de la CLI de shadcn usada (`shadcn@4.12`, preset `base-nova`) genera componentes sobre
**`@base-ui/react`**, no sobre Radix como en instalaciones más antiguas/tutoriales típicos. Esto
cambia algunos patrones de API que hay que respetar en todo componente nuevo:

- **No existe `asChild`**. Para renderizar un componente propio dentro de un primitivo (botón como
  link, trigger de diálogo, etc.) se usa la prop `render`:
  `<Button render={<Link href="/x" />}>Texto</Button>`.
- Checkbox/Switch usan `checked` / `onCheckedChange(checked: boolean, eventDetails)`.
- Select usa `value` / `onValueChange(value, eventDetails)` — el valor puede venir `null`, hay que
  manejarlo si el consumidor espera siempre `string` (ver `role-switcher.tsx`).
- No se generó un componente `form.tsx` clásico (wrapper de shadcn sobre react-hook-form); esta
  versión de la CLI empuja hacia los primitivos `field.tsx` (`FieldSet`, `FieldLegend`, etc.). En
  este proyecto se optó por **no pelear con eso** y usar react-hook-form directamente
  (`register`/`Controller`) con `Label` + `Input` a mano — ver `product-form.tsx`. Si se necesita
  una capa `Form`/`FormField` más adelante, evaluar los primitivos `field.tsx` en vez de intentar
  traer el `form.tsx` clásico de la versión Radix del registry (no es compatible 1:1).

## Biome en vez de ESLint + Prettier

Decisión explícita del usuario. `create-next-app` se corrió con `--no-eslint`; Biome cubre lint +
format con `domains: { react, next }` activados en `biome.json`. `src/components/ui/**` y
`public/**` están excluidos del linter (código generado por la CLI de shadcn / assets estáticos de
create-next-app, no vale la pena mantenerlos a los estándares del proyecto).

```bash
npm run lint     # biome check .
npm run format   # biome format --write .
```

## zod `coerce` + react-hook-form + TypeScript

`productFormSchema` usa `z.coerce.number()` en los campos numéricos (los inputs HTML entregan
string). Esto hace que el tipo de **entrada** del schema difiera del tipo de **salida** — hay que
tipar `useForm` con los tres genéricos de `zodResolver`:
`useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>`. Si se agrega un nuevo form con
campos numéricos coercitivos, replicar este patrón (ver `product-form.tsx`).

## Autenticación real (better-auth / magic link) — evaluado, no implementado

Se evaluó `better-auth` con su plugin de magic link a pedido del usuario. Requiere backend (route
handler que envíe el email), base de datos para tokens, y proveedor de email — todo lo que este
proyecto explícitamente no tiene todavía. Es el candidato natural cuando se agregue backend real:
el diseño actual ya aísla "quién es el usuario actual" en `auth-store`, así que migrar significa
reescribir esa pieza, no tocar componentes ni guards. No hay código de better-auth en el repo.

`RoleSwitcher` (`src/modules/admin-permisos/components/role-switcher.tsx`, vive en
`SidebarFooter`) es la herramienta temporal para probar la app como distintos roles mientras no
hay auth real — se elimina cuando se implemente autenticación real.

## Cantidad de stock derivada de un ledger de movimientos

`Product.stock.quantity` no existe como campo almacenado — se eliminó a propósito. En su lugar,
`ProductStock` (`src/types/product.ts`) solo guarda `minStock`/`warehouseLocation`, y
`ProductWithMargin.stock.quantity` se calcula en `useProducts()` (`src/modules/inventario/hooks/
use-products.ts`) como la suma de `StockMovement.delta` de ese producto
(`src/types/stock-movement.ts`, store en `src/stores/stock-movement-store.ts`). El ledger es
append-only: no hay `updateMovement`/`removeMovement`, ni siquiera para el rol Administrador — la
única forma de cambiar la cantidad disponible es registrar un nuevo movimiento (`entrada`,
`venta`, `merma` o `ajuste`).

Motivación: impedir que alguien sobreescriba silenciosamente la cantidad disponible (como hacía
antes el formulario de edición de producto) y garantizar un historial auditable de por qué cambió
el stock de cada producto. También deja el enganche listo para cuando exista el módulo Cierre de
caja: bastará con que registre movimientos `venta` contra este mismo sistema, sin cambiar el
modelo de datos.

Registrar un movimiento manual desde el detalle de un producto (`StockMovementActions`) quedó
reservado al rol Administrador sin excepción (`useIsAdmin()`) — es la vía de excepción para
corregir un producto puntual, no la operación diaria. La vía normal para ingresar stock por compra
es la entrada masiva (`BulkEntradaDialog` en `/inventario/movimientos`, permiso
`inventario.crear`): permite cargar varias líneas de producto/cantidad en un solo formulario y
genera un movimiento `entrada` independiente por línea, conservando la misma trazabilidad que un
registro manual uno-a-uno.

Como el resto del código (`StockBadge`, `product-detail.tsx`, columnas de tabla,
`getStockStatus`) sigue leyendo `product.stock.quantity` con la misma forma, este cambio no tocó
ningún consumidor fuera de la capa que produce `ProductWithMargin`. Ver también
[MODULES.md](./MODULES.md#movimientos-cantidad-derivada) y el caso especial `useIsAdmin()` en
[RBAC.md](./RBAC.md#caso-especial-chequeo-de-rol-fuera-de-la-matriz).

## Datos mock

Todo vive en memoria (Zustand), sembrado desde `**/mock-data/*.mock.ts` en el primer render. No hay
`localStorage` ni persistencia — un refresh de página resetea todo a los datos semilla. Es una
decisión explícita para esta fase (ver también [ARCHITECTURE.md](./ARCHITECTURE.md)).

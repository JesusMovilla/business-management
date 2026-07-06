# Decisiones técnicas y peculiaridades a tener en cuenta

## Next.js 16 (no Next 14/15)

`create-next-app@latest` instaló Next.js 16, que tiene cambios de convención respecto a lo que la
mayoría del material de referencia asume. Confirmado contra `node_modules/next/dist/docs/` (ver
también `AGENTS.md` en la raíz, que apunta ahí):

- `params` y `searchParams` en páginas/layouts siguen siendo `Promise` — hay que `await`-earlos
  (igual que en Next 15). Los componentes de página bajo rutas dinámicas (`[productId]`, `[roleId]`)
  son `async function` que hacen `await params` y le pasan el valor ya resuelto a un componente
  cliente (ver `src/app/(app)/inventario/[productId]/page.tsx`).
- `middleware.ts` se renombró a `proxy.ts` (exporta `proxy`, no `middleware`). Ya hay uno en la raíz
  del proyecto (`proxy.ts`) — redirige a `/login` según la cookie de sesión de better-auth, ver la
  sección de autenticación más abajo.
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
  manejarlo si el consumidor espera siempre `string` (ver `new-user-dialog.tsx`).
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

## Autenticación: better-auth, email + contraseña

Se había evaluado antes `better-auth` con su plugin de magic link, pero magic link necesita un
proveedor de email que este proyecto no tiene. Decisión final con el usuario: **email + contraseña**
— sistema cerrado, sin registro público (el Administrador da de alta cada cuenta desde
`/admin/usuarios`), así que no hace falta verificación de email tampoco
(`requireEmailVerification: false`).

- **Librería**: `better-auth`, con `better-auth/adapters/drizzle` sobre el mismo `db` (Drizzle +
  `pg`) que ya usa Contactos/Roles. Exports reales verificados con `npm view better-auth exports`
  (varios resultados de búsqueda en la web sugerían paquetes separados como
  `@better-auth/drizzle-adapter` que no existen — todo vive dentro de `better-auth/*`):
  `better-auth/adapters/drizzle`, `better-auth/next-js` (`toNextJsHandler`, para
  `src/app/api/auth/[...all]/route.ts`), `better-auth/cookies` (`getSessionCookie`, para
  `proxy.ts`), `better-auth/react` (`createAuthClient`, cliente en `src/lib/auth/client.ts`).
- **Env vars nuevas** (sumadas a `.env.example`): `BETTER_AUTH_SECRET` (firma cookies/tokens —
  generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`, nunca
  reusar el de otro ambiente) y `BETTER_AUTH_URL` (base URL de la app, `http://localhost:3000` en
  dev). Sin ellas better-auth funciona pero con warnings y un secreto por defecto inseguro.
- **Schema de better-auth escrito a mano** (`src/db/schema/auth.ts`: `user`/`session`/`account`/
  `verification`), no generado con el CLI del paquete — más predecible que depender de un
  generador cuyo output exacto no se podía verificar de antemano; se validó corriendo
  `drizzle-kit migrate` y probando login real contra la base.
- **Campos propios en `user`** vía `user.additionalFields` en `src/lib/auth/auth.ts`: `roleId`
  (FK a `roles.id`) y `active`. `active: false` tiene efecto real gracias a un
  `databaseHooks.session.create.before` que rechaza la sesión si el usuario está desactivado —
  ver [RBAC.md](./RBAC.md#usuarios-creación-y-estado-activo).
- **Sesión**: `proxy.ts` (primer uso de este archivo en el proyecto) hace un chequeo optimista de
  cookie (`getSessionCookie`, sin ir a la base) para redirigir a `/login` — better-auth documenta
  esto como "optimistic redirect", no como la validación real. La validación real y completa pasa
  server-side: en `(app)/layout.tsx` (`auth.api.getSession`) y en cada Server Action mutable vía
  `requirePermission`/`checkPermission` (`src/lib/rbac/require-permission.ts`).
- **Creación de usuarios sin flujo de invitación por email**: `createUserAction`
  (`src/modules/admin-permisos/actions.ts`) llama `auth.api.signUpEmail` server-side con una
  contraseña temporal generada (`crypto.randomBytes`), no una que el admin inventa. Se muestra una
  sola vez en un diálogo — mismo patrón que la credencial de super admin del seed
  (`src/db/seed.ts`).
- **Fuera de alcance**: recuperar contraseña / verificación de email (requieren proveedor de
  email), OAuth, el plugin `admin` de better-auth (tiene su propio sistema de roles/ban que
  duplicaría el nuestro — se usa `signUpEmail` directo en vez de esa plugin), rate-limiting de
  intentos de login más allá de lo que trae por defecto.

`RoleSwitcher` (el selector de rol falso que existía en `SidebarFooter` para probar la app sin
login) se eliminó — el rol activo es ahora estrictamente el del usuario logueado. `SidebarFooter`
pasó a tener un menú real (`DropdownMenu`) con "Cambiar contraseña" y "Cerrar sesión".

## Cantidad de stock derivada de un ledger de movimientos

`Product.stock.quantity` no existe como campo almacenado — se eliminó a propósito. En su lugar,
`ProductStock` (`src/types/product.ts`) solo guarda `minStock`/`warehouseLocation`, y la cantidad
se calcula como la suma de `StockMovement.delta` de ese producto (`src/types/stock-movement.ts`,
tabla `stock_movements` en Postgres) — con un `SUM` agregado por query en
`productRepository.listWithQuantity()`, no en memoria (ver la sección "Inventario: cantidad
derivada..." más abajo para el detalle de la migración). El ledger es append-only: no hay
`updateMovement`/`removeMovement`, ni siquiera para el rol Administrador — la única forma de
cambiar la cantidad disponible es registrar un nuevo movimiento (`entrada`, `venta`, `merma` o
`ajuste`).

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

**Excepción**: Contactos, Roles/Usuarios (RBAC) e Inventario ya no siguen este patrón — fueron los
módulos migrados a Postgres real. Ver la sección siguiente, "Autenticación: better-auth, email +
contraseña" más arriba, y las dos secciones de Inventario más abajo.

## Postgres (Vercel Postgres) + Drizzle ORM

Primer paso de backend real, arrancado con el módulo Contactos como piloto (el más simple: CRUD
plano, sin campos derivados ni transacciones cruzadas entre stores). Decisiones tomadas:

- **Base de datos**: Vercel Postgres (que hoy es una integración nativa de Neon — ya no el
  producto propio de Vercel de hace unos años). Se provisiona desde el dashboard de Vercel,
  proyecto `business-management` → Storage → Create Database → Postgres.
- **Driver**: `pg` (node-postgres) + `drizzle-orm/node-postgres`, **no** `@vercel/postgres`
  (paquete deprecado — el propio warning de instalación redirige a Neon) ni el driver HTTP de Neon
  (`@neondatabase/serverless`). Con Vercel Fluid Compute (el modelo de ejecución serverless activo
  por defecto), Neon recomienda explícitamente una conexión TCP estándar con pool en vez del driver
  HTTP, que era la recomendación de hace unos años para runtimes serverless de arranque corto.
  `src/db/client.ts` crea un único `Pool` de `pg` cacheado en `globalThis` para no abrir un pool
  nuevo en cada hot-reload de `next dev`.
- **ORM**: Drizzle sobre Prisma — schema en TypeScript (`src/db/schema.ts`), sin motor de query
  aparte, más liviano en cold starts.
- **Env var**: `DATABASE_URL` (convención de Neon/Drizzle, no `POSTGRES_URL`). No existía ninguna
  convención de env previa en el repo; `.env.example` documenta la variable, `.env.local` (real,
  gitignored) se obtiene con `vercel env pull .env.local` después de provisionar la base.
- **Migraciones**: `drizzle-kit`, configurado en `drizzle.config.ts` (schema → `src/db/migrations`).
  Scripts: `npm run db:generate` (genera migración a partir de `schema.ts`), `npm run db:migrate`
  (la aplica), `npm run db:studio` (explorador de datos), `npm run db:seed` (corre
  `src/db/seed.ts` con `tsx`, inserta los mocks existentes para no arrancar con la tabla vacía).

**Hallazgo importante que motivó re-cablear, no solo sustituir**: `src/data/repositories/*.ts`
estaba pensado como el punto de enchufe del backend (ver [ARCHITECTURE.md](./ARCHITECTURE.md)),
pero era código muerto — ningún hook de módulo lo importaba, todos hablaban directo con el store de
Zustand. Sustituir solo el contenido de `contact-repository.ts` por queries de Drizzle no habría
cambiado nada en runtime; hubo que además reescribir `use-contacts.ts`, el page de `/contactos` y
`ContactTable` para que el flujo real pase por el repositorio.

**Patrón de lectura/escritura elegido**: Server Components para lectura inicial (el page de
`/contactos` es `async`, llama `contactRepository.list()` in-process) + Server Actions para
escritura (`src/modules/contactos/actions.ts`, con `revalidatePath` tras cada mutación) + React 19
`useOptimistic`/`useTransition` en el hook de módulo para mantener la sensación de UI instantánea
que daba Zustand. No se sumó una librería de client-fetching (TanStack Query, SWR): con Server
Actions + `useOptimistic`, Next/React ya cubren el caso de uso sin dependencia nueva. La página
queda marcada `export const dynamic = "force-dynamic"` porque su data ya no es un snapshot estático
de build sino una tabla real que cambia — antes de esto, Next intentaba prerenderla en build time y
fallaba por no tener conexión a la base disponible en ese paso.

**Validación server-side**: las Server Actions son ahora un límite de confianza real (antes, el
cliente controlaba el store directo sin nada que lo validara). `contactFormSchema` (zod, en
`src/modules/contactos/components/contact-form-schema.ts`, mismo lugar que
`product-form-schema.ts` en Inventario) valida el input antes de tocar la base, aunque el diálogo
de formulario (`ContactFormDialog`) siga con su validación simple de campos requeridos.

**Fuera de alcance de este primer paso**: el resto de los módulos (Inventario, Categorías,
Proveedores, Calendario, Movimientos) seguían 100% en Zustand + mocks. Roles/Usuarios (RBAC) fue el
segundo módulo migrado, junto con la autenticación real — ver la sección "Autenticación:
better-auth, email + contraseña" más arriba y [RBAC.md](./RBAC.md). Inventario (con Categorías,
Proveedores y Movimientos) fue el tercero — ver las dos secciones siguientes.

## Inventario: cantidad derivada con `SUM` agregado, no en memoria

Al migrar Inventario a Postgres, `product.stock.quantity` (antes calculado en memoria en
`useProducts()` sumando todo el ledger de movimientos, ver la sección de abajo) pasa a calcularse
con una sola query agregada en `productRepository.listWithQuantity()`:

```sql
select p.*, coalesce(sum(m.delta), 0) as quantity
from products p left join stock_movements m on m.product_id = p.id
group by p.id
```

Se descartó una vista SQL materializada (`product_stock`): para el volumen de productos/movimientos
de este negocio, el `LEFT JOIN` + `SUM` por query es igual de rápido y no agrega una pieza más que
mantener en las migraciones.

`addProduct` con cantidad inicial (crea el producto y, si la cantidad es mayor a 0, su primer
movimiento `entrada`) se resolvió con `db.transaction()` en
`productRepository.createWithInitialEntry` — antes esto eran dos escrituras separadas a dos stores
de Zustand (`product-store` y `stock-movement-store`) sin garantía de atomicidad.

`stock_movements.product_id` **no tiene FK** a `products.id` a propósito: el ledger es append-only
y debe sobrevivir a la eliminación de su producto (invariante ya documentado en
`docs/MODULES.md#movimientos-cantidad-derivada`, "ni siquiera si el producto asociado se elimina").
Una FK con la acción por defecto de Postgres (`RESTRICT`) habría bloqueado ese borrado en cuanto el
producto tuviera algún movimiento — se detectó y corrigió durante la verificación manual del flujo,
probando el borrado de un producto con movimientos ya registrados.

## Inventario: Context compartido en vez de `useOptimistic` por página

A diferencia de Contactos (una sola pantalla dueña de su lista), Inventario expone
productos/categorías/proveedores/movimientos a **8 rutas** distintas
(`/inventario`, `/nuevo`, `/[id]`, `/[id]/editar`, `/alertas`, `/precios`, `/movimientos`,
`/categorias`, `/proveedores`), varias con componentes anidados 2-3 niveles (ej.
`QuickProductDialog` dentro de `BulkEntradaDialog`, dentro de la página de movimientos). Repetir el
patrón exacto de Contactos (`initialX` por prop + `useOptimistic` local en cada página) habría
significado el mismo fetch 8 veces y prop-drilling manual de listas de referencia (categorías,
proveedores) a través de varios niveles de componentes.

Es el mismo problema que ya resolvió RBAC con un layout + hidratación compartida
(`src/providers/rbac-hydrator.tsx`, ver ARCHITECTURE.md) — acá se resuelve igual pero con un
**Context dedicado** (`src/modules/inventario/inventory-provider.tsx`) en vez de un store de
Zustand, para no reintroducir un store mutable justo después de haberlo eliminado en la migración
de Contactos. `src/app/(app)/inventario/layout.tsx` (Server Component, `dynamic =
"force-dynamic"`) hace un único fetch en paralelo de las 4 colecciones y las pasa al provider, que
las mantiene en un `useOptimistic` combinado (`inventory-reducer.ts`).

Las mutaciones (`use-products.ts`, `use-stock-movements.ts`) **esperan la Server Action antes de
aplicar el cambio al Context** — a diferencia de Contactos, no hay UI especulativa previa a la
confirmación del servidor. La razón: con datos compartidos entre 8 rutas, un rollback cruzado ante
un fallo sería más complejo de razonar que esperar una escritura de un solo registro (rápida,
típicamente <200ms). El `useOptimistic` se sigue usando (no un `useReducer` plano) porque da de
gratis la reconciliación con los datos frescos que llegan tras `revalidatePath("/inventario",
"layout")` en cada Server Action.

Los componentes que antes importaban `useCatalogStore`/`useProductStore` directo (violando la regla
de "siempre pasar por el hook del módulo") se corrigieron como parte de esta migración —
`category-manager.tsx`, `category-form.tsx`, `supplier-manager.tsx`, `supplier-form.tsx`,
`movements-table.tsx`.

## Inventario: se quitan SKU, ubicación, precio mayorista y todo Proveedores

El negocio no maneja código/SKU propio, no distingue "bodega"/ubicación de sus productos, no
vende al mayoreo, y no necesita registrar proveedores por producto — eran campos heredados del
modelo original que no aportaban valor. Se eliminaron de punta a punta: columnas en `products`
(`sku`, `warehouse_location`, `wholesale_price`, `supplier_id`), la tabla `suppliers` completa (y
con ella el módulo `/inventario/proveedores`, sus Server Actions y su repositorio), y los campos
correspondientes en tipos, formularios, tablas y el detalle de producto. `categoryId` no se tocó —
Categorías se mantiene como módulo independiente.

`lastPurchaseDate` (fecha de última compra) vivía dentro de la card "Proveedor y compra"; al
quitar Proveedores se reubicó junto a los precios (`product-form.tsx`: card "Precios y compra";
`product-detail.tsx`: card "Precios y márgenes") en vez de dejarla sin card propia.

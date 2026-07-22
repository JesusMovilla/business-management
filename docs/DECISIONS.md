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
  sola vez en un diálogo.
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
el stock de cada producto. También dejó el enganche listo para el módulo Cierre de caja, que hoy
ya registra sus ventas como movimientos `venta` contra este mismo sistema, sin haber tocado el
modelo de datos — ver "Cierre de caja: movimientos `ajuste` compensatorios..." más abajo.

Registrar un movimiento manual desde el detalle de un producto (`StockMovementActions`) quedó
reservado al rol Administrador sin excepción (`useIsAdmin()`) — es la vía de excepción para
corregir un producto puntual, no la operación diaria. La vía normal para ingresar stock por compra
es confirmar la recepción de un pedido en el módulo Pedidos (permiso `pedidos.editar`): genera un
movimiento `entrada` independiente por línea, conservando la misma trazabilidad que un registro
manual uno-a-uno — ver
[Pedidos: reemplaza "Registrar entrada"...](./DECISIONS.md#pedidos-reemplaza-registrar-entrada-borrador--recibido-genera-inventario-y-gasto-atómicamente).

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
  (la aplica), `npm run db:studio` (explorador de datos), `npm run db:clean` (`src/db/clean.ts`,
  borra datos de negocio conservando usuarios/roles/grupos de inversores — ver más abajo). No
  existe un script de seed — ver
  [Se elimina el seed de datos demo y sus mocks](#se-elimina-el-seed-de-datos-demo-y-sus-mocks).

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
`QuickProductDialog` dentro del formulario de un pedido, en el módulo Pedidos — que también monta
este mismo Context). Repetir el patrón exacto de Contactos (`initialX` por prop + `useOptimistic`
local en cada página) habría
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

## Cierre de caja: movimientos `ajuste` compensatorios en vez de mutar el ledger

Cierre de caja nació directo con backend real (Postgres), sin pasar por el patrón en
memoria/mocks — no tenía sentido migrarlo después si el enganche con `stock_movements` (real desde
el principio) ya lo exigía. Cada cierre guardado genera un movimiento `venta` por producto
(`cashClosingRepository.create`, mismo patrón de `db.transaction()` que
`productRepository.createWithInitialEntry`: dos tablas, una escritura atómica).

El punto delicado fue decidir qué pasa cuando el Administrador edita un cierre ya guardado y
cambia las cantidades vendidas. `stock_movements` es un ledger append-only por diseño (ver más
arriba) — no existe `updateMovement`/`removeMovement`, ni para el Administrador. Mutar o borrar el
movimiento `venta` original para "corregirlo" habría roto esa invariante. La solución: la edición
compara, producto por producto, la cantidad vieja contra la nueva y genera un movimiento `ajuste`
con la diferencia (`updateCashClosingAction` en `src/modules/cierre-caja/actions.ts`) — si vendió
menos de lo que se había registrado, el ajuste devuelve stock (delta positivo); si vendió más,
lo descuenta (delta negativo). El historial de `stock_movements` queda completo y auditable: se ve
tanto la venta original como su corrección posterior, en vez de un número que cambió sin dejar
rastro.

La edición en sí queda reservada al rol Administrador sin excepción, con el mismo mecanismo
`useIsAdmin()`/`checkAdmin()` que ya usa Inventario para movimientos manuales (no la matriz de
permisos, que sí gobierna la acción `crear` — cualquier rol con ese permiso puede registrar un
cierre nuevo). Ver [RBAC.md](./RBAC.md#caso-especial-chequeo-de-rol-fuera-de-la-matriz) y
[MODULES.md](./MODULES.md#cierre-de-caja).

## Control de gastos: nació directo con backend real, mismo patrón que Contactos

Primer módulo construido *después* de que Inventario, Cierre de caja, Contactos y Admin ya
estuvieran en Postgres — se saltó por completo la fase in-memory/Zustand que la sección "Cómo
construir el siguiente módulo" de [MODULES.md](./MODULES.md) documentaba como plantilla (ese
patrón ya estaba obsoleto: no había ya ningún módulo de dominio nuevo que se construyera así). Se
usó **Contactos como plantilla de scaffolding** (repositorio → Server Actions con
`checkPermission` → hook con `useOptimistic` → `DataTable`) y **Inventario/`product-form.tsx`**
como referencia para el formulario, porque Gastos tiene montos y fechas (react-hook-form +
`zodResolver` + `z.coerce.number()`, no el `useState` simple de `ContactFormDialog`).

**Anular en vez de borrar**: igual que `stock_movements`, un gasto nunca se elimina — `status`
pasa a `"anulado"` con un motivo obligatorio (`expenseRepository.void()`), y la Server Action de
edición (`updateExpenseAction`) rechaza cualquier intento de modificar un gasto ya anulado. No hay
`removeExpenseAction`.

**Presupuesto como dato derivado, no almacenado**: `expense_budgets` solo guarda el límite
(categoría + periodo + monto); "gastado" y "disponible" se calculan en
`expenseDashboardRepository.getBudgetStatus(period)` sumando los gastos reales de ese periodo, cada
vez que se piden — mismo criterio que la cantidad de stock de Inventario (derivada, nunca
un campo que se pueda desincronizar).

**Agregaciones en JS, no SQL agregado**: `expense-dashboard-repository.ts` sigue el mismo criterio
que `dashboard-repository.ts` (Inicio) — trae las listas completas y reduce en memoria. El volumen
de datos de un solo negocio no justifica queries `GROUP BY`/`SUM` más complejas. El "% de gastos
sobre ingresos" reutiliza `dashboardRepository.getKpis().revenueThisMonth` en vez de duplicar el
cálculo de ingresos de Cierre de caja.

### Control de gastos: fuera de alcance en v1

Decisión explícita con el usuario, para no confundir "no construido todavía" con "evaluado y
descartado por ahora":

- **Adjuntos reales de archivo** (factura/foto) — el campo `invoiceRef` es solo texto. Requiere
  provisionar almacenamiento de archivos (Vercel Blob) antes de construirlo; no hay ninguna
  integración de storage en el proyecto hoy.
- **Auto-generación de gastos recurrentes vía cron** — implicaría Vercel Cron + una ruta que
  corra sin interacción del usuario. En v1, "recurrente" es solo una etiqueta (`type: "recurrente"`)
  y el flujo real es duplicar manualmente un gasto anterior.
- **Exportación a Excel/PDF** — no hay librería instalada (`exceljs`/`jspdf`). Solo se construyó
  CSV, que no requiere dependencia nueva.
- **Lectura OCR de facturas** — depende de tener adjuntos reales primero (necesita una imagen que
  leer), además de una integración de IA/visión aparte.
- **Integración bancaria** — fuera de alcance, sin proveedor definido.
- **Alertas de comportamiento anómalo por ML** — lo que se pidió originalmente (gasto muy por
  encima del promedio, posible duplicado, aumento fuerte vs. periodo anterior) es estadística
  simple sobre datos ya disponibles, no ML real; se descartó igual para v1 a pedido del usuario, no
  por limitación técnica.

## Control de inversión: grupos sin entidad "Socio", sin filtro por dueño

Alcance discutido y simplificado varias veces con el usuario antes de construir. Decisiones
firmes, vigentes tras la reconstrucción del módulo (ver sección más abajo):

- **No existe una entidad "Socio" independiente.** Un "grupo inversionista" asocia directamente
  usuarios que **ya existen en el sistema** (`user`, la misma tabla que usa RBAC/better-auth) vía
  `investment_group_members` — no se modela un socio externo con su propio perfil (identificación,
  contacto, fecha de ingreso/retiro, etc., como se había considerado en una versión más ambiciosa
  del alcance). La membresía es solo informativa: **sin porcentaje interno por integrante**.
- **Sin portal ni rol de acceso restringido por grupo.** Se evaluó un rol "Socio" que solo viera
  sus propios datos (filtro por fila, `WHERE groupId IN (...)`), pero el usuario decidió
  explícitamente que **no hace falta**: cualquier usuario con el permiso plano `inversion.ver` ve
  todo, igual que el resto de módulos de la app — sin extender `user` con ningún campo nuevo, ni
  introducir el primer caso de filtrado por dueño en la app.

## Control de gastos: se elimina Presupuestos por completo

Después de construirlo en la primera fase (tabla `expense_budgets`, `expense-budget-repository.ts`,
Server Actions, `/gastos/presupuestos`, la tarjeta de "% presupuesto consumido" en el dashboard),
el usuario pidió explícitamente ocultarlo — y al preguntar si convenía mantener el código por si
se reactivaba después, decidió **eliminarlo por completo** en vez de dejarlo apagado. Se borró:
la tabla y su migración (`DROP TABLE "expense_budgets" CASCADE`), el repositorio, los tres Server
Actions (`create/update/removeExpenseBudgetAction`), el hook `use-expense-budgets.ts`, todos los
componentes de la ruta `/gastos/presupuestos` (incluida `budget-period-picker.tsx`), el mock de
semilla, y el campo `budgetConsumedPercent`/`getBudgetStatus` de
`expense-dashboard-repository.ts`. Si se retoma en el futuro, se reconstruye desde cero siguiendo
el mismo patrón que el resto de Gastos (ver "Cómo construir el siguiente módulo" en
[MODULES.md](./MODULES.md)) — no tiene sentido mantener código muerto "por si acaso" cuando
reconstruirlo es mecánico.

## Control de inversión: se rehace como copia de Gastos, se elimina Periodos/Liquidación/Pagos

El módulo pasó por varias iteraciones de profundidad antes de asentarse: primero se construyó
completo (Grupos → Periodos → Aportes con tipo/método de pago/cuenta/soporte → Participación por
% → Aplicación de capital → Liquidación con preview/simulación/cierre autoritativo → Pagos y
reinversión). Cada iteración de recorte (primero se quitó Aplicación de capital y se simplificaron
Aportes) seguía dejando el módulo más complejo que lo que el negocio necesita, hasta que el
usuario pidió directamente: **que Inversión sea una copia estructural de Gastos** — resumen +
gráficas + una tabla para registrar inversiones, cada una perteneciente a un grupo (el grupo
juega el mismo rol que la categoría en Gastos).

Se eliminó por completo, no se dejó apagado ni se guardó "por si acaso" (mismo criterio que
Presupuestos, ver arriba): Periodos, Participación (% acordado/calculado), Aplicación de capital
(ya iba eliminada), Liquidación (preview, simulación, cierre autoritativo con recálculo de ventas
de Cierre de caja) y Pagos/Reinversión — tablas `investment_periods`/`investment_contributions`
(la versión vieja)/`investment_period_participations`/`investment_liquidations`/
`investment_liquidation_shares`/`investment_payments`, sus repositorios, Server Actions, hooks y
componentes. También se eliminó `cashClosingRepository.getRevenueForRange` y
`expenseRepository.listByDateRange`, agregados específicamente para la liquidación y que quedaron
sin ningún otro consumidor.

En su lugar, `investments` (mismo patrón que `expenses`): fecha, valor, `groupId`, descripción,
estado (activa/anulada, anular-no-borrar). `investment-dashboard-repository.ts` es una copia 1:1
del patrón de `expense-dashboard-repository.ts` (KPIs, desglose por grupo, tendencia mensual). Las
rutas pasaron de `/inversion` (grupos) + `/inversion/periodos` a `/inversion` (dashboard +
inversiones, como `/gastos`) + `/inversion/grupos` (como `/gastos/categorias`).

**Migración en dos pasos** para evitar la ambigüedad de rename que `drizzle-kit generate` intenta
resolver de forma interactiva (falla en un shell no-TTY): primero se generó una migración que
solo agrega la tabla `investments` (con las tablas viejas todavía presentes en el schema, sin
ambigüedad posible), se aplicó, y solo después se quitaron las tablas viejas del schema para
generar una segunda migración de puro `DROP TABLE`. Si hay que volver a hacer un cambio de schema
grande con renombres/reemplazos de tablas, replicar este patrón de dos pasos en vez de intentar
resolver el prompt interactivo.

## Proyección de ganancias: bitácora de pagos a grupos sin reabrir Periodos/Liquidación

Al construir `/proyeccion` el usuario pidió incluir un registro de cuándo se paga la ganancia a los
grupos de socios — conceptualmente el mismo terreno que `investment_payments`, eliminado por
completo en la decisión anterior ("Control de inversión: se rehace como copia de Gastos..."). Antes
de tocar código se le mostró explícitamente esa historia (qué se había construido, por qué se quitó)
para no repetir la misma espiral de profundidad, y se le preguntó qué tan lejos llegar.

Eligió el extremo minimalista: una **bitácora simple**, sin porcentaje de participación por
integrante ni periodos/liquidación con preview-simulación-cierre. Se agregó `profit_payouts`
(`src/db/schema/proyeccion.ts`): fecha, valor, `groupId` (referencia directa a `investment_groups`,
sin duplicar el concepto de grupo), nota de período en texto libre, estado (activo/anulado,
anular-no-borrar). Sin `update`: a diferencia de `investments`/`expenses`, un pago no se edita una
vez registrado, solo se anula (`profitPayoutRepository.void`) — es un hecho consumado, no un
borrador. Vive dentro de Proyección (no de Inversión) porque el usuario prefirió tenerlo junto al
cálculo de ganancia real que determina cuánto hay disponible para repartir.

Si en el futuro se pide participación por integrante o periodos, no reabrir el concepto viejo desde
cero — este historial (dos veces construido y recortado en Inversión, ahora minimalista en
Proyección) es la señal de que el negocio prefiere lo simple; confirmar explícitamente antes de
agregar profundidad.

## Proyección de ganancias: costo aproximado con el costo vigente, no histórico

`proyeccion-dashboard-repository.ts` calcula la ganancia real de una venta como
`(cash_closing_items.unit_price − products.cost) × quantity_sold`, usando el **costo vigente** del
producto en el momento de la consulta, no el costo que tenía cuando se vendió. El proyecto no
guarda costo histórico por venta (igual que `dashboard-repository.getKpis` ya aproxima
`inventoryValue` con el costo actual) — agregar un snapshot de costo por ítem de cierre de caja es
una tabla/columna nueva que no se justifica mientras los costos no cambien con frecuencia. Si el
costo de los productos empieza a variar seguido, esta aproximación puede sobre/sub-estimar la
ganancia real de ventas viejas — reconsiderar entonces guardar el costo en `cash_closing_items` al
momento de crear el cierre.

## Pedidos: reemplaza "Registrar entrada", borrador → recibido genera inventario y gasto atómicamente

Pedidos nació directo con backend real, mismo patrón que Gastos/Cierre de caja. Reemplaza por
completo el botón "+ Registrar entrada" (`BulkEntradaDialog`) que vivía en
`/inventario/movimientos`: esa era la única vía normal para registrar entradas de stock por
compra, pero no dejaba rastro de a qué proveedor, a qué precio de compra, ni generaba el gasto
correspondiente — cada compra había que registrarla dos veces (entrada de inventario en Inventario,
gasto por separado en Gastos), sin garantía de que ambos números cuadraran.

Un pedido nace en `borrador` (proveedor, fecha, líneas de producto con cantidad y precio de
compra) y en ese estado no toca inventario ni gastos — se puede editar o cancelar libremente.
Confirmar la recepción (`purchaseOrderRepository.receive`) es la única puerta hacia
`stock_movements`/`expenses` para una compra: en una sola transacción, genera un movimiento
`entrada` por línea (fecha = fecha de recepción, no la del pedido) y un gasto por el total en la
categoría fija "Compra de mercancía" (`exp-cat-compra-mercancia`, insertada directo en la base —
no hay seed de categorías, ver
[Se elimina el seed de datos demo y sus mocks](#se-elimina-el-seed-de-datos-demo-y-sus-mocks)). Si
algo falla a mitad de camino, la transacción completa se revierte — nunca queda una entrada de
inventario sin su gasto o viceversa.

Un pedido `recibido` o `cancelado` ya no se puede editar ni eliminar — mismo espíritu "anular en
vez de mutar" que el resto del proyecto (ver `remove` solo permitido en estado `borrador`). El
movimiento manual "entrada" del detalle de producto (`StockMovementActions`, admin-only) no se
tocó — sigue siendo la vía de excepción para correcciones puntuales, no la vía normal de compra.

`/pedidos` reutiliza `QuickProductDialog` de Inventario para dar de alta productos nuevos sin
salir del formulario — por eso tiene su propio `layout.tsx` que monta el mismo `InventoryProvider`
que `/inventario`, en vez de duplicar esa lógica de creación de producto. Las líneas de producto
usan un componente propio (`PurchaseOrderLines`), no el `ProductQuantityRows` compartido con
Inventario/Cierre de caja — ver
[Pedidos: compra por paquete, sin un tamaño fijo por producto](#pedidos-compra-por-paquete-sin-un-tamaño-fijo-por-producto)
para por qué. Ver [MODULES.md](./MODULES.md#pedidos).

## Pedidos: compra por paquete, sin un tamaño fijo por producto

El sistema vende por unidad, pero la compra real a veces viene empacada (ej. una caja de cerveza
trae 33 unidades). Guardar `quantity` de una línea de pedido y usarlo directo como `delta` del
movimiento de inventario — que es lo que hacía la primera versión de Pedidos — obligaba a
convertir manualmente "2 paquetes de 33" a "66" antes de escribirlo, con el riesgo de error que
eso implica; era exactamente el problema que "Registrar entrada" también tenía y que Pedidos debía
resolver.

Cada línea (`PurchaseOrderLine`) ahora declara `purchaseMode` (`"paquete"` | `"unidad"`),
`quantity` (paquetes o unidades sueltas, según el modo) y `unitsPerPackage` (multiplicador
efectivo: lo que escribió el usuario en modo paquete, siempre `1` en modo unidad).
`purchaseOrderLineUnits()` (`src/types/purchase-order.ts`) calcula `quantity × unitsPerPackage` —
esas son las unidades reales que entran a `stock_movements` al confirmar recepción.
`purchaseOrderTotal()` no cambia: sigue siendo `Σ quantity × unitCost`, el total pagado, sin
importar el modo.

**Decisión explícita: no existe un "unidades por paquete" por defecto en el producto.** Se
consideró agregarlo (precargar el valor típico al armar un pedido), pero el usuario lo descartó
por innecesario — el tamaño de paquete se escribe a mano en cada línea, cada vez. Esto también
evita una migración y un campo nuevo en el formulario de producto que rara vez se usaría fuera de
Pedidos.

**Efecto adicional al confirmar recepción**: `products.cost` se actualiza con el costo por unidad
implícito en cada línea (`purchaseOrderLineUnitCost()` = `unitCost ÷ unitsPerPackage`), dentro de
la misma transacción que la entrada de inventario y el gasto — decisión explícita del usuario para
que el costo del producto (usado en margen y precio de venta) siempre refleje la compra más
reciente, en vez de mantenerse manual y potencialmente desactualizado en Inventario.

Por la forma que ganó la línea (selector de modo + campo condicional + total calculado), Pedidos
usa un componente de líneas propio (`PurchaseOrderLines`) en vez de seguir forzando el
`ProductQuantityRows` compartido con Inventario/Cierre de caja — ese componente genérico solo
sabe de "producto + cantidad", y sumarle el concepto de paquete/unidad lo hubiera complicado para
sus otros usos.

## Se elimina el seed de datos demo y sus mocks

`src/db/seed.ts` insertaba, contra la base de datos de desarrollo real (no una de pruebas
aislada), un catálogo de demo completo con `onConflictDoNothing()`: 4 contactos, 7 categorías +
10 productos de bebidas + sus movimientos de stock inicial, 2 cierres de caja de ejemplo, 13
categorías de gasto + 6 gastos de ejemplo, 1 grupo inversionista + 2 inversiones + 1 pago de
ganancias. El problema: `onConflictDoNothing` solo protege filas cuyo ID ya existe — corrido en
un ambiente donde parte de ese catálogo demo nunca se había sembrado (mientras el negocio real ya
tenía datos propios cargados encima, con IDs `crypto.randomUUID()` reales conviviendo con IDs
deterministas del mock como `prod-1` o `exp-3`), agregó silenciosamente datos ficticios junto a
datos reales del negocio en la misma tabla, sin ninguna marca que los distinguiera.

Se revirtió manualmente cruzando, por tabla, los IDs deterministas de cada `*.mock.ts` contra el
contenido real de la base (identificando además, vía FK, qué filas de origen "mock" ya sostenían
datos reales — ver más abajo) y borrando fila por fila lo confirmado como demo, nunca con un
`TRUNCATE`/`DELETE` sin filtrar. Se conservó `exp-cat-compra-mercancia` (categoría de gasto que
necesita el flujo de recepción de Pedidos) aunque también la sembró el seed, y se conservó
`inv-group-a` (grupo de inversión de origen mock) porque para cuando se hizo esta limpieza ya
sostenía inversiones reales del negocio vía FK — un mock puede volverse infraestructura real con
el tiempo de uso, y borrarlo hubiera huerfanado esos registros.

**Decisión: no se reemplaza por un seed "más seguro"** — se elimina `src/db/seed.ts`, el script
`db:seed` de `package.json` y los ~10 archivos `*.mock.ts` que solo existían para alimentarlo (ya
no se usan en runtime, confirmado por grep antes de borrar). Un ambiente nuevo arranca con las
tablas vacías. `src/db/clean.ts` (`db:clean`) sigue existiendo — borra datos de negocio
conservando usuarios/roles/grupos de inversores — porque opera sobre tablas completas de una base
que se asume de pruebas, no inserta nada nuevo ni mezcla demo con datos reales.

## Convención: todo input de dinero usa `CurrencyInput`, nunca `<Input type="number">`

Ya existía `src/components/forms/currency-input.tsx` (creado para "Dinero real contado" en Cierre
de caja) — un input que muestra el valor formateado como pesos colombianos mientras se escribe
(`$ 1.234.567`) pero expone siempre un `number | null` sin formato hacia el formulario. No estaba
generalizado: Gastos, Inversión y parte de Inventario (costo/precio de venta) seguían usando
`<Input type="number">` plano, sin ningún formato mientras se escribe. Se migraron todos a
`CurrencyInput`: `expense-form-dialog.tsx` (Valor), `investment-form-dialog.tsx` (Valor),
`product-form.tsx` y `quick-product-dialog.tsx` (Costo, Precio venta al público).

**Patrón para integrarlo con react-hook-form** (`CurrencyInput` es controlado, no se puede usar
con `register`): envolver en `Controller`, mapeando `null ↔ undefined` en los dos sentidos porque
`CurrencyInput` trabaja con `number | null` y los schemas de `z.coerce.number()` esperan
`number | undefined` en los campos opcionales/sin tocar:

```tsx
<Controller
	control={control}
	name="amount"
	render={({ field }) => (
		<CurrencyInput
			value={(field.value as number | undefined) ?? null}
			onValueChange={(value) => field.onChange(value ?? undefined)}
		/>
	)}
/>
```

El cast `as number | undefined` es necesario porque `z.coerce.number()` tipa su **entrada** como
`unknown` (ver "zod `coerce` + react-hook-form + TypeScript" más arriba) — sin el cast, TypeScript
infiere `field.value ?? null` como `{} | null` en vez de `number | null`. Si se agrega un campo de
dinero nuevo en cualquier formulario futuro, usar este mismo patrón — nunca
`<Input type="number">` para montos.

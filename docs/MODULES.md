# Estado de los módulos

| Módulo | Ruta | Estado |
|---|---|---|
| Inicio (dashboard) | `/inicio` | ✅ Construido — lee de los repositorios ya existentes, sin datos propios |
| Inventario + Precios | `/inventario` | ✅ Construido — backend real (Postgres) |
| Pedidos | `/pedidos` | 🚧 Stub "Próximamente" |
| Proyección de ganancias | `/proyeccion` | ✅ Construido — backend real (Postgres) |
| Control de inversión | `/inversion` | ✅ Construido — backend real (Postgres) |
| Control de gastos | `/gastos` | ✅ Construido — backend real (Postgres) |
| Cierre de caja | `/cierre-caja` | ✅ Construido — backend real (Postgres) |
| Libreta de contactos | `/contactos` | ✅ Construido — backend real (Postgres) |
| Calendario | `/calendario` | ✅ Construido |
| Administración (roles/usuarios) | `/admin` | ✅ Construido — backend real (Postgres + better-auth) |

## Inicio (dashboard)

Página de aterrizaje post-login (`/inicio`, `src/app/page.tsx` redirige ahí en vez de a
`/inventario`). No es un módulo de dominio propio — no tiene tipos, mocks ni tabla en Postgres: es
una capa de lectura que agrega datos que ya existen en Inventario y Cierre de caja.
`src/data/repositories/dashboard-repository.ts` expone funciones de agregación puntuales
(`getKpis`, `getRevenueTrend`, `getTopProducts`) que consultan Postgres directo (algunas con SQL
agregado propio, otras reusando `productRepository` y reduciendo en JS — el volumen de datos de un
solo negocio no justifica más). `src/app/(app)/inicio/page.tsx` es un Server Component
`force-dynamic` que llama todo con `Promise.all` y pasa los resultados ya calculados a los
componentes de `src/modules/inicio/components/`.

La sección "Calendario" del dashboard no lee del repositorio de dashboard — reutiliza
`CalendarMonthGrid`/`CalendarDayPanel` del módulo Calendario a través de
`src/modules/inicio/components/calendar-widget.tsx` (mismo patrón grilla + panel del día
seleccionado que `/calendario`, pero solo lectura: sin alta/baja de eventos, con un link "Ver
calendario completo" hacia la página completa).

**Sin permiso propio en la matriz RBAC** — ver
[RBAC.md](./RBAC.md#cómo-se-aplica-en-la-ui). Cada sección de `/inicio` está envuelta en su propio
`<PermissionGuard module="..." action="ver">` según de dónde saca sus datos (Cierre de caja,
Inventario, Calendario), así que un rol sin acceso a un módulo simplemente no ve esa tarjeta —
pero la página en sí no desaparece.

Gráficas con **Recharts**, envueltas en `src/components/ui/chart.tsx` (`ChartContainer`/
`ChartTooltip`/`ChartTooltipContent`, primer componente de gráficas del proyecto). Paleta
categórica en `--chart-1`..`--chart-5` (`globals.css`, light + dark), elegida y validada con el
script del skill de dataviz (`validate_palette.js`) — no cambiar esos tokens a mano sin volver a
correr el validador. Regla de color seguida: comparar magnitud (top productos) usa un solo hue
(`RankedBarChart`) y tendencia en el tiempo usa área de una sola serie. El rango de fechas de las
gráficas de ventas (7/30/90 días) es un query param (`?range=`, `PeriodSelector`) resuelto en el
propio Server Component, sin estado de cliente.

Los módulos que todavía son stub (Pedidos, Proyección, Inversión, Gastos) no tienen tarjeta en el
dashboard — no hay datos reales que agregar todavía; se suman cuando esos módulos se construyan.

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

## Control de gastos

Vistas: resumen con KPIs y gráficas + listado (`/gastos`), categorías/subcategorías
(`/gastos/categorias`). **Backend real (Postgres + Drizzle) desde el día 1**, patrón Contactos —
tablas `expenses`/`expense_categories` en `db/schema/expenses.ts`.

Cada gasto tiene fecha, valor, categoría, descripción, proveedor (opcional), método de pago,
referencia de factura (**solo texto, sin adjuntar archivo** — ver DECISIONS.md), tipo
(fijo/variable/recurrente/extraordinario) y estado (pagado/pendiente/anulado). **Anular en vez de
borrar**: no existe `remove`, solo `expenseRepository.void()`, que exige un motivo y bloquea
edición posterior del mismo gasto — mismo espíritu append-only que `stock_movements`. Los
recurrentes no tienen auto-generación (sin cron): se resuelven duplicando manualmente un gasto
anterior.

El resumen del módulo (`expense-dashboard-repository.ts`) sigue el mismo criterio que
`dashboard-repository.ts` de Inicio: agrega en JS sobre las listas en vez de SQL agregado, y
calcula "% gastos sobre ingresos" reutilizando `dashboardRepository.getKpis().revenueThisMonth`
(Cierre de caja) sin duplicar esa fuente de datos.

**No se maneja Presupuestos por ahora** — se construyó en una primera fase y se eliminó por
completo (tabla `expense_budgets`, repositorio, Server Actions, UI) a pedido explícito del
usuario, ver
[DECISIONS.md](./DECISIONS.md#control-de-gastos-se-elimina-presupuestos-por-completo). Si se
retoma, se reconstruye desde cero siguiendo el patrón del resto del módulo.

**Fuera de alcance de esta versión (decisión explícita, ver
[DECISIONS.md](./DECISIONS.md#control-de-gastos-fuera-de-alcance-en-v1)):** adjuntos reales de
archivo, auto-generación de recurrentes vía cron, exportación a Excel/PDF (sí hay CSV), lectura
OCR de facturas, integración bancaria, alertas de comportamiento anómalo por ML.

## Control de inversión

**Es una copia estructural de Control de gastos**: resumen con KPIs y gráficas + listado
(`/inversion`), grupos (`/inversion/grupos`, el equivalente de Categorías en Gastos). Cada
inversión pertenece a un grupo. **Backend real (Postgres + Drizzle) desde el día 1** — tablas
`investment_groups`/`investment_group_members`/`investments` en `db/schema/investment.ts`.

- **Grupos** (`/inversion/grupos`): no existe una entidad "Socio" — un grupo asocia directamente
  uno o más **usuarios ya existentes del sistema** (`investment_group_members`, tabla puente a
  `user`), sin porcentaje interno por integrante (decisión explícita del usuario). Acceso por el
  permiso plano `inversion.ver`, igual que cualquier otro módulo — sin portal ni rol restringido
  por grupo.
- **Inversiones** (`/inversion`): fecha, valor, grupo, descripción y estado
  (activa/anulada) — la misma forma que un gasto en Gastos, sin tipo, método de pago, cuenta
  receptora ni soporte. **Anular en vez de borrar**: no existe `remove`, solo
  `investmentRepository.void()`, que exige un motivo y bloquea edición posterior — mismo espíritu
  append-only que `expenses`/`stock_movements`.
- El resumen del módulo (`investment-dashboard-repository.ts`) sigue el mismo criterio que
  `expense-dashboard-repository.ts`: agrega en JS sobre las listas en vez de SQL agregado.
  Muestra invertido hoy/mes/año, comparación vs. mes anterior, grupo con más inversión, gráfica de
  inversión por grupo del mes y evolución mensual.
- **Reportes**: exportación CSV en grupos e inversiones (mismo patrón que Gastos, sin librería
  nueva).

**Ya no incluye Periodos, Participación (%), Aplicación de capital, Liquidación ni Pagos/
Reinversión** — se construyeron en fases anteriores y se eliminaron por completo a pedido
explícito del usuario: el módulo resultaba demasiado profundo para lo que el negocio necesita.
Quedó reducido a lo esencial — registrar cuánto invierte cada grupo, con resumen y gráficas para
comparar entre grupos — igual que Gastos. Ver
[DECISIONS.md](./DECISIONS.md#control-de-inversión-se-rehace-como-copia-de-gastos-se-elimina-periodosliquidaciónpagos).

## Proyección de ganancias

`/proyeccion` combina tres cosas: cuánto se **espera** ganar (margen potencial del inventario
actual), cuánto se ha ganado **realmente** a la fecha (histórico de Cierre de caja) y cuánto de esa
ganancia ya se **repartió** a los grupos de socios de Control de inversión. No tiene tipos/mocks/
tabla propios para lo esperado/real — es una capa de lectura como Inicio, salvo por la bitácora de
pagos, que sí es backend real desde el día 1.

- **Ganancia esperada** (`proyeccion-dashboard-repository.getKpis`): suma, por producto,
  `cantidad_en_stock × (precio_venta − costo)` usando `productRepository.listWithQuantity()` — "si
  se vende todo el inventario actual a precio de lista, cuánto margen genera".
- **Ganancia real** (período seleccionado, tendencia diaria, top productos): agrega
  `cash_closing_items` (venta, precio) contra el **costo vigente** del producto (`products.cost`) —
  no existe costo histórico por venta, así que se aproxima con el costo actual (ver
  [DECISIONS.md](./DECISIONS.md#proyección-de-ganancias-costo-aproximado-con-el-costo-vigente-no-histórico)).
  Sigue el mismo criterio que `dashboard-repository.ts`: SQL agregado (join + `sum`) en vez de
  reducir listas completas en JS, porque necesita el costo del producto en el mismo query.
- **Selector de período** (`ProfitPeriodSelector`, `src/modules/proyeccion/period.ts`): hoy / esta
  semana / este mes / este año / personalizado, vía `?period=&from=&to=` — mismo espíritu que
  `PeriodSelector` de Inicio (sin estado de cliente), pero con un rango personalizado resuelto por
  un `<form method="get">` nativo en vez de solo presets fijos. Los presets van "desde el inicio del
  período hasta hoy" (progreso a la fecha), no el período calendario completo. Afecta ganancia real,
  pagado a grupos y ganancia neta disponible, comparados contra el período inmediatamente anterior
  de igual longitud (`previousPeriod` en el repositorio); **ganancia esperada no depende del
  período** — es una foto del inventario de hoy.
- **Bitácora de pagos a grupos** (`/proyeccion`, tabla `profit_payouts`): fecha, valor, grupo (el
  mismo `InvestmentGroup` de Control de inversión, sin duplicar el concepto), nota/período en texto
  libre. **Anular en vez de borrar y sin edición** — un pago solo se registra o se anula
  (`profitPayoutRepository.void`), nunca se modifica, mismo espíritu append-only que
  `investments`/`stock_movements`.
- El resumen (`ProfitKpiCards`) muestra ganancia esperada, ganancia real del período (con
  comparación vs. el período anterior de igual longitud), pagado a grupos en el período, gastos del
  período y ganancia neta disponible del período (ganancia real menos lo ya pagado y, si el toggle
  de abajo está activo, menos los gastos).
- **Gastos en la ganancia neta** (`?gastos=0` para excluirlos, `IncludeExpensesToggle`): switch
  junto al selector de período que decide si `netAvailableInPeriod` resta los gastos no anulados
  (`expenseRepository.list()`, módulo Gastos) registrados en el mismo rango de fechas. Habilitado
  por defecto. El monto de gastos del período siempre se muestra en su propio KPI, se reste o no de
  la neta — el toggle solo cambia si participa en `netAvailableInPeriod`. Estado en la URL, no en
  cliente, mismo criterio que el selector de período; los links/form de `ProfitPeriodSelector`
  reenvían `gastos=0` para no perder el toggle al cambiar de período.

**Deliberadamente acotado** — sin porcentaje de participación por integrante, sin periodos ni
liquidación con simulación/cierre. Ver
[DECISIONS.md](./DECISIONS.md#proyección-de-ganancias-bitácora-de-pagos-a-grupos-sin-reabrir-periodosliquidación)
para por qué esta vez sí se agrega un registro de pagos después de que ese mismo concepto se
eliminara por completo de Control de inversión.

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

**Esta sección documentaba antes un patrón in-memory (Zustand) que ya no se usa para módulos
nuevos.** A esta altura, Inventario, Cierre de caja, Contactos, Admin y Gastos ya corren sobre
Postgres real — solo Calendario sigue en memoria, y de forma trivial. Construir un módulo nuevo
"en memoria primero, migrar después" solo duplica trabajo. Usar **Contactos como plantilla base**
(el flujo más simple) y Gastos como ejemplo de un módulo con formularios numéricos/fechas y
agregaciones tipo dashboard:

1. `src/types/<dominio>.ts` — interfaces del dominio, exportarlas desde `src/types/index.ts`.
2. `src/db/schema/<dominio>.ts` — `pgTable`(s), re-exportar desde `src/db/schema/index.ts`.
3. `npm run db:generate && npm run db:migrate` — genera y aplica la migración.
4. `src/data/repositories/<dominio>-repository.ts` — Drizzle directo (`list`/`create`/`update`/
   `remove` o `anular` según el dominio — ver "Anular en vez de borrar" en
   [DECISIONS.md](./DECISIONS.md)), sin store intermedio.
5. `src/modules/<modulo>/actions.ts` (`"use server"`) — una Server Action por mutación: primero
   `checkPermission(module, action)` (`src/lib/rbac/require-permission.ts`, ver
   [RBAC.md](./RBAC.md#verificación-server-side-requirepermission)), después valida con zod, llama
   al repositorio, `revalidatePath`.
6. `src/modules/<modulo>/hooks/use-<algo>.ts` — envuelve las Server Actions con
   `useOptimistic`/`useTransition` (ver `use-contacts.ts`).
7. `src/modules/<modulo>/components/*.tsx` — UI del módulo, con el `DataTable` compartido
   (`src/components/data-table/`) para listados. Si el formulario tiene montos/fechas, usar
   react-hook-form + `zodResolver` + `z.coerce.number()` (ver `product-form-schema.ts` y
   `expense-form-schema.ts`), no el `useState` simple de `ContactFormDialog`.
8. `src/app/(app)/<modulo>/page.tsx` (y subrutas) — Server Component `async`,
   `export const dynamic = "force-dynamic"`, reemplaza el `ComingSoon` existente.
9. `src/modules/<modulo>/mock-data/*.mock.ts` — solo semilla para `src/db/seed.ts`, no se consume
   en runtime.
10. El módulo ya tiene su entrada en `NAV_ITEMS` y su fila en la matriz de permisos desde el día 1
    (ver [RBAC.md](./RBAC.md)) — no hace falta tocar nada ahí salvo que cambie el nombre del
    módulo.

Si el módulo necesita agregaciones tipo dashboard (KPIs, gráficas) sobre sus propios datos u otros
módulos, seguir el patrón de `expense-dashboard-repository.ts`/`dashboard-repository.ts`: dado el
volumen de datos de un solo negocio, agregar en JS sobre las listas es suficiente — no hace falta
SQL agregado salvo que el volumen lo justifique.

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

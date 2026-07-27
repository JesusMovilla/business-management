# Estado de los módulos

| Módulo | Ruta | Estado |
|---|---|---|
| Inicio (dashboard) | `/inicio` | ✅ Construido — lee de los repositorios ya existentes, sin datos propios |
| Inventario + Precios | `/inventario` | ✅ Construido — backend real (Postgres) |
| Pedidos | `/pedidos` | ✅ Construido — backend real (Postgres) |
| Rentabilidad y proyecciones | `/rentabilidad` | ✅ Construido — backend real (Postgres), capa de lectura |
| Control de inversión | `/inversion` | ✅ Construido — backend real (Postgres) |
| Control de gastos | `/gastos` | ✅ Construido — backend real (Postgres) |
| Cierre de caja | `/cierre-caja` | ✅ Construido — backend real (Postgres) |
| Libreta de contactos | `/contactos` | ✅ Construido — backend real (Postgres) |
| Calendario | `/calendario` | ✅ Construido |
| Configuración (roles/usuarios) | `/admin` | ✅ Construido — backend real (Postgres + better-auth) |

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

Los módulos que todavía son stub no tienen tarjeta en el dashboard — no hay datos reales que
agregar todavía; se suman cuando esos módulos se construyan.

## Inventario + Precios

Vistas: listado con filtros (`/inventario`), alta/edición (`/inventario/nuevo`,
`/inventario/[id]/editar`), detalle de solo lectura (`/inventario/[id]`), alertas de stock bajo
(`/inventario/alertas`), precios/márgenes (`/inventario/precios`), movimientos globales
(`/inventario/movimientos`), y CRUD de categorías (`/inventario/categorias`).

Modelo de producto: cada presentación es un producto independiente (sin variantes), sin SKU
propio, sin distinción de bodega/ubicación ni proveedor — el negocio no maneja esos datos (ver
`docs/DECISIONS.md`). **Backend real (Postgres + Drizzle)** — productos, categorías y
movimientos viven en `db/schema/inventory.ts`. Ver
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
- **Entrada por compra, vía Pedidos** (`/pedidos`, permiso `pedidos.editar`): la vía normal para
  registrar entradas de stock por compra a proveedor — ver el módulo Pedidos más abajo. Ya no
  existe un "Registrar entrada" directo dentro de Inventario; ese botón se retiró de
  `/inventario/movimientos` cuando se construyó Pedidos.

UI: `StockMovementHistory` (solo lectura) en el detalle del producto para cualquier rol;
`StockMovementActions` (acciones) solo visible para Administrador; tabla global
`/inventario/movimientos` (`DataTable` con filtro por producto/tipo) para ver todos los
movimientos de todos los productos.

## Pedidos

`/pedidos` registra pedidos de compra a proveedores. **Backend real (Postgres + Drizzle) desde el
día 1** — tablas `purchase_orders`/`purchase_order_lines` en `db/schema/purchase-orders.ts`.

Un pedido tiene proveedor (texto libre, igual que `supplier` en Gastos — no hay tabla de
proveedores), fecha del pedido, nota opcional y una o más líneas (producto + cantidad + precio de
compra). Nace en estado **`borrador`** y en ese estado no afecta inventario ni gastos — se puede
editar o cancelar libremente. Usa un componente de líneas propio (`PurchaseOrderLines`, no el
`ProductQuantityRows` compartido de Inventario/Cierre de caja — ver más abajo por qué) y reutiliza
`QuickProductDialog` de Inventario para dar de alta un producto sobre la marcha sin salir del
formulario; por eso `/pedidos` está envuelto en su propio `layout.tsx` que monta el mismo
`InventoryProvider` que usa `/inventario`.

**Compra por paquete vs. venta por unidad** (`PurchaseMode` en `src/types/purchase-order.ts`): el
negocio vende por unidad pero a veces compra empacado (ej. 33 unidades por paquete). Cada línea
elige "Paquete" o "Unidad"; en modo paquete el usuario escribe manualmente cuántas unidades trae
ese paquete para esa compra en particular (no hay un tamaño de paquete por defecto en el producto
— ver [DECISIONS.md](./DECISIONS.md#pedidos-compra-por-paquete-sin-un-tamaño-fijo-por-producto)).
El total de unidades que entra a inventario es `cantidad × unidades por paquete` (con
multiplicador 1 en modo "unidad"); el total del gasto sigue siendo `cantidad × precio pagado`, sin
importar el modo.

**Confirmar recepción** (`purchaseOrderRepository.receive`, transaccional) es la operación central
del módulo: pasa el pedido a `recibido` y, en la misma transacción,
1. registra un movimiento `entrada` en `stock_movements` por cada línea, ya convertido a unidades
   reales (misma fecha: la de recepción, no la del pedido),
2. actualiza `products.cost` de cada producto con el costo por unidad implícito en esa línea
   (`precio pagado ÷ unidades por paquete`) — el costo del producto queda igual al de la compra más
   reciente, y
3. crea un gasto en Control de gastos (categoría fija "Compra de mercancía",
   `exp-cat-compra-mercancia`) por el total del pedido, fechado también con la fecha de recepción.

Un pedido `recibido` ya no se puede editar, cancelar ni eliminar (igual que un gasto anulado en
Gastos) — queda como historial. Un pedido `cancelado` tampoco. Ver
[DECISIONS.md](./DECISIONS.md#pedidos-reemplaza-registrar-entrada-borrador--recibido-genera-inventario-y-gasto-atómicamente)
para el detalle de esta decisión.

## Cierre de caja

Vistas: historial (`/cierre-caja`), registro del día (`/cierre-caja/nuevo`) y detalle
(`/cierre-caja/[id]`, con edición inline solo para Administrador). **Backend real (Postgres +
Drizzle)** desde el día 1 — tablas `cash_closings`/`cash_closing_items` en
`db/schema/cash-closing.ts`.

Flujo: se registra qué producto y cuánta cantidad se vendió (`ProductQuantityRows`, componente
compartido con otros formularios de Inventario), y al guardar se generan automáticamente
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

**Revertir cierre, reservado al Administrador** — botón "Revertir" en el detalle, pide un motivo
obligatorio (`CashClosingRevertDialog`) y devuelve al inventario toda la cantidad vendida del
cierre vía movimientos `ajuste` (`revertCashClosingAction`/`cashClosingRepository.revert`). Igual
que editar, no muta ni borra nada: el cierre queda marcado `status: "revertido"` con
`reversedAt`/`reversedBy`/`reversalReason`, visible como badge en la tabla y en el detalle. Un
cierre revertido ya no admite edición ni una segunda reversión. Ver
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
- **Pagos a grupos** (`/inversion/pagos`, tabla `profit_payouts` en `db/schema/investment.ts`):
  bitácora de cuándo se le paga la ganancia repartida a cada grupo — fecha, valor, grupo (el mismo
  `InvestmentGroup`, sin duplicar el concepto), nota/período en texto libre. **Anular en vez de
  borrar y sin edición** — un pago solo se registra o se anula (`profitPayoutRepository.void`),
  nunca se modifica, mismo espíritu append-only que `investments`. Vivió en el módulo Proyección de
  ganancias (eliminado, ver
  [DECISIONS.md](./DECISIONS.md#proyección-de-ganancias-módulo-eliminado-bitácora-de-pagos-se-muda-a-control-de-inversión))
  y se movió acá al quitarlo — es, en el fondo, el reverso de `investments` para los mismos grupos
  (dinero que sale hacia los socios vs. dinero que entra de ellos).

**Ya no incluye Periodos, Participación (%), Aplicación de capital, Liquidación ni Pagos/
Reinversión** — se construyeron en fases anteriores y se eliminaron por completo a pedido
explícito del usuario: el módulo resultaba demasiado profundo para lo que el negocio necesita.
Quedó reducido a lo esencial — registrar cuánto invierte cada grupo, con resumen y gráficas para
comparar entre grupos — igual que Gastos. Ver
[DECISIONS.md](./DECISIONS.md#control-de-inversión-se-rehace-como-copia-de-gastos-se-elimina-periodosliquidaciónpagos).

## Rentabilidad y proyecciones

`/rentabilidad` es una capa de lectura pura sobre `cash_closing_items` + `cash_closings` +
`products` + `categories` + `expenses` + `stock_movements` — no tiene tabla ni tipos propios, todo
vive en `src/data/repositories/rentabilidad-dashboard-repository.ts`. Reemplaza por completo al
antiguo módulo Proyección de ganancias, eliminado tras construir este (ver
[DECISIONS.md](./DECISIONS.md#proyección-de-ganancias-módulo-eliminado-bitácora-de-pagos-se-muda-a-control-de-inversión)).

El alcance se acotó deliberadamente a lo que el esquema actual soporta **sin cambios de esquema**
(decisión del usuario al planear el módulo). El sistema no registra descuentos por línea,
devoluciones, desglose por método de pago en el cierre de caja, sucursal, vendedor, canal de venta,
cliente, SKU, ni costeo FIFO/promedio real (solo costo único vigente en `products.cost` + snapshot
puntual en `cash_closing_items.unit_cost`). Por eso "ventas" es la única cifra disponible — no hay
bruta vs. neta que distinguir — y no hay mapas de calor ni rentabilidad por sucursal/vendedor/
cliente/proveedor.

Secciones construidas (`src/modules/rentabilidad/`):

- **Resumen ejecutivo** (`RentabilidadKpiCards`): ventas, costo de ventas, ganancia bruta/neta,
  gastos operativos, dinero recaudado y diferencia de caja (`cashClosings.actualCash`/`difference`,
  no agregados en ningún otro dashboard todavía), ticket promedio, unidades vendidas — cada uno
  comparado contra el período anterior de igual longitud.
- **Gráficas principales**: tendencia combinada ventas + ganancia bruta + gastos
  (`CombinedTrendChart`), ganancia por categoría (`CategoryProfitChart`, envuelve `RankedBarChart`
  de Inicio en un Client Component propio — `valueFormatter` es una función, no se puede pasar
  como prop desde el Server Component `page.tsx`), ganancia por producto con unidades vendidas en
  el tooltip (`ProductProfitChart`, top 5) y puente de rentabilidad (`ProfitBridge`, barras
  proporcionales en vez de un waterfall de recharts). Sin mapa de calor por hora/día de la
  semana/sucursal/vendedor (no hay hora de venta ni esas dimensiones; se probó un mapa por día de
  la semana y se quitó a pedido del usuario, a favor de más espacio para Alertas).
- **Rentabilidad por producto** (`ProductProfitabilityTable`, exportable a CSV): ABC por ventas y
  por ganancia bruta calculados por separado (`classifyAbc` en el repositorio, regla 80/20), más un
  cuadrante venta/ganancia (`classifyQuadrant`, `src/modules/rentabilidad/lib/quadrant.ts`, corte
  por mediana) para detectar productos que venden mucho y dejan poca ganancia.
- **Indicadores de inventario** (`InventoryIndicatorsTable`): sell-through, velocidad diaria,
  cobertura, rotación y antigüedad — ventana fija de 30 días, independiente del período elegido en
  el selector — es una foto del comportamiento reciente, no del rango que se esté mirando.
- **Alertas y recomendaciones** (`AlertsList`, `getAlerts`): reglas simples (no ML) sobre margen
  negativo/bajo, productos de alta venta y baja ganancia, próximos a agotarse, inventario detenido
  y diferencias de caja — cada alerta trae una recomendación en texto.
- **Proyección con inventario actual** (`ProjectionCard`, `getProjection`): potencial máximo
  teórico, proyección realista por sell-through histórico y una tendencia simple (promedio diario
  del período proyectado a la misma duración) — sin escenarios configurables ni estacionalidad,
  "primera versión" a propósito.
- **Punto de equilibrio y simulador de precio** (`BreakEvenCard`, `PriceSimulator`): gastos fijos
  (`expenses.type === "fijo"`) ÷ margen de contribución promedio; el cálculo del simulador es
  client-side, pero el botón "Guardar precio" sí persiste — llama a
  `updateSimulatedPriceAction` (`src/modules/rentabilidad/actions.ts`), que en el fondo es una
  edición de Inventario (`products.retail_price`) y por eso valida el permiso de **Inventario**
  "editar", no el de Rentabilidad (que es de solo lectura).
- **Calidad de datos** (`DataQualityPanel`): % de productos con costo válido, % de ventas con
  snapshot de costo real (no aproximado), % de gastos con categoría, cierres de caja con diferencia
  sin resolver — para no mostrar ganancias "exactas" sobre datos incompletos.

Selector de período propio (`src/modules/rentabilidad/period.ts`) — mismo patrón de siempre
(`?period=&from=&to=`, sin estado de cliente) que usaban Inicio y el antiguo módulo Proyección.

## Calendario

Vista mensual (`/calendario`) con feriados colombianos, pedidos reales (fecha del pedido y, si
aplica, fecha de recepción — `buildPedidosCalendarEvents` en `pedidos.mock.ts`, que ya no es un
mock: transforma `purchaseOrderRepository.list()` en eventos) y eventos propios del negocio
(crear/eliminar). Cada día muestra hasta 3 puntos de color según tipo de evento; el panel del día
seleccionado y "Próximos eventos" listan el detalle. Solo los eventos tipo "evento" son
editables/eliminables — feriados y pedidos son de solo lectura, combinados en tiempo de render por
`useCalendarEvents` (`src/modules/calendario/hooks/use-calendar.ts`), que recibe los eventos de
pedidos como argumento (fetch hecho en el Server Component de cada página que usa el calendario:
`/calendario` y el widget de `/inicio`). Origen del diseño: proyecto "Módulo Inventario Mogo" en
claude.ai/design (mismo proyecto usado para Inventario).

## Libreta de contactos

CRUD simple (`/contactos`): nombre, teléfono y descripción de a qué se dedica la persona (ej.
mantenimiento, arrendador, trabajador). Tabla estandarizada (`DataTable`) con búsqueda, filtro de
texto por columna y acciones de editar/eliminar; un solo `ContactFormDialog` controlado sirve
tanto para crear como editar.

**Primer módulo migrado a persistencia real** (Postgres vía Drizzle) — fue el piloto elegido para
arrancar el backend por ser el CRUD más simple del proyecto: sin campos derivados ni side-effects
entre stores. El resto de los módulos, salvo Configuración (ver abajo), sigue en memoria/mocks.
Ver [ARCHITECTURE.md](./ARCHITECTURE.md#módulos-ya-migrados-a-backend-real-postgres--drizzle)
para el flujo de datos y [DECISIONS.md](./DECISIONS.md#postgres-vercel-postgres--drizzle-orm) para
las decisiones técnicas (driver, ORM, patrón Server Actions + `useOptimistic`).

## Configuración

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
   al repositorio, `revalidatePath`. **Toda llamada al repositorio que pueda fallar en la base de
   datos (sobre todo `remove`/`delete`, por violación de llave foránea) va en `try/catch`,
   devolviendo el error con `toActionErrorMessage()` (`src/lib/action-error.ts`) — nunca
   `err.message` directo ni dejar que la excepción se propague sin envolver.** Ver
   [DECISIONS.md](./DECISIONS.md#convención-ninguna-server-action-deja-pasar-un-error-crudo-de-la-base-de-datos-al-usuario).
6. `src/modules/<modulo>/hooks/use-<algo>.ts` — envuelve las Server Actions con
   `useOptimistic`/`useTransition` (ver `use-contacts.ts`).
7. `src/modules/<modulo>/components/*.tsx` — UI del módulo, con el `DataTable` compartido
   (`src/components/data-table/`) para listados. Si el formulario tiene montos/fechas, usar
   react-hook-form + `zodResolver` + `z.coerce.number()` (ver `product-form-schema.ts` y
   `expense-form-schema.ts`), no el `useState` simple de `ContactFormDialog`.
8. `src/app/(app)/<modulo>/page.tsx` (y subrutas) — Server Component `async`,
   `export const dynamic = "force-dynamic"`, reemplaza el `ComingSoon` existente. Cada página usa
   `PageHeader` (`src/components/layout/page-header.tsx`, ver
   [ARCHITECTURE.md](./ARCHITECTURE.md#cabeceras-de-página)) para título/descripción/acciones; toda
   subruta (crear, editar, detalle, listados secundarios) le pasa `backHref` apuntando a su padre
   lógico — solo la página raíz del módulo se queda sin `backHref`.
9. El módulo ya tiene su entrada en `NAV_ENTRIES` y su fila en la matriz de permisos desde el día 1
   (ver [RBAC.md](./RBAC.md)) — no hace falta tocar nada ahí salvo que cambie el nombre del
   módulo.

**No existe `src/db/seed.ts`** — se eliminó junto con todos los `*.mock.ts` que solo lo
alimentaban (ver
[DECISIONS.md](./DECISIONS.md#se-elimina-el-seed-de-datos-demo-y-sus-mocks)): sembraba datos de
ejemplo directo sobre la base de datos real de desarrollo, sin distinguir demo de datos reales del
negocio. Un ambiente nuevo arranca con las tablas vacías — no hay atajo de "poblar con demo" para
no repetir ese riesgo.

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
7. Eliminar `src/stores/<modulo>-store.ts`.

Módulos con estado derivado (ej. `ProductWithMargin.stock.quantity`, calculado sumando
`StockMovement.delta`) o transacciones cruzadas entre stores (ej. `addProduct` que también
registra un movimiento) necesitan resolver esa lógica explícitamente al migrar — no es un
find-and-replace mecánico como en Contactos.

# Roles y permisos

Autenticación real con **better-auth** (email + contraseña, sistema cerrado sin registro
público — el Administrador crea cada cuenta desde `/admin/usuarios`). Ver
[DECISIONS.md](./DECISIONS.md#autenticación-better-auth-email--contraseña) para el porqué de cada
decisión técnica (driver, esquema, por qué no magic link/OAuth).

## Modelo

Permisos planos **módulo × acción**, no jerárquicos (así se acordó explícitamente con el negocio):

- Módulos (`AppModule`, en `src/types/permission.ts`): `inventario`, `pedidos`, `proyeccion`,
  `inversion`, `gastos`, `cierre-caja`, `contactos`, `calendario`, `admin`.
- Acciones (`PermissionAction`): `ver`, `crear`, `editar`, `eliminar`.
- Un `Role` tiene un `PermissionTree` = un `ModulePermission` por cada módulo, cada uno con las 4
  acciones en `boolean`.

Roles y usuarios viven en Postgres (`src/db/schema/roles.ts`, tabla `user` de better-auth en
`src/db/schema/auth.ts`) — es el segundo módulo migrado al backend real después de Contactos (ver
[ARCHITECTURE.md](./ARCHITECTURE.md#módulos-ya-migrados-a-backend-real-postgres--drizzle)). El
único rol sembrado es **Administrador** (`id` fijo `role-admin`, ver
`src/lib/rbac/constants.ts` → `ROLE_ADMIN_ID`), `isSystem: true` (no se puede eliminar), con las 4
acciones en `true` para todos los módulos. El admin crea roles adicionales desde
`/admin/roles/nuevo`, ajustando la matriz de permisos antes de guardar (a diferencia de antes, esos
permisos sí se persisten al crear — ver nota en DECISIONS.md sobre el bug que esto corrigió).

**Regla UX** (en `role-repository.togglePermission`, antes en `rbac-store`): desmarcar "Ver"
desmarca las demás acciones del módulo; marcar cualquier otra acción marca "Ver" automáticamente.
No tiene sentido poder crear sin poder ver.

## Cómo se aplica en la UI

- `usePermission(module, action)` (`src/lib/rbac/use-permission.ts`) resuelve
  `currentUser.roleId → Role → permissions[module].actions[action]`. `currentUser`/`roles` ya no
  salen de mocks: `src/app/(app)/layout.tsx` obtiene la sesión real (`getCurrentSession()`) y la
  lista de roles (`roleRepository.list()`) en el servidor y los hidrata una vez hacia
  `auth-store`/`rbac-store` vía `RbacHydrator` (`src/providers/rbac-hydrator.tsx`) — el resto de los
  hooks/guards no cambió.
- `<PermissionGuard module="inventario" action="crear">` oculta un fragmento de UI (ej. un botón)
  si el rol activo no tiene el permiso.
- `<RouteGuard module="admin" action="ver">` (usado en `admin/layout.tsx`) bloquea una página
  completa y redirige a `/acceso-denegado`.
- El sidebar (`app-sidebar.tsx`) filtra `NAV_ITEMS` con `usePermission(item.module, "ver")` —
  un módulo sin permiso de ver simplemente no aparece en la navegación.

**Importante**: todo lo anterior es solo del lado cliente (oculta UI, redirige) — no es la barrera
de seguridad real. Ver la siguiente sección.

## Verificación server-side (`requirePermission`)

Los guards de cliente no evitan que alguien manipule el estado del navegador y dispare una Server
Action directamente. Por eso **toda Server Action mutable** empieza con un chequeo server-side real
contra la sesión y el rol en la base de datos:

- `src/lib/rbac/require-permission.ts` — `requirePermission(module, action)` (lanza `AuthzError` si
  no hay sesión o el rol no tiene el permiso) y `checkPermission(module, action)` (variante que
  devuelve `{ error }` en vez de lanzar, para mapear directo al `ActionResult` que ya devuelven las
  Server Actions — mismo shape que un error de validación zod).
- Se usa al inicio de las Server Actions de Contactos (`src/modules/contactos/actions.ts`) y de
  Roles/Usuarios (`src/modules/admin-permisos/actions.ts`). Cualquier módulo nuevo con backend real
  debe seguir el mismo patrón — un `checkPermission` por acción, antes de tocar la base.
- La sesión también se valida en `(app)/layout.tsx` (`redirect("/login")` si no hay sesión) y de
  forma optimista (solo existencia de cookie, sin ir a la base) en `proxy.ts` — ver DECISIONS.md.

## Caso especial: chequeo de rol fuera de la matriz

Algunas acciones no deben depender de la matriz de permisos porque están reservadas al
Administrador **sin excepción**, sin importar cómo se configure un rol — por ejemplo, todas las
acciones manuales de stock en el detalle de un producto (`StockMovementActions`, cualquier tipo de
movimiento incluido el ajuste) en Inventario/Movimientos (ver `docs/MODULES.md`). Para esos casos
existe `useIsAdmin()` (`src/lib/rbac/use-permission.ts`), que compara `activeRoleId` contra
`ROLE_ADMIN_ID` (ahora en `src/lib/rbac/constants.ts`) directamente en vez de consultar
`permissions[module][action]`. Usar esto con moderación: es la excepción, no el patrón por
defecto — la mayoría de restricciones deben pasar por `usePermission`/`PermissionGuard` para que
sigan siendo configurables desde la matriz (por ejemplo, la entrada masiva por compra sí usa
`PermissionGuard module="inventario" action="crear"`, porque esa vía es la operación normal, no la
excepción de Administrador).

## Usuarios: creación y estado activo

`/admin/usuarios` permite crear usuarios nuevos (nombre, email, rol — sin campo de contraseña): el
admin no la inventa, `createUserAction` genera una temporal server-side y la muestra una sola vez
en un diálogo para copiar y entregar; el usuario la cambia después desde "Cambiar contraseña" en su
propio menú de cuenta (`SidebarFooter`). Desactivar un usuario (`active: false`) tiene efecto real:
un hook de better-auth (`databaseHooks.session.create.before` en `src/lib/auth/auth.ts`) rechaza la
creación de sesión si el usuario está inactivo, aunque la contraseña sea correcta — no es solo
cosmético como el resto de los toggles de esta fase.

## Añadir un módulo nuevo al sistema de permisos

1. Agregar el slug a `APP_MODULES` en `src/types/permission.ts`.
2. Agregar su label en `MODULE_LABELS` (`src/lib/rbac/modules.ts`).
3. Agregar la entrada de navegación en `NAV_ITEMS` (`src/lib/constants.ts`).
4. **A diferencia de cuando todo vivía en memoria**: los roles ya existentes en Postgres no ganan
   la fila nueva automáticamente (su `permissions` JSONB quedó grabado con la lista de módulos de
   cuando se crearon). Hace falta un script/migración de datos puntual que recorra `roles` y les
   agregue la entrada `{ module: "<nuevo>", actions: { ver: false, crear: false, editar: false,
   eliminar: false } }` si no la tienen. `buildEmptyPermissionTree()` (`src/types/permission.ts`)
   sigue siendo la fuente de verdad de la forma completa, útil para comparar/completar.

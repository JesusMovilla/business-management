# Roles y permisos

Login simulado (no hay auth real todavía): `auth-store` guarda un `currentUserId` y un
`activeRoleId`. El `RoleSwitcher` en el topbar deja cambiar el rol activo al vuelo para probar la
UI como cualquier rol, sin login/logout.

## Modelo

Permisos planos **módulo × acción**, no jerárquicos (así se acordó explícitamente con el negocio):

- Módulos (`AppModule`, en `src/types/permission.ts`): `inventario`, `pedidos`, `proyeccion`,
  `inversion`, `gastos`, `cierre-caja`, `contactos`, `calendario`, `admin`.
- Acciones (`PermissionAction`): `ver`, `crear`, `editar`, `eliminar`.
- Un `Role` tiene un `PermissionTree` = un `ModulePermission` por cada módulo, cada uno con las 4
  acciones en `boolean`.

4 roles semilla en `modules/admin-permisos/mock-data/roles.mock.ts` (Administrador, Vendedor,
Cajero, Bodega/Inventario), marcados `isSystem: true` (no se pueden eliminar). El admin puede crear
roles adicionales desde `/admin/roles/nuevo` — esos nacen con `buildEmptyPermissionTree()` (todo en
`false`) y se ajustan en la matriz.

**Regla UX** (en `rbac-store.togglePermission`): desmarcar "Ver" desmarca las demás acciones del
módulo; marcar cualquier otra acción marca "Ver" automáticamente. No tiene sentido poder crear sin
poder ver.

## Cómo se aplica en la UI

- `usePermission(module, action)` (`src/lib/rbac/use-permission.ts`) resuelve
  `activeRoleId → Role → permissions[module].actions[action]`.
- `<PermissionGuard module="inventario" action="crear">` oculta un fragmento de UI (ej. un botón)
  si el rol activo no tiene el permiso.
- `<RouteGuard module="admin" action="ver">` (usado en `admin/layout.tsx`) bloquea una página
  completa y redirige a `/acceso-denegado`.
- El sidebar (`app-sidebar.tsx`) filtra `NAV_ITEMS` con `usePermission(item.module, "ver")` —
  un módulo sin permiso de ver simplemente no aparece en la navegación.

## Añadir un módulo nuevo al sistema de permisos

1. Agregar el slug a `APP_MODULES` en `src/types/permission.ts`.
2. Agregar su label en `MODULE_LABELS` (`src/lib/rbac/modules.ts`).
3. Agregar la entrada de navegación en `NAV_ITEMS` (`src/lib/constants.ts`).
4. Los roles existentes ganan automáticamente una fila nueva en la matriz de permisos
   (`buildEmptyPermissionTree()`/`APP_MODULES.map` ya iteran sobre la lista completa) — no hace
   falta migrar datos porque todo vive en memoria y se siembra de nuevo en cada carga.

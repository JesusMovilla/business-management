# Documentación del proyecto

App de gestión de negocio (venta de bebidas alcohólicas): inventario, precios, pedidos,
proyecciones, inversión, gastos, cierre de caja, contactos y calendario. Next.js + TypeScript +
Tailwind + shadcn/ui, pensada para Vercel. Fase actual: solo frontend, datos mock en memoria.

- [ARCHITECTURE.md](./ARCHITECTURE.md) — estructura de carpetas, flujo de datos, y **requisito de
  responsive/mobile** (ver sección dedicada al final del documento).
- [RBAC.md](./RBAC.md) — modelo de roles y permisos, cómo se aplican en la UI.
- [MODULES.md](./MODULES.md) — qué módulo está construido vs. stub, y el patrón para construir el
  siguiente.
- [DECISIONS.md](./DECISIONS.md) — decisiones técnicas y peculiaridades a tener en cuenta (Next 16,
  Base UI en vez de Radix, Biome, zod coerce, evaluación de better-auth).

El plan de desarrollo original (fases, alcance acordado con el usuario) vive en
`C:\Users\jmovilla\.claude\plans\quiero-que-empezar-un-splendid-horizon.md`.

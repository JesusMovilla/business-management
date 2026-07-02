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

## Datos mock

Todo vive en memoria (Zustand), sembrado desde `**/mock-data/*.mock.ts` en el primer render. No hay
`localStorage` ni persistencia — un refresh de página resetea todo a los datos semilla. Es una
decisión explícita para esta fase (ver también [ARCHITECTURE.md](./ARCHITECTURE.md)).

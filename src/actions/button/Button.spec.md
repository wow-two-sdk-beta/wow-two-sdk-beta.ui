# Button

## Purpose

Trigger an action. The most basic interactive element. Use for form submission, primary CTAs, secondary actions, dismissals.

- Use **Button** when the affordance is "do a thing now."
- Use a Link component (TBD) when the affordance is "navigate somewhere."

## Anatomy

```
<button>
  ├── (optional) leading icon   ← TBD, not in v0
  ├── label / children
  └── (optional) trailing icon  ← TBD, not in v0
</button>
```

## Required behaviors

- Keyboard: Enter / Space activates
- Focus: visible focus ring via `focus-visible`
- Pointer: disabled state shows `not-allowed`-style affordance through opacity + `pointer-events: none`
- Disabled: native `disabled` attr — removed from focus order, no click events

## Visual states

`default` · `hover` · `focus-visible` · `active` · `disabled`

## Props

| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | no | Visual hierarchy in a layout |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | Density / context |
| `disabled` | `boolean` | `false` | no | Native button disabled |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | — | no | All native button attrs forwarded |

## Composition model

Plain native `<button>`. No `asChild` slot in v0 — add only if a real consumer needs polymorphism.

## Accessibility

- Renders native `<button>` — keyboard, focus, role, ARIA all built-in
- Disabled state visible AND announced via native `disabled`
- Color-contrast: variants tested against WCAG AA on the default theme

## SSR / RSC

Fully server-safe. No client-only logic, no hooks.

## Dependencies

- Foundation: `utils/cn`
- External: `tailwind-variants`

## Known limitations & non-goals

- No icon slots in v0 (add when first consumer needs them)
- No loading state in v0
- No `asChild` polymorphism in v0
- No link variant — separate Link component owns navigation

## Inspirations

- shadcn/ui Button
- Radix Button primitive
- Mantine Button

# Component standard

Every new component begins as `{Component}.spec.md` filling out this template.
The implementation must satisfy what the spec promises. Stories cover every state in "Visual states."

> **Spec is the contract.** If reality drifts from the spec, update the spec — don't let drift accumulate silently.

---

# {ComponentName}

## Purpose

What problem this solves. When to use vs alternatives. One sentence ideal.

## Anatomy

ASCII or visual diagram of the component's parts.

```
<root>
  ├── trigger
  ├── content
  └── close
</root>
```

## Required behaviors

- Keyboard navigation: which keys do what
- Focus management: where focus goes on open/close
- ARIA roles/attributes used
- Pointer/touch behaviors

## Visual states

`default` · `hover` · `focus` · `focus-visible` · `active` · `disabled` · `loading` · `error` · `success`

(Cross out states that don't apply.)

## Props

| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `propName` | `Type` | `default` | yes/no | Reason |

## Composition model

- `asChild`? compound (`Component.Trigger`)? slots? polymorphic?
- Why this shape and not another.

## Accessibility

- WCAG criteria addressed
- Known gaps (and the plan to close them)
- Screen-reader expectations

## SSR / RSC

- Client-only? Server-safe? Hydration concerns?
- If client-only, why and what's the cost?

## Dependencies

- Foundation pieces consumed (`utils/cn`, `tokens/colors`, ...)
- Internal sibling deps (should be empty — boundaries forbid sibling-domain imports)
- External: Radix primitive, library X

## Known limitations & non-goals

What this deliberately does NOT do, so future-you doesn't re-litigate it.

## Inspirations

- Reference implementations (Radix, shadcn/ui, Mantine, Ark, etc.)
- Where this differs and why

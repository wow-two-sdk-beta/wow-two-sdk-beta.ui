# {Component}

> **Behavioral contract:** [`{Component}.standard.md`](./{Component}.standard.md)

## Anatomy

{ASCII tree of slots + visual structure.}

```
<root>
  ├── leading?    (slot)
  ├── children    (label / content)
  └── trailing?   (slot)
</root>
```

## Style axes

{Concrete enum values per axis. Tables: value · description · default. If two
axes (e.g. `variant × tone`), document both with the resulting matrix.}

## Sizing & spacing

{Concrete per-size values (height, padding, font, default radius). Override
prop shapes (`padding`, `radius`, `shape`, `fullWidth`). Density CSS-var hooks
where applicable — utility classes use `calc(* var(--ui-density-scale, 1))`.}

## Content

{Slot props (`leading` / `trailing` / …). Children rules (allowed types per
HTML spec). Long-content behavior (`wrap` / `truncate`).}

## States

{Table: state · visual change · behavioral change · `data-state` value emitted.}

## Behavior

{Concrete behavioral specifics: defaults, keyboard bindings, native attribute
handling, loading semantics, form association.}

## Accessibility

{Concrete a11y implementation: required `aria-*` values, contrast at default
theme, hit target, screen-reader expectations, `forced-colors` mode handling.}

## Composition

{Code examples for each composition pattern (`asChild`, compound, etc.).
Patterns intentionally NOT built-in but supported via composition (e.g. wrap
with `<Skeleton>` for content-loading) go here with a brief note on why
they're not built-in.}

## Props summary

{Full table: name · type · default · notes.}

## Storybook coverage

{Either listed (Playground · Variants matrix · States matrix · Composition
recipes) or marked **parked** with a link to `system/sessions/.../context.md`.}

## Non-goals

{Explicit list of what's deliberately out — prevents re-litigation. Include
parked features (with deferral reason + planned home if known).}

## Inspirations

{References — Mantine / Radix / shadcn / Chakra / MUI / React Aria patterns
borrowed or rejected, with why.}

---

*Inline citations point at specific rule URLs. See linked standard's `Related`
section for broad references.*

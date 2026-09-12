# Navbar

Renders a lightweight header band (`<header>`) with `start` / `center` / `end` slots laid out in a row inside a centered `ContainerLayout`.

Source: [Navbar.vue](Navbar.vue).

Public import: `import { Navbar } from '@wow-two-beta/ui-vue/presentation/layout';`.

## Contract

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `containerSize` | `ContainerLayoutProps['size']` | no | — | The max-width of the inner centered `ContainerLayout`. Passthrough to `ContainerLayout.size`. Default `lg`. |
| `height` | `NavbarHeight` | no | — | The band height. Default `md`. |
| `sticky` | `boolean` | no | `false` | The sticky pinning of the bar to the top of the scroll container. Default `false` (non-sticky). |
| `tone` | `SurfaceTone` | no | — | The tinted background tone for the band — applies the shadow-less `subtle` surface treatment. Omit for a transparent bar (relies on `bordered` / page bg). |
| `bordered` | `boolean` | no | `true` | The bottom border under the bar. Default `true`. |

## Emits

None declared.

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `start` | `start?(): unknown;` | The leading slot — laid out at the start of the row (brand / logo / nav links). |
| `center` | `center?(): unknown;` | The centre slot — laid out in the middle of the row (search / primary nav). |
| `end` | `end?(): unknown;` | The trailing slot — laid out at the end of the row (actions / avatar / CTA). |
| `default` | `default?(): unknown;` | The raw row content — replaces the `start` / `center` / `end` slot layout when provided. Use for fully custom bars. |

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [LayoutExamples.ts](../../../../apps/playground/src/gallery/fixtures/LayoutExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.

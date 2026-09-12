# TableOfContents

Renders an outline of headings, taken from `items` (explicit) or `source` (auto-extracted).

Source: [TableOfContents.vue](TableOfContents.vue).

Public import: `import { TableOfContents } from '@wow-two-beta/ui-vue/presentation/nav';`.

## Contract

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `items` | `ReadonlyArray<TableOfContentsItem>` | no | — | Declared by the source contract. |
| `source` | `HTMLElement \| null` | no | — | The element whose headings are auto-extracted. Vue template refs unwrap to the element itself, so pass the element (`sourceRef` from `useTemplateRef`). |
| `headingSelector` | `string` | no | `'h2, h3'` | The CSS selector used with `source`. Default `h2, h3`. |
| `activeId` | `string \| null` | no | `undefined` | The override for the auto-derived active id. `undefined` keeps the derived value. |
| `isSticky` | `boolean` | no | — | The sticky toggle — applies `sticky top-4 self-start` helper classes. |

## Emits

None declared.

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `label` | `label?(props: { item: TableOfContentsItem; index: number }): unknown;` | The rich override for an item's `label`. |

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [NavExamples.ts](../../../../apps/playground/src/gallery/fixtures/NavExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.

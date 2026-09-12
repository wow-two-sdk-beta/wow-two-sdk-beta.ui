# AppShell

Renders the top-level page frame.

Source: [AppShell.vue](AppShell.vue).

Public import: `import { AppShell } from '@wow-two-beta/ui-vue/presentation/layout';`.

## Contract

- Each controlled axis has one Vue model name and one update event. Primary values use `modelValue` / `update:modelValue`; disclosure uses `open` / `update:open`. Named axes use their declared `update:*` event. Defaults seed uncontrolled state once; external updates do not emit intent.
- Mount within the owner supplying `useAppShellContext`; a compound part is not an independent root.
- The committed state uses the shared controlled-state helper: supplied controlled state is read from props; user changes report intent. The default seeds uncontrolled state. External prop updates do not themselves emit user changes.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `sidebarWidth` | `string` | no | `'240px'` | The sidebar column width, any CSS length. Default `240px`. |
| `asideWidth` | `string` | no | `'280px'` | The aside rail width, any CSS length. Default `280px`. |
| `sidebarBreakpoint` | `Breakpoint` | no | `'lg'` | The sidebar collapses below this breakpoint. Default `lg`. |
| `asideBreakpoint` | `Breakpoint` | no | `'xl'` | The aside hides below this breakpoint. Default `xl`. |
| `sidebarOpen` | `boolean` | no | `undefined` | The mobile-sidebar open state, controlled. The `v-model:sidebarOpen` binding target. |
| `defaultSidebarOpen` | `boolean` | no | `false` | The initial mobile-sidebar state when uncontrolled. Default `false`. |

## Emits

| Event | Signature | Meaning |
|---|---|---|
| `update:sidebarOpen` | `'update:sidebarOpen': [open: boolean];` | Fires when the mobile sidebar opens or closes — the `v-model:sidebarOpen` half. |

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `default` | `default(): unknown` | See the declared signature. |

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [LayoutExamples.ts](../../../../apps/playground/src/gallery/fixtures/LayoutExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.

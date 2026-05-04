# PullToRefresh

## Purpose
Mobile gesture: drag down past a threshold while at scrollTop=0 to trigger an async refresh.

## Anatomy
```
<PullToRefresh onRefresh={async () => …}>
  <scrollable list/>
</PullToRefresh>
```

## Required behaviors
- Listens to pointer-down/move/up at the top of the scroll region.
- Visual indicator (spinner) reveals as the user pulls past `threshold`.
- On release past threshold → call `onRefresh` (returns Promise); show spinner until resolved.
- Resistance feel — dragHeight grows sub-linearly past the threshold.
- Disabled when `scrollTop !== 0` (prevents accidental triggers when scrolling lists).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `onRefresh` | `() => Promise<void> \| void` | — | Required |
| `threshold` | `number` (px) | `60` | Minimum pull to trigger |
| `maxPull` | `number` (px) | `120` | Cap on visual displacement |
| `disabled` | `boolean` | `false` | |

## Accessibility
- Refresh state announces via internal `<Announce>` ("Refreshing…" / "Refreshed").
- Indicator is decorative; not focusable.

## Dependencies
Foundation: `utils`, `primitives/Announce`, `feedback/Spinner` (cross-domain L4 import).

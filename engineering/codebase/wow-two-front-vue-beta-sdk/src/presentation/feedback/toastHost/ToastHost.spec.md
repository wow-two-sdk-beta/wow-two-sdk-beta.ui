# ToastHost

## Purpose
Queue + viewport for transient notifications. Wraps the L4 `Toast` molecule. One mount per app (typically at the root); messages pushed via the singleton `toastHost` API or the `useToastHost()` hook.

## Anatomy
```
<ToastHost>                  ← viewport (fixed corner)
  ├── <Toast/>             ← per active item
  └── <Announce/>          ← screen-reader live region
</ToastHost>
```

## Required behaviors
- New toast → enters viewport, runs visual animation, auto-dismisses after `duration`.
- Pause-on-hover (configurable) — duration timer halts while pointer is over the viewport.
- Dismiss button on each toast.
- Limit on visible items (`max`); excess wait in queue, advance as slots free.
- Each new message updates the SR live region (via `Announce`).

## Visual states
`stack` (multiple visible toasts) · `single` · `paused` (hover) · `transitioning`

## Props (ToastHost)
| Name | Type | Default | Why |
|---|---|---|---|
| `position` | `'top-right' \| 'top-left' \| 'top-center' \| 'bottom-right' \| 'bottom-left' \| 'bottom-center'` | `'bottom-right'` | |
| `max` | `number` | `5` | |
| `defaultDuration` | `number` (ms) | `5000` | Per-toast `duration` overrides this. |
| `canPauseOnHover` | `boolean` | `true` | |
| `gap` | `number` (px) | `8` | |

## API
```ts
toastHost.toast({ title, description, severity, duration, action }): id
toastHost.dismiss(id)
toastHost.dismissAll()

const { toast, dismiss, dismissAll } = useToastHost();   // hook variant — same surface
```

`severity`: `info | success | warning | danger | neutral` — passes through to `Toast`'s underlying `ToastSimple`.

## Composition model
External store (singleton) + `ToastHost` component subscribes. Components anywhere in the tree call `toastHost.toast(…)` without prop drilling.

## Accessibility
- Each toast: `role="status"` (polite) — already on `ToastSimple`.
- Wrapping viewport: `<Announce>` mirrors the latest toast title for SR fallback.
- Dismiss button: `aria-label` (already on `Toast`).
- Pointer-over pauses auto-dismiss → keyboard focus likewise pauses.

## Dependencies
Foundation: `utils`, `primitives/Portal`, `primitives/Announce`. Same domain: `Toast`.

## Inspirations
Sonner, react-hot-toast, Mantine `Notifications`. Ours: Sonner-style external store + Mantine-style positions, no extra deps.

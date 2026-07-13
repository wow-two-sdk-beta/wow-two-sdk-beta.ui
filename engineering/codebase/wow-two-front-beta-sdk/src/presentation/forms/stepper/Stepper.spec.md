# Stepper

## Purpose
Multi-step workflow indicator + panel switcher. Each step has a label and a panel; the user moves through them sequentially. Different from the L4 `ProgressSteps` (display-only progress indicator) — `Stepper` is stateful and switches panels.

## Anatomy
```
<Stepper>
  ├── <Stepper.List>
  │     ├── <Stepper.Step value>
  │     └── ...more
  │   </Stepper.List>
  └── <Stepper.Panel value>  (one per step)
</Stepper>
```

## Required behaviors
- Click an unlocked step to jump there. (Future: lock-forward mode where users can only move forward.)
- Visited steps show a check; current step shows the index in a filled circle; future steps show the index in an outlined circle.
- Roving focus between step buttons.
- ARIA: list = `role="tablist"` (or just visual-only); steps = `role="tab"` with `aria-current="step"` on the active one; panel = `role="tabpanel"`.

(We're using the tab/panel ARIA pattern since the underlying interaction is identical to Tabs — just visualised differently.)

## Visual states (per step)
`pending` (future) · `active` (current) · `complete` (visited) · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string` | — | no | Controlled active step. |
| `defaultValue` | `string` | — | no | Uncontrolled. |
| `onValueChange` | `(v) => void` | — | no | Callback. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | no | Layout. |

`Stepper.Step`: `value`, `disabled?`, optional `description` (sub-label).

## Composition
Compound. Tracks active step + ordered list of step values for prev/next + complete-state derivation.

## Accessibility
- WAI-ARIA Tabs pattern (panels switch on selection).

## Known limitations
- No "lock forward" / "validate before advance" hooks (deferred — caller can intercept `onValueChange`).
- No "complete the wizard" final state.

## Inspirations
- Mantine `Stepper`.
- MUI `Stepper`.
- Ark UI `Steps`.

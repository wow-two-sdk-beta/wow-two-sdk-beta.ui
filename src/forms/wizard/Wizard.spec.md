# Wizard

## Purpose
Multi-step form flow: one step visible at a time, with prev/next navigation, per-step validation, optional jump-back-to-edit. State managed centrally so consumer can reach into it via `useWizard()`.

## Anatomy
```
<Wizard onComplete={…}>
  ├── Wizard.Steps (header indicator — optional)
  ├── Wizard.Step id="account">
  ├── Wizard.Step id="profile">
  ├── Wizard.Step id="review" final>
  └── Wizard.Footer (Prev / Next / Submit)
</Wizard>
```

## Required behaviors
- Single step rendered at a time (others unmounted).
- Prev/Next navigate; Next on last step → Submit.
- Per-step `validate?: () => boolean | Promise<boolean>` runs on Next.
- `canGoBack` controls allow-revisit; default true.
- `Steps` indicator highlights current and visited.

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `currentStep` / `defaultCurrentStep` / `onStepChange` | controlled by id or index | uncontrolled by default | |
| `onComplete` | `() => void \| Promise<void>` | — | Called after final-step Next |
| `canGoBack` | `boolean` | `true` | |

## Step props
| Name | Type | Default | Why |
|---|---|---|---|
| `id` | `string` | required | Stable identifier |
| `label` | `ReactNode` | — | For Steps header |
| `validate` | `() => boolean \| Promise<boolean>` | — | Block Next on `false` |
| `final` | `boolean` | `false` | Marks last step (submit instead of next) |
| `optional` | `boolean` | `false` | Allow Skip |

## Composition
Compound. Children are walked via `Children.map` to register Step metadata in context. `Wizard.Footer` consumes the context to render Prev / Next / Submit buttons.

## Accessibility
- Step header: `role="tablist"` + each step `role="tab"` + `aria-selected` + `aria-disabled` for non-visited.
- Step body: `role="tabpanel"` + `aria-labelledby` of header tab.
- Submit button submits a wrapping `<form>` if present.

## Dependencies
Foundation: `utils`, `hooks/useControlled`. Same domain: `forms/stepper` is **not** reused — Stepper is a display-only stepper; Wizard owns its own flow + can compose Stepper for visualization if desired (we keep Wizard self-contained for first generation).

## Inspirations
React Hook Form Wizard patterns; Mantine Stepper-as-Wizard.

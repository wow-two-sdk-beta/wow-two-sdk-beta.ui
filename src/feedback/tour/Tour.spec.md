# Tour

## Purpose
Step-by-step product walkthrough. Each step targets an element by selector / ref and renders a spotlight cutout + tooltip with content + Next / Prev / Skip / Done.

## Anatomy
```
<Tour open onOpenChange steps={[{ target, title, body, placement }]}>
  → renders backdrop with cutout + floating tooltip
</Tour>
```

## Required behaviors
- Resolves each step's `target` to a DOM rect (selector via `document.querySelector` or live ref).
- Renders a full-viewport SVG mask: dark backdrop with a transparent rectangle around the target.
- Tooltip floats near the target, switches placement to fit viewport.
- Click outside *cutout* (i.e. on the dim region) ignored — only Next / Prev / Skip / Done close.
- Escape closes (call onSkip).
- On window resize / scroll, the mask updates.
- Live region announces current step ("Step X of Y: title").

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | controlled | uncontrolled | |
| `steps` | `TourStep[]` | required | List of steps |
| `currentStep` / `defaultCurrentStep` / `onStepChange` | controlled by index | uncontrolled by default | |
| `onComplete` | `() => void` | — | Final-step Done |
| `onSkip` | `() => void` | — | Skip / Escape |
| `padding` | `number` (px) | `8` | Cutout extra padding around target |

## Step shape
```
{
  target: string | RefObject<HTMLElement>,
  title?: ReactNode,
  body?: ReactNode,
  placement?: 'top' | 'right' | 'bottom' | 'left',
}
```

## Accessibility
- Tooltip: `role="dialog"` + `aria-labelledby` + `aria-describedby`.
- Mask is `aria-hidden` (decorative).
- Tour announces step via `<Announce>`.

## Dependencies
Foundation: `utils`, `primitives/Portal`, `primitives/Announce`. No cross-domain.

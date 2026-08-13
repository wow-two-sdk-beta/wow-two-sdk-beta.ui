# LoadingOverlay

## Purpose
Blocks interaction with a region (or the whole viewport) while a long-running task is in flight. Scrim + centered spinner + optional label.

## Anatomy
```
<LoadingOverlay isOpen>
  ├── Backdrop (scrim, optional blur)
  └── center
      ├── Spinner
      └── label (optional)
</LoadingOverlay>
```

## Required behaviors
- When `isOpen`, scrim covers parent (or viewport).
- Pointer events captured by the scrim — underlying UI is non-interactive.
- Polite live region announces label changes.

## Visual states
`closed` (returns null) · `open` · `open + blur` · `inline` (positioned within parent, not viewport)

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `isOpen` | `boolean` | `true` | Controls mount. |
| `label` | `ReactNode` | `'Loading…'` | Visible + announced. |
| `isInline` | `boolean` | `false` | Position inside parent (parent must be `position: relative`) instead of fixed-viewport. |
| `hasBlur` | `boolean` | `false` | Scrim blurs background. |
| `spinnerSize` | `Spinner['size']` | `'lg'` | |
| `spinnerTone` | `Spinner['tone']` | `'brand'` | |

## Composition model
Single component. Cross-domain composes `overlays/Backdrop` for the scrim. Spinner is same-domain.

## Accessibility
- Wrapper has `role="status"` (polite live region) so screen readers announce the busy state without an `aria-busy` suppression.
- Label is visible AND part of the status region (so it gets read).

## Dependencies
Foundation: `utils`. Same domain: `feedback/Spinner`. Cross-domain: `overlays/Backdrop`.

## Inspirations
Mantine `LoadingOverlay`, MUI `Backdrop` + `CircularProgress`. Ours: minimal — just scrim + centered spinner + label.

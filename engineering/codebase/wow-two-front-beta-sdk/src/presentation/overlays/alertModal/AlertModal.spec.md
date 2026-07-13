# AlertDialog

## Purpose
Confirm-style dialog — a `Dialog` variant that requires explicit user action to close. Used for destructive operations ("Are you sure you want to delete?") or other flows where dismissing by accident is undesirable.

## Anatomy
```
<AlertDialog>
  ├── <AlertDialog.Trigger asChild?>
  └── <AlertDialog.Content>
        ├── <AlertDialog.Header>
        │     ├── <AlertDialog.Title>
        │     └── <AlertDialog.Description>
        ├── <AlertDialog.Body>
        └── <AlertDialog.Footer>
              ├── <AlertDialog.Cancel>
              └── <AlertDialog.Action onAction>
            </AlertDialog.Footer>
      </AlertDialog.Content>
</AlertDialog>
```

## Differences from `Dialog`
- `role="alertdialog"` (screen readers announce it more emphatically).
- Backdrop click does NOT dismiss (`dismissOnOutsideClick={false}`).
- Escape still closes by default (override per-instance if needed).
- Footer requires `Cancel` and `Action` — no X close in corner.

## Required behaviors
- Same as `Dialog` plus: outside click does nothing.
- `Action` runs callback then closes.
- `Cancel` just closes.

## Props
- `AlertDialog`: same as `Dialog` (with `role` locked to `alertdialog` and `dismissOnOutsideClick` locked to `false`).
- `AlertDialog.Action`: `onAction?` callback — runs before close.
- `AlertDialog.Cancel`: same as `Dialog.Close`.

## Composition
Wraps `Dialog`. Same-domain reuse (overlays domain).

## Accessibility
- WAI-ARIA AlertDialog pattern.
- Title required and linked via `aria-labelledby`.
- Initial focus typically lands on the safe option (Cancel) — caller can override via `autoFocus`.

## Inspirations
- Radix `AlertDialog`.
- shadcn/ui `AlertDialog`.

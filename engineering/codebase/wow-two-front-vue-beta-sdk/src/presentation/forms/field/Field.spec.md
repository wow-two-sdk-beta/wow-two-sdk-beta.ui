# FormField

## Purpose
Label + control + helper + error wrapper. Wraps children in a `FormControlProvider` so the inner control gets `id` / `aria-describedby` / `aria-invalid` / `disabled` / `required` / `readOnly` auto-wired.

## Props
| Name | Type | Default |
|---|---|---|
| `label` | `ReactNode` | — |
| `helper` | `ReactNode` | — |
| `error` | `ReactNode` | — (truthy → invalid) |
| `isRequired` | `boolean` | `false` |
| `isDisabled` | `boolean` | `false` |
| `isReadOnly` | `boolean` | `false` |
| `children` | `ReactNode` (single control) | — (required) |

## Dependencies
Foundation: `utils/cn`, `primitives/formControlContext`. Same-domain: `Label`, `FormHelperText`, `FormErrorMessage`.

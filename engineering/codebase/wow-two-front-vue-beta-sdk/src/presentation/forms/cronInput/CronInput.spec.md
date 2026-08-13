# CronInput

## Purpose
Text field for cron expressions with a live human-readable preview ("Every 5 minutes", "At 09:00 on Monday and Friday"). First-gen handles the common cases (`*`, `*/N`, `N`, `N,M,O`, `N-M`); complex `?`, `L`, `W`, `#` quartz extensions are deferred.

## Anatomy
```
<CronInput>
  ├── <input type="text"> (cron string)
  └── preview line ("Every X minutes")
</CronInput>
```

## Required behaviors
- 5-field cron (`min hour dom month dow`).
- Validates each field; shows compact error if any field is invalid.
- Preview re-renders on every change.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `string` | controlled / uncontrolled | |
| `placeholder` | `string` | `'* * * * *'` | |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `invalid` | `boolean` | `false` | Force-error styling |
| `showPreview` | `boolean` | `true` | |
| `name` | `string` | — | |

## Accessibility
- Standard `<input>` semantics.
- Preview is `aria-live="polite"`.

## Dependencies
Foundation: `utils`. Same domain: `forms/InputStyles`.

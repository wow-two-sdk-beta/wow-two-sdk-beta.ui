# KeyboardShortcutPicker

## Purpose
Capture a keyboard chord by recording the user's next key combination. Outputs an array of normalized key names (e.g. `['Meta', 'K']`); displays via `Kbd` chips when not recording.

## Anatomy
```
<KeyboardShortcutPicker>
  ├── display chips (when set)
  └── "Record" / "Press keys…" button
</KeyboardShortcutPicker>
```

## Required behaviors
- Click "Record" → button enters listening state.
- During listening: capture next non-modifier-only keydown; bundle pressed modifiers + key.
- Escape during listening → cancel without changing.
- Backspace during listening → clear.
- Click outside while listening → cancel.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `string[]` | controlled / uncontrolled | Normalized key names |
| `placeholder` | `ReactNode` | `'Click to record'` | When empty |
| `recordLabel` | `ReactNode` | `'Press keys…'` | Listening state |
| `disabled` | `boolean` | `false` | |
| `name` | `string` | — | Hidden input emits `+`-joined chord |

## Accessibility
- Single `<button>` toggles record mode; `aria-pressed` reflects listening state.
- Escape returns focus to button.

## Dependencies
Foundation: `utils`. Same domain: nothing. Cross-domain: `display/Kbd`.

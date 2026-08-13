# RecurrenceEditor

## Purpose
Build an iCal RRULE string visually. Frequency / interval / weekdays / month-day / end-mode (never / count / until). Live preview of the next N occurrences.

## Anatomy
```
<RecurrenceEditor>
  ├── frequency select (daily / weekly / monthly / yearly)
  ├── interval input (every N <freq>)
  ├── weekday checkbox row (weekly only)
  ├── monthday input (monthly only)
  ├── end-mode (never / after N / on date)
  └── preview list (next 5 occurrences)
</RecurrenceEditor>
```

## Required behaviors
- Returns RRULE-style object via `onValueChange(rule)`.
- `value`: `{ freq, interval, byDay?, byMonthDay?, count?, until? }`.
- Optional `name` emits hidden input with serialized RRULE string.
- Preview computes next N occurrences relative to `from` (default today).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | controlled | uncontrolled | |
| `from` | `Date` | today | Anchor for the rule + preview start |
| `previewCount` | `number` | `5` | |
| `weekStart` | `0 \| 1` | `0` | |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `name` | `string` | — | Emits hidden input with `RRULE:FREQ=…` string |

## Accessibility
- Each control has `<label>` association.
- Preview list = `<ul>` with `aria-live="polite"`.

## Composition
Single component (form internal). No compound surface in first-gen.

## Dependencies
Foundation: `utils`, `forms/InputStyles`, `forms/DateExtensions`.

## Known limitations (deferred)
- No `BYMONTH`, `BYWEEKNO`, `BYHOUR`/`BYMINUTE` filters.
- No nth-weekday-of-month (e.g. "second Tuesday") — only fixed monthday today.
- No exception dates (`EXDATE`).
- Output is a JS object + a basic RRULE string; consumers wanting full iCalendar interop should run it through a real ical lib.

# EventCalendar

## Purpose
Full event-display calendar with month / week / day / agenda views. Events are rendered as colored blocks (timed: positioned by hour; all-day: full-width bar). Navigation: Today / Prev / Next + view switcher.

## Anatomy
```
<EventCalendar events>
  ├── header (Today / Prev / Next / Title / View switcher)
  └── view-specific body
       ├── month: 7×N day grid; events as inline rows in each cell
       ├── week:  7-col × 24h grid; events positioned by start/end
       ├── day:   1-col × 24h grid; events positioned by start/end
       └── agenda: list grouped by date
</EventCalendar>
```

## Required behaviors
- Event spans across days: in month view, render across cells; in week/day view, position vertically by hour.
- All-day events: pinned to top of day; full-width.
- Click event → `onEventClick(event)`.
- Click empty slot → `onSlotClick(date)` (month view: date), or `(date, hour)` (week/day view).
- Keyboard nav between days: arrow keys (month/week view).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `events` | `Array<{ id; start; end; title?; color?; allDay?: boolean }>` | required | |
| `view` / `defaultView` / `onViewChange` | `'month' \| 'week' \| 'day' \| 'agenda'` | `'month'` | |
| `date` / `defaultDate` / `onDateChange` | `Date` | today | Anchor |
| `weekStart` | `0 \| 1` | `0` | |
| `hourRange` | `[number, number]` | `[0, 24]` | Visible hours in week/day view |
| `onEventClick` | `(event) => void` | — | |
| `onSlotClick` | `(date: Date, hour?: number) => void` | — | |
| `monthLabels` / `weekdayLabels` | `string[]` | defaults | |

## Composition
Single component (view internal). Future iteration may compound (`EventCalendar.Month` etc.) for fine-grain customization, but first-gen keeps the API flat.

## Accessibility
- Header navigation: real `<button>` elements with `aria-label` ("Previous month" etc.).
- View switcher: `role="radiogroup"`.
- Day cells (month view): `<button>` with `aria-label` ("March 15, 2026: 3 events").
- Events: `role="button"` with `aria-label` (title + start time).

## Dependencies
Foundation: `utils`, `icons`. Same domain: nothing (computes its own date math). Within-domain: `forms/DateExtensions` for shared helpers.

## Known limitations (deferred)
- No drag-create / drag-move / drag-resize.
- No recurrence expansion (consumer flattens).
- No timezone handling beyond local time.
- No multi-day overflow chips ("+N more") in month view; events truncate.
- Accessibility for week/day events is minimal.
- No mini-calendar sidebar.

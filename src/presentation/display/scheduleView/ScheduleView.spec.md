# ScheduleView

## Purpose
Multi-resource time-grid: rooms / people / channels along the Y axis, hours along the X axis. Bookings rendered as colored blocks. Common in booking apps, conference rooms, broadcast schedules.

## Anatomy
```
<ScheduleView resources bookings date hourRange?>
  ├── header row (hours)
  └── per-resource row
       ├── label cell
       └── timeline (relatively positioned bookings)
</ScheduleView>
```

## Required behaviors
- Single-day view (`date` prop). For multi-day, render multiple `<ScheduleView>` side-by-side.
- Bookings are positioned by start/end times against `hourRange`.
- Click a booking → `onBookingClick(booking)`.
- Click empty slot → `onSlotClick(resourceId, time)`.
- Hover/focus → tooltip-like info in built-in renderer.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `resources` | `Array<{ id; label; color? }>` | required | |
| `bookings` | `Array<{ id; resourceId; start; end; label?; color? }>` | required | |
| `date` | `Date` | today | Anchor day |
| `hourRange` | `[number, number]` | `[8, 20]` | Visible hours (8 AM – 8 PM) |
| `slotMinutes` | `number` | `30` | Grid resolution |
| `onBookingClick` | `(booking) => void` | — | |
| `onSlotClick` | `(resourceId, time: Date) => void` | — | |
| `renderBooking` | `(booking) => ReactNode` | default block | |

## Accessibility
- Resource rows = `role="row"`; bookings = `role="button"` with `aria-label` (resource + time + label).
- No keyboard nav between bookings yet (deferred).

## Dependencies
Foundation: `utils`. Same domain: nothing. No external libs.

## Known limitations (deferred)
- No drag-resize/move bookings.
- No conflict detection.
- No multi-day view (consumer composes).
- No keyboard nav between cells / bookings.

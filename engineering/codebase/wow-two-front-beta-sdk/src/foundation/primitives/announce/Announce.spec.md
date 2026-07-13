# Announce

## Purpose
Visually-hidden ARIA live region for screen-reader announcements. Used by Toaster (and any component that needs to announce a transient state change without visible feedback).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `politeness` | `'polite' \| 'assertive'` | `'polite'` | Maps to `role="status"` (polite) or `role="alert"` (assertive). |
| `children` | `ReactNode` | — | Message body. Live region re-announces when this changes. |

## Composition model
Plain forward-ref `<div>`. No state, no portal — caller decides where it lives in the tree. For simple cases, mount a stable `<Announce>` and swap its `children` to push messages.

## Accessibility
- `role="status"` (polite) / `role="alert"` (assertive)
- `aria-live` matches politeness
- `aria-atomic="true"` so the entire content is announced on change
- Visually hidden via the same clip-path technique as `VisuallyHidden`

## Dependencies
Foundation: `utils/cn`. Sibling primitive sibling-proof — no other primitives.

## Inspirations
Radix `LiveRegion`, React Aria `Announcer`. Ours is the simplest possible: one component, no context, no queue.

# BackToTopButton

## Purpose
Floating button that appears once the user has scrolled past a threshold; clicks scroll the page (or a custom container) to top.

## Anatomy
Single floating button (icon + optional label). Default position bottom-right.

## Required behaviors
- Hidden until `scrollY >= threshold` (or `scrollContainer.scrollTop >= threshold`).
- Click → smooth scroll to top.
- Respects `prefers-reduced-motion` (jumps without smooth).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `threshold` | `number` (px) | `400` | When to reveal |
| `scrollContainer` | `HTMLElement \| null` | `window` | Scope to a specific scrollable region |
| `position` | same union as FAB | `'bottom-right'` | Reuses FAB position variant |
| `label` | `ReactNode` | hidden — `aria-label="Back to top"` | Accessible by default |

## Composition
Single component. Visibility tracked via `scroll` listener (passive).

## Accessibility
- Real `<button>` with `aria-label`.
- Hidden = `display: none` (not just `aria-hidden`) so it's removed from the tab order.

## Dependencies
Foundation: `utils`, `icons`. No cross-domain.

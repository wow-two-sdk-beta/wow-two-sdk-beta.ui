# Confetti

## Purpose
Burst of colorful particles that fall with simple physics. Common on success states (form submit, signup, achievement). Imperative API via ref (`fire()`) or declarative `active` prop.

## Anatomy
Full-viewport SVG overlay (portaled). Particles are SVG rects/circles, animated via rAF.

## Required behaviors
- Each `fire()` spawns `particleCount` particles at the trigger origin (center of viewport by default), with random velocity/angle.
- Particles fall under gravity until off-screen, then auto-cleanup.
- Multiple bursts can stack.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `particleCount` | `number` | `60` | Per burst |
| `colors` | `string[]` | `['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7']` | |
| `gravity` | `number` (px/s²) | `1200` | |
| `spread` | `number` (deg) | `60` | Angle spread (full = 360°) |
| `velocity` | `number` (px/s) | `500` | Initial speed |
| `lifetime` | `number` (ms) | `3000` | Hard cleanup ceiling |
| `origin` | `{ x?: number; y?: number }` | viewport center | Trigger point (px from top-left) |

## Imperative API
- `ref.current.fire(opts?)` — spawn a burst with optional override.

## Accessibility
- `aria-hidden="true"` overlay; SR-irrelevant.
- Honors `prefers-reduced-motion` (becomes a no-op).

## Dependencies
Foundation: `utils`, `primitives/Portal`. No external libs.

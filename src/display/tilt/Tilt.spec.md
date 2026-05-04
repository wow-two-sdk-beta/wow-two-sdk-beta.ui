# Tilt

## Purpose
3D card tilt effect — rotateX/rotateY based on mouse position relative to the element. Common on landing-page feature cards and product imagery.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `maxAngle` | `number` (deg) | `12` | Max tilt angle in either axis |
| `perspective` | `number` (px) | `800` | CSS perspective |
| `glare` | `boolean` | `false` | Add a soft glare highlight following the cursor |
| `scale` | `number` | `1` | Scale up while hovered (1.0 = none) |
| `as` | tag | `'div'` | |

## Accessibility
Honors `prefers-reduced-motion`: disables the effect (children render flat).

## Dependencies
Foundation: `utils`.

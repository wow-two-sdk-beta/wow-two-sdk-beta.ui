# ProgressSteps

## Purpose
Visual N-of-M step indicator with connectors. Consumer drives `current`; no built-in step content/state machine. For full wizard semantics use the L5 `Stepper` organism (planned).

## Props
| Name | Type | Default |
|---|---|---|
| `steps` | `string[]` | — (required) |
| `current` | `number` | — (required) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`.

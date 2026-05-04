# OnboardingChecklist

## Purpose
First-run task list that tracks per-task completion + total progress; collapsible card; auto-dismissable when 100%.

## Anatomy
```
<OnboardingChecklist>
  ├── header (title + progress bar + collapse toggle)
  └── tasks
       ├── OnboardingChecklist.Task (icon · label · description · CTA · checked)
       └── ...
</OnboardingChecklist>
```

## Required behaviors
- Each `Task` shows its checked state and an action CTA.
- Progress bar = `done / total`.
- Click header → collapse / expand.
- When all tasks done, optional auto-dismiss after `dismissDelay`.

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `title` | `ReactNode` | `'Get started'` | |
| `defaultOpen` | `boolean` | `true` | Collapsed by default if `false` |
| `dismissOnComplete` | `boolean` | `false` | Hide after all tasks done |
| `dismissDelay` | `number` (ms) | `2000` | After completion |
| `onDismiss` | `() => void` | — | Called when component decides to unmount |

## Task props
| Name | Type | Default | Why |
|---|---|---|---|
| `label` | `ReactNode` | — | |
| `description` | `ReactNode` | — | |
| `done` | `boolean` | `false` | Checked state |
| `action` | `ReactNode` | — | CTA (button) |

## Accessibility
- Header is a real `<button>` with `aria-expanded`.
- Task list uses `role="list"` + `<li role="listitem">` for SR.
- Progress: `<progress>` semantic; visible bar is decorative.

## Dependencies
Foundation: `utils`, `icons`. No cross-domain.

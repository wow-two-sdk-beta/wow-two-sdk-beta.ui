# @wow-two-beta/ui

> ⚠️ **Beta-forever.** No semver, no API stability, no graduation roadmap. Ship fast, fix-forward.

Cross-project React UI library for the wow-two ecosystem. Lives in this single repo until the platform layer below it stabilizes; only then distill into a clean `@wow-two/ui`.

## Install

```bash
pnpm add @wow-two-beta/ui
```

## Use

```tsx
import { Button } from '@wow-two-beta/ui';
import '@wow-two-beta/ui/styles.css';
```

Subpath imports for tree-shake-friendly consumption:

```tsx
import { Button } from '@wow-two-beta/ui/actions';
import { wowTwoPreset } from '@wow-two-beta/ui/tailwind';
import { cn } from '@wow-two-beta/ui/utils';
```

## Develop

```bash
pnpm install
pnpm storybook       # component catalog at localhost:6006
pnpm playground      # vite sandbox
pnpm build           # tsup bundle
pnpm typecheck
pnpm lint            # ESLint with boundary enforcement
```

## Layout

- `src/tokens` `src/tailwind` `src/utils` `src/hooks` `src/icons` — **foundation** (no upward deps)
- `src/actions` `src/display` `src/feedback` `src/forms` `src/layout` — **domains** (foundation OK; sibling domains BLOCKED by ESLint)

See `docs/architecture.md` for the layering rule and `docs/component-standard.md` for the per-component spec template every new component fills out before code.

## License

MIT

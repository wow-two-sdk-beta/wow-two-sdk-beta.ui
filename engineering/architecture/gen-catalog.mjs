// Generates component-catalog.md from the package source folders.
//   node engineering/architecture/gen-catalog.mjs   (run from anywhere — self-locating)
//
// name    = component's *.spec.md h1 (fallback: PascalCase folder)
// purpose = spec's '## Purpose' line → first prose line → OVERRIDES (hand-authored,
//           for the spec-less components). Node builtins only; no deps.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '../codebase/wow-two-front-beta-sdk/src');
const OUT = path.join(HERE, 'component-catalog.md');
const LINK = '../codebase/wow-two-front-beta-sdk/src'; // from this doc back to the source

const GROUPS = ['actions', 'display', 'feedback', 'forms', 'layout', 'nav', 'overlays'];

// Hand-authored purposes for components that lack a spec `## Purpose` (verified
// against each component's source). Used only when nothing is extracted.
const OVERRIDES = {
  Button: 'The core button — `variant` × `tone` styling, icon slots, and a loading state; renders `<button>` or `asChild`.',
  CopyButton: 'Button that copies text to the clipboard and flips to a copied state.',
  Divider: 'A rule between content — plain, or with a centered label; orientation is required.',
  Surface: 'Themed surface container atom — background, border, and elevation tokens.',
  ControlGroup: 'Groups a labelled set of controls into one connected block (label + content).',
  OptionTile: 'Selectable tile acting as a radio/checkbox option; disable a whole grid via `<fieldset disabled>`.',
  OptionTileGroup: 'Single- or multi-select group of `OptionTile`s.',
  ActivityFeed: 'Chronological list of activity / event entries.',
  AnnotationMarker: 'Clickable marker pinning an annotation to a point on content.',
  ChatBubble: 'A single chat message bubble (sender side, tail, grouping).',
  CommentThread: 'Threaded comment list with nested replies.',
  ThreadView: 'Threaded conversation view.',
  Eyebrow: 'Small kicker / eyebrow label rendered above a heading.',
  FeatureCard: 'Marketing card highlighting a feature (icon + title + copy).',
  PricingCard: 'Pricing-tier card — name, price, feature list, and CTA.',
  StepCard: 'Numbered step card for how-it-works / onboarding sequences.',
  FrameGlyph: 'Decorative SVG glyph of a rounded frame.',
  RadiusGlyph: 'Decorative SVG glyph illustrating a corner-radius value.',
  ModuleGlyphs: 'Decorative SVG geometry glyphs (spec preview shapes).',
  MessageList: 'Scrollable list of chat messages with grouping.',
  MetaInline: 'Inline meta row — small metadata items with an optional trailing actions slot.',
  MetricChip: 'Compact chip showing a labeled metric (icon + value + label).',
  ReactionBar: 'Row of emoji-reaction toggles with counts.',
  ReactionPicker: 'Popover picker for choosing an emoji reaction.',
  Sortable: 'Drag-to-reorder list container (provides sortable context to its items).',
  FeedbackToasts: 'Presentation adapter that renders the headless feedback bus as toasts.',
  LiveCursor: "Renders a remote user's live cursor (colored pointer + label) for multiplayer presence.",
  NotificationCenter: 'Panel listing notifications with read / unread state.',
  PresenceIndicator: 'Online / away / offline status dot for a user or avatar.',
  TypingIndicator: 'Animated "user is typing…" indicator.',
  ChatComposer: 'Message composer — multiline input with send / attachment actions.',
  DateTimeField: 'Combined date + time input field.',
  AccessibleIcon: 'Pairs a decorative (aria-hidden) icon with a visually-hidden accessible label.',
  AnchoredPositioner: 'Positions a floating element against an anchor (placement, offset, flip, shift).',
  Collection: 'Tracks descendant items in DOM order for keyboard-navigable components.',
  ColorModeProvider: 'Provides and toggles light / dark color mode via context + the `dark` class.',
  DirectionProvider: 'Provides text direction (ltr / rtl) to descendants.',
  DismissableLayer: 'Dismisses content on outside-pointer / Escape, coordinating nested layers.',
  FocusScope: 'Contains / traps focus within a region and restores it on unmount.',
  FormControlContext: "Shares a Field's id / label / error / disabled wiring down to its control.",
  OverlayArrow: 'Positioned arrow pointing from a floating panel to its anchor.',
  Portal: 'Renders children into another DOM node (default `document.body`).',
  Presence: 'Keeps an element mounted across enter / exit so transitions can play before unmount.',
  RovingFocusGroup: 'Single tab-stop group with arrow-key roving focus across items (DOM order).',
  ScrollLockProvider: 'Locks body scroll with scrollbar-gutter compensation while an overlay is open.',
  ScrollViewport: 'Scrollable region that reserves the scrollbar gutter to avoid layout shift.',
  Slot: 'Merges its props and ref onto a single child element (the `asChild` primitive).',
  VisuallyHidden: 'Hides content visually while keeping it available to screen readers.',
};

const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
function firstSentence(s) {
  const m = s.match(/^(.*?[.?!])(\s|$)/);
  let out = m ? m[1] : s;
  if (out.length > 150) out = out.slice(0, 147).replace(/\s\S*$/, '') + '…';
  return out;
}
function specFor(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.spec.md'));
  if (!files.length) return null;
  const camel = path.basename(dir);
  return path.join(dir, files.find((f) => f.toLowerCase() === camel.toLowerCase() + '.spec.md') || files[0]);
}
function extract(dir) {
  const camel = path.basename(dir);
  const spec = specFor(dir);
  let name = pascal(camel);
  let purpose = '';
  let lines = null;
  let h1 = null;
  if (spec) {
    lines = fs.readFileSync(spec, 'utf8').split('\n');
    h1 = lines.find((l) => /^#\s+/.test(l));
    if (h1) name = h1.replace(/^#\s+/, '').trim();
    const pi = lines.findIndex((l) => /^##\s+Purpose/i.test(l));
    if (pi >= 0) {
      for (let i = pi + 1; i < lines.length; i++) { if (lines[i].trim()) { purpose = lines[i].trim(); break; } }
    }
  }
  // Precedence: spec `## Purpose` → hand-authored OVERRIDES → first prose line in spec.
  if (!purpose && OVERRIDES[name]) purpose = OVERRIDES[name];
  if (!purpose && lines) {
    const start = h1 ? lines.indexOf(h1) + 1 : 0;
    let inFence = false;
    for (let i = start; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t.startsWith('```')) { inFence = !inFence; continue; }
      if (inFence || !t) continue;
      if (/^[>#|\-*]/.test(t)) continue;
      if (t.startsWith('<') || /[←→│┌└├─]/.test(t)) continue;
      purpose = t; break;
    }
  }
  return { name, purpose: purpose ? firstSentence(esc(purpose)) : '' };
}
function componentDirs(base) {
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(base, e.name))
    .filter((d) => fs.readdirSync(d).some((f) => f.endsWith('.tsx')))
    .sort();
}

let body = '';
let total = 0;
for (const g of GROUPS) {
  const dirs = componentDirs(path.join(SRC, 'presentation', g));
  total += dirs.length;
  body += `\n### presentation/${g}\n\n`;
  body += `\`import { … } from '@wow-two-beta/ui/presentation/${g}'\` · ${dirs.length} components\n\n`;
  body += `| Component | Purpose |\n|---|---|\n`;
  for (const d of dirs) {
    const { name, purpose } = extract(d);
    body += `| [\`${name}\`](${LINK}/presentation/${g}/${path.basename(d)}/) | ${purpose} |\n`;
  }
  body += `\n---\n`;
}
const prims = componentDirs(path.join(SRC, 'foundation', 'primitives'));
body += `\n### foundation/primitives\n\n`;
body += `\`import { … } from '@wow-two-beta/ui/foundation/primitives'\` · ${prims.length} primitives (L2 headless)\n\n`;
body += `| Primitive | Purpose |\n|---|---|\n`;
for (const d of prims) {
  const { name, purpose } = extract(d);
  body += `| [\`${name}\`](${LINK}/foundation/primitives/${path.basename(d)}/) | ${purpose} |\n`;
}

const header = `# Component Catalog

*Last updated: 2026-07-13*

Every shipped component in \`@wow-two-beta/ui\`, grouped by presentation group + foundation primitives. Import from the group **subpath** (tree-shakes to just that slice); each name links to its source folder (spec + stories live there).

**${total + prims.length} entries** — ${total} presentation components across ${GROUPS.length} groups + ${prims.length} foundation primitives (L2 headless).

## Convention

- **Derived, not hand-maintained.** This file is generated from the component folders (\`src/{layer}/{group}/{component}/\`) by [\`gen-catalog.mjs\`](./gen-catalog.mjs). Regenerate after adding/removing a component: \`node engineering/architecture/gen-catalog.mjs\`. Never hand-edit rows — they drift.
- **Row** = one component folder. **Name** = its \`*.spec.md\` h1 (or PascalCase folder). **Purpose** = the spec's \`## Purpose\` line; spec-less components carry a hand-authored one-liner in the generator's \`OVERRIDES\` map.
- **Import from the group subpath**, not the package root: \`@wow-two-beta/ui/presentation/{group}\` (or \`/foundation/primitives\`). Deep single-component paths are not public API.
- A component lands here once its folder ships \`{Name}.tsx\` + \`index.ts\`; its stories live under \`tests/stories/\`.

---
`;

fs.writeFileSync(OUT, header + body);
console.error(`wrote ${OUT} — ${total} presentation + ${prims.length} primitives = ${total + prims.length} entries`);

# UI World Catalog — what exists in Web2

*Last updated: 2026-05-04*

> Companion: [`targets.md`](./targets.md) — what *we'll* implement, prioritized.
>
> **Purpose**: enumerate the universe of UI tech, patterns, browser APIs, and conventions in the modern Web2 ecosystem. **No verdicts.** Source of ideas, not a roadmap.
>
> **Scope today**: styles + components + UI patterns + browser APIs. **Future scope**: React/client-side ecosystem (state, routing, data, forms, animation libs) — sketched in §9.

---

## 0. Reading guide

| § | Chapter | Read when… |
|---|---|---|
| 1 | Architectural philosophies | Choosing how a lib fits together |
| 2 | Frameworks (UI libraries) survey | Deciding what to borrow / wrap |
| 3 | Design systems | Looking for reference visual language |
| 4 | Cross-cutting vectors | Designing any component (a11y, i18n, theming…) |
| 5 | Component vector matrices | Speccing a single component |
| 6 | Delegate / extension API surface | Designing customization hooks |
| 7 | i18n leak point inventory | Speccing components with embedded text |
| 8 | Browser APIs (MDN) | Considering native API integration |
| 9 | React / client-side ecosystem | (Sketch — to expand) |
| 10 | Tooling ecosystem | (Sketch — to expand) |

---

## 1. Architectural philosophies

Five schools dominate Web2.

| School | Mental model | Representatives | Strengths | Cost |
|---|---|---|---|---|
| **Headless** | Behavior + a11y, zero visual opinion | Radix, Headless UI, Ariakit, React Aria, Ark UI, TanStack Table | Clean separation, BYO styles | Setup cost; users assemble |
| **Styled** | Opinionated visuals + behavior bundled | MUI, Mantine, Ant, Chakra, NextUI/HeroUI, PrimeReact, Vuetify, Carbon | Cohesive look, batteries included | Override pain; bundle size |
| **Hybrid (copy-own)** | Headless engine + styled scaffolds shipped as code | shadcn/ui, Tremor (sort of) | Owned code, infinite customization | Not a versioned package |
| **Web Components** | Framework-agnostic via custom elements | Material Web (MD3), Shoelace, Spectrum WC, Carbon WC, Lit-based | Multi-framework, SSR-ish | Hydration quirks, FOUC |
| **Cross-platform** | One source for web + native | Tamagui, React Native Paper (web), NativeBase, Park UI | Code reuse | Bundler complexity, lowest-common-denominator |

Distribution variants (orthogonal to school):
- **Single package** — `npm install lib` (most)
- **Copy-paste registry** — shadcn (CLI fetches source files; consumer owns code)
- **Per-component packages** — Radix (`@radix-ui/react-*`), MUI X (`@mui/x-*`)
- **Subpath exports** — single package with `lib/forms`, `lib/feedback`, etc. (ours)

---

## 2. Frameworks (UI libraries) survey

Compact vector axes. ✓ strong · ◐ partial · ○ none/weak.

| Lib | School | a11y | i18n | Theming | Headless API | Forms | DataGrid | Charts | RTL | TS | Bundle |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Radix Primitives | Headless | ✓ | ○ | ○ | ✓ | ◐ (Form pkg) | ○ | ○ | ◐ | ✓ | ✓ tiny |
| React Aria (Adobe) | Headless | ✓✓ | ✓✓ | ○ | ✓ | ✓ | ○ | ○ | ✓ | ✓ | ✓ |
| Headless UI | Headless | ✓ | ○ | ○ | ✓ | ◐ | ○ | ○ | ○ | ✓ | ✓ tiny |
| Ariakit | Headless | ✓ | ○ | ○ | ✓ | ◐ | ○ | ○ | ◐ | ✓ | ✓ |
| Ark UI (Zag) | Headless (FSM) | ✓ | ◐ | ○ | ✓ | ◐ | ○ | ○ | ○ | ✓ | ◐ |
| TanStack Table | Headless | ○ | ○ | ○ | ✓ | — | ✓ | — | — | ✓ | ✓ |
| MUI Material | Styled | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ (X) | ◐ (X) | ✓ | ✓ | ✗ heavy |
| MUI Joy | Styled | ✓ | ✓ | ✓ | ✓ | ✓ | (use X) | (use X) | ✓ | ✓ | ◐ |
| Mantine | Styled | ✓ | ◐ | ✓ | ◐ | ✓ | ◐ (separate lib) | ◐ | ◐ | ✓ | ◐ |
| Chakra v3 | Styled | ✓ | ◐ | ✓ (Panda) | ◐ | ✓ | ○ | ○ | ✓ | ✓ | ◐ |
| Ant Design | Styled | ◐ | ✓ | ✓ | ○ | ✓✓ | ✓ (Pro) | ✓ (G2) | ✓ | ✓ | ✗ heavy |
| shadcn/ui | Hybrid | ✓ (Radix) | ○ | ✓ | (Radix) | ◐ | ○ | ○ | ◐ | ✓ | (you own) |
| HeroUI / NextUI | Styled | ✓ | ◐ | ✓ | ◐ | ◐ | ○ | ○ | ✓ | ✓ | ◐ |
| Tremor | Styled | ◐ | ○ | ✓ | ○ | ○ | ◐ | ✓ | ○ | ✓ | ◐ |
| Park UI | Hybrid (Ark) | ✓ | ◐ | ✓ | ✓ | ◐ | ○ | ○ | ○ | ✓ | ◐ |
| PrimeReact | Styled | ◐ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ heavy |
| Carbon (IBM) | Styled | ✓ | ✓ | ✓ (tokens) | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ |
| Spectrum (Adobe) | Styled (on RAC) | ✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ | ◐ |
| Fluent UI v9 | Styled | ✓ | ✓ | ✓ (Griffel) | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ◐ |
| Material Web | WC | ✓ | ✓ | ✓ | ◐ | ◐ | ○ | ○ | ✓ | ◐ | ✓ |
| Shoelace | WC | ✓ | ◐ | ✓ | ◐ | ◐ | ○ | ○ | ✓ | ◐ | ✓ |
| Bootstrap | CSS | ◐ | ○ | ◐ | — | ◐ | ◐ | ○ | ◐ | — | ◐ |
| Bulma | CSS | ◐ | ○ | ◐ | — | ◐ | ○ | ○ | ○ | — | ✓ |
| Tamagui | Cross-platform | ◐ | ○ | ✓ | ◐ | ◐ | ○ | ○ | ◐ | ✓ | ◐ |
| AG Grid | Specialty | ✓ | ✓ | ✓ | ◐ | ○ | ✓✓ | (sep) | ✓ | ✓ | ✗ heavy |
| Handsontable | Specialty | ◐ | ✓ | ✓ | ○ | ○ | ✓✓ | — | ✓ | ✓ | ✗ heavy |
| Telerik KendoReact | Styled+specialty | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ heavy |
| Syncfusion | Specialty | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ heavy |
| DevExtreme | Specialty | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ heavy |
| Reach UI | Headless (legacy) | ✓ | ○ | ○ | ✓ | ◐ | ○ | ○ | ○ | ✓ | ✓ |
| Bits UI / Melt UI (Svelte) | Headless | ✓ | ○ | ○ | ✓ | ◐ | ○ | ○ | ○ | ✓ | ✓ |
| Naive UI (Vue) | Styled | ✓ | ◐ | ✓ | ◐ | ✓ | ◐ | ○ | ✓ | ✓ | ◐ |
| Element Plus (Vue) | Styled | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | ○ | ✓ | ✓ | ◐ |
| PrimeVue | Styled | ◐ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ heavy |
| Vuetify | Styled (Vue/Material) | ◐ | ✓ | ✓ | ○ | ✓ | ✓ | ○ | ✓ | ✓ | ✗ heavy |
| Quasar | Styled (Vue) | ◐ | ✓ | ✓ | ○ | ✓ | ✓ | ○ | ✓ | ✓ | ◐ |
| Angular Material | Styled (Ang) | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | ○ | ✓ | ✓ | ◐ |
| NG-ZORRO | Styled (Ang) | ◐ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ heavy |
| PrimeNG | Styled (Ang) | ◐ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ heavy |

> Source: per-lib docs scan + companion [`library-references.md`](../../../../../../docs/audits/library-references.md) in workspace (component coverage matrix).

---

## 3. Design systems (philosophies)

| System | Owner | Philosophy nucleus | Signature ideas |
|---|---|---|---|
| Material Design 3 | Google | Dynamic color, motion, scale | Color roles (`primary`/`onPrimary`/`primaryContainer`), shape tokens, motion tokens, density |
| Fluent 2 | Microsoft | Light + depth + motion + material | Acrylic/mica, reveal hover, OS-aware appearance |
| Apple HIG | Apple | Clarity, deference, depth | Native idioms, system fonts, vibrancy, hairline borders |
| Carbon | IBM | Enterprise scale, accessibility | Token roles (`text-primary`, `field-01`), data-grid focus, layered themes |
| Spectrum | Adobe | Prosumer creative, locale-deep | Density (compact/regular), platform variants, React Aria base |
| Polaris | Shopify | Merchant-first | Empty states as language, data-table patterns, commerce idioms |
| Atlassian DS | Atlassian | Productivity | "Tokens as a service", inline editing |
| Salesforce Lightning | Salesforce | Enterprise CRM | Path component, datatable, utility icon set |
| USWDS | US Gov | Plain language + a11y first | Banner pattern, federal compliance |
| GOV.UK Design System | UK Gov | Plain language + service patterns | One-question-per-page, error summary |
| Primer | GitHub | Developer-first | Code blocks, diff view, octicons |
| Base Web | Uber | Composition | Themable primitives, "overrides" pattern |
| Garden | Zendesk | Empathy + support | Status systems, support patterns |
| Wave | Workday | Enterprise | Workday workflows |
| Helios | HashiCorp | Devtools | Code-heavy, semantic states |
| Lightning Design (Salesforce) | Salesforce | Density + a11y | Path, viewport tile |
| Audi UI | Audi | Premium automotive | Brand, motion, reveal |
| Pajamas | GitLab | Devtools | Open-source-aware patterns |
| Polaris Viz | Shopify | Charts within Polaris | Brand-aligned data viz |
| Bolt (Pinterest) | Pinterest | Visual discovery | Pin-style, rich media |
| Lexicon | Liferay | Enterprise digital experience | Document-heavy patterns |
| Vibrant (Mailchimp) | Mailchimp | Editorial + email | Email-first patterns |

---

## 4. Cross-cutting vectors

The "everywhere" axes — every component touches these.

### 4.1 Accessibility (a11y)

| Sub-vector | Detail |
|---|---|
| Roles & ARIA | `role`, `aria-*` per WAI-ARIA Authoring Practices Guide (APG) |
| Keyboard | Tab/Shift-Tab, arrows, Home/End, PgUp/PgDn, Esc, Enter, Space, type-ahead |
| Focus model | DOM-focus *vs* `aria-activedescendant` — pick per-component |
| Focus management | Trap, return, restore, visible (`:focus-visible`), within (`:focus-within`) |
| Roving tabindex | Group containers (Toolbar, RadioGroup, Menu) — one tabstop, arrows move within |
| Screen reader | Live regions (`role="status"`, `role="alert"`), `aria-live`, `aria-atomic`, `aria-describedby`, `aria-labelledby` |
| RTL | Logical CSS props; icon flip; pointer-arrow flip |
| Reduced motion | `prefers-reduced-motion`; disable transforms/parallax; keep state changes |
| Reduced data | `prefers-reduced-data` |
| High contrast | `forced-colors` media query; `system-color` keywords; outline fallback |
| Color contrast | 4.5:1 text / 3:1 large / 3:1 UI / 7:1 AAA |
| Touch targets | 24×24 (WCAG 2.2 min), 44×44 (Apple HIG / Google MD recommended) |
| Skip links | "Skip to main"; per-region landmark navigation |
| Landmarks | `header`, `nav`, `main`, `aside`, `footer`, `region` w/ name |
| Announce | Imperative live-region API |
| Hit targets | Click region ≥ visual; padding > border |
| Pointer types | Coarse (touch) vs fine (mouse) — hover-dependent UI must have non-hover affordance |
| Drag a11y | Keyboard reorder fallback, screen reader move announce (WCAG 2.5.7) |
| Pause/stop/hide | For moving content > 5s (WCAG 2.2.2) |
| WCAG conformance | 2.0 / 2.1 / 2.2 (AA most common); 3.0 (Silver, emerging) |

### 4.2 Internationalization (i18n) — DEEP

i18n leaks far beyond strings. See §7 for the full per-component leak inventory.

#### 4.2.1 String layer

| Capability | Detail |
|---|---|
| Translation | Lookup by key; consumer-supplied dictionary or callback `(key, vars) => string` |
| Interpolation | `"Hello {name}"` — variables, HTML-safe |
| Plural | ICU MessageFormat — Arabic 6 forms, Russian 3, English 2, Chinese 1 |
| Gender | ICU `{gender, select, male{...} female{...} other{...}}` |
| Selectordinal | `{n, selectordinal, one{1st} two{2nd} ...}` |
| Pseudo-localization | `Ḧëłłö` mode — catches unwrapped strings + length expansion |
| Fallback | Locale chain (`en-GB → en → default`) |
| Lazy load | Per-locale chunks; prefetch active |
| Inline rich text | `<Trans i18nKey="..."><b>…</b></Trans>` |
| Direction tag | `dir="ltr\|rtl\|auto"` for mixed bidi |

#### 4.2.2 Locale-aware data layer (all map to `Intl.*`)

| Capability | API | Notes |
|---|---|---|
| Number | `Intl.NumberFormat` | Decimal/group, scientific, percent, units, compact, sign display |
| Currency | `Intl.NumberFormat({style: 'currency'})` | Symbol position, ISO 4217 fraction digits, accounting parens |
| Date | `Intl.DateTimeFormat` | Short/medium/long/full; era, calendar, time zone, hour cycle (h11/h12/h23/h24) |
| Relative time | `Intl.RelativeTimeFormat` | "3 days ago", "in 2 hours" |
| List | `Intl.ListFormat` | "a, b, and c" / "a, b veya c" |
| Plural rules | `Intl.PluralRules` | Pair with messages |
| Sorting | `Intl.Collator` | Locale-aware, accent/case sensitivity, numeric |
| Segmenting | `Intl.Segmenter` | Word/sentence boundaries — CJK truncation, search |
| Display names | `Intl.DisplayNames` | Country/lang/region/currency/calendar names |
| Duration | `Intl.DurationFormat` (newer) | "1 hr 30 min" |
| Number system | Latin / Arab-Indic / Devanagari / Persian / Han | Phone keypad (fa-IR shows ۱۲۳) |
| Calendar | Gregorian, Hijri, Buddhist, Persian, Japanese, Hebrew, Coptic, Ethiopic, ROC | Per-component opt-in |
| Week start | Mon (most), Sun (US/CA/JP/IL), Sat (most Arab) | `Intl.Locale.weekInfo` |
| Weekend days | Sat-Sun (most), Fri-Sat (Arabic), Fri only (IR), Sun-only (some IN) | Per region |
| Time zone | Offset, DST rules, display name | Decouple "stored UTC" from "displayed local" |

#### 4.2.3 Layout layer

| Concern | Detail |
|---|---|
| RTL flip | Logical props default; flip-once at root via `dir` attribute |
| Mirrored icons | Arrows/chevrons flip; brand marks/checkmarks don't |
| Mirrored animations | Slide-in-from-start, not -from-left |
| Font fallback | CJK (`Noto Sans CJK`), Arabic (`Noto Naskh Arabic`), Hebrew (`Noto Sans Hebrew`), Devanagari, Tamil, Thai (different word breaking) |
| Line height | CJK needs taller line-box; Arabic needs descender room |
| Letter spacing | Disable for non-Latin scripts |
| Tabular numerals | `font-feature-settings: 'tnum'` for tables, timestamps |
| Char width | Half-width vs full-width (CJK) — affects `<input>` size |

### 4.3 Theming & tokens

| Sub-vector | Detail |
|---|---|
| Token tiers | Primitive (raw) → Semantic (intent) → Component (slot) — typically 2 or 3 layers |
| Scopes | Color, space, radius, typography, motion, shadow, border-width, z-index, breakpoints, container widths, opacity, blur |
| Color models | sRGB hex, HSL, OKLCH, LCH, Display-P3 (wide gamut) |
| Color palettes | 12-step (Radix/Tailwind), 9-step (Mantine), MD3 dynamic |
| Color modes | Light, dark, system, brand variants, high-contrast |
| Mode switching | Class (`.dark`), attribute (`[data-theme]`), media query, JS toggle |
| Token transport | CSS vars (runtime swap), JS object (build-time), JSON (Style Dictionary) |
| Token aliasing | `--color-bg-primary: var(--color-blue-9)` |
| Density | Compact / comfortable / spacious — affects spacing, font, line-height |
| Multi-theme runtime | Multiple themes coexist (preview pane) — namespacing via attribute |
| Multi-brand build-time | Tenants get separate bundles |
| Override granularity | Theme provider → section → component → instance |
| Token introspection | DevTools: list all tokens, used-by lookup |
| Token contracts | TS types for autocomplete |
| Standards | W3C Design Tokens spec (DTCG); Style Dictionary export |

### 4.4 Styling systems

| System | Pros | Cons | Used by |
|---|---|---|---|
| CSS-in-JS (runtime) | Theming dynamic, scoped | Runtime cost, SSR pain | MUI (`emotion`), Chakra v2 |
| CSS-in-JS (zero-runtime) | Compile to CSS | Build complexity | Vanilla Extract, Linaria, Panda CSS, Macaron |
| CSS Modules | Scoped, simple | No theming sugar | Mantine v7+ |
| Atomic CSS | Tiny prod CSS | Verbose markup | Tailwind, UnoCSS |
| Recipes / variants | Type-safe variants | Lib-specific | cva, tailwind-variants, Panda recipes, Stitches variants |
| Plain CSS | No build | No theming primitives | Bulma, Bootstrap |
| Inline `style` | Quick override | No pseudo / responsive | Universal escape hatch |
| Data-attribute hooks | `[data-state='open']` | Verbose selectors | Radix, Ark |
| Slot styling | Per-part override | API surface | MUI `slotProps`, Chakra `__css` |
| `sx` prop | Inline theme-aware | Runtime cost | MUI, Chakra |
| `css` prop | Inline scoped | Build setup | Emotion |
| Style merging | lib defaults → theme → variant → user `className` → user `style` | Tailwind: `tailwind-merge` resolves | All |
| CSS Layers | `@layer base, components, utilities` | Browser support broad | Tailwind v4, modern |

### 4.5 Composition & API patterns

| Pattern | Example | Trade-off |
|---|---|---|
| Compound components | `<Tabs><Tabs.List/><Tabs.Panel/></Tabs>` | Discoverable, composable |
| Render props | `<Listbox>{({ selected }) => …}</Listbox>` | Flexible, verbose |
| Children fn | Same idea, single child | Flexible |
| Hook-based | `useDisclosure()`, `useForm()` | DIY assembly, max control |
| Provider/context | `<ThemeProvider>` | Implicit DI |
| Slot pattern | `<Tooltip.Trigger asChild><Button/></Tooltip.Trigger>` | No DOM wrapper |
| Prop-driven monolith | `<DatePicker label="..." helper="..." error="..." />` | Easy, less flexible |
| Anatomy contracts | Lib publishes shape per-component | Predictable customization |

### 4.6 Polymorphism

| Mechanism | Behavior | Library |
|---|---|---|
| `as` prop | `<Button as="a" href="...">` | Chakra, Mantine, MUI |
| `asChild` (Slot) | `<Button asChild><a/></Button>` | Radix, ours |
| Render fn | `renderAs={(props) => <a/>}` | Niche |
| Static element | Lib picks element | Headless UI |
| Type-safe forwarding | `ComponentPropsWithoutRef<T>` | All modern TS libs |

### 4.7 Forms

| Sub-vector | Detail |
|---|---|
| Field state | `value`, `defaultValue`, `name`, `disabled`, `readOnly`, `required`, `invalid`, `dirty`, `touched`, `pending` |
| Controlled / uncontrolled | Both supported via `useControlled` |
| Validation timing | onSubmit, onBlur, onChange, onTouched, onMount |
| Validation kind | Sync, async (cancellation), cross-field, schema-driven |
| Schema libs | Zod, Yup, Valibot, Joi, ArkType, Effect Schema, Superstruct, Standard Schema spec |
| Built-in validators | required, min/max, minLength/maxLength, pattern, email/url/tel, custom |
| Server errors | Field-level injection, form-level banner, retry |
| Submit | Loading state, double-submit guard, idempotency keys |
| Optimistic update | UI updates before server ack |
| Multi-step | Wizard, stepper, conditional branching |
| Field array | Add/remove/reorder with stable keys |
| Conditional fields | Show/hide based on other fields |
| Auto-save | Debounced, with conflict UI |
| Dirty tracking | Diff against initial; warn on navigate-away |
| Reset | To initial / to defaults / to server-value |
| File field | Progress, multi, validation, preview, drag-drop |
| Form root | `<form>` + submit + state container; or contextless field bag |
| ARIA wiring | label/control/error linkage |
| FormData export | Native `<form>` interop (server actions) |
| Hidden input | Non-input components emit native hidden inputs |
| Reset events | Native `reset` event integration |

### 4.8 Motion

| Sub-vector | Detail |
|---|---|
| Enter/exit | Mount/unmount transitions; defer unmount until exit done |
| Layout animations | FLIP (first-last-invert-play); shared element |
| Gestures | Drag, swipe, pinch, long-press, hover-as-intent |
| Spring physics | Stiffness/damping/mass; momentum |
| Keyframe / tween | Duration + easing curves |
| Stagger | Sequence children by index |
| Scroll-driven | `animation-timeline: scroll()`; IntersectionObserver |
| View transitions | `document.startViewTransition` |
| Page transitions | Route-aware (Next.js, React Router) |
| Reduced motion | Disable transforms, keep opacity |
| Motion tokens | Durations, easings (standard/emphasized/decelerated/accelerated) |

### 4.9 Density / size

| Sub-vector | Detail |
|---|---|
| Sizes | `xs / sm / md / lg / xl` per-component |
| Density modes | Compact, comfortable, spacious — global theme switch |
| Touch vs pointer | Coarse pointer → larger hit targets automatically |
| Per-component density | Table density for data-heavy apps |
| Nested density | Children inherit unless overridden |

### 4.10 Performance

| Sub-vector | Detail |
|---|---|
| Bundle | Tree-shake (ESM `sideEffects: false`), per-component imports, no-barrel re-export pitfalls |
| Subpath exports | Pull `forms/` or just `Button` |
| Code splitting | Route-level, component-level dynamic import |
| Lazy loading | `<img loading="lazy">`, IntersectionObserver, React.lazy |
| Virtualization | 1D list, 2D grid, variable height, sticky headers, anchor-preserving |
| Memoization | `memo`, `useMemo`, `useCallback`, stable refs |
| Render counting | Profiler API; `why-did-you-render` |
| Concurrent | `useTransition`, `useDeferredValue`, `Suspense` |
| Streaming | RSC + Suspense |
| Hydration | Full vs partial vs island vs progressive |
| Static analysis | Bundle size CI (`size-limit`, `bundlejs`) |
| Asset opt | SVG inlining, sprite sheets, font subsetting |
| Preload / prefetch | `<link rel="preload">`, modulepreload |

### 4.11 Selection, search, sort

| Sub-vector | Detail |
|---|---|
| Selection mode | None, single, multi, contiguous (range), non-contiguous |
| Selection model | Controlled (`selectedKeys`) vs uncontrolled |
| Selection key | Primitive vs object — needs `Equality` delegate (§6) |
| Range select | Shift-click / Shift-arrow |
| Toggle | Cmd/Ctrl-click toggles |
| Drag-select | Marquee/lasso |
| Select-all | "Select all visible" vs "all matching filter" |
| Search predicate | Built-in (case/accent/exact/fuzzy) + delegate override |
| Search highlighting | Mark matching substring |
| Search debounce | Per-keystroke vs blur |
| Sort key | Single column vs multi-column with priority |
| Sort direction | asc / desc / none (3-state) |
| Sort comparator | Default + delegate override |
| Sort stability | Required for tied keys when paging |
| Filter operators | equals / contains / starts-with / ends-with / regex / range / set-in |
| Filter combinators | AND / OR groupings |
| Server vs client | Both — if server, expose `(query) => Promise<rows>` |

### 4.12 Delegate / extension API surface

See §6 for the canonical inventory. The "LINQ-shaped" hooks consumers pass in.

### 4.13 Browser API integration

See §8 for the full MDN encyclopedia. UI libs typically wrap a curated subset as React hooks.

### 4.14 Keyboard semantics

| Sub-vector | Detail |
|---|---|
| Per-component bindings | APG-conformant (Listbox: arrows + type-ahead; Menu: same + Esc; Tabs: arrows + Home/End; Slider: arrows + PgUp/Dn + Home/End) |
| Roving tabindex | One tab-stop per group |
| Active descendant | Container holds focus; arrow updates `aria-activedescendant` |
| Type-ahead | Buffer keystrokes ~500ms, focus first match |
| Modifier handling | Cmd-vs-Ctrl per platform |
| Global shortcuts | App-level (Cmd-K); conflict with browser/OS |
| Layered shortcuts | Modal > popover > page-level |
| Visible binding | `<kbd>` w/ platform glyphs (`⌘` / `Ctrl`) |
| Configurable | User-customizable bindings |
| IME composition | `compositionstart`/`end` — don't emit Enter mid-composition |
| Repeat | Hold-key auto-repeat for steppers |

### 4.15 Drag & drop

| Sub-vector | Detail |
|---|---|
| Within list | Reorder |
| Cross list | Kanban, multi-bucket |
| External drop | File upload from OS |
| External drag-out | Drag to another app |
| Touch | TouchEvents; long-press to lift |
| Pointer | Pointer Capture API |
| Sensors | Multiple inputs (mouse, touch, keyboard, screen reader) |
| Accessible alt | Move-up/down buttons, keyboard reorder mode |
| Announce | Live-region "Item moved from position 2 to 5" |
| Drag preview | Custom ghost, snap-back |
| Drop indicators | Insertion line, highlight zone |
| Auto-scroll | Edge-of-viewport while dragging |
| Constraints | Lock to axis, restrict to parent |
| Sortable groups | Multiple lists sharing a sortable context |

### 4.16 Async data states

| State | UI signal |
|---|---|
| Idle | Initial, no fetch |
| Pending (initial) | Skeleton, full-loader |
| Pending (refresh) | Inline spinner, dim previous |
| Pending (more) | Bottom-of-list spinner |
| Success | Data render |
| Empty | EmptyState |
| Partial | Some items + retry-tail |
| Error | ErrorState w/ retry |
| Stale-while-revalidate | Show old, indicator |
| Optimistic | Show ghost, settle on ack |
| Offline | Banner, queue mutations |
| Cancelled | Recover gracefully |

### 4.17 Notifications surface

| Sub-vector | Detail |
|---|---|
| Toast queue | FIFO; max visible; replace-or-stack |
| Toast position | 9 zones (4 corners + 4 edges + center) |
| Auto-dismiss | Per-severity; pause on hover/focus |
| Action toast | "Undo"; promise toast (loading→success/error) |
| Persistent | Don't auto-dismiss for errors |
| Banner | Page-level (above content) |
| Inline alert | In-flow |
| Badge | Number/dot |
| Status indicators | Per-row, per-card |
| Live region announce | Imperative `announce(msg, priority)` |
| Sound | Error/success cue |
| Haptic | Mobile vibration |
| Push | Service worker (out of scope) |

### 4.18 Z-index management

Layer scale (low→high): `base 0` · `dropdown 1000` · `sticky 1020` · `banner 1030` · `overlay 1040` · `modal 1050` · `popover 1060` · `toast 1070` · `tooltip 1080` · `debug 9999`

Approaches: numeric tokens · CSS isolation/`stacking-context` · stacking-context-aware portal manager (Mantine, MUI).

### 4.19 Portals / overlay system

| Sub-vector | Detail |
|---|---|
| Portal target | `document.body` default; per-instance override; `disablePortal` for in-flow |
| Overlay manager | Track open layers; top-most-Esc-closes-first |
| Stacking order | Open order, z-index |
| Backdrop | Optional scrim; click-to-dismiss; blur |
| Scroll lock | Body scroll-prevent; preserve scrollbar gutter |
| Focus scope | Trap, return on close |
| Dismissable layer | Outside-click + Esc; focus-out |
| Pointer-down outside | More precise than click |
| Inert background | `inert` attribute (modern), `aria-hidden` legacy |
| Anchor positioning | Floating UI: flip, shift, offset, arrow, hide, autoUpdate |
| CSS Anchor Positioning | Spec'd, Chromium-only — future native flow |
| Collision detection | Boundary el (viewport, container, scroll-parent) |

### 4.20 Customization layers

| Layer | Mechanism | Scope |
|---|---|---|
| Token override | `--color-primary: ...` | Theme provider scope |
| Variant override | `cva` extra variant; `tailwind-variants` slot |
| className/style | Per-instance | Single render |
| Slot override | `<C slots={{...}} slotProps={{...}}/>` (MUI) | Per-instance per-part |
| `as`/`asChild` | Swap host element | Per-instance |
| Provider layering | Nested `<ThemeProvider>` | Subtree |
| CSS Layer ordering | `@layer base, components, utilities` | Cascade-wide |
| Recipe extension | New variants in consumer | Build-time |
| Component swap | DI registry: replace `Button` with custom | Theme-wide (MUI Joy) |

### 4.21 Telemetry / observability

| Sub-vector | Detail |
|---|---|
| Render count | Per-component dev-mode counter |
| Interaction events | onOpen/onClose/onFocus/onBlur emitted for analytics |
| Performance marks | `performance.mark` for open/close lifecycles |
| Error boundary integration | Capture and report |
| A11y violations | dev-only `axe-core` |
| Heatmap consent | Don't auto-opt-in |
| User identifiers | Pass through; never embed |

### 4.22 Error handling

| Sub-vector | Detail |
|---|---|
| Error boundary primitive | Wrap render trees with fallback UI |
| Reset | Boundary key prop to remount |
| Form field errors | Inline + ARIA-linked |
| Async errors | Retry, exponential backoff, manual retry |
| Error UI | EmptyState variant w/ icon, message, retry |
| Suspense pairing | Concurrent boundary catches thrown promises |

### 4.23 Print

| Sub-vector | Detail |
|---|---|
| Print stylesheet | `@media print` |
| Page breaks | `break-inside: avoid` |
| Hide chrome | Nav/footer/sidebar hidden |
| Expand collapsed | All accordions open |
| Color | Drop chroma-heavy backgrounds |
| Tables | Repeat headers per page (`thead { display: table-header-group }`) |

### 4.24 Test surface

| Sub-vector | Detail |
|---|---|
| Test IDs | `data-testid` (or roles for Testing Library) |
| Refs | All components forward refs |
| Imperative handles | `useImperativeHandle` for `focus()`, `scrollIntoView()`, `open()` |
| Storybook stories | One per state in spec |
| Visual regression | Chromatic / Percy / Playwright snapshots |
| Interaction tests | Storybook play; Vitest + Testing Library |
| A11y tests | `@storybook/addon-a11y` per story |

### 4.25 SSR / hydration

| Concern | Detail |
|---|---|
| Server-render safe | No `window` access at module load |
| Stable IDs | `useId` cross-render stable IDs |
| Hydration mismatch | Theme class flash, locale flash, portal SSR |
| RSC compatibility | "use client" boundary placement |
| Streaming | Suspense-friendly |
| Critical CSS | Above-the-fold inline |

---

## 5. Component vector matrices

Per category, the hidden complexity *beyond* "render pixels".

### 5.1 Inputs

| Component | Hidden vectors |
|---|---|
| TextField | Placeholder, helper, error · IME composition · spellcheck · autocomplete attr · masking · prefix/suffix slot · clearable · password reveal · paste sanitize · max length counter · auto-grow textarea · FormData binding |
| NumberField | Locale decimal/group · scientific input · min/max/step · large step (Shift) · stepper buttons · keyboard increment · accept/format strategy · raw vs formatted state · negative behavior |
| CurrencyInput | Currency code → symbol · symbol position · ISO 4217 fraction digits · accounting parens · code switcher |
| PercentInput | Stored 0–1 vs 0–100 (off-by-100 trap) |
| MaskedInput | Mask grammar (`#`-letters, `0`-digits) · paste handling · cursor management · IME-safe |
| PinInput / OTP | Per-char inputs · auto-advance · paste-to-fill · numeric/alphanumeric · masked vs visible · autocomplete `one-time-code` · iOS native suggestion |
| PhoneInput | Country code picker · per-country format · libphonenumber for validation · flag icons (politically charged) |
| Email/URL/Tel | `type` + `inputMode` + `autocomplete` · soft validation · click-to-call/-mail |
| Password | Show/hide · strength meter (zxcvbn) · capslock warn · paste allow toggle · autocomplete `new-password`/`current-password` |
| Search | Debounce · clear button · history · live results · `role="searchbox"` · iOS native cancel |
| Textarea | Auto-grow · min/max rows · resize handle disable · counter |
| Select (native) | Required for mobile a11y; option groups; long lists |
| Select (custom) | Listbox-pattern · async load · groups · multi · search inside · async creatable |
| MultiSelect | Tags (chips) · removable · max items · "X more" overflow · paste-to-add CSV |
| Combobox | Async load · async creatable · highlight match · group · empty state · debounce · recent suggestions |
| Listbox | Active descendant · type-ahead · selection follows focus opt · multi |
| Radio / Checkbox | Tri-state (indeterminate) · group orientation · keyboard arrow nav · group label/legend |
| Switch | On/off; semantically distinct from Checkbox per APG |
| Slider | Single, range, multi-thumb · vertical · marks · ticks · keyboard step · large step (PgUp/Dn) · Home/End · `aria-valuetext` |
| AngleSlider | 0–360°, snap to compass |
| ColorPicker | RGB/HSL/HSV/HWB/OKLCH · alpha · format toggle · eyedropper · recent colors · swatch palette · gradient picker · contrast checker · color-blind preview |
| DatePicker | Months, weekdays, calendar systems, week start, hour cycle (see §7) |
| TimePicker | 12h/24h · seconds · step (5/10/15/30 min) · meridiem toggle |
| DateRangePicker | Two-month side-by-side · presets · "to" connector i18n |
| FileUpload | Drag-drop · multi · accept (mime/ext) · max size · max count · preview · per-file progress · per-file error · paste image · clipboard upload |
| Rating | Half-stars · custom icon · readonly · clearable · keyboard arrow |
| TagInput | Delimiter (Enter/Comma/Tab) · paste-CSV · max · disallow dupes · per-tag validation · removable |
| Mention (`@`/`#`) | Trigger char · async list · arrow-to-pick · escape to cancel |
| RichTextEditor | (Lexical / TipTap / Slate) · floating toolbar · markdown shortcut · paste-as-plain · image embed · slash menu |
| CodeEditor | (Monaco / CodeMirror) · syntax · linting · diff view |
| Editable | Inline edit (label → input on click); save on blur/Enter; cancel on Esc |
| SignaturePad | Canvas, pressure (Pointer Events), undo, clear, export PNG/SVG |

### 5.2 Display

| Component | Vectors |
|---|---|
| Avatar | Initials fallback · color-from-name hash · status badge · size · group (overlap, "+N") |
| Image | Lazy · blur-up · fallback · aspect-ratio · object-fit · srcset · loading priority |
| Video / Audio | Custom controls · captions/subtitles (VTT) · poster · keyboard scrub · PiP · fullscreen |
| Progress | Linear/circular/segmented · indeterminate · `aria-valuetext` · color by threshold |
| Stat | Value formatter · trend (▲▼) · comparison delta · sparkline embed |
| Skeleton | Shape match content · respects reduced-motion · shimmer |
| Card | Compound (header/body/footer); clickable variant: outer `<a>` vs inner button (a11y trap) |
| Tooltip | Trigger types · delays · portal · positioning · arrow · interactive (HoverCard) · mobile (long-press fallback) |
| Popover | Click trigger · focus scope · dismiss layer · arrow positioning · controlled vs uncontrolled |
| HoverCard | Pointer-only (a11y warning) · open delay · close delay · focus opens too |
| Timeline | V/H · alternate sides · per-item icon · connector style · grouping |
| Tree | Lazy load children · expand all/none · drag-reorder · selection (check tristate via descendants) · async filter · preserve focus |
| Sparkline | Compact line/bar · trend · accessibility (table fallback) |
| QRCode | Error correction level · size · margin · colors · embedded logo (with EC overhead) |

### 5.3 Navigation

| Component | Vectors |
|---|---|
| Breadcrumb | Truncate-with-ellipsis · separator · responsive collapse · last-is-current |
| Tabs | H/V · activation: auto vs manual · overflow: scroll vs collapse-to-menu · closable · reorderable · lazy panels · `aria-orientation` |
| Sidebar | Collapsible · pinned · responsive (drawer on mobile) · nested · active route · keyboard nav · resize handle |
| Menu | Nested submenus · checkbox/radio items · separators · groups · keyboard nav · max height + scroll |
| ContextMenu | Right-click + long-press · virtual element anchor · preventDefault native |
| DropdownMenu | Trigger button · keyboard open · positioning |
| Menubar | Sibling triggers; hover-after-open · arrow-traverse |
| NavigationMenu | Multi-level · mega-menu · viewport-positioned · per-item rich content |
| Pagination | Page numbers · page-size picker · "showing X–Y of Z" · jump-to · prev/next/first/last · keyboard |
| Stepper | Linear vs free · clickable past steps · current vs upcoming · vertical layout · optional/required marker |
| CommandPalette | Global hotkey (Cmd-K) · fuzzy search · sections · recent · footer hints · async results · keyboard nav |
| Anchor / Link | Visited state · external indicator · download attr · target safety (`rel="noopener"`) |
| BottomNav | Mobile pattern · 3–5 items · active highlight |
| NavigationRail | MD3 pattern · vertical icon strip |

### 5.4 Feedback

| Component | Vectors |
|---|---|
| Alert | Severity · icon · close · action · live-region |
| Banner | Page-wide · stacked · dismissable · persistence across routes |
| Toast | (See §4.17) |
| Modal | Scroll lock · focus trap · return focus · stacked · escape · backdrop click · max width · non-dismissable variant |
| AlertDialog | `role="alertdialog"` · destructive distinction · Cancel default-focused vs Confirm |
| Drawer | Side (T/R/B/L) · drag-to-dismiss (mobile) · snap points · scrim · width responsive |
| Sheet | Bottom-sheet (mobile) · expandable heights · drag-handle |
| Spinner | Size · color · `role="status"` + visually-hidden label |
| LoadingOverlay | Local vs global · blur backdrop · cancel button · long-load message escalation |
| EmptyState | Icon · title · description · CTA · per-context illustration |
| ErrorBoundary | Fallback · reset · error reporter · per-route boundaries |

### 5.5 Layout

| Component | Vectors |
|---|---|
| Stack (V/HStack) | Gap · align · justify · wrap · divider · responsive direction |
| Grid | `repeat(auto-fit, minmax(...))` · explicit areas · responsive · gap |
| Flex / Box / Container | Standard, generic |
| Center | Both axes |
| Spacer | Flex-grow filler |
| Divider | H/V · with-text · variants |
| AspectRatio | Per ratio · object-fit children |
| ScrollArea | Custom scrollbar · directions · momentum · sticky elements |
| Resizable | Pane split (h/v) · min/max · keyboard resize · persist sizes · nested |
| Sticky / Affix | Top/bottom · offset · "stuck" state class |
| Masonry | Column-balanced · responsive columns · animation on add/remove |
| OverflowList | Show-as-many-as-fit + "+N more" |
| Frame | Padded surface (border, radius, shadow) |
| TwoColumn | Sidebar + main · collapsible · responsive |

### 5.6 Data display

| Component | Vectors |
|---|---|
| Table | Sort · multi-sort · filter (per col) · pagination · selection (single/multi) · expand/collapse · edit cells · group · aggregate · column visibility · column reorder · column resize · column pin · row pin · row drag-reorder · sticky header · sticky first column · virtualization · server pagination/sort/filter · density · empty/loading/error · footer · cell renderer · row hover · keyboard nav (cell vs row) · copy/paste cells · CSV/Excel export · internationalized headers |
| DataGrid | Table + spreadsheet-grade editing · formula bar · range selection · fill handle |
| List | Virtualized · sectioned · sticky section headers · pull-to-refresh · infinite scroll · inline edit · swipe actions · skeletons |
| Calendar | Month/week/day/agenda · event display · drag-create/move/resize · all-day vs timed · timezone · recurrence · busy indicator |
| Kanban | Columns · cards · drag-reorder within and across · WIP limits · column collapse · async card load |
| Carousel | Slides · auto-play · pause-on-hover · indicators · arrows · keyboard · swipe · loop · per-slide aria-label · "Slide X of Y" announce · pause for reduced motion |
| Tree | (See §5.2) |
| Gallery | Lightbox · keyboard nav · thumbnails · zoom · pinch (touch) |

### 5.7 Specialized / often-missed

| Component | Vectors |
|---|---|
| ColorPicker | (See §5.1) |
| Tour / Walkthrough | Step queue · spotlight cutout · tooltip anchor · skip · "Don't show again" · replay · keyboard · screen-reader announce |
| CommandPalette | (See §5.3) |
| ImageCropper | Aspect lock · zoom · rotate · per-corner drag · output canvas |
| AngleSlider | (See §5.1) |
| Marquee | Pause/play · reduced motion · seamless loop |
| Editable | (See §5.1) |
| Mentions | (See §5.1) |
| Highlight | Wrap matches in `<mark>` · case-insensitive · accent-insensitive · multi-word OR |
| CountdownTimer | Stop/start/reset · format (HH:MM:SS) · expiry callback · visibility-pause |
| OnboardingChecklist | Per-item state · progress % · dismiss-when-complete |
| FloatingPanel | Draggable · resizable · minimizable · stackable |
| JsonTreeView | Collapsible nodes · per-type colors · search · copy path |
| DownloadTrigger | Programmatic blob → file download · CSV/JSON helpers |
| FormatBytes / FormatTime / FormatRelative | Output components, locale-aware |
| Splitter | (See §5.5 Resizable) |
| NumberFormatter | Display-only `<output>` style |
| Spoiler | "Show more" expand toggle |
| MagicMove / SharedElement | Animated transitions across mount points |
| BarcodeScanner | Camera + Barcode Detection API |
| Captcha | (Custom — privacy-aware alt to recaptcha) |

### 5.8 Charts (orthogonal vector — often a separate package)

| Sub-vector | Detail |
|---|---|
| Types | Line, area, bar, column, stacked, grouped, pie, donut, radar, scatter, bubble, heatmap, candlestick, gauge, funnel, sankey, treemap, chord, sunburst, parallel coordinates, calendar heatmap, radial bar |
| Scales | Linear, log, time, ordinal, band, quantize, threshold |
| Axes | Tick formatter (locale!), gridlines, title, multi-axis, dual-y |
| Legends | Position, click-to-filter, hover highlight |
| Tooltips | Crosshair, snap-to-point, multi-series |
| Interaction | Brush, zoom, pan, select range |
| Animation | Enter, update, exit (D3 idiom) |
| Real-time | Streaming append, sliding window |
| Accessibility | Sonification (audio plot), table fallback, focusable points, `aria-roledescription` |
| Themes | Token-driven colors, color-blind palette |
| Export | PNG, SVG, CSV |

**Libs**: Recharts, Visx (Airbnb), Nivo, Chart.js, Apache ECharts, Highcharts, ApexCharts, D3 (low-level), Tremor, Plotly, AG Charts.

### 5.9 Maps (orthogonal — rarely in general-purpose UI lib)

Tiles · markers · clusters · geocoding · routing · drawing · GeoJSON · choropleth · WebGL layers (deck.gl) · accessibility (table fallback). Libs: Mapbox GL, MapLibre GL, Leaflet, Google Maps, OpenLayers.

---

## 6. Delegate / extension API surface

The "LINQ-shaped" hooks consumers pass in. Cover Listbox, Select, MultiSelect, Combobox, Table, Tree, Calendar, Carousel, Tabs, etc.

| Delegate | TS shape | .NET analog | Use |
|---|---|---|---|
| **KeySelector** | `(item: T) => string \| number` | `Func<T, string>` | Stable React keys; selection by ID |
| **LabelSelector** | `(item: T) => ReactNode` | `Func<T, object>` | Display text in Select trigger, Listbox item, Tag |
| **ValueSelector** | `(item: T) => unknown` | `Func<T, object>` | Underlying value when distinct from key |
| **DescriptionSelector** | `(item: T) => ReactNode` | `Func<T, object>` | Listbox item subtitle, Menu secondary |
| **GroupSelector** | `(item: T) => string \| null` | `Func<T, string>` | Listbox grouping, Table grouping |
| **GroupHeaderRenderer** | `(group: string, items: T[]) => ReactNode` | similar | Group header content |
| **SectionRenderer** | `(section: S) => ReactNode` | similar | Sticky section dividers |
| **FilterPredicate** | `(item: T, query: string, ctx?: { locale }) => boolean` | `Func<T, string, bool>` | Combobox/MultiSelect/Table filter |
| **Comparator** | `(a: T, b: T, ctx?: { locale }) => number` | `IComparer<T>` | Sort — column, row, listbox |
| **MultiComparator** | `(a, b, sortKeys: SortKey[]) => number` | similar | Table multi-column sort |
| **EqualityComparer** | `(a: T, b: T) => boolean` | `IEqualityComparer<T>` | Selection match for object values |
| **HashFn** | `(item: T) => string` | `Func<T, int>` | Set-based selection at scale |
| **DisabledPredicate** | `(item: T) => boolean` | `Predicate<T>` | Disabled rows/options/dates/cells |
| **SelectablePredicate** | `(item: T) => boolean` | `Predicate<T>` | Tree leaves only, calendar weekdays-only |
| **VisiblePredicate** | `(item: T) => boolean` | `Predicate<T>` | Row visibility |
| **ItemRenderer** | `(ctx: { item, isSelected, isFocused, isDisabled, isExpanded }) => ReactNode` | similar | Custom row/cell |
| **CellRenderer** | `(ctx: { row, column, value }) => ReactNode` | similar | Per-column cell render |
| **HeaderRenderer** | `(ctx: { column, sortDir, isFiltered }) => ReactNode` | similar | Custom column header |
| **EmptyRenderer** | `(query?: string) => ReactNode` | similar | Empty state w/ optional query |
| **LoadingRenderer** | `() => ReactNode` | similar | Async placeholder |
| **ErrorRenderer** | `(error: Error, retry: () => void) => ReactNode` | similar | Async failure |
| **ValueFormatter** | `(value: T, ctx: { locale, options }) => string` | `Func<T, string, string>` | Display: dates, numbers, currency, byte sizes |
| **ValueParser** | `(input: string, ctx: { locale }) => T \| ParseError` | `Func<string, T>` | NumberField, CurrencyInput, MaskedInput |
| **DateAvailability** | `(date: Date) => 'available' \| 'unavailable' \| 'partial'` | similar | Booking calendars |
| **DisabledDate** | `(date: Date) => boolean` | `Predicate<Date>` | DatePicker disable-past, blackout dates |
| **HighlightedDate** | `(date: Date) => 'highlight' \| null \| {className}` | similar | Holidays, today markers |
| **Validator** (sync) | `(value: T) => string \| null` | `Func<T, string?>` | Form field validation |
| **Validator** (async) | `(value: T, signal: AbortSignal) => Promise<string \| null>` | `Func<T, CancellationToken, Task<string?>>` | Async username check |
| **CrossFieldValidator** | `(values: TForm) => Record<keyof TForm, string \| null>` | similar | Confirm-password, date-range |
| **Tokenizer** | `(value: string) => string[]` | similar | TagsInput split, mention parse |
| **QueryNormalizer** | `(query: string, locale: string) => string` | similar | Lowercase + accent-fold + Arabic ya/alif normalize |
| **HighlightFn** | `(text: string, query: string) => ReactNode` | similar | Match highlighting |
| **ContentMatcher** | `(item: T, predicate: any) => boolean` | similar | TreeView nested filter (parent matches if descendant matches) |
| **OnAction (Toast)** | `() => Promise<void> \| void` | `Func<Task>` | Undo callback |
| **PageRequest** | `(query: { page, pageSize, sort, filter, signal }) => Promise<{ rows: T[], total: number }>` | similar | Server pagination |
| **InfiniteRequest** | `(cursor?: string, signal) => Promise<{ rows: T[], nextCursor?: string }>` | similar | Cursor pagination |
| **OnChange** | `(value: T, meta?: { reason }) => void` | `Action<T>` | Universal — `reason` distinguishes user vs programmatic |
| **OnDirty / OnTouched / OnBlur / OnFocus / OnSelect / OnExpand / OnReorder** | event shapes | `Action<...>` | Per-component events |
| **ColorParser / ColorFormatter** | `(string) => Color` / `(Color, format) => string` | similar | ColorPicker hex/rgb/hsl |
| **ScrollAnchor** | `(item: T) => boolean` | `Predicate<T>` | "Stay on this row when list re-fetches" |
| **DragSource / DropTarget** | `(item: T) => DragData` / `(target, dragData) => DropAction` | similar | Drag-drop |
| **OverflowFallback** | `(hiddenCount: number) => ReactNode` | similar | "+N more" rendering |
| **AnnouncementFn** | `(payload: T) => string` | `Func<T, string>` | Live-region message factory |

**Naming convention**: `Selector` / `Predicate` / `Comparator` / `Renderer` / `Formatter` / `Parser` / `Validator` / `Fn`. Shape communicates LINQ-style intent.

---

## 7. i18n leak point inventory

Where translation/locale-data leak — argued: **dozens of leak points, not just labels**. Used to build the LocaleProvider's default messages.

| Component | Embedded text (translation slots) | Locale-aware data |
|---|---|---|
| **DatePicker / Calendar / RangeCalendar** | Month names (long+short) · weekday names (long+short+narrow) · "Today" · "Clear" · "Cancel" · "Apply" · "Previous month/year" · "Next month/year" · "Choose date" announce · keyboard help | Calendar system (Greg/Hijri/Buddhist/Persian/Hebrew/Japanese/Coptic) · week start day · weekend days · week numbering (ISO/US) · date format · era (BC/AD/AH) |
| **TimePicker** | "Hours" · "Minutes" · "Seconds" · "AM"/"PM" · "Hour"/"Minute" announce | 12h/24h hour cycle · meridiem position |
| **DateRangePicker** | DatePicker labels + "Start date" · "End date" · "to" · preset labels ("Last 7 days", "Last month", "This year", "Year to date") | Duration formatting · boundary inclusivity |
| **NumberField** | Increment/decrement aria-labels | Decimal sep · grouping char · numeric system (Latin/Arabic-Indic/Devanagari/Persian) · sign display |
| **CurrencyInput** | Currency name fallback | Code → symbol (USD→$, EUR→€, RUB→₽) · symbol position · ISO 4217 fraction digits (JPY=0, USD=2, BHD=3) · accounting parens for negatives |
| **PercentInput** | "%" position (before/after per locale) | Stored 0–1 vs 0–100 |
| **FileUpload** | "Drop files here" · "Browse" · "or click to select" · "Choose file" · "X files selected" · "Uploading…" · "Upload failed" · "Retry" · "Remove" · per-error msgs ("File too large", "Wrong type") | File size formatter (binary 1024 → KiB; decimal 1000 → kB; ru "КБ"; ja "キロバイト") · max-size message |
| **MultiSelect / Combobox** | Search placeholder · "No results" · "X items selected" (plural!) · "Clear all" · "Show more" · "Select all" · "Show selected" · "Add new" · loading | Pluralization (en: 1/other; ru: 1/2-4/5+; ar: 6 forms) · search collation |
| **Listbox** | "No options" · selection count | Sort / collation |
| **Pagination** | "Previous" · "Next" · "Page X of Y" · "First" · "Last" · "Showing X–Y of Z" · "Items per page" · "Go to page" | Number format · ordinal (1st, 1°, 1ст) |
| **Table / DataGrid** | "No data" · "Loading…" · "Sort ascending"/"descending" · "Filter" · "Group by" · "Clear filter" · "Reset" · column visibility menu · row count footer · "Rows per page" · "Selected X of Y" · drag-handle aria-label | Cell-level formatters · sort collation · header text wrap (CJK no-break) |
| **Toast** | Action labels · "Dismiss" · severity announce ("Error:", "Success:") | — |
| **Modal / Dialog / AlertDialog** | "Close" aria-label · "OK" · "Cancel" · "Confirm" · "Yes" · "No" | — |
| **Drawer** | "Close" · drag-handle aria | — |
| **Stepper** | "Step X of Y" · "Optional" · "Completed" · "Current step" · "Previous"/"Next step" | — |
| **Carousel** | "Previous slide" · "Next slide" · "Slide X of Y" · "Pause" · "Play" · indicator labels | — |
| **Search / SearchField** | "Search…" · "Clear search" · "X results found" · "No results for `{query}`" · suggestion section labels | Collation · accent stripping |
| **Form errors (built-in)** | "Required" · "Invalid email" · "Invalid URL" · "Must be at least X characters" · "Must be at most X" · "Must be a number" · "Must be ≥ X" · "Must be ≤ X" · "Must match pattern" · "Passwords don't match" · "Date must be after Y" · async-validating · "Network error" | Number/date format in messages · gendered nouns (es/de/fr) |
| **TagsInput** | "Add tag" · "Remove `{tag}`" · "Press Enter to add" · max reached · invalid tag | Collation for dupe-detect |
| **ColorPicker** | "Hue" · "Saturation" · "Brightness/Value" · "Lightness" · "Alpha" · channel slider labels · format toggle ("Hex"/"RGB"/"HSL") · "Eyedropper" · "Recent colors" · "Add to swatches" · "Color: {hex}" announce | — |
| **Rating** | "X out of Y stars" · "No rating" · "Click to rate" · per-star labels | Pluralization |
| **Editable** | "Edit" · "Save" · "Cancel" · "Press Enter to save" | — |
| **Tour / Walkthrough** | "Next" · "Previous" · "Skip" · "Done" · "Step X of Y" · "Don't show again" | Pluralization |
| **EmptyState (default)** | "No items found" · "No data" · "Nothing to show" — usually consumer-supplied | — |
| **Tree / TreeView** | "Expand" · "Collapse" · "Selected" · "Loaded X children" announce | — |
| **Sidebar / Drawer / Menu (chrome)** | "Open menu" · "Close menu" · "Main navigation" landmark | — |
| **Avatar** | "User initials" alt fallback · "X more users" (group) · status ("Online"/"Away"/"Busy"/"Offline") | — |
| **Progress / MeterBar** | "X% complete" · `aria-valuetext` per threshold ("Critical", "Low", "Healthy") | Number format |
| **KbdShortcut** | "Cmd"/"Command"/"⌘" · "Shift" · "Ctrl"/"Control" · "Alt"/"Option" · "Enter"/"Return" · "Esc"/"Escape" · "Space" · arrow names | OS detection (Mac glyphs vs Windows names) |
| **CommandPalette** | "Type a command…" · section headers · "Recent" · "No commands" · "Go to" verbs | Collation; ICU plural for results count |
| **ImageCropper** | "Crop" · "Rotate" · "Aspect ratio" · per-ratio labels ("Square", "Portrait") · "Reset" | — |
| **Tooltip / HoverCard** | (Content is consumer-supplied; chrome has none) | — |
| **Spinner / LoadingState** | "Loading" · "Loading {label}…" | — |
| **AlertDialog destructive** | Convention: confirm verb in active voice ("Delete account", not "OK") — not auto-translatable | — |
| **Sliders** | `aria-valuetext` for non-numeric · per-thumb label ("Minimum", "Maximum") | Number format in valuetext |
| **NumberFormatter / FormatBytes / FormatTime / FormatRelative** | Unit names ("days", "hours") | Locale-specific units, plural rules |

**Aggregate count**: ~150–200 distinct strings if every state/aria-label/announcement across the whole library is covered.

**Solution shapes**:
- Translation **provider** at root: dictionary or `(key, vars) => string` callback. Library ships English defaults.
- **Per-component prop overrides**: `<DatePicker labels={{ today: 'Сегодня', monthNext: 'Следующий месяц' }}/>`
- **`Intl.*` consumption** — never ship our own date/number formatters; take locale string + options and delegate.

---

## 8. Browser APIs (MDN encyclopedia)

Every named API at [developer.mozilla.org/en-US/docs/Web/API](https://developer.mozilla.org/en-US/docs/Web/API), grouped by relevance to a UI library.

**Relevance legend**:
- **Ω** — Foundational for UI work; UI lib should provide a hook/wrapper
- **A** — UI-relevant; consider wrapping for common cases
- **B** — Specialty; rarely in a general-purpose UI lib (separate package or app-level)
- **—** — Out of scope for a UI lib (data layer, PWA, hardware-specific apps)

### 8.1 DOM observation

| API | Description | Rel |
|---|---|---|
| Intersection Observer | Observe element visibility relative to viewport/ancestor | Ω |
| Resize Observer | Observe element box size changes | Ω |
| Mutation Observer | Observe DOM tree mutations | A |
| Performance Observer | Observe performance entries | A |
| Reporting Observer | Observe deprecation/intervention reports | B |

### 8.2 Visibility / Lifecycle

| API | Description | Rel |
|---|---|---|
| Page Visibility API | `document.visibilityState` — pause polling/animation when hidden | Ω |
| Page Lifecycle API | `freeze`, `resume` events; bfcache awareness | A |
| Visual Viewport API | Visible viewport (after pinch-zoom, software keyboard) | A |

### 8.3 Pointer / Input devices

| API | Description | Rel |
|---|---|---|
| Pointer Events | Unified mouse/touch/pen with pressure/tilt | Ω |
| Touch Events | Legacy touch — superseded by Pointer in modern browsers | A |
| Mouse Events | Standard mouse interaction | Ω |
| UI Events / Keyboard Events | `keydown`/`keyup`/`keypress` (deprecated) | Ω |
| Drag and Drop API | Native HTML5 drag-drop | Ω |
| Pointer Lock API | Capture cursor (games, drawing apps) | B |
| Gamepad API | Detect & poll gamepads | B |
| Keyboard Lock API | Capture system shortcuts (Esc, F11) — fullscreen apps | B |
| Keyboard Map API | Get layout-independent key codes | A |

### 8.4 Selection / Editing / Forms

| API | Description | Rel |
|---|---|---|
| Selection API | Get/set text selection | A |
| Range API | Document fragment ranges | A |
| EditContext API | Modern contenteditable replacement (Chromium) | A |
| Element Internals | Custom element form association + ARIA reflection | A |
| Constraint Validation API | Native form validation (`setCustomValidity`, `validity`) | Ω |

### 8.5 Clipboard

| API | Description | Rel |
|---|---|---|
| Clipboard API | Async `navigator.clipboard.read/write` + clipboard events | Ω |

### 8.6 Storage / Cache

| API | Description | Rel |
|---|---|---|
| Web Storage (localStorage/sessionStorage) | Synchronous key/value | Ω |
| IndexedDB | Async structured database | A |
| Cache API | Service worker cache (request/response pairs) | B |
| Cookie Store API | Async cookie read/write | A |
| Storage API | Quota, persistence | A |
| Storage Buckets API | Per-feature storage with own quota | B |
| Storage Access API | Embedded third-party storage permission | B |
| Origin Private File System (OPFS) | Sandboxed FS via File System Access | B |

### 8.7 File / Filesystem

| API | Description | Rel |
|---|---|---|
| File API | `File`, `Blob`, `FileList` | Ω |
| FileReader | Async read (`readAsText`, `readAsDataURL`, `readAsArrayBuffer`) | Ω |
| File System Access API | Native open/save dialogs (Chromium) | A |
| File and Directory Entries API | Drag-drop folder traversal | A |

### 8.8 Networking / Communication

| API | Description | Rel |
|---|---|---|
| Fetch API | Modern HTTP requests | A |
| XMLHttpRequest | Legacy HTTP | — |
| WebSocket API | Bi-directional persistent socket | B |
| WebTransport API | Multiplexed streams over HTTP/3 (QUIC) | — |
| WebRTC API | Peer-to-peer audio/video/data | B |
| Server-Sent Events (EventSource) | Server-push over HTTP | B |
| Beacon API | Fire-and-forget POST on unload | A |
| Push API | Server push to service worker | — |
| Background Fetch API | Long-running download in background | — |
| Network Information API | Connection type/effective speed (Chromium) | A |

### 8.9 Communication / Channels

| API | Description | Rel |
|---|---|---|
| Notifications API | OS-level notifications | A |
| BroadcastChannel API | Same-origin cross-tab pub-sub | A |
| Channel Messaging API (`MessageChannel`) | Two-port message passing | B |

### 8.10 Workers / Async / Scheduling

| API | Description | Rel |
|---|---|---|
| Web Workers API | Background threads | B |
| Shared Web Workers | Workers shared across tabs | B |
| Service Worker API | Network proxy + offline + push | — |
| Worklets API | Lightweight workers for CSS/Audio Houdini | B |
| Web Locks API | Async cross-context lock | B |
| SharedArrayBuffer / Atomics | Shared memory between threads | B |
| Background Tasks (`requestIdleCallback`) | Defer work to idle frames | A |
| Prioritized Task Scheduling (`postTask`) | Scheduler with priorities | A |
| Background Sync API | Queue mutations while offline | — |
| Periodic Background Sync API | Periodic background fetch | — |

### 8.11 Media — Capture

| API | Description | Rel |
|---|---|---|
| Media Capture and Streams (`getUserMedia`) | Camera/mic streams | B |
| MediaStream Recording API | Record streams to Blob | B |
| Image Capture API | Per-frame capture from camera | B |
| Screen Capture API (`getDisplayMedia`) | Screen recording | B |
| Audio Output Devices API | Pick audio output | B |
| Encoded Transform API | Insert into encoded media pipeline | — |

### 8.12 Media — Playback / Codecs

| API | Description | Rel |
|---|---|---|
| Media Source Extensions | Adaptive streaming (HLS/DASH) | B |
| Encrypted Media Extensions | DRM (Widevine, FairPlay) | — |
| Media Capabilities API | Probe codec/decoder support | B |
| Media Session API | OS media controls integration | A |
| Picture-in-Picture API | Floating video window | A |
| Document Picture-in-Picture API | Floating arbitrary HTML window (Chromium) | A |
| WebVTT API | Captions/subtitles | A |
| WebCodecs API | Low-level codec access | B |

### 8.13 Audio / Speech / MIDI

| API | Description | Rel |
|---|---|---|
| Web Audio API | Audio routing graph + DSP | B |
| Speech Synthesis (Web Speech) | TTS — `speechSynthesis.speak(...)` | A |
| Speech Recognition (Web Speech) | STT — voice input (Chromium) | A |
| Web MIDI API | MIDI device IO | B |

### 8.14 Graphics / Rendering

| API | Description | Rel |
|---|---|---|
| Canvas API (2D) | 2D bitmap rendering | A |
| Path2D | Reusable canvas path | A |
| WebGL API | OpenGL ES 2.0/3.0 in browser | B |
| WebGPU API | Modern compute + render | B |
| WebXR Device API | VR/AR | — |
| ImageBitmap | Async image source | A |
| OffscreenCanvas | Canvas in worker | B |

### 8.15 Animation / CSS

| API | Description | Rel |
|---|---|---|
| Web Animations API | Imperative animations from JS | A |
| View Transitions API | `document.startViewTransition` for page/state transitions | Ω |
| CSS Animations | `@keyframes` + `animation` | Ω |
| CSS Transitions | `transition` property | Ω |
| CSS Houdini Paint API | Worklet-driven custom backgrounds | B |
| CSS Houdini Layout API | Worklet-driven layouts (proposal) | B |
| CSS Houdini Properties and Values API | Typed CSS custom props | A |
| CSS Anchor Positioning API | Position relative to anchor (Chromium) | A |
| CSS Custom Highlight API | Programmatic ranges → `::highlight()` | A |
| CSS Counter Styles API | Custom list counters | A |
| CSSOM | Manipulate stylesheets/rules | A |
| CSS Typed OM | Typed property values | A |
| Animation Worklet API | Off-main-thread animation | B |
| Local Font Access API | Enumerate installed fonts (Chromium) | A |
| CSS Font Loading API | `document.fonts.load(...)` | A |

### 8.16 UI Surfaces

| API | Description | Rel |
|---|---|---|
| Fullscreen API | `requestFullscreen` | A |
| Popover API | Native HTML `popover` attribute + top-layer | Ω |
| Window Controls Overlay API | PWA title-bar customization | — |
| Presentation API | Cast to second screen | B |
| Web App Manifest | PWA install metadata | — |

### 8.17 Sensors

| API | Description | Rel |
|---|---|---|
| Generic Sensor API | Base for sensor types | B |
| Accelerometer | Linear motion | B |
| Gyroscope | Angular velocity | B |
| Magnetometer | Magnetic field (compass) | B |
| Linear Acceleration Sensor | Without gravity | B |
| Gravity Sensor | Gravity vector | B |
| Absolute Orientation Sensor | World-frame orientation | B |
| Relative Orientation Sensor | Device-frame orientation | B |
| Ambient Light Sensor | Lux (limited support) | B |
| Proximity Sensor | Proximity in cm | B |
| Device Orientation Events | Older orientation API | B |

### 8.18 Device State

| API | Description | Rel |
|---|---|---|
| Geolocation API | Lat/long | A |
| Battery Status API | Level, charging | A |
| Device Memory API | Approx RAM (Chromium) | A |
| Device Posture API | Foldable device posture | B |
| Screen Orientation API | Lock/observe orientation | A |
| Wake Lock API | Prevent screen sleep | A |
| Idle Detection API | User idle (Chromium) | A |
| Vibration API | `navigator.vibrate(...)` | A |
| Compute Pressure API | CPU pressure level (Chromium) | A |
| User-Agent Client Hints API | Modern UA replacement | A |

### 8.19 Hardware peripherals

| API | Description | Rel |
|---|---|---|
| Web Bluetooth API | BLE devices (Chromium) | — |
| WebUSB API | USB devices (Chromium) | — |
| WebHID API | Human Interface Devices (Chromium) | — |
| Web NFC API | NFC tag read/write (Android Chromium) | — |
| Web Serial API | Serial ports (Chromium) | — |
| Barcode Detection API | OS-level barcode parse (Chromium/Android) | A |

### 8.20 Identity / Auth

| API | Description | Rel |
|---|---|---|
| Credential Management API | Password manager integration | A |
| Web Authentication API (WebAuthn) | Passkey / FIDO2 | A |
| FedCM (Federated Credential Management) | OAuth flows in-browser | A |
| Digital Credentials API | Verifiable credentials (early) | B |
| Contact Picker API | Pick contacts (Android Chromium) | A |

### 8.21 Crypto / Security

| API | Description | Rel |
|---|---|---|
| Web Crypto API | Subtle crypto (hash, sign, encrypt) | B |
| HTML Sanitizer API | Sanitize untrusted HTML strings | A |
| Permissions API | Query/request permissions uniformly | Ω |
| Permissions Policy | `<iframe allow>` directives | A |
| Trusted Types | XSS mitigation via type-tagged strings | A |

### 8.22 Routing / URL

| API | Description | Rel |
|---|---|---|
| URL API | `URL`, `URLSearchParams` | Ω |
| URL Pattern API | Pattern matching for routing | A |
| History API | `pushState`, `replaceState` | Ω |
| Navigation API | Modern replacement for History (Chromium) | A |
| Location API | `window.location` | Ω |

### 8.23 Performance / Telemetry

| API | Description | Rel |
|---|---|---|
| Performance API | High-res timestamps, marks, measures | A |
| Navigation Timing API | Page load timings | A |
| Resource Timing API | Resource fetch timings | A |
| User Timing API | Custom marks/measures | A |
| Long Tasks API | Tasks ≥ 50ms | A |
| Long Animation Frames API | Frame-level slowness | A |
| Layout Instability API | CLS metric | A |
| Largest Contentful Paint API | LCP metric | A |
| Paint Timing API | FP/FCP | A |
| Frame Timing API | Per-frame timings | A |
| High Resolution Time | `performance.now()` | A |
| Memory Measurement API | `measureUserAgentSpecificMemory` | B |
| Reporting API | Crash/intervention reports | B |

### 8.24 Notifications / Sharing / Engagement

| API | Description | Rel |
|---|---|---|
| Notifications API | OS notifications | A |
| Web Share API | Native share sheet | A |
| Web Share Target API | Receive shared data (PWA) | — |
| Badging API | App icon badge count | A |
| Content Index API | Surface offline content | — |
| Launch Handler API | PWA launch behavior | — |

### 8.25 Streams / Encoding

| API | Description | Rel |
|---|---|---|
| Streams API | ReadableStream / WritableStream / TransformStream | A |
| Compression Streams API | gzip/deflate streaming | B |
| Encoding API | TextEncoder / TextDecoder | A |

### 8.26 Web Components

| API | Description | Rel |
|---|---|---|
| Custom Elements | `customElements.define(...)` | A |
| Shadow DOM | Encapsulated subtrees | A |
| HTML Templates | `<template>` element | A |
| Element Internals | (Already in §8.4) — form/ARIA association | A |
| Slot/Slottable | `<slot>` projection | A |

### 8.27 Devtools / Standards

| API | Description | Rel |
|---|---|---|
| Console API | `console.*` | Ω |
| WebDriver API | Test automation | — |
| Eyedropper API | Pick on-screen color (Chromium) | A |
| Payment Request API | Web Payments | B |
| Payment Handler API | Payment app role | — |

---

## 9. React / client-side ecosystem (sketch — to expand)

> Sketch only. To be fleshed out later when scope expands beyond styles + components.

### 9.1 React 19 features

| Feature | Description |
|---|---|
| `use(promise)` | Read promises in render (Suspense-aware) |
| `useOptimistic` | Optimistic state during pending |
| `useFormStatus` | Read parent form's pending state |
| `useActionState` | Action-based form state |
| `<Form action={...}>` | Server action form (RSC) |
| `ref` as prop | No more `forwardRef` boilerplate |
| Document metadata | `<title>`, `<meta>` in components |
| Stylesheet preloading | `<link rel="stylesheet" precedence="..."/>` |
| Improved Suspense | Sibling pre-warming |
| Async transitions | Pending state during async |

### 9.2 State management

| Lib | Model | Notes |
|---|---|---|
| useState / useReducer | Built-in | Local component |
| useContext | Built-in | Implicit DI |
| Zustand | Hook + store | Most popular external |
| Jotai | Atoms (Recoil-style) | Fine-grained |
| Valtio | Proxy mutation | Mutable feel |
| Redux Toolkit | Redux + slices | Enterprise legacy |
| MobX | Observable + reactive | OOP-friendly |
| TC39 Signals | Standard signals (proposal) | Future-native |
| Effector | Effects + stores + events | FRP |
| Nanostores | Tiny atoms | Astro-friendly |
| XState | State machines / statecharts | Complex flows |
| Recoil | Atoms (Meta) | Deprecated |

### 9.3 Routing

| Lib | Notes |
|---|---|
| React Router | Most popular (v7 = Remix merger) |
| TanStack Router | Type-safe |
| Next.js (App Router) | RSC + file-based |
| Wouter | Tiny |
| Reach Router | Deprecated → React Router |

### 9.4 Data fetching

| Lib | Notes |
|---|---|
| TanStack Query | Most popular, normalized cache |
| SWR | Vercel, simpler |
| Apollo Client | GraphQL |
| urql | Lightweight GraphQL |
| Relay | Meta GraphQL |
| RSC + use() | Native React |
| tRPC | TypeScript RPC |
| Convex / Liveblocks / Firestore | Realtime sync |

### 9.5 Form libs

| Lib | Notes |
|---|---|
| React Hook Form | Most popular, performant |
| TanStack Form | Type-safe modern |
| Formik | Legacy |
| Felte | Headless |
| Final Form | Functional |
| Effect Form | Effect-ts ecosystem |

### 9.6 Validation libs

| Lib | Notes |
|---|---|
| Zod | Most popular |
| Yup | Forms-traditional |
| Valibot | Modular, tree-shakeable |
| ArkType | Type-level |
| Effect Schema | Effect-ts |
| Joi | Server-side legacy |
| Superstruct | Tiny |
| Standard Schema spec | Cross-validator interop |

### 9.7 Animation libs

| Lib | Notes |
|---|---|
| Framer Motion / Motion | Most popular, gestures |
| React Spring | Physics-based |
| AutoAnimate | One-line drop-in |
| GSAP | Most powerful, license |
| React Transition Group | Lower-level |
| Theatre.js | Visual editor |
| Anime.js | Simple |

### 9.8 Drag-and-drop libs

| Lib | Notes |
|---|---|
| dnd-kit | Modern, sensors |
| Pragmatic Drag-and-Drop | Atlassian, lighter |
| react-beautiful-dnd | Deprecated |
| react-dnd | HTML5 backend |
| Framer Motion Reorder | Simple list reorder |
| React Aria DnD | Built-in a11y |

### 9.9 Virtualization libs

| Lib | Notes |
|---|---|
| TanStack Virtual | Latest, framework-agnostic |
| react-window | Brian Vaughn, simple |
| react-virtuoso | Variable-height-friendly |
| react-virtualized | Legacy |

### 9.10 Date / Number / Color libs

| Lib | Domain |
|---|---|
| date-fns | Date — most popular |
| dayjs | Date — moment-like, smaller |
| luxon | Date — Intl-aware |
| moment | Date — legacy |
| Temporal API | Date — TC39 stage 3 |
| @internationalized/date | Date — React Aria |
| big.js / decimal.js | Number — arbitrary precision |
| chroma-js / culori / colord / tinycolor | Color |

### 9.11 i18n libs

| Lib | Notes |
|---|---|
| react-i18next | Most popular |
| FormatJS / react-intl | ICU MessageFormat |
| Lingui | Compact |
| next-intl | Next.js-aware |

### 9.12 Icon libraries

| Lib | Style |
|---|---|
| Lucide | Outline (shadcn default) |
| Heroicons | Tailwind team |
| Phosphor | Multi-weight |
| Tabler | Outline + filled |
| Radix Icons | Geometric |
| Material Symbols | Google |
| Fluent UI Icons | Microsoft |
| Ionicons | Ionic |
| BoxIcons / Feather | Older popular |

### 9.13 Variants / styling helpers

| Lib | Role |
|---|---|
| class-variance-authority (cva) | Variant API |
| tailwind-variants (we use) | Tailwind-aware variants |
| clsx | Class joiner |
| tailwind-merge (we use) | Conflict resolver |
| Panda CSS recipes | Vanilla Extract-style |
| Stitches variants | Legacy CSS-in-JS |

### 9.14 Utility libs

| Lib | Role |
|---|---|
| immer | Immutable mutation |
| nanoid | ID generation |
| ts-pattern | Pattern matching |
| zod (already noted) | Schema |
| ramda / lodash / lodash-fp | FP utils |
| date-fns (already noted) | Dates |

---

## 10. Tooling ecosystem (sketch — to expand)

| Domain | Options |
|---|---|
| Bundlers | Vite, esbuild, swc, Rollup, Webpack, Turbopack, Rspack, tsup, unbuild, parcel, bun |
| Test runners | Vitest, Jest, Bun test, Mocha, Playwright Test |
| Test libs | Testing Library, user-event, msw, axe-core |
| Visual regression | Chromatic, Percy, Playwright snapshots, Loki |
| Linters | ESLint, Biome, Oxlint, dprint |
| Formatters | Prettier, Biome, dprint |
| Type checkers | tsc, vtsc-fast (deprecated), isolatedDeclarations |
| Storybook | Storybook 8+, Ladle (alt) |
| Docs sites | Docusaurus, Nextra, Vocs, Mintlify, Starlight, VitePress |
| Package managers | pnpm, npm, yarn, bun |
| Versioning | Changesets, lerna (legacy), semantic-release |
| Monorepo | pnpm workspaces, Nx, Turborepo, Rush |
| Cli scaffolding | create-vite, create-next-app, plop, hygen |

---

## References

- Companion: [`targets.md`](./targets.md) — what *we'll* implement
- Workspace audit: [`docs/audits/library-references.md`](../../../../../../docs/audits/library-references.md) — component coverage matrix
- WAI-ARIA APG — w3.org/WAI/ARIA/apg/
- MDN Web APIs index — developer.mozilla.org/en-US/docs/Web/API
- Intl API — developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- Standard Schema — github.com/standard-schema/standard-schema
- W3C Design Tokens — design-tokens.github.io/community-group/format/
- Material Design 3 — m3.material.io
- Carbon — carbondesignsystem.com
- Spectrum — spectrum.adobe.com
- Atlassian Design Tokens — atlassian.design/tokens
- shadcn — ui.shadcn.com

---

*Sketch sections (§9 React ecosystem, §10 Tooling) are placeholders for later expansion. Update as scope widens beyond styles + components.*

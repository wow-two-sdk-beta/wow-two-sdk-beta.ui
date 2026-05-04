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
| 9 | React / client-side ecosystem | Picking complementary libs (state / routing / data / forms / animation / DnD / virt / dates / i18n / icons / variants / utils / state machines / reactivity / rendering & hydration strategies) |
| 10 | Tooling ecosystem | Build / dev server / test / lint / format / type / docs / monorepo / CI / bundle analysis / CSS tooling / scaffolding |
| 11 | Cross-framework UI ecosystem | Vue / Svelte / Solid / Angular / Web Components / Cross-platform / Resumability (Qwik) / Server-driven (HTMX / LiveView / Hotwire) |
| 12 | Modern CSS landscape | Capabilities to leverage *today* — container queries · `:has()` · View Transitions · Anchor Positioning · OKLCH · `@layer` · `@scope` · `@property` · scroll-driven animations · math fns |
| 13 | Anti-patterns / what to avoid | Component-design · a11y · perf · theming · i18n · DX patterns to skip |
| 14 | Domain-specific component deep dives | High-complexity clusters: payment · identity/auth · address+contact · date/time deep · maps · editors · AI/LLM · e-commerce · banking · comm/collab · media · education · onboarding · privacy · DevOps |

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

### 5.10 User-flagged additions during capture

Live "noted but not yet sorted" list. Anything captured here gets re-homed into a numbered section once classified.

| Item | Note (verbatim/derived) | Closest existing entry / candidate name |
|---|---|---|
| "tooltip → menu" (user note) | Simple floating btn that opens a menu / radial menu to choose options | Overlaps `actions/SpeedDial` (FAB + radial). Likely worth a *non-FAB, contextual, hover-revealed* sibling — call it `FloatingMenuButton` or `HoverMenuButton` (Notion-style "+" on hover; smaller than FAB; doesn't claim a fixed corner). Capture as a distinct candidate in §5.7 / §5.13 once shape is decided. |

### 5.11 Editorial / content creation

| Component | Vectors |
|---|---|
| RichTextEditor | Engine choice (Tiptap / ProseMirror / Lexical / Slate / Quill / Draft) · floating toolbar · slash-command menu · paste-as-plain · markdown shortcuts · image embed · table embed · mention/hashtag · collaborative cursors · undo/redo · history persistence · output: HTML / Markdown / JSON |
| MarkdownEditor | Live preview · split / unified · toolbar · KaTeX/MathJax · mermaid · syntax-highlighted code blocks · file drop · image upload pipeline · slash commands · word count |
| CodeEditor | Engine (Monaco / CodeMirror 6 / Ace) · per-language syntax · linting · IntelliSense · diff view · multi-cursor · folding · find/replace · command palette · vim/emacs keymap · theme · LSP / language services |
| JSONEditor | Tree mode / text mode toggle · per-type icons · path breadcrumbs · search · inline validation against schema · copy path / value · expand/collapse all · array reorder |
| YAMLEditor | Variant of CodeEditor; schema-aware validation (yaml-language-server) · YAML-specific folding |
| TomlEditor | TOML-aware variant |
| DiffViewer | Side-by-side / unified · word-level / char-level highlight · syntax-aware · collapsible context · line-number gutter · "X+ / Y-" stats · in-line comment slot |
| ThreeWayMerge | Local · base · remote — conflict markers + per-hunk pick · final preview |
| WhitespaceRevealer | Show tabs / spaces / line endings · variant toggle |
| FormulaEditor | Spreadsheet formula bar w/ tokenization · function help · cell-ref autocomplete · circular-ref detection |
| RegexBuilder | Group preview · sample-text live highlight · cheat-sheet panel · explain-mode |
| CronEditor | Field-by-field cron string builder · "every Monday at 9am" preview · schedule visualization |
| RRuleEditor | iCal RRULE: frequency · interval · byday · count/until · preview list · timezone |
| EquationEditor | LaTeX input + KaTeX/MathJax preview · hand-recognition (mobile) |
| QueryEditor (SQL/SPARQL/etc.) | Syntax · auto-complete from schema · result preview · saved queries |
| MarkdownTableEditor | Visual table with row/column add · alignment · paste-from-spreadsheet |
| Outliner | Indented bullet tree · drag-reorder · keyboard outdent/indent · Workflowy-style |

### 5.12 Visual / drawing / canvas (free-form)

| Component | Vectors |
|---|---|
| Whiteboard | Excalidraw-style: shapes · arrows · sticky notes · freehand · multi-select · grouping · zoom/pan · grid snap · export PNG/SVG · collab cursors · unlimited canvas |
| InfiniteCanvas | Pan/zoom layer + viewport state · cull off-screen · world↔screen coords · grid overlay · keyboard zoom |
| ZoomPanContainer | Single-image zoom/pan · pinch/wheel · double-click reset · max/min zoom |
| Minimap | Reduced-scale viewport indicator · drag-to-pan · zoom-to-region |
| ImageAnnotator | Rectangles · arrows · text labels · redaction · layer order · per-shape style · undo |
| ImageEditor | Crop · rotate · flip · filters (brightness/contrast/saturation/blur) · before/after slider · undo |
| ImageCropper | Aspect lock · zoom · rotate · multi-zone crop · per-corner drag |
| BeforeAfterSlider | Two images · drag handle · vertical/horizontal |
| SignaturePad | Pressure (Pointer Events) · undo · clear · export PNG/SVG · stroke smoothing |
| DrawingCanvas | Brush size/color/opacity · eraser · undo stack · save state (PNG/SVG/path data) |
| ColorEyedropper | EyeDropper API (Chromium) — fallback canvas-pick |
| StickyNote | Draggable card on canvas · resizable · color · author |
| ShapeLibrary | Pre-canned arrow / rect / ellipse / star / polygon insertion |

### 5.13 Diagrams & graph visualization (structured)

| Component | Vectors |
|---|---|
| NodeEditor | (React Flow / Rete / Litegraph): nodes + edges · ports · drag/connect · auto-layout (dagre / elk) · minimap · zoom · undo · sub-flows · custom node renderers |
| FlowchartEditor | BPMN-flavored: start/end/decision/activity nodes · swim lanes · per-shape rules |
| MindMap | Radial / horizontal · drag to add · keyboard add (Tab/Enter) · collapse subtree |
| OrgChart | Hierarchical card layout · zoom/pan · search/highlight · expand/collapse · printable layout |
| DecisionTree | Branching node tree · per-edge label · canonical layout |
| StateMachineViz | Nodes = states · edges = transitions · highlight current · history overlay |
| FamilyTree | Pedigree layout · partner edges · multi-generation · birth/death dates |
| EventTimeline | (Beyond display Timeline): horizontal time axis · zoomable · per-track event bars · drag-to-resize · clustering at zoom-out |
| Gantt | Tasks × time · dependencies (FS/SS/FF/SF arrows) · milestone diamonds · drag-to-move/resize · critical path · weekend shading |
| Sankey | Flow widths · multi-step · highlight path on hover |
| TreeMap | Nested rectangles · color by metric · drill-down · breadcrumb |
| Heatmap (calendar) | GitHub-contributions style: day-cell grid · intensity color · hover tooltip · year/week navigation |
| Heatmap (matrix) | X × Y · cell color · row/col labels · clustering option · zoom |
| NetworkGraph | Force-directed · node clustering · edge bundling · zoom · search · highlight-neighbors-on-hover |
| ScatterMatrix | All-pair scatter · brush-link |
| ParallelCoordinates | Multi-axis line traces · brush per axis |
| RadarChart | Multi-axis polygon · multi-series overlay |
| GaugeChart | Half-circle / full-circle dial · threshold zones · animated needle |
| FunnelChart | Conversion stages · drop-off labels |
| Sunburst | Hierarchical pie · zoom-to-segment |
| ChordDiagram | Inter-relationship arcs · interactive ribbon highlight |
| ChromaSpectrum | Colored bars / strips for color-data viz |

### 5.14 Tabular advanced (beyond DataTable)

| Component | Vectors |
|---|---|
| DataGrid | Spreadsheet-grade: cell editor per column · range selection (drag) · fill handle · copy/paste TSV · undo · cell formatting · cell validation · frozen rows/cols · cell merge · cell comments · keyboard nav (cell + row) |
| Spreadsheet | DataGrid + formulas (HyperFormula / fortune-sheet / Univer) · function bar · sheet tabs · named ranges · charts · pivot integration |
| PivotTable | Drag fields to rows/cols/values/filters · aggregations (sum/avg/count/min/max/median/p95) · subtotals · custom calc fields |
| TreeGrid | Tree + table hybrid · expandable rows showing children · per-level indent · selection inheritance |
| QueryBuilder | AND/OR groups · per-field operator · type-aware operators (text vs number vs date) · collapsible groups · save/load · SQL preview |
| FilterPillBar | Active filter chips · click-to-edit · clear-all · "+N more" overflow |
| FacetedSearch | Per-facet checkbox / range / search · count badges · "show more" |
| GroupBySummary | Collapsible group rows · per-group totals · sticky group header on scroll |
| ColumnChooser | Show/hide columns · drag-reorder · search · save view |
| SavedView | Per-user named filter+sort+columns combos · share view URL |

### 5.15 Time-bounded & scheduling

| Component | Vectors |
|---|---|
| EventCalendar | Month / week / day / agenda views · drag-create event · drag-move/resize · all-day vs timed · timezone display · recurring events (RRULE) · per-event color · double-booking visual |
| ScheduleView | Multi-resource timeline (rooms × hours) · drag-to-assign · busy/free slots · conflict detection |
| AvailabilityMatrix | Day × hour grid · per-cell availability click · drag-paint range |
| BookingSlots | List of slots · time-zone aware · per-slot reserve button · sold-out indication |
| TimePicker (advanced) | (Beyond §5.1 simple): clock face UI · 12h/24h · seconds · AM/PM toggle · stepper-driven for accessibility |
| DurationInput | "1h 30m" style · clamp to range · units toggle (h/m/s) · negative durations |
| RecurrenceEditor | (See §5.11 RRuleEditor) — schedule-app variant with end-mode toggle (forever / count / until) |
| TimezonePicker | Searchable IANA list · current-time preview · "Use system" toggle |
| CountdownTimer | Stop/start/reset · format (HH:MM:SS) · expiry callback · visibility-pause |
| Stopwatch | Lap times · pause/resume · keyboard control |
| YearHeatmap | (See §5.13 calendar heatmap) — aliased here for time-domain context |

### 5.16 Document & media playback

| Component | Vectors |
|---|---|
| PDFViewer | (PDF.js wrapper): page list · zoom · rotate · search · text selection · thumbnail strip · annotations · keyboard nav · download · print |
| PDFAnnotator | Highlight · note pin · drawing · stamp · per-annotation reply · export annotated PDF |
| DocViewer | Multi-format (PDF / DOCX / PPTX / images): viewer abstraction · zoom · page nav |
| EpubReader | Pagination · font size · theme · TOC · bookmarks · highlight · reading progress |
| VideoPlayer | Custom controls · keyboard scrub · captions/subtitles toggle · quality selector · playback speed · PiP toggle · fullscreen · poster · keyboard shortcuts (`Space`/`F`/`M`/`←/→`) · chapter markers · loop · skip-intro |
| AudioPlayer | Custom controls · waveform optional · playback speed · loop · A-B repeat · keyboard (`Space`/`←/→`/`M`) · queue / playlist |
| AudioWaveform | Visualization · region select · zoom · playhead · loop region · spectrogram option |
| LiveStreamPlayer | Buffer indicator · live indicator · DVR seek-back · low-latency mode · chat sidebar slot |
| VTTCaptions | Render WebVTT · style options · pop-out window · keyboard scrub-to-cue |
| SubtitleEditor | Timestamp + text rows · waveform sync · drag-resize duration · export VTT/SRT |
| ImageGallery / Lightbox | Grid + full-screen viewer · keyboard nav · pinch zoom · captions · slideshow |
| MediaCarousel | Mixed-media (image/video) variant of Carousel |

### 5.17 Communication & collaboration

| Component | Vectors |
|---|---|
| ChatList | Threads sidebar · unread badge · last-message preview · search · pin · archive |
| ChatComposer | Multi-line input · mentions (`@`) · emoji picker · file attach · reply quoting · format toolbar · send-on-Enter / Shift+Enter newline · slash commands · draft persistence |
| MessageList | Bubble layout · per-side (own / theirs) · grouped by sender · timestamp clusters · read receipts · reactions · editable · deletable · scroll-to-bottom button · jump-to-unread divider |
| ChatBubble | Single-message rendering · markdown · link preview · code blocks · per-status (sent/delivered/read/failed) |
| ThreadView | Reply chain · collapsible · "view in main" |
| Mentions input | Trigger char · async list · arrow-pick · escape · paste-without-trigger |
| EmojiPicker | Categorized · search · skin-tone variants · recent · custom emoji set · keyboard nav · category jumper |
| GIFPicker | Tenor/Giphy search · grid · loading · accessibility (alt text) |
| StickerPicker | Per-pack browse · favorites · categorize |
| ReactionPicker | Quick picker (top-N) · "more" expander · per-emoji count tooltip |
| ReactionBar | Emoji + count · click-to-toggle-own · users-list popover |
| LiveCursor | Per-user colored cursor · name label · trailing fade · throttle |
| PresenceIndicator | Avatar dot (online/away/busy/offline) · "X people viewing" · typing dots |
| AnnotationMarker | Pin on document/image · click to expand thread · resolve toggle · per-state styling |
| CommentThread | Top comment + replies · resolve · reopen · @mention · markdown · edit/delete |
| DiscussionThread | Forum-style · upvote · reply tree · sort options |
| ActivityFeed | Per-event row (user did X) · grouped by day · filterable · infinite scroll |
| NotificationCenter / Inbox | Inline list · unread/read · mark-all-read · per-type icon · grouping · empty state |
| TypingIndicator | "X is typing…" · debounced · multi-user |
| ReadReceipt | Per-message indicator · privacy-aware ("hide for me") |
| VoiceNote | Record + waveform preview + send · transcript optional |
| VideoCallTile | Self/peer tile · mute/cam controls · pin / spotlight · mosaic vs speaker view |

### 5.18 Workflow / multi-step / form-builder

| Component | Vectors |
|---|---|
| Wizard | Multi-step form · linear vs branching · per-step validation · save-and-resume · summary step · jump-back-to-edit |
| StepperWizard | Stepper UI + Wizard logic combined |
| FormBuilder | Drag-drop field palette → preview canvas · per-field config · conditional logic editor · layout grid · save schema · live preview |
| SchemaForm | Render form from JSON Schema / Zod / custom schema · per-type widget map · validation pipeline · array fields · conditional `if` |
| FieldArray | Add/remove rows · reorder · max items · per-row delete · empty state |
| ConditionalField | Show/hide based on other field's value · animate transition · exclude from submit when hidden |
| MultiPageForm | Section-by-section nav · per-section progress · "back to top" · errors-summary banner |
| ApprovalChain | Sequential / parallel approvers · per-step status · re-route on rejection |
| Pipeline / Stages | Sales-pipeline-style horizontal stages · drag deal between stages · per-stage list |
| ProcessTracker | Multi-stage with sub-steps · per-stage status (not-started/in-progress/blocked/done) |

### 5.19 Mobile / touch-first surfaces

| Component | Vectors |
|---|---|
| BottomSheet | Snap points · drag handle · scrollable content · backdrop tap · safe-area aware |
| ActionSheet | iOS-style: list of actions · destructive · cancel · titled |
| SwipeActions | Swipe row left/right to reveal actions · per-side actions · auto-dismiss on action |
| PullToRefresh | Drag-down threshold · spinner · async callback · resistance feel |
| LongPressMenu | Long-press triggers context menu — coordinates with §5.3 ContextMenu |
| Toast (mobile placement) | Top vs bottom; safe-area aware |
| BottomNav | 3–5 tabs · active highlight · icon + label · safe-area aware |
| TabBar (iOS-style) | Bottom or top placement · scrolling · pinned active |
| FloatingActionButton (mobile) | Single FAB or extended FAB; touch-target sized |
| StatusBarSpacer | Top safe-area filler |
| KeyboardAvoidance | Push content above software keyboard |
| DragHandle | Visual affordance for drag ("===" or rounded bar) |
| HapticFeedback hook | `navigator.vibrate(...)` wrapper |
| ShareSheet | Wrapper for `navigator.share` · OS-native share menu · fallback to in-app modal |

### 5.20 App shell / page frames

| Component | Vectors |
|---|---|
| AppShell | Header / Sidebar / Main / Aside / Footer slots · responsive collapse · sidebar drawer on mobile · keyboard skip-links · landmark roles |
| AppBar / TopBar | Title · nav links · actions · search · avatar menu · sticky · transparent-on-scroll variant |
| TitleBar | Window-style: traffic lights · minimize/maximize/close · drag region |
| Sidebar / NavSection | Collapsible · pinned · resizable · multi-level · active route · scroll-restore · "expand on hover" mode |
| NavigationRail | Vertical icon strip (MD3) |
| BreadcrumbBar | Path-style · responsive truncate · current-page indicator |
| PageHeader | Title · description · breadcrumb · action buttons · tabs slot |
| PageFooter | Site footer · multi-column · social icons · newsletter · copyright |
| BackToTopButton | Appears after scroll threshold · smooth scroll · keyboard-accessible |
| ScrollSpy | Highlight active anchor in TOC as user scrolls |
| TableOfContents | Per-heading anchor list · current-section highlight · collapsible · sticky |
| AnchorLinkList | Sibling list of anchors with "→" indicator |
| RouteAwareNav | Highlights current route · nested route awareness |
| WindowChrome | Custom title bar in PWA (Window Controls Overlay API) |
| SafeAreaProvider | iOS safe-area inset CSS vars |
| DesktopFrame | Mac/Win desktop-app frame with title bar + traffic lights (Tauri/Electron-style) |

### 5.21 Onboarding / empty / error states

| Component | Vectors |
|---|---|
| Tour / Walkthrough | Step queue · spotlight · skip · don't-show-again |
| SpotlightOverlay | Cutout around target · backdrop · arrow + tooltip |
| HintCard | Single tip card · dismissible · "Got it" |
| OnboardingChecklist | Per-task progress · completed strikethrough · dismiss-when-100% · expandable |
| WelcomeModal / WelcomeBanner | First-run greeter · "What's new" cards |
| FeatureCallout | Highlight a single feature with badge ("New") + tooltip |
| WhatsNewModal | Versioned changelog viewer |
| ConfirmDialog (destructive) | Pre-built `"Delete account?"` flow w/ type-to-confirm option |
| InlineConfirm | Confirm without modal — replace button with "Are you sure? Yes/No" |
| UndoBar | Snackbar with "Undo" — common after destructive delete |
| EmptyState (variants) | First-time · no-results · all-done · all-clear · error · per-context illustrations |
| ErrorState | 404 / 500 / network / permission — illustrated · retry CTA |
| OfflineBanner | Top of viewport · network-status integrated |
| MaintenanceBanner | Scheduled-downtime warning |
| ProgressGate | "Loading important data" before reveal |
| TrashView | Soft-deleted items · restore / permanent-delete |
| VersionHistory | Per-version row · diff button · restore-to button |
| ChecklistGate | "Complete N tasks before continuing" — blocking |

### 5.22 Marketing / landing-page

| Component | Vectors |
|---|---|
| HeroSection | Title · subtitle · CTA buttons · media (image / video / illustration) · variants (centered / split / overlay) |
| FeatureGrid | 3 / 4 column feature cards · icon + title + description |
| BentoGrid | Apple-style asymmetric tile grid · responsive |
| PricingTable | Per-tier card · features list · "Most popular" highlight · monthly/yearly toggle · per-tier CTA |
| ComparisonTable | Feature-by-product matrix · ✓ / × cells · sticky header · responsive (collapse to per-product cards) |
| TestimonialCard | Quote · author · role · company · avatar |
| TestimonialCarousel | Carousel + TestimonialCard |
| LogoCloud | Grid of customer logos · grayscale-on-default · color-on-hover |
| TeamSection | Member cards · social links · bio |
| FAQ | Accordion of question/answer pairs · search · "Was this helpful?" |
| CallToAction (block) | Banner-style block · gradient bg · CTA + dismiss |
| NewsletterForm | Email input + subscribe · success state · GDPR consent checkbox |
| CookieBanner | Bottom-sticky · accept / reject / customize · regional variant |
| CookiePreferences | Per-category toggle · save · reject all |
| SocialProof | "X happy customers" · live counter · review aggregator (4.8 ★) |
| CountUp | Animated number on scroll-into-view |
| StatGrid | KPI cards row (vs Stat single — already at L4) |
| Roadmap | Timeline of upcoming features · status (planned / in-progress / shipped) |
| Changelog | Version-grouped release notes |
| BlogList / BlogPost | Card-style index · article-shaped post |
| AuthorByline | Photo · name · date · reading time · share |
| ShareButtons | Twitter/Mastodon/LinkedIn/copy-link · native Web Share fallback |

### 5.23 Settings / admin patterns

| Component | Vectors |
|---|---|
| SettingsPage | Side-nav + per-section forms · search settings · "Save / Discard" sticky bar |
| SettingsSection | Title + description + form rows · per-row save vs section-save |
| PreferencesPanel | Live preview pane (e.g., theme) · revert button |
| PermissionsMatrix | Roles × permissions checkbox grid · row/col select-all · custom-role create |
| RoleSelector | Predefined roles · custom permissions composer |
| InviteByEmail | Multi-email input (split on comma/space) · per-email role · resend · revoke |
| TeamMemberList | Avatar + name + role + status · per-member actions menu |
| AccountSwitcher | Multi-tenant: org dropdown · per-org avatar · "Add another" · workspace icons |
| BillingSummary | Plan card · usage meters · upgrade CTA · invoices table · payment methods · cancel-flow |
| UsageMeter | Per-resource bar · soft/hard limits · upgrade prompt at threshold |
| APIKeyManager | Create / revoke · per-key permissions · last-used · "reveal once" pattern |
| SecretInput | Initially masked · "click to reveal" once · copy-to-clipboard · regenerate |
| AuditLog | Per-event row · actor · action · target · diff · filter by date/user/action |
| DataRetention | Per-class retention slider · purge schedule preview |
| FeatureFlagToggle | Per-flag switch · scope (all/percentage/per-user) · history |
| WebhookManager | Per-hook URL · events subscription · secret · last-delivery status |
| IntegrationCard | Per-integration card · connect/disconnect · last-sync · scopes |
| OAuthAppList | App name + scopes · revoke |
| AuthorizedDeviceList | Per-device row · last-active · revoke session |
| TwoFactorSetup | TOTP QR · backup codes · WebAuthn passkey enroll |

### 5.24 Specialty inputs (beyond §5.1)

| Component | Vectors |
|---|---|
| AddressForm | Country picker → swaps state/zip-code field config · postal-code format per country · region/state dropdown |
| AddressAutocomplete | Geocoding API (Google Places / Mapbox) · suggestion list · selected-address fields fill |
| CreditCardInput | (Stripe Elements-style): number with auto-format `XXXX XXXX XXXX XXXX` · brand detection (Visa/MC/AmEx) · cvv · expiry · postal · iframe-isolated for PCI |
| BankAccountInput / IBANInput | IBAN format per country · checksum validation · BIC/SWIFT lookup |
| RoutingNumberInput | US ABA format · checksum |
| TaxIDInput | Per-country format (US EIN, EU VAT, GB UTR) · validation |
| PhoneInput (intl) | Country code dropdown w/ flags · libphonenumber for format/validate · E.164 emit |
| GeolocationPicker | Map embed · marker drag · "Use my location" · address sync |
| GradientPicker | Color stops + position · linear/radial/conic · angle (linear) · CSS string output |
| PatternPicker | SVG-pattern library · color swap |
| FontPicker | Family list · loading states · weight/style preview · "Use your own URL" |
| IconPicker | Searchable icon grid · category filter · selection emits icon name + svg |
| EmojiPicker (form input) | (Also see §5.17) — non-chat usage |
| KeyboardShortcutPicker | Record-key UI: user presses chord, captured · conflict detection |
| ColorEyedropper button | EyeDropper API trigger |
| RegexInput | Regex with live-test sample text · syntax highlight |
| CronInput | Cron string input + human preview |
| RangeNumericSlider | Two-thumb slider for numeric range (vs date) |
| Knob / Dial | Rotational input · arc-track · keyboard arrow nudges |
| StarRating | 5-star (or N) · half-precision · keyboard arrow · clearable |
| OTPInput | (Have PinInput) — note variants for SMS OTP autofill (`autocomplete="one-time-code"`) |
| BarcodeScanner | Camera + Barcode Detection API · USB scanner pass-through · keyboard-emulated scanner support |
| CaptchaWidget | Privacy-aware: hCaptcha / Cloudflare Turnstile / Friendly Captcha / honeypot — wrappers |
| DeviceFingerprintInput | (Anti-fraud) — typically headless |
| JSONSchemaInput | Type-aware nested form for arbitrary JSON Schema |
| QueryStringInput | URL-style key=value · multi-value · type-coercion |
| BiometricButton | WebAuthn passkey trigger · per-state UX (not-registered/registered/verifying) |
| MagicLinkInput | Email + send link · sent-state · resend timer |
| InvitationCodeInput | Format-validated code · paste-friendly |
| LicenseKeyInput | Group-formatted (`XXXX-XXXX-XXXX`) · validation |
| AltTextInput | Image-paired alt-text input · placeholder reminders |
| ARIALabelInput | Authoring tool: aria-label hint with context |
| CSSColorInput | Any valid CSS color string (hex/rgb/hsl/named) · validates · normalizes |
| SizeInput | px/rem/em/% unit toggle · clamp |
| BorderRadiusInput | Per-corner unlinked · linked toggle · CSS string output |
| ShadowEditor | Per-shadow params (x/y/blur/spread/color/inset) · multi-shadow stack · CSS preview |
| TransformEditor | translate/rotate/scale/skew · matrix preview |
| EasingPicker | Cubic-bezier visual editor · presets · steps() |
| AspectRatioInput | Common presets (16:9, 4:3, 1:1) + custom |
| LanguagePicker | ISO list · native-name display · flag (with care: politically charged) |
| LocalePicker | Language + region (en-US / en-GB / pt-BR) · auto-detect option |

### 5.25 Animated / decorative

| Component | Vectors |
|---|---|
| CountUp | Animated number on mount or scroll-into-view · easing · format · pluralized suffix |
| Marquee | Horizontal/vertical scroll · pause-on-hover · seamless loop · `prefers-reduced-motion` honor |
| TickerTape | Stock-ticker style · per-symbol up/down color · auto-scroll |
| TypewriterEffect | Type one char at a time · cursor blink · loop · phrase array |
| GradientText | Text with gradient fill · animated gradient-shift |
| TextShimmer | Skeleton-style shimmer over text · color-cycling |
| AnimatedNumber | Smooth tween between values · format-aware |
| SpotlightCursor | Cursor trail w/ glow / particle |
| ParticleBackground | Canvas-based particle system · constellations · density tied to `prefers-reduced-data` |
| ParallaxLayer | Per-layer scroll-multiplier · Z-axis depth feel |
| BackgroundBeams | Animated SVG / canvas ambient |
| Confetti | Burst on success · physics fall · color array |
| Fireworks | Click-burst effect for celebrations |
| MagicMove / SharedElement | (Also in §5.7) — animate same logical element across mount points (FLIP) |
| ScrollReveal | Fade/slide-in on enter viewport · stagger children |
| Tilt | 3D card tilt on mouse position |
| Glow | Animated edge glow on focus / active |
| AnimatedBorder | Conic-gradient rotating border |
| TextScramble | Letters scramble before settling |

### 5.26 Status / monitoring / DevOps surfaces

| Component | Vectors |
|---|---|
| StatusBoard | Service grid w/ per-service health · uptime % · response-time spark · last-incident link |
| StatusPill | Single-service indicator · color + text |
| IncidentBanner | Top-of-app outage banner · severity color · ETA · link to status page |
| MaintenanceWindow | Scheduled-downtime announcement · countdown timer |
| BuildList | CI builds per commit · status (queued/running/passed/failed) · duration · re-run · log link |
| BuildLog | Streaming log · ANSI color · expandable groups · search · download |
| LogStream | Tail-style log viewer · color per level · pause/resume · filter · save |
| LogTable | Searchable log rows · per-row expand · severity filter · time-range · live tail |
| StackTraceViewer | Per-frame · file + line · "open in editor" link · collapse vendor frames · syntax highlight |
| MetricSparkline | Tiny line for single metric · last-N-min · click → full chart |
| AlertCard | Per-alert · severity · time fired · ack/resolve · runbook link |
| OnCallScheduleView | Who's on-call now · upcoming rotations · "page X" button (escalation flow lives elsewhere) |
| HealthCheckPanel | Per-check pass/fail · response time · last-check time |
| CostExplorer | Spend over time · per-service breakdown · forecast · budget alert |
| RateLimitMeter | Per-key usage vs quota · time-window bar |
| QuotaBar | Same shape, less time-bound |
| DeploymentTimeline | Per-environment deploys · rollback button · diff vs previous |
| FeatureFlagDashboard | Per-flag rollout state · audience targeting · history |
| ErrorListView | Per-exception group · count · last-seen · sample frames |
| TraceViewer | Distributed-trace span tree · timing bars · per-span tags |
| SpanDetailPanel | Single-span attributes · logs · events |

### 5.27 DX / dev-tooling surfaces

| Component | Vectors |
|---|---|
| DebugPanel | Toggleable overlay · per-tab debug surfaces · keybind to open |
| InspectorPanel | Figma-style: select element → show properties · per-property edit |
| LayersPanel | Tree of objects on canvas · visibility toggle · lock toggle · reorder via drag |
| PropertiesPanel | Per-selection form · grouped sections (Layout / Style / Effects) |
| HistoryPanel | Undo stack list · click any state to revert |
| OutlinePanel | Document/page hierarchy (vs Tree-as-data) |
| MinimapPanel | Reduced canvas overview (already in §5.12) |
| BreakpointBadge | Current Tailwind/CSS breakpoint indicator (dev-only) |
| ResponsiveModeFrame | Iframe wrapping app · resize handles · device presets (iPhone / iPad / desktop) |
| DeviceFrame | iPhone/iPad/Mac outline · for marketing screenshots or design previews |
| GridOverlay | Visual 12-col grid overlay · alignment debug |
| BaselineGrid | Vertical-rhythm overlay |
| FocusRingOverlay | Highlight current focus on every keypress (dev) |
| A11yPanel | axe-core results · per-violation jump · "highlight on page" |
| ColorContrastChecker | FG/BG → ratio + WCAG AA/AAA labels |
| ColorBlindnessSimulator | Toggle filters: protanopia / deuteranopia / tritanopia |
| ConsoleReplica | In-app console mirror · same filtering as DevTools |
| ReactDevtoolsBadge | Component-tree mini-overlay |
| StorybookFloater | Open-in-Storybook button per component (dev) |
| SourceLink | "View source" button (dev) — file:line link |
| RenderCounter | Per-component render count badge (dev) |
| StateDiff | Show prev → next state diff for store updates (dev) |
| NetworkPanel | In-app fetch/XHR log (dev) |
| StorePanel | Live-state explorer for Zustand/Jotai/Redux (dev) |
| QueryPanel | TanStack Query devtools wrapper |
| RoutePanel | Current route + matches (dev) |
| EventLog | DOM event firehose (dev) |
| PerformancePanel | LCP / INP / CLS / FPS overlays |
| EnvSwitcher | Toggle dev/staging/prod (dev) |

### 5.28 AI / chat-specific (LLM era)

| Component | Vectors |
|---|---|
| AIChatBubble | User vs assistant style · markdown · code blocks · streaming cursor · per-state (sending/streaming/done/error) |
| StreamingTextRenderer | Char-stream with typewriter cadence · auto-scroll-to-bottom · pause on user scroll |
| ToolCallCard | Display tool name + args + result · expand/collapse · per-state (running/success/error) · "view raw" |
| ChainOfThoughtToggle | "Show thinking" expand · streaming-aware |
| CitationFootnote | Numbered superscript · click → source preview |
| SourcePill | Linked source chip · favicon · title · domain |
| ReferenceList | Numbered/lettered list of cited sources |
| TokenCounter | Live count vs budget · per-message and per-conversation |
| TokenUsageBar | In/out/total · cost estimate · per-model rates |
| ModelPicker | Dropdown of models · per-model badge (fast/smart/cheap) · capability matrix |
| ParameterPanel | Temperature / top-p / max-tokens / system-prompt · per-param tooltip |
| PromptSuggestionChip | Quick-start prompts · click to insert · regenerate set |
| PromptLibrary | Browseable saved-prompt list · per-prompt edit · run · share |
| ConversationList | Past chats sidebar · search · pin · rename · delete |
| BranchPicker | Conversation branch tree · "new branch from here" · merge variants |
| RegenerateButton | "Try again" · per-message |
| FeedbackVote | 👍/👎 per assistant message · optional comment · sent to feedback API |
| AgentTrace | Step-by-step agent execution log · per-step expand · inputs/outputs · timing |
| AgentExecutionGraph | Node-based view of agent steps (composes §5.13 NodeEditor) |
| SafetyFlag | "This response was modified for safety" banner · expand for details |
| ContextWindow | Visual context window: pinned + tokens + remaining |
| KnowledgeBasePicker | Per-source toggle (web / docs / files) · per-source status |
| FileAttachInput | Drag + paste images for multimodal · per-file token-count preview |
| ImageGenPrompt | Specialized: prompt + negative-prompt + style · seed · aspect-ratio · count |
| ImageGenResult | Grid of generated images · per-image variation/upscale/edit |
| RAGSourcePanel | "From this document" cards · per-citation jump |
| InteractiveCanvas | "Live HTML/SVG preview from LLM-generated code" — iframe-isolated |
| ArtifactRenderer | Render an LLM artifact (markdown/code/html/react) — Claude.ai-style |
| CodeBlockWithRun | LLM-generated code block + "Run" button · sandbox iframe |
| MultimodalUpload | Image / audio / file → embed-as-input · per-modality preview |
| ChatHandoff | Switch from agent to human · in-thread transition card |
| AssistantHeader | Avatar + name + role + status · system-prompt summary |
| WelcomeSuggestions | Initial-state grid of starter prompts |

### 5.29 Maps & geo (sketch — companion package candidate)

(See §5.9 for the breadth note. Captured here for component-level enumeration.)

| Component | Vectors |
|---|---|
| MapView | Tile source (Mapbox / MapLibre / Leaflet) · pan/zoom · per-marker · clusters · choropleth · heatmap · navigation control · scale bar · rotation lock toggle |
| Marker | Static · clusterable · custom DOM/SVG · drag-to-update |
| MarkerCluster | Density-bucket aggregation · zoom-to-expand |
| Polyline / Polygon / Circle | Drawn shapes · style · click handlers |
| GeoJSONLayer | Render GeoJSON · per-feature style |
| HeatmapLayer | Density visualization |
| 3DTerrainLayer | DEM rendering · pitch/bearing |
| Geocoder | Search → coordinates · autocomplete · reverse geocode |
| RouteLine | A → B route · turn-by-turn · animated traversal |
| DrawingTools | Add polygon/route/circle by clicking |
| MiniMap | Inset overview |
| Legend | Per-layer color/symbol key |
| StreetViewPanel | 360° street imagery embed |
| TimeAnimatedLayer | Per-frame data over time · scrub |

### 5.30 3D / XR (sketch — out of scope for core)

| Component | Vectors |
|---|---|
| ModelViewer | Wrap `<model-viewer>` (GLB / GLTF) · pan/zoom/rotate · environment lighting · animations |
| 360Viewer | Equirectangular image · pan/zoom |
| ARButton | Trigger WebXR AR session (Quick Look / Scene Viewer) |
| VRButton | Trigger WebXR VR session |
| Three.js wrapper | Scene · camera · controls · OrbitControls / TrackballControls |
| react-three-fiber wrapper | Declarative Three.js binding |
| GaussianSplatViewer | Modern photogrammetry format |
| PointCloudViewer | LiDAR scan visualizer |

### 5.31 Educational / quiz / e-learning

| Component | Vectors |
|---|---|
| QuizQuestion | Single-question card · multiple-choice / multi-select / fill-blank / drag-match / order |
| QuizProgress | Per-question dot row · current highlight · completed checkmark |
| AnswerExplanation | Reveal-after-answer · correct/incorrect color · "why?" expand |
| FlashCard | Front / back flip · keyboard arrow · spaced-repetition status |
| FlashCardDeck | Carousel + progress + shuffle |
| MatchingPairs | Drag connect lines between two columns |
| OrderingQuiz | Drag to reorder items |
| HotspotImage | Click-on-image quiz · per-region answer |
| TimedQuiz | Countdown timer + auto-submit on expiry |
| LeaderBoard | Score table · current-user highlight · paginated |
| BadgeAchievement | Unlocked badge w/ animation |
| ProgressCertificate | Course completion certificate (printable) |
| LessonReader | Page-by-page content + nav · mark-complete · resume |

### 5.32 Commerce-specific

| Component | Vectors |
|---|---|
| ProductCard | Image · title · price · rating · CTA |
| ProductGrid | Responsive grid · skeleton · infinite scroll |
| PriceTag | Currency-formatted · per-strikethrough sale display · per-region tax inclusion |
| StarRatingDisplay | Aggregate ★★★★☆ · count · click-to-jump-to-reviews |
| ReviewList | Per-review · helpful votes · photos · verified-purchase badge |
| AddToCartButton | Loading + success transitions · stock-check · animation to cart icon |
| CartSummary | Line-items · subtotal · shipping · tax · total |
| CartDrawer | Slide-in mini-cart · per-line edit · checkout CTA |
| Checkout (multi-step) | Wizard: Address → Shipping → Payment → Review |
| OrderTracker | Status timeline · ETA · carrier integration · "where's my order?" |
| WishlistButton | Heart toggle · counter · routing-aware |
| CompareTray | Bottom-pinned compare bar · max items · clear |
| ProductGallery | Main image + thumbnail strip · zoom-on-hover · pinch-zoom |
| VariantPicker | Color swatch + size dropdown · stock-aware · auto-select-first-available |
| SizeChart | Modal table · per-region (US/UK/EU) toggle · "find your size" helper |
| StockBadge | "Only 3 left" · "In stock" · "Pre-order" |
| ShippingEstimator | ZIP/postcode + estimated delivery date |
| CouponInput | Apply / remove · per-code state (valid/expired/min-order) |
| RecentlyViewed | Horizontal scroll · per-product mini-card |
| Recommendations | "Customers also bought" carousel · personalization-aware |
| TrustBadges | SSL/return-policy/secure-checkout icons row |

### 5.33 Auth / identity flows

| Component | Vectors |
|---|---|
| SignInForm | Email + password · forgot-password link · social-sign-in row · "remember me" |
| SignUpForm | Email + password (+ confirm) · password-strength · terms-checkbox · CAPTCHA |
| SocialSignInRow | Per-provider button (Google/Apple/GitHub/etc.) · branded · privacy-aware |
| MagicLinkSentState | "Check your inbox" confirmation · resend timer |
| OTPVerify | (Have PinInput) — full UX with timer + resend |
| TOTPSetup | QR + manual code · "I've set this up" verify |
| PasskeyEnroll | WebAuthn enroll button · per-state UX |
| PasskeyLogin | Conditional UI (browser autocomplete) · button-fallback |
| ResetPasswordForm | New password + confirm · meet-policy hints |
| ChangePasswordForm | Current + new + confirm |
| EmailVerifyState | Pending/verified/expired state UX |
| ConsentForm | Per-scope checkboxes · highlight required · accept-all |
| LogoutConfirm | "Are you sure you want to sign out?" |
| SessionList | Active sessions · per-device · revoke |
| AccountDeleteFlow | Multi-step destructive flow · type-to-confirm · cooldown |

### 5.34 Privacy / consent / legal

| Component | Vectors |
|---|---|
| CookieBanner / CookiePreferences | (Also in §5.22) |
| GDPRRequestForm | Data-export / data-delete / opt-out request · status tracking |
| ConsentManager | Per-purpose toggles · "save preferences" · audit trail |
| TrackingOptOut | "Do not track" preference UI |
| LegalAcceptanceCheckbox | TOS / Privacy / age-gate · per-version log |
| AgeGate | Birthdate input · per-region rules |
| RegionGate | Geo-restriction message · per-region routing |

### 5.35 Aggregate component-list summary (cross-section)

> A flat enumerable list of every distinct component name surfaced in §5.1–§5.34. Used as the seed for the *standardize-each-component* pass.

(Generated lazily; expect this list to grow as later sections add. Curate during the analyze-and-spec phase.)

**Inputs (§5.1, §5.24)**: TextField · NumberField · CurrencyInput · PercentInput · MaskedInput · PinInput · OTPInput · PhoneInput · EmailInput · URLInput · TelInput · PasswordInput · SearchField · Textarea · NativeSelect · Select · MultiSelect · Combobox · Listbox · Radio · Checkbox · Switch · Slider · RangeNumericSlider · AngleSlider · Knob · ColorPicker · ColorSwatch · ColorField · ColorSlider · ColorArea · ColorWheel · ColorSwatchPicker · ColorEyedropper · DatePicker · TimePicker · DateRangePicker · Calendar · DateField · TimeField · RangeCalendar · DurationInput · TimezonePicker · RecurrenceEditor · CronInput · RegexInput · FileUpload · FilePicker · Rating / StarRating · TagsInput · Mentions · RichTextEditor · CodeEditor · MarkdownEditor · JSONEditor · YAMLEditor · TomlEditor · DiffViewer · ThreeWayMerge · FormulaEditor · EquationEditor · QueryEditor · MarkdownTableEditor · Outliner · WhitespaceRevealer · SignaturePad · DrawingCanvas · BarcodeScanner · CaptchaWidget · GeolocationPicker · GradientPicker · PatternPicker · FontPicker · IconPicker · EmojiPicker · GIFPicker · StickerPicker · ReactionPicker · KeyboardShortcutPicker · AddressForm · AddressAutocomplete · CreditCardInput · BankAccountInput / IBANInput · RoutingNumberInput · TaxIDInput · BiometricButton · MagicLinkInput · InvitationCodeInput · LicenseKeyInput · AltTextInput · ARIALabelInput · CSSColorInput · SizeInput · BorderRadiusInput · ShadowEditor · TransformEditor · EasingPicker · AspectRatioInput · LanguagePicker · LocalePicker · JSONSchemaInput · QueryStringInput · SecretInput · APIKeyManager input · DeviceFingerprintInput · Editable

**Display (§5.2)**: Heading · Text · Code · Kbd · Image · Avatar · AvatarGroup · Badge · Tag · Separator · Mark · Quote · Card · NotificationDot · CountBadge · Status · KeyboardShortcut · DescriptionList · InfoRow · BadgeOverlay · SectionHeader · Highlight · Tooltip · HoverCard · Stat · StatGrid · Snippet · EmptyState · List · Timeline · Tree · Sparkline · QRCode · MeterBar · TrendIndicator · ProgressCircle · ProgressBar · Skeleton · Spinner · TagCloud · WordCloud · PersonCard

**Navigation (§5.3, §5.20)**: Breadcrumb · Pagination · NavItem · Menu · DropdownMenu · ContextMenu · Menubar · NavigationMenu · Tabs · Sidebar · NavSection · NavigationRail · BottomNav · TabBar · CommandPalette · BackToTopButton · ScrollSpy · TableOfContents · AnchorLinkList · BreadcrumbBar · PageHeader · PageFooter · TitleBar · WindowChrome · DesktopFrame · AppShell · AppBar / TopBar · TabbedHeader · RouteAwareNav · Anchor / Link

**Feedback (§5.4)**: Alert · AlertSimple · Banner · BannerSimple · Toast · ToastSimple · Toaster · Callout · LoadingState · LoadingOverlay · InlineSpinner · ProgressSteps · StatusIndicator · Modal / Dialog · AlertDialog · Drawer · BottomSheet · ActionSheet · ErrorBoundary · OfflineBanner · MaintenanceBanner · IncidentBanner · UndoBar · ConfirmDialog · InlineConfirm · ProgressGate

**Layout (§5.5, §5.20)**: Box · Stack · HStack · VStack · Cluster · Inline · Grid · Flex · Container · Center · Spacer · Divider · AspectRatio · ScrollArea · ResizablePanels · Frame · TwoColumn · Sticky / Affix · Masonry · BentoGrid · OverflowList · SafeAreaProvider

**Data (§5.6, §5.14)**: Table · DataTable · DataGrid · Spreadsheet · PivotTable · TreeGrid · QueryBuilder · FilterPillBar · FacetedSearch · GroupBySummary · ColumnChooser · SavedView · Calendar (event) · ScheduleView · AvailabilityMatrix · BookingSlots · Kanban · Carousel · MediaCarousel · Gallery / Lightbox · TreeView

**Charts/Diagrams (§5.8, §5.13)**: Chart · LineChart · BarChart · PieChart · DonutChart · RadarChart · ScatterChart · BubbleChart · Heatmap · Heatmap (calendar) · Heatmap (matrix) · Sankey · TreeMap · Sunburst · Funnel · Gauge · Candlestick · BoxPlot · NetworkGraph · ScatterMatrix · ParallelCoordinates · ChordDiagram · OrgChart · MindMap · DecisionTree · StateMachineViz · FamilyTree · NodeEditor · FlowchartEditor · EventTimeline · Gantt · Sparkline · ChromaSpectrum

**Visual / canvas (§5.12)**: Whiteboard · InfiniteCanvas · ZoomPanContainer · Minimap · ImageAnnotator · ImageEditor · ImageCropper · BeforeAfterSlider · StickyNote · ShapeLibrary

**Document & media (§5.16)**: PDFViewer · PDFAnnotator · DocViewer · EpubReader · VideoPlayer · AudioPlayer · AudioWaveform · LiveStreamPlayer · VTTCaptions · SubtitleEditor · ImageGallery / Lightbox

**Communication / collab (§5.17)**: ChatList · ChatComposer · MessageList · ChatBubble · ThreadView · CommentThread · DiscussionThread · Mentions · EmojiPicker · GIFPicker · StickerPicker · ReactionPicker · ReactionBar · LiveCursor · PresenceIndicator · AnnotationMarker · ActivityFeed · NotificationCenter · TypingIndicator · ReadReceipt · VoiceNote · VideoCallTile · ShareSheet

**Workflow (§5.18)**: Wizard · Stepper · StepperWizard · FormBuilder · SchemaForm · FieldArray · ConditionalField · MultiPageForm · ApprovalChain · Pipeline / Stages · ProcessTracker

**Mobile (§5.19)**: BottomSheet · ActionSheet · SwipeActions · PullToRefresh · LongPressMenu · BottomNav · TabBar · FAB · DragHandle · KeyboardAvoidance · HapticFeedback hook · ShareSheet · StatusBarSpacer

**Onboarding / states (§5.21)**: Tour · SpotlightOverlay · HintCard · OnboardingChecklist · WelcomeModal · WelcomeBanner · FeatureCallout · WhatsNewModal · ConfirmDialog · InlineConfirm · UndoBar · EmptyState · ErrorState · OfflineBanner · MaintenanceBanner · ProgressGate · TrashView · VersionHistory · ChecklistGate

**Marketing / landing (§5.22)**: HeroSection · FeatureGrid · BentoGrid · PricingTable · ComparisonTable · TestimonialCard · TestimonialCarousel · LogoCloud · TeamSection · FAQ · CallToAction · NewsletterForm · CookieBanner · CookiePreferences · SocialProof · CountUp · StatGrid · Roadmap · Changelog · BlogList · BlogPost · AuthorByline · ShareButtons

**Settings / admin (§5.23, §5.33)**: SettingsPage · SettingsSection · PreferencesPanel · PermissionsMatrix · RoleSelector · InviteByEmail · TeamMemberList · AccountSwitcher · BillingSummary · UsageMeter · APIKeyManager · SecretInput · AuditLog · DataRetention · FeatureFlagToggle · WebhookManager · IntegrationCard · OAuthAppList · AuthorizedDeviceList · TwoFactorSetup · SessionList · ConsentForm · LegalAcceptanceCheckbox · AgeGate · RegionGate · GDPRRequestForm · ConsentManager · TrackingOptOut · SignInForm · SignUpForm · SocialSignInRow · MagicLinkSentState · OTPVerify · TOTPSetup · PasskeyEnroll · PasskeyLogin · ResetPasswordForm · ChangePasswordForm · EmailVerifyState · LogoutConfirm · AccountDeleteFlow

**Animated / decorative (§5.25)**: CountUp · Marquee · TickerTape · TypewriterEffect · GradientText · TextShimmer · AnimatedNumber · SpotlightCursor · ParticleBackground · ParallaxLayer · BackgroundBeams · Confetti · Fireworks · MagicMove / SharedElement · ScrollReveal · Tilt · Glow · AnimatedBorder · TextScramble

**Status / DevOps (§5.26)**: StatusBoard · StatusPill · IncidentBanner · MaintenanceWindow · BuildList · BuildLog · LogStream · LogTable · StackTraceViewer · MetricSparkline · AlertCard · OnCallScheduleView · HealthCheckPanel · CostExplorer · RateLimitMeter · QuotaBar · DeploymentTimeline · FeatureFlagDashboard · ErrorListView · TraceViewer · SpanDetailPanel

**DX (§5.27)**: DebugPanel · InspectorPanel · LayersPanel · PropertiesPanel · HistoryPanel · OutlinePanel · MinimapPanel · BreakpointBadge · ResponsiveModeFrame · DeviceFrame · GridOverlay · BaselineGrid · FocusRingOverlay · A11yPanel · ColorContrastChecker · ColorBlindnessSimulator · ConsoleReplica · ReactDevtoolsBadge · StorybookFloater · SourceLink · RenderCounter · StateDiff · NetworkPanel · StorePanel · QueryPanel · RoutePanel · EventLog · PerformancePanel · EnvSwitcher

**AI / chat (§5.28)**: AIChatBubble · StreamingTextRenderer · ToolCallCard · ChainOfThoughtToggle · CitationFootnote · SourcePill · ReferenceList · TokenCounter · TokenUsageBar · ModelPicker · ParameterPanel · PromptSuggestionChip · PromptLibrary · ConversationList · BranchPicker · RegenerateButton · FeedbackVote · AgentTrace · AgentExecutionGraph · SafetyFlag · ContextWindow · KnowledgeBasePicker · FileAttachInput · ImageGenPrompt · ImageGenResult · RAGSourcePanel · InteractiveCanvas · ArtifactRenderer · CodeBlockWithRun · MultimodalUpload · ChatHandoff · AssistantHeader · WelcomeSuggestions

**Maps / 3D (§5.29, §5.30)**: MapView · Marker · MarkerCluster · Polyline · Polygon · Circle · GeoJSONLayer · HeatmapLayer · 3DTerrainLayer · Geocoder · RouteLine · DrawingTools · Legend · StreetViewPanel · TimeAnimatedLayer · ModelViewer · 360Viewer · ARButton · VRButton · GaussianSplatViewer · PointCloudViewer

**Education (§5.31)**: QuizQuestion · QuizProgress · AnswerExplanation · FlashCard · FlashCardDeck · MatchingPairs · OrderingQuiz · HotspotImage · TimedQuiz · LeaderBoard · BadgeAchievement · ProgressCertificate · LessonReader

**Commerce (§5.32)**: ProductCard · ProductGrid · PriceTag · StarRatingDisplay · ReviewList · AddToCartButton · CartSummary · CartDrawer · Checkout · OrderTracker · WishlistButton · CompareTray · ProductGallery · VariantPicker · SizeChart · StockBadge · ShippingEstimator · CouponInput · RecentlyViewed · Recommendations · TrustBadges

> **Component count from this enumeration: ~340.** This is the full search-space the library will reckon with — most ship as core, several land in companion packages (charts, advanced grid, editor, calendar, maps, 3D), some as patterns (compositions of existing primitives) rather than dedicated exports.

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

## 9. React / client-side ecosystem

What's available in the React orbit that an UI lib consumer might combine with `@wow-two-beta/ui`. Verdicts on adoption live in `targets.md`.

### 9.1 React 19 features

Native primitives that change what UI libs need to ship:

| Feature | What it does | Implication for UI lib |
|---|---|---|
| `use(promise)` | Read promises in render — pairs with Suspense | Async components don't need bespoke loading hooks; `<Suspense>` at boundary suffices |
| `useOptimistic(state, reducer)` | Optimistic state during pending mutation | Form/list optimistic updates without external state lib |
| `useFormStatus()` | Read parent `<form>`'s pending state | Submit button knows it's submitting without prop-drilling |
| `useActionState(action, initial)` | Action-based form state w/ pending + error | Form root can be lighter — React owns the state machine |
| `<form action={fn}>` | Server actions or local actions | UI primitives wrap `<form>` and forward `action` |
| `ref` as prop | No `forwardRef()` boilerplate | All component signatures simplify |
| Document metadata in render | `<title>`, `<meta>`, `<link>` hoist to `<head>` | Not directly UI-lib facing but RSC story relies on it |
| Stylesheet preloading | `<link rel="stylesheet" precedence="..."/>` orders + dedupes | UI lib can co-locate stylesheets without stomping consumer order |
| Resource preloading | `preload` / `preinit` / `prefetchDNS` / `preconnect` from `react-dom` | Hover-prefetch routes from Menu items |
| Async transitions | `startTransition(async () => …)` | Non-urgent updates async without separate state |
| Improved Suspense | Sibling pre-warming (siblings of suspended branch render eagerly) | Lazy Modal content can render in background before open |
| Context as hook | `use(MyContext)` works conditionally | Read context inside `if`/loops |
| Hydration error diagnostics | Diff-based, more readable | Dev-only |

**React Compiler** (formerly React Forget) — adjacent: auto-memoization, omits manual `memo`/`useMemo`/`useCallback`. Opt-in via Babel plugin; experimental but nearing stable. UI libs relying on stable identity for renders need to verify compatibility.

### 9.2 React 18 carryover (still relevant)

| Feature | Notes |
|---|---|
| `useId()` | Stable cross-render IDs (SSR-safe). UI lib uses for ARIA `aria-labelledby` / `aria-describedby` linkage |
| `useTransition()` | Mark non-urgent updates; pairs with `useDeferredValue` |
| `useDeferredValue()` | Debounce-by-render for expensive reads |
| `useSyncExternalStore()` | Subscribe to external stores (Zustand/Redux) safely under concurrent rendering |
| `Suspense` | Code-splitting + data fetching boundaries |
| `<StrictMode>` | Dev-only double-invocation to catch impurities |
| Concurrent rendering | Yields to browser; interruptible commits |
| Automatic batching | All state updates batched, including in promises/timeouts |

### 9.3 React patterns & idioms

| Pattern | Shape | Strength | Trade-off |
|---|---|---|---|
| Compound components | `<Tabs><Tabs.List/><Tabs.Trigger/><Tabs.Content/></Tabs>` | Discoverable; composable | Implicit context coupling |
| Slot / `asChild` | `<Tooltip.Trigger asChild><MyButton/></Tooltip.Trigger>` | No DOM wrapper; props merge onto child | One child only; merge rules subtle |
| Polymorphic `as` | `<Box as="a" href="...">` | Single component, multiple targets | TS complexity |
| Render props | `<Listbox>{({ selected }) => …}</Listbox>` | Maximum flexibility | Verbose; nesting hell |
| Hook factories | `const { isOpen, getTriggerProps, getContentProps } = useDisclosure()` | DIY assembly, full control | Consumer reassembles; Headless UI / Aria style |
| Provider + Hook | `<ThemeProvider>` + `useTheme()` | Implicit DI | Context cost for high-frequency reads |
| Headless component | All behavior + a11y + state, no styles | Pure-style override | Two libs to wire (behavior + style) |
| Controlled prop pair | `value` + `onChange` (controlled), `defaultValue` (uncontrolled) | Standard React contract | Both modes must work |
| Imperative handle | `useImperativeHandle(ref, () => ({ focus, scrollTo }))` | Escape hatch | Must justify; prefer declarative |
| Forwarded refs | `forwardRef` (legacy) → `ref` as prop (R19) | Refs reach DOM | One-deep only by default |
| Render-as-children-fn | `<List items={items}>{(item) => <Row {...item}/>}</List>` | Iterable customization | vs `renderItem` prop — pick one convention |
| Inverted control | `<Form>{({ values, errors }) => …}</Form>` | Consumer drives layout | Hard to wire validation |
| Server / Client split (RSC) | `"use client"` boundary | Server-only data fetch + auth | Bundler/host complexity |
| Error boundary | Class component or `react-error-boundary` lib | Catch render errors | Doesn't catch async — pair w/ Suspense |
| Suspense boundary | `<Suspense fallback>` | Catches thrown promises | Throw-promise = magic |
| Higher-order components | `withRouter(Component)` | Compose behaviors | Largely superseded by hooks |

### 9.4 Rendering strategies

| Strategy | Where it runs | Output | Trade-off |
|---|---|---|---|
| **CSR (Client-Side Rendering)** | Browser only | Empty shell + JS hydrates | Slow first paint; simplest mental model. **Our target.** |
| **SSR (Server-Side Rendering)** | Per-request server | Full HTML | TTFB cost; needs server |
| **SSG (Static Site Generation)** | Build time | Pre-rendered HTML files | Stale data; fastest |
| **ISR (Incremental Static Regeneration)** | Build + revalidate on demand | HTML + revalidation | Next-specific; cache-tuned |
| **Streaming SSR** | Server, chunked | HTML in stages via `Suspense` | Improves TTFB+TTI; needs streaming-capable host |
| **RSC (React Server Components)** | Server, never sent to client | Serialized component tree (RSC payload) + client islands | Bundler-coupled; `"use client"` boundaries |
| **Islands** | Mixed: static HTML + selective client hydration | HTML + small JS islands | Astro / Fresh / Marko model |
| **Resumability** | Server outputs serialized state; client *resumes* without hydration | Almost-zero JS at startup | Qwik model; novel mental shift |
| **Edge SSR** | Server at edge POP | Same as SSR but geo-distributed | Smaller compute envelope |
| **Pre-rendering + CSR hydrate** | Build + browser | "JAMstack" classic | Mostly superseded by RSC/Islands |

### 9.5 Hydration strategies

| Strategy | Notes |
|---|---|
| **Full hydration** | Default React — every component re-runs to attach handlers |
| **Partial hydration** | Only some trees hydrate (Astro, Marko islands) |
| **Progressive hydration** | Hydrate in priority order (above-fold first) |
| **Selective hydration** | React 18 — Suspense boundaries hydrate independently, can be interrupted by user input |
| **Lazy hydration** | Hydrate on visibility / interaction (Astro `client:visible`, `client:idle`) |
| **No hydration (resumability)** | Qwik — serialize state instead of re-running |
| **Client-only** | `<NoSSR>` — skip server render, render only on client |
| **Streaming hydration** | Server streams HTML; client hydrates as chunks arrive |

Common bugs:
- **Hydration mismatch** — server HTML differs from client first render (theme class, locale, time-now, random IDs). React 19 has better diagnostics
- **Theme flash (FART — Flash of Wrong Theme)** — mitigate w/ inline pre-paint script setting `<html data-theme>`
- **Locale flash** — same idea for `dir` / `lang`
- **Layout shift (CLS)** — fonts loading after first paint

### 9.6 State management

#### 9.6.1 Paradigms

| Paradigm | How updates work | Examples |
|---|---|---|
| **Imperative reducer** | Dispatch action → reducer returns new state | Redux, useReducer |
| **Imperative store** | `store.set(...)` mutates | Zustand |
| **Atoms** | Smallest unit of state, derived via selectors | Recoil, Jotai, Nanostores |
| **Proxies / mutable** | Direct mutation, library tracks | Valtio, MobX |
| **Signals** | Value that auto-tracks reads in computations | Solid, Preact Signals, TC39 Signals proposal |
| **FRP (events + stores)** | Streams transform into state | Effector, RxJS-based |
| **State machines** | Statechart with finite states + transitions | XState, Robot, Stately |
| **CQRS / Event sourcing** | Commands + events; state = fold of events | Effect-ts, custom |
| **Persistence-first** | LocalStorage / IndexedDB-backed | Yjs (CRDT), Replicache, RxDB |

#### 9.6.2 Libs (React)

| Lib | Model | Bundle | Notes |
|---|---|---|---|
| useState / useReducer | Built-in | 0 | Default for local state |
| useContext | Built-in | 0 | Implicit DI; cost per consumer on every change |
| Zustand | Hook + store | ~1 KB | Most popular external; minimal API |
| Jotai | Atoms | ~3 KB | Recoil successor; granular updates |
| Valtio | Proxy mutation | ~3 KB | Mutable feel; async-aware |
| Redux Toolkit (RTK) | Redux + slices | ~12 KB | Enterprise; stable patterns |
| RTK Query | Data layer on RTK | + | Auto-generated caching hooks |
| MobX | Observable + reactive | ~16 KB | OOP-friendly; decorator-style |
| React Tracked / use-context-selector | Selector-based context | ~1 KB | Avoids context cost |
| Preact Signals (`@preact/signals-react`) | Fine-grained signals | ~3 KB | Auto-track in render |
| TC39 Signals proposal polyfill | Future-native signals | TBD | Stage 1, evolving |
| Effector | Effects + stores + events | ~10 KB | FRP-style |
| Nanostores | Tiny atoms | ~300 B | Astro-friendly, framework-agnostic |
| XState | State machines / charts | ~15 KB | Complex flows, visualizable |
| Robot / Stately | State machines (lighter) | ~2 KB | Smaller alt to XState |
| Hookstate | Plugin-based | ~3 KB | Niche |
| Pullstate | Hook stores | ~3 KB | Niche |
| Easy-peasy | Redux wrapper | — | Redux-lite |
| Recoil | Atoms (Meta) | — | Deprecated |

### 9.7 Reactivity models

| Model | Read tracking | Update propagation | Used by |
|---|---|---|---|
| **VDOM diff** | Re-render whole subtree | React reconciles | React |
| **Signals (fine-grained)** | Effect tracks reads at runtime | Only dependents re-run | Solid, Vue 3, Preact Signals |
| **Proxies** | Get/set traps | Notify proxied paths | MobX, Valtio, Vue 2 reactivity |
| **Atoms + selectors** | Subscribers register | Atoms notify on set | Recoil, Jotai |
| **Push-pull / observables** | Stream subscribe | Stream emits | RxJS, Bacon, MobX-observable |
| **Resumable serialization** | Read state directly | App resumes without hydration | Qwik |
| **Compile-time reactivity** | Transformed at build | Direct DOM updates | Svelte (compiled), Solid |

### 9.8 State machines

| Lib | Notes |
|---|---|
| **XState** | Statecharts (incl. parallel, history, hierarchical), visualizer at stately.ai |
| **Stately** | XState v5 — same authors; refined API |
| **Robot** | Lightweight FSM (~1 KB) |
| **Zag** | UI-component-focused FSMs; powers Ark UI / Park UI |
| **Effect-ts STM** | Software Transactional Memory (broader Effect lib) |
| **react-states** | Lightweight; opinionated |
| **valtio-with-machine** | Hybrid |

### 9.9 Routing

#### 9.9.1 Patterns

| Pattern | Examples |
|---|---|
| **Config-based** | React Router classic, TanStack Router |
| **File-based** | Next.js App Router, Remix, Nuxt, SvelteKit |
| **Layouts / nested routes** | Next/Remix layout files; React Router `<Outlet>` |
| **Parallel routes** | Next.js `@named` slots — render multiple independent panels |
| **Intercepting routes** | Next.js `(.)folder` — modal-style interception |
| **Type-safe params** | TanStack Router (Zod schema per route) |
| **Loaders** | Remix `loader()` / Next.js `generateStaticParams` |
| **Actions** | Remix `action()` — POST handlers per route |
| **Streaming** | Defer slow data with `<Suspense>` per loader |
| **Search-as-state** | URL search params as primary state store (TanStack) |

#### 9.9.2 Libs

| Lib | Notes |
|---|---|
| **React Router v7** | Merged with Remix; loader/action/streaming. Most popular |
| **TanStack Router** | Type-safe params, loaders, search-as-state |
| **Next.js App Router** | RSC + file-based + layouts |
| **Wouter** | ~1.5 KB minimal |
| **react-location** | Predecessor to TanStack Router (deprecated) |
| **Reach Router** | Predecessor to React Router (deprecated) |

### 9.10 Data fetching

#### 9.10.1 Patterns

| Pattern | Notes |
|---|---|
| **Cache-first** | Return cache instantly, refetch in bg | TanStack Query model |
| **Network-first** | Always hit server; fall back to cache |
| **Stale-while-revalidate** | Show stale, fetch fresh, swap | SWR, TanStack Query |
| **Optimistic update** | UI reflects mutation before server confirms; rollback on error |
| **Mutation queue** | Queue offline mutations |
| **Normalization** | Single source for entities, denormalize per query | Apollo, Relay, RTK Query, normalizr |
| **Document-cache** | Per-query cached doc, no normalization | TanStack Query default, SWR |
| **Subscription / live data** | Polling, WS, SSE, GraphQL Subscriptions, CRDT |
| **Pagination** | Offset-based, cursor-based, time-based |
| **Infinite scroll** | Cursor pagination + auto-fetch on visible-end |
| **Prefetch on hover** | Anticipate clicks |

#### 9.10.2 Libs

| Lib | Style | Bundle | Notes |
|---|---|---|---|
| **TanStack Query** | Hook + cache | ~13 KB | Most popular; framework-agnostic |
| **SWR** | Hook | ~4 KB | Vercel; simpler |
| **Apollo Client** | GraphQL + normalized | ~30 KB | Mature, opinionated |
| **urql** | GraphQL lightweight | ~7 KB | Alt to Apollo |
| **Relay** | GraphQL + Meta-grade | ~25 KB | Schema-driven, pagination conventions |
| **RTK Query** | Redux Toolkit add-on | + | Bundled with RTK |
| **tRPC** | Typed RPC over HTTP | ~10 KB | TS end-to-end types |
| **Convex** | Reactive backend + client | + | Realtime + queries |
| **Liveblocks** | Realtime presence + storage | + | Collab features |
| **Firestore / Firebase** | Realtime backend | + | Google-hosted |
| **Replicache / Rocicorp Zero** | Sync-engine | + | Offline-first |
| **PowerSync / ElectricSQL** | Postgres → SQLite sync | + | Local-first |
| **Yjs / Automerge** | CRDTs | + | Collab text |
| **PartyKit / Cloudflare Durable Objects** | Realtime infra | + | Edge sync |

### 9.11 Form patterns & libs

#### 9.11.1 Patterns

| Pattern | Notes |
|---|---|
| **Uncontrolled** | Read via `ref` + native FormData; no React state per keystroke (RHF default; performant) |
| **Controlled** | `value` + `onChange` per field; React state per stroke (Formik default; explicit) |
| **Hybrid** | Uncontrolled storage + watch when needed (RHF `useWatch`) |
| **Schema-first** | Validation derives from schema; types follow (Zod / Valibot + RHF) |
| **Imperative validation** | Per-field rules attached at registration (Formik / classic) |
| **Field array** | Add/remove/reorder w/ stable keys |
| **Multi-step / wizard** | Step state external; per-step validation |
| **Async validation** | With cancellation (AbortSignal) |
| **Cross-field validation** | Confirm-password, date-range |
| **Server errors** | Inject into field state on submit failure |
| **Auto-save** | Debounced submit; conflict UI |
| **Dirty / touched / submitted** | Status flags; navigate-away guard |
| **Server actions integration** | RSC / `useActionState` |
| **Conform pattern** | Standard Schema + native `<form>` + progressive enhancement |

#### 9.11.2 Libs

| Lib | Storage model | Schema integration | Bundle | Notes |
|---|---|---|---|---|
| **React Hook Form (RHF)** | Uncontrolled (refs) | Resolvers (Zod/Yup/Valibot/etc.) | ~9 KB | Most popular; performant |
| **TanStack Form** | Controlled, typed | Standard Schema native | ~14 KB | Modern, framework-agnostic |
| **Conform** | Hybrid (FormData first) | Standard Schema | ~5 KB | Progressive enhancement; pairs with server actions |
| **Formik** | Controlled | Yup integration | ~13 KB | Legacy popular |
| **Final Form / React Final Form** | Subscriptions | Custom | ~10 KB | Functional, low rerender |
| **Felte** | Headless | Yup/Zod | ~3 KB | Lightweight |
| **Effect Form** | Effect-ts ecosystem | Effect Schema | + | FRP-style |
| **HookForm Devtools** | RHF inspector | — | dev | Debug tool |

### 9.12 Validation libs

The **Standard Schema spec** ([standard-schema.dev](https://standard-schema.dev)) lets form libs / validation libs interop without per-library adapters. Adopted by Zod, Valibot, ArkType, etc. — pick a schema lib that conforms to ship one adapter and inherit all.

| Lib | Style | Bundle | Standard Schema | Notes |
|---|---|---|---|---|
| **Zod** | Schema-first chainable | ~13 KB (v3) / ~6 KB (v4) | ✓ | Most popular; runtime + types |
| **Valibot** | Modular fns (no chaining) | ~1 KB tree-shaken | ✓ | Modern; size-conscious |
| **ArkType** | TS-native syntax | ~10 KB | ✓ | Type-level; "if it parses, it types" |
| **Effect Schema** | Effect-ts ecosystem | + | ✓ | FRP-style |
| **Yup** | Schema-first | ~25 KB | ✓ (adapter) | Legacy with Formik |
| **Joi** | Server-side Node | ~150 KB | — | Server-leaning |
| **Superstruct** | Tiny, expression-style | ~3 KB | ✓ | Niche |
| **runtypes** | Type-checking runtime | ~3 KB | ✓ | Niche |
| **io-ts** | fp-ts / FRP | ~10 KB | ✓ | Functional |
| **TypeBox** | JSON Schema generator | ~8 KB | ✓ | Schema → types via JSON Schema |
| **myzod** | Zod alt | — | — | Mostly historical |

### 9.13 Animation libs & paradigms

#### 9.13.1 Paradigms

| Paradigm | Examples |
|---|---|
| **Declarative w/ JSX** | `<motion.div animate={{...}}/>` (Framer) |
| **Variants API** | Named animation states triggered by parent |
| **Spring physics** | Stiffness/damping/mass tunables |
| **Tween / keyframes** | Duration + easing |
| **Layout animations (FLIP)** | First-Last-Invert-Play; auto on layout change |
| **Shared element transitions** | Element morphs between mount points |
| **Gesture-driven** | Drag/swipe/pinch trigger animation |
| **Scroll-driven** | `animation-timeline: scroll()` (CSS) or IntersectionObserver |
| **Native CSS** | `@keyframes` + `transition` only |
| **WAAPI** | Web Animations API — JS-driven, GPU |
| **View Transitions API** | Native cross-DOM transitions on URL/state change |
| **Native popover transitions** | `@starting-style` for entry; `transition-behavior: allow-discrete` |

#### 9.13.2 Libs

| Lib | Bundle | Notes |
|---|---|---|
| **Framer Motion / Motion** | ~50 KB | Most popular; gestures, layout, variants |
| **Motion One** | ~5 KB | WAAPI-first lighter alt |
| **React Spring** | ~25 KB | Physics-based |
| **AutoAnimate (FormKit)** | ~3 KB | One-line drop-in for list reorder |
| **GSAP** | ~50 KB | Most powerful; commercial license required for some uses |
| **React Transition Group** | ~6 KB | Lower-level; mount/unmount transitions |
| **Theatre.js** | + | Visual editor; complex sequences |
| **Anime.js** | ~16 KB | Simple imperative |
| **Popmotion** | ~10 KB | Underlies Framer's spring math |
| **Lottie / lottie-web** | ~250 KB | After Effects → JSON → web |
| **Rive** | + | Modern Lottie alt; runtime-driven state machines for art |
| **react-flip-toolkit** | ~10 KB | FLIP-only |
| **@use-gesture/react** | ~10 KB | Gesture hooks (pairs with Spring) |

### 9.14 Drag-and-drop libs & paradigms

#### 9.14.1 Paradigms

| Paradigm | Notes |
|---|---|
| **HTML5 native** | `draggable="true"` + `dragstart`/`dragover`/`drop` — limited mobile support, no a11y |
| **Pointer-events-based** | Custom; works mobile + desktop |
| **Sensor-based** | Multiple input modes (mouse, touch, keyboard, screen reader) — dnd-kit, React Aria |
| **Transform-based** | Drag preview = CSS transform on original; cheap |
| **Clone-based** | Render a clone in a portal at pointer; original stays |
| **List-only reorder** | Specialized API for ordered lists (Framer Reorder) |
| **Cross-list / multi-bucket** | Kanban-shaped |
| **External drop** | Files from OS — File API + DataTransfer |
| **Accessible** | Live-region announce, keyboard reorder mode (move-up/down), screen-reader instructions |

#### 9.14.2 Libs

| Lib | Status | Notes |
|---|---|---|
| **dnd-kit** | Active | Modern, sensors, accessible, performant |
| **Pragmatic Drag-and-Drop** | Active | Atlassian; lighter, framework-agnostic |
| **react-beautiful-dnd** | Deprecated | Atlassian original; still widely used |
| **react-dnd** | Active | HTML5 backend; older mental model |
| **Framer Motion `Reorder`** | Active | List reorder only; simplest |
| **React Aria DnD** | Active | Best a11y; built into RAC |
| **SortableJS** | Active | Vanilla; React wrappers exist |
| **react-grid-layout** | Active | Grid-specific (dashboards) |
| **react-rnd** | Active | Resize-and-drag (floating windows) |

### 9.15 Virtualization libs & strategies

#### 9.15.1 Strategies

| Strategy | Notes |
|---|---|
| **Window** | Render only visible items + overscan; rest is virtual gap |
| **Variable height** | Measure on render or estimate + correct |
| **Fixed height** | Cheapest; index × itemHeight for offset |
| **Dynamic measurement** | ResizeObserver per item, cache heights |
| **Sticky headers** | Section heads pin at top while scrolling within section |
| **Anchor-preserving** | Keep specific row visible across data updates |
| **Bidirectional** | Virtualize both directions (2D grid) |
| **Reverse scroll** | Chat-style — anchor at bottom |
| **Animated sort** | Reorder items with FLIP under virtualization (hard) |

#### 9.15.2 Libs

| Lib | Notes |
|---|---|
| **TanStack Virtual** | Latest, framework-agnostic, hooks-only |
| **react-window** | Brian Vaughn; simple, fixed/variable height |
| **react-virtuoso** | Variable-height-friendly, table support |
| **react-virtualized** | Older, heavier predecessor of react-window |
| **AG Grid virtualization** | Built into AG Grid only |
| **MUI Data Grid virtualization** | Built into MUI X only |

### 9.16 Date / Number / Color / Currency libs

| Domain | Lib | Notes |
|---|---|---|
| Date | **date-fns** | Functional; tree-shake-friendly; most popular |
| Date | **dayjs** | Moment-like API, smaller |
| Date | **luxon** | Intl-aware, immutable |
| Date | **moment** | Legacy; not recommended for new code |
| Date | **Temporal API** | TC39 stage 3; native replacement; polyfill available |
| Date | **@internationalized/date** | React Aria; calendar systems (Hijri/Buddhist/Persian/etc.) |
| Date | **js-joda** | Java JSR-310 port |
| Date | **chrono-node** | Natural language date parser |
| Number | **Native `Intl.NumberFormat`** | Most cases |
| Number | **big.js** | Arbitrary precision decimals |
| Number | **decimal.js / decimal.js-light** | Same niche; richer |
| Number | **bignumber.js** | Same niche |
| Number | **fraction.js** | Rational numbers |
| Number | **mathjs** | Full math library |
| Color | **chroma-js** | Color manipulation, scales |
| Color | **culori** | Modern, OKLCH/OKLab support |
| Color | **colord** | Tiny (~1.7 KB), modern |
| Color | **tinycolor / tinycolor2** | Older popular |
| Color | **color** | Older popular |
| Color | **@adobe/leonardo-contrast-colors** | Adobe — accessibility-aware palette generation |
| Currency | **Native `Intl.NumberFormat({style:'currency'})`** | Most cases |
| Currency | **dinero.js** | Money objects, immutable |
| Currency | **currency.js** | Lightweight money math |
| Units | **convert-units / @sindresorhus/convert** | Unit conversion |

### 9.17 i18n libs & strategies

#### 9.17.1 Strategies

| Strategy | Notes |
|---|---|
| **Runtime lookup** | Dictionary loaded at boot; `t(key)` looks up (react-i18next) |
| **Compile-time** | Macro replaces `t(key)` w/ string literal at build (Lingui, Paraglide) |
| **ICU MessageFormat** | Standardized plural/select/ordinal (FormatJS) |
| **Gettext-style** | Source-string-as-key (legacy) |
| **Locale-chained fallback** | `en-GB → en → default` |
| **Per-route lazy load** | Load locale chunk on route enter |
| **Inline rich text** | `<Trans>` allows JSX inside translation |
| **Pseudo-localization** | Dev-mode `Ḧëłłö` to catch unwrapped strings |
| **Translation Management Systems (TMS)** | Crowdin, Lokalise, Phrase, Transifex, Tolgee, Locize |

#### 9.17.2 Libs

| Lib | Notes |
|---|---|
| **react-i18next** | Most popular; runtime + namespaces |
| **FormatJS / react-intl** | ICU MessageFormat; richest |
| **Lingui** | Compile-time macro; small runtime |
| **next-intl** | Next.js-aware |
| **Tolgee** | In-context editing |
| **Polyglot.js** (Airbnb) | Tiny runtime |
| **i18next** | Engine under react-i18next |
| **typesafe-i18n** | Type-safe keys |
| **Paraglide** (Inlang) | Compile-time, tree-shake per locale |

### 9.18 Icon libs & delivery

#### 9.18.1 Delivery patterns

| Pattern | Pros | Cons |
|---|---|---|
| **Per-icon ESM import** | Tree-shake-friendly | Import-list grows |
| **Single component + name prop** | Easy ergonomics | Can't tree-shake; full set bundled |
| **SVG sprite sheet** | One HTTP request; cache; `<use>` ref | Coloring quirks |
| **Icon font** | Universal browser support; ligatures | A11y issues; coloring; sizing precision |
| **Inline SVG (per-render)** | Color via `currentColor`; no requests | Larger HTML |
| **Iconify universal API** | 100+ icon sets; on-demand fetch | Runtime cost |
| **CSS `mask-image`** | Color via `background-color` | Older browser quirks |

#### 9.18.2 Libraries

| Lib | Style | Notes |
|---|---|---|
| **Lucide** | Outline | Default for shadcn; we use |
| **Heroicons** | Outline + solid | Tailwind team |
| **Phosphor Icons** | Multi-weight (thin/regular/bold/fill/duotone) | Versatile |
| **Tabler Icons** | Outline + filled | Free, large set |
| **Radix Icons** | Geometric | Compact set |
| **Material Symbols** | Variable font | Google MD3 |
| **Fluent UI Icons** | Outline + filled | Microsoft |
| **Ionicons** | Outline + filled | Ionic |
| **BoxIcons / Feather Icons / Octicons** | Older popular | Less active |
| **Iconify** | Aggregator (100+ sets) | On-demand fetch via API |
| **react-icons** | Aggregator (Font Awesome, etc.) | Bigger bundle |
| **Hugeicons** | Many weights | Newer |
| **Mingcute / Akar / Solar / Hugeicons** | Modern alternatives | Niche |

### 9.19 Variants / styling helpers

| Lib | Role | Notes |
|---|---|---|
| **class-variance-authority (cva)** | Variant API | Most popular Tailwind variant lib |
| **tailwind-variants** | Tailwind-aware variants | We use; cva successor |
| **clsx** | Class joiner | Tiny; conditional classes |
| **classnames** | Class joiner (older) | Functional clone |
| **tailwind-merge** | Conflict resolver | We use; resolves Tailwind conflicts |
| **Panda CSS recipes** | Vanilla Extract-style recipes | Build-time |
| **Stitches variants** | Legacy CSS-in-JS | Deprecated |
| **vanilla-extract recipes** | Type-safe runtime-zero | Used w/ vanilla-extract |
| **emotion + styled-system** | Theme-driven prop API | Older |
| **theme-ui** | Theme-driven JSX prop API | Older |

### 9.20 Utility libs

| Lib | Role | Notes |
|---|---|---|
| **immer** | Immutable mutation | `produce(state, draft => …)` |
| **nanoid** | ID generation | Tiny, URL-safe |
| **uuid** | UUIDv4/v7 | Standard |
| **ts-pattern** | Pattern matching | Exhaustive `match()` |
| **type-fest** | TS utility types | Common types lib |
| **es-toolkit** | Modern Lodash alternative | Tree-shake-friendly |
| **lodash / lodash-es / lodash-fp** | FP utils | Older popular |
| **ramda** | FP utils, currying | Functional |
| **remeda** | Modern FP utils | Lodash-style + types |
| **dot-prop** | Get/set by string path | `'a.b.c'` |
| **fast-deep-equal** | Deep equality | Tiny |
| **mitt** | Event emitter | Tiny |
| **just-*** | One-fn-per-pkg utilities | Granular |
| **fp-ts / Effect** | FP runtime | Bigger ecosystem |
| **rxjs** | Observables | FRP |
| **@total-typescript/ts-reset** | TS-default-tightening | Type quality |

### 9.21 Server-driven UI alternatives (anti-React patterns)

For completeness — UI paradigms that *don't* use React. Worth knowing because they constrain what a React UI lib has to do.

| Approach | Origin | How |
|---|---|---|
| **HTMX** | Vanilla web | Attributes (`hx-get`, `hx-swap`) drive partial server-rendered HTML swaps. Tiny client. |
| **Hotwire (Turbo + Stimulus)** | Rails / Basecamp | Turbo Frames + Streams replace HTML; Stimulus sprinkles JS |
| **Phoenix LiveView** | Elixir | WebSocket-driven server-rendered diffs |
| **Laravel Livewire** | PHP | Same idea on Laravel |
| **Inertia.js** | Stack-agnostic | Bridge for SPA-feel without API; ships server-rendered controllers + React/Vue/Svelte client |
| **Blazor Server** | .NET | Server SignalR-driven Razor renders |
| **Marko** | eBay | Streaming partial hydration |
| **Hyperview** | Native | XML-driven mobile UI |

These compete with React for "build a UI app" but make different trade-offs. UI lib design needn't accommodate them, but understanding the alternative model sharpens framing.

---

## 10. Tooling ecosystem

### 10.1 Bundlers & dev servers

| Tool | Style | Notes |
|---|---|---|
| **Vite** | Dev: ESM + esbuild; Prod: Rollup | Most popular for libs/apps |
| **esbuild** | Bundler + transpiler | Fast; underused alone |
| **swc** | Rust transpiler | Used by Vite, Next, others |
| **Rollup** | Library bundler | ESM-first; we use indirectly via tsup |
| **tsup** | Wrapper around esbuild + Rollup | We use; library-friendly |
| **unbuild** | Wrapper around Rollup | Nuxt-friendly |
| **Bun** | All-in-one: runtime + bundler + test + pkg mgr | Fast; React 19 support evolving |
| **Webpack** | Legacy bundler | Still used |
| **Turbopack** | Rust webpack successor | Next.js dev server |
| **Rspack** | Rust webpack-compatible | ByteDance |
| **Parcel** | Zero-config | Niche |
| **Farm** | Rust bundler | Newer |
| **Rolldown** | Rust Rollup successor | Vite's future bundler |
| **Snowpack** | Native ESM dev | Deprecated |

### 10.2 Test runners

| Tool | Notes |
|---|---|
| **Vitest** | Vite-aware; fastest for Vite apps; Jest-API-compatible |
| **Jest** | Most installed; older; ESM is rough |
| **Bun test** | Bun-native; fast; smaller ecosystem |
| **Mocha + Chai** | Classic; à la carte |
| **Node test runner** | Native (Node 20+) `node:test` |
| **Playwright Test** | E2E + component testing |
| **Cypress** | E2E + component testing |
| **WebdriverIO** | E2E |
| **Storybook test runner** | Runs play functions as tests |

### 10.3 Test libraries

| Tool | Layer | Notes |
|---|---|---|
| **Testing Library (React)** | Unit/integration | DOM-via-role queries; APG-aligned |
| **user-event** | Interaction | Simulates real user (focus, keypresses) |
| **MSW (Mock Service Worker)** | Network mocking | API-level stubs |
| **happy-dom / jsdom** | DOM emulation | Vitest defaults |
| **@storybook/test** | Story play assertions | Vitest-bridge |
| **@testing-library/react-hooks** | Hook unit tests | Mostly subsumed by `renderHook` |

### 10.4 Visual regression

| Tool | Notes |
|---|---|
| **Chromatic** | Storybook-native; UI flow per PR |
| **Percy** | Storybook-native; BrowserStack |
| **Playwright snapshots** | E2E + visual; self-hosted |
| **Loki** | Storybook + Docker; self-hosted |
| **Argos CI** | Modern visual review |
| **happo** | Per-component; self-hostable |
| **BackstopJS** | Standalone; older |

### 10.5 Accessibility testing

| Tool | Notes |
|---|---|
| **axe-core** | Core ruleset; integrate w/ Storybook addon, Cypress, Playwright |
| **@storybook/addon-a11y** | axe per story panel |
| **pa11y / pa11y-ci** | CLI runner |
| **Lighthouse CI** | Includes axe + perf budget |
| **Accessibility Insights** | MS desktop tool |
| **Wave** | Browser ext, in-page report |
| **NVDA / JAWS / VoiceOver** | Screen-reader smoke tests (manual) |
| **axe-playwright** | Playwright integration |

### 10.6 Linters

| Tool | Notes |
|---|---|
| **ESLint** | Standard JS/TS linter; flat config |
| **eslint-plugin-react / react-hooks / jsx-a11y** | React ecosystem rules |
| **eslint-plugin-boundaries** | Architectural layer enforcement (we use) |
| **eslint-plugin-import** | Import order/cycle |
| **typescript-eslint** | TS rules layer |
| **Biome** | All-in-one Rust linter+formatter |
| **Oxlint** | Rust ESLint-compatible (alpha-fast) |
| **dprint** | Pluggable formatter (and lint via plugins) |
| **Stylelint** | CSS lint |

### 10.7 Formatters

| Tool | Notes |
|---|---|
| **Prettier** | Most popular |
| **Biome** | All-in-one Rust |
| **dprint** | Pluggable Rust |
| **EditorConfig** | Cross-editor spacing/tab |

### 10.8 Type tooling

| Tool | Notes |
|---|---|
| **tsc** | The TypeScript compiler |
| **isolatedDeclarations** | TS 5.5+; faster decl emit (we use) |
| **type-coverage** | % of code typed |
| **typesync** | Sync `@types/*` with deps |
| **tshy** | Hybrid CJS+ESM publisher |
| **type-fest / utility-types** | Reusable utility types |
| **@total-typescript/ts-reset** | TS-default-tightening lib |
| **API Extractor (Microsoft)** | Generate API report + d.ts rollup |
| **arethetypeswrong** | Verify dual-export type correctness |

### 10.9 Storybook & catalog tools

| Tool | Notes |
|---|---|
| **Storybook 8+** | We use; Vite + addon ecosystem |
| **Ladle** | Vite-only Storybook alt; simpler |
| **Histoire** | Vue-leaning Storybook alt; works for React |
| **react-styleguidist** | Older |
| **Docz** | Older MDX-driven |

### 10.10 Documentation sites

| Tool | Notes |
|---|---|
| **Docusaurus** | Most popular for project docs |
| **Nextra** | Next.js-based MDX |
| **Vocs** | Modern, fast docs (used by Wagmi etc.) |
| **Mintlify** | Hosted commercial |
| **Starlight** | Astro-based |
| **VitePress** | Vue-flavored Vite |
| **Fumadocs** | Next.js-based, opinionated |
| **GitBook** | Hosted commercial |
| **MkDocs / Material** | Python-flavored |

### 10.11 Package managers

| Tool | Notes |
|---|---|
| **pnpm** | We use; symlinked workspace |
| **npm** | Default Node bundled |
| **yarn (Berry/v4)** | Plug'n'Play, zero-installs |
| **bun** | Faster install; pnpm-compat |
| **deno** | Rust-based; URL imports + npm: |

### 10.12 Versioning / release

| Tool | Notes |
|---|---|
| **Changesets** | Most popular monorepo versioning + changelog |
| **semantic-release** | Conventional commits → auto-publish |
| **release-please (Google)** | Conventional commits → release PR |
| **lerna / @lerna-lite** | Older monorepo |
| **np** | Wrap `npm publish` w/ checks |
| **pkg-pr-new** | Pre-release per-PR previews |

### 10.13 Monorepo tooling

| Tool | Notes |
|---|---|
| **pnpm workspaces** | We use |
| **Nx** | Cache-aware tasks; opinionated |
| **Turborepo (Vercel)** | Cache-aware tasks; lighter |
| **Rush (Microsoft)** | Enterprise scale |
| **Lerna** | Legacy |
| **Bun workspaces** | Bun-native |
| **moonrepo** | Rust-based, language-agnostic |

### 10.14 CI / CD

| Tool | Notes |
|---|---|
| **GitHub Actions** | We use |
| **GitLab CI** | Common alt |
| **CircleCI / Travis / Drone** | Older popular |
| **Buildkite** | Self-hosted runners |
| **Jenkins** | Legacy |
| **Vercel / Netlify build pipelines** | Hosted |

### 10.15 Bundle / perf analysis

| Tool | Notes |
|---|---|
| **size-limit** | CI gate for bundle size |
| **bundlejs.com** | Online bundle inspector |
| **bundlephobia.com** | Per-package size lookup |
| **Webpack Bundle Analyzer** | Treemap |
| **Rollup Plugin Visualizer** | Treemap |
| **why-did-you-render** | Render tracking |
| **React DevTools Profiler** | Built-in profiler |
| **Lighthouse CI** | Perf budget gate |
| **web-vitals** | Library to send Core Web Vitals to analytics |

### 10.16 CSS tooling

| Tool | Notes |
|---|---|
| **PostCSS** | CSS transformer ecosystem |
| **Lightning CSS (Parcel)** | Rust postcss-compatible; vendor prefixing + minify |
| **autoprefixer** | Vendor prefix postcss plugin |
| **postcss-preset-env** | Future CSS → today |
| **CSSnano** | CSS minifier |
| **PurgeCSS** | Remove unused (mostly superseded by Tailwind JIT) |
| **Tailwind v4 + `@tailwindcss/vite`** | We use |
| **UnoCSS** | Atomic CSS engine alt |

### 10.17 Static site generators (for component docs)

| Tool | Notes |
|---|---|
| **Astro** | Islands; great for docs+marketing |
| **Next.js (static export)** | Same framework as RSC apps |
| **Eleventy / 11ty** | Simple Node SSG |
| **Hugo** | Go SSG; very fast |
| **Jekyll** | Ruby SSG |
| **Gatsby** | React SSG (now stagnant) |

### 10.18 Scaffolding / generators

| Tool | Notes |
|---|---|
| **create-vite** | Vite project starter |
| **create-next-app** | Next starter |
| **plop** | Hygen-like, lightweight |
| **hygen** | Code-gen via templates |
| **scaffdog** | Markdown-driven generator |
| **degit** | Git repo cloner (no `.git`) |

---

## 11. Cross-framework UI ecosystem (beyond React)

The wow-two ecosystem is React-first, but knowing what other framework communities ship sharpens design decisions. Each framework has its own headless/styled split.

### 11.1 Vue ecosystem

| Lib | Type | Notes |
|---|---|---|
| **Vuetify** | Styled (Material) | Largest Vue lib |
| **PrimeVue** | Styled multi-theme | Component-rich |
| **Element Plus** | Styled | China-popular successor to Element UI |
| **Ant Design Vue** | Styled | Ant's Vue port |
| **Naive UI** | Styled | TS-first, modern |
| **Quasar** | Styled (cross-platform) | Vue + mobile + desktop |
| **Headless UI (Vue)** | Headless | Tailwind team, Vue port |
| **Reka UI / Radix Vue** | Headless | Radix-shaped for Vue |
| **shadcn-vue** | Hybrid | shadcn for Vue (uses Reka UI) |
| **Nuxt UI** | Styled | Nuxt-flavored |
| **Inkline / Oruga / Vuestic** | Niche | |

### 11.2 Svelte ecosystem

| Lib | Type | Notes |
|---|---|---|
| **Skeleton** | Styled (Tailwind) | Modern Svelte |
| **Bits UI** | Headless | Radix-shaped |
| **Melt UI** | Headless | Builder-pattern |
| **shadcn-svelte** | Hybrid | shadcn port |
| **Flowbite Svelte** | Styled (Tailwind) | Flowbite port |
| **Carbon Svelte** | Styled (Carbon) | IBM port |
| **Smelte / Svelte Material UI** | Styled (Material) | Niche |

### 11.3 SolidJS ecosystem

| Lib | Type | Notes |
|---|---|---|
| **Kobalte** | Headless | Radix-shaped, very accessible |
| **Hope UI** | Styled (Chakra-like) | Modern |
| **Suid** | Styled (Material) | Material port |
| **Park UI Solid** | Hybrid (Ark) | Cross-framework |
| **corvu** | Headless | Newer |
| **solid-aria** | Headless | React Aria port |

### 11.4 Angular ecosystem

| Lib | Type | Notes |
|---|---|---|
| **Angular Material** | Styled (Material) | Default |
| **PrimeNG** | Styled | Component-rich |
| **NG-ZORRO** | Styled (Ant Design) | Ant for Angular |
| **Nebular** | Styled | Akveo |
| **Clarity** | Styled | VMware |
| **Onsen UI** | Cross-platform | Hybrid mobile |
| **ngx-bootstrap** | Styled (Bootstrap) | Bootstrap port |
| **Taiga UI** | Styled | Modern |
| **Spartan UI** | Hybrid | shadcn for Angular |

### 11.5 Web Components ecosystem

| Lib | Type | Notes |
|---|---|---|
| **Lit** | Library | Smallest; Google-maintained |
| **Stencil** | Compiler | Generates standalone web components |
| **FAST (Microsoft)** | Library | Adaptive UI |
| **Adobe Spectrum Web Components** | Styled (Spectrum) | Adobe |
| **Material Web** | Styled (MD3) | Google |
| **Shoelace** | Styled | Framework-agnostic |
| **Carbon Web Components** | Styled (Carbon) | IBM |
| **Fluent UI Web Components** | Styled (Fluent) | Microsoft |
| **Vaadin** | Enterprise | Java integration |

### 11.6 Cross-platform UI

| Lib | Targets | Notes |
|---|---|---|
| **React Native + Web** | iOS, Android, Web | Native-first; bridges to Web |
| **Tamagui** | iOS, Android, Web | Compile-time optimization, single codebase |
| **NativeBase** | iOS, Android, Web | Styled |
| **RN Paper** | Native first | Material-flavored |
| **Lynx (ByteDance)** | Native + Web | New cross-platform |
| **Kuikly (Tencent)** | Multi-platform | Newer |
| **Gluestack UI** | Native + Web | Modern |
| **Flutter** | iOS, Android, Web, Desktop | Dart-based; not React |
| **.NET MAUI Hybrid** | Native + Web | Microsoft |

### 11.7 Resumability (Qwik)

Qwik avoids hydration entirely. Components serialize state on the server; the client picks up handlers lazily, on demand.

| Lib | Notes |
|---|---|
| **Qwik UI** | Headless Qwik components |
| **Qwik** | Framework |

### 11.8 Server-driven UI (anti-SPA)

Already covered in §9.21. Worth listing as alternatives:

- HTMX
- Hotwire (Turbo + Stimulus)
- Phoenix LiveView (Elixir)
- Laravel Livewire (PHP)
- Inertia.js (Stack-agnostic SPA bridge)
- Blazor Server (.NET)
- Marko (eBay)
- Hyperview (Native)

### 11.9 Other / niche

| Framework | Notes |
|---|---|
| **Preact** | React-API smaller |
| **Astro Islands** | Per-component selective hydration |
| **Marko** | Streaming partial-hydration |
| **Lit-HTML** | Lit's templating, sans components |
| **Mitosis** | One source → many framework outputs |
| **Fresh (Deno)** | Islands-based |
| **Leptos / Yew (Rust)** | WASM-first |

---

## 12. Modern CSS landscape — capabilities to leverage

CSS in 2026 has caught up with most use cases that previously required JS. UI lib design should lean into these where browser support allows.

### 12.1 Layout primitives

| Feature | What it does | Status |
|---|---|---|
| **Container queries** (`@container`) | Style based on container size, not viewport | Universal |
| **`:has()`** | Parent / sibling-aware selectors | Universal |
| **Subgrid** | Child grid aligns to parent's tracks | Universal |
| **`overflow: clip`** | Clip without creating scroll context (vs `hidden`) | Universal |
| **`aspect-ratio`** | Replace JS aspect math | Universal |
| **`gap` for flex** | Replace `margin` between children | Universal |
| **`align-content` for flex** | Multi-line alignment | Universal |
| **`writing-mode`** | Vertical writing | Universal |
| **Container query units** (`cqw` / `cqh` / `cqi` / `cqb`) | Size relative to container | Universal |
| **Logical properties** (`inline-start`, `block-end`, etc.) | RTL/vertical-aware spacing | Universal |

### 12.2 Color & gradient

| Feature | Notes | Status |
|---|---|---|
| **`color-mix()`** | Mix two colors at runtime | Universal |
| **OKLCH / OKLab** | Perceptually uniform color spaces | Universal |
| **Display-P3** | Wide gamut | Modern |
| **Relative color syntax** | `color: rgb(from var(--c) r g b / 0.5)` | Modern |
| **`color-scheme`** | Browser knows light/dark intent | Universal |
| **`accent-color`** | Replace native check/radio brand color | Universal |
| **`@property --c`** | Typed custom prop; animatable colors | Modern |
| **Conic gradients** | `conic-gradient(...)` | Universal |
| **`color()` function** | Specify color in any space | Modern |

### 12.3 Animation & interaction

| Feature | Notes | Status |
|---|---|---|
| **View Transitions API** | Cross-DOM animated transitions on URL/state change | Chrome+Safari; FF coming |
| **`@starting-style`** | Initial state for entry transitions | Universal |
| **`transition-behavior: allow-discrete`** | Animate `display`, `popover` | Modern |
| **Scroll-driven animations** (`animation-timeline`) | Animation tied to scroll position | Chromium; FF/Safari coming |
| **`scroll-snap`** | Native carousel snap | Universal |
| **`scroll-padding`/`scroll-margin`** | Snap offsets | Universal |
| **`overscroll-behavior`** | Prevent body bounce | Universal |
| **`touch-action`** | Disable browser gestures per element | Universal |
| **`anchor-name` / anchor positioning** | Native popover positioning | Chromium |
| **CSS Houdini Paint / Layout / Animation** | Worklets | Niche; partial |
| **Native HTML `popover` attr** | Top-layer rendering w/o portal | Universal |
| **Native `<dialog>`** | Modal w/ inert backdrop | Universal |
| **`field-sizing: content`** | Auto-grow input/textarea | Modern |

### 12.4 Cascade & scoping

| Feature | Notes | Status |
|---|---|---|
| **`@layer`** | Cascade layers — explicit ordering | Universal |
| **`@scope`** | Scope CSS to a subtree | Modern |
| **CSS Nesting (native)** | `&` selector | Universal |
| **`@supports`** | Feature detection | Universal |
| **`@media (forced-colors: active)`** | High-contrast mode | Universal |
| **`@media (prefers-color-scheme)`** | Light/dark intent | Universal |
| **`@media (prefers-reduced-motion)`** | Reduced motion | Universal |
| **`@media (prefers-reduced-transparency)`** | Disable backdrop-blur | Modern |
| **`@media (prefers-reduced-data)`** | Defer images | Niche |
| **`@media (dynamic-range: high)`** | HDR display | Modern |
| **`@media (pointer: coarse)`** | Touch vs mouse | Universal |
| **`@media (any-hover)`** | Capable of hover | Universal |
| **`@media (resolution: 2dppx)`** | Retina detect | Universal |

### 12.5 Custom properties / variables

| Feature | Notes | Status |
|---|---|---|
| **`--var`** | CSS variables | Universal |
| **`@property`** | Typed custom props (animatable) | Modern |
| **`var()` w/ fallback** | `var(--c, red)` | Universal |
| **Inheritance / cascade** | Standard | Universal |
| **`env()`** | Environment variables (`safe-area-insets`) | Universal |

### 12.6 Anchor positioning

| Feature | Notes | Status |
|---|---|---|
| **`anchor-name` / `position-anchor`** | Native floating positioning | Chromium |
| **`position-try`** | Fallback positions (vs Floating UI's `flip`) | Chromium |
| **`anchor-size()`** | Size relative to anchor | Chromium |

### 12.7 Misc useful

| Feature | Notes | Status |
|---|---|---|
| **`text-wrap: balance`** | Distribute lines evenly (titles) | Modern |
| **`text-wrap: pretty`** | Avoid orphans (paragraphs) | Modern |
| **`hyphens: auto`** | Native hyphenation | Universal |
| **`line-clamp`** | Truncate at N lines | Universal |
| **`accent-color`** | Native control color | Universal |
| **`caret-color`** | Cursor color | Universal |
| **`user-select`** | Text selection control | Universal |
| **`pointer-events`** | Click-through control | Universal |
| **`will-change`** | GPU promote hint | Universal |
| **`backdrop-filter`** | Blur backdrop | Universal |
| **`mask-image`** | SVG mask color via CSS | Universal |
| **`mix-blend-mode`** | Photoshop-style blending | Universal |
| **`isolation: isolate`** | Create stacking context cleanly | Universal |
| **`contain`** | Layout/paint/style containment | Universal |
| **`content-visibility: auto`** | Defer offscreen render | Universal |
| **`@font-face` w/ `font-display`** | Font fallback strategy | Universal |
| **Variable fonts** | One font, many axes | Universal |
| **`:user-valid` / `:user-invalid`** | Form state aware of interaction | Modern |
| **`:focus-visible`** | Keyboard focus only | Universal |
| **`:focus-within`** | Has-focused-descendant | Universal |
| **`outline-offset`** | Distance focus ring from element | Universal |

### 12.8 Math functions

| Function | Notes |
|---|---|
| `calc()` | Arithmetic |
| `min(a, b)` / `max(a, b)` | Compare |
| `clamp(min, val, max)` | Bounded |
| `round()` / `mod()` / `rem()` | Niche |
| Trig: `sin()` / `cos()` / `tan()` / `asin()` etc. | Recently shipped |
| `pow()` / `sqrt()` / `log()` / `exp()` / `hypot()` | Recently shipped |
| `abs()` / `sign()` | Recently shipped |

---

## 13. Anti-patterns / what to avoid

A reverse catalog: patterns / habits that show up across UI libs but should be skipped.

### 13.1 Component-design anti-patterns

| Anti-pattern | Why bad | Better |
|---|---|---|
| One mega-component w/ 30+ props | API churn; hard to override | Compound w/ slotted parts |
| Forcing controlled-only | Breaks native form semantics | Support uncontrolled too via `useControlled` |
| Wrapping `<form>` and stealing `submit` | Blocks native FormData / server actions | Forward `action` + co-exist w/ native |
| Re-implementing native semantics | `<dialog>`, `popover`, `<details>` already exist | Adopt natives where possible |
| Accepting `style` but not `className` | Inflexible | Both, plus a clear override order |
| Imperative open/close as default | Hard to compose | Controlled + uncontrolled both |
| `forwardRef` boilerplate everywhere | Verbose pre-React 19 | Use `ref` as prop in React 19 |
| Per-component theme provider | Theme fragmentation | One provider per scope, components consume |
| Per-component i18n built-in | Bundle bloat | Provider + delegate |
| Bypass focus management | Breaks a11y in modals | FocusScope + return-focus |
| Tooltip on touch devices | No hover; doesn't work | Long-press fallback or skip |
| HoverCard as primary affordance | A11y exclusion | Pair w/ Popover or click |
| Custom focus rings overriding `:focus-visible` | Accessibility regression | Style `:focus-visible` instead |
| Hardcoded RTL detection in JS | Buggy | `dir` attribute + logical CSS |
| `aria-label` for everything | Hides real labels | Prefer `<label>` |
| Pre-rendered HTML structure differs from runtime | Hydration mismatch | Same render path |
| Children as required configuration | `<Tabs items={...}/>` is rigid | Children = composition |
| Breaking changes via prop renames silent | Caller surprise | Major-bump or alias deprecate |

### 13.2 Accessibility anti-patterns

| Anti-pattern | Why bad |
|---|---|
| `tabindex="100"` to "fix" tab order | Layout, not tabindex |
| Missing focus indicators | Keyboard users blind |
| `outline: none` w/o replacement | Same |
| `aria-hidden="true"` on focusable | Trapped invisible focus |
| `role="button"` on `<div>` w/o keyboard handlers | Half-implemented |
| Click on non-button elements | Keyboard inaccessible |
| Color-only state indicators | Color-blind users excluded |
| Auto-play audio/video w/ sound | Assistive tech overlap |
| Pop-ups w/o focus trap | Loses keyboard users |
| Modal w/o ARIA dialog role | SR doesn't announce |
| Accordion w/ same `aria-controls` for multiple panels | Confusing |
| Live region "announces" hidden content | Screen reader spam |
| Carousel w/o pause | Cognitive overload |
| `<a>` as button | Wrong semantic |
| Form submit w/o `<form>` | No native validation |
| Required indicator only via color | Same color-only |
| Drag without keyboard alternative | WCAG 2.5.7 fail |
| Touch targets < 24px | WCAG 2.5.8 fail |

### 13.3 Performance anti-patterns

| Anti-pattern | Why bad |
|---|---|
| Re-creating callbacks per render | Memo invalidates downstream |
| Context updates triggering wide re-renders | Use selectors / split |
| Inline objects/arrays in props | Same |
| Loading entire icon set | Per-icon import or sprite |
| CSS-in-JS at runtime in hot paths | Style recompute |
| `useState` for derived data | Use `useMemo` or compute |
| Effect that re-runs on every render | Missing dep array |
| 1000-row table without virtualization | Layout thrash |
| Auto-focus on mount in modal | Loses scroll position |
| Animated layout w/o `transform` | Triggers layout |
| `position: fixed` w/o `will-change` | GPU stays cold |
| Synchronous heavy work in render | Block paint |
| Barrel `index.ts` re-exporting everything | Tree-shake-hostile |
| Side effects on import | Same |

### 13.4 Theming anti-patterns

| Anti-pattern | Why bad |
|---|---|
| Hardcoded colors | No theming possible |
| Color tokens w/o semantic role | "blue-500" meaningless |
| Two semantic tokens for same intent | Confusing |
| Token names containing values (`color-red-500`) at semantic tier | Couples tier to value |
| Per-component color override (`<Button color="red">`) | Fragments theme |
| `dark:` modifier on every component | Coupling |
| Theme provider w/o CSS-vars fallback | SSR theme flash |
| Z-index magic numbers | Stacking-context bugs |
| Density per-component instead of theme-level | Drift |

### 13.5 i18n anti-patterns

| Anti-pattern | Why bad |
|---|---|
| String concatenation w/ variables | Word order varies (de/jp) |
| Pluralization via if/else (`count === 1`) | Russian/Arabic plural rules differ |
| Date format hardcoded (`MM/DD/YYYY`) | Wrong outside US |
| Number format hardcoded (`.` decimal) | Wrong in EU/RU |
| RTL handled by reversing flexbox | Use `dir` + logical props |
| Translation w/o context | "Sign" — contract or zodiac? |
| English fallback as fixed default | Should be document-defined |
| Truncating w/o accounting for char width | CJK is 2× width |
| Trans with embedded HTML lost | Use `<Trans>` w/ slots |
| Locale detected from `navigator.language` only | Should respect explicit user pref |

### 13.6 DX anti-patterns

| Anti-pattern | Why bad |
|---|---|
| Magic strings instead of typed enums | No autocomplete |
| Per-feature flag everywhere | Version skew |
| Lib-internal APIs leaked via barrel | Consumers depend on internals |
| Breaking changes w/o major bump | Caller surprise |
| Docs lagging behind code | Trust-erosion |
| API consistency violations across components | Cognitive load |
| Required props w/ no default | Boilerplate |
| Default values that hide bugs | Hard to trace |
| `console.log` in production builds | Noise |
| Stack traces hidden inside lib internals | Hard to debug |
| Single huge `index.ts` re-export | Tree-shake-hostile |
| Side effects on import | Tree-shake-hostile |
| Implicit React version peer dep | Mismatch silently |
| Deep prop names (`size_xl_with_icon`) | Combinatorial |
| Magic context values w/o provider | Runtime crash |

---

## References

### Companion docs
- [`targets.md`](./targets.md) — what *we'll* implement (verdicts)
- Workspace audit: [`docs/audits/library-references.md`](../../../../../../docs/audits/library-references.md) — component coverage matrix

### Standards & specs
- WAI-ARIA APG — w3.org/WAI/ARIA/apg/
- WCAG 2.2 Quick Reference — w3.org/WAI/WCAG22/quickref/
- MDN Web APIs index — developer.mozilla.org/en-US/docs/Web/API
- Intl API — developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- Standard Schema — standard-schema.dev
- W3C Design Tokens (DTCG) — design-tokens.github.io/community-group/format/
- TC39 Signals proposal — github.com/tc39/proposal-signals
- Temporal API — tc39.es/proposal-temporal/docs/
- View Transitions API — developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
- CSS Anchor Positioning — developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning

### Design systems
- Material Design 3 — m3.material.io
- Carbon — carbondesignsystem.com
- Adobe Spectrum — spectrum.adobe.com
- Atlassian Design Tokens — atlassian.design/tokens
- USWDS — designsystem.digital.gov
- GOV.UK Design System — design-system.service.gov.uk
- Primer (GitHub) — primer.style
- Polaris (Shopify) — polaris.shopify.com
- Fluent 2 — fluent2.microsoft.design

### React ecosystem hubs
- React — react.dev
- TanStack — tanstack.com
- Floating UI — floating-ui.com
- React Aria / Spectrum — react-spectrum.adobe.com/react-aria
- shadcn/ui — ui.shadcn.com
- Radix Primitives — radix-ui.com
- Headless UI — headlessui.com
- Ariakit — ariakit.org
- Ark UI — ark-ui.com

### Cross-framework
- Lit — lit.dev
- Stencil — stenciljs.com
- Shoelace — shoelace.style
- Material Web — material-web.dev
- Kobalte (Solid) — kobalte.dev
- Reka UI (Vue) — reka-ui.com
- Bits UI (Svelte) — bits-ui.com
- Melt UI (Svelte) — melt-ui.com
- Qwik UI — qwikui.com

### Server-driven UI
- HTMX — htmx.org
- Hotwire — hotwired.dev
- Phoenix LiveView — hexdocs.pm/phoenix_live_view
- Inertia.js — inertiajs.com

### Tailwind ecosystem
- Tailwind CSS v4 — tailwindcss.com
- tailwind-variants — tailwind-variants.org
- tailwind-merge — github.com/dcastil/tailwind-merge
- cva — cva.style

---

*Pure inventory — no decisions. When `targets.md` adopts an item, this file stays unchanged. When a new vector / lib / API is encountered, add it here first; verdict on adoption goes in `targets.md`.*

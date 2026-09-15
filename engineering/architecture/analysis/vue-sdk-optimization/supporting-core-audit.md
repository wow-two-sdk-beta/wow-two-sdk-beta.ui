# Supporting Vue core audit

Scope: foundation/errors, results, formatters, resilience, optionals, styles; domain/color and emoji. Read all 49 source paths; exact coverage in `/private/tmp/sdk-supporting-core-coverage.json`. Root authorized three fixes after the initial read-only findings. No Git or native escalation was requested in this work.

## Resolved defects

1. **Literal slug separators.** `Text.slugify` previously constructed an invalid regex for an empty separator and interpreted `$&` as replacement syntax, returning original punctuation. Multi-character separator trimming could consume source letters. It now removes source edge punctuation before replacing internal non-alphanumeric runs with a callback returning the literal separator. Empty separators join words. Tests cover empty, `$&`, `$``, regex metacharacters, alphabetic multi-character separators, Unicode accents and all-punctuation input.
2. **Masking fails closed.** `maskString('secret-value', { visible: NaN })` previously returned the full secret. Only nonnegative integer visibility counts are now accepted; nonfinite, fractional and negative values mask the entire string. This policy is documented on the option and implementation. Both prefix and suffix modes are covered; valid and zero counts retain intended behavior.
3. **Own radius tokens.** `CssExtensions.resolveRadius('constructor')` previously returned a function as the border radius through inherited map lookup. It now uses `Object.hasOwn`. Regression tests preserve constructor, toString and __proto__ as raw strings and verify normal token/raw CSS/numeric behavior.

## Changes and verification

Changed source: `src/foundation/formatters/Text.ts`, `src/foundation/styles/extensions/CssExtensions.ts`.
Changed tests: `tests/unit/foundation/format/format.test.ts`; added `tests/unit/foundation/styles/CssExtensions.test.ts`.

Before fixes, actual-source in-memory TypeScript probes reproduced all three defects. Afterwards, targeted Vitest unit run passed **3 files / 23 tests** (format, CSS extensions, class names). ESLint passed on all four changed paths. Prettier passed/formatted all four paths. Parent owns broad gates and release verification.

## Remaining scope reviewed

- Errors: structural/native recognition, safe member access, thrown-value conversion, bounded causal chain traversal, message extraction, serialization. Cycles and hostile getters are guarded; no additional concrete defect found.
- Results: every result/app-error factory, discriminated branch transform and throwing/rejection adapter; no additional defect found.
- Formatters: bytes, count, duration, all text operations; fixes above. No speculative redesign of unrelated numeric options.
- Resilience: predicates, status classification, backoff and jitter math, option/enumeration contracts; no concrete defect for documented valid inputs.
- Optionals: nullish checks and mapping helpers; no concrete defect found.
- Styles: composers, all surface recipes and tone tables, CSS/color resolvers, enums/constants/exports. Custom-color contrast remains caller-controlled; no appearance redesign.
- Color domain: gradient constructors and immutable stop/color/angle/radius/type updates; no concrete defect found.
- Emoji: full search/category implementations, declarations and exports read. Generated data structure sampled; all **1,870** rows validated programmatically: **1,870 unique glyphs**, zero malformed records, eight categories, all tags lowercase strings. This does not assert every glyph was visually inspected or that upstream Unicode data is current.

No unresolved decision or cross-scope implementation handoff remains from this bounded review.

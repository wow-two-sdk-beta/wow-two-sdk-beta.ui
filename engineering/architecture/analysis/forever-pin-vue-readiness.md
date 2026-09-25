# ForeverPin Vue SDK readiness

*Last updated: 2026-09-25*

## Scope

This analysis treats ForeverPin's current React frontend as the product capability inventory and
`@wow-two-beta/ui-vue@0.0.6` as the migration target. It does not design or preserve the React SDK API.
ForeverPin migration remains a separate product lane after the SDK review and release.

The [2026-09-25 deeper audit](vue-sdk-optimization/deeper-audit.md) reproduced additional integration and
interaction defects. This inventory establishes availability and prior verification, not behavioral completeness.
Its eight capability resolutions remain delivered; the linked audit defines their remaining integration work.

Current evidence:

- 132 ForeverPin TypeScript/TSX source files; 42 import the React SDK.
- 13 SDK subpaths; 94 distinct imported SDK symbols.
- 53 root UI components used by ForeverPin; every root has a Vue implementation.
- Every presentation root has an adjacent specification and a playground fixture.
- Router roots have adjacent specifications and focused DOM coverage.
- 15 raw `fetch` calls and 9 files with manual effect/state data flows remain product migration work.
- The prior readiness working tree based on `0.0.6` passed 407 SFC compilations,
  1,825 tests total (including 30 Chromium checks), 183 theme contrast checks and a packed consumer install.

## Current UI inventory

The Vue API intentionally uses Vue model events, slots and flat named compound parts. The mapping is
therefore semantic rather than a symbol-for-symbol rename.

| ForeverPin React root | Vue root | Migration note |
|---|---|---|
| `Button` | `Button` | Use Vue attrs/events. |
| `CopyButton` | `CopyButton` | Clipboard behavior remains SDK-owned. |
| `ToggleButtonGroup` | `ToggleGroup` | Bind with `v-model`. |
| `ToggleButton` | `ToggleInput` | Use the canonical input contract. |
| `OptionTileGroup` | `OptionTileGroupField` | Field/group ownership is explicit. |
| `OptionTile` | `OptionTilePicker` | Use item slots instead of React nodes. |
| `Accordion` | `AccordionGroup` | Use flat `Item`, `Trigger` and `Content` siblings. |
| `Badge` | `Badge` | Direct migration. |
| `Card` | `Card` | Ambient product treatments need review. |
| `EmptyState` | `EmptyState` | Direct migration. |
| `FeatureCard` | `FeatureCard` | Direct migration. |
| `PricingCard` | `PricingCard` | Direct migration. |
| `StepCard` | `StepCard` | Direct migration. |
| `Heading` | `Heading` | Direct migration. |
| `Text` | `Text` | Direct migration. |
| `Table` | `Table` | Flat head/body/row/header/cell siblings exist. |
| `CellsGlyph` | `CellsGlyph` | Direct migration. |
| `DotsGlyph` | `DotsGlyph` | Direct migration. |
| `HorizontalBarsGlyph` | `HorizontalBarsGlyph` | Direct migration. |
| `VerticalBarsGlyph` | `VerticalBarsGlyph` | Direct migration. |
| `FrameGlyph` | `FrameGlyph` | Direct migration. |
| `RadiusGlyph` | `RadiusGlyph` | Direct migration. |
| `Separator` | `SeparatorLayout` | Layout role is explicit. |
| `Sortable` | `SortableGroup` | Moved to forms; flat item/handle/move siblings exist. |
| `Alert` | `Alert` | Direct migration. |
| `Banner` | `Banner` | Direct migration. |
| `MeterBar` | `MeterBar` | Direct migration. |
| `Spinner` | `Spinner` | Direct migration. |
| `Field` | `Field` | Use Vue slots and model events. |
| `TextInput` | `TextInput` | Bind with `v-model`. |
| `TextAreaInput` | `TextAreaInput` | Bind with `v-model`. |
| `EmailInput` | `EmailInput` | Bind with `v-model`. |
| `TelInput` | `TelInput` | Bind with `v-model`. |
| `UrlInput` | `UrlInput` | Bind with `v-model`. |
| `NumberInput` | `NumberInput` | Keep bounded UI values native. |
| `SearchInput` | `SearchInput` | Bind with `v-model`. |
| `Select` | `SelectPicker` | Flat trigger/value/content/item siblings exist. |
| `DateTimeField` | `DateTimeInput` | Use explicit Temporal wire codecs. |
| `ColorPicker` | `ColorPicker` | Direct migration. |
| `EmojiPicker` | `EmojiPicker` | Direct migration. |
| `EmojiSizeControl` | `EmojiSizePicker` | Picker role is explicit. |
| `ControlGroup` | `ControlGroupField` | Field role is explicit. |
| `Center` | `CenterLayout` | Layout role is explicit. |
| `Container` | `ContainerLayout` | Layout role is explicit. |
| `Divider` | `DividerLayout` | Layout role is explicit. |
| `Grid` | `Grid` | Direct migration. |
| `HStack` | `HStackLayout` | Layout role is explicit. |
| `Navbar` | `Navbar` | Inner container styling needs review. |
| `Section` | `Section` | Direct migration. |
| `Stack` | `StackLayout` | Layout role is explicit. |
| `Surface` | `SurfaceLayout` | Layout role is explicit. |
| `VStack` | `VStackLayout` | Layout role is explicit. |
| `AlertModal` | `AlertModal` | Flat content/cancel/shared modal chrome exists. |

## UI needed by the planned product work

| Vue UI | ForeverPin use |
|---|---|
| `Modal` | Choose the copied target mode. |
| `Popover` | Explain builder controls without permanent clutter. |
| `GoogleSignInButton` | Replace the app-owned Google OAuth button. |
| `FeedbackToastHost` | Render feedback bus and query mutation outcomes. |
| `LoadingState` | Replace repeated centered-spinner screens where it fits. |
| `AppErrorBoundary` | Render app and route failure fallbacks. |
| `RouteAnnouncer` | Announce accessible route transitions. |

`AppNavLink` is optional. Router scroll behavior replaces the current `ScrollToTop`; `BackToTopButton`
does not.

## Logic inventory

### Already consumed

| Vue capability | ForeverPin use |
|---|---|
| `domain/color` | `Gradient` model. |
| `domain/emoji` | Emoji catalog and catalog entry types. |
| `forms-engine` | Form contract, field paths and typed array rows. |
| `forms-engine/tanstack` | Vue TanStack form adapter. |
| `foundation/http` | API client, failures, problem details and field issues. |
| `foundation/storage` | Storage broker and local-storage persistence. |
| `foundation/themes` | Color mode provider/composable and `smart-qr` theme. |
| `foundation/styles` | Size, tone, orientation and surface vocabulary. |

### Adopt during the Vue migration

| Vue capability | ForeverPin use |
|---|---|
| `foundation/config` | Parse API, redirect and Google client configuration. |
| `foundation/validators` | Decode API/config/form boundaries. |
| `foundation/numbers` | Preserve unbounded integers as `ExactNumber`. |
| `foundation/json` | Parse and emit exact JSON numeric tokens. |
| `foundation/datetime` | Encode/decode Temporal wire values explicitly. |
| `foundation/i18n` | Format counts, dates and prices. |
| `foundation/oauth` | Own Google Identity Services integration. |
| `foundation/files` | Download vector and raster output. |
| `foundation/clipboard` | Support direct clipboard operations beyond `CopyButton`. |
| `foundation/async` | Debounce preview/search work not owned by query. |
| `auth` | Own guest/Google sessions through a cookie strategy. |
| `query` | Own server state, mutations and optimistic updates. |
| `router` | Own typed routes, metadata, guards and scroll behavior. |
| `feedback` | Bridge API/query failures to visible product feedback. |

`foundation/share` remains optional until native sharing enters product scope.

## Product-owned boundary

These stay in ForeverPin because they encode the product or its visual identity:

- `Logo`, `QrPreview`, `StaticQrPreview` and QR rendering.
- `ContentTypeControls`, `FillControls` and `ShapeControls` composition.
- `ContrastCallout` policy and marketing sections.
- `qrcode.react` needs a Vue replacement or app-local SVG renderer; it does not justify an SDK QR component.

## SDK gap resolution

| # | Gap | Resolution | Status |
|---|---|---|---|
| F1 | HTTP response bodies | Added `text`, `blob` and `arrayBuffer` modes. | Done |
| F2 | JSON codec scope | Added request-level codec override and native opt-out. | Done |
| F3 | Exact-number formatting | Added lossless locale formatting with explicit rounding. | Done |
| F4 | Exact-number decoding | Added a strict `ExactNumber` validator. | Done |
| F5 | `Navbar` inner attrs | Added merged inner-container attrs and classes. | Done |
| F6 | `Card` ambient styles | Added `sheen`, `glow` and `bevel` treatments. | Done |
| F7 | Discriminated array rows | Added runtime-guarded union branch views. | Done |
| F8 | Theme validation | Kept `smart-qr` candidate until migrated visual review. | Gated |

F8 has no remaining SDK defect. The theme passes automated contrast checks; lifecycle promotion requires
the migrated ForeverPin surface, so the product upgrade owns that visual acceptance gate.

## Capability review map

Manual review is optional. The [deeper audit](vue-sdk-optimization/deeper-audit.md#implementation-order)
orders the implementation work; this map retains the capability coverage for later targeted review.

1. HTTP response modes and the mixed exact/native JSON boundary.
2. Exact-number decoding and locale formatting.
3. Auth, OAuth and runtime configuration integration.
4. Query, feedback and router integration.
5. Forms array/discriminated-union composition.
6. Actions, toggles, option tiles and form controls.
7. Select, datetime, emoji, color and sortable controls.
8. Modal, alert-modal and popover composition.
9. Navbar, card, surface, loading and error states.
10. Display, marketing, table and glyph components.
11. `smart-qr` theme visual validation.

Each review completes the whole SDK vector triggered by ForeverPin. Publish the resulting Vue version
before starting the product migration. Playground, sandbox and theme-app sweeps follow the ForeverPin upgrade.

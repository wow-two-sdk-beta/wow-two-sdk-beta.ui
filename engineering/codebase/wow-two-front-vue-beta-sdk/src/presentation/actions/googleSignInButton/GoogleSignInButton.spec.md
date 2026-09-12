# GoogleSignInButton

Renders the Google sign-in button — the Google-owned control for the GIS ID-token flow.

Source: [GoogleSignInButton.vue](GoogleSignInButton.vue).

Public import: `import { GoogleSignInButton } from '@wow-two-beta/ui-vue/presentation/actions';`.

## Contract

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `clientId` | `string` | no | — | The OAuth client id. Empty renders nothing, so an app without one configured stays guest-only. |
| `theme` | `GoogleButtonOptions['theme']` | no | `'outline'` | The button surface. Default `outline`. |
| `size` | `GoogleButtonOptions['size']` | no | `'large'` | The button height band. Default `large`. |
| `text` | `GoogleButtonOptions['text']` | no | `'signin_with'` | The label wording. Default `signin_with`. |
| `shape` | `GoogleButtonOptions['shape']` | no | `'rectangular'` | The button outline. Default `rectangular`. |
| `width` | `number` | no | — | The rendered width in px. GIS caps this at 400; omit to size to the host element. |
| `logoAlignment` | `GoogleButtonOptions['logo_alignment']` | no | `'left'` | The logo placement. Default `left`. |
| `locale` | `string` | no | — | The BCP-47 locale for the button copy. Defaults to the browser's. |
| `autoSelect` | `boolean` | no | `false` | Whether GIS may sign a returning user in without a click. Default `false`. |

## Emits

| Event | Signature | Meaning |
|---|---|---|
| `credential` | `credential: [credential: string, response: GoogleCredentialResponse];` | Fires when the reader completes Google sign-in — carries the signed ID token and the raw GIS response. |
| `error` | `error: [error: Error];` | Fires when the GIS script fails to load or initialize. The button renders nothing once this fires. |

## Slots

None declared.

## Exposed handle

No explicit exposed handle.

## Verification

- Public render fixture: [ActionsExamples.ts](../../../../apps/playground/src/gallery/fixtures/ActionsExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Focused test references: [GoogleSignInButton.dom.test.ts](../../../../tests/unit/presentation/actions/GoogleSignInButton.dom.test.ts). Consult the named test assertions for the behavior actually covered.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.

# VideoPlayer

Renders a video player whose custom controls auto-hide 3s into playback.

Source: [VideoPlayer.vue](VideoPlayer.vue).

Public import: `import { VideoPlayer } from '@wow-two-beta/ui-vue/presentation/display';`.

## Contract

- Unmount disposes the subscriptions, listeners or timers registered by this implementation.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `src` | `string` | yes | — | The video source URL. |
| `poster` | `string` | no | `undefined` | The preview image shown before playback. |
| `tracks` | `ReadonlyArray<VideoTrack>` | no | `undefined` | The caption/subtitle tracks rendered as `<track>` children. |
| `aspectRatio` | `string \| number` | no | `'16 / 9'` | The CSS `aspect-ratio` of the frame. Default `16 / 9`. |
| `autoPlay` | `boolean` | no | `undefined` | The autoplay state, forwarded to the native `<video>`. |
| `loop` | `boolean` | no | `undefined` | The loop state, forwarded to the native `<video>`. |
| `muted` | `boolean` | no | `undefined` | The initial muted state — seeds the internal toggle, exactly as the legacy `muted` did. |
| `defaultVolume` | `number` | no | `1` | The initial volume in 0..1. Default `1`. |
| `defaultPlaybackRate` | `number` | no | `1` | The initial playback rate. Default `1`. |

## Emits

None declared.

## Slots

None declared.

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [DisplayExamples.ts](../../../../apps/playground/src/gallery/fixtures/DisplayExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.

<script lang="ts">
import type { GoogleButtonOptions } from '../../../foundation/oauth';

/** Defines the props for {@link GoogleSignInButton}. */
export interface GoogleSignInButtonProps {
  /** The OAuth client id. Empty renders nothing, so an app without one configured stays guest-only. */
  readonly clientId?: string;

  /** The button surface. Default `outline`. */
  readonly theme?: GoogleButtonOptions['theme'];

  /** The button height band. Default `large`. */
  readonly size?: GoogleButtonOptions['size'];

  /** The label wording. Default `signin_with`. */
  readonly text?: GoogleButtonOptions['text'];

  /** The button outline. Default `rectangular`. */
  readonly shape?: GoogleButtonOptions['shape'];

  /** The rendered width in px. GIS caps this at 400; omit to size to the host element. */
  readonly width?: number;

  /** The logo placement. Default `left`. */
  readonly logoAlignment?: GoogleButtonOptions['logo_alignment'];

  /** The BCP-47 locale for the button copy. Defaults to the browser's. */
  readonly locale?: string;

  /** Whether GIS may sign a returning user in without a click. Default `false`. */
  readonly autoSelect?: boolean;
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import { GoogleIdentityStatus, useGoogleIdentity, type GoogleCredentialResponse } from '../../../foundation/oauth';

/**
 * Renders the Google sign-in button — the Google-owned control for the GIS ID-token flow.
 *
 * The button itself is drawn by Google into the host element, not by this package: the ID-token flow
 * requires Google's own branding, so `theme` / `size` / `shape` are forwarded to GIS rather than
 * mapped onto house variants. Everything below the pixels is ours — script loading, `initialize`, and
 * the credential handoff live in `auth`'s `useGoogleIdentity`.
 *
 * The emitted `credential` is a signed JWT ID token, and it is **not** a session. Post it to the
 * product's identity endpoint for server-side verification, and let the response drive `AuthProvider`.
 */
defineOptions({ name: 'GoogleSignInButton', inheritAttrs: false });

const props = withDefaults(defineProps<GoogleSignInButtonProps>(), {
  theme: 'outline',
  size: 'large',
  text: 'signin_with',
  shape: 'rectangular',
  logoAlignment: 'left',
  autoSelect: false,
});

const emit = defineEmits<{
  /** Fires when the reader completes Google sign-in — carries the signed ID token and the raw GIS response. */
  credential: [credential: string, response: GoogleCredentialResponse];

  /** Fires when the GIS script fails to load or initialize. The button renders nothing once this fires. */
  error: [error: Error];
}>();

const host = ref<HTMLElement | null>(null);

const identity = useGoogleIdentity({
  clientId: () => props.clientId,
  onCredential: (credential, response) => emit('credential', credential, response),
  onError: (error) => emit('error', error),
  autoSelect: () => props.autoSelect,
});

/* GIS reads these once per `renderButton` call, so a prop change has to re-render the button rather
   than mutate it. Collected into one computed so the watcher below fires on any of them. */
const buttonOptions = computed<GoogleButtonOptions>(() => ({
  theme: props.theme,
  size: props.size,
  text: props.text,
  shape: props.shape,
  width: props.width,
  logo_alignment: props.logoAlignment,
  locale: props.locale,
}));

const isReady = computed(() => identity.status.value === GoogleIdentityStatus.Ready);

/* `immediate` covers the case where the script resolved before this watcher was registered; the
   `nextTick` covers the opposite one, where `isReady` flips in the same tick the host is created and
   the ref is not populated yet. */
watch(
  [isReady, buttonOptions, host],
  async () => {
    if (!isReady.value) return;
    await nextTick();

    const target = host.value;
    if (!target) return;

    // GIS appends; without the clear, a re-render stacks a second button under the first.
    target.replaceChildren();
    identity.renderButton(target, buttonOptions.value);
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="clientId" ref="host" v-bind="$attrs" />
</template>

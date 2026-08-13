<script lang="ts">
export interface ScrollLockProviderProps {
  isEnabled?: boolean;
}
</script>

<script setup lang="ts">
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * Component wrapper around `useScrollLock` — handy when scroll lock should
 * follow a child's mount lifecycle (e.g. inside a Modal's teleport).
 * Multiple wrappers stack; lock releases when the count reaches zero.
 *
 * Renders nothing of its own: the slot is returned as-is, so this component is
 * transparent to layout (React returned a bare fragment for the same reason).
 */
defineOptions({ name: 'ScrollLockProvider' });

const props = withDefaults(defineProps<ScrollLockProviderProps>(), { isEnabled: true });

// Passed as a getter so the lock follows the prop, matching the React effect's
// `[enabled]` dependency.
useScrollLock(() => props.isEnabled);
</script>

<template>
  <slot />
</template>

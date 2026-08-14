<script setup lang="ts">
import { computed } from 'vue';
import Demo from './Demo.vue';
import { allComponentNames, uncoveredComponents } from './auto';

/**
 * Mounts every component a barrel exports that the curated section skipped.
 *
 * Bare-mounting a component with no props is a weak demo — but it is a real
 * check: it proves the module loads, the SFC renders, and (for anything that
 * throws on a missing required prop or a missing parent context) it surfaces
 * that in the boundary or the warnings panel. Coverage over polish.
 */
const props = defineProps<{
  namespace: Record<string, unknown>;
  covered: readonly string[];
}>();

const rest = computed(() => uncoveredComponents(props.namespace, props.covered));
const total = computed(() => allComponentNames(props.namespace).length);
</script>

<template>
  <div>
    <p class="mb-2 text-xs text-subtle-foreground">
      {{ rest.length }} of {{ total }} exported components not in the curated set above — bare-mounted
      with placeholder content only.
    </p>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2">
      <Demo v-for="{ name, component } in rest" :key="name" :name="name">
        <component :is="component">{{ name }}</component>
      </Demo>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Demo from './Demo.vue';
import ExampleRenderer from './ExampleRenderer.vue';
import { findComponentExample } from './fixtures';
import { allComponentNames, uncoveredComponents } from './auto';

/** Completes the gallery with typed examples and the required family context. */
const props = defineProps<{
  namespace: Record<string, unknown>;
  covered: readonly string[];
}>();

const rest = computed(() => uncoveredComponents(props.namespace, props.covered));
function usableExample(name: string) {
  const example = findComponentExample(name);
  if (!example || example.skipMount || ['AudioPlayer', 'VideoPlayer', 'PdfViewer'].includes(name)) return undefined;
  return example;
}
const total = computed(() => allComponentNames(props.namespace).length);
</script>

<template>
  <div>
    <p class="mb-2 text-xs text-subtle-foreground">
      {{ rest.length }} of {{ total }} exported components use contextual examples below. Media requiring a real source
      stays in its curated example.
    </p>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2">
      <Demo v-for="{ name } in rest" :key="name" :name="name">
        <ExampleRenderer v-if="usableExample(name)" :example="usableExample(name)!" />
        <p v-else class="text-sm text-muted-foreground">Use the composed family example above.</p>
      </Demo>
    </div>
  </div>
</template>

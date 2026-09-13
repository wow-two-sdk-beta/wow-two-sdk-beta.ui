<script setup lang="ts">
import { computed } from 'vue';
import Demo from './Demo.vue';
import ExampleRenderer from './ExampleRenderer.vue';
import type { SmokeCase } from './fixtures/Example';
import { allComponentNames, uncoveredComponents } from './auto';

/** Completes the gallery with typed examples and the required family context. */
const props = defineProps<{
  namespace: Record<string, unknown>;
  covered: readonly string[];
  examples: readonly SmokeCase[];
}>();

const rest = computed(() => {
  const examples = new Map(props.examples.map((example) => [example.name, example]));
  return uncoveredComponents(props.namespace, props.covered).map(({ name }) => {
    const example = examples.get(name);
    return {
      name,
      example: example?.skipMount || ['AudioPlayer', 'VideoPlayer', 'PdfViewer'].includes(name) ? undefined : example,
    };
  });
});
const total = computed(() => allComponentNames(props.namespace).length);
</script>

<template>
  <div>
    <p class="mb-2 text-xs text-subtle-foreground">
      {{ rest.length }} of {{ total }} exported components use contextual examples below. Media requiring a real source
      stays in its curated example.
    </p>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2">
      <Demo v-for="{ name, example } in rest" :key="name" :name="name">
        <ExampleRenderer v-if="example" :example="example" />
        <p v-else class="text-sm text-muted-foreground">Use the composed family example above.</p>
      </Demo>
    </div>
  </div>
</template>

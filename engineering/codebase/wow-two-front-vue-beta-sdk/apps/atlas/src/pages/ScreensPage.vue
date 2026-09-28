<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { ArrowRight } from 'lucide-vue-next';
import { findArchetype } from '../content/layouts';
import { Screens, findScreen } from '../content/screens';
import { href, route } from '../router';
import LayoutWire from '../wire/LayoutWire.vue';

/* The wireframes' real counterparts: each screen is an archetype built only from SDK components, so a layout
   decision can be checked against the parts that will actually ship. */

const Views = {
  dashboard: defineAsyncComponent(() => import('../screens/DashboardScreen.vue')),
  board: defineAsyncComponent(() => import('../screens/BoardScreen.vue')),
  settings: defineAsyncComponent(() => import('../screens/SettingsScreen.vue')),
  inbox: defineAsyncComponent(() => import('../screens/InboxScreen.vue')),
  wizard: defineAsyncComponent(() => import('../screens/WizardScreen.vue')),
  'data-console': defineAsyncComponent(() => import('../screens/DataConsoleScreen.vue')),
  docs: defineAsyncComponent(() => import('../screens/DocsScreen.vue')),
  canvas: defineAsyncComponent(() => import('../screens/CanvasScreen.vue')),
} as const;

const screen = computed(() => findScreen(route.value.id) ?? Screens[0]!);
const archetype = computed(() => findArchetype(screen.value.archetype));
const view = computed(() => Views[screen.value.id as keyof typeof Views]);
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Screens</h1>
        <p class="mt-1 max-w-2xl text-muted-foreground">
          Archetypes built from real SDK components — the wireframe's promise, checked against the parts that ship. They
          follow the atlas theme and the light/dark switch.
        </p>
      </div>
    </header>

    <nav aria-label="Screens" class="flex flex-wrap gap-1">
      <a
        v-for="entry in Screens"
        :key="entry.id"
        :href="href('screens', entry.id)"
        :aria-current="entry.id === screen.id ? 'page' : undefined"
        class="rounded-md border px-3 py-1.5 text-sm transition-colors"
        :class="
          entry.id === screen.id
            ? 'border-transparent bg-primary text-primary-foreground'
            : 'border-border hover:bg-muted'
        "
      >
        {{ entry.name }}
      </a>
    </nav>

    <section class="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-[200px_minmax(0,1fr)]">
      <a v-if="archetype" :href="href('layouts', archetype.id)" class="group flex flex-col gap-2">
        <LayoutWire :spec="archetype.spec" :label="`${archetype.name} wireframe`" />
        <span class="inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
          {{ archetype.name }} wireframe <ArrowRight class="size-3" aria-hidden="true" />
        </span>
      </a>
      <div class="flex flex-col gap-2">
        <h2 class="text-lg font-semibold">{{ screen.name }}</h2>
        <p class="text-sm text-muted-foreground">{{ screen.summary }}</p>
        <p class="text-xs font-medium text-muted-foreground">Built with</p>
        <ul class="flex flex-wrap gap-1" aria-label="Components used">
          <li
            v-for="name in screen.components"
            :key="name"
            class="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs"
          >
            {{ name }}
          </li>
        </ul>
      </div>
    </section>

    <div class="h-[680px] overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <component :is="view" :key="screen.id" />
    </div>
  </div>
</template>

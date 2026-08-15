<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `WizardStepsProps` (an alias of `HTMLAttributes<HTMLDivElement>`)
   and consumers import it. Every attribute falls through. */
export interface WizardStepsProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useWizard, type StepInfo } from './WizardContext';

/** The clickable step strip. Visited steps are re-selectable while `canGoBack`. */
defineOptions({ name: 'WizardSteps', inheritAttrs: false });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useWizard();

function canJump(step: StepInfo): boolean {
  return ctx.canGoBack && ctx.visited.has(step.id);
}

function onStepClick(step: StepInfo): void {
  if (canJump(step)) ctx.goTo(step.id);
}

function tabClass(step: StepInfo, index: number): string {
  const isCurrent = ctx.currentIndex === index;
  const wasVisited = ctx.visited.has(step.id);
  return cn(
    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
    isCurrent
      ? 'bg-primary text-primary-foreground'
      : wasVisited
        ? 'bg-muted text-foreground hover:bg-muted/70'
        : 'text-muted-foreground',
    !canJump(step) && 'cursor-default',
  );
}

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const stripClass = computed(() => cn('flex items-center gap-2 overflow-x-auto', attrs.class as ClassValue));

defineExpose({ el });
</script>

<template>
  <div ref="el" role="tablist" aria-label="Wizard steps" :class="stripClass" v-bind="passthroughAttrs">
    <button
      v-for="(step, i) in ctx.steps"
      :key="step.id"
      type="button"
      role="tab"
      :aria-selected="ctx.currentIndex === i"
      :aria-disabled="!canJump(step) || undefined"
      :class="tabClass(step, i)"
      @click="onStepClick(step)"
    >
      <span class="grid h-5 w-5 place-items-center rounded-full bg-background/20 text-[10px]">
        {{ i + 1 }}
      </span>
      {{ step.label ?? step.id }}
      <span v-if="step.isOptional" class="ml-1 text-[10px] opacity-70">(optional)</span>
    </button>
  </div>
</template>

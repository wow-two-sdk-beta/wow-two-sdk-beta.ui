<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `WizardFormStepsProps` (an alias of `HTMLAttributes<HTMLDivElement>`)
   and consumers import it. Every attribute falls through. */
export interface WizardFormStepsProps {}
</script>

<script setup lang="ts">
import { useLocale } from '../../../foundation/i18n';
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/styles';
import { useWizard, type StepInfo } from './WizardFormContext';

/** Renders the clickable step strip, where already-visited steps stay re-selectable while `canGoBack`. */
defineOptions({ name: 'WizardFormSteps', inheritAttrs: false });

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

const OwnedAttributes: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OwnedAttributes.has(key))),
);

const stripClass = computed(() => cn('flex items-center gap-2 overflow-x-auto', attrs.class as ClassValue));

defineExpose({ el });

const locale = useLocale();
</script>

<template>
  <div
    ref="el"
    role="tablist"
    :aria-label="locale.t('WizardFormSteps.wizardformSteps', undefined, 'WizardForm steps')"
    :class="stripClass"
    v-bind="passthroughAttrs"
  >
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
      <span v-if="step.isOptional" class="ml-1 text-[10px] opacity-70"
        >{{ locale.t('WizardFormSteps.optional', undefined, '(optional)') }}
      </span>
    </button>
  </div>
</template>

<script lang="ts">
export interface WizardProps {
  /** The active step id, controlled. The `v-model:current-step` binding target. */
  currentStep?: string;

  /** The initial active step id when uncontrolled. Defaults to the first registered step. */
  defaultCurrentStep?: string;

  /**
   * The completion handler, awaited on the final step's Next.
   *
   * Kept a PROP, not an emit: the root AWAITS its result to hold `isPending`, and an emit
   * returns nothing to await.
   */
  onComplete?: () => void | Promise<void>;

  /** Whether the Back control and step back-jumps are available. Default `true`. */
  canGoBack?: boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { wizardContextKey, type StepInfo, type WizardContextValue } from './WizardContext';

/**
 * Wizard root. Owns the step registry, the active step, and the pending flag, and publishes
 * them to `WizardSteps` / `WizardStep` / `WizardFooter` through injection.
 */
/* `inheritAttrs: false` so `class` folds into the root's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Wizard', inheritAttrs: false });

/** The wizard tree — the step strip, the steps, and the footer. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<WizardProps>(), {
  canGoBack: true,
  /* Explicit `undefined` default: `useControlled` keys on `=== undefined`. */
  currentStep: undefined,
  defaultCurrentStep: undefined,
  onComplete: undefined,
});

const emit = defineEmits<{
  /** The `v-model:current-step` half. */
  'update:currentStep': [step: string];
  /** Replaces React's `onStepChange`. */
  'step-change': [step: string];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const steps = ref<Array<StepInfo>>([]);
/* A plain Map, matching React's: it is only ever read inside `next()`, never rendered. */
const validators = new Map<string, () => boolean | Promise<boolean>>();

const stepCtl = useControlled<string>({
  controlled: () => props.currentStep,
  default: () => props.defaultCurrentStep ?? '',
  onChange: (next) => {
    emit('update:currentStep', next);
    emit('step-change', next);
  },
});

/**
 * The active step id.
 *
 * React pre-walked its children to seed the first step id before anything mounted. Vue steps
 * register on mount instead, so the first registered id is the fallback — resolved here rather
 * than written through `setValue`, which would fire a spurious `step-change` on mount.
 */
const activeStepId = computed(() => stepCtl.value.value || (steps.value[0]?.id ?? ''));

const visitedSet = ref<ReadonlySet<string>>(new Set<string>());
/* The first step counts as visited without an explicit `goTo`, exactly as React seeded it. */
const visited = computed<ReadonlySet<string>>(() => {
  const first = steps.value[0]?.id;
  if (!first) return visitedSet.value;
  return new Set([...visitedSet.value, first]);
});

const isPending = ref(false);

const currentIndex = computed(() => steps.value.findIndex((s) => s.id === activeStepId.value));
const currentStepInfo = computed<StepInfo | undefined>(() => steps.value[currentIndex.value]);

function registerStep(info: StepInfo): void {
  const idx = steps.value.findIndex((s) => s.id === info.id);
  if (idx >= 0) {
    const next = steps.value.slice();
    next[idx] = info;
    steps.value = next;
    return;
  }
  steps.value = [...steps.value, info];
}

function unregisterStep(id: string): void {
  steps.value = steps.value.filter((s) => s.id !== id);
}

function registerValidator(id: string, validator: () => boolean | Promise<boolean>): void {
  validators.set(id, validator);
}

function unregisterValidator(id: string): void {
  validators.delete(id);
}

function goTo(idOrIndex: string | number): void {
  const target = typeof idOrIndex === 'number' ? steps.value[idOrIndex]?.id : idOrIndex;
  if (!target) return;
  stepCtl.setValue(target);
  visitedSet.value = new Set([...visitedSet.value, target]);
}

async function next(): Promise<void> {
  const step = currentStepInfo.value;
  if (!step || isPending.value) return;
  const validator = validators.get(step.id);
  if (validator) {
    isPending.value = true;
    try {
      const ok = await validator();
      if (!ok) return;
    } finally {
      isPending.value = false;
    }
  }
  if (step.isFinal) {
    isPending.value = true;
    try {
      await props.onComplete?.();
    } finally {
      isPending.value = false;
    }
    return;
  }
  const nextStep = steps.value[currentIndex.value + 1];
  if (nextStep) goTo(nextStep.id);
}

function back(): void {
  if (!props.canGoBack) return;
  const prev = steps.value[currentIndex.value - 1];
  if (prev) goTo(prev.id);
}

/* Live getters, not a snapshot — every part re-reads the registry as it changes. */
provide<WizardContextValue>(wizardContextKey, {
  get steps() {
    return steps.value;
  },
  get currentIndex() {
    return currentIndex.value;
  },
  get currentStep() {
    return currentStepInfo.value;
  },
  goTo,
  next,
  back,
  get canGoBack() {
    return props.canGoBack;
  },
  get visited() {
    return visited.value;
  },
  registerStep,
  unregisterStep,
  registerValidator,
  unregisterValidator,
  get isPending() {
    return isPending.value;
  },
});

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn('flex flex-col gap-4', attrs.class as ClassValue));

/** The rendered root `<div>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el });
</script>

<template>
  <div ref="el" :class="rootClass" v-bind="passthroughAttrs"><slot /></div>
</template>

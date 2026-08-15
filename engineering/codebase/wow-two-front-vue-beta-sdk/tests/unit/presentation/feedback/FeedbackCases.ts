import { h, type VNode } from 'vue';
import {
  Alert,
  AlertSimple,
  Banner,
  BannerSimple,
  Callout,
  FeedbackToasts,
  InlineSpinner,
  LiveCursor,
  LoadingOverlay,
  LoadingState,
  MeterBar,
  NotificationCenter,
  NotificationItem,
  OnboardingChecklist,
  OnboardingChecklistTask,
  PresenceIndicator,
  ProgressBar,
  ProgressCircle,
  ProgressSteps,
  Skeleton,
  Spinner,
  StatusIndicator,
  Toast,
  Toaster,
  ToastSimple,
  Tour,
  TrendIndicator,
  TypingIndicator,
  UndoBar,
} from '@src/presentation/feedback';
import { smokeCase, type SmokeCase } from '../../../support/Smoke';

/* Wrappers for the compound parts — each renders the part inside the root whose `provide` it
   injects, so the part is smoke-tested in the shape it actually ships in. */
const inChecklist = (node: VNode): VNode => h(OnboardingChecklist, null, () => node);
const inNotificationCenter = (node: VNode): VNode => h(NotificationCenter, null, () => node);

/**
 * Every component `@wow-two-beta/ui-vue/presentation/feedback` exports, as smoke cases.
 * Imported through the public barrel on purpose — a component missing from `index.ts` fails
 * here before a consumer finds it.
 */
export const feedbackCases: readonly SmokeCase[] = [
  smokeCase('Spinner', Spinner, {}),
  smokeCase('Skeleton', Skeleton, {}, { slot: true }),
  smokeCase('ProgressBar', ProgressBar, {}),
  smokeCase('ProgressCircle', ProgressCircle, {}),
  smokeCase('AlertSimple', AlertSimple, {}, { slot: true }),
  smokeCase('BannerSimple', BannerSimple, {}, { slot: true }),
  smokeCase('ToastSimple', ToastSimple, {}, { slot: true }),
  smokeCase('Alert', Alert, {}, { slot: true }),
  smokeCase('Banner', Banner, {}, { slot: true }),
  smokeCase('Toast', Toast, {}, { slot: true }),
  smokeCase('Callout', Callout, {}, { slot: true }),
  smokeCase('InlineSpinner', InlineSpinner, {}, { slot: true }),
  smokeCase('LoadingState', LoadingState, {}),
  smokeCase('ProgressSteps', ProgressSteps, { steps: ['Plan', 'Build'], current: 0 }),
  smokeCase('StatusIndicator', StatusIndicator, {}),
  smokeCase('MeterBar', MeterBar, { value: 50 }),
  smokeCase('TrendIndicator', TrendIndicator, { value: 5 }),
  smokeCase('Toaster', Toaster, {}),
  smokeCase('FeedbackToasts', FeedbackToasts, {}),
  smokeCase('LoadingOverlay', LoadingOverlay, {}, { slot: true }),
  smokeCase('UndoBar', UndoBar, { isOpen: true }),
  smokeCase('OnboardingChecklist', OnboardingChecklist, {}, { slot: true }),
  smokeCase('OnboardingChecklistTask', OnboardingChecklistTask, {}, { wrap: inChecklist }),
  smokeCase('Tour', Tour, { steps: [{ target: '#tour-anchor', title: 'Step one' }] }),
  smokeCase('TypingIndicator', TypingIndicator, {}),
  smokeCase('PresenceIndicator', PresenceIndicator, {}),
  smokeCase('LiveCursor', LiveCursor, { x: 10, y: 20 }),
  smokeCase('NotificationCenter', NotificationCenter, {}, { slot: true }),
  smokeCase('NotificationItem', NotificationItem, {}, { wrap: inNotificationCenter }),
];

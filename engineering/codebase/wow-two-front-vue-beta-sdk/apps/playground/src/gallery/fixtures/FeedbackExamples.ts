import { h, type VNode } from 'vue';
import {
  Alert,
  AlertSimple,
  Banner,
  BannerSimple,
  Callout,
  FeedbackToastHost,
  InlineSpinner,
  LiveCursorIndicator,
  LoadingOverlay,
  LoadingState,
  MeterBar,
  PresenceIndicator,
  ProgressBar,
  ProgressCircleIndicator,
  ProgressStepsIndicator,
  SkeletonState,
  Spinner,
  StatusIndicator,
  Toast,
  ToastHost,
  ToastSimple,
  TrendIndicator,
  TypingIndicator,
  UndoBar,
} from '../../../../../src/presentation/feedback';
import {
  NotificationCenterGroup,
  NotificationItem,
  OnboardingChecklistCard,
  OnboardingChecklistCardTask,
} from '../../../../../src/presentation/display';
import { TourPopover } from '../../../../../src/presentation/overlays';
import { smokeCase, type SmokeCase } from './Example';

/* Wrappers for the compound parts — each renders the part inside the root whose `provide` it
   injects, so the part is smoke-tested in the shape it actually ships in. */
const inChecklist = (node: VNode): VNode => h(OnboardingChecklistCard, null, () => node);
const inNotificationCenter = (node: VNode): VNode => h(NotificationCenterGroup, null, () => node);

/**
 * Every component `@wow-two-beta/ui-vue/presentation/feedback` exports, as smoke cases.
 * Imported through the public barrel on purpose — a component missing from `index.ts` fails
 * here before a consumer finds it.
 */
export const feedbackExamples: readonly SmokeCase[] = [
  smokeCase('Spinner', Spinner, {}),
  smokeCase('SkeletonState', SkeletonState, {}, { slot: true }),
  smokeCase('ProgressBar', ProgressBar, {}),
  smokeCase('ProgressCircleIndicator', ProgressCircleIndicator, {}),
  smokeCase('AlertSimple', AlertSimple, {}, { slot: true }),
  smokeCase('BannerSimple', BannerSimple, {}, { slot: true }),
  smokeCase('ToastSimple', ToastSimple, {}, { slot: true }),
  smokeCase('Alert', Alert, {}, { slot: true }),
  smokeCase('Banner', Banner, {}, { slot: true }),
  smokeCase('Toast', Toast, {}, { slot: true }),
  smokeCase('Callout', Callout, {}, { slot: true }),
  smokeCase('InlineSpinner', InlineSpinner, {}, { slot: true }),
  smokeCase('LoadingState', LoadingState, {}),
  smokeCase('ProgressStepsIndicator', ProgressStepsIndicator, { steps: ['Plan', 'Build'], current: 0 }),
  smokeCase('StatusIndicator', StatusIndicator, {}),
  smokeCase('MeterBar', MeterBar, { value: 50 }),
  smokeCase('TrendIndicator', TrendIndicator, { value: 5 }),
  smokeCase('ToastHost', ToastHost, {}),
  smokeCase('FeedbackToastHost', FeedbackToastHost, {}),
  smokeCase('LoadingOverlay', LoadingOverlay, {}, { slot: true }),
  smokeCase('UndoBar', UndoBar, { open: true }),
  smokeCase('OnboardingChecklistCard', OnboardingChecklistCard, {}, { slot: true }),
  smokeCase('OnboardingChecklistCardTask', OnboardingChecklistCardTask, {}, { wrap: inChecklist }),
  smokeCase('TourPopover', TourPopover, { steps: [{ target: '#tour-anchor', title: 'Step one' }] }),
  smokeCase('TypingIndicator', TypingIndicator, {}),
  smokeCase('PresenceIndicator', PresenceIndicator, {}),
  smokeCase('LiveCursorIndicator', LiveCursorIndicator, { x: 10, y: 20 }),
  smokeCase('NotificationCenterGroup', NotificationCenterGroup, {}, { slot: true }),
  smokeCase('NotificationItem', NotificationItem, {}, { wrap: inNotificationCenter }),
];

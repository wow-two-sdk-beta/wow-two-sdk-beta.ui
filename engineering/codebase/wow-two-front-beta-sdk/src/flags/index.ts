// @wow-two-beta/ui/flags — headless feature-flag evaluation, OpenFeature-SHAPED but dependency-free
// (the vocabulary is mirrored structurally, exactly as `forms-engine/StandardSchema.ts` vendors the
// Standard Schema spec — see FlagTypes.ts for the three deliberate divergences).
//
// `createFlagClient({ provider })` evaluates boolean / string / number / JSON-object flags against a
// `FlagProvider` — the one seam a backend adapter implements. Every evaluation is TOTAL: it returns
// the type asked for and never throws, falling back to the caller's `defaultValue` on a miss
// ('default'), an off switch ('disabled'), a wrong wire type ('error' + 'type-mismatch') or a
// throwing provider ('error' + 'provider-error'); `onError` is the only channel that surfaces a
// fault. `staticFlagProvider(flags)` ships in the box as the test double and local-dev default, with
// rule-based variants so targeting is exercised without a flag service. `FlagsProvider` + `useFlag`
// mirror `foundation/i18n`'s LocaleContext, standalone fallback included — a flag read works with no
// provider mounted. This subpath carries NO peer dependency (plain React) and NO UI: gates, banners,
// and admin panels stay app-side.
//
// Naming, once: `FlagProvider` (singular) = the backend adapter · `FlagsProvider` (plural) = the
// React component. Same split as the spec.

// Vocabulary — value types, evaluation result, targeting context
export {
  FlagReason,
  FlagErrorCode,
  type JsonPrimitive,
  type JsonValue,
  type JsonObject,
  type FlagValue,
  type ContextAttribute,
  type EvaluationContext,
  type FlagEvaluation,
  type FlagErrorInfo,
} from './FlagTypes';

// Backend seam — what a flag source implements
export type { FlagProvider, FlagResolution } from './FlagProvider';

// Built-in provider — test double + local-dev default, with rule-based targeting
export {
  staticFlagProvider,
  type StaticFlags,
  type StaticFlagEntry,
  type StaticFlagDefinition,
  type StaticFlagRule,
  type StaticFlagCondition,
} from './StaticFlagProvider';

// Evaluator — the app-facing client
export {
  createFlagClient,
  type FlagClient,
  type CreateFlagClientOptions,
  type FlagErrorListener,
  type FlagContextListener,
} from './FlagClient';

// React seam — provider component + hooks
export { FlagsProvider, useFlag, useFlags, type FlagsProviderProps } from './FlagsContext';

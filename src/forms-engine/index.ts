// @wow-two-beta/ui/forms-engine — the engine-free forms facade contract.
// One house surface (`useAppForm` options/result) implemented by swappable engine adapters;
// the seam is the import path: apps pin an engine once in `src/form.ts`
// (`export { useAppForm } from '@wow-two-beta/ui/forms-engine/house'`) and screens import
// from `@/form` — changing engines is editing that one line. This entry carries the contract
// types, the vendored Standard Schema v1 spec types (zero runtime dep — any zod/valibot/arktype
// schema plugs in), the engine-free `Field`/`Subscribe` glue, and the server-error pipeline
// defaults (`fieldErrors` ProblemDetails mapping + camelCase path rewrite). Behavior across
// engines is pinned by the conformance suite (`conformance/FormEngineContract.shared.tsx`).
//
// Adapters: `/forms-engine/house` (zero deps, ships now) · `/forms-engine/tanstack`
// (default, optional peer — phase 2) · `/forms-engine/rhf` (phase 2+, on trigger).

// Facade contract (docs/analysis/forms-engine.md §4)
export type {
  AppFormOptions,
  AppFieldApi,
  AppFormState,
  AppFieldValue,
  AppFieldProps,
  AppFieldComponent,
  AppSubscribeProps,
  AppSubscribeComponent,
  AppArrayApi,
  AppForm,
  FormEngine,
} from './AppForm';

// Vendored Standard Schema v1 spec types (types-only, MIT — https://standardschema.dev)
export type { StandardSchemaV1 } from './StandardSchema';

// Server-error path rewrite default — exported so apps can wrap it (`mapFieldPath`)
export { defaultMapFieldPath } from './SubmitErrors';

// Adapter-author seams — building blocks the in-repo adapters share (house now, tanstack phase 2)
export { createFieldComponent, createSubscribeComponent } from './FormGlue';
export { resolveSubmitFailure, toApiError, type SubmitFailureResolution } from './SubmitErrors';
export { runStandardSchema, issuePathToString, resultToFieldErrors } from './SchemaValidation';
export {
  parsePath,
  formatPath,
  getPath,
  setPath,
  hasPath,
  type PathKey,
  type ArrayOperation,
} from './Paths';

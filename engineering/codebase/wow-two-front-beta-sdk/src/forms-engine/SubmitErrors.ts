import { ApiError } from '../foundation/http';

import { formatPath, parsePath } from './Paths';

/*
 * Server-error → form wiring shared by every adapter (R5): map a thrown submit error
 * to `path → messages` (default: `foundation/http` `fieldErrors`, both .NET shapes),
 * rewrite each server path onto a form path, land matches on fields, and coerce the
 * remainder into the form-level `submitError`.
 */

/** Rewrites a server error path onto a form path — camelCase per property segment (`Rules[0].Destination` → `rules[0].destination`). */
export function defaultMapFieldPath(serverPath: string): string {
  const segments = parsePath(serverPath).map((segment) =>
    typeof segment === 'string' && segment.length > 0
      ? segment.charAt(0).toLowerCase() + segment.slice(1)
      : segment,
  );
  return formatPath(segments);
}

/**
 * Coerces any thrown value into the SDK `ApiError` — passes through an `ApiError`, wraps
 * everything else as status `0` (mirrors `/query`'s coercion). `fallbackMessage` is the
 * message for a throw that carries none of its own (not an `ApiError`, `Error`, or string) —
 * overridable for i18n; defaults to the English `'Unknown error'`.
 */
export function toApiError(error: unknown, fallbackMessage = 'Unknown error'): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return new ApiError(0, null, error.message);
  return new ApiError(0, null, typeof error === 'string' ? error : fallbackMessage);
}

/** The outcome of resolving a thrown submit error: per-field server errors + the form-level remainder. */
export interface SubmitFailureResolution {
  /** Mapped messages whose form path matched a field — apply as the server-error overlay. */
  readonly fieldErrors: Record<string, string[]>;
  /** The coerced failure when it was not fully represented on fields (no or partial path matches); `null` when every mapped path landed. */
  readonly submitError: ApiError | null;
}

/**
 * Resolves a thrown submit error: `mapSubmitError` → `mapFieldPath` per entry →
 * partition by `isKnownField`. Matches become field errors; if nothing matched — or
 * some messages could not be placed — the coerced error also lands in `submitError`
 * so no server message silently disappears.
 */
export function resolveSubmitFailure(
  error: unknown,
  mapSubmitError: (error: unknown) => Record<string, string[]>,
  mapFieldPath: (serverPath: string) => string,
  isKnownField: (path: string) => boolean,
  fallbackMessage?: string,
): SubmitFailureResolution {
  const mapped = mapSubmitError(error);
  const matched: Record<string, string[]> = {};
  let unplaced = false;
  for (const [serverPath, messages] of Object.entries(mapped)) {
    const formPath = mapFieldPath(serverPath);
    if (isKnownField(formPath)) {
      (matched[formPath] ??= []).push(...messages);
    } else {
      unplaced = true;
    }
  }
  const hasMatches = Object.keys(matched).length > 0;
  return {
    fieldErrors: matched,
    submitError: !hasMatches || unplaced ? toApiError(error, fallbackMessage) : null,
  };
}

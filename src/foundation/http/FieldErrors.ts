import { ApiError } from './ApiError';

/**
 * Extracts the per-field validation messages from a thrown error — the `errors` member of an
 * {@link ApiError}'s problem body, normalized to `field → messages` for mapping onto form fields.
 * Handles both the ASP.NET ValidationProblemDetails / ModelState dict (`{ field: string[] }`,
 * a bare string value counts as one message) and the wow-two backend's array shape
 * (`[{ property, message }]`, grouped by property). Anything else — non-`ApiError`, no problem
 * body, no `errors` member — yields `{}` so callers can map unconditionally.
 */
export function fieldErrors(error: unknown): Record<string, string[]> {
  if (!(error instanceof ApiError)) return {};
  const errors = error.problem?.errors;

  if (Array.isArray(errors)) {
    const map: Record<string, string[]> = {};
    for (const entry of errors as unknown[]) {
      if (entry === null || typeof entry !== 'object') continue;
      const { property, message } = entry as { property?: unknown; message?: unknown };
      if (typeof property !== 'string' || typeof message !== 'string') continue;
      (map[property] ??= []).push(message);
    }
    return map;
  }

  if (errors !== null && typeof errors === 'object') {
    const map: Record<string, string[]> = {};
    for (const [field, value] of Object.entries(errors)) {
      const messages = (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string');
      if (messages.length > 0) map[field] = messages;
    }
    return map;
  }

  return {};
}

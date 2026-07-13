import type { ProblemDetails } from './ProblemDetails';

/** Defines a typed transport error thrown on a non-2xx response (or network status `0`), carrying the HTTP status and parsed problem body. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(status: number, problem: ProblemDetails | null, message?: string) {
    super(message ?? problem?.title ?? problem?.detail ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
    // Restore prototype chain — required when subclassing built-ins under transpiled targets.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

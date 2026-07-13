import { ApiError } from '../foundation/http';

/** Coerces any thrown value into the SDK `ApiError` — passes through an `ApiError`, wraps everything else as status `0` (network / unknown). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return new ApiError(0, null, error.message);
  return new ApiError(0, null, typeof error === 'string' ? error : 'Unknown error');
}

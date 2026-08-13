import { getErrorMessage } from '../foundation/errors';
import { ApiError } from '../foundation/http';

/**
 * Coerces any thrown value into the SDK `ApiError` — passes through an `ApiError`, wraps everything
 * else as status `0` (network / unknown) with the message `getErrorMessage` reads off it, so an
 * `Error` from another realm (iframe · worker) keeps its message instead of failing `instanceof`.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, null, getErrorMessage(error, 'Unknown error'));
}

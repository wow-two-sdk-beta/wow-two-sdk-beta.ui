// The one-shot read: `navigator.geolocation.getCurrentPosition` turned from a two-callback platform call into
// an awaitable that resolves to a typed result.
//
// DEFINING CONTRACT: NOTHING HERE THROWS, and the returned promise never rejects. This is called straight from
// a click handler, where a rejection nobody caught is an unhandled error and the user sees nothing happen at
// all. Missing API, denial, no fix, timeout, an unreadable position, even a platform call that throws
// synchronously — every path resolves to a `PositionResult` the caller switches on.
//
// SETTLE-ONCE. A promise executor can only settle once, but the platform hands us two callbacks and there is no
// contract we control that says exactly one of them fires. A partial polyfill firing both — or a watch-style
// implementation calling success repeatedly — would make every call after the first a silent no-op that is
// invisible in a debugger. The explicit `settled` flag makes "first answer wins" a stated rule rather than a
// side effect of how promises happen to work.
//
// NO TIMEOUT IS ADDED HERE. With no `timeout` option the platform waits indefinitely, and this module does not
// impose a default: silently answering `timeout` at some invented deadline while the real request is still
// running would report a failure the platform never had. A caller that needs a bound passes one — see
// `PositionRequestOptions.timeout`, which documents why it usually should.

import { toError } from '../errors';

import { geolocationApi } from './CanLocate';
import { toPositionResult, toPositionSuccess, type PositionRequestOptions, type PositionResult } from './PositionResult';

/**
 * Reads the device's current position once.
 *
 * The first call from an origin triggers the browser's permission prompt, so call it from a user gesture: a
 * prompt with no visible cause is the one users reflexively dismiss, and a dismissal is a `denied` that sticks.
 *
 * Never throws, never rejects — every outcome, including the absence of the API, arrives as a
 * {@link PositionResult}.
 *
 * @param options Accuracy / timeout / cache-age tuning. See {@link PositionRequestOptions}.
 * @returns The outcome: a fix, a typed refusal (`denied` / `unavailable` / `timeout`), `unsupported`, or `failed`.
 */
export function getCurrentPosition(options?: PositionRequestOptions): Promise<PositionResult> {
  const api = geolocationApi();
  if (api === undefined) return Promise.resolve({ status: 'unsupported' });

  return new Promise<PositionResult>((resolve) => {
    let settled = false;

    /** Resolves with the first answer and ignores every later one. See the header. */
    const settle = (result: PositionResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    try {
      api.getCurrentPosition(
        (raw) => settle(toPositionSuccess(raw)),
        (error) => settle(toPositionResult(error)),
        options,
      );
    } catch (error) {
      // A synchronous throw from the platform call itself — an insecure context on some engines, a stand-in
      // with the wrong arity. The API was present, so this is `failed`, not `unsupported`.
      settle({ status: 'failed', error: toError(error) });
    }
  });
}

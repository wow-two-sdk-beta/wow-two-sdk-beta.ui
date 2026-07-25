// Network reachability — or as much of it as the browser is willing to admit to.
//
// WHAT `navigator.onLine` ACTUALLY MEANS: it is `false` only when the browser is certain there is NO network link
// — airplane mode, Wi-Fi off, cable unplugged. It is `true` the moment a link exists and says NOTHING beyond that.
// A captive portal nobody has logged into, hotel Wi-Fi that has not been paid for, a dropped VPN, a DNS failure,
// or an API that is simply down all report `true`. So `false` is trustworthy and `true` is a hint.
//
// USE ACCORDINGLY: explain a failure that already happened ("you appear to be offline"), defer a retry, pause a
// poll. Never treat `true` as a precondition — "we are online, so this request will succeed" is exactly the
// inference this value cannot support. Proving the server that matters is reachable takes a request to it, which
// is `foundation/http`'s job and not this slice's.
//
// The `online` / `offline` events bind through `foundation/hooks`' `useEventListener` rather than a hand-rolled
// `addEventListener`, so handler identity, attach options, and unmount cleanup follow the same rules as every
// other listener in the library.

import { useEffect, useState } from 'react';

import { useEventListener } from '../hooks';

// Resolved once at module load: `window` in the browser, `null` on the server. `useEventListener` treats `null` as
// "nothing to bind", so the SSR path needs no branch of its own. The reference is stable, so it never re-triggers
// the listener effect.
const globalTarget = typeof window === 'undefined' ? null : window;

/**
 * Reads `navigator.onLine`, defaulting to online when there is no `navigator` (SSR), when the property is missing
 * (a partial polyfill), or when the read throws. Optimistic by design — see the note on the hook.
 */
function readOnlineStatus(): boolean {
  try {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine !== false;
  } catch {
    return true;
  }
}

/**
 * Tracks whether the browser believes it has a network link — seeded from `navigator.onLine`, then kept current by
 * the window `online` / `offline` events.
 *
 * Returns `true` under SSR and whenever the status cannot be read: an offline banner rendered by a server that has
 * never met the client is worse than a missing one, and the value corrects on mount either way. Read this file's
 * header before acting on it — `false` is reliable, `true` only means a link exists.
 *
 * @returns `true` while the browser reports a network link.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(readOnlineStatus);

  // Re-read once on mount. Two gaps the events alone can never close: SSR seeded `true` unconditionally, and the
  // link can flip between the first render and the listeners attaching. A no-op on the common path — React bails
  // out when the value is unchanged.
  useEffect(() => {
    setOnline(readOnlineStatus());
  }, []);

  useEventListener('online', () => setOnline(true), globalTarget);
  useEventListener('offline', () => setOnline(false), globalTarget);

  return online;
}

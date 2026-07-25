// The React binding: ties one worker's lifetime to one component's, so a mounted component owns a worker
// and an unmounted one does not.
//
// TERMINATION ON UNMOUNT IS THE WHOLE POINT. A `Worker` is an OS thread with its own JS heap; it is not
// garbage-collected when the last reference to it drops, because the thread itself is a root. A component
// that creates one and navigates away leaks a live thread for the rest of the session, and a list that
// mounts one per row leaks one per row. So the cleanup calls `client.terminate()` — which also rejects
// every in-flight call, releasing any `await` still parked on the unmounted component.
//
// THE FACTORY IS READ FROM A REF AND THE EFFECT HAS EMPTY DEPS — that pairing IS the identity guard the
// brief asks for. The natural call site passes an inline arrow:
//
//   const { client } = useWorker(() => new Worker(url, { type: 'module' }));
//
// which is a new function object every render. With `[factory]` deps, every render would tear down the
// thread and spawn a fresh one — pathological, and it would surface as calls rejecting mid-flight for no
// visible reason. Empty deps mean the worker is created exactly once per mount and the factory identity is
// irrelevant, which is the behaviour a consumer expects. The cost is that the factory is captured at
// mount: changing what it returns later does NOT swap the worker. Remount to swap — a `key` on the
// component, which is the honest React idiom for "this is a different resource now".
//
// SSR: the worker is created in an effect, and effects do not run on the server, so nothing here can touch
// the `Worker` constructor during a server render. `client` is therefore `null` on the server and on the
// first client render, non-null from the first commit onward. `supported` is likewise set in the effect
// rather than read during render — reading a browser capability at render time is exactly what produces a
// hydration mismatch, where the server's `false` and the client's `true` disagree on the first pass.

import { useEffect, useRef, useState } from 'react';

import { createWorkerClient, type WorkerApiOf, type WorkerClient, type WorkerClientOptions } from './WorkerClient';
import { isWorkerSupported } from './WorkerSupport';

/** What {@link useWorker} returns. */
export interface UseWorkerResult<TApi extends WorkerApiOf<TApi>> {
  /**
   * The typed client, or `null` before the first commit and in any runtime without `Worker`.
   *
   * Guard on it (`client?.call(...)`) rather than asserting: the `null` window is real on the very first
   * render, so an effect or event handler firing before the worker exists must have a defined answer.
   */
  readonly client: WorkerClient<TApi> | null;

  /**
   * Whether this runtime can spawn a worker, as determined after mount. `false` during SSR and on the
   * first render — before the effect runs it is not yet knowable, and claiming otherwise at render time
   * would desync hydration.
   */
  readonly supported: boolean;
}

/** Holds both fields so one state write covers them and a mount cannot render an inconsistent pair. */
interface WorkerState<TApi extends WorkerApiOf<TApi>> {
  /** The live client, or `null`. */
  readonly client: WorkerClient<TApi> | null;

  /** The post-mount capability answer. */
  readonly supported: boolean;
}

/**
 * Owns a worker for the lifetime of the calling component: created on mount, terminated on unmount.
 *
 * ```ts
 * const { client } = useWorker<MathApi>(() => new Worker(new URL('./math.worker.ts', import.meta.url), { type: 'module' }));
 * const sum = await client?.call('add', 2, 3);
 * ```
 *
 * The factory is invoked once per mount and its identity is ignored afterwards, so an inline arrow is the
 * expected call shape. `options` is read from a ref for the same reason — a fresh `{ onError }` literal
 * each render must not churn the worker.
 *
 * Under React's StrictMode the effect runs twice in development: the first worker is terminated by the
 * first cleanup and a second is created. That is correct, not a leak, and is the intended proof that the
 * cleanup works.
 */
export function useWorker<TApi extends WorkerApiOf<TApi>>(
  factory: () => Worker,
  options?: WorkerClientOptions,
): UseWorkerResult<TApi> {
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [state, setState] = useState<WorkerState<TApi>>({ client: null, supported: false });

  useEffect(() => {
    if (!isWorkerSupported()) {
      setState({ client: null, supported: false });
      return;
    }

    const client = createWorkerClient<TApi>(factoryRef.current(), optionsRef.current);
    setState({ client, supported: true });

    return () => {
      // Rejects everything in flight as well as killing the thread — an `await` left over from the
      // unmounted component gets an error instead of hanging forever.
      client.terminate();
      setState({ client: null, supported: false });
    };
    // Empty deps by design — see the header. The refs keep the latest factory / options reachable without
    // making either one a reason to respawn the thread.
  }, []);

  return state;
}

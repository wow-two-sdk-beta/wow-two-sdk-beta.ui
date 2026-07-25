// React binding for `createLeaderElection` — joins on mount, resigns and leaves on unmount.
//
// WHY THE UNMOUNT PATH MATTERS MORE THAN USUAL: `close` resigns first, so an unmounting leader hands over in a
// claim window (~150ms) instead of leaving its peers to wait out the full lease (~3.5s) for a tab that is
// perfectly alive and simply navigating. The expiry path stays as the backstop for the tab that dies without
// ever running this cleanup.
//
// `isLeader` STARTS FALSE, ALWAYS. There is no election on the server, and no synchronous answer on the client
// either — a fresh participant is a candidate until its claim window closes. So the first render is always a
// follower, and leadership arrives in a later render. That makes the hook SSR-safe by construction (server and
// client agree on the first paint) and means leader-only work belongs in an effect keyed on `isLeader`, never
// in a render branch that assumes the answer is settled.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Guid } from '../identifiers';

import { createLeaderElection, type LeaderElection, type LeaderElectionOptions } from './LeaderElection';

/** Reports this tab's standing in an election, as React state. */
export interface LeaderElectionState {
  /** Reports whether this tab currently holds leadership; false on the first render and under SSR. */
  readonly isLeader: boolean;

  /** Identifies this participant, or null before the election is joined (first render, SSR). */
  readonly id: Guid | null;

  /** Surrenders leadership deliberately, handing over to a peer; a no-op when not leading. */
  readonly release: () => void;
}

/**
 * Joins the named leader election for the lifetime of the component, re-rendering when this tab gains or loses
 * leadership.
 *
 * Exactly one participating tab leads at a time; a tab that dies is superseded once its lease expires. Use it to
 * elect the single tab that opens the socket, runs the poll, or shows the notification.
 *
 * @param name - Election name; tabs sharing it on this origin compete for one leadership.
 * @param options - Timing and channel configuration, read once when the election is joined.
 * @returns The current standing plus a stable `release`.
 */
export function useLeaderElection(name: string, options?: LeaderElectionOptions): LeaderElectionState {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const electionRef = useRef<LeaderElection | null>(null);
  const [standing, setStanding] = useState<{ isLeader: boolean; id: Guid | null }>({
    isLeader: false,
    id: null,
  });

  useEffect(() => {
    const election = createLeaderElection(name, optionsRef.current);
    electionRef.current = election;

    // Publish the id immediately; leadership itself is decided later, by the transition callbacks.
    setStanding({ isLeader: election.isLeader, id: election.id });

    const offBecome = election.onBecomeLeader(() => setStanding({ isLeader: true, id: election.id }));
    const offLose = election.onLoseLeader(() => setStanding({ isLeader: false, id: election.id }));

    return () => {
      offBecome();
      offLose();
      election.close();
      electionRef.current = null;
      setStanding({ isLeader: false, id: null });
    };
  }, [name]);

  const release = useCallback(() => {
    electionRef.current?.release();
  }, []);

  return useMemo(
    () => ({ isLeader: standing.isLeader, id: standing.id, release }),
    [standing.isLeader, standing.id, release],
  );
}

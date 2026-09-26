import { useCallback } from 'react';

export interface VisitInvitationRecord {
  invitations: number;
  lastInvitationAt?: string;
  completedAt?: string;
  hiddenPermanently: boolean;
}

export interface VisitInvitationPolicy {
  maxInvitations: number;
  retryDelayMs: number;
  completedRetryDelayMs: number;
}

export function isVisitInvitationDue(
  record: VisitInvitationRecord,
  policy: VisitInvitationPolicy,
  now = Date.now(),
): boolean {
  if (record.hiddenPermanently || record.invitations >= policy.maxInvitations) return false;
  if (record.invitations === 0) return true;
  const previous = record.lastInvitationAt ? Date.parse(record.lastInvitationAt) : Number.NaN;
  if (!Number.isFinite(previous)) return false;
  return (
    now - previous >= (record.completedAt ? policy.completedRetryDelayMs : policy.retryDelayMs)
  );
}

export function useVisitInvitation({
  record,
  policy,
  onChange,
}: {
  record: VisitInvitationRecord;
  policy: VisitInvitationPolicy;
  onChange: (record: VisitInvitationRecord) => void;
}) {
  const recordInvitation = useCallback(
    (now = new Date()) => {
      const invitations = Math.min(policy.maxInvitations, record.invitations + 1);
      const next = {
        ...record,
        invitations,
        lastInvitationAt: now.toISOString(),
        hiddenPermanently: invitations >= policy.maxInvitations,
      };
      onChange(next);
      return next;
    },
    [onChange, policy.maxInvitations, record],
  );
  const markCompleted = useCallback(
    (now = new Date()) => onChange({ ...record, completedAt: now.toISOString() }),
    [onChange, record],
  );
  return { isDue: isVisitInvitationDue(record, policy), recordInvitation, markCompleted };
}

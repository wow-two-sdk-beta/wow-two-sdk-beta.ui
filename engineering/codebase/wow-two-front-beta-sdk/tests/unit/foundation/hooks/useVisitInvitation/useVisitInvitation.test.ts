import { describe, expect, it } from 'vitest';
import { isVisitInvitationDue } from '@src/foundation/hooks/useVisitInvitation';

const policy = {
  maxInvitations: 2,
  retryDelayMs: 12 * 60 * 60 * 1000,
  completedRetryDelayMs: 7 * 24 * 60 * 60 * 1000,
};
const now = Date.parse('2026-09-25T12:00:00Z');

describe('isVisitInvitationDue', () => {
  it('invites immediately, then respects skip and completion delays', () => {
    expect(isVisitInvitationDue({ invitations: 0, hiddenPermanently: false }, policy, now)).toBe(
      true,
    );
    expect(
      isVisitInvitationDue(
        { invitations: 1, lastInvitationAt: '2026-09-25T01:00:01Z', hiddenPermanently: false },
        policy,
        now,
      ),
    ).toBe(false);
    expect(
      isVisitInvitationDue(
        { invitations: 1, lastInvitationAt: '2026-09-25T00:00:00Z', hiddenPermanently: false },
        policy,
        now,
      ),
    ).toBe(true);
    expect(
      isVisitInvitationDue(
        {
          invitations: 1,
          lastInvitationAt: '2026-09-19T12:00:01Z',
          completedAt: '2026-09-19T12:05:00Z',
          hiddenPermanently: false,
        },
        policy,
        now,
      ),
    ).toBe(false);
    expect(
      isVisitInvitationDue(
        {
          invitations: 1,
          lastInvitationAt: '2026-09-18T12:00:00Z',
          completedAt: '2026-09-18T12:05:00Z',
          hiddenPermanently: false,
        },
        policy,
        now,
      ),
    ).toBe(true);
  });
  it('stops at the maximum or permanent dismissal', () => {
    expect(isVisitInvitationDue({ invitations: 2, hiddenPermanently: false }, policy, now)).toBe(
      false,
    );
    expect(isVisitInvitationDue({ invitations: 0, hiddenPermanently: true }, policy, now)).toBe(
      false,
    );
  });
});

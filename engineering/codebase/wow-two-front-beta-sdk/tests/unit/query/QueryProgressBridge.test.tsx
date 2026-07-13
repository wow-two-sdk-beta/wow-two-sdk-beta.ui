import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
// Deep path — must match the component's rrd-free deep import so the mock intercepts it.
import { useNavigationProgress, type NavigationProgressState } from '@src/router/UseNavigationProgress';

import { QueryProgressBridge } from '@src/query/QueryProgressBridge';

vi.mock('@tanstack/react-query', () => ({
  useIsFetching: vi.fn(() => 0),
  useIsMutating: vi.fn(() => 0),
}));

vi.mock('@src/router/UseNavigationProgress', () => ({
  useNavigationProgress: vi.fn(),
}));

const mockFetching = vi.mocked(useIsFetching);
const mockMutating = vi.mocked(useIsMutating);
const mockProgress = vi.mocked(useNavigationProgress);

// `begin` returns the span-scoped `end` — the two spies we assert on.
const endSpan = vi.fn();
const begin = vi.fn(() => endSpan);

function makeProgressState(): NavigationProgressState {
  return { isBusy: false, begin, end: vi.fn(), track: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetching.mockReturnValue(0);
  mockMutating.mockReturnValue(0);
  mockProgress.mockReturnValue(makeProgressState());
});

describe('QueryProgressBridge', () => {
  it('begins a manual span on 0→1 and ends it on 1→0, once each', () => {
    const { rerender } = render(<QueryProgressBridge />);
    expect(begin).not.toHaveBeenCalled();

    mockFetching.mockReturnValue(1); // 0 → 1
    rerender(<QueryProgressBridge />);
    expect(begin).toHaveBeenCalledTimes(1);
    expect(endSpan).not.toHaveBeenCalled();

    mockFetching.mockReturnValue(0); // 1 → 0
    rerender(<QueryProgressBridge />);
    expect(begin).toHaveBeenCalledTimes(1);
    expect(endSpan).toHaveBeenCalledTimes(1);
  });

  it('counts mutations as activity, not just fetches', () => {
    const { rerender } = render(<QueryProgressBridge />);
    expect(begin).not.toHaveBeenCalled();

    mockMutating.mockReturnValue(1);
    rerender(<QueryProgressBridge />);
    expect(begin).toHaveBeenCalledTimes(1);
  });

  it('does not re-begin while activity stays positive', () => {
    mockFetching.mockReturnValue(1);
    const { rerender } = render(<QueryProgressBridge />);
    expect(begin).toHaveBeenCalledTimes(1);

    mockMutating.mockReturnValue(1); // still busy (2 total), a new source joined
    rerender(<QueryProgressBridge />);
    expect(begin).toHaveBeenCalledTimes(1); // no duplicate begin
    expect(endSpan).not.toHaveBeenCalled();
  });

  it('ends an in-flight span when the bridge unmounts', () => {
    mockFetching.mockReturnValue(1);
    const { unmount } = render(<QueryProgressBridge />);
    expect(begin).toHaveBeenCalledTimes(1);

    unmount();
    expect(endSpan).toHaveBeenCalledTimes(1);
  });
});

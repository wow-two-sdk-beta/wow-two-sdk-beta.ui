import '@testing-library/jest-dom/vitest';
import type { ReactElement, ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useNavigation, type Navigation } from 'react-router-dom';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';

import { NavigationProgress } from './NavigationProgress';
import { ProgressProvider, useNavigationProgress } from './UseNavigationProgress';

// Mock only `useNavigation` so route-state show/hide is deterministic without driving a real
// loader navigation (react-router v7 + jsdom mismatches undici's AbortSignal). The rest of
// react-router-dom (RouterProvider / createMemoryRouter) stays real so context is intact.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigation: vi.fn<() => Navigation>() };
});

const mockUseNavigation = vi.mocked(useNavigation);

/** Builds a minimal Navigation with the given state — only `.state` is read by the component. */
function navigation(state: Navigation['state']): Navigation {
  return { state } as unknown as Navigation;
}

/** Renders UI at `/` inside a data router so context is present; route state comes from the mock. */
function renderStatic(ui: ReactNode) {
  const router = createMemoryRouter([{ path: '/', element: ui }], { initialEntries: ['/'] });
  return render(<RouterProvider router={router} />);
}

/** Exposes the manual begin/end controls as buttons so tests can drive the shared indicator. */
function Controls() {
  const { begin, end } = useNavigationProgress();
  return (
    <>
      <button onClick={() => begin()}>begin</button>
      <button onClick={() => end()}>end</button>
    </>
  );
}

/** Renders the indicator with begin/end controls under a provider + idle router. */
function renderManual(node: ReactElement) {
  return renderStatic(
    <ProgressProvider>
      {node}
      <Controls />
    </ProgressProvider>,
  );
}

afterEach(cleanup);

beforeEach(() => {
  mockUseNavigation.mockReturnValue(navigation('idle'));
});

describe('NavigationProgress — auto (route) mode', () => {
  it('is hidden while navigation is idle', () => {
    mockUseNavigation.mockReturnValue(navigation('idle'));
    renderStatic(<NavigationProgress />);

    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('shows while a route navigation is loading', () => {
    mockUseNavigation.mockReturnValue(navigation('loading'));
    renderStatic(<NavigationProgress />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows while a route navigation is submitting', () => {
    mockUseNavigation.mockReturnValue(navigation('submitting'));
    renderStatic(<NavigationProgress />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('NavigationProgress — manual (backend) mode', () => {
  it('shows on begin() and hides on the matching end()', () => {
    renderManual(<NavigationProgress mode="manual" />);

    expect(screen.queryByRole('progressbar')).toBeNull();

    fireEvent.click(screen.getByText('begin'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    fireEvent.click(screen.getByText('end'));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('stays visible until the last of several manual spans ends (ref-count)', () => {
    renderManual(<NavigationProgress mode="manual" />);

    fireEvent.click(screen.getByText('begin'));
    fireEvent.click(screen.getByText('begin'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    fireEvent.click(screen.getByText('end'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // one span open

    fireEvent.click(screen.getByText('end'));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('ignores route-nav state — stays hidden while the route is loading', () => {
    mockUseNavigation.mockReturnValue(navigation('loading'));
    renderManual(<NavigationProgress mode="manual" />);

    // Route is loading but mode is manual → only manual spans surface it.
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('NavigationProgress — both mode', () => {
  it('surfaces on manual busy even while the route is idle', () => {
    renderManual(<NavigationProgress mode="both" />);

    expect(screen.queryByRole('progressbar')).toBeNull();
    fireEvent.click(screen.getByText('begin'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('surfaces on route-nav busy even while no manual span is open', () => {
    mockUseNavigation.mockReturnValue(navigation('loading'));
    renderManual(<NavigationProgress mode="both" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('NavigationProgress — variant switch', () => {
  it("variant='bar' (default) renders the indeterminate slide with a reduced-motion fallback", () => {
    renderManual(<NavigationProgress mode="manual" />);
    fireEvent.click(screen.getByText('begin'));
    const bar = screen.getByRole('progressbar');

    expect(bar).toHaveAttribute('data-variant', 'bar');
    const segment = bar.querySelector('div');
    expect(segment).not.toBeNull();
    expect(segment).toHaveClass('animate-indeterminate');
    expect(segment).toHaveClass('motion-reduce:animate-none');
  });

  it("variant='heartbeat' renders the pulsing ring with a reduced-motion fallback", () => {
    renderManual(<NavigationProgress variant="heartbeat" mode="manual" />);
    fireEvent.click(screen.getByText('begin'));
    const beat = screen.getByRole('progressbar');

    expect(beat).toHaveAttribute('data-variant', 'heartbeat');
    const ring = beat.querySelector('.animate-ping');
    expect(ring).not.toBeNull();
    expect(ring).toHaveClass('motion-reduce:hidden');
  });
});

describe('NavigationProgress — accessibility', () => {
  it('exposes role=progressbar, aria-busy, and a default aria-label', () => {
    renderManual(<NavigationProgress mode="manual" />);
    fireEvent.click(screen.getByText('begin'));

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-busy', 'true');
    expect(bar).toHaveAttribute('aria-label', 'Loading');
  });

  it('honors a custom aria-label', () => {
    renderManual(<NavigationProgress mode="manual" aria-label="Fetching transcripts" />);
    fireEvent.click(screen.getByText('begin'));

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Fetching transcripts');
  });
});

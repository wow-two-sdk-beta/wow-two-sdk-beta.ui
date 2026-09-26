import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton } from '@src/presentation/feedback/skeleton/Skeleton';

afterEach(cleanup);

/*
 * The skeleton-swap pattern: a region keeps its labels and layout while only its values turn into
 * placeholders — for a first load and for a user-requested refresh alike.
 */
describe('Skeleton parts', () => {
  function Region(props: { loading: boolean; override?: boolean }) {
    return (
      <Skeleton.Group loading={props.loading} data-testid="region">
        <span>CPU load</span>
        <Skeleton.Slot data-testid="value">42%</Skeleton.Slot>
        <Skeleton.Slot block data-testid="bar">
          <div style={{ height: 8, width: 120 }} />
        </Skeleton.Slot>
        <Skeleton.Slot data-testid="pinned" {...(props.override === undefined ? {} : { loading: props.override })}>
          pinned
        </Skeleton.Slot>
      </Skeleton.Group>
    );
  }

  it('turns every slot into a placeholder, announces once, and keeps labels', () => {
    render(<Region loading />);
    expect(screen.getByTestId('region')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText('CPU load')).toBeVisible();
    for (const id of ['value', 'bar']) {
      const slot = screen.getByTestId(id);
      expect(slot).toHaveAttribute('data-loading', 'true');
      expect(slot).toHaveAttribute('aria-hidden', 'true');
      expect(slot.className).toContain('bg-muted');
    }
  });

  it('keeps the content size while loading', () => {
    const { rerender } = render(<Region loading={false} />);
    const loaded = screen.getByTestId('bar').getBoundingClientRect();
    rerender(<Region loading />);
    const loading = screen.getByTestId('bar').getBoundingClientRect();
    expect([loading.width, loading.height]).toEqual([loaded.width, loaded.height]);
  });

  it('renders plain content once loaded', () => {
    render(<Region loading={false} />);
    expect(screen.getByTestId('region')).not.toHaveAttribute('aria-busy');
    expect(screen.queryByRole('status')).toBeNull();
    const value = screen.getByTestId('value');
    expect(value).not.toHaveAttribute('data-loading');
    expect(value.className).not.toContain('bg-muted');
    expect(value).toHaveTextContent('42%');
  });

  it('hides a value even when the slot carries its own text colour', () => {
    render(
      <Skeleton.Group loading>
        <Skeleton.Slot data-testid="muted" className="text-xs text-muted-foreground">up 3d</Skeleton.Slot>
      </Skeleton.Group>,
    );
    const slot = screen.getByTestId('muted');
    expect(slot.className).toContain('text-transparent');
    expect(slot.className).not.toContain('text-muted-foreground');
    expect(slot.className).toContain('text-xs');
  });

  it('lets a slot override the group', () => {
    render(<Region loading override={false} />);
    expect(screen.getByTestId('pinned')).not.toHaveAttribute('data-loading');
  });

  it('draws a paragraph with a shorter last line', () => {
    const { container } = render(<Skeleton.Text lines={3} lastLineWidth="40%" />);
    const lines = container.querySelectorAll('[aria-hidden="true"] > div');
    expect(lines).toHaveLength(3);
    expect((lines[2] as HTMLElement).style.width).toBe('40%');
  });

  it('takes the group animation unless told otherwise', () => {
    render(
      <Skeleton.Group loading animation="shimmer">
        <Skeleton data-testid="inherits" />
        <Skeleton data-testid="own" animation="none" />
      </Skeleton.Group>,
    );
    expect(screen.getByTestId('inherits').className).toContain('before:animate-(--animate-shimmer)');
    expect(screen.getByTestId('own').className).not.toContain('animate-');
  });
});

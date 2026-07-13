import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Slot, Slottable } from '@src/foundation/primitives/slot/Slot';

afterEach(cleanup);

describe('Slot — single child (no Slottable)', () => {
  it('clones the only child, concatenating className and forwarding props', () => {
    render(
      <Slot className="from-slot" data-testid="probe">
        <a href="/x" className="from-child">
          Link
        </a>
      </Slot>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('from-slot', 'from-child');
    expect(link).toHaveAttribute('data-testid', 'probe');
    expect(link).toHaveAttribute('href', '/x');
  });

  it('composes the forwarded ref onto the child node', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Slot ref={ref}>
        <a href="/x">Link</a>
      </Slot>,
    );
    expect(ref.current).toBe(screen.getByRole('link'));
  });
});

describe('Slot — Slottable (multiple children)', () => {
  it('uses the Slottable child as the merge target and composes siblings around its content, in order', () => {
    render(
      <Slot className="row">
        <span data-testid="lead">lead</span>
        <Slottable>
          <a href="/x" className="own">
            label
          </a>
        </Slottable>
        <span data-testid="tail">tail</span>
      </Slot>,
    );

    // A single merged <a>, carrying both slot and child classes.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('row', 'own');
    expect(link).toHaveAttribute('href', '/x');
    // Siblings compose INSIDE the target, wrapped around its original content.
    expect(within(link).getByTestId('lead')).toBeInTheDocument();
    expect(within(link).getByTestId('tail')).toBeInTheDocument();
    expect(link).toHaveTextContent('leadlabeltail');
  });

  it('merges the forwarded ref onto the Slottable target, not a sibling', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Slot ref={ref}>
        <span>lead</span>
        <Slottable>
          <a href="/x">label</a>
        </Slottable>
      </Slot>,
    );
    expect(ref.current).toBe(screen.getByRole('link'));
  });
});

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { DirectionProvider } from '../directionProvider';
import { RovingFocusGroup, useRovingFocusItem, type Orientation } from './RovingFocusGroup';

afterEach(cleanup);

const item = (name: string) => screen.getByRole('button', { name });
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface ItemProps {
  label: string;
  isDisabled?: boolean;
  isActive?: boolean;
}

function Item({ label, isDisabled = false, isActive = false }: ItemProps) {
  const itemProps = useRovingFocusItem({ isActive });
  return (
    <button type="button" {...itemProps} disabled={isDisabled}>
      {label}
    </button>
  );
}

type Label = 'one' | 'two' | 'three';
const labels: Label[] = ['one', 'two', 'three'];

interface FixtureProps {
  orientation?: Orientation;
  canLoop?: boolean;
  disabledLabels?: Label[];
  activeLabel?: Label;
}

function Fixture({ orientation, canLoop, disabledLabels = [], activeLabel }: FixtureProps) {
  return (
    <>
      <button type="button">before</button>
      <RovingFocusGroup orientation={orientation} canLoop={canLoop}>
        {labels.map((label) => (
          <Item
            key={label}
            label={label}
            isDisabled={disabledLabels.includes(label)}
            isActive={activeLabel === label}
          />
        ))}
      </RovingFocusGroup>
      <button type="button">after</button>
    </>
  );
}

describe('RovingFocusGroup', () => {
  it('keeps exactly one tab stop — first item tabIndex 0, the rest -1', () => {
    render(<Fixture />);
    expect(item('one')).toHaveAttribute('tabindex', '0');
    expect(item('two')).toHaveAttribute('tabindex', '-1');
    expect(item('three')).toHaveAttribute('tabindex', '-1');
  });

  it('Tab enters the group at the tab stop and leaves past the remaining items', async () => {
    render(<Fixture />);
    await userEvent.click(item('before'));
    await waitFor(() => expect(item('before')).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(item('one')).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(item('after')).toHaveFocus());
  });

  it('moves focus with ArrowRight / ArrowLeft in the default horizontal orientation', async () => {
    render(<Fixture />);
    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(item('two')).toHaveFocus());
    // The tab stop roves with focus.
    expect(item('two')).toHaveAttribute('tabindex', '0');
    expect(item('one')).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(item('one')).toHaveFocus());
  });

  it('ignores vertical arrows in horizontal orientation', async () => {
    render(<Fixture />);
    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await sleep(50);
    expect(item('one')).toHaveFocus();
  });

  it('moves focus with ArrowDown / ArrowUp in vertical orientation and ignores horizontal arrows', async () => {
    render(<Fixture orientation="vertical" />);
    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('two')).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    await sleep(50);
    expect(item('two')).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(item('one')).toHaveFocus());
  });

  it('loops from the ends by default', async () => {
    render(<Fixture />);
    await userEvent.click(item('three'));
    await waitFor(() => expect(item('three')).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(item('one')).toHaveFocus());

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(item('three')).toHaveFocus());
  });

  it('clamps at both ends when canLoop is false', async () => {
    render(<Fixture canLoop={false} />);
    await userEvent.click(item('three'));
    await waitFor(() => expect(item('three')).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}');
    await sleep(50);
    expect(item('three')).toHaveFocus();

    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());
    await userEvent.keyboard('{ArrowLeft}');
    await sleep(50);
    expect(item('one')).toHaveFocus();
  });

  it('jumps to the first / last item with Home / End', async () => {
    render(<Fixture />);
    await userEvent.click(item('two'));
    await waitFor(() => expect(item('two')).toHaveFocus());

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(item('three')).toHaveFocus());

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(item('one')).toHaveFocus());
  });

  it('mirrors horizontal arrows in RTL', async () => {
    render(
      <DirectionProvider dir="rtl">
        <Fixture />
      </DirectionProvider>,
    );
    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());

    // In RTL, ArrowLeft moves forward and ArrowRight moves backward.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(item('two')).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(item('one')).toHaveFocus());
  });

  // Disabled items (native `disabled`, `aria-disabled="true"`, `data-disabled`)
  // are never valid roving stops — arrow navigation skips them per APG.
  it('skips disabled items with arrows in both directions — the tab stop never lands on them', async () => {
    render(<Fixture disabledLabels={['two']} />);
    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());

    // Forward: one → (two disabled, skipped) → three.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(item('three')).toHaveFocus());
    expect(item('three')).toHaveAttribute('tabindex', '0');
    expect(item('two')).toHaveAttribute('tabindex', '-1');
    expect(item('one')).toHaveAttribute('tabindex', '-1');

    // Backward: three → (two skipped) → one.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(item('one')).toHaveFocus());
    expect(item('one')).toHaveAttribute('tabindex', '0');
    expect(item('two')).toHaveAttribute('tabindex', '-1');
  });

  it('wrap-around skips disabled items at the edges', async () => {
    render(<Fixture disabledLabels={['three']} />);
    await userEvent.click(item('two'));
    await waitFor(() => expect(item('two')).toHaveFocus());

    // Forward from the last enabled item wraps past the disabled edge to the first.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(item('one')).toHaveFocus());

    // Backward from the first wraps past the disabled edge to the last enabled.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(item('two')).toHaveFocus());
  });

  it('Home lands on the first enabled item when the first is disabled', async () => {
    render(<Fixture disabledLabels={['one']} />);
    await userEvent.click(item('three'));
    await waitFor(() => expect(item('three')).toHaveFocus());

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(item('two')).toHaveFocus());
    expect(item('one')).toHaveAttribute('tabindex', '-1');
  });

  it('End lands on the last enabled item when the last is disabled', async () => {
    render(<Fixture disabledLabels={['three']} />);
    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(item('two')).toHaveFocus());
    expect(item('three')).toHaveAttribute('tabindex', '-1');
  });

  it('never gives the initial tab stop to a disabled item', async () => {
    render(<Fixture disabledLabels={['one']} />);
    await waitFor(() => expect(item('two')).toHaveAttribute('tabindex', '0'));
    expect(item('one')).toHaveAttribute('tabindex', '-1');
    expect(item('three')).toHaveAttribute('tabindex', '-1');
  });

  it('moves the tab stop to the nearest enabled item when the current stop becomes disabled', async () => {
    const { rerender } = render(<Fixture />);
    await userEvent.click(item('two'));
    await waitFor(() => expect(item('two')).toHaveAttribute('tabindex', '0'));

    rerender(<Fixture disabledLabels={['two']} />);
    // Nearest enabled item (next preferred) takes over the stop…
    await waitFor(() => expect(item('three')).toHaveAttribute('tabindex', '0'));
    // …and the disabled item drops out of the tab order.
    expect(item('two')).toHaveAttribute('tabindex', '-1');
    expect(item('one')).toHaveAttribute('tabindex', '-1');
  });

  it('makes the isActive item the tab stop while focus is outside the group', async () => {
    render(<Fixture activeLabel="two" />);
    await waitFor(() => expect(item('two')).toHaveAttribute('tabindex', '0'));
    expect(item('one')).toHaveAttribute('tabindex', '-1');
    expect(item('three')).toHaveAttribute('tabindex', '-1');

    await userEvent.click(item('before'));
    await waitFor(() => expect(item('before')).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(item('two')).toHaveFocus());
  });
});

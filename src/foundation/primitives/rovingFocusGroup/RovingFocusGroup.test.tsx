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

interface FixtureProps {
  orientation?: Orientation;
  canLoop?: boolean;
  isSecondDisabled?: boolean;
  activeLabel?: 'one' | 'two' | 'three';
}

function Fixture({ orientation, canLoop, isSecondDisabled = false, activeLabel }: FixtureProps) {
  return (
    <>
      <button type="button">before</button>
      <RovingFocusGroup orientation={orientation} canLoop={canLoop}>
        <Item label="one" isActive={activeLabel === 'one'} />
        <Item label="two" isDisabled={isSecondDisabled} isActive={activeLabel === 'two'} />
        <Item label="three" isActive={activeLabel === 'three'} />
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

  // KNOWN APG DIVERGENCE (documented in docs/testing.md): disabled items are
  // NOT skipped by arrow navigation. The roving tab stop (tabIndex 0) moves
  // onto the disabled item, DOM focus cannot follow, and navigation is stuck
  // in front of it. This test pins the CURRENT behavior — do not rewrite it to
  // assert the "correct" APG skip without changing the source first.
  it('does not skip disabled items — the tab stop lands on them while focus stays put (known APG divergence)', async () => {
    render(<Fixture isSecondDisabled />);
    await userEvent.click(item('one'));
    await waitFor(() => expect(item('one')).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    // The disabled item becomes the (unfocusable) tab stop…
    await waitFor(() => expect(item('two')).toHaveAttribute('tabindex', '0'));
    expect(item('one')).toHaveAttribute('tabindex', '-1');
    // …while DOM focus stays on the previous item.
    expect(item('one')).toHaveFocus();

    // A second ArrowRight still originates from item one, so navigation can
    // never get past the disabled item.
    await userEvent.keyboard('{ArrowRight}');
    await sleep(50);
    expect(item('one')).toHaveFocus();
    expect(item('two')).toHaveAttribute('tabindex', '0');
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

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  ResizablePanel,
  ResizablePanels,
  ResizableSeparator,
} from '@src/presentation/layout/resizablePanels/ResizablePanels';

const meta: Meta = {
  title: 'Layout/ResizablePanels',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const Pane = ({ label, tone }: { label: string; tone: string }) => (
  <div className={`flex h-full items-center justify-center text-base font-medium text-card-foreground ${tone}`}>
    {label}
  </div>
);

export const Horizontal: Story = {
  render: () => (
    <div className="h-64 w-[40rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="horizontal" defaultSizes={[30, 70]}>
        <ResizablePanel defaultSize={30} minSize={15}>
          <Pane label="Sidebar" tone="bg-muted" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={70} minSize={30}>
          <Pane label="Main" tone="bg-card" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="h-96 w-[28rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="vertical" defaultSizes={[60, 40]}>
        <ResizablePanel defaultSize={60} minSize={20}>
          <Pane label="Editor" tone="bg-card" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={40} minSize={15}>
          <Pane label="Output" tone="bg-muted" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
};

export const Tri: Story = {
  render: () => (
    <div className="h-64 w-[48rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="horizontal" defaultSizes={[20, 60, 20]}>
        <ResizablePanel defaultSize={20} minSize={10}>
          <Pane label="A" tone="bg-primary-soft" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={60} minSize={30}>
          <Pane label="B" tone="bg-card" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={20} minSize={10}>
          <Pane label="C" tone="bg-success-soft" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: ResizablePanels.tsx source.
 * The separator is a keyboard-operable `role="separator"` (tabIndex 0):
 * `aria-valuenow` mirrors the size of the panel before it, Arrow keys nudge
 * by 1% (10% with Shift), double-click restores the default ratio, and drag
 * is plain mousedown + window mousemove — driveable with `userEvent.pointer`.
 * Note: the separator preventDefaults mousedown (drag affordance), so click
 * does NOT focus it — the keyboard path enters via Tab, as a real user would.
 * ------------------------------------------------------------------------- */

const sizesSpy = fn();

const panelAt = (canvasElement: HTMLElement, index: number) =>
  canvasElement.querySelector<HTMLElement>(`[data-panel-index="${index}"]`)!;

/** Press on the separator centre → drag by `dx`/`dy` → release, in client coordinates. */
const dragByPointer = async (separator: HTMLElement, dx: number, dy: number) => {
  const rect = separator.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;
  await userEvent.pointer([
    { keys: '[MouseLeft>]', target: separator, coords: { clientX: startX, clientY: startY } },
    { target: separator, coords: { clientX: startX + dx / 2, clientY: startY + dy / 2 } },
    { target: separator, coords: { clientX: startX + dx, clientY: startY + dy } },
    { keys: '[/MouseLeft]', target: separator, coords: { clientX: startX + dx, clientY: startY + dy } },
  ]);
};

export const KeyboardArrowsResize: Story = {
  render: () => (
    <div className="h-64 w-[40rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="horizontal" defaultSizes={[30, 70]} onSizesChange={sizesSpy}>
        <ResizablePanel defaultSize={30} minSize={15}>
          <Pane label="Sidebar" tone="bg-muted" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={70} minSize={30}>
          <Pane label="Main" tone="bg-card" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
  play: async ({ canvasElement }) => {
    sizesSpy.mockClear();
    const canvas = within(canvasElement);
    const separator = canvas.getByRole('separator');

    // ARIA contract: value tracks the panel BEFORE the separator; bounds come
    // from that panel's min/max; a horizontal split exposes a vertical bar.
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    await expect(separator).toHaveAttribute('aria-valuenow', '30');
    await expect(separator).toHaveAttribute('aria-valuemin', '15');
    await expect(separator).toHaveAttribute('aria-valuemax', '100');

    // Tab reaches the separator (mousedown is preventDefaulted for dragging).
    await userEvent.tab();
    await expect(separator).toHaveFocus();

    // ArrowRight grows the panel before the separator by 1%.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '31'));
    await expect(panelAt(canvasElement, 0).style.width).toBe('31%');
    await expect(panelAt(canvasElement, 1).style.width).toBe('69%');
    await expect(sizesSpy).toHaveBeenLastCalledWith([31, 69]);

    // ArrowLeft shrinks it back, 1% per press.
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '29'));

    // Shift multiplies the step to 10%.
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '39'));
    await expect(panelAt(canvasElement, 0).style.width).toBe('39%');
    await expect(panelAt(canvasElement, 1).style.width).toBe('61%');
  },
};

export const KeyboardClampsAtMinAndMax: Story = {
  render: () => (
    <div className="h-64 w-[40rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="horizontal" defaultSizes={[30, 70]}>
        <ResizablePanel defaultSize={30} minSize={20} maxSize={60}>
          <Pane label="Bounded" tone="bg-muted" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={70}>
          <Pane label="Free" tone="bg-card" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole('separator');
    await expect(separator).toHaveAttribute('aria-valuemin', '20');
    await expect(separator).toHaveAttribute('aria-valuemax', '60');

    await userEvent.tab();
    await expect(separator).toHaveFocus();

    // 30 → 20 in one Shift step; further presses clamp at minSize.
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}{ArrowLeft}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '20'));
    await expect(panelAt(canvasElement, 0).style.width).toBe('20%');

    // 20 → 60 in four Shift steps; the fifth clamps at maxSize.
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '60'));
    await expect(panelAt(canvasElement, 0).style.width).toBe('60%');
    await expect(panelAt(canvasElement, 1).style.width).toBe('40%');
  },
};

export const DoubleClickResetsDefaultRatio: Story = {
  render: () => (
    <div className="h-64 w-[40rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="horizontal" defaultSizes={[30, 70]}>
        <ResizablePanel defaultSize={30} minSize={10}>
          <Pane label="Sidebar" tone="bg-muted" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={70} minSize={10}>
          <Pane label="Main" tone="bg-card" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole('separator');

    // Drift away from the default ratio first.
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '34'));

    // Double-click restores the defaultSize proportions of the pair.
    await userEvent.dblClick(separator);
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '30'));
    await expect(panelAt(canvasElement, 0).style.width).toBe('30%');
    await expect(panelAt(canvasElement, 1).style.width).toBe('70%');
  },
};

export const PointerDragResizes: Story = {
  // Borderless 40rem wrapper → container rect is exactly 640px, so px→% math stays legible.
  render: () => (
    <div className="h-64 w-[40rem] overflow-hidden">
      <ResizablePanels orientation="horizontal" defaultSizes={[30, 70]}>
        <ResizablePanel defaultSize={30} minSize={10}>
          <Pane label="Sidebar" tone="bg-muted" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={70} minSize={10}>
          <Pane label="Main" tone="bg-card" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole('separator');
    await expect(separator).toHaveAttribute('aria-valuenow', '30');

    // +64px on a 640px container = +10% → 40/60.
    await dragByPointer(separator, 64, 0);
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '40'));

    // A hard drag left overshoots panel 0's minSize → clamps at 10%.
    await dragByPointer(separator, -256, 0);
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '10'));
  },
};

export const VerticalKeyboardArrowsResize: Story = {
  render: () => (
    <div className="h-96 w-[28rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="vertical" defaultSizes={[60, 40]}>
        <ResizablePanel defaultSize={60} minSize={20}>
          <Pane label="Editor" tone="bg-card" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={40} minSize={15}>
          <Pane label="Output" tone="bg-muted" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole('separator');

    // Vertical split → horizontal bar; ArrowDown grows the panel above.
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(separator).toHaveAttribute('aria-valuenow', '60');

    await userEvent.tab();
    await expect(separator).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '61'));
    await expect(panelAt(canvasElement, 0).style.height).toBe('61%');
    await expect(panelAt(canvasElement, 1).style.height).toBe('39%');

    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await waitFor(() => expect(separator).toHaveAttribute('aria-valuenow', '59'));

    // Horizontal keys are inert in a vertical split.
    await userEvent.keyboard('{ArrowRight}');
    await expect(separator).toHaveAttribute('aria-valuenow', '59');
  },
};

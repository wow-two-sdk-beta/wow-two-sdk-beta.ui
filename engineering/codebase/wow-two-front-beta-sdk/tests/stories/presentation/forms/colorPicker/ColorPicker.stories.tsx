import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ColorPicker } from '@src/presentation/forms/colorPicker/ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'Forms/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorPicker>;

function Demo() {
  const [color, setColor] = useState<string | null>('#3b82f6');
  return (
    <div className="flex flex-col gap-3 p-4">
      <ColorPicker value={color} onValueChange={setColor} />
      <p className="text-sm text-muted-foreground">Value: {color}</p>
    </div>
  );
}

const PRESETS = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#71717a',
];

export const Default: Story = { render: () => <Demo /> };

export const WithAlpha: Story = {
  render: () => (
    <div className="p-4">
      <ColorPicker hasAlpha defaultValue="#3b82f680" />
    </div>
  ),
};

export const WithPresets: Story = {
  render: () => (
    <div className="p-4">
      <ColorPicker presets={PRESETS} />
    </div>
  ),
};

export const TriggerVariants: Story = {
  render: () => (
    <div className="flex items-start gap-6 p-4">
      {(['full', 'swatch', 'value'] as const).map((v) => (
        <div key={v} className="flex flex-col items-center gap-2">
          <ColorPicker defaultValue="#8b5cf6" triggerVariant={v} />
          <span className="font-mono text-xs text-muted-foreground">{v}</span>
        </div>
      ))}
    </div>
  ),
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/* The panel portals to document.body — query through canvasElement.ownerDocument.body.
   The hex ColorField is the panel's only textbox and the most deterministic affordance
   (area/slider are pointer-geometry driven). Display text stays lowercase in the DOM
   (uppercasing is CSS-only). */

export const HexFieldRoundTrip: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="p-4">
      <ColorPicker {...args} defaultValue="#3b82f6" />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Pick a color' });
    await expect(trigger).toHaveTextContent('#3b82f6');
    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');

    const hexField = within(dialog).getByRole('textbox');
    await expect(hexField).toHaveValue('#3b82f6');

    /* Commit on Enter → spy fires with the committed hex, trigger caption follows. */
    await userEvent.clear(hexField);
    await userEvent.type(hexField, '22c55e{Enter}');
    await expect(hexField).toHaveValue('#22c55e');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('#22c55e');
    await expect(trigger).toHaveTextContent('#22c55e');
    /* Stays open during fine adjustment (typical color-picker behavior). */
    await expect(dialog).toBeInTheDocument();

    /* Shorthand round-trips through normalization: "abc" → "#aabbcc". */
    await userEvent.clear(hexField);
    await userEvent.type(hexField, 'abc{Enter}');
    await expect(hexField).toHaveValue('#aabbcc');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('#aabbcc');

    /* Invalid text reverts to the last committed value; no spy call. */
    await userEvent.clear(hexField);
    await userEvent.type(hexField, 'not-a-color{Enter}');
    await expect(hexField).toHaveValue('#aabbcc');
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
  },
};

export const PresetSwatchSelects: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="p-4">
      <ColorPicker {...args} defaultValue="#3b82f6" presets={['#ef4444', '#22c55e', '#8b5cf6']} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Pick a color' });
    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');

    /* Preset swatches are buttons labeled with their hex value. */
    await userEvent.click(within(dialog).getByRole('button', { name: '#ef4444' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith('#ef4444');
    await expect(trigger).toHaveTextContent('#ef4444');
    /* The hex field tracks the committed value; the popover stays open. */
    await expect(within(dialog).getByRole('textbox')).toHaveValue('#ef4444');
    await expect(dialog).toBeInTheDocument();
  },
};

export const EscapeClosesAndRestoresFocus: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="p-4">
      <ColorPicker {...args} defaultValue="#3b82f6" />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Pick a color' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(trigger).toHaveTextContent('#3b82f6');
  },
};

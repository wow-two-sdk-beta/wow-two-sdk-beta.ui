import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Tree, type TreeProps } from '@src/presentation/display/tree/Tree';

const meta: Meta<typeof Tree> = {
  title: 'Display/Tree',
  component: Tree,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Tree>;

export const Default: Story = {
  render: () => (
    <Tree defaultExpanded={['src', 'src/forms']} className="w-72 rounded-md border border-border p-2">
      <Tree.Group value="src" label="src">
        <Tree.Group value="src/forms" label="forms">
          <Tree.Item value="src/forms/Calendar.tsx">Calendar.tsx</Tree.Item>
          <Tree.Item value="src/forms/DatePicker.tsx">DatePicker.tsx</Tree.Item>
        </Tree.Group>
        <Tree.Group value="src/display" label="display">
          <Tree.Item value="src/display/Tabs.tsx">Tabs.tsx</Tree.Item>
          <Tree.Item value="src/display/Tree.tsx">Tree.tsx</Tree.Item>
        </Tree.Group>
        <Tree.Item value="src/index.ts">index.ts</Tree.Item>
      </Tree.Group>
      <Tree.Item value="package.json">package.json</Tree.Item>
      <Tree.Item value="tsconfig.json" isDisabled>tsconfig.json (disabled)</Tree.Item>
    </Tree>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Tree.tsx source.
 * Group children mount/unmount through Presence — collapse asserts wait out
 * the exit transition; roving focus lands via a post-commit effect → poll
 * focus with `waitFor`. Expansion: Enter/Space/click toggle, plus the APG
 * horizontal arrows (ArrowRight expands/descends, ArrowLeft collapses/climbs
 * — see ArrowKeysExpandCollapseAndTraverse).
 * ------------------------------------------------------------------------- */

const interactionRender = (
  args: Pick<TreeProps, 'onSelectionChange' | 'onExpandedChange' | 'defaultExpanded'>,
) => (
  <Tree {...args} className="w-72 rounded-md border border-border p-2">
    <Tree.Group value="src" label="src">
      <Tree.Item value="src/a.ts">a.ts</Tree.Item>
      <Tree.Item value="src/b.ts">b.ts</Tree.Item>
    </Tree.Group>
    <Tree.Item value="README.md">README.md</Tree.Item>
  </Tree>
);

export const ExpandAndCollapseBranch: Story = {
  args: { onExpandedChange: fn() },
  render: (args) => interactionRender(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const branch = canvas.getByRole('treeitem', { name: 'src' });
    const leaf = canvas.getByRole('treeitem', { name: 'README.md' });

    // Branch nodes carry aria-expanded; leaves don't.
    await expect(branch).toHaveAttribute('aria-expanded', 'false');
    await expect(leaf).not.toHaveAttribute('aria-expanded');
    await expect(canvas.queryByRole('treeitem', { name: 'a.ts' })).not.toBeInTheDocument();

    // Click expands and reveals children.
    await userEvent.click(branch);
    await expect(branch).toHaveAttribute('aria-expanded', 'true');
    await expect(args.onExpandedChange).toHaveBeenLastCalledWith(['src']);
    const child = await canvas.findByRole('treeitem', { name: 'a.ts' });
    // Depth is exposed via aria-level.
    await expect(branch).toHaveAttribute('aria-level', '1');
    await expect(child).toHaveAttribute('aria-level', '2');

    // Click again collapses; children unmount after the exit transition.
    await userEvent.click(branch);
    await expect(branch).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onExpandedChange).toHaveBeenLastCalledWith([]);
    await waitFor(() =>
      expect(canvas.queryByRole('treeitem', { name: 'a.ts' })).not.toBeInTheDocument(),
    );
  },
};

export const ClickSelectsLeaf: Story = {
  args: { onSelectionChange: fn(), defaultExpanded: ['src'] },
  render: (args) => interactionRender(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const leafA = canvas.getByRole('treeitem', { name: 'a.ts' });
    const leafB = canvas.getByRole('treeitem', { name: 'b.ts' });

    await expect(leafA).not.toHaveAttribute('aria-selected');

    await userEvent.click(leafA);
    await expect(leafA).toHaveAttribute('aria-selected', 'true');
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith('src/a.ts');

    // Single selection: picking B moves it off A.
    await userEvent.click(leafB);
    await expect(leafB).toHaveAttribute('aria-selected', 'true');
    await expect(leafA).not.toHaveAttribute('aria-selected');
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith('src/b.ts');
    await expect(args.onSelectionChange).toHaveBeenCalledTimes(2);
  },
};

export const KeyboardNavigatesAndActivates: Story = {
  args: { onSelectionChange: fn() },
  render: (args) => interactionRender(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const branch = canvas.getByRole('treeitem', { name: 'src' });
    const readme = canvas.getByRole('treeitem', { name: 'README.md' });

    // Tab lands on the single roving tab stop (first row).
    await userEvent.tab();
    await expect(branch).toHaveFocus();
    await expect(readme).toHaveAttribute('tabindex', '-1');

    // ArrowDown / ArrowUp move focus through visible rows.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(readme).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(branch).toHaveFocus());

    // Enter toggles expansion on a branch node…
    await userEvent.keyboard('{Enter}');
    await expect(branch).toHaveAttribute('aria-expanded', 'true');

    // …ArrowDown reaches the revealed child; Space selects it.
    const child = await canvas.findByRole('treeitem', { name: 'a.ts' });
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(child).toHaveFocus());
    await userEvent.keyboard(' ');
    await expect(child).toHaveAttribute('aria-selected', 'true');
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith('src/a.ts');
  },
};

export const ArrowKeysExpandCollapseAndTraverse: Story = {
  render: () => interactionRender({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const branch = canvas.getByRole('treeitem', { name: 'src' });

    await userEvent.tab();
    await expect(branch).toHaveFocus();

    // ArrowRight on a collapsed branch expands it; focus stays put (APG).
    await userEvent.keyboard('{ArrowRight}');
    await expect(branch).toHaveAttribute('aria-expanded', 'true');
    await expect(branch).toHaveFocus();

    // ArrowRight on an expanded branch descends to its first child.
    const child = await canvas.findByRole('treeitem', { name: 'a.ts' });
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(child).toHaveFocus());

    // ArrowLeft on a child leaf climbs back to the parent branch…
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(branch).toHaveFocus());

    // …ArrowLeft on the expanded branch collapses it; focus stays put.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(branch).toHaveAttribute('aria-expanded', 'false');
    await expect(branch).toHaveFocus();
    await waitFor(() =>
      expect(canvas.queryByRole('treeitem', { name: 'a.ts' })).not.toBeInTheDocument(),
    );

    // Edges: ArrowRight on a leaf is a no-op; ArrowLeft on a root-level leaf
    // (no parent branch) is a no-op too.
    const readme = canvas.getByRole('treeitem', { name: 'README.md' });
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(readme).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}');
    await expect(readme).toHaveFocus();
    await expect(readme).not.toHaveAttribute('aria-expanded');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(readme).toHaveFocus();
  },
};

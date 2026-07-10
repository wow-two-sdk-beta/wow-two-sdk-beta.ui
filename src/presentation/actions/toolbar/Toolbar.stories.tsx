import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Bold, Italic, Underline, Link as LinkIcon } from 'lucide-react';
import { Toolbar } from './Toolbar';

const meta: Meta<typeof Toolbar> = {
  title: 'Actions/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  render: () => (
    <Toolbar aria-label="Formatting">
      <Toolbar.Button aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Link href="#">
        <LinkIcon className="h-4 w-4" />
      </Toolbar.Link>
    </Toolbar>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Toolbar aria-label="Vertical formatting" orientation="vertical">
      <Toolbar.Button aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Button aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Toolbar.Button>
    </Toolbar>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Toolbar.tsx + RovingFocusGroup.
 * Roving focus lands via a post-commit effect → poll focus with `waitFor`.
 * ------------------------------------------------------------------------- */

const interactionRender = () => (
  <Toolbar aria-label="Formatting">
    <Toolbar.Button aria-label="Bold">
      <Bold className="h-4 w-4" />
    </Toolbar.Button>
    <Toolbar.Button aria-label="Italic">
      <Italic className="h-4 w-4" />
    </Toolbar.Button>
    <Toolbar.Button aria-label="Underline">
      <Underline className="h-4 w-4" />
    </Toolbar.Button>
    <Toolbar.Separator />
    <Toolbar.Link href="#" aria-label="Docs">
      <LinkIcon className="h-4 w-4" />
    </Toolbar.Link>
  </Toolbar>
);

/** Arrow keys rove focus across buttons AND the link; the group keeps exactly one tab stop. */
export const ArrowKeysRoveFocus: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole('toolbar', { name: 'Formatting' });
    await expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');

    const bold = canvas.getByRole('button', { name: 'Bold' });
    const italic = canvas.getByRole('button', { name: 'Italic' });

    await userEvent.click(bold);
    await expect(bold).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(italic).toHaveFocus());

    /* Roving tabindex — the focused item is the only tab stop. */
    await expect(italic).toHaveAttribute('tabindex', '0');
    await expect(bold).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(bold).toHaveFocus());
  },
};

/** Home/End jump to the first/last item; arrow navigation loops past the edges. */
export const HomeEndAndLooping: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Bold' });
    const docsLink = canvas.getByRole('link', { name: 'Docs' });

    await userEvent.click(bold);
    await expect(bold).toHaveFocus();

    /* End lands on the last item — the link participates in the roving group. */
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(docsLink).toHaveFocus());

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(bold).toHaveFocus());

    /* canLoop — ArrowLeft from the first item wraps to the last. */
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(docsLink).toHaveFocus());
  },
};

/** Disabled controls are skipped — arrows walk past them and they never hold the tab stop. */
export const DisabledItemsAreSkipped: Story = {
  render: () => (
    <Toolbar aria-label="Formatting">
      <Toolbar.Button aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Italic" disabled>
        <Italic className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Toolbar.Button>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Bold' });
    const italic = canvas.getByRole('button', { name: 'Italic' });
    const underline = canvas.getByRole('button', { name: 'Underline' });

    await expect(italic).toBeDisabled();
    await expect(italic).toHaveAttribute('tabindex', '-1');

    await userEvent.click(bold);
    await expect(bold).toHaveFocus();

    /* ArrowRight skips the disabled item straight to Underline. */
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(underline).toHaveFocus());

    /* And back — ArrowLeft skips it in the other direction too. */
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(bold).toHaveFocus());
  },
};

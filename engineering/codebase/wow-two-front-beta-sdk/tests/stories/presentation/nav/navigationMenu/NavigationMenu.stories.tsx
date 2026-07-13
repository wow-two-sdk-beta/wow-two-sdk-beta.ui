import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NavigationMenu } from '@src/presentation/nav/navigationMenu/NavigationMenu';

const meta: Meta<typeof NavigationMenu> = {
  title: 'Nav/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NavigationMenu>;

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul className="grid w-72 gap-1">
              <li>
                <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                  <div className="font-medium">Analytics</div>
                  <div className="text-xs text-muted-foreground">Track usage in real-time.</div>
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                  <div className="font-medium">Engagement</div>
                  <div className="text-xs text-muted-foreground">Boost retention.</div>
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                  <div className="font-medium">Security</div>
                  <div className="text-xs text-muted-foreground">Best-in-class encryption.</div>
                </a>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="resources">
          <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul className="grid w-72 gap-1">
              <li>
                <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                  Docs
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                  Changelog
                </a>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="pricing">
          <NavigationMenu.Link href="#">Pricing</NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="about">
          <NavigationMenu.Link href="#">About</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: NavigationMenu.tsx. Panels portal to
 * document.body (plain divs, no landmark role) → query panel content via
 * `canvasElement.ownerDocument.body` text. Open/close is animation-deferred
 * (Presence) and focus return is rAF-deferred → poll with `waitFor`.
 * Triggers stay focused on open (no focus trap — APG disclosure-nav style).
 * ------------------------------------------------------------------------- */

function InteractionDemo() {
  return (
    <div className="p-8">
      <NavigationMenu aria-label="Interaction nav">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <ul className="grid w-64 gap-1">
                <li>
                  <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                    Security
                  </a>
                </li>
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="resources">
            <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <ul className="grid w-64 gap-1">
                <li>
                  <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                    Blog
                  </a>
                </li>
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="pricing">
            <NavigationMenu.Link href="#">Pricing</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </div>
  );
}

export const TriggerClickTogglesPanel: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Products' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    const link = await body.findByText('Analytics');
    // Pop-in starts at opacity 0 → poll visibility.
    await waitFor(() => expect(link).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Trigger wires aria-controls to the panel it labels.
    const panelId = trigger.getAttribute('aria-controls')!;
    const panel = canvasElement.ownerDocument.getElementById(panelId)!;
    await expect(panel).toContainElement(link);
    await expect(panel).toHaveAttribute('aria-labelledby', trigger.id);

    // Second click toggles the panel closed.
    await userEvent.click(trigger);
    await waitFor(() => expect(body.queryByText('Analytics')).not.toBeInTheDocument());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const MovingToNextTriggerSwapsPanel: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const products = canvas.getByRole('button', { name: 'Products' });
    const resources = canvas.getByRole('button', { name: 'Resources' });

    // Hover alone does not open while everything is closed.
    await userEvent.hover(resources);
    await expect(body.queryByText('Docs')).not.toBeInTheDocument();

    // Open Products, then hovering Resources swaps the panel.
    await userEvent.click(products);
    await body.findByText('Analytics');
    await userEvent.hover(resources);
    await body.findByText('Docs');
    await waitFor(() => expect(body.queryByText('Analytics')).not.toBeInTheDocument());
    await expect(resources).toHaveAttribute('aria-expanded', 'true');
    await expect(products).toHaveAttribute('aria-expanded', 'false');

    // Click-to-swap: with a real pointer the pointerenter hover-swap precedes
    // the click, so the click lands on the just-swapped trigger — the
    // opened-by-pointer guard keeps it open instead of toggling it closed.
    await userEvent.click(products);
    await body.findByText('Analytics');
    await waitFor(() => expect(body.queryByText('Docs')).not.toBeInTheDocument());
    await expect(products).toHaveAttribute('aria-expanded', 'true');
    await expect(resources).toHaveAttribute('aria-expanded', 'false');
  },
};

export const HoverThenClickKeepsPanelOpen: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const products = canvas.getByRole('button', { name: 'Products' });
    const resources = canvas.getByRole('button', { name: 'Resources' });

    // Open Products, hover Resources — the panel hover-swaps to Resources.
    await userEvent.click(products);
    await body.findByText('Analytics');
    await userEvent.hover(resources);
    await body.findByText('Docs');

    // The click that follows the hover-swap is a no-op — the panel it just
    // opened stays open (Radix-style opened-by-pointer guard).
    await userEvent.click(resources);
    await expect(resources).toHaveAttribute('aria-expanded', 'true');
    // Pop-in starts at opacity 0 → poll visibility.
    await waitFor(() => expect(body.getByText('Docs')).toBeVisible());

    // The guard is one-shot: a second click is a deliberate toggle-close.
    await userEvent.click(resources);
    await waitFor(() => expect(body.queryByText('Docs')).not.toBeInTheDocument());
    await expect(resources).toHaveAttribute('aria-expanded', 'false');
  },
};

export const EscapeClosesAndReturnsFocus: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Products' });

    await userEvent.click(trigger);
    await body.findByText('Analytics');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByText('Analytics')).not.toBeInTheDocument());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ArrowKeysRoveAcrossItems: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const products = canvas.getByRole('button', { name: 'Products' });
    const resources = canvas.getByRole('button', { name: 'Resources' });
    const pricing = canvas.getByRole('link', { name: 'Pricing' });

    products.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(resources).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(pricing).toHaveFocus());

    // Loops past the end; ArrowLeft comes back around.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(products).toHaveFocus());
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(pricing).toHaveFocus());

    // Roving tab stop: exactly one item keeps tabIndex 0.
    await expect(pricing).toHaveAttribute('tabindex', '0');
    await expect(products).toHaveAttribute('tabindex', '-1');
    await expect(resources).toHaveAttribute('tabindex', '-1');
  },
};

export const OutsideClickCloses: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Products' });

    await userEvent.click(trigger);
    await body.findByText('Analytics');

    await userEvent.click(canvasElement);

    await waitFor(() => expect(body.queryByText('Analytics')).not.toBeInTheDocument());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Tabs } from '@src/presentation/display/tabs/Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Display/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        <Tabs.Tab value="usage" isDisabled>Usage</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview" className="p-3">
        Overview content. Arrow keys move focus; selected tab has the underline.
      </Tabs.Panel>
      <Tabs.Panel value="settings" className="p-3">
        Settings content.
      </Tabs.Panel>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="general" orientation="vertical" className="w-96">
      <Tabs.List>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="account">Account</Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="general" className="p-3">
        General settings.
      </Tabs.Panel>
      <Tabs.Panel value="account" className="p-3">
        Account preferences.
      </Tabs.Panel>
      <Tabs.Panel value="notifications" className="p-3">
        Notification preferences.
      </Tabs.Panel>
    </Tabs>
  ),
};

export const ManualActivation: Story = {
  render: () => (
    <Tabs defaultValue="a" activationMode="manual" className="w-96">
      <Tabs.List>
        <Tabs.Tab value="a">Tab A</Tabs.Tab>
        <Tabs.Tab value="b">Tab B</Tabs.Tab>
        <Tabs.Tab value="c">Tab C</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a" className="p-3">A — arrow keys move focus, Enter activates.</Tabs.Panel>
      <Tabs.Panel value="b" className="p-3">B</Tabs.Panel>
      <Tabs.Panel value="c" className="p-3">C</Tabs.Panel>
    </Tabs>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Tabs.spec.md "Required behaviors".
 * Roving focus lands via a post-commit effect → poll focus with `waitFor`;
 * automatic activation then flips selection from the focus event.
 * ------------------------------------------------------------------------- */

const interactionRender = () => (
  <Tabs defaultValue="one" className="w-96">
    <Tabs.List>
      <Tabs.Tab value="one">One</Tabs.Tab>
      <Tabs.Tab value="two">Two</Tabs.Tab>
      <Tabs.Tab value="three">Three</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="one" className="p-3">
      Panel one
    </Tabs.Panel>
    <Tabs.Panel value="two" className="p-3">
      Panel two
    </Tabs.Panel>
    <Tabs.Panel value="three" className="p-3">
      Panel three
    </Tabs.Panel>
  </Tabs>
);

export const ClickSwitchesPanel: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabOne = canvas.getByRole('tab', { name: 'One' });
    const tabTwo = canvas.getByRole('tab', { name: 'Two' });

    await expect(tabOne).toHaveAttribute('aria-selected', 'true');
    await expect(tabTwo).toHaveAttribute('aria-selected', 'false');
    // Only the active panel is mounted.
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Panel one');

    await userEvent.click(tabTwo);

    await expect(tabTwo).toHaveAttribute('aria-selected', 'true');
    await expect(tabOne).toHaveAttribute('aria-selected', 'false');

    const panel = canvas.getByRole('tabpanel');
    await expect(panel).toHaveTextContent('Panel two');
    // Tab ↔ panel ARIA pairing.
    await expect(panel).toHaveAttribute('aria-labelledby', tabTwo.id);
    await expect(tabTwo).toHaveAttribute('aria-controls', panel.id);
  },
};

export const ArrowKeysMoveFocus: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabOne = canvas.getByRole('tab', { name: 'One' });
    const tabTwo = canvas.getByRole('tab', { name: 'Two' });

    await userEvent.click(tabOne);
    await expect(tabOne).toHaveFocus();

    // ArrowRight roves focus; automatic activation selects the focused tab.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(tabTwo).toHaveFocus());
    await waitFor(() => expect(tabTwo).toHaveAttribute('aria-selected', 'true'));
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Panel two');

    // Roving tabindex: the focused tab is the only tab stop.
    await expect(tabTwo).toHaveAttribute('tabindex', '0');
    await expect(tabOne).toHaveAttribute('tabindex', '-1');

    // ArrowLeft roves back.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(tabOne).toHaveFocus());
    await waitFor(() => expect(tabOne).toHaveAttribute('aria-selected', 'true'));
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Panel one');
  },
};

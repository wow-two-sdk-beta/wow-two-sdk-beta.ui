import type { Meta, StoryObj } from '@storybook/react';
import { NavigationMenu } from './NavigationMenu';

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

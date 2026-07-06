import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Light / dark mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    // Axe runs against every story in the vitest `storybook` project.
    // 'todo' = violations reported, not failing — baseline inventory 2026-07-06:
    // 260/720 stories violate (aria-allowed/prohibited-attr ≫ color-contrast >
    // label > aria-required-parent; see docs/testing.md). Flip to 'error' after
    // the a11y burn-down; per-story override via `parameters.a11y.test`.
    a11y: { test: 'todo' },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      return Story();
    },
  ],
};

export default preview;

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Navbar } from '@src/presentation/layout';

describe('Navbar inner container', () => {
  it('forwards native attributes and lets consumer spacing win', () => {
    const wrapper = mount(Navbar, {
      props: {
        containerAttrs: { id: 'nav-content', class: 'px-5', 'data-shell': 'primary' },
        containerClass: 'px-6',
      },
      slots: { default: 'Navigation' },
    });
    const container = wrapper.get('#nav-content');
    expect(container.attributes('data-shell')).toBe('primary');
    expect(container.classes()).toContain('px-6');
    expect(container.classes()).not.toContain('px-4');
    expect(container.classes()).not.toContain('px-5');
  });
});

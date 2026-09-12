import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import Button from '@src/presentation/actions/button/Button.vue';
import '@src/index.css';

it('keeps keyboard focus visible when forced colors removes ring shadows', async () => {
  const wrapper = mount(Button, { attachTo: document.body, slots: { default: 'Continue' } });
  try {
    const button = wrapper.get('button').element;
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    const style = getComputedStyle(button);
    if (matchMedia('(forced-colors: active)').matches) {
      expect(style.boxShadow).toBe('none');
      expect(style.outlineStyle).not.toBe('none');
      expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0);
      expect(style.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    } else {
      expect(style.boxShadow).not.toBe('none');
    }
  } finally {
    wrapper.unmount();
  }
});

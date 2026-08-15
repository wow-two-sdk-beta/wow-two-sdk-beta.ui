import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { Tour } from '@src/presentation/feedback';

const steps = [{ target: '#tour-anchor', title: 'Step one', body: 'Here is the thing.' }];

/** The element a tour step points at — a step with no target in the document renders nothing. */
function withAnchor(run: () => Promise<void>): Promise<void> {
  const anchor = document.createElement('div');
  anchor.id = 'tour-anchor';
  document.body.appendChild(anchor);
  return run().finally(() => {
    anchor.remove();
  });
}

describe('feedback — Tour open state', () => {
  /*
   * The exact bug the port shipped: `Tour.isOpen` is an optional plain `boolean`, and Vue casts
   * an absent one to `false` unless the declaration owns an explicit `undefined` default. With
   * that default missing the tour read as controlled-and-closed no matter what, and could never
   * open. Passing NO `isOpen` at all is the only shape that reproduces it — any test that hands
   * the component an open prop passes either way.
   */
  it('opens through defaultOpen with no isOpen passed', async () => {
    await withAnchor(async () => {
      const wrapper = mount({
        render: () => h(Tour, { steps, defaultOpen: true }),
      });
      await nextTick();

      expect(document.body.textContent, 'Tour rendered nothing — isOpen was cast to false').toContain('Step one');

      wrapper.unmount();
    });
  });

  it('stays closed when defaultOpen is not passed either', async () => {
    await withAnchor(async () => {
      const wrapper = mount({ render: () => h(Tour, { steps }) });
      await nextTick();

      expect(document.body.textContent).not.toContain('Step one');
      wrapper.unmount();
    });
  });

  it('honours the controlled isOpen prop', async () => {
    await withAnchor(async () => {
      const wrapper = mount({ render: () => h(Tour, { steps, isOpen: true }) });
      await nextTick();

      expect(document.body.textContent).toContain('Step one');
      wrapper.unmount();
    });
  });
});

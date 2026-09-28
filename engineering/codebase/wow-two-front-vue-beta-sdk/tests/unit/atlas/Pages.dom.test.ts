import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { nextTick, type Component } from 'vue';
import HomePage from '../../../apps/atlas/src/pages/HomePage.vue';
import LayoutsPage from '../../../apps/atlas/src/pages/LayoutsPage.vue';
import LabPage from '../../../apps/atlas/src/pages/LabPage.vue';
import GuidesPage from '../../../apps/atlas/src/pages/GuidesPage.vue';
import PatternsPage from '../../../apps/atlas/src/pages/PatternsPage.vue';
import ThemesPage from '../../../apps/atlas/src/pages/ThemesPage.vue';
import StudioPage from '../../../apps/atlas/src/pages/StudioPage.vue';
import ScreensPage from '../../../apps/atlas/src/pages/ScreensPage.vue';
import DashboardScreen from '../../../apps/atlas/src/screens/DashboardScreen.vue';
import BoardScreen from '../../../apps/atlas/src/screens/BoardScreen.vue';
import SettingsScreen from '../../../apps/atlas/src/screens/SettingsScreen.vue';
import InboxScreen from '../../../apps/atlas/src/screens/InboxScreen.vue';
import { Archetypes } from '../../../apps/atlas/src/content/layouts';
import { GeneratedThemeId } from '../../../apps/atlas/src/content/seedQuery';
import { Sections, route } from '../../../apps/atlas/src/router';
import { generatedSeed, themeId } from '../../../apps/atlas/src/theme';

/* Mount-level coverage for the atlas: every page renders from a route, the lab and studio keep their state in the
   link, and each real-component screen does the one job its archetype promises. */

const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

async function go(hash: string): Promise<void> {
  window.location.hash = hash;
  window.dispatchEvent(new Event('hashchange'));
  await nextTick();
}

async function settle(): Promise<void> {
  await flushPromises();
  for (let tick = 0; tick < 3; tick += 1) await nextTick();
  const at = Date.now();
  while (Date.now() === at) await Promise.resolve();
}

function render(component: Component): VueWrapper {
  const wrapper = mount(component, { attachTo: document.body });
  wrappers.push(wrapper);
  return wrapper;
}

function button(wrapper: VueWrapper, text: string): HTMLButtonElement {
  const found = [...(wrapper.element as HTMLElement).querySelectorAll<HTMLButtonElement>('button')].find(
    (node) => node.textContent?.trim() === text,
  );
  if (!found) throw new Error(`no button "${text}"`);
  return found;
}

async function type(input: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
}

describe('atlas pages', () => {
  it('opens every section from the home page', async () => {
    await go('#/');
    const wrapper = render(HomePage);
    for (const section of Sections.slice(1)) {
      expect(wrapper.find(`a[href="#/${section.key}"]`).exists(), section.key).toBe(true);
    }
  });

  it('lists every archetype and links a built one to its screen', async () => {
    await go('#/layouts');
    const catalogue = render(LayoutsPage);
    expect(catalogue.findAll('a[href^="#/layouts/"]').length).toBeGreaterThanOrEqual(Archetypes.length);
    catalogue.unmount();
    wrappers.splice(0);
    await go('#/layouts/inbox');
    const detail = render(LayoutsPage);
    expect(detail.get('h1').text()).toBe('Inbox / chat');
    expect(detail.find('a[href="#/screens/inbox"]').exists()).toBe(true);
    expect(detail.get('a[href^="#/lab?"]').attributes('href')).toContain('from=inbox');
  });

  it('keeps a lab composition in the link', async () => {
    await go('#/lab?from=board');
    const wrapper = render(LabPage);
    await settle();
    const sidebar = [...(wrapper.element as HTMLElement).querySelectorAll<HTMLButtonElement>('[role=radio]')].find(
      (node) => node.textContent?.trim() === 'Sidebar',
    )!;
    sidebar.click();
    await settle();
    expect(route.value.query.get('nav')).toBe('side');
    expect(route.value.query.has('from')).toBe(false);
  });

  it('renders the guides and patterns', async () => {
    await go('#/guides');
    expect(render(GuidesPage).find('h2').exists()).toBe(true);
    await go('#/patterns');
    expect(render(PatternsPage).get('h1').text()).toBe('Patterns');
  });

  it('applies a catalogue theme from its card', async () => {
    await go('#/themes');
    const wrapper = render(ThemesPage);
    const card = wrapper.findAll('button[aria-pressed=false]')[3]!;
    await card.trigger('click');
    expect(themeId.value).not.toBe('wow');
    expect(card.attributes('aria-pressed')).toBe('true');
  });
});

describe('atlas studio', () => {
  it('opens on a linked seed, re-generates on change and applies it atlas-wide', async () => {
    await go('#/studio?hue=30&name=Clay%20Studio&surface=soft');
    const wrapper = render(StudioPage);
    await settle();
    expect(document.head.querySelectorAll('style[data-atlas-preview]')).toHaveLength(1);
    expect(wrapper.get('pre').text()).toContain('primaryHue: 30,');
    expect(wrapper.get('pre').text()).toContain(`classList.add('theme-clay-studio')`);

    await type(wrapper.get<HTMLInputElement>('input[type=range]').element, '200');
    expect(route.value.query.get('hue')).toBe('200');
    expect(wrapper.get('pre').text()).toContain('primaryHue: 200,');

    button(wrapper, 'Apply to atlas').click();
    await settle();
    expect(themeId.value).toBe(GeneratedThemeId);
    expect(generatedSeed.value).toMatchObject({ primaryHue: 200, name: 'Clay Studio', surface: 'soft' });
    expect(button(wrapper, 'Applied to atlas').disabled).toBe(true);

    wrapper.unmount();
    wrappers.splice(0);
    expect(document.head.querySelectorAll('style[data-atlas-preview]')).toHaveLength(0);
  });

  it('starts from a curated seed and keeps the choice in the link', async () => {
    await go('#/studio');
    const wrapper = render(StudioPage);
    const select = wrapper.get<HTMLSelectElement>('select').element;
    select.value = 'midnight';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await settle();
    expect(route.value.query.get('from')).toBe('midnight');
    expect(route.value.query.get('name')).toBe('Midnight');
  });
});

describe('atlas screens', () => {
  it('shows the screen a link names beside its archetype', async () => {
    await go('#/screens/board');
    const wrapper = render(ScreensPage);
    await vi.waitFor(async () => {
      await settle();
      expect(wrapper.text()).toContain('Release 2.4');
    });
    expect(wrapper.find('a[href="#/layouts/board"]').exists()).toBe(true);
    expect(wrapper.get('a[aria-current=page]').text()).toBe('Release board');
  });

  it('re-slices the dashboard by period and renders outcome badges as markup', async () => {
    const wrapper = render(DashboardScreen);
    expect(wrapper.text()).toMatch(/Deploys\s*124\b/);
    button(wrapper, '12 weeks').click();
    await settle();
    expect(wrapper.text()).toMatch(new RegExp(`Deploys\\s*${(1050).toLocaleString()}`));
    const outcome = wrapper.findAll('tbody tr')[1]!.findAll('td')[3]!;
    expect(outcome.find('span').text()).toBe('Failed');
  });

  it('lands a move made in a filtered board beside the visible neighbours', async () => {
    const wrapper = render(BoardScreen);
    button(wrapper, 'Mine').click();
    await settle();
    expect(wrapper.text()).not.toContain('Remove the legacy router');
    const board = wrapper.vm as unknown as {
      applyMove: (move: Record<string, unknown>) => void;
      board: Array<{ key: string; cards: Array<{ key: string }> }>;
    };
    board.applyMove({ itemKey: 'c2', fromColumn: 'backlog', fromIndex: 0, toColumn: 'done', toIndex: 0 });
    board.applyMove({ itemKey: 'c4', fromColumn: 'progress', fromIndex: 0, toColumn: 'done', toIndex: 2 });
    const done = board.board.find((column) => column.key === 'done')!;
    expect(done.cards.map((card) => card.key)).toEqual(['c2', 'c7', 'c8', 'c4']);
    await type(wrapper.get<HTMLInputElement>('input').element, 'no such card');
    expect(wrapper.text()).toContain('No cards match');
  });

  it('keeps settings edits a draft until they are saved', async () => {
    const wrapper = render(SettingsScreen);
    const footer = (): string => wrapper.get('footer').text();
    expect(footer()).toContain('All changes saved');
    await type(wrapper.findAll<HTMLInputElement>('input')[0]!.element, 'Aziza K.');
    expect(footer()).toContain('Unsaved changes');
    await type(wrapper.findAll<HTMLInputElement>('input')[1]!.element, 'not-an-email');
    expect(wrapper.text()).toContain('Enter an email.');
    expect(button(wrapper, 'Save changes').disabled).toBe(true);
    await type(wrapper.findAll<HTMLInputElement>('input')[1]!.element, 'aziza@example.org');
    button(wrapper, 'Save changes').click();
    await settle();
    expect(footer()).toContain('Saved at');
    button(wrapper, 'Notifications').click();
    await settle();
    expect(wrapper.findAll('[role=switch]')).toHaveLength(3);
  });

  it('reads a conversation on open and appends a sent reply', async () => {
    const wrapper = render(InboxScreen);
    const third = wrapper.findAll('aside li button')[2]!;
    expect(third.text()).toContain('1');
    await third.trigger('click');
    await settle();
    expect(wrapper.get('section header').text()).toContain('Nodira Saidova');
    expect(third.attributes('aria-current')).toBe('true');
    const area = wrapper.get<HTMLTextAreaElement>('textarea').element;
    await type(area, 'Open Members, then Invite.');
    area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settle();
    expect(wrapper.get('section').text()).toContain('Open Members, then Invite.');
    expect(third.text()).toContain('Open Members, then Invite.');
  });
});

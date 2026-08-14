import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { GoogleSignInButton } from '@src/presentation/actions';

/*
 * `dom` project (happy-dom). The GIS script itself is never fetched here — `loadGoogleIdentity`
 * short-circuits on an already-present `window.google.accounts.id`, which is exactly what a real
 * page looks like once the script has run. Stubbing at that seam covers the whole flow without a
 * network, and leaves the script-injection branch to the mount smoke case (where it never settles).
 *
 * The contract under test is the boundary: this package produces an ID token and nothing else. A
 * regression that starts POSTing the credential from inside the SDK would still pass a render
 * assertion, so the credential emit is asserted by value.
 */

const ClientId = 'test-client-id.apps.googleusercontent.com';

interface FakeGis {
  initialize: ReturnType<typeof vi.fn>;
  renderButton: ReturnType<typeof vi.fn>;
  prompt: ReturnType<typeof vi.fn>;
  disableAutoSelect: ReturnType<typeof vi.fn>;
}

let gis: FakeGis;

/** Drains the load promise, the status flip, and the render watcher's own tick. */
async function settle(): Promise<void> {
  await flushPromises();
  await nextTick();
}

/** Invokes the `callback` GIS was initialized with — the browser's job on a completed sign-in. */
function signInWith(credential: string | undefined): void {
  const config = gis.initialize.mock.calls.at(-1)?.[0] as {
    callback: (response: { credential?: string; select_by?: string }) => void;
  };
  config.callback({ credential, select_by: 'btn' });
}

beforeEach(() => {
  gis = {
    initialize: vi.fn(),
    renderButton: vi.fn(),
    prompt: vi.fn(),
    disableAutoSelect: vi.fn(),
  };
  (globalThis as { google?: unknown }).google = { accounts: { id: gis } };
});

afterEach(() => {
  delete (globalThis as { google?: unknown }).google;
});

describe('GoogleSignInButton', () => {
  it('initializes GIS with the client id and renders into its own host', async () => {
    const wrapper = mount(GoogleSignInButton, { props: { clientId: ClientId } });
    await settle();

    expect(gis.initialize).toHaveBeenCalledTimes(1);
    expect(gis.initialize.mock.calls.at(0)?.[0]).toMatchObject({ client_id: ClientId, auto_select: false });

    expect(gis.renderButton).toHaveBeenCalledTimes(1);
    expect(gis.renderButton.mock.calls.at(0)?.[0]).toBe(wrapper.element);
    expect(gis.renderButton.mock.calls.at(0)?.[1]).toMatchObject({ theme: 'outline', size: 'large' });
  });

  it('emits the raw ID token and never posts it', async () => {
    const wrapper = mount(GoogleSignInButton, { props: { clientId: ClientId } });
    await settle();

    signInWith('id-token-abc');

    expect(wrapper.emitted('credential')?.[0]?.[0]).toBe('id-token-abc');
  });

  it('ignores a dismissed prompt that carries no credential', async () => {
    const wrapper = mount(GoogleSignInButton, { props: { clientId: ClientId } });
    await settle();

    signInWith(undefined);

    expect(wrapper.emitted('credential')).toBeUndefined();
  });

  it('renders nothing and loads nothing without a client id', async () => {
    const wrapper = mount(GoogleSignInButton, { props: {} });
    await settle();

    expect(wrapper.html()).toBe('<!--v-if-->');
    expect(gis.initialize).not.toHaveBeenCalled();
  });

  it('re-initializes when the client id changes', async () => {
    const wrapper = mount(GoogleSignInButton, { props: { clientId: ClientId } });
    await settle();

    await wrapper.setProps({ clientId: 'second-id.apps.googleusercontent.com' });
    await settle();

    expect(gis.initialize).toHaveBeenCalledTimes(2);
    expect(gis.initialize.mock.calls.at(1)?.[0]).toMatchObject({
      client_id: 'second-id.apps.googleusercontent.com',
    });
  });

  it('clears the host before re-rendering so buttons do not stack', async () => {
    const wrapper = mount(GoogleSignInButton, { props: { clientId: ClientId } });
    await settle();

    // GIS appends its iframe on render; a second render must not leave the first behind.
    wrapper.element.appendChild(document.createElement('div'));
    await wrapper.setProps({ theme: 'filled_blue' });
    await settle();

    expect(wrapper.element.children).toHaveLength(0);
    expect(gis.renderButton).toHaveBeenCalledTimes(2);
    expect(gis.renderButton.mock.calls.at(1)?.[1]).toMatchObject({ theme: 'filled_blue' });
  });
});

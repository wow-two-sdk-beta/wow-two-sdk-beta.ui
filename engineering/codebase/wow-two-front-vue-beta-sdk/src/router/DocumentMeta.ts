import type { Router } from 'vue-router';

import type { RouteMeta } from './RouteConfig';
import { deepestHandleValue } from './RouteHandles';

const MetaTagName = 'meta';
const NameAttribute = 'name';
const ContentAttribute = 'content';
const DescriptionName = 'description';

/** Upserts (or clears) a single named `<meta>` tag in the document head. */
function setMetaTag(name: string, content: string | undefined): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`${MetaTagName}[${NameAttribute}="${name}"]`);
  if (content == null) {
    tag?.removeAttribute(ContentAttribute);
    return;
  }
  if (!tag) {
    tag = document.createElement(MetaTagName);
    tag.setAttribute(NameAttribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute(ContentAttribute, content);
}

/**
 * Syncs document `<meta>` tags to the deepest matched route's `handle.meta` (description + arbitrary
 * name keys). Returns the unregister function.
 *
 * React's null-rendering `<DocumentMeta>` becomes an `afterEach` hook, for the same reason
 * `installDocumentTitle` does; `createAppRouter` wires it for you. No-op without a `document` (SSR).
 */
export function installDocumentMeta(router: Router): () => void {
  if (typeof document === 'undefined') return () => {};

  // Names written on a previous navigation — cleared when the next route's meta omits them, so a
  // tag set by one page never lingers on another. React held this in a ref; a closure is the same
  // thing without the component.
  let managedNames: ReadonlySet<string> = new Set();

  return router.afterEach((to) => {
    const meta: RouteMeta | undefined = deepestHandleValue(to, (handle) => handle.meta);

    const nextNames = new Set([DescriptionName, ...Object.keys(meta ?? {})]);
    for (const name of managedNames) {
      if (!nextNames.has(name)) setMetaTag(name, undefined);
    }
    managedNames = nextNames;

    setMetaTag(DescriptionName, meta?.description);
    for (const [name, content] of Object.entries(meta ?? {})) {
      if (name !== DescriptionName) setMetaTag(name, content);
    }
  });
}

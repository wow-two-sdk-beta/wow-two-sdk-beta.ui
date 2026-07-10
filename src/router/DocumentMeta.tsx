import { useEffect, useRef } from 'react';
import { useMatches } from 'react-router-dom';

import type { RouteHandle } from './RouteConfig';

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

/** Syncs document `<meta>` tags to the deepest matched route's `handle.meta` (description + arbitrary name keys). */
export function DocumentMeta() {
  const matches = useMatches();

  // Names written on a previous navigation — cleared when the next route's meta omits them,
  // so a tag set by one page never lingers on another.
  const managedNamesRef = useRef<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const meta = [...matches]
      .reverse()
      .map((match) => (match.handle as RouteHandle | undefined)?.meta)
      .find(Boolean);

    const nextNames = new Set([DescriptionName, ...Object.keys(meta ?? {})]);
    for (const name of managedNamesRef.current) {
      if (!nextNames.has(name)) setMetaTag(name, undefined);
    }
    managedNamesRef.current = nextNames;

    setMetaTag(DescriptionName, meta?.description);
    for (const [name, content] of Object.entries(meta ?? {})) {
      if (name !== DescriptionName) setMetaTag(name, content);
    }
  }, [matches]);

  return null;
}

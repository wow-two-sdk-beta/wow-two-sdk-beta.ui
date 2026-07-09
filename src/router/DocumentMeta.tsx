import { useEffect } from 'react';
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

  useEffect(() => {
    const meta = [...matches]
      .reverse()
      .map((match) => (match.handle as RouteHandle | undefined)?.meta)
      .find(Boolean);
    setMetaTag(DescriptionName, meta?.description);
    for (const [name, content] of Object.entries(meta ?? {})) {
      if (name !== DescriptionName) setMetaTag(name, content);
    }
  }, [matches]);

  return null;
}

# Color mode ownership

- Each provider owns independent reactive mode state and optional persisted preference.
- Browser root styling is coordinated by document root; server renders perform no DOM writes.
- Descendant providers take precedence over ancestors, including child-first Vue mounting.
- For independent app roots in one document, the latest mounted owner takes precedence.
- Removing an owner reveals the remaining active owner without overwriting its mode.
- Removing the final owner restores the original dark class and color-scheme value and priority.
- Explicit defaults produce the same mode during SSR and the initial client render.

Regression coverage: [DOM ownership](../../../../tests/unit/foundation/primitives/Ownership.dom.test.ts) and
[SSR](../../../../tests/unit/foundation/primitives/ColorMode.ssr.test.ts).

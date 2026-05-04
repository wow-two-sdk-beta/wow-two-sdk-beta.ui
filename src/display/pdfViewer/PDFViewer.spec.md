# PDFViewer

## Purpose
View a PDF inline. **First-generation** uses an `<iframe>` pointing at the PDF; the browser's built-in viewer renders it. URL hash params (`#page=N&zoom=Z`) drive page/zoom state. Real per-page rendering, thumbnails, search, annotations are deferred to a future iteration that wraps PDF.js.

## Anatomy
```
<PDFViewer src page? zoom?>
  ├── toolbar (page nav + zoom + download)
  └── iframe (browser-native PDF viewer)
</PDFViewer>
```

## Required behaviors
- `src` is the PDF URL (http(s) or blob).
- `page`/`onPageChange` controlled or uncontrolled.
- Toolbar: prev/next page (best-effort — depends on browser support for PDF URL fragments), zoom in/out, download.
- Caveat: first-gen relies on browser's built-in PDF viewer. Behavior varies (Chrome / Safari / Firefox have slightly different fragment support; mobile Safari opens in a separate viewer).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `src` | `string` | required | PDF URL |
| `page` / `defaultPage` / `onPageChange` | controlled | `1` | |
| `zoom` / `defaultZoom` | `number` | `100` | Percent |
| `pageCount` | `number` | — | Optional total — if omitted, prev/next have no clamp |
| `title` | `string` | `'PDF document'` | iframe title for SR |
| `download` | `boolean` | `true` | Show download button |
| `height` | `string` | `'70vh'` | |

## Composition
Single component. Real PDF.js wrap will be a separate `<PDFViewer.PdfJsEngine>` slot or a sibling component (`PDFViewer.Advanced`?) — TBD when PDF.js is added.

## Accessibility
- iframe `title` attribute required.
- Toolbar buttons have `aria-label`.
- The native PDF viewer handles its own accessibility (browser-controlled).

## Dependencies
Foundation: `utils`, `icons`. No external libs.

## Known limitations (deferred)
- No per-page rendering (requires PDF.js).
- No thumbnail strip.
- No search.
- No annotations.
- No text selection beyond browser viewer.
- No print preview customization.

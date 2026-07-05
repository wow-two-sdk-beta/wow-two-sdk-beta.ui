# FileUpload

## Purpose
Drag-drop file zone with click-to-pick fallback. Dropzone variant of the L4 `FilePicker` — whole surface accepts files; rejected files are flagged. The file *list* below is rendered by the consumer (we only emit the `File[]`).

## Anatomy
```
<FileUpload>
  ├── drop zone (icon + label + hint)        ← always rendered
  └── (optional) file list (consumer-driven)
</FileUpload>
```

## Required behaviors
- Click → opens native file picker.
- Drag-over → highlight zone; if any file is rejected (extension / size / count), show reject styling.
- Drop → fires `onFilesChange` with the (filtered) array.
- Keyboard: Enter / Space on focused zone → opens picker.
- Disabled zone: no pointer / drag handlers.

## Visual states
`idle` · `hover` · `focus-visible` · `dragging` · `dragging-reject` · `disabled` · `error` (validation prop)

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `accept` | `string` | — | Standard `<input accept>` syntax. |
| `multiple` | `boolean` | `false` | |
| `maxSize` | `number` (bytes) | — | Per-file size cap. Files exceeding fall into the rejected list. |
| `maxFiles` | `number` | — | Cap total accepted count (multiple mode). |
| `onFilesChange` | `(accepted: File[], rejected: FileRejection[]) => void` | — | |
| `disabled` | `boolean` | `false` | |
| `invalid` | `boolean` | `false` | Force error styling. |
| `label` | `ReactNode` | `'Drop files here, or click to browse'` | |
| `hint` | `ReactNode` | — | Secondary line — typically size/format hints. |
| `name` | `string` | — | Native `<input>` name (for forms). |
| `children` | `ReactNode` | — | Rendered below the zone — typically the consumer's file list. |

## Composition model
Single component. The native `<input type="file">` is hidden; the visible zone is the drop target. `children` are rendered below the zone for the consumer's own file/preview list (we deliberately don't bake one in — too opinionated).

## Accessibility
- The zone is `role="button"` + `tabIndex=0`. Click + keyboard activate the input.
- `aria-disabled` propagated when `disabled`.
- Validation errors are visual; consumers should pair with `formField` / `formErrorMessage` for SR-friendly errors.

## Dependencies
Foundation: `utils`, `icons`. Same domain: none. No cross-domain.

## Inspirations
react-dropzone, Mantine `Dropzone`. Ours skips the headless render-prop API in favor of a visible default zone + consumer-rendered file list.

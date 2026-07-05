# FilePicker

## Purpose
Basic file picker — styled trigger + visually-hidden native `<input type="file">`. For drag-drop / preview / progress / dropzone, see the L5 `Dropzone` organism (planned).

## Props
| Name | Type | Default |
|---|---|---|
| `label` | `ReactNode` | `'Choose file'` |
| `onFilesChange` | `(files: FileList \| null) => void` | — |
| `preview` | `ReactNode` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| ...rest | native `<input type="file">` attrs (accept, multiple, etc.) | — |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`.

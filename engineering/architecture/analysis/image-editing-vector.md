# Image editing vector

## Implemented slice

Generic source-preserving edit intent: original upright crop, aspect presets, quarter-turn rotate, both flips,
proportional or explicit bounded output dimensions, PNG/JPEG/WebP quality, configured background-removal intent,
reset, bounded undo/redo, keyboard-labelled controls, caller busy/error states, source invalidation and preview/apply
intents. Values live in `src/domain/imageEditing`; `presentation/forms/imageEditor` composes the existing crop engine.
No pixel-processing dependency or network client is loaded by this surface.

Backend counterpart already exists: `WoW2.Sdk.Backend.Beta` `Media.Images.IImageService`, implemented with SkiaSharp.
The host owns original/derivative lineage, organization authorization, limits, uploads and approval. Background removal
is an explicit service capability, not simulated by color erasure. Its engine/model provenance belongs to the adapter.

## Completeness map

| Capability | Owner/state |
|---|---|
| Crop pointer/keyboard handles, natural pixels, aspect lock | Existing ImageCropEditor |
| Transform recipe, geometry validation, source-reset contract | ImageEditRecipe and ImageEditor |
| History and explicit preview/apply flow | ImageEditor using shared snapshot history |
| Actual transform/re-encode and EXIF removal | Backend Media.Images, already implemented |
| Background segmentation | Host-selected removal adapter; no inference engine in UI core |
| Text authoring | Existing MarkdownEditor; additive showImages controls its built-in preview |
| Upload, private source reads, revision checks, lineage and approval | Product boundary |
| Pixel filters (brightness/contrast/saturation/blur) | Deferred inventory; not part of this raster transform release |
| Drawing, annotations, layers, multi-zone crop and batch editing | Deferred inventory; separate design before claiming support |
| Rich-text/WYSIWYG, collaborative editing and code engines | Existing companion-package roadmap; Markdown remains current text surface |
| Manual assistive-technology and consumer review | Required per actual application; not proved by source inventory |

The UI is an engine-independent control surface; adding another worker must preserve its recipe semantics.
The existing server image engine performs crop before rotation; consumers must not rotate the crop coordinate basis.

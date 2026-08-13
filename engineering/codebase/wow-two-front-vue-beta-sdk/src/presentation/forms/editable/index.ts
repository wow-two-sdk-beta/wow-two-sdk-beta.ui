export { default as Editable, type EditableProps } from './Editable.vue';
/* React attached these as `Editable.Preview` / `.Input` / `.Submit` / `.Cancel` via
   `Object.assign`. An SFC's generated default export cannot carry statics cleanly, so they
   ship as siblings. `EditableButtonProps` types both buttons, exactly as it did in React. */
export { default as EditableCancel } from './EditableCancel.vue';
export { default as EditableInput, type EditableInputProps } from './EditableInput.vue';
export { default as EditablePreview, type EditablePreviewProps } from './EditablePreview.vue';
export {
  default as EditableSubmit,
  type EditableButtonProps,
} from './EditableSubmit.vue';
export { useEditableContext, type EditableContextValue } from './EditableContext';
/* React shipped the compound root as the module default too; the Vue default is the root SFC
   (the parts are the flat named exports above). */
export { default } from './Editable.vue';

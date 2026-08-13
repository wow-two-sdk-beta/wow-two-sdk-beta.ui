export { default as Wizard, type WizardProps } from './Wizard.vue';
/* React attached these as `Wizard.Steps` / `.Step` / `.Footer` via `Object.assign`. An
   SFC's generated default export cannot carry statics cleanly, so they ship as siblings. */
export { default as WizardFooter, type WizardFooterProps } from './WizardFooter.vue';
export { default as WizardStep, type WizardStepProps } from './WizardStep.vue';
export { default as WizardSteps, type WizardStepsProps } from './WizardSteps.vue';
export { useWizard, type StepInfo, type WizardContextValue } from './WizardContext';
/* React shipped the compound root as the module default too; the Vue default is the root SFC
   (the parts are the flat named exports above). */
export { default } from './Wizard.vue';

export { default as Accordion, type AccordionProps } from './Accordion.vue';
/* React attached these as `Accordion.Item` / `.Trigger` / `.Content` via `Object.assign`.
   An SFC's generated default export cannot carry statics cleanly, so they ship as siblings. */
export { default as AccordionItem, type AccordionItemProps } from './AccordionItem.vue';
export { default as AccordionTrigger, type AccordionTriggerProps } from './AccordionTrigger.vue';
export { default as AccordionContent, type AccordionContentProps } from './AccordionContent.vue';
export {
  AccordionType,
  useAccordionContext,
  useAccordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from './AccordionContext';

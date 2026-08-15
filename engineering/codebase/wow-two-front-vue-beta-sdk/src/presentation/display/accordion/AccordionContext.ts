import { inject, type InjectionKey } from 'vue';

/** Defines the Accordion selection mode. */
export const AccordionType = {
  /** Refers to allowing one open panel at a time. */
  Single: 'single',
  /** Refers to allowing multiple open panels. */
  Multiple: 'multiple',
} as const;

export type AccordionType = (typeof AccordionType)[keyof typeof AccordionType];

/** The open-set state an `Accordion` root shares with its items. */
export interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  disabled: boolean;
}

export const AccordionKey: InjectionKey<AccordionContextValue> = Symbol('wow-two.accordion');

/** Reads the enclosing `Accordion` state. */
export function useAccordionContext(): AccordionContextValue {
  const context = inject(AccordionKey, null);
  if (!context) throw new Error('Accordion.* must be used inside <Accordion>');
  return context;
}

/** The per-item state an `AccordionItem` shares with its trigger and content. */
export interface AccordionItemContextValue {
  value: string;
  open: boolean;
  contentId: string;
  triggerId: string;
  disabled: boolean;
}

export const AccordionItemKey: InjectionKey<AccordionItemContextValue> = Symbol('wow-two.accordionItem');

/** Reads the enclosing `AccordionItem` state. */
export function useAccordionItemContext(): AccordionItemContextValue {
  const context = inject(AccordionItemKey, null);
  if (!context) throw new Error('Accordion.Trigger / Content must be used inside <Accordion.Item>');
  return context;
}

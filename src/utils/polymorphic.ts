import type { ComponentPropsWithRef, ElementType, PropsWithoutRef } from 'react';

/**
 * Props for a polymorphic component (`as` prop). Use only when a component
 * meaningfully changes its DOM element — most components should use `Slot`/`asChild`
 * instead.
 */
export type PolymorphicProps<C extends ElementType, P = object> = P &
  Omit<ComponentPropsWithRef<C>, keyof P | 'as'> & { as?: C };

export type PolymorphicPropsWithoutRef<C extends ElementType, P = object> = P &
  Omit<PropsWithoutRef<ComponentPropsWithRef<C>>, keyof P | 'as'> & { as?: C };

export type PolymorphicRef<C extends ElementType> = ComponentPropsWithRef<C>['ref'];

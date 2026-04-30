import { forwardRef, type Ref } from 'react';
import { Stack, type StackProps } from '../stack/Stack';

export type HStackProps = Omit<StackProps, 'direction'>;

/** Stack preset: `direction="row"`. */
export const HStack = forwardRef<HTMLElement, HStackProps>((props, ref) => (
  <Stack ref={ref as Ref<HTMLElement>} direction="row" {...props} />
));
HStack.displayName = 'HStack';

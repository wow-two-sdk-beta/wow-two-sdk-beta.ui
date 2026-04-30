import { forwardRef, type Ref } from 'react';
import { Stack, type StackProps } from '../stack/Stack';

export type VStackProps = Omit<StackProps, 'direction'>;

/** Stack preset: `direction="column"` (default). Provided for symmetry with HStack. */
export const VStack = forwardRef<HTMLElement, VStackProps>((props, ref) => (
  <Stack ref={ref as Ref<HTMLElement>} direction="column" {...props} />
));
VStack.displayName = 'VStack';

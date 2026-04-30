import { cloneElement, isValidElement, type ReactElement } from 'react';
import { VisuallyHidden } from '../visuallyHidden/VisuallyHidden';

export interface AccessibleIconProps {
  /** Required accessible label for the icon. */
  label: string;
  /** Single icon element — will receive `aria-hidden` so SR reads only the label. */
  children: ReactElement;
}

/**
 * Wrap an icon-only element with an accessible label. The icon is hidden
 * from assistive tech and a `VisuallyHidden` sibling provides the label.
 */
export function AccessibleIcon({ label, children }: AccessibleIconProps) {
  const icon = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-hidden'?: boolean | string; focusable?: string }>, {
        'aria-hidden': 'true',
        focusable: 'false',
      })
    : children;
  return (
    <>
      {icon}
      <VisuallyHidden>{label}</VisuallyHidden>
    </>
  );
}

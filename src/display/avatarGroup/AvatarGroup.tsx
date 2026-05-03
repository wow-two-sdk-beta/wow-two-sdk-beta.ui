import { Children, forwardRef, isValidElement, type ComponentPropsWithoutRef, type ReactElement } from 'react';
import { cn } from '../../utils';
import { Avatar, type AvatarProps } from '../avatar/Avatar';

export interface AvatarGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** Maximum avatars to render. Excess is shown as a "+N" tile. */
  max?: number;
  /** Avatar size applied to all children. Default `md`. */
  size?: AvatarProps['size'];
  /** Negative-margin overlap class applied between avatars. Default `-ml-2`. */
  overlap?: string;
}

/**
 * Stacked group of `Avatar` children with overlap and an optional "+N more"
 * indicator when children exceed `max`.
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max, size = 'md', overlap = '-ml-2', className, children, ...props }, ref) => {
    const all = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
    const visible = max ? all.slice(0, max) : all;
    const overflow = max ? Math.max(0, all.length - max) : 0;

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center', className)}
        {...props}
      >
        {visible.map((child, i) => (
          <div
            key={i}
            className={cn('ring-2 ring-background rounded-full', i > 0 && overlap)}
          >
            {/* Force consistent size */}
            <Avatar {...child.props} size={size} />
          </div>
        ))}
        {overflow > 0 && (
          <Avatar
            size={size}
            name={`+${overflow}`}
            className={cn(overlap, 'ring-2 ring-background')}
          />
        )}
      </div>
    );
  },
);
AvatarGroup.displayName = 'AvatarGroup';

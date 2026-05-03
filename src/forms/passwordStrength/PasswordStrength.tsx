import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface PasswordStrengthProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The password to measure. */
  value: string;
  /** Override the score (0–4). When set, internal scoring is bypassed. */
  score?: 0 | 1 | 2 | 3 | 4;
  /** Hide the textual label under the bar. */
  hideLabel?: boolean;
}

const LABELS = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
const TONE = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-success', 'bg-success'];

function scorePassword(pw: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

/**
 * Strength meter for password fields. Naive rule-based scoring 0–4. Pass
 * `score` to override (e.g. drive from `zxcvbn`).
 */
export const PasswordStrength = forwardRef<HTMLDivElement, PasswordStrengthProps>(
  ({ value, score, hideLabel, className, ...props }, ref) => {
    const s: 0 | 1 | 2 | 3 | 4 = score ?? (value.length === 0 ? 0 : scorePassword(value));
    const label = LABELS[s] ?? '';
    const tone = TONE[s] ?? 'bg-destructive';
    return (
      <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props}>
        <div className="flex gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full bg-muted transition-colors',
                i < s && tone,
              )}
            />
          ))}
        </div>
        {!hideLabel && value && (
          <div className="text-xs text-muted-foreground">{label}</div>
        )}
      </div>
    );
  },
);
PasswordStrength.displayName = 'PasswordStrength';

import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type HTMLAttributes,
} from 'react';
import { cn } from '../../utils';

export interface TypewriterProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  text: string | string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseBetween?: number;
  loop?: boolean;
  cursor?: boolean;
  cursorChar?: string;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Char-by-char typewriter. Single string types once; array of strings cycles
 * through (type → pause → delete → next). `prefers-reduced-motion` short-
 * circuits to the full string.
 */
export const Typewriter = forwardRef<HTMLElement, TypewriterProps>(function Typewriter(
  {
    text,
    typeSpeed = 60,
    deleteSpeed = 40,
    pauseBetween = 1500,
    loop,
    cursor = true,
    cursorChar = '│',
    as = 'span',
    className,
    ...rest
  },
  ref,
) {
  const phrases = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const shouldLoop = loop ?? phrases.length > 1;
  const reduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const current = phrases[phraseIndex] ?? '';
    let timeout: number;

    if (!deleting) {
      // Typing phase.
      if (charIndex < current.length) {
        timeout = window.setTimeout(() => setCharIndex(charIndex + 1), typeSpeed);
      } else {
        // Done typing this phrase.
        if (phrases.length === 1 && !shouldLoop) return;
        timeout = window.setTimeout(() => setDeleting(true), pauseBetween);
      }
    } else {
      // Deleting phase.
      if (charIndex > 0) {
        timeout = window.setTimeout(() => setCharIndex(charIndex - 1), deleteSpeed);
      } else {
        // Move to next phrase.
        const nextIdx = (phraseIndex + 1) % phrases.length;
        if (!shouldLoop && nextIdx === 0) return;
        setDeleting(false);
        setPhraseIndex(nextIdx);
      }
    }
    return () => window.clearTimeout(timeout);
  }, [charIndex, deleting, phraseIndex, phrases, typeSpeed, deleteSpeed, pauseBetween, shouldLoop, reduced]);

  const fullText = reduced
    ? (Array.isArray(text) ? text[0] ?? '' : text)
    : (phrases[phraseIndex] ?? '').slice(0, charIndex);

  const Tag = as as ElementType;
  return (
    <Tag ref={ref as React.Ref<HTMLElement>} className={cn('inline-block', className)} {...rest}>
      {fullText}
      {cursor && !reduced && (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block motion-safe:animate-[blink-caret_1s_step-end_infinite]"
        >
          {cursorChar}
        </span>
      )}
    </Tag>
  );
});

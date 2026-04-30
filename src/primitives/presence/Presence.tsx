import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from 'react';
import { composeRefs } from '../../utils/composeRefs';

export interface PresenceProps {
  /** Whether the content should be present. Toggle false to trigger exit. */
  present: boolean;
  /** Single React element child — receives `ref` and `data-state` ("open" | "closed"). */
  children: ReactElement;
}

/**
 * Defer unmount until the child's exit animation/transition finishes.
 * Pass `present={false}` to start the exit; the child stays mounted with
 * `data-state="closed"` until `animationend`/`transitionend` fires.
 */
export function Presence({ present, children }: PresenceProps): ReactElement | null {
  const [rendered, setRendered] = useState(present);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (present) {
      setRendered(true);
      return;
    }
    const node = ref.current;
    if (!node) {
      setRendered(false);
      return;
    }
    const cs = getComputedStyle(node);
    const hasAnim = cs.animationName !== 'none' && cs.animationDuration !== '0s';
    const hasTrans = cs.transitionDuration !== '0s';
    if (!hasAnim && !hasTrans) {
      setRendered(false);
      return;
    }
    const onEnd = () => setRendered(false);
    node.addEventListener('animationend', onEnd);
    node.addEventListener('transitionend', onEnd);
    return () => {
      node.removeEventListener('animationend', onEnd);
      node.removeEventListener('transitionend', onEnd);
    };
  }, [present]);

  if (!rendered || !isValidElement(children)) return null;
  const child = children as ReactElement<{ ref?: Ref<HTMLElement> }> & { ref?: Ref<HTMLElement> };
  return cloneElement(child, {
    ref: composeRefs(ref, child.ref),
    'data-state': present ? 'open' : 'closed',
  } as Partial<typeof child.props>);
}

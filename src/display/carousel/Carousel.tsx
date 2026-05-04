import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';

interface CarouselContextValue {
  index: number;
  setIndex: (index: number) => void;
  count: number;
  setCount: (count: number) => void;
  loop: boolean;
  prev: () => void;
  next: () => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  autoPlay?: number;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarouselContext() {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error('Carousel.* must be used inside <Carousel>');
  return ctx;
}

export interface CarouselProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  loop?: boolean;
  autoPlay?: number;
  /** When set, overrides the automatic count (use for virtualised slides). */
  slidesCount?: number;
  children: ReactNode;
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  {
    index: indexProp,
    defaultIndex = 0,
    onIndexChange,
    loop = false,
    autoPlay,
    slidesCount,
    className,
    children,
    ...rest
  },
  ref,
) {
  const [index, setIndexState] = useControlled({
    controlled: indexProp,
    default: defaultIndex,
    onChange: onIndexChange,
  });
  const [count, setCount] = useState(slidesCount ?? 0);
  const [paused, setPaused] = useState(false);

  // External override.
  useEffect(() => {
    if (slidesCount != null) setCount(slidesCount);
  }, [slidesCount]);

  const setIndex = useCallback(
    (i: number) => {
      if (count === 0) {
        setIndexState(0);
        return;
      }
      let next = i;
      if (loop) {
        next = ((i % count) + count) % count;
      } else {
        next = Math.max(0, Math.min(count - 1, i));
      }
      setIndexState(next);
    },
    [count, loop, setIndexState],
  );

  const prev = useCallback(() => setIndex(index - 1), [index, setIndex]);
  const next = useCallback(() => setIndex(index + 1), [index, setIndex]);

  // Auto-play.
  useEffect(() => {
    if (!autoPlay || paused || count === 0) return;
    const handle = window.setInterval(() => {
      setIndex(loop ? index + 1 : Math.min(count - 1, index + 1));
    }, autoPlay);
    return () => window.clearInterval(handle);
  }, [autoPlay, paused, count, index, loop, setIndex]);

  const ctx = useMemo<CarouselContextValue>(
    () => ({ index, setIndex, count, setCount, loop, prev, next, paused, setPaused, autoPlay }),
    [index, setIndex, count, loop, prev, next, paused, autoPlay],
  );

  return (
    <CarouselContext.Provider value={ctx}>
      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className={cn('relative', className)}
        {...rest}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});

export interface CarouselViewportProps extends HTMLAttributes<HTMLDivElement> {
  /** Default `'Carousel'`. */
  'aria-label'?: string;
}

export const CarouselViewport = forwardRef<HTMLDivElement, CarouselViewportProps>(
  function CarouselViewport(
    { 'aria-label': ariaLabel = 'Carousel', className, onKeyDown, children, ...rest },
    forwardedRef,
  ) {
    const ctx = useCarouselContext();
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        ctx.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        ctx.next();
      }
    };
    return (
      <div
        ref={forwardedRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

export interface CarouselSlidesProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CarouselSlides = forwardRef<HTMLDivElement, CarouselSlidesProps>(
  function CarouselSlides({ className, children, ...rest }, forwardedRef) {
    const ctx = useCarouselContext();
    const childArray = Children.toArray(children).filter(isValidElement);

    useEffect(() => {
      ctx.setCount(childArray.length);
    }, [childArray.length, ctx]);

    return (
      <div
        ref={forwardedRef}
        aria-live={ctx.autoPlay ? 'off' : 'polite'}
        className={cn('flex transition-transform duration-300 ease-out', className)}
        style={{ transform: `translateX(-${ctx.index * 100}%)` }}
        {...rest}
      >
        {childArray.map((child, idx) => (
          <div
            key={idx}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${childArray.length}`}
            aria-hidden={idx !== ctx.index || undefined}
            className="w-full shrink-0"
          >
            {child}
          </div>
        ))}
      </div>
    );
  },
);

export type CarouselSlideProps = HTMLAttributes<HTMLDivElement>;

export const CarouselSlide = forwardRef<HTMLDivElement, CarouselSlideProps>(
  function CarouselSlide({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('h-full w-full', className)} {...rest} />;
  },
);

export interface CarouselNavButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Default `'Previous slide'` / `'Next slide'`. */
  'aria-label'?: string;
}

export const CarouselPrev = forwardRef<HTMLButtonElement, CarouselNavButtonProps>(
  function CarouselPrev(
    { 'aria-label': ariaLabel = 'Previous slide', className, onClick, type = 'button', children, ...rest },
    forwardedRef,
  ) {
    const ctx = useCarouselContext();
    const disabled = !ctx.loop && ctx.index === 0;
    return (
      <button
        ref={forwardedRef}
        type={type}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.prev();
        }}
        className={cn(
          'absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow ring-1 ring-border transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
          className,
        )}
        {...rest}
      >
        {children ?? <Icon icon={ChevronLeft} size={16} />}
      </button>
    );
  },
);

export const CarouselNext = forwardRef<HTMLButtonElement, CarouselNavButtonProps>(
  function CarouselNext(
    { 'aria-label': ariaLabel = 'Next slide', className, onClick, type = 'button', children, ...rest },
    forwardedRef,
  ) {
    const ctx = useCarouselContext();
    const disabled = !ctx.loop && ctx.index === ctx.count - 1;
    return (
      <button
        ref={forwardedRef}
        type={type}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.next();
        }}
        className={cn(
          'absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow ring-1 ring-border transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
          className,
        )}
        {...rest}
      >
        {children ?? <Icon icon={ChevronRight} size={16} />}
      </button>
    );
  },
);

export type CarouselDotsProps = HTMLAttributes<HTMLDivElement>;

export const CarouselDots = forwardRef<HTMLDivElement, CarouselDotsProps>(
  function CarouselDots({ className, ...rest }, forwardedRef) {
    const ctx = useCarouselContext();
    return (
      <div
        ref={forwardedRef}
        className={cn('mt-3 flex items-center justify-center gap-1.5', className)}
        {...rest}
      >
        {Array.from({ length: ctx.count }, (_, i) => (
          <CarouselDot key={i} slideIndex={i} />
        ))}
      </div>
    );
  },
);

export interface CarouselDotProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  slideIndex: number;
}

export const CarouselDot = forwardRef<HTMLButtonElement, CarouselDotProps>(
  function CarouselDot({ slideIndex, className, onClick, type = 'button', ...rest }, forwardedRef) {
    const ctx = useCarouselContext();
    const isActive = ctx.index === slideIndex;
    return (
      <button
        ref={forwardedRef}
        type={type}
        aria-label={`Go to slide ${slideIndex + 1}`}
        aria-current={isActive || undefined}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.setIndex(slideIndex);
        }}
        className={cn(
          'h-1.5 rounded-full bg-border transition-all hover:bg-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive ? 'w-6 bg-primary hover:bg-primary' : 'w-1.5',
          className,
        )}
        {...rest}
      />
    );
  },
);

type CarouselComponent = typeof Carousel & {
  Viewport: typeof CarouselViewport;
  Slides: typeof CarouselSlides;
  Slide: typeof CarouselSlide;
  Prev: typeof CarouselPrev;
  Next: typeof CarouselNext;
  Dots: typeof CarouselDots;
  Dot: typeof CarouselDot;
};

(Carousel as CarouselComponent).Viewport = CarouselViewport;
(Carousel as CarouselComponent).Slides = CarouselSlides;
(Carousel as CarouselComponent).Slide = CarouselSlide;
(Carousel as CarouselComponent).Prev = CarouselPrev;
(Carousel as CarouselComponent).Next = CarouselNext;
(Carousel as CarouselComponent).Dots = CarouselDots;
(Carousel as CarouselComponent).Dot = CarouselDot;

export default Carousel as CarouselComponent;

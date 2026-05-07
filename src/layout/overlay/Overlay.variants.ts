import { tv, type VariantProps } from '../../utils';

/* Overlay positioning + visibility + transition surface — see Overlay.standard.md + Overlay.spec.md. */
export const overlayVariants = tv({
  base: 'absolute',
  variants: {
    position: {
      'top-right':    'top-[var(--ui-overlay-inset,0.5rem)] right-[var(--ui-overlay-inset,0.5rem)]',
      'top-left':     'top-[var(--ui-overlay-inset,0.5rem)] left-[var(--ui-overlay-inset,0.5rem)]',
      'bottom-right': 'bottom-[var(--ui-overlay-inset,0.5rem)] right-[var(--ui-overlay-inset,0.5rem)]',
      'bottom-left':  'bottom-[var(--ui-overlay-inset,0.5rem)] left-[var(--ui-overlay-inset,0.5rem)]',
      'top':          'top-[var(--ui-overlay-inset,0.5rem)] left-1/2 -translate-x-1/2',
      'bottom':       'bottom-[var(--ui-overlay-inset,0.5rem)] left-1/2 -translate-x-1/2',
      'left':         'left-[var(--ui-overlay-inset,0.5rem)] top-1/2 -translate-y-1/2',
      'right':        'right-[var(--ui-overlay-inset,0.5rem)] top-1/2 -translate-y-1/2',
      'center':       'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      'custom':       '', // consumer passed inset object — positioning via inline style
    },
    visibilityMode: {
      'always':        '',
      'hover':         'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-hover:[transition-duration:var(--ui-overlay-enter,200ms)] group-focus-within:[transition-duration:var(--ui-overlay-enter,200ms)]',
      'focus-within':  'opacity-0 group-focus-within:opacity-100 group-focus-within:[transition-duration:var(--ui-overlay-enter,200ms)]',
      'presence':      'data-[state=closed]:opacity-0 data-[state=open]:[transition-duration:var(--ui-overlay-enter,200ms)]',
    },
    transition: {
      'none':              '',
      'fade':              'transition-opacity duration-[var(--ui-overlay-exit,200ms)] ease-out',
      'fade-scale':        'transition-[opacity,transform] duration-[var(--ui-overlay-exit,200ms)] ease-out',
      'fade-slide-up':     'transition-[opacity,transform] duration-[var(--ui-overlay-exit,200ms)] ease-out',
      'fade-slide-down':   'transition-[opacity,transform] duration-[var(--ui-overlay-exit,200ms)] ease-out',
      'fade-slide-left':   'transition-[opacity,transform] duration-[var(--ui-overlay-exit,200ms)] ease-out',
      'fade-slide-right':  'transition-[opacity,transform] duration-[var(--ui-overlay-exit,200ms)] ease-out',
    },
  },
  compoundVariants: [
    // === HOVER mode + transform-bearing transitions ===
    {
      visibilityMode: 'hover', transition: 'fade-scale',
      class:
        'scale-95 group-hover:scale-100 group-focus-within:scale-100 ' +
        'motion-reduce:scale-100 motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100',
    },
    {
      visibilityMode: 'hover', transition: 'fade-slide-up',
      class:
        'translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0 ' +
        'motion-reduce:translate-y-0 motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-within:translate-y-0',
    },
    {
      visibilityMode: 'hover', transition: 'fade-slide-down',
      class:
        '-translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0 ' +
        'motion-reduce:translate-y-0 motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-within:translate-y-0',
    },
    {
      visibilityMode: 'hover', transition: 'fade-slide-left',
      class:
        'translate-x-1 group-hover:translate-x-0 group-focus-within:translate-x-0 ' +
        'motion-reduce:translate-x-0 motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-within:translate-x-0',
    },
    {
      visibilityMode: 'hover', transition: 'fade-slide-right',
      class:
        '-translate-x-1 group-hover:translate-x-0 group-focus-within:translate-x-0 ' +
        'motion-reduce:translate-x-0 motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-within:translate-x-0',
    },

    // === FOCUS-WITHIN mode + transform-bearing transitions ===
    {
      visibilityMode: 'focus-within', transition: 'fade-scale',
      class: 'scale-95 group-focus-within:scale-100 motion-reduce:scale-100 motion-reduce:group-focus-within:scale-100',
    },
    {
      visibilityMode: 'focus-within', transition: 'fade-slide-up',
      class: 'translate-y-1 group-focus-within:translate-y-0 motion-reduce:translate-y-0 motion-reduce:group-focus-within:translate-y-0',
    },
    {
      visibilityMode: 'focus-within', transition: 'fade-slide-down',
      class: '-translate-y-1 group-focus-within:translate-y-0 motion-reduce:translate-y-0 motion-reduce:group-focus-within:translate-y-0',
    },
    {
      visibilityMode: 'focus-within', transition: 'fade-slide-left',
      class: 'translate-x-1 group-focus-within:translate-x-0 motion-reduce:translate-x-0 motion-reduce:group-focus-within:translate-x-0',
    },
    {
      visibilityMode: 'focus-within', transition: 'fade-slide-right',
      class: '-translate-x-1 group-focus-within:translate-x-0 motion-reduce:translate-x-0 motion-reduce:group-focus-within:translate-x-0',
    },

    // === PRESENCE mode (data-state-driven) + transform-bearing transitions ===
    {
      visibilityMode: 'presence', transition: 'fade-scale',
      class: 'data-[state=closed]:scale-95 motion-reduce:data-[state=closed]:scale-100',
    },
    {
      visibilityMode: 'presence', transition: 'fade-slide-up',
      class: 'data-[state=closed]:translate-y-1 motion-reduce:data-[state=closed]:translate-y-0',
    },
    {
      visibilityMode: 'presence', transition: 'fade-slide-down',
      class: 'data-[state=closed]:-translate-y-1 motion-reduce:data-[state=closed]:translate-y-0',
    },
    {
      visibilityMode: 'presence', transition: 'fade-slide-left',
      class: 'data-[state=closed]:translate-x-1 motion-reduce:data-[state=closed]:translate-x-0',
    },
    {
      visibilityMode: 'presence', transition: 'fade-slide-right',
      class: 'data-[state=closed]:-translate-x-1 motion-reduce:data-[state=closed]:translate-x-0',
    },
  ],
  defaultVariants: {
    position: 'top-right',
    visibilityMode: 'always',
    transition: 'none',
  },
});

export type OverlayVariants = VariantProps<typeof overlayVariants>;

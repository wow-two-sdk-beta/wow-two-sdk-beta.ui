import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  Carousel,
  CarouselDots,
  CarouselNext,
  CarouselPrev,
  CarouselSlide,
  CarouselSlides,
  CarouselViewport,
  type CarouselProps,
} from './Carousel';

const meta: Meta = {
  title: 'Display/Carousel',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const SLIDES = ['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4'];

const SlideCard = ({ label, tone }: { label: string; tone: string }) => (
  <div className={`flex h-48 items-center justify-center text-2xl font-medium text-card-foreground ${tone}`}>
    {label}
  </div>
);

const TONES = ['bg-primary-soft', 'bg-success-soft', 'bg-warning-soft', 'bg-info-soft'];

export const Default: Story = {
  render: () => (
    <div className="w-[28rem]">
      <Carousel>
        <CarouselViewport>
          <CarouselSlides>
            {SLIDES.map((s, i) => (
              <CarouselSlide key={s}>
                <SlideCard label={s} tone={TONES[i] ?? ''} />
              </CarouselSlide>
            ))}
          </CarouselSlides>
          <CarouselPrev />
          <CarouselNext />
        </CarouselViewport>
        <CarouselDots />
      </Carousel>
    </div>
  ),
};

export const Loop: Story = {
  render: () => (
    <div className="w-[28rem]">
      <Carousel canLoop>
        <CarouselViewport>
          <CarouselSlides>
            {SLIDES.map((s, i) => (
              <CarouselSlide key={s}>
                <SlideCard label={s} tone={TONES[i] ?? ''} />
              </CarouselSlide>
            ))}
          </CarouselSlides>
          <CarouselPrev />
          <CarouselNext />
        </CarouselViewport>
        <CarouselDots />
      </Carousel>
    </div>
  ),
};

export const AutoPlay: Story = {
  render: () => (
    <div className="w-[28rem]">
      <Carousel canLoop autoPlay={2500}>
        <CarouselViewport>
          <CarouselSlides>
            {SLIDES.map((s, i) => (
              <CarouselSlide key={s}>
                <SlideCard label={s} tone={TONES[i] ?? ''} />
              </CarouselSlide>
            ))}
          </CarouselSlides>
          <CarouselPrev />
          <CarouselNext />
        </CarouselViewport>
        <CarouselDots />
      </Carousel>
      <p className="mt-2 text-xs text-muted-foreground">Auto-plays every 2.5s. Hover or focus to pause.</p>
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Carousel.tsx source.
 * "Visible slide" is asserted through the a11y tree: inactive slide wrappers
 * carry aria-hidden, so only the active `N of 3` group is queryable by role.
 * ------------------------------------------------------------------------- */

const INTERACTION_SLIDES = ['One', 'Two', 'Three'];

type InteractionArgs = Pick<CarouselProps, 'canLoop' | 'onIndexChange'>;
type InteractionStory = StoryObj<InteractionArgs>;

const interactionRender = (args: InteractionArgs) => (
  <div className="w-[28rem]">
    <Carousel canLoop={args.canLoop} onIndexChange={args.onIndexChange}>
      <CarouselViewport>
        <CarouselSlides>
          {INTERACTION_SLIDES.map((s) => (
            <CarouselSlide key={s}>
              <div className="flex h-32 items-center justify-center bg-muted text-lg">{s}</div>
            </CarouselSlide>
          ))}
        </CarouselSlides>
        <CarouselPrev />
        <CarouselNext />
      </CarouselViewport>
      <CarouselDots />
    </Carousel>
  </div>
);

export const NextPrevNavigateSlides: InteractionStory = {
  args: { onIndexChange: fn() },
  render: (args) => interactionRender(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: 'Next slide' });
    const prev = canvas.getByRole('button', { name: 'Previous slide' });

    // Slide 1 active; without canLoop, Prev is disabled on the first slide.
    await expect(canvas.getByRole('group', { name: '1 of 3' })).toBeInTheDocument();
    await expect(canvas.queryByRole('group', { name: '2 of 3' })).not.toBeInTheDocument();
    await expect(prev).toBeDisabled();

    await userEvent.click(next);
    await expect(canvas.getByRole('group', { name: '2 of 3' })).toBeInTheDocument();
    await expect(args.onIndexChange).toHaveBeenLastCalledWith(1);
    await expect(prev).toBeEnabled();

    await userEvent.click(next);
    await expect(canvas.getByRole('group', { name: '3 of 3' })).toBeInTheDocument();
    // Last slide: Next is disabled without canLoop.
    await expect(next).toBeDisabled();

    await userEvent.click(prev);
    await expect(canvas.getByRole('group', { name: '2 of 3' })).toBeInTheDocument();
    await expect(args.onIndexChange).toHaveBeenLastCalledWith(1);
  },
};

export const DotsSelectSlide: InteractionStory = {
  render: () => interactionRender({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dotOne = canvas.getByRole('button', { name: 'Go to slide 1' });
    const dotThree = canvas.getByRole('button', { name: 'Go to slide 3' });

    await expect(dotOne).toHaveAttribute('aria-current', 'true');
    await expect(dotThree).not.toHaveAttribute('aria-current');

    // Clicking a dot jumps straight to its slide.
    await userEvent.click(dotThree);
    await expect(canvas.getByRole('group', { name: '3 of 3' })).toBeInTheDocument();
    await expect(dotThree).toHaveAttribute('aria-current', 'true');
    await expect(dotOne).not.toHaveAttribute('aria-current');
  },
};

export const LoopWrapsAround: InteractionStory = {
  args: { canLoop: true },
  render: (args) => interactionRender(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: 'Next slide' });
    const prev = canvas.getByRole('button', { name: 'Previous slide' });

    // canLoop: nav buttons never disable at the edges.
    await expect(canvas.getByRole('group', { name: '1 of 3' })).toBeInTheDocument();
    await expect(prev).toBeEnabled();

    // Prev from the first slide wraps to the last…
    await userEvent.click(prev);
    await expect(canvas.getByRole('group', { name: '3 of 3' })).toBeInTheDocument();
    await expect(next).toBeEnabled();

    // …and Next from the last wraps back to the first.
    await userEvent.click(next);
    await expect(canvas.getByRole('group', { name: '1 of 3' })).toBeInTheDocument();
  },
};

export const ArrowKeysNavigateSlides: InteractionStory = {
  render: () => interactionRender({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByRole('group', { name: 'Carousel' });

    // The viewport is the tab stop; arrow keys steer while it has focus.
    await userEvent.tab();
    await expect(viewport).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('group', { name: '2 of 3' })).toBeInTheDocument();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('group', { name: '1 of 3' })).toBeInTheDocument();
  },
};

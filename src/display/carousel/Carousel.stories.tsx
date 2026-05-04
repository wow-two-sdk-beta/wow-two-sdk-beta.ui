import type { Meta, StoryObj } from '@storybook/react';
import {
  Carousel,
  CarouselDots,
  CarouselNext,
  CarouselPrev,
  CarouselSlide,
  CarouselSlides,
  CarouselViewport,
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
      <Carousel loop>
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
      <Carousel loop autoPlay={2500}>
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

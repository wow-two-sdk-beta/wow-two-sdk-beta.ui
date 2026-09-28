import { inject, type ComputedRef, type InjectionKey } from 'vue';
import type { SkeletonStateAnimation } from './SkeletonState.variants';

/** What a `SkeletonStateGroup` shares with the placeholders inside it. */
export interface SkeletonStateGroupContext {
  /** Whether the region is loading; every `SkeletonStateSlot` without its own flag follows it. */
  readonly isLoading: ComputedRef<boolean>;
  /** How every placeholder inside moves, unless one sets its own. */
  readonly animation: ComputedRef<SkeletonStateAnimation | undefined>;
}

export const skeletonStateGroupKey: InjectionKey<SkeletonStateGroupContext> = Symbol('wow-two.skeletonStateGroup');

/** Reads the nearest `SkeletonStateGroup`, or `null` outside one. */
export function useSkeletonStateGroup(): SkeletonStateGroupContext | null {
  return inject(skeletonStateGroupKey, null);
}

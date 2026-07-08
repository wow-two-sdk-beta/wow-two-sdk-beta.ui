import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupVariant,
  ToggleButtonVariant,
  ToggleMode,
} from '../../actions';

import {
  CategoryDisplays,
  CategoryNavVariant,
  CategoryOrder,
  type CategoryKey,
  type EmojiPickerSize,
  EmojiPickerSizes,
} from './EmojiPicker.variants';

/** Defines props for the horizontal category nav. */
export interface CategoryNavProps {
  /** The category-nav layout — segmented icon strip or labelled pills. */
  readonly variant: CategoryNavVariant;

  /** The active category. */
  readonly active: CategoryKey;

  /** Selects a category. */
  readonly onSelect: (category: CategoryKey) => void;

  /** The nav scale. */
  readonly size: EmojiPickerSize;

  /** The strip icon size in px. Default `round(nav * 0.8)` derived from the scale. */
  readonly iconSize?: number;
}

/** Renders the category picker as a single-select `ToggleButtonGroup` — a segmented icon strip or a labelled pill row. */
export function CategoryNav({ variant, active, onSelect, size, iconSize }: CategoryNavProps) {
  // A category is always selected: the group emits `null` when the active button is re-clicked — ignore it.
  const selectCategory = (key: CategoryKey | null): void => {
    if (key) onSelect(key);
  };

  if (variant === CategoryNavVariant.Pills) {
    return (
      <ToggleButtonGroup<CategoryKey>
        type={ToggleMode.Single}
        isAttached={false}
        value={active}
        onValueChange={selectCategory}
        aria-label="Emoji categories"
        className="flex-wrap"
      >
        {CategoryOrder.map((key) => (
          <ToggleButton key={key} value={key} variant={ToggleButtonVariant.Outline} size={size}>
            {CategoryDisplays[key].label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  const { nav } = EmojiPickerSizes[size];

  return (
    <ToggleButtonGroup<CategoryKey>
      type={ToggleMode.Single}
      variant={ToggleButtonGroupVariant.Segmented}
      value={active}
      onValueChange={selectCategory}
      aria-label="Emoji categories"
      className="w-full"
    >
      {CategoryOrder.map((key) => {
        const { label, Icon } = CategoryDisplays[key];

        return (
          <ToggleButton key={key} value={key} title={label} aria-label={label} className="flex-1" style={{ height: nav }}>
            <Icon size={iconSize ?? Math.round(nav * 0.8)} className="shrink-0" aria-hidden />
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}

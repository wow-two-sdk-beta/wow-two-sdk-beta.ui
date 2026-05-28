/* Contains the lib-wide style-token type unions shared across every variants config. */

/** Represents the semantic colour palette shared by surfaces, buttons, badges, alerts. */
export type Tone = 'neutral' | 'primary' | 'danger' | 'success' | 'warning' | 'info';

/** Represents the size scale shared by inputs, buttons, surfaces. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Represents the corner-radius scale. */
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/** Represents the interior-padding scale. */
export type Padding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Represents shadow depth — 0 (none) through 5 (max). */
export type Elevation = 0 | 1 | 2 | 3 | 4 | 5;

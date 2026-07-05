/* HTML attribute & element value enums (const + type pairs). */

/* HTML element tag names — for JSX intrinsics and polymorphic `Comp` variables. */
export const HtmlElement = {
  Button: 'button',
  Anchor: 'a',
  Span: 'span',
  Div: 'div',
} as const;
export type HtmlElement = (typeof HtmlElement)[keyof typeof HtmlElement];

/* HTML `<button type="">` attribute. */
export const ButtonType = {
  Button: 'button',
  Submit: 'submit',
  Reset: 'reset',
} as const;
export type ButtonType = (typeof ButtonType)[keyof typeof ButtonType];

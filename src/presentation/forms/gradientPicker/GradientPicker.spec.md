# GradientPicker

## Purpose
Visual editor for CSS gradients. Manage color stops (color + position 0–100%), gradient kind (`linear` / `radial` / `conic`), and angle. Outputs a CSS gradient string.

## Anatomy
```
<GradientPicker>
  ├── kind toggle (linear / radial / conic)
  ├── angle slider (linear/conic only)
  ├── preview bar
  ├── stops list (color input + position number + remove)
  ├── add-stop button
  └── output field (CSS string, read-only)
</GradientPicker>
```

## Required behaviors
- Add / remove / reorder stops.
- Edit color (HTML color input) + position (number 0–100).
- Output: CSS gradient string (`linear-gradient(90deg, #abc 0%, #def 100%)`).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `Gradient` | controlled / uncontrolled | Object with `kind / angle / stops` |
| `disabled` | `boolean` | `false` | |
| `name` | `string` | — | Hidden input emits CSS string |

## Output object
```ts
type Gradient = {
  kind: 'linear' | 'radial' | 'conic';
  angle: number;
  stops: Array<{ color: string; position: number }>;
};
```

## Accessibility
- Stop list = `<ul>`; each row a stop.
- Color inputs are native `<input type="color">`.
- Position inputs are number `<input>`.

## Dependencies
Foundation: `utils`, `icons`. Same domain: `forms/InputStyles`.

# Design System

Warm "clinic dashboard" style: cream page, black chrome (header/sidebar), saturated colour-block cards with faint geometric shapes, black pill controls.

## Colors

All values `estimated` (read by eye from an 806x565 screenshot).

| Role | Token | Hex |
| --- | --- | --- |
| Page background | `--bg` | `#faf3e0` |
| Panel surface | `--surface` | `#fffaee` |
| Sunken / chip | `--sunken` | `#f1e8cf` |
| White card / control | `--raised` | `#ffffff` |
| Ink, black chrome, primary button | `--ink` | `#111111` |
| Muted text | `--muted` | `#6e6650` |
| Yellow card (accent chrome button) | `--yellow` | `#f5d358` |
| Pink card | `--pink` | `#f2b5d4` |
| Olive card | `--green` | `#8fa25c` |
| Blue card | `--blue` | `#a9c1ec` |
| Pink accent (icons) | `--coral` | `#e58bbd` |

## Typography

- Family: geometric sans, closest match **Plus Jakarta Sans** (guess; covers Vietnamese). Alternatives: Be Vietnam Pro, DM Sans.
- Display: weight 400, large (up to 64 px), tight tracking. Section titles 500.
- Card title 500, ~20 px. Body 16-17 px. Meta 11-12 px.

## Spacing

4, 8, 12, 16, 24, 32, 48 px. Panel padding 20-36 px, card gap 16 px.

## Components

- **Chrome bar**: black, white text, rounded 28 px; nav chips dark grey, main action chip yellow.
- **Colour card**: flat pastel/saturated fill, radius 24 px, no border, a faint (8% black) geometric shape (cross, circle, triangle, burst) in the top-right corner.
- **Primary pill**: black fill, white text. **Secondary pill**: white fill, black text.
- **Icon / number badge**: white circle.

## Notes

- Black is used for structure (chrome, primary actions); colour is used for content blocks.
- No outlines or hard shadows; separation is by fill only.
- Card fill cycles yellow, pink, olive, blue.

## Radius

Pill 999 px, panel 28 px, card 24 px, window 24 px.

## Shadows

None at rest. Hover on cards: `0 14px 30px -14px rgba(17, 17, 17, .3)`.

## Dark mode

unknown (the black sidebar is chrome, not a dark theme).

## Source and Evidence

- Source: user-supplied screenshot "intelly" dashboard (image), 2026-11-05. Replaces the earlier mint/pastel extraction.
- Colours, radii and sizes are `estimated`; font is a guess. Unknown: hover/focus states, dark mode, exact spacing scale.
- A style is not a licence to reproduce the source brand's logo, copy or imagery.

## CSS variables

```css
:root {
  --bg: #faf3e0; --surface: #fffaee; --sunken: #f1e8cf; --raised: #fff;
  --ink: #111; --muted: #6e6650;
  --yellow: #f5d358; --pink: #f2b5d4; --green: #8fa25c; --blue: #a9c1ec; --coral: #e58bbd;
}
```

## Tailwind v4

```css
@theme {
  --color-bg: #faf3e0; --color-surface: #fffaee; --color-sunken: #f1e8cf;
  --color-ink: #111; --color-muted: #6e6650;
  --color-yellow: #f5d358; --color-pink: #f2b5d4; --color-olive: #8fa25c; --color-blue: #a9c1ec;
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
  --radius-panel: 28px; --radius-card: 24px;
}
```

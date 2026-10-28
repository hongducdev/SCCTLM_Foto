# Design guidelines

Style: flat, soft, pill-shaped controls in the spirit of the cojeev UI kit (https://cojeev.com/ui/docs/), dark mode only, on Adobe (Photoshop) dark-gray surfaces with the SCCTLM brand palette as accents.

## Brand palette and tokens

Defined as CSS variables in `css/layout.css` (`:root`). Brand colours: green `#15c671`, gray `#d3d3d7`, white `#ffffff`, red `#f50008`, black `#000000`.

| Token | Value | Use |
| --- | --- | --- |
| `--panel` | `#323232` | Panel body (Photoshop default gray) |
| `--background` | `#262626` | Control wells (inputs, selects, chips, rows) |
| `--card` | `#383838` | Group cards, header, explore cards |
| `--muted` / `--muted-2` | `#444444` / `#505050` | Tab list, segment, slider track, hover fills |
| `--border` / `--edge` | `#4a4a4a` / `#5a5a5a` | Card hairlines / control outline (1px inset ring) |
| `--foreground` / `--muted-foreground` | `#e6e6e6` / `#a8a8a8` | Text |
| `--primary` (= `--ring`) | `#15c671` | Primary button, slider fill, focus ring, check marks |
| `--ink` / `--on-ink` | `#ffffff` / `#000000` | Selected tab, chip, segment, switch, slider thumb |
| `--secondary` | `#d3d3d7` | Light badges and buttons (black text) |
| `--destructive` | `#f50008` | Errors, listening state, invalid input |
| `--green` | `#15c671` | Status only: done, update available, Brush Lab dot |

## Shape and motion

- Controls (buttons, inputs, selects, chips, badges, icon buttons) are pills (`border-radius: 999px`); retouch tiles, artboard cards and list rows use 12px; groups and the header use 16px.
- Outline controls have a transparent fill and a 1px inset `--edge` ring; hover fills with `--muted`; press moves 1px down. Transitions are 120–150ms.
- Focus: 2px `--ring` outline with 2px offset, drawn only for keyboard focus (`:focus-visible`) by `css/focus-ring.css`, which loads last; never add `outline: none !important` elsewhere.
- Type: 11px minimum for any visible text (badges 10px); tap targets stay at least 23px tall.
- Busy: `js/panel.js` puts `is-busy` on `<body>` while an ExtendScript command runs; `css/focus-ring.css` dims and disables buttons.
- Selected state is an ink (white) lozenge, never a coloured underline. Green is the accent for the primary action and slider fill.

## Layout

- Panel width: 300px default and minimum (manifest + `PANEL_MIN_WIDTH` in `js/panel.js`); three equal columns with 4px gaps.
- Groups are dark cards whose title has a chevron; clicking it collapses the group (`js/section-collapse.js`).
- The tab bar is a muted pill with icon-over-label triggers; icons come from the SCCTLM icon pack (`svg/navigation`, `svg/retouch`, `svg/controls`) inlined as thin-stroke SVG.
- Artboard and Watermark action footers (`.ab-footer`, `.ef-footer`) are sticky at the panel bottom so the primary button stays reachable; the Support tab opens from a heart icon-button in the header, not the tab bar.
- Keep full command meaning in `title` when the visible label is shortened.
- Hide unavailable commands instead of leaving dead controls in the main workflow.
- Button icons that are not inline SVG use masks in `css/button-icons.css` (class `icon-btn` + `--icon`), so they follow the label colour; never put emoji or symbol characters in button text.
- Colour pickers (Rim Light, Brush Lab) are one row: a pill filled with the chosen colour and a palette icon aligned left (icon turns dark or white by luminance), a hex input and an eyedropper pill; preset swatches sit below and a slider row (sun icon, "Độ sáng") closes the group. Both groups share the `.rim-*` / `.brush-*` selectors in `css/layout.css`.

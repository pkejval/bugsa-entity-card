# Bugsa Entity Card

A customizable entity card for Home Assistant Lovelace: freely positioned title, value and icon,
per-value color rules, an optional progress bar, and auto-shrinking text. Fully configurable from
the visual editor (the editor UI is in Czech).

## Installation

### HACS (custom repository)

1. HACS → ⋮ → **Custom repositories**
2. Repository: `https://github.com/pkejval/bugsa-entity-card`, type **Dashboard** (Lovelace)
3. Install **Bugsa Entity Card** and reload the browser.

HACS registers the resource automatically. For a manual install, copy `bugsa-entity-card.js` to
`/config/www/` and add the resource `/local/bugsa-entity-card.js` (type: JavaScript module).

## Usage

```yaml
type: custom:entity-customizable-card
entity: sensor.living_room_temperature
```

Or pick **Entita - přizpůsobitelná** in the card picker and use the visual editor.

### Options

| Option | Default | Description |
| --- | --- | --- |
| `entity` | – | Entity to show. Optional if `static_value_text` is set. |
| `static_value_text` | `""` | Fixed text shown instead of a value when no entity is set. |
| `name` | entity name | Custom title. |
| `icon` | entity icon | Custom icon. |
| `show_title` / `show_icon` | `true` | Toggle title / icon. |
| `state_color` | `false` | Color the icon when the entity is active. |
| `title_position`, `value_position`, `icon_position` | `top_left`, `center`, `top_right` | One of `top_left`, `top_center`, `top_right`, `center_left`, `center`, `center_right`, `bottom_left`, `bottom_center`, `bottom_right`. |
| `round_value`, `round_decimals` | `false`, `0` | Round the displayed number. |
| `title_font_size_value/_unit`, `value_…`, `unit_…` | 14 / 30 / 14 `px` | Font sizes (`px`, `rem`, `vw`, `vh`). |
| `title_font_weight`, `value_font_weight`, `unit_font_weight` | 700 / 900 / 700 | Font weights (100–900). |
| `title_color` | theme | RGB array, e.g. `[255, 255, 255]`. |
| `title_overflow_mode`, `value_overflow_mode` | `wrap` | `wrap` or `shrink` (auto-shrink down to `*_min_scale`). |
| `padding_value/_unit`, `gap_value/_unit`, `icon_size_value/_unit` | 16 / 12 / 24 `px` | Spacing and icon size. |
| `value_coloring_enabled` | `false` | Enable color rules. |
| `value_color_rule_{1,2,3}_enabled / _operator / _value / _color` | – | Rule: operators `>`, `>=`, `<`, `<=`, `=`, `!=`. The rule with the nearest threshold wins. |
| `progress_enabled` | `false` | Show a progress bar for numeric states. |
| `progress_min`, `progress_max` | `0`, `100` | Progress range. |
| `progress_full_card` | `false` | Progress track fills the whole card. |
| `progress_value_position` | `inside` | `inside`, `above`, `below`, `hidden`. |
| `progress_use_value_color_rules` | `true` | Use the matching rule's progress colors. |
| `progress_color`, `progress_track_color` | – | RGB arrays. |
| `progress_length_*`, `progress_thickness_*`, `progress_radius_*` | `100%`, `3vh`, `999px` | Progress bar geometry. |

The full list of options with defaults is available in the visual editor.

### Example

```yaml
type: custom:entity-customizable-card
entity: sensor.battery_level
name: Battery
progress_enabled: true
value_coloring_enabled: true
value_color_rule_1_enabled: true
value_color_rule_1_operator: "<"
value_color_rule_1_value: 20
value_color_rule_1_color: [255, 80, 80]
value_color_rule_1_progress_color: [255, 80, 80]
```

## License

MIT

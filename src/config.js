export const CARD_TAG = "entity-customizable-card";

export const SIZE_UNITS = ["px", "rem", "vw", "vh"];
export const PROGRESS_LENGTH_UNITS = ["%", ...SIZE_UNITS];
export const COLOR_OPERATORS = [">", ">=", "<", "<=", "=", "!="];
export const PROGRESS_VALUE_POSITIONS = ["inside", "above", "below", "hidden"];
export const TEXT_OVERFLOW_MODES = ["wrap", "shrink"];
export const PROGRESS_INSIDE_TEXT_COLOR_MODES = ["auto", "custom"];
export const POSITION_OPTIONS = [
  "top_left",
  "top_center",
  "top_right",
  "center_left",
  "center",
  "center_right",
  "bottom_left",
  "bottom_center",
  "bottom_right",
];
export const POSITION_STYLES = {
  top_left: { row: "1", col: "1", horizontal: "left", vertical: "start" },
  top_center: { row: "1", col: "2", horizontal: "center", vertical: "start" },
  top_right: { row: "1", col: "3", horizontal: "right", vertical: "start" },
  center_left: { row: "2", col: "1", horizontal: "left", vertical: "center" },
  center: { row: "2", col: "2", horizontal: "center", vertical: "center" },
  center_right: { row: "2", col: "3", horizontal: "right", vertical: "center" },
  bottom_left: { row: "3", col: "1", horizontal: "left", vertical: "end" },
  bottom_center: { row: "3", col: "2", horizontal: "center", vertical: "end" },
  bottom_right: { row: "3", col: "3", horizontal: "right", vertical: "end" },
};

export const DEFAULT_CONFIG = {
  static_value_text: "",
  show_icon: true,
  state_color: false,
  show_title: true,

  round_value: false,
  round_decimals: 0,

  title_font_size_value: 14,
  title_font_size_unit: "px",
  title_font_weight: 700,
  title_color: null,

  value_font_size_value: 30,
  value_font_size_unit: "px",
  value_font_weight: 900,

  unit_font_size_value: 14,
  unit_font_size_unit: "px",
  unit_font_weight: 700,

  icon_size_value: 24,
  icon_size_unit: "px",
  icon_position: "top_right",

  padding_value: 16,
  padding_unit: "px",

  gap_value: 12,
  gap_unit: "px",

  title_position: "top_left",
  value_position: "center",

  value_coloring_enabled: false,
  rules: [],
  attribute: "",
  unit: "",
  progress_enabled: false,
  progress_full_card: false,
  progress_min: 0,
  progress_max: 100,
  progress_length_value: 100,
  progress_length_unit: "%",
  progress_thickness_value: 3,
  progress_thickness_unit: "vh",
  progress_radius_value: 999,
  progress_radius_unit: "px",
  progress_value_position: "inside",
  progress_use_value_color_rules: true,
  progress_color: [255, 255, 255],
  progress_track_color: [70, 70, 70],
  progress_inside_text_color_mode: "auto",
  progress_inside_text_color: [255, 255, 255],

  title_overflow_mode: "wrap",
  value_overflow_mode: "wrap",
  title_min_scale: 0.55,
  value_min_scale: 0.55,
};

export const ACTIVE_STATES = new Set([
  "on",
  "home",
  "open",
  "opening",
  "playing",
  "heat",
  "cool",
  "fan_only",
  "locked",
  "armed_home",
  "armed_away",
  "armed_night",
  "armed_vacation",
]);

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function deepMerge(base, extra) {
  const result = clone(base);

  Object.entries(extra || {}).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  });

  return result;
}

export function normalizeUnit(unit, fallback = "px", allowed = SIZE_UNITS) {
  return allowed.includes(unit) ? unit : fallback;
}

export function normalizeOperator(operator, fallback = ">") {
  return COLOR_OPERATORS.includes(operator) ? operator : fallback;
}

export function normalizePosition(position, fallback = "center") {
  return POSITION_OPTIONS.includes(position) ? position : fallback;
}

export function normalizeProgressValuePosition(position, fallback = "inside") {
  return PROGRESS_VALUE_POSITIONS.includes(position) ? position : fallback;
}

export function normalizeTextOverflowMode(mode, fallback = "wrap") {
  return TEXT_OVERFLOW_MODES.includes(mode) ? mode : fallback;
}

export function normalizeFontWeight(value, fallback = 400) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(100, Math.min(900, Math.round(numeric)));
}

export function normalizeProgressInsideTextColorMode(mode, fallback = "auto") {
  return PROGRESS_INSIDE_TEXT_COLOR_MODES.includes(mode) ? mode : fallback;
}

export function normalizeOptionalRgbColor(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return normalizeRgbColor(value, [255, 255, 255]);
}

export const MAX_RULES = 20;
const LEGACY_RULE_DEFAULTS = [
  { operator: ">", color: [255, 0, 0] },
  { operator: "<", color: [0, 170, 255] },
  { operator: "=", color: [0, 200, 120] },
];

/**
 * Rule value: a finite number when the input looks numeric, otherwise a trimmed string
 * (compared with the entity state as text by "=" / "!="). Returns null for empty input.
 */
export function normalizeRuleValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : trimmed;
}

export function normalizeRule(rule, index = 0) {
  const source = rule && typeof rule === "object" ? rule : {};
  const value = normalizeRuleValue(source.value);
  if (value === null || source.enabled === false) {
    return null;
  }
  const defaults = LEGACY_RULE_DEFAULTS[index % LEGACY_RULE_DEFAULTS.length];
  return {
    operator: normalizeOperator(source.operator, defaults.operator),
    value,
    color: normalizeRgbColor(source.color, defaults.color),
    progress_color: normalizeOptionalRgbColor(source.progress_color),
    progress_value_color: normalizeOptionalRgbColor(source.progress_value_color),
  };
}

/** Uses `rules` when it is a non-empty array, otherwise the legacy value_color_rule_N_* keys. */
export function normalizeRules(config) {
  let sources = [];
  if (Array.isArray(config.rules) && config.rules.length > 0) {
    sources = config.rules;
  } else {
    for (let i = 1; i <= 3; i += 1) {
      const prefix = `value_color_rule_${i}_`;
      if (config[`${prefix}enabled`]) {
        sources.push({
          operator: config[`${prefix}operator`],
          value: config[`${prefix}value`],
          color: config[`${prefix}color`],
          progress_color: config[`${prefix}progress_color`],
          progress_value_color: config[`${prefix}progress_value_color`],
        });
      }
    }
  }
  return sources
    .slice(0, MAX_RULES)
    .map((rule, index) => normalizeRule(rule, index))
    .filter(Boolean);
}

export function normalizeRgbColor(value, fallback = [255, 0, 0]) {
  if (!Array.isArray(value) || value.length !== 3) {
    return [...fallback];
  }

  return value.map((part, index) => {
    const numeric = Number(part);
    const fallbackPart = fallback[index] ?? 0;

    if (!Number.isFinite(numeric)) {
      return fallbackPart;
    }

    return Math.max(0, Math.min(255, Math.round(numeric)));
  });
}

export function parseLegacySize(value, fallbackValue, fallbackUnit) {
  if (value === undefined || value === null || value === "") {
    return { value: fallbackValue, unit: fallbackUnit };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { value, unit: fallbackUnit };
  }

  const str = String(value).trim();
  const match = str.match(/^(-?\d+(?:\.\d+)?)\s*(px|rem|vw|vh|%)$/i);

  if (match) {
    return {
      value: Number(match[1]),
      unit: match[2].toLowerCase(),
    };
  }

  const numeric = Number(str);
  if (Number.isFinite(numeric)) {
    return {
      value: numeric,
      unit: fallbackUnit,
    };
  }

  return { value: fallbackValue, unit: fallbackUnit };
}

export function normalizeConfig(config) {
  const merged = deepMerge(DEFAULT_CONFIG, config || {});
  const normalizedEntity =
    typeof merged.entity === "string" ? merged.entity.trim() : "";
  merged.entity = normalizedEntity || undefined;
  merged.static_value_text =
    typeof merged.static_value_text === "string" ? merged.static_value_text : "";

  if (merged.title_font_size !== undefined) {
    const parsed = parseLegacySize(
      merged.title_font_size,
      merged.title_font_size_value,
      merged.title_font_size_unit
    );
    merged.title_font_size_value = parsed.value;
    merged.title_font_size_unit = parsed.unit;
  }

  if (merged.value_font_size !== undefined) {
    const parsed = parseLegacySize(
      merged.value_font_size,
      merged.value_font_size_value,
      merged.value_font_size_unit
    );
    merged.value_font_size_value = parsed.value;
    merged.value_font_size_unit = parsed.unit;
  }

  if (merged.unit_font_size !== undefined) {
    const parsed = parseLegacySize(
      merged.unit_font_size,
      merged.unit_font_size_value,
      merged.unit_font_size_unit
    );
    merged.unit_font_size_value = parsed.value;
    merged.unit_font_size_unit = parsed.unit;
  }

  if (merged.icon_size !== undefined) {
    const parsed = parseLegacySize(
      merged.icon_size,
      merged.icon_size_value,
      merged.icon_size_unit
    );
    merged.icon_size_value = parsed.value;
    merged.icon_size_unit = parsed.unit;
  }

  if (merged.padding !== undefined) {
    const parsed = parseLegacySize(
      merged.padding,
      merged.padding_value,
      merged.padding_unit
    );
    merged.padding_value = parsed.value;
    merged.padding_unit = parsed.unit;
  }

  if (merged.gap !== undefined) {
    const parsed = parseLegacySize(
      merged.gap,
      merged.gap_value,
      merged.gap_unit
    );
    merged.gap_value = parsed.value;
    merged.gap_unit = parsed.unit;
  }

  if (merged.progress_length !== undefined) {
    const parsed = parseLegacySize(
      merged.progress_length,
      merged.progress_length_value,
      merged.progress_length_unit
    );
    merged.progress_length_value = parsed.value;
    merged.progress_length_unit = parsed.unit;
  }

  if (merged.progress_thickness !== undefined) {
    const parsed = parseLegacySize(
      merged.progress_thickness,
      merged.progress_thickness_value,
      merged.progress_thickness_unit
    );
    merged.progress_thickness_value = parsed.value;
    merged.progress_thickness_unit = parsed.unit;
  }

  if (merged.progress_radius !== undefined) {
    const parsed = parseLegacySize(
      merged.progress_radius,
      merged.progress_radius_value,
      merged.progress_radius_unit
    );
    merged.progress_radius_value = parsed.value;
    merged.progress_radius_unit = parsed.unit;
  }

  merged.title_font_size_unit = normalizeUnit(merged.title_font_size_unit, "px");
  merged.value_font_size_unit = normalizeUnit(merged.value_font_size_unit, "px");
  merged.unit_font_size_unit = normalizeUnit(merged.unit_font_size_unit, "px");
  merged.icon_size_unit = normalizeUnit(merged.icon_size_unit, "px");
  merged.padding_unit = normalizeUnit(merged.padding_unit, "px");
  merged.gap_unit = normalizeUnit(merged.gap_unit, "px");
  merged.progress_length_unit = normalizeUnit(
    merged.progress_length_unit,
    "%",
    PROGRESS_LENGTH_UNITS
  );
  merged.progress_thickness_unit = normalizeUnit(merged.progress_thickness_unit, "px");
  merged.progress_radius_unit = normalizeUnit(merged.progress_radius_unit, "px");

  if (merged.progress_length_unit === "vh") {
    merged.progress_length_unit = "%";
  }

  merged.title_font_size_value = Number.isFinite(Number(merged.title_font_size_value))
    ? Number(merged.title_font_size_value)
    : DEFAULT_CONFIG.title_font_size_value;
  merged.title_color = normalizeOptionalRgbColor(merged.title_color);
  merged.title_font_weight = normalizeFontWeight(
    merged.title_font_weight,
    DEFAULT_CONFIG.title_font_weight
  );

  merged.value_font_size_value = Number.isFinite(Number(merged.value_font_size_value))
    ? Number(merged.value_font_size_value)
    : DEFAULT_CONFIG.value_font_size_value;
  merged.value_font_weight = normalizeFontWeight(
    merged.value_font_weight,
    DEFAULT_CONFIG.value_font_weight
  );

  merged.unit_font_size_value = Number.isFinite(Number(merged.unit_font_size_value))
    ? Number(merged.unit_font_size_value)
    : DEFAULT_CONFIG.unit_font_size_value;
  merged.unit_font_weight = normalizeFontWeight(
    merged.unit_font_weight,
    DEFAULT_CONFIG.unit_font_weight
  );
  merged.icon_size_value = Number.isFinite(Number(merged.icon_size_value))
    ? Number(merged.icon_size_value)
    : DEFAULT_CONFIG.icon_size_value;

  merged.padding_value = Number.isFinite(Number(merged.padding_value))
    ? Number(merged.padding_value)
    : DEFAULT_CONFIG.padding_value;

  merged.gap_value = Number.isFinite(Number(merged.gap_value))
    ? Number(merged.gap_value)
    : DEFAULT_CONFIG.gap_value;
  merged.progress_length_value = Number.isFinite(Number(merged.progress_length_value))
    ? Number(merged.progress_length_value)
    : DEFAULT_CONFIG.progress_length_value;
  merged.progress_thickness_value = Number.isFinite(Number(merged.progress_thickness_value))
    ? Number(merged.progress_thickness_value)
    : DEFAULT_CONFIG.progress_thickness_value;
  merged.progress_radius_value = Number.isFinite(Number(merged.progress_radius_value))
    ? Number(merged.progress_radius_value)
    : DEFAULT_CONFIG.progress_radius_value;
  merged.progress_min = Number.isFinite(Number(merged.progress_min))
    ? Number(merged.progress_min)
    : DEFAULT_CONFIG.progress_min;
  merged.progress_max = Number.isFinite(Number(merged.progress_max))
    ? Number(merged.progress_max)
    : DEFAULT_CONFIG.progress_max;

  merged.round_value = Boolean(merged.round_value);
  merged.round_decimals = Number.isFinite(Number(merged.round_decimals))
    ? Math.max(0, Math.min(10, Math.floor(Number(merged.round_decimals))))
    : DEFAULT_CONFIG.round_decimals;

  merged.show_icon = merged.show_icon !== false;
  merged.show_title = merged.show_title !== false;
  merged.state_color = Boolean(merged.state_color);

  merged.value_coloring_enabled = Boolean(merged.value_coloring_enabled);
  merged.rules = normalizeRules(config || {});
  // Rules given without an explicit switch should simply work.
  if (config?.value_coloring_enabled === undefined && Array.isArray(config?.rules) && merged.rules.length > 0) {
    merged.value_coloring_enabled = true;
  }
  merged.attribute = typeof merged.attribute === "string" ? merged.attribute.trim() : "";
  merged.unit = typeof merged.unit === "string" ? merged.unit.trim() : "";

  merged.title_position = normalizePosition(
    merged.title_position,
    DEFAULT_CONFIG.title_position
  );
  merged.value_position = normalizePosition(
    merged.value_position,
    DEFAULT_CONFIG.value_position
  );
  merged.icon_position = normalizePosition(
    merged.icon_position,
    DEFAULT_CONFIG.icon_position
  );
  merged.progress_enabled = Boolean(merged.progress_enabled);
  merged.progress_full_card = Boolean(merged.progress_full_card);
  merged.progress_use_value_color_rules = merged.progress_use_value_color_rules !== false;
  merged.progress_value_position = normalizeProgressValuePosition(
    merged.progress_value_position,
    DEFAULT_CONFIG.progress_value_position
  );
  merged.progress_color = normalizeRgbColor(merged.progress_color, DEFAULT_CONFIG.progress_color);
  merged.progress_track_color = normalizeRgbColor(
    merged.progress_track_color,
    DEFAULT_CONFIG.progress_track_color
  );
  merged.progress_inside_text_color_mode = normalizeProgressInsideTextColorMode(
    merged.progress_inside_text_color_mode,
    DEFAULT_CONFIG.progress_inside_text_color_mode
  );
  merged.progress_inside_text_color = normalizeRgbColor(
    merged.progress_inside_text_color,
    DEFAULT_CONFIG.progress_inside_text_color
  );
  merged.title_overflow_mode = normalizeTextOverflowMode(
    merged.title_overflow_mode,
    DEFAULT_CONFIG.title_overflow_mode
  );
  merged.value_overflow_mode = normalizeTextOverflowMode(
    merged.value_overflow_mode,
    DEFAULT_CONFIG.value_overflow_mode
  );
  merged.title_min_scale = Number.isFinite(Number(merged.title_min_scale))
    ? Math.max(0.3, Math.min(1, Number(merged.title_min_scale)))
    : DEFAULT_CONFIG.title_min_scale;
  merged.value_min_scale = Number.isFinite(Number(merged.value_min_scale))
    ? Math.max(0.3, Math.min(1, Number(merged.value_min_scale)))
    : DEFAULT_CONFIG.value_min_scale;

  return merged;
}

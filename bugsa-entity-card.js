(() => {
  const CARD_TAG = "entity-customizable-card";

  if (customElements.get(CARD_TAG)) {
    return;
  }

  const SIZE_UNITS = ["px", "rem", "vw", "vh"];
  const PROGRESS_LENGTH_UNITS = ["%", ...SIZE_UNITS];
  const COLOR_OPERATORS = [">", ">=", "<", "<=", "=", "!="];
  const PROGRESS_VALUE_POSITIONS = ["inside", "above", "below", "hidden"];
  const TEXT_OVERFLOW_MODES = ["wrap", "shrink"];
  const PROGRESS_INSIDE_TEXT_COLOR_MODES = ["auto", "custom"];
  const POSITION_OPTIONS = [
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
  const POSITION_STYLES = {
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

  const DEFAULT_CONFIG = {
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
    value_color_rule_1_enabled: false,
    value_color_rule_1_operator: ">",
    value_color_rule_1_value: 0,
    value_color_rule_1_color: [255, 0, 0],
    value_color_rule_1_progress_color: null,
    value_color_rule_1_progress_value_color: null,

    value_color_rule_2_enabled: false,
    value_color_rule_2_operator: "<",
    value_color_rule_2_value: 0,
    value_color_rule_2_color: [0, 170, 255],
    value_color_rule_2_progress_color: null,
    value_color_rule_2_progress_value_color: null,

    value_color_rule_3_enabled: false,
    value_color_rule_3_operator: "=",
    value_color_rule_3_value: 0,
    value_color_rule_3_color: [0, 200, 120],
    value_color_rule_3_progress_color: null,
    value_color_rule_3_progress_value_color: null,

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

  const ACTIVE_STATES = new Set([
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

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepMerge(base, extra) {
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

  function normalizeUnit(unit, fallback = "px", allowed = SIZE_UNITS) {
    return allowed.includes(unit) ? unit : fallback;
  }

  function normalizeOperator(operator, fallback = ">") {
    return COLOR_OPERATORS.includes(operator) ? operator : fallback;
  }

  function normalizePosition(position, fallback = "center") {
    return POSITION_OPTIONS.includes(position) ? position : fallback;
  }

  function normalizeProgressValuePosition(position, fallback = "inside") {
    return PROGRESS_VALUE_POSITIONS.includes(position) ? position : fallback;
  }

  function normalizeTextOverflowMode(mode, fallback = "wrap") {
    return TEXT_OVERFLOW_MODES.includes(mode) ? mode : fallback;
  }

  function normalizeFontWeight(value, fallback = 400) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return Math.max(100, Math.min(900, Math.round(numeric)));
  }

  function normalizeProgressInsideTextColorMode(mode, fallback = "auto") {
    return PROGRESS_INSIDE_TEXT_COLOR_MODES.includes(mode) ? mode : fallback;
  }

  function normalizeOptionalRgbColor(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    return normalizeRgbColor(value, [255, 255, 255]);
  }

  function normalizeValueColorRule(rule, fallbackOperator = ">", fallbackColor = [255, 0, 0]) {
    const source = rule && typeof rule === "object" ? rule : {};
    const numericValue = Number(source.value);
    const enabled = source.enabled === undefined ? true : Boolean(source.enabled);

    return {
      enabled,
      operator: normalizeOperator(source.operator, fallbackOperator),
      value: Number.isFinite(numericValue) ? numericValue : 0,
      color: normalizeRgbColor(source.color, fallbackColor),
      progress_color: normalizeOptionalRgbColor(source.progress_color),
      progress_value_color: normalizeOptionalRgbColor(source.progress_value_color),
    };
  }

  function normalizeRgbColor(value, fallback = [255, 0, 0]) {
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

  function parseLegacySize(value, fallbackValue, fallbackUnit) {
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

  function normalizeConfig(config) {
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
    for (let i = 1; i <= 3; i += 1) {
      const fallbackColor = i === 2 ? [0, 170, 255] : i === 3 ? [0, 200, 120] : [255, 0, 0];
      const fallbackOperator = i === 2 ? "<" : i === 3 ? "=" : ">";

      merged[`value_color_rule_${i}_enabled`] = Boolean(merged[`value_color_rule_${i}_enabled`]);
      merged[`value_color_rule_${i}_operator`] = normalizeOperator(
        merged[`value_color_rule_${i}_operator`],
        fallbackOperator
      );
      merged[`value_color_rule_${i}_value`] = Number.isFinite(
        Number(merged[`value_color_rule_${i}_value`])
      )
        ? Number(merged[`value_color_rule_${i}_value`])
        : 0;
      merged[`value_color_rule_${i}_color`] = normalizeRgbColor(
        merged[`value_color_rule_${i}_color`],
        fallbackColor
      );
      merged[`value_color_rule_${i}_progress_color`] = normalizeOptionalRgbColor(
        merged[`value_color_rule_${i}_progress_color`]
      );
      merged[`value_color_rule_${i}_progress_value_color`] = normalizeOptionalRgbColor(
        merged[`value_color_rule_${i}_progress_value_color`]
      );
    }

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

  class EntityCustomizableCard extends HTMLElement {
    static getStubConfig(hass, entities) {
      const states = hass?.states || {};
      const entity =
        (entities || []).find(
          (id) => id.startsWith("sensor.") && Number.isFinite(parseFloat(states[id]?.state))
        ) ||
        entities?.[0] ||
        "sun.sun";
      return { entity };
    }

    static getConfigForm() {
      const unitOptions = SIZE_UNITS.map((value) => ({
        value,
        label: value,
      }));
      const progressLengthUnitOptions = [
        { value: "%", label: "%" },
        ...unitOptions,
      ];
      const operatorOptions = COLOR_OPERATORS.map((value) => ({
        value,
        label: value,
      }));

      const positionOptions = [
        { value: "top_left", label: "Vlevo nahoře" },
        { value: "top_center", label: "Nahoře uprostřed" },
        { value: "top_right", label: "Vpravo nahoře" },
        { value: "center_left", label: "Vlevo uprostřed" },
        { value: "center", label: "Střed" },
        { value: "center_right", label: "Vpravo uprostřed" },
        { value: "bottom_left", label: "Vlevo dole" },
        { value: "bottom_center", label: "Dole uprostřed" },
        { value: "bottom_right", label: "Vpravo dole" },
      ];
      const progressValuePositionOptions = [
        { value: "inside", label: "Uvnitř" },
        { value: "above", label: "Nad" },
        { value: "below", label: "Pod" },
        { value: "hidden", label: "Skrýt hodnotu" },
      ];
      const progressInsideTextColorModeOptions = [
        { value: "auto", label: "Automatická" },
        { value: "custom", label: "Vlastní" },
      ];
      const textOverflowOptions = [
        { value: "wrap", label: "Odřádkovat" },
        { value: "shrink", label: "Auto zmenšit" },
      ];
      const defaultValueLabels = {
        icon_position: "Vpravo nahoře",
        title_position: "Vlevo nahoře",
        value_position: "Střed",
        progress_value_position: "Uvnitř",
        progress_inside_text_color_mode: "Automatická",
        title_overflow_mode: "Odřádkovat",
        value_overflow_mode: "Odřádkovat",
      };
      const defaultBoolLabels = {
        true: "Zapnuto",
        false: "Vypnuto",
      };

      const getDefaultValueText = (name) => {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, name)) {
          return null;
        }

        const raw = DEFAULT_CONFIG[name];

        if (Array.isArray(raw)) {
          if (raw.length === 3) {
            return `[${raw[0]}, ${raw[1]}, ${raw[2]}]`;
          }
          return JSON.stringify(raw);
        }

        if (typeof raw === "boolean") {
          return defaultBoolLabels[String(raw)];
        }

        if (typeof raw === "string") {
          return defaultValueLabels[name] || raw;
        }

        if (typeof raw === "number") {
          return String(raw);
        }

        if (raw && typeof raw === "object") {
          return JSON.stringify(raw);
        }

        return null;
      };

      return {
        schema: [
          {
            name: "entity",
            selector: { entity: {} },
          },
          {
            name: "name",
            selector: { text: {} },
          },
          {
            name: "static_value_text",
            selector: { text: {} },
          },
          {
            type: "grid",
            name: "",
            flatten: true,
            column_min_width: "180px",
            schema: [
              {
                name: "show_icon",
                selector: { boolean: {} },
              },
              {
                name: "show_title",
                selector: { boolean: {} },
              },
              {
                name: "state_color",
                selector: { boolean: {} },
              },
              {
                name: "icon",
                selector: { icon: {} },
                context: { icon_entity: "entity" },
              },
            ],
          },
          {
            type: "grid",
            name: "",
            flatten: true,
            column_min_width: "180px",
            schema: [
              {
                name: "title_position",
                selector: {
                  select: {
                    mode: "dropdown",
                    options: positionOptions,
                  },
                },
              },
              {
                name: "value_position",
                selector: {
                  select: {
                    mode: "dropdown",
                    options: positionOptions,
                  },
                },
              },
              {
                name: "icon_position",
                selector: {
                  select: {
                    mode: "dropdown",
                    options: positionOptions,
                  },
                },
              },
            ],
          },
          {
            type: "expandable",
            name: "value_section",
            title: "Hodnota",
            flatten: true,
            schema: [
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "180px",
                schema: [
                  {
                    name: "round_value",
                    selector: { boolean: {} },
                  },
                  {
                    name: "round_decimals",
                    selector: {
                      number: {
                        min: 0,
                        max: 10,
                        step: 1,
                        mode: "box",
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            type: "expandable",
            name: "progress_section",
            title: "Progress bar",
            flatten: true,
            schema: [
              {
                name: "progress_enabled",
                selector: { boolean: {} },
              },
              {
                name: "progress_full_card",
                selector: { boolean: {} },
              },
              {
                name: "progress_value_position",
                selector: {
                  select: {
                    mode: "dropdown",
                    options: progressValuePositionOptions,
                  },
                },
              },
              {
                name: "progress_use_value_color_rules",
                selector: { boolean: {} },
              },
            ],
          },
          {
            type: "expandable",
            name: "progress_advanced_section",
            title: "Progress bar - pokročilé",
            flatten: true,
            schema: [
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "180px",
                schema: [
                  {
                    name: "progress_min",
                    selector: {
                      number: {
                        step: "any",
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "progress_max",
                    selector: {
                      number: {
                        step: "any",
                        mode: "box",
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "progress_length_value",
                    selector: {
                      number: {
                        min: 0,
                        max: 2000,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "progress_length_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: progressLengthUnitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "progress_thickness_value",
                    selector: {
                      number: {
                        min: 1,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "progress_thickness_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "progress_radius_value",
                    selector: {
                      number: {
                        min: 0,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "progress_radius_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "180px",
                schema: [
                  {
                    name: "progress_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "progress_track_color",
                    selector: { color_rgb: {} },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "180px",
                schema: [
                  {
                    name: "progress_inside_text_color_mode",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: progressInsideTextColorModeOptions,
                      },
                    },
                  },
                  {
                    name: "progress_inside_text_color",
                    selector: { color_rgb: {} },
                  },
                ],
              },
            ],
          },
          {
            type: "expandable",
            name: "value_coloring_section",
            title: "Barva hodnoty",
            flatten: true,
            schema: [
              {
                name: "value_coloring_enabled",
                selector: { boolean: {} },
              },
              {
                type: "grid",
                name: "",
                title: "Pravidlo 1",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "value_color_rule_1_enabled",
                    selector: { boolean: {} },
                  },
                  {
                    name: "value_color_rule_1_operator",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: operatorOptions,
                      },
                    },
                  },
                  {
                    name: "value_color_rule_1_value",
                    selector: {
                      number: {
                        step: "any",
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "value_color_rule_1_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "value_color_rule_1_progress_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "value_color_rule_1_progress_value_color",
                    selector: { color_rgb: {} },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                title: "Pravidlo 2",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "value_color_rule_2_enabled",
                    selector: { boolean: {} },
                  },
                  {
                    name: "value_color_rule_2_operator",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: operatorOptions,
                      },
                    },
                  },
                  {
                    name: "value_color_rule_2_value",
                    selector: {
                      number: {
                        step: "any",
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "value_color_rule_2_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "value_color_rule_2_progress_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "value_color_rule_2_progress_value_color",
                    selector: { color_rgb: {} },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                title: "Pravidlo 3",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "value_color_rule_3_enabled",
                    selector: { boolean: {} },
                  },
                  {
                    name: "value_color_rule_3_operator",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: operatorOptions,
                      },
                    },
                  },
                  {
                    name: "value_color_rule_3_value",
                    selector: {
                      number: {
                        step: "any",
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "value_color_rule_3_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "value_color_rule_3_progress_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "value_color_rule_3_progress_value_color",
                    selector: { color_rgb: {} },
                  },
                ],
              },
            ],
          },
          {
            type: "expandable",
            name: "typography",
            title: "Typografie",
            flatten: true,
            schema: [
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "title_font_size_value",
                    selector: {
                      number: {
                        min: 1,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "title_font_size_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "value_font_size_value",
                    selector: {
                      number: {
                        min: 1,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "value_font_size_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "unit_font_size_value",
                    selector: {
                      number: {
                        min: 1,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "unit_font_size_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "icon_size_value",
                    selector: {
                      number: {
                        min: 1,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "icon_size_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "180px",
                schema: [
                  {
                    name: "title_font_weight",
                    selector: {
                      number: {
                        min: 100,
                        max: 900,
                        step: 100,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "value_font_weight",
                    selector: {
                      number: {
                        min: 100,
                        max: 900,
                        step: 100,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "unit_font_weight",
                    selector: {
                      number: {
                        min: 100,
                        max: 900,
                        step: 100,
                        mode: "box",
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "180px",
                schema: [
                  {
                    name: "title_color",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "title_overflow_mode",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: textOverflowOptions,
                      },
                    },
                  },
                  {
                    name: "title_min_scale",
                    selector: {
                      number: {
                        min: 0.3,
                        max: 1,
                        step: 0.01,
                        mode: "box",
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "180px",
                schema: [
                  {
                    name: "value_overflow_mode",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: textOverflowOptions,
                      },
                    },
                  },
                  {
                    name: "value_min_scale",
                    selector: {
                      number: {
                        min: 0.3,
                        max: 1,
                        step: 0.01,
                        mode: "box",
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            type: "expandable",
            name: "spacing",
            title: "Rozestupy",
            flatten: true,
            schema: [
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "padding_value",
                    selector: {
                      number: {
                        min: 0,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "padding_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "140px",
                schema: [
                  {
                    name: "gap_value",
                    selector: {
                      number: {
                        min: 0,
                        max: 400,
                        step: 0.1,
                        mode: "box",
                      },
                    },
                  },
                  {
                    name: "gap_unit",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: unitOptions,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        computeLabel: (schema) => {
          const labels = {
            entity: "Entita",
            name: "Vlastní nadpis",
            static_value_text: "Pevný text hodnoty",
            show_icon: "Zobrazit ikonu",
            show_title: "Zobrazit nadpis",
            state_color: "Barva ikony podle stavu",
            icon: "Ikona",
            title_position: "Pozice nadpisu",
            value_position: "Pozice hodnoty",
            icon_position: "Pozice ikony",

            round_value: "Zaokrouhlit číslo",
            round_decimals: "Počet desetinných míst",
            progress_enabled: "Zapnout progress bar",
            progress_full_card: "Progress přes celou kartu",
            progress_min: "Minimum",
            progress_max: "Maximum",
            progress_length_value: "Délka",
            progress_length_unit: "Jednotka",
            progress_thickness_value: "Tloušťka",
            progress_thickness_unit: "Jednotka",
            progress_radius_value: "Zaoblení",
            progress_radius_unit: "Jednotka",
            progress_value_position: "Pozice hodnoty",
            progress_use_value_color_rules: "Barva podle pravidel hodnoty",
            progress_color: "Barva výplně",
            progress_track_color: "Barva pozadí",
            progress_inside_text_color_mode: "Barva textu uvnitř",
            progress_inside_text_color: "Vlastní barva textu",
            title_overflow_mode: "Nadpis když se nevejde",
            value_overflow_mode: "Hodnota když se nevejde",
            title_min_scale: "Min. zmenšení nadpisu",
            value_min_scale: "Min. zmenšení hodnoty",

            value_coloring_enabled: "Zapnout pravidla barvy hodnoty",
            value_color_rule_1_enabled: "Aktivní",
            value_color_rule_1_operator: "Operátor",
            value_color_rule_1_value: "Hodnota",
            value_color_rule_1_color: "Barva hodnoty",
            value_color_rule_1_progress_color: "Barva progress",
            value_color_rule_1_progress_value_color: "Barva textu progress",

            value_color_rule_2_enabled: "Aktivní",
            value_color_rule_2_operator: "Operátor",
            value_color_rule_2_value: "Hodnota",
            value_color_rule_2_color: "Barva hodnoty",
            value_color_rule_2_progress_color: "Barva progress",
            value_color_rule_2_progress_value_color: "Barva textu progress",

            value_color_rule_3_enabled: "Aktivní",
            value_color_rule_3_operator: "Operátor",
            value_color_rule_3_value: "Hodnota",
            value_color_rule_3_color: "Barva hodnoty",
            value_color_rule_3_progress_color: "Barva progress",
            value_color_rule_3_progress_value_color: "Barva textu progress",

            title_font_size_value: "Velikost nadpisu",
            title_font_size_unit: "Jednotka",
            title_font_weight: "Tloušťka nadpisu",
            title_color: "Barva nadpisu",

            value_font_size_value: "Velikost hodnoty",
            value_font_size_unit: "Jednotka",
            value_font_weight: "Tloušťka hodnoty",

            unit_font_size_value: "Velikost jednotky",
            unit_font_size_unit: "Jednotka",
            unit_font_weight: "Tloušťka jednotky",
            icon_size_value: "Velikost ikony",
            icon_size_unit: "Jednotka",

            padding_value: "Padding",
            padding_unit: "Jednotka",

            gap_value: "Mezera",
            gap_unit: "Jednotka",
          };

          return labels[schema.name] ?? schema.name;
        },
        computeHelper: (schema) => {
          const helpers = {
            entity:
              "Volitelné. Když není vyplněná, karta použije pevný text hodnoty (pokud je zadaný).",
            name: "Když necháš prázdné, použije se název entity.",
            static_value_text:
              "Použije se jen pokud není vyplněná entita. Pak se zobrazí místo hodnoty.",
            round_decimals: "Použije se jen pokud je zapnuté zaokrouhlení.",
            icon: "Když necháš prázdné, použije se ikona entity.",
            title_position: "Nastavuje pozici textu nadpisu v kartě.",
            value_position: "Nastavuje pozici hodnoty a jednotky v kartě.",
            icon_position: "Nastavuje pozici ikony v celé ploše karty.",
            title_color:
              "Volitelná RGB barva nadpisu. Když necháš prázdné, použije se barva tématu.",
            progress_enabled: "Zobrazuje vodorovný ukazatel pro číselný stav.",
            progress_full_card:
              "Rychlý režim: progress track zabere celou plochu karty pod texty.",
            progress_min: "Spodní hranice progress baru.",
            progress_max: "Horní hranice progress baru.",
            progress_value_position: "Hodnota může být uvnitř, nad, pod nebo skrytá.",
            progress_use_value_color_rules:
              "Když je zapnuto, progress bar použije barvu progress_color z aktivního pravidla; jinak použije Barvu výplně.",
            progress_inside_text_color_mode:
              "Automatická volí světlou/tmavou barvu podle výplně progress baru.",
            title_overflow_mode: "Odřádkování nebo automatické zmenšení velikosti nadpisu.",
            value_overflow_mode: "Odřádkování nebo automatické zmenšení velikosti hodnoty.",
            title_min_scale: "Např. 0.55 znamená minimálně 55 % původní velikosti.",
            value_min_scale: "Např. 0.55 znamená minimálně 55 % původní velikosti.",
            value_coloring_enabled:
              "Pravidla se vyhodnocují automaticky podle nejbližší logické hranice, ne podle pořadí.",
            value_color_rule_1_progress_color:
              "Volitelné RGB. Když je zapnuto \"Barva podle pravidel hodnoty\", použije se jako výplň progress baru.",
            value_color_rule_1_progress_value_color:
              "Volitelné RGB. Když je zapnuto \"Barva podle pravidel hodnoty\", použije se pro text hodnoty v/na progress baru.",
            value_color_rule_2_progress_color:
              "Volitelné RGB. Když je zapnuto \"Barva podle pravidel hodnoty\", použije se jako výplň progress baru.",
            value_color_rule_2_progress_value_color:
              "Volitelné RGB. Když je zapnuto \"Barva podle pravidel hodnoty\", použije se pro text hodnoty v/na progress baru.",
            value_color_rule_3_progress_color:
              "Volitelné RGB. Když je zapnuto \"Barva podle pravidel hodnoty\", použije se jako výplň progress baru.",
            value_color_rule_3_progress_value_color:
              "Volitelné RGB. Když je zapnuto \"Barva podle pravidel hodnoty\", použije se pro text hodnoty v/na progress baru.",
          };

          const base = helpers[schema.name];
          const defaultValueText = getDefaultValueText(schema.name);
          if (!defaultValueText) {
            return base;
          }
          const defaultText = `Výchozí: ${defaultValueText}.`;
          return base ? `${base} ${defaultText}` : defaultText;
        },
        assertConfig: (config) => {
          const hasEntity = typeof config.entity === "string" && config.entity.trim() !== "";
          const hasStaticValue =
            typeof config.static_value_text === "string" &&
            config.static_value_text.trim() !== "";
          if (!hasEntity && !hasStaticValue) {
            throw new Error(
              "Vyplň entitu, nebo zadej pevný text hodnoty pro režim bez entity."
            );
          }
        },
      };
    }

    constructor() {
      super();
      this.config = undefined;
      this.content = undefined;
      this._hass = undefined;
      this._cachedCustomName = "";
      this._cachedCustomIcon = "";
      this._styleVarCache = Object.create(null);
      this._layoutCacheKey = "";
      this._lastIconMode = "";
      this._lastIconStateObj = undefined;
      this._lastIconColor = "";
      this._lastIconHass = undefined;
      this._titleBaseCss = "";
      this._valueBaseCss = "";
      this._unitBaseCss = "";
      this._progressThicknessBaseCss = "";
      this._progressInsideTextColorCacheKey = "";
      this._progressInsideTextColorCacheValue = "";
      this._postLayoutRaf = 0;
      this._postLayoutWarmupRenders = 3;
      this._lastPostLayoutKey = "";
      this._lastProgressEnabled = false;
      this._lastProgressValuePosition = "inside";
      this._resizeObserver = undefined;
      this._resizeRaf = 0;
      this._fontReadyHooked = false;
      this._stabilizeTimerA = 0;
      this._stabilizeTimerB = 0;
      this._colorRules = [];
      this._fitActive = false;
      this._boundClick = this._handleCardClick.bind(this);
      this._boundKeydown = this._handleCardKeydown.bind(this);
    }

    setConfig(config) {
      if (!config) {
        throw new Error("Je nutné definovat konfiguraci karty.");
      }
      const hasEntity = typeof config.entity === "string" && config.entity.trim() !== "";
      const hasStaticValue =
        typeof config.static_value_text === "string" &&
        config.static_value_text.trim() !== "";
      if (!hasEntity && !hasStaticValue) {
        throw new Error("Vyplň entitu, nebo zadej pevný text hodnoty.");
      }

      this.config = normalizeConfig(config);
      this._cachedCustomName = typeof this.config.name === "string" ? this.config.name.trim() : "";
      this._cachedCustomIcon = typeof this.config.icon === "string" ? this.config.icon.trim() : "";
      this._styleVarCache = Object.create(null);
      this._layoutCacheKey = "";
      this._lastIconMode = "";
      this._lastIconStateObj = undefined;
      this._lastIconColor = "";
      this._lastIconHass = undefined;
      this._titleBaseCss = "";
      this._valueBaseCss = "";
      this._unitBaseCss = "";
      this._progressThicknessBaseCss = "";
      this._progressInsideTextColorCacheKey = "";
      this._progressInsideTextColorCacheValue = "";
      this._postLayoutWarmupRenders = 3;
      this._lastPostLayoutKey = "";
      this._lastProgressEnabled = false;
      this._lastProgressValuePosition = "inside";
      this._colorRules = this._buildColorRules();
      this._fitActive = false;
      this._render();
      this._scheduleStabilizeReflows();
    }

    set hass(hass) {
      const prevHass = this._hass;
      this._hass = hass;
      if (
        this.content &&
        this.config &&
        prevHass &&
        prevHass.locale === hass?.locale &&
        prevHass.themes === hass?.themes &&
        this._isRelevantStateEqual(
          prevHass.states?.[this.config.entity],
          hass?.states?.[this.config.entity]
        )
      ) {
        return;
      }
      this._render();
    }

    connectedCallback() {
      this._render();
      this._setupResizeObserver();
      this._setupFontReadyReflow();
      this._scheduleStabilizeReflows();
    }

    disconnectedCallback() {
      if (this._postLayoutRaf) {
        cancelAnimationFrame(this._postLayoutRaf);
        this._postLayoutRaf = 0;
      }
      if (this._resizeRaf) {
        cancelAnimationFrame(this._resizeRaf);
        this._resizeRaf = 0;
      }
      if (this._stabilizeTimerA) {
        clearTimeout(this._stabilizeTimerA);
        this._stabilizeTimerA = 0;
      }
      if (this._stabilizeTimerB) {
        clearTimeout(this._stabilizeTimerB);
        this._stabilizeTimerB = 0;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = undefined;
      }
    }

    _invalidateLayoutReflow() {
      this._layoutCacheKey = "";
      this._lastPostLayoutKey = "";
      this._postLayoutWarmupRenders = 3;
    }

    _scheduleDynamicReflow() {
      if (!this.content || !this.config) {
        return;
      }

      if (this._resizeRaf) {
        cancelAnimationFrame(this._resizeRaf);
      }

      this._resizeRaf = requestAnimationFrame(() => {
        this._resizeRaf = 0;
        if (!this.content || !this.config) {
          return;
        }
        this._invalidateLayoutReflow();
        this._applyLayoutStyles();
        this._schedulePostLayoutOps(this._lastProgressEnabled, this._lastProgressValuePosition);
      });
    }

    _setupResizeObserver() {
      const card = this.content?.card;
      if (!card || this._resizeObserver || typeof ResizeObserver === "undefined") {
        return;
      }

      this._resizeObserver = new ResizeObserver(() => {
        this._scheduleDynamicReflow();
      });
      this._resizeObserver.observe(card);
    }

    _setupFontReadyReflow() {
      if (this._fontReadyHooked) {
        return;
      }
      this._fontReadyHooked = true;

      const fonts = typeof document !== "undefined" ? document.fonts : undefined;
      if (!fonts || !fonts.ready || typeof fonts.ready.then !== "function") {
        return;
      }

      fonts.ready
        .then(() => {
          if (this.isConnected) {
            this._scheduleDynamicReflow();
          }
        })
        .catch(() => {});
    }

    _scheduleStabilizeReflows() {
      if (!this.content || !this.config) {
        return;
      }

      if (this._stabilizeTimerA) {
        clearTimeout(this._stabilizeTimerA);
      }
      if (this._stabilizeTimerB) {
        clearTimeout(this._stabilizeTimerB);
      }

      const rerun = () => {
        if (!this.content || !this.config) {
          return;
        }
        this._invalidateLayoutReflow();
        this._applyLayoutStyles();
        this._schedulePostLayoutOps(this._lastProgressEnabled, this._lastProgressValuePosition);
      };

      // Stabilizes layout when dashboard/card-mod CSS lands slightly after first render.
      this._stabilizeTimerA = window.setTimeout(rerun, 80);
      this._stabilizeTimerB = window.setTimeout(rerun, 260);
    }

    getCardSize() {
      return 2;
    }

    getGridOptions() {
      return {
        rows: 2,
        columns: 6,
        min_rows: 2,
        max_rows: 4,
        min_columns: 3,
      };
    }

    _build() {
      if (this.content) {
        return;
      }

      this.innerHTML = `
        <ha-card class="ecc-card">
          <style>
            .ecc-card {
              height: 100%;
              min-height: 120px;
              box-sizing: border-box;
              overflow: hidden;
              cursor: pointer;
              position: relative;
              z-index: 0;
              isolation: isolate;
              --ecc-title-size: 14px;
              --ecc-title-render-size: var(--ecc-title-size);
              --ecc-title-weight: 700;
              --ecc-title-color: var(--secondary-text-color);
              --ecc-value-size: 30px;
              --ecc-value-render-size: var(--ecc-value-size);
              --ecc-value-weight: 900;
              --ecc-unit-size: 14px;
              --ecc-unit-render-size: var(--ecc-unit-size);
              --ecc-unit-weight: 700;
              --ecc-padding: 16px;
              --ecc-gap: 12px;
              --ecc-icon-size: 24px;
              --ecc-value-color: var(--primary-text-color);
              --ecc-progress-length: 100%;
              --ecc-progress-thickness: 12px;
              --ecc-progress-thickness-render: var(--ecc-progress-thickness);
              --ecc-progress-radius: 999px;
              --ecc-progress-track-color: rgba(127, 127, 127, 0.35);
              --ecc-progress-fill-color: var(--ecc-value-color);
              --ecc-progress-value-color: var(--ecc-value-color);
              --ecc-progress-inside-text-color: var(--primary-background-color, #fff);
              --ecc-progress-percent: 0%;
            }

            .ecc-card:focus-visible {
              outline: 2px solid var(--primary-color);
              outline-offset: -2px;
            }

            .ecc-wrap {
              height: 100%;
              min-height: 120px;
              box-sizing: border-box;
              position: relative;
              padding: var(--ecc-padding);
            }

            .ecc-main {
              min-width: 0;
              height: 100%;
              min-height: 0;
              position: relative;
            }

            .ecc-title {
              position: absolute;
              inset: 0;
              min-width: 0;
              width: 100%;
              display: flex;
              justify-content: var(--ecc-title-horizontal, flex-start);
              align-items: var(--ecc-title-vertical, flex-start);
              color: var(--ecc-title-color);
              font-size: var(--ecc-title-render-size);
              font-weight: var(--ecc-title-weight);
              line-height: 1.2;
              text-align: var(--ecc-title-text-align, left);
              white-space: normal;
              overflow-wrap: anywhere;
              z-index: 2;
            }

            .ecc-card.ecc-title-fit-shrink .ecc-title {
              white-space: nowrap;
              overflow-wrap: normal;
            }

            .ecc-not-found {
              color: var(--error-color);
            }

            .ecc-icon-wrap {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: var(--ecc-icon-vertical, flex-start);
              justify-content: var(--ecc-icon-horizontal, flex-end);
              pointer-events: none;
              z-index: 2;
            }

            .ecc-icon {
              color: var(--secondary-text-color);
              --mdc-icon-size: var(--ecc-icon-size);
            }

            .ecc-state {
              position: absolute;
              inset: 0;
              text-align: var(--ecc-value-text-align, left);
              min-width: 0;
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: var(--ecc-value-horizontal, flex-start);
              justify-content: var(--ecc-value-vertical, flex-end);
              line-height: 1;
              overflow: visible;
              z-index: 1;
            }

            .ecc-value-row {
              position: relative;
              z-index: 2;
              min-width: 0;
              width: 100%;
              display: inline-flex;
              align-items: baseline;
              justify-content: var(--ecc-value-content-justify, flex-start);
              flex-wrap: wrap;
            }

            .ecc-value {
              min-width: 0;
              font-size: var(--ecc-value-render-size);
              font-weight: var(--ecc-value-weight);
              color: var(--ecc-value-color);
              line-height: 1;
              white-space: normal;
              overflow-wrap: anywhere;
            }

            .ecc-unit {
              margin-left: 0.22em;
              font-size: var(--ecc-unit-render-size);
              font-weight: var(--ecc-unit-weight);
              color: var(--primary-text-color);
              line-height: 1;
              white-space: normal;
              flex: 0 0 auto;
            }

            .ecc-card.ecc-value-fit-shrink .ecc-value-row {
              flex-wrap: nowrap;
            }

            .ecc-card.ecc-value-fit-shrink .ecc-value,
            .ecc-card.ecc-value-fit-shrink .ecc-unit {
              white-space: nowrap;
              overflow-wrap: normal;
            }

            .ecc-progress {
              position: relative;
              z-index: 0;
              width: var(--ecc-progress-length);
              max-width: 100%;
              display: flex;
              flex-direction: column;
              gap: calc(var(--ecc-gap) * 0.25);
            }

            .ecc-card.ecc-progress-full-card .ecc-progress {
              width: 100%;
              height: 100%;
              justify-content: center;
            }

            .ecc-card.ecc-progress-full-card .ecc-progress-track {
              height: 100%;
            }

            .ecc-progress.ecc-progress-label-below {
              flex-direction: column-reverse;
            }

            .ecc-progress-label {
              min-width: 0;
              max-width: 100%;
              color: var(--ecc-progress-value-color);
              font-size: var(--ecc-value-render-size);
              font-weight: var(--ecc-value-weight);
              line-height: 1.2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              text-align: inherit;
            }

            .ecc-progress-track {
              width: 100%;
              height: var(--ecc-progress-thickness-render);
              background: var(--ecc-progress-track-color);
              border-radius: var(--ecc-progress-radius);
              overflow: hidden;
              position: relative;
            }

            .ecc-progress-fill {
              width: var(--ecc-progress-percent);
              height: 100%;
              background: var(--ecc-progress-fill-color);
              border-radius: inherit;
            }

            .ecc-progress-inside {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: var(--ecc-value-render-size);
              font-weight: var(--ecc-value-weight);
              color: var(--ecc-progress-inside-text-color);
              line-height: 1;
              white-space: nowrap;
              pointer-events: none;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
            }

            .ecc-hidden {
              display: none !important;
            }
          </style>

          <div class="ecc-wrap">
            <div class="ecc-main">
              <div class="ecc-title"></div>

              <div class="ecc-state">
                <div class="ecc-value-row">
                  <span class="ecc-value"></span>
                  <span class="ecc-unit"></span>
                </div>
                <div class="ecc-progress ecc-hidden">
                  <div class="ecc-progress-label ecc-hidden"></div>
                  <div class="ecc-progress-track">
                    <div class="ecc-progress-fill"></div>
                    <div class="ecc-progress-inside ecc-hidden"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="ecc-icon-wrap">
              <ha-state-icon class="ecc-icon"></ha-state-icon>
            </div>
          </div>
        </ha-card>
      `;

      const card = this.querySelector(".ecc-card");
      const title = this.querySelector(".ecc-title");
      const iconWrap = this.querySelector(".ecc-icon-wrap");
      const icon = this.querySelector(".ecc-icon");
      const state = this.querySelector(".ecc-state");
      const valueRow = this.querySelector(".ecc-value-row");
      const value = this.querySelector(".ecc-value");
      const unit = this.querySelector(".ecc-unit");
      const progress = this.querySelector(".ecc-progress");
      const progressTrack = this.querySelector(".ecc-progress-track");
      const progressLabel = this.querySelector(".ecc-progress-label");
      const progressInside = this.querySelector(".ecc-progress-inside");

      card.addEventListener("click", this._boundClick);
      card.addEventListener("keydown", this._boundKeydown);

      this.content = {
        card,
        title,
        iconWrap,
        icon,
        state,
        valueRow,
        value,
        unit,
        progress,
        progressTrack,
        progressLabel,
        progressInside,
      };
      this._setupResizeObserver();
    }

    _composeCssSize(value, unit, fallbackValue, fallbackUnit, allowedUnits = SIZE_UNITS) {
      const numeric = Number(value);
      const safeValue = Number.isFinite(numeric) ? numeric : fallbackValue;
      const safeUnit = normalizeUnit(unit, fallbackUnit, allowedUnits);
      return `${safeValue}${safeUnit}`;
    }

    _setStyleVar(name, value) {
      if (this._styleVarCache[name] === value) {
        return;
      }
      this._styleVarCache[name] = value;
      this.content.card.style.setProperty(name, value);
    }

    _toFlexJustify(horizontal) {
      if (horizontal === "center") {
        return "center";
      }
      return horizontal === "right" ? "flex-end" : "flex-start";
    }

    _toVerticalFlex(vertical) {
      if (vertical === "center") {
        return "center";
      }
      return vertical === "end" ? "flex-end" : "flex-start";
    }

    _applyPosition(prefix, positionName, fallbackPosition) {
      const safePosition = normalizePosition(positionName, fallbackPosition);
      const style = POSITION_STYLES[safePosition] || POSITION_STYLES[fallbackPosition];
      const horizontal = style.horizontal;

      this._setStyleVar(`--ecc-${prefix}-horizontal`, this._toFlexJustify(horizontal));
      this._setStyleVar(`--ecc-${prefix}-vertical`, this._toVerticalFlex(style.vertical));
      this._setStyleVar(`--ecc-${prefix}-text-align`, horizontal);

      if (prefix === "value") {
        this._setStyleVar(
          "--ecc-value-content-justify",
          this._toFlexJustify(horizontal)
        );
      }
    }

    _applyLayoutStyles() {
      if (!this.content || !this.config) {
        return;
      }

      const titleCss = this._composeCssSize(
        this.config.title_font_size_value,
        this.config.title_font_size_unit,
        DEFAULT_CONFIG.title_font_size_value,
        DEFAULT_CONFIG.title_font_size_unit
      );
      const titleColorCss = this._rgbToCss(this.config.title_color) || "var(--secondary-text-color)";
      const valueCss = this._composeCssSize(
        this.config.value_font_size_value,
        this.config.value_font_size_unit,
        DEFAULT_CONFIG.value_font_size_value,
        DEFAULT_CONFIG.value_font_size_unit
      );
      const unitCss = this._composeCssSize(
        this.config.unit_font_size_value,
        this.config.unit_font_size_unit,
        DEFAULT_CONFIG.unit_font_size_value,
        DEFAULT_CONFIG.unit_font_size_unit
      );
      const titleWeightCss = String(
        normalizeFontWeight(this.config.title_font_weight, DEFAULT_CONFIG.title_font_weight)
      );
      const valueWeightCss = String(
        normalizeFontWeight(this.config.value_font_weight, DEFAULT_CONFIG.value_font_weight)
      );
      const unitWeightCss = String(
        normalizeFontWeight(this.config.unit_font_weight, DEFAULT_CONFIG.unit_font_weight)
      );
      const iconCss = this._composeCssSize(
        this.config.icon_size_value,
        this.config.icon_size_unit,
        DEFAULT_CONFIG.icon_size_value,
        DEFAULT_CONFIG.icon_size_unit
      );
      const paddingCss = this._composeCssSize(
        this.config.padding_value,
        this.config.padding_unit,
        DEFAULT_CONFIG.padding_value,
        DEFAULT_CONFIG.padding_unit
      );
      const gapCss = this._composeCssSize(
        this.config.gap_value,
        this.config.gap_unit,
        DEFAULT_CONFIG.gap_value,
        DEFAULT_CONFIG.gap_unit
      );
      const progressLengthCss = this._composeCssSize(
        this.config.progress_length_value,
        this.config.progress_length_unit,
        DEFAULT_CONFIG.progress_length_value,
        DEFAULT_CONFIG.progress_length_unit,
        PROGRESS_LENGTH_UNITS
      );
      const progressThicknessCss = this._composeCssSize(
        this.config.progress_thickness_value,
        this.config.progress_thickness_unit,
        DEFAULT_CONFIG.progress_thickness_value,
        DEFAULT_CONFIG.progress_thickness_unit
      );
      const progressRadiusCss = this._composeCssSize(
        this.config.progress_radius_value,
        this.config.progress_radius_unit,
        DEFAULT_CONFIG.progress_radius_value,
        DEFAULT_CONFIG.progress_radius_unit
      );
      const progressTrackColorCss =
        this._rgbToCss(this.config.progress_track_color) || "rgba(127, 127, 127, 0.35)";
      const layoutKey = [
        titleCss,
        titleColorCss,
        valueCss,
        unitCss,
        titleWeightCss,
        valueWeightCss,
        unitWeightCss,
        iconCss,
        paddingCss,
        gapCss,
        progressLengthCss,
        progressThicknessCss,
        progressRadiusCss,
        progressTrackColorCss,
        this.config.title_position,
        this.config.value_position,
        this.config.icon_position,
      ].join("|");

      if (this._layoutCacheKey === layoutKey) {
        return;
      }
      this._layoutCacheKey = layoutKey;

      this._setStyleVar("--ecc-title-size", titleCss);
      this._setStyleVar("--ecc-title-render-size", titleCss);
      this._setStyleVar("--ecc-title-weight", titleWeightCss);
      this._setStyleVar("--ecc-title-color", titleColorCss);
      this._setStyleVar("--ecc-value-size", valueCss);
      this._setStyleVar("--ecc-value-render-size", valueCss);
      this._setStyleVar("--ecc-value-weight", valueWeightCss);
      this._setStyleVar("--ecc-unit-size", unitCss);
      this._setStyleVar("--ecc-unit-render-size", unitCss);
      this._setStyleVar("--ecc-unit-weight", unitWeightCss);
      this._setStyleVar("--ecc-icon-size", iconCss);
      this._setStyleVar("--ecc-padding", paddingCss);
      this._setStyleVar("--ecc-gap", gapCss);
      this._setStyleVar("--ecc-progress-length", progressLengthCss);
      this._setStyleVar("--ecc-progress-thickness", progressThicknessCss);
      this._setStyleVar("--ecc-progress-thickness-render", progressThicknessCss);
      this._setStyleVar("--ecc-progress-radius", progressRadiusCss);
      this._setStyleVar("--ecc-progress-track-color", progressTrackColorCss);

      this._applyPosition("title", this.config.title_position, DEFAULT_CONFIG.title_position);
      this._applyPosition("value", this.config.value_position, DEFAULT_CONFIG.value_position);
      this._applyPosition("icon", this.config.icon_position, DEFAULT_CONFIG.icon_position);
      this._titleBaseCss = titleCss;
      this._valueBaseCss = valueCss;
      this._unitBaseCss = unitCss;
      this._progressThicknessBaseCss = progressThicknessCss;
    }

    _ensureProgressInsideFits(showInside) {
      if (!showInside || !this.content?.progress) {
        this._setStyleVar(
          "--ecc-progress-thickness-render",
          this._progressThicknessBaseCss || "12px"
        );
        return;
      }

      const track = this.content.progressTrack;
      if (!track) {
        return;
      }

      this._setStyleVar(
        "--ecc-progress-thickness-render",
        this._progressThicknessBaseCss || "12px"
      );

      const baseHeight = track.getBoundingClientRect().height || 0;
      const textHeight = this.content.progressInside.scrollHeight || 0;
      const comfortableHeight = Math.ceil(textHeight + 6);

      if (comfortableHeight > baseHeight) {
        this._setStyleVar("--ecc-progress-thickness-render", `${comfortableHeight}px`);
      }
    }

    _fitScaleToWidth(element, minScale) {
      if (!element) {
        return 1;
      }

      const available = element.clientWidth;
      const needed = element.scrollWidth;
      if (!available || !needed || needed <= available) {
        return 1;
      }

      const raw = available / needed;
      return Math.max(Math.min(raw, 1), minScale);
    }

    _applyTextFit(progressEnabled) {
      const titleShrink = this.config?.title_overflow_mode === "shrink";
      const valueShrink = this.config?.value_overflow_mode === "shrink" && !progressEnabled;

      this.content.card.classList.toggle("ecc-title-fit-shrink", titleShrink);
      this.content.card.classList.toggle("ecc-value-fit-shrink", valueShrink);

      const titleBase = this._titleBaseCss || "14px";
      const valueBase = this._valueBaseCss || "30px";
      const unitBase = this._unitBaseCss || "14px";

      // Always measure at the base size: the needed/available ratio is applied to the
      // base size, so a previously applied scale would otherwise skew the result.
      this._setStyleVar("--ecc-title-render-size", titleBase);
      this._setStyleVar("--ecc-value-render-size", valueBase);
      this._setStyleVar("--ecc-unit-render-size", unitBase);

      if (titleShrink) {
        const scale = this._fitScaleToWidth(
          this.content.title,
          Number(this.config?.title_min_scale) || 0.55
        );
        if (scale < 1) {
          this._setStyleVar("--ecc-title-render-size", `calc(${titleBase} * ${scale.toFixed(3)})`);
        }
      }

      if (valueShrink) {
        const scale = this._fitScaleToWidth(
          this.content.valueRow,
          Number(this.config?.value_min_scale) || 0.55
        );
        if (scale < 1) {
          this._setStyleVar("--ecc-value-render-size", `calc(${valueBase} * ${scale.toFixed(3)})`);
          this._setStyleVar("--ecc-unit-render-size", `calc(${unitBase} * ${scale.toFixed(3)})`);
        }
      }
    }

    _schedulePostLayoutOps(progressEnabled, progressValuePosition) {
      if (this._postLayoutRaf) {
        cancelAnimationFrame(this._postLayoutRaf);
      }

      const card = this.content?.card;
      if (!card || !this.config) {
        return;
      }

      // Measuring forces a synchronous layout, so skip it unless something needs fitting
      // (or a previous fit still has to be reset to the base sizes).
      const needsFit =
        this.config.title_overflow_mode === "shrink" ||
        (progressEnabled
          ? progressValuePosition === "inside"
          : this.config.value_overflow_mode === "shrink");
      if (!needsFit && !this._fitActive) {
        return;
      }

      const sizeKey = `${card.clientWidth}x${card.clientHeight}`;
      const postLayoutKey = [
        sizeKey,
        this.content.title.textContent || "",
        this.content.value.textContent || "",
        this.content.unit.textContent || "",
        progressEnabled ? "1" : "0",
        progressValuePosition || "",
        this.config.title_overflow_mode,
        this.config.value_overflow_mode,
        this.config.title_min_scale,
        this.config.value_min_scale,
        this._titleBaseCss,
        this._valueBaseCss,
        this._unitBaseCss,
        this._progressThicknessBaseCss,
      ].join("|");

      if (postLayoutKey !== this._lastPostLayoutKey) {
        this._lastPostLayoutKey = postLayoutKey;
        this._postLayoutWarmupRenders = 2;
      } else if (this._postLayoutWarmupRenders <= 0) {
        return;
      }

      this._postLayoutRaf = requestAnimationFrame(() => {
        this._postLayoutRaf = 0;

        if (!this.content || !this.config) {
          return;
        }

        this._applyTextFit(progressEnabled);
        this._ensureProgressInsideFits(progressEnabled && progressValuePosition === "inside");
        this._fitActive = needsFit;
        if (this._postLayoutWarmupRenders > 0) {
          this._postLayoutWarmupRenders -= 1;
        }
      });
    }

    _isRelevantStateEqual(prevStateObj, nextStateObj) {
      if (prevStateObj === nextStateObj) {
        return true;
      }

      if (!prevStateObj || !nextStateObj) {
        return false;
      }

      const prevAttributes = prevStateObj.attributes || {};
      const nextAttributes = nextStateObj.attributes || {};
      const compareFriendlyName = this.config?.show_title && !this._cachedCustomName;
      const compareStateIcon = this.config?.show_icon && !this._cachedCustomIcon;

      return (
        prevStateObj.state === nextStateObj.state &&
        prevAttributes.unit_of_measurement === nextAttributes.unit_of_measurement &&
        (!compareFriendlyName || prevAttributes.friendly_name === nextAttributes.friendly_name) &&
        (!compareStateIcon ||
          (prevAttributes.icon === nextAttributes.icon &&
            prevAttributes.device_class === nextAttributes.device_class))
      );
    }

    _inferMaxFractionDigits(raw) {
      const str = String(raw ?? "").trim();

      if (!str || !Number.isFinite(Number(str))) {
        return 0;
      }

      if (/[eE]/.test(str)) {
        return 6;
      }

      const parts = str.split(".");
      if (parts.length < 2) {
        return 0;
      }

      return Math.min(parts[1].length, 6);
    }

    _formatNumber(raw) {
      const numeric = Number(raw);

      if (!Number.isFinite(numeric)) {
        return String(raw ?? "");
      }

      // Follow the Home Assistant user language, not the browser's.
      const locale = this._hass?.locale?.language || undefined;

      if (this.config?.round_value) {
        const decimals = Number.isFinite(Number(this.config.round_decimals))
          ? Math.max(0, Math.min(10, Number(this.config.round_decimals)))
          : 0;

        return numeric.toLocaleString(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: true,
        });
      }

      const inferred = this._inferMaxFractionDigits(raw);

      return numeric.toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: inferred,
        useGrouping: true,
      });
    }

    _rgbToCss(rgb) {
      if (!Array.isArray(rgb) || rgb.length !== 3) {
        return null;
      }

      const [r, g, b] = normalizeRgbColor(rgb, [255, 255, 255]);
      return `rgb(${r}, ${g}, ${b})`;
    }

    _getNumericStateValue(stateObj) {
      if (!stateObj) {
        return null;
      }

      const raw = stateObj.state;
      if (typeof raw === "string" && raw.trim() === "") {
        return null;
      }

      const numeric = Number(raw);
      return Number.isFinite(numeric) ? numeric : null;
    }

    _matchesComparison(left, operator, right) {
      switch (operator) {
        case ">":
          return left > right;
        case ">=":
          return left >= right;
        case "<":
          return left < right;
        case "<=":
          return left <= right;
        case "=":
          return left === right;
        case "!=":
          return left !== right;
        default:
          return false;
      }
    }

    _buildColorRules() {
      const rules = [];
      for (let i = 1; i <= 3; i += 1) {
        const ruleConfig = normalizeValueColorRule({
          enabled: this.config[`value_color_rule_${i}_enabled`],
          operator: this.config[`value_color_rule_${i}_operator`],
          value: this.config[`value_color_rule_${i}_value`],
          color: this.config[`value_color_rule_${i}_color`],
          progress_color: this.config[`value_color_rule_${i}_progress_color`],
          progress_value_color: this.config[`value_color_rule_${i}_progress_value_color`],
        });
        if (ruleConfig.enabled && Number.isFinite(ruleConfig.value)) {
          rules.push({ index: i, ...ruleConfig });
        }
      }
      return rules;
    }

    _getMatchedValueColorRule(stateObj) {
      if (!this.config?.value_coloring_enabled || this._colorRules.length === 0) {
        return null;
      }

      const numericValue = this._getNumericStateValue(stateObj);
      if (numericValue === null) {
        return null;
      }

      const exactMatches = [];
      const inequalityMatches = [];
      const notEqualMatches = [];
      for (const rule of this._colorRules) {
        const operator = rule.operator;
        const compareTo = rule.value;

        if (operator === "=") {
          if (numericValue === compareTo) {
            exactMatches.push(rule);
          }
          continue;
        }

        if (operator === "!=") {
          if (numericValue !== compareTo) {
            notEqualMatches.push(rule);
          }
          continue;
        }

        if (this._matchesComparison(numericValue, operator, compareTo)) {
          inequalityMatches.push(rule);
        }
      }

      if (exactMatches.length > 0) {
        return exactMatches[0];
      }

      if (inequalityMatches.length > 0) {
        const operatorPriority = {
          ">=": 0,
          ">": 1,
          "<=": 2,
          "<": 3,
        };

        inequalityMatches.sort((a, b) => {
          const distanceA = Math.abs(numericValue - a.value);
          const distanceB = Math.abs(numericValue - b.value);

          if (distanceA !== distanceB) {
            return distanceA - distanceB;
          }

          const priorityA = operatorPriority[a.operator] ?? 99;
          const priorityB = operatorPriority[b.operator] ?? 99;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          return a.index - b.index;
        });

        return inequalityMatches[0];
      }

      if (notEqualMatches.length > 0) {
        return notEqualMatches[0];
      }

      return null;
    }

    _getValueColor(matchedRule) {
      if (!matchedRule) {
        return null;
      }
      return this._rgbToCss(matchedRule.color);
    }

    _getStateObj() {
      if (!this._hass || !this.config || !this.config.entity) {
        return undefined;
      }

      return this._hass.states[this.config.entity];
    }

    _getName(stateObj) {
      if (this._cachedCustomName) {
        return this._cachedCustomName;
      }

      return stateObj?.attributes?.friendly_name || this.config?.entity || "Hodnota";
    }

    _getCustomIcon() {
      return this._cachedCustomIcon;
    }

    _getUnit(stateObj) {
      return stateObj?.attributes?.unit_of_measurement || "";
    }

    _getProgressPercent(numericValue) {
      const min = Number(this.config?.progress_min);
      const max = Number(this.config?.progress_max);

      if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
        return 0;
      }

      const percent = ((numericValue - min) / (max - min)) * 100;
      return Math.max(0, Math.min(100, percent));
    }

    _getProgressFillColor(matchedRule) {
      const customProgressColor =
        this._rgbToCss(this.config?.progress_color) || "var(--primary-color)";
      const ruleProgressColor = this._rgbToCss(matchedRule?.progress_color);

      if (this.config?.progress_use_value_color_rules) {
        return ruleProgressColor || customProgressColor;
      }

      return customProgressColor;
    }

    _parseCssRgb(cssColor) {
      if (typeof cssColor !== "string") {
        return null;
      }

      const match = cssColor
        .trim()
        .match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,\/]+[\d.]+)?\s*\)$/i);

      if (!match) {
        return null;
      }

      return [
        Math.max(0, Math.min(255, Number(match[1]))),
        Math.max(0, Math.min(255, Number(match[2]))),
        Math.max(0, Math.min(255, Number(match[3]))),
      ];
    }

    _resolveCssColorToRgb(cssColor) {
      const direct = this._parseCssRgb(cssColor);
      if (direct) {
        return direct;
      }

      if (!this.content?.card || typeof cssColor !== "string" || !cssColor.trim()) {
        return null;
      }

      const probe = document.createElement("span");
      probe.style.color = cssColor;
      probe.style.display = "none";
      this.content.card.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();

      return this._parseCssRgb(resolved);
    }

    _getProgressInsideTextColor(progressFillColor, matchedRule) {
      const ruleProgressValueColor = this.config?.progress_use_value_color_rules
        ? this._rgbToCss(matchedRule?.progress_value_color)
        : null;
      if (ruleProgressValueColor) {
        return ruleProgressValueColor;
      }

      if (this.config?.progress_inside_text_color_mode === "custom") {
        return (
          this._rgbToCss(this.config?.progress_inside_text_color) ||
          "var(--primary-background-color, #fff)"
        );
      }

      // Theme-dependent colors (CSS variables) resolve differently per theme.
      const themeKey = `${this._hass?.themes?.theme ?? ""}|${this._hass?.themes?.darkMode ?? ""}`;
      const cacheKey = `${progressFillColor}|${themeKey}`;
      if (this._progressInsideTextColorCacheKey === cacheKey) {
        return this._progressInsideTextColorCacheValue;
      }

      let rgb = this._resolveCssColorToRgb(progressFillColor);
      if (!rgb && this.content?.card) {
        rgb = this._resolveCssColorToRgb(
          getComputedStyle(this.content.card).getPropertyValue("--ecc-progress-fill-color")
        );
      }

      if (!rgb) {
        const fallback = "var(--primary-background-color, #fff)";
        this._progressInsideTextColorCacheKey = cacheKey;
        this._progressInsideTextColorCacheValue = fallback;
        return fallback;
      }

      const [r, g, b] = rgb;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const result = brightness > 170 ? "rgb(20, 20, 20)" : "rgb(255, 255, 255)";
      this._progressInsideTextColorCacheKey = cacheKey;
      this._progressInsideTextColorCacheValue = result;
      return result;
    }

    _getValue(stateObj) {
      if (!stateObj) {
        return "Nenalezeno";
      }

      const raw = stateObj.state;

      if (raw === undefined || raw === null || raw === "") {
        return "—";
      }

      if (raw === "unknown" || raw === "unavailable") {
        return raw;
      }

      return this._formatNumber(raw);
    }

    _getStaticValueText() {
      const value = typeof this.config?.static_value_text === "string"
        ? this.config.static_value_text.trim()
        : "";
      return value || "—";
    }

    _isActive(stateObj) {
      if (!stateObj) {
        return false;
      }

      return ACTIVE_STATES.has(String(stateObj.state).toLowerCase());
    }

    _handleCardClick() {
      if (!this.config?.entity) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this.config.entity },
          bubbles: true,
          composed: true,
        })
      );
    }

    _handleCardKeydown(ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        this._handleCardClick();
      }
    }

    _render() {
      if (!this.config) {
        return;
      }

      this._build();

      const hasEntity = Boolean(this.config.entity);
      const stateObj = this._getStateObj();
      const name = this._getName(stateObj);
      const customIcon = this._getCustomIcon();
      const unit = hasEntity ? this._getUnit(stateObj) : "";
      const value = hasEntity ? this._getValue(stateObj) : this._getStaticValueText();
      const numericValue = hasEntity ? this._getNumericStateValue(stateObj) : null;
      const showIcon = Boolean(this.config.show_icon);
      const iconActive = this.config.state_color && this._isActive(stateObj);
      const matchedValueColorRule = this._getMatchedValueColorRule(stateObj);
      const valueColor = this._getValueColor(matchedValueColorRule);
      const progressEnabled = Boolean(
        hasEntity && this.config.progress_enabled && numericValue !== null
      );
      const ariaLabel = unit ? `${value} ${unit}` : value;
      const effectiveValueColor = valueColor || "var(--primary-text-color)";
      const progressFillColor = this._getProgressFillColor(matchedValueColorRule);
      const progressInsideTextColor = this._getProgressInsideTextColor(
        progressFillColor,
        matchedValueColorRule
      );
      const progressValueColor =
        this.config.progress_use_value_color_rules
          ? this._rgbToCss(matchedValueColorRule?.progress_value_color) || effectiveValueColor
          : effectiveValueColor;
      const progressText = unit ? `${value} ${unit}` : value;
      const progressValuePosition = this.config.progress_value_position;
      this._lastProgressEnabled = progressEnabled;
      this._lastProgressValuePosition = progressValuePosition;

      if (this.content.title.textContent !== name) {
        this.content.title.textContent = name;
      }
      this.content.title.classList.toggle("ecc-not-found", hasEntity && !stateObj);
      this.content.title.classList.toggle("ecc-hidden", !this.config.show_title);

      if (this.content.value.textContent !== value) {
        this.content.value.textContent = value;
      }
      if (this.content.unit.textContent !== unit) {
        this.content.unit.textContent = unit;
      }
      this.content.unit.classList.toggle("ecc-hidden", !unit);

      if (this.content.state.getAttribute("aria-label") !== ariaLabel) {
        this.content.state.setAttribute("aria-label", ariaLabel);
      }

      this._setStyleVar("--ecc-value-color", effectiveValueColor);
      this._setStyleVar("--ecc-progress-fill-color", progressFillColor);
      this._setStyleVar("--ecc-progress-value-color", progressValueColor);
      this._setStyleVar("--ecc-progress-inside-text-color", progressInsideTextColor);

      this.content.iconWrap.classList.toggle("ecc-hidden", !showIcon);
      this.content.card.classList.toggle("ecc-progress-full-card", this.config.progress_full_card);

      this.content.valueRow.classList.toggle("ecc-hidden", progressEnabled);
      this.content.progress.classList.toggle("ecc-hidden", !progressEnabled);

      if (progressEnabled) {
        const progressPercent = this._getProgressPercent(numericValue);
        this._setStyleVar("--ecc-progress-percent", `${progressPercent}%`);

        const showInside = progressValuePosition === "inside";
        const showOutside = progressValuePosition === "above" || progressValuePosition === "below";
        const labelBelow = progressValuePosition === "below";

        this.content.progress.classList.toggle("ecc-progress-label-below", labelBelow);
        this.content.progressLabel.classList.toggle("ecc-hidden", !showOutside);
        this.content.progressInside.classList.toggle("ecc-hidden", !showInside);

        if (showOutside && this.content.progressLabel.textContent !== progressText) {
          this.content.progressLabel.textContent = progressText;
        }
        if (showInside && this.content.progressInside.textContent !== progressText) {
          this.content.progressInside.textContent = progressText;
        }
      }

      if (showIcon) {
        if (this._lastIconHass !== this._hass) {
          this.content.icon.hass = this._hass;
          this._lastIconHass = this._hass;
        }

        let iconMode = "fallback";
        if (customIcon) {
          iconMode = `custom:${customIcon}`;
        } else if (stateObj) {
          iconMode = "entity";
        }

        if (iconMode !== this._lastIconMode || stateObj !== this._lastIconStateObj) {
          if (customIcon) {
            this.content.icon.stateObj = null;
            this.content.icon.icon = customIcon;
            this.content.icon.setAttribute("icon", customIcon);
          } else if (stateObj) {
            this.content.icon.icon = undefined;
            this.content.icon.removeAttribute("icon");
            this.content.icon.stateObj = stateObj;
          } else {
            this.content.icon.stateObj = null;
            this.content.icon.icon = "mdi:help-circle-outline";
            this.content.icon.setAttribute("icon", "mdi:help-circle-outline");
          }

          this._lastIconMode = iconMode;
          this._lastIconStateObj = stateObj;
        }

        const iconColor = iconActive
          ? "var(--state-icon-active-color, var(--primary-color))"
          : "var(--state-icon-color, var(--secondary-text-color))";
        if (this._lastIconColor !== iconColor) {
          this.content.icon.style.color = iconColor;
          this._lastIconColor = iconColor;
        }
      }

      // Only entity cards open more-info on click, so only they are keyboard-focusable.
      if (hasEntity) {
        if (this.content.card.getAttribute("role") !== "button") {
          this.content.card.setAttribute("role", "button");
          this.content.card.tabIndex = 0;
        }
      } else if (this.content.card.hasAttribute("role")) {
        this.content.card.removeAttribute("role");
        this.content.card.removeAttribute("tabindex");
      }

      this._applyLayoutStyles();
      this._schedulePostLayoutOps(progressEnabled, progressValuePosition);
    }
  }

  customElements.define(CARD_TAG, EntityCustomizableCard);

  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === CARD_TAG)) {
    window.customCards.push({
      type: CARD_TAG,
      name: "Entita - přizpůsobitelná",
      preview: false,
      description: "Entity karta s přizpůsobitelným fontem, rozložením a pozicí prvků.",
    });
  }
})();

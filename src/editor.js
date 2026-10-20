import {
  COLOR_OPERATORS,
  DEFAULT_CONFIG,
  POSITION_OPTIONS,
  PROGRESS_INSIDE_TEXT_COLOR_MODES,
  PROGRESS_VALUE_POSITIONS,
  SIZE_UNITS,
  TEXT_OVERFLOW_MODES,
} from "./config.js";
import { getLanguage, t } from "./i18n.js";

const toOptions = (values, prefix, lang) =>
  values.map((value) => ({ value, label: t(lang, `${prefix}.${value}`) }));

const number = (name, { min, max, step = 0.1 } = {}) => ({
  name,
  selector: { number: { min, max, step, mode: "box" } },
});
const select = (name, options) => ({
  name,
  selector: { select: { mode: "dropdown", options } },
});
const boolean = (name) => ({ name, selector: { boolean: {} } });
const color = (name) => ({ name, selector: { color_rgb: {} } });
const grid = (minWidth, schema) => ({
  type: "grid",
  name: "",
  flatten: true,
  column_min_width: `${minWidth}px`,
  schema,
});
const expandable = (name, title, schema) => ({
  type: "expandable",
  name,
  title,
  flatten: true,
  schema,
});

export function buildConfigForm() {
  const lang = getLanguage();

  const unitOptions = SIZE_UNITS.map((value) => ({ value, label: value }));
  const progressLengthUnitOptions = [{ value: "%", label: "%" }, ...unitOptions];
  const operatorOptions = COLOR_OPERATORS.map((value) => ({ value, label: value }));
  const positionOptions = toOptions(POSITION_OPTIONS, "pos", lang);
  const progressValuePositionOptions = toOptions(PROGRESS_VALUE_POSITIONS, "ppos", lang);
  const insideTextColorModeOptions = toOptions(PROGRESS_INSIDE_TEXT_COLOR_MODES, "itc", lang);
  const textOverflowOptions = toOptions(TEXT_OVERFLOW_MODES, "ovf", lang);

  // size + unit pair on one row
  const sizeRow = (base, { min = 1, max = 400, units = unitOptions } = {}) =>
    grid(140, [number(`${base}_value`, { min, max }), select(`${base}_unit`, units)]);
  const weight = (name) => number(name, { min: 100, max: 900, step: 100 });
  const minScale = (name) => number(name, { min: 0.3, max: 1, step: 0.01 });

  const ruleFields = {
    operator: {
      label: t(lang, "rule.operator"),
      required: true,
      selector: { select: { mode: "dropdown", options: operatorOptions } },
    },
    value: {
      label: t(lang, "rule.value"),
      required: true,
      selector: { text: {} },
    },
    color: { label: t(lang, "rule.color"), selector: { color_rgb: {} } },
    progress_color: { label: t(lang, "rule.progress_color"), selector: { color_rgb: {} } },
    progress_value_color: {
      label: t(lang, "rule.progress_value_color"),
      selector: { color_rgb: {} },
    },
  };

  const enumDefaultLabels = {
    title_position: ["pos", positionOptions],
    value_position: ["pos", positionOptions],
    icon_position: ["pos", positionOptions],
    progress_value_position: ["ppos", progressValuePositionOptions],
    progress_inside_text_color_mode: ["itc", insideTextColorModeOptions],
    title_overflow_mode: ["ovf", textOverflowOptions],
    value_overflow_mode: ["ovf", textOverflowOptions],
  };

  const getDefaultValueText = (name) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, name)) {
      return null;
    }

    const raw = DEFAULT_CONFIG[name];

    if (Array.isArray(raw)) {
      return raw.length === 3 ? `[${raw[0]}, ${raw[1]}, ${raw[2]}]` : JSON.stringify(raw);
    }
    if (typeof raw === "boolean") {
      return t(lang, raw ? "default.on" : "default.off");
    }
    if (typeof raw === "string") {
      const labels = enumDefaultLabels[name];
      return labels ? t(lang, `${labels[0]}.${raw}`) : raw || null;
    }
    if (typeof raw === "number") {
      return String(raw);
    }
    return null;
  };

  return {
    schema: [
      { name: "entity", selector: { entity: {} } },
      {
        name: "attribute",
        selector: { attribute: {} },
        context: { filter_entity: "entity" },
      },
      { name: "name", selector: { text: {} } },
      { name: "static_value_text", selector: { text: {} } },
      grid(180, [
        boolean("show_icon"),
        boolean("show_title"),
        boolean("state_color"),
        {
          name: "icon",
          selector: { icon: {} },
          context: { icon_entity: "entity" },
        },
      ]),
      grid(180, [
        select("title_position", positionOptions),
        select("value_position", positionOptions),
        select("icon_position", positionOptions),
      ]),
      expandable("actions_section", t(lang, "section.actions_section"), [
        { name: "tap_action", selector: { ui_action: { default_action: "more-info" } } },
        { name: "hold_action", selector: { ui_action: { default_action: "none" } } },
        { name: "double_tap_action", selector: { ui_action: { default_action: "none" } } },
      ]),
      expandable("value_section", t(lang, "section.value_section"), [
        grid(180, [
          boolean("round_value"),
          number("round_decimals", { min: 0, max: 10, step: 1 }),
          { name: "unit", selector: { text: {} } },
        ]),
      ]),
      expandable("progress_section", t(lang, "section.progress_section"), [
        boolean("progress_enabled"),
        boolean("progress_full_card"),
        select("progress_value_position", progressValuePositionOptions),
        boolean("progress_use_value_color_rules"),
      ]),
      expandable("progress_advanced_section", t(lang, "section.progress_advanced_section"), [
        grid(180, [
          number("progress_min", { step: "any" }),
          number("progress_max", { step: "any" }),
        ]),
        sizeRow("progress_length", { min: 0, max: 2000, units: progressLengthUnitOptions }),
        sizeRow("progress_thickness"),
        sizeRow("progress_radius", { min: 0 }),
        grid(180, [color("progress_color"), color("progress_track_color")]),
        grid(180, [
          select("progress_inside_text_color_mode", insideTextColorModeOptions),
          color("progress_inside_text_color"),
        ]),
      ]),
      expandable("value_coloring_section", t(lang, "section.value_coloring_section"), [
        boolean("value_coloring_enabled"),
        {
          name: "rules",
          selector: {
            object: {
              multiple: true,
              label_field: "value",
              description_field: "operator",
              fields: ruleFields,
            },
          },
        },
      ]),
      expandable("typography", t(lang, "section.typography"), [
        sizeRow("title_font_size"),
        sizeRow("value_font_size"),
        sizeRow("unit_font_size"),
        sizeRow("icon_size"),
        grid(180, [
          weight("title_font_weight"),
          weight("value_font_weight"),
          weight("unit_font_weight"),
        ]),
        grid(180, [
          color("title_color"),
          select("title_overflow_mode", textOverflowOptions),
          minScale("title_min_scale"),
        ]),
        grid(180, [
          select("value_overflow_mode", textOverflowOptions),
          minScale("value_min_scale"),
        ]),
      ]),
      expandable("spacing", t(lang, "section.spacing"), [
        sizeRow("padding", { min: 0 }),
        sizeRow("gap", { min: 0 }),
      ]),
    ],
    computeLabel: (schema) => {
      if (schema.name.endsWith("_unit")) {
        return t(lang, "label.unit_suffix");
      }
      const key = `label.${schema.name}`;
      const label = t(lang, key);
      return label === key ? schema.name : label;
    },
    computeHelper: (schema) => {
      const key = `helper.${schema.name}`;
      const base = t(lang, key) === key ? undefined : t(lang, key);
      const defaultValueText = getDefaultValueText(schema.name);
      if (!defaultValueText) {
        return base;
      }
      const defaultText = `${t(lang, "default.prefix")}: ${defaultValueText}.`;
      return base ? `${base} ${defaultText}` : defaultText;
    },
    assertConfig: (config) => {
      const hasEntity = typeof config.entity === "string" && config.entity.trim() !== "";
      const hasStaticValue =
        typeof config.static_value_text === "string" && config.static_value_text.trim() !== "";
      if (!hasEntity && !hasStaticValue) {
        throw new Error(t(lang, "error.no_entity_editor"));
      }
    },
  };
}

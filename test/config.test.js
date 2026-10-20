import test from "node:test";
import assert from "node:assert/strict";
import { normalizeConfig, normalizeRules } from "../src/config.js";

test("legacy value_color_rule_N keys become rules", () => {
  const cfg = normalizeConfig({
    entity: "sensor.a",
    value_coloring_enabled: true,
    value_color_rule_1_enabled: true,
    value_color_rule_1_operator: "<",
    value_color_rule_1_value: 20,
    value_color_rule_1_color: [255, 80, 80],
    value_color_rule_2_enabled: false,
  });
  assert.equal(cfg.rules.length, 1);
  assert.deepEqual(cfg.rules[0].color, [255, 80, 80]);
  assert.equal(cfg.rules[0].operator, "<");
  assert.equal(cfg.rules[0].value, 20);
});

test("rules array wins over legacy keys and parses numeric strings", () => {
  const rules = normalizeRules({
    rules: [
      { operator: ">=", value: "30", color: [1, 2, 3] },
      { operator: "=", value: " open ", color: [4, 5, 6] },
      { operator: ">", value: "" },
      { operator: "bogus", value: 1 },
    ],
    value_color_rule_1_enabled: true,
    value_color_rule_1_value: 5,
  });
  assert.equal(rules.length, 3);
  assert.equal(rules[0].value, 30);
  assert.equal(rules[1].value, "open");
  assert.equal(rules[2].operator, ">");
});

test("coloring switches on by itself when rules are given", () => {
  assert.equal(normalizeConfig({ entity: "a", rules: [{ operator: ">", value: 1 }] }).value_coloring_enabled, true);
  assert.equal(
    normalizeConfig({ entity: "a", value_coloring_enabled: false, rules: [{ operator: ">", value: 1 }] })
      .value_coloring_enabled,
    false
  );
});

test("units: % is valid only for the progress length", () => {
  const cfg = normalizeConfig({ entity: "a", progress_length_unit: "%", padding_unit: "%", gap_unit: "vw" });
  assert.equal(cfg.progress_length_unit, "%");
  assert.equal(cfg.padding_unit, "px");
  assert.equal(cfg.gap_unit, "vw");
  assert.equal(normalizeConfig({ entity: "a", progress_length_unit: "vh" }).progress_length_unit, "%");
});

test("legacy size strings are parsed", () => {
  const cfg = normalizeConfig({ entity: "a", title_font_size: "2rem", padding: 10 });
  assert.equal(cfg.title_font_size_value, 2);
  assert.equal(cfg.title_font_size_unit, "rem");
  assert.equal(cfg.padding_value, 10);
});

test("attribute and unit are trimmed", () => {
  const cfg = normalizeConfig({ entity: "a", attribute: " battery ", unit: " % " });
  assert.equal(cfg.attribute, "battery");
  assert.equal(cfg.unit, "%");
});

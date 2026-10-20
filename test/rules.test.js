import test from "node:test";
import assert from "node:assert/strict";
import { pickMatchingRule, toNumber } from "../src/rules.js";

const rule = (operator, value, extra = {}) => ({ operator, value, color: [1, 2, 3], ...extra });

test("toNumber accepts numbers and numeric strings only", () => {
  assert.equal(toNumber("21.5"), 21.5);
  assert.equal(toNumber(7), 7);
  assert.equal(toNumber(""), null);
  assert.equal(toNumber("  "), null);
  assert.equal(toNumber("on"), null);
  assert.equal(toNumber(true), null);
  assert.equal(toNumber(NaN), null);
});

test("the nearest inequality threshold wins", () => {
  const rules = [rule(">", 10, { id: "a" }), rule(">", 50, { id: "b" }), rule("<", 100, { id: "c" })];
  assert.equal(pickMatchingRule(rules, "60").id, "b");
  assert.equal(pickMatchingRule(rules, "20").id, "a");
});

test("an exact match beats inequalities, != is the last resort", () => {
  const rules = [rule("!=", 5, { id: "ne" }), rule(">", 0, { id: "gt" }), rule("=", 5, { id: "eq" })];
  assert.equal(pickMatchingRule(rules, "5").id, "eq");
  assert.equal(pickMatchingRule(rules, "7").id, "gt");
  assert.equal(pickMatchingRule(rules, "-3").id, "ne");
});

test("ties prefer >=, then list order", () => {
  const rules = [rule(">", 10, { id: "gt" }), rule(">=", 10, { id: "ge" })];
  assert.equal(pickMatchingRule(rules, "20").id, "ge");
});

test("text rules compare case-insensitively with = and !=", () => {
  const rules = [rule("=", "open", { id: "open" }), rule("!=", "open", { id: "other" })];
  assert.equal(pickMatchingRule(rules, "Open").id, "open");
  assert.equal(pickMatchingRule(rules, "closed").id, "other");
});

test("numeric rules ignore non-numeric values; text rules ignore < and >", () => {
  assert.equal(pickMatchingRule([rule(">", 1)], "unavailable"), null);
  assert.equal(pickMatchingRule([rule(">", "abc")], "abd"), null);
  assert.equal(pickMatchingRule([rule(">", 1)], undefined), null);
  assert.equal(pickMatchingRule([], "1"), null);
});

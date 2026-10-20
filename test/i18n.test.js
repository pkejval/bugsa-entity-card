import test from "node:test";
import assert from "node:assert/strict";
import { getLanguage, messageKeys, t } from "../src/i18n.js";
import { buildConfigForm } from "../src/editor.js";

test("cs and en define the same message keys", () => {
  assert.deepEqual([...messageKeys("cs")].sort(), [...messageKeys("en")].sort());
});

test("getLanguage maps Czech to cs and everything else to en", () => {
  assert.equal(getLanguage({ locale: { language: "cs" } }), "cs");
  assert.equal(getLanguage({ locale: { language: "cs-CZ" } }), "cs");
  assert.equal(getLanguage({ locale: { language: "de" } }), "en");
  assert.equal(getLanguage({ language: "en" }), "en");
});

test("unknown keys fall back to the key", () => {
  assert.equal(t("en", "nope"), "nope");
});

function fieldNames(schema, out = []) {
  for (const item of schema) {
    if (item.schema) fieldNames(item.schema, out);
    else out.push(item.name);
  }
  return out;
}

for (const language of ["cs-CZ", "en-US"]) {
  test(`every editor field has a label (${language})`, () => {
    Object.defineProperty(globalThis, "navigator", { value: { language }, configurable: true });
    const form = buildConfigForm();
    for (const name of fieldNames(form.schema)) {
      const label = form.computeLabel({ name });
      assert.ok(label && label !== name, `missing label for ${name}`);
    }
    assert.throws(() => form.assertConfig({}));
    assert.doesNotThrow(() => form.assertConfig({ entity: "sensor.a" }));
  });
}

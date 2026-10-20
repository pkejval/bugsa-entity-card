import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const bundle = readFileSync(new URL("../.build/bugsa-entity-card.js", import.meta.url), "utf8");

function setup() {
  const dom = new JSDOM("<body></body>", { runScripts: "outside-only", pretendToBeVisual: true });
  const win = dom.window;
  win.eval(bundle);
  const el = win.document.createElement("entity-customizable-card");
  win.document.body.appendChild(el);
  const frame = () => new Promise((resolve) => win.requestAnimationFrame(() => resolve()));
  return { win, el, frame, q: (s) => el.querySelector(s), close: () => win.close() };
}

const hassWith = (state, attributes = {}, extra = {}) => ({
  locale: { language: "cs" },
  themes: {},
  config: { unit_system: { temperature: "°C" } },
  states: { "sensor.t": { state, attributes: { unit_of_measurement: "°C", friendly_name: "Teplota", ...attributes } } },
  ...extra,
});

test("renders value, unit, title and formats with the HA locale", () => {
  const { el, q, close } = setup();
  el.setConfig({ entity: "sensor.t" });
  el.hass = hassWith("1234.5");
  assert.equal(q(".ecc-value").textContent, "1 234,5");
  assert.equal(q(".ecc-unit").textContent, "°C");
  assert.equal(q(".ecc-title").textContent, "Teplota");
  close();
});

test("color rules: numeric, text and auto-enable", () => {
  const { el, q, close } = setup();
  el.setConfig({
    entity: "sensor.t",
    rules: [
      { operator: ">", value: 20, color: [255, 0, 0] },
      { operator: "=", value: "unavailable", color: [0, 0, 255] },
    ],
  });
  const color = () => el.content.card.style.getPropertyValue("--ecc-value-color");
  el.hass = hassWith("25");
  assert.equal(color(), "rgb(255, 0, 0)");
  el.hass = hassWith("5");
  assert.equal(color(), "var(--primary-text-color)");
  el.hass = hassWith("unavailable");
  assert.equal(color(), "rgb(0, 0, 255)");
  close();
});

test("attribute mode shows the attribute and hides the entity unit", () => {
  const { el, q, close } = setup();
  el.setConfig({ entity: "sensor.t", attribute: "battery", unit: "%" });
  el.hass = hassWith("on", { battery: 87 });
  assert.equal(q(".ecc-value").textContent, "87");
  assert.equal(q(".ecc-unit").textContent, "%");
  el.hass = hassWith("on", { battery: 42 });
  assert.equal(q(".ecc-value").textContent, "42");
  close();
});

test("temperature attributes use the HA unit system", () => {
  const { el, q, close } = setup();
  el.setConfig({ entity: "sensor.t", attribute: "current_temperature" });
  el.hass = hassWith("heat", { current_temperature: 21.5 });
  assert.equal(q(".ecc-unit").textContent, "°C");
  close();
});

test("plain states go through hass.formatEntityState; unit is hidden for them", () => {
  const { el, q, close } = setup();
  el.setConfig({ entity: "sensor.t" });
  el.hass = hassWith("unavailable", {}, { formatEntityState: () => "Nedostupné" });
  assert.equal(q(".ecc-value").textContent, "Nedostupné");
  assert.ok(q(".ecc-unit").classList.contains("ecc-hidden"));
  close();
});

test("missing entity is reported in the HA language", () => {
  const { el, q, close } = setup();
  el.setConfig({ entity: "sensor.nope" });
  el.hass = hassWith("1");
  assert.equal(q(".ecc-value").textContent, "Nenalezeno");
  el.hass = { ...hassWith("1"), locale: { language: "en" } };
  assert.equal(q(".ecc-value").textContent, "Not found");
  close();
});

test("tap opens more-info by default, keyboard works, static card is inert", () => {
  const { win, el, close } = setup();
  const events = [];
  el.addEventListener("hass-more-info", (e) => events.push(e.detail.entityId));
  el.setConfig({ entity: "sensor.t" });
  el.hass = hassWith("1");
  el.content.card.dispatchEvent(new win.Event("click", { bubbles: true }));
  el.content.card.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.deepEqual(events, ["sensor.t", "sensor.t"]);
  assert.equal(el.content.card.getAttribute("role"), "button");

  el.setConfig({ static_value_text: "Hi" });
  el.content.card.dispatchEvent(new win.Event("click", { bubbles: true }));
  assert.equal(events.length, 2);
  assert.equal(el.content.card.hasAttribute("role"), false);
  close();
});

test("configured actions fire hass-action; hold suppresses the following tap", async () => {
  const { win, el, close } = setup();
  const actions = [];
  el.addEventListener("hass-action", (e) => actions.push(e.detail.action));
  el.setConfig({
    entity: "sensor.t",
    tap_action: { action: "navigate", navigation_path: "/x" },
    hold_action: { action: "call-service", service: "light.toggle" },
    double_tap_action: { action: "url", url_path: "https://example.com" },
  });
  el.hass = hassWith("1");
  const card = el.content.card;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  card.dispatchEvent(new win.Event("click", { bubbles: true }));
  card.dispatchEvent(new win.Event("click", { bubbles: true }));
  assert.deepEqual(actions, ["double_tap"]);

  card.dispatchEvent(new win.Event("click", { bubbles: true }));
  await sleep(300);
  assert.deepEqual(actions, ["double_tap", "tap"]);

  card.dispatchEvent(new win.Event("pointerdown", { bubbles: true }));
  await sleep(600);
  card.dispatchEvent(new win.Event("pointerup", { bubbles: true }));
  card.dispatchEvent(new win.Event("click", { bubbles: true }));
  await sleep(300);
  assert.deepEqual(actions, ["double_tap", "tap", "hold"]);
  close();
});

test("auto-shrink always measures at the base size (regression)", async () => {
  const { win, el, frame, close } = setup();
  el.setConfig({ entity: "sensor.t", value_overflow_mode: "shrink", value_min_scale: 0.3 });
  el.hass = hassWith("1");
  await frame();

  // Fake layout: the row is 100px wide and needs `need` px at the base size,
  // scaled by whatever calc(base * factor) is currently applied.
  let need = 200;
  const card = el.content.card;
  const factor = () => {
    const v = card.style.getPropertyValue("--ecc-value-render-size");
    const m = v.match(/\* ([\d.]+)\)/);
    return m ? Number(m[1]) : 1;
  };
  Object.defineProperty(el.content.valueRow, "clientWidth", { get: () => 100, configurable: true });
  Object.defineProperty(el.content.valueRow, "scrollWidth", { get: () => need * factor(), configurable: true });

  el.hass = hassWith("1111");
  await frame();
  await frame();
  assert.equal(factor(), 0.5);

  need = 250;
  el.hass = hassWith("22222");
  await frame();
  await frame();
  assert.equal(factor(), 0.4);
  close();
});

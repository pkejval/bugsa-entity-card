import {
  ACTIVE_STATES,
  DEFAULT_CONFIG,
  POSITION_STYLES,
  PROGRESS_LENGTH_UNITS,
  SIZE_UNITS,
  normalizeConfig,
  normalizePosition,
  normalizeFontWeight,
  normalizeRgbColor,
  normalizeUnit,
} from "./config.js";
import { buildConfigForm } from "./editor.js";
import { getLanguage, t } from "./i18n.js";
import { pickMatchingRule, toNumber } from "./rules.js";

const HOLD_MS = 500;
const DOUBLE_TAP_MS = 250;
const DEFAULT_TAP_ACTION = { action: "more-info" };
const NO_ACTION = { action: "none" };
// Attributes that carry a temperature in the Home Assistant unit system.
const DEVICE_CLASS_UNIT_KEYS = {
  temperature: "temperature",
  pressure: "pressure",
  wind_speed: "wind_speed",
};
const TEMPERATURE_ATTRIBUTES = new Set([
  "temperature",
  "current_temperature",
  "target_temp_high",
  "target_temp_low",
]);

export class EntityCustomizableCard extends HTMLElement {
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
    return buildConfigForm();
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
    this._fitActive = false;
    this._holdTimer = 0;
    this._tapTimer = 0;
    this._holdFired = false;
    this._boundClick = this._handleCardClick.bind(this);
    this._boundKeydown = this._handleCardKeydown.bind(this);
    this._boundPointerDown = this._handlePointerDown.bind(this);
    this._boundPointerEnd = this._handlePointerEnd.bind(this);
    this._boundContextMenu = this._handleContextMenu.bind(this);
  }

  setConfig(config) {
    const lang = getLanguage(this._hass);
    if (!config) {
      throw new Error(t(lang, "error.no_config"));
    }
    const hasEntity = typeof config.entity === "string" && config.entity.trim() !== "";
    const hasStaticValue =
      typeof config.static_value_text === "string" &&
      config.static_value_text.trim() !== "";
    if (!hasEntity && !hasStaticValue) {
      throw new Error(t(lang, "error.no_entity"));
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
      prevHass.config?.unit_system === hass?.config?.unit_system &&
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
    this._clearPressTimers();
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
            cursor: default;
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

          .ecc-card.ecc-interactive {
            cursor: pointer;
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
            transition: width 0.4s ease;
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

          @media (prefers-reduced-motion: reduce) {
            .ecc-progress-fill {
              transition: none;
            }
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
    card.addEventListener("pointerdown", this._boundPointerDown);
    card.addEventListener("pointerup", this._boundPointerEnd);
    card.addEventListener("pointercancel", this._boundPointerEnd);
    card.addEventListener("pointerleave", this._boundPointerEnd);
    card.addEventListener("contextmenu", this._boundContextMenu);

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

    const attribute = this.config?.attribute;
    const prevAttribute = attribute ? prevAttributes[attribute] : undefined;
    const nextAttribute = attribute ? nextAttributes[attribute] : undefined;
    const attributeEqual =
      prevAttribute === nextAttribute ||
      (typeof prevAttribute === "object" &&
        typeof nextAttribute === "object" &&
        JSON.stringify(prevAttribute) === JSON.stringify(nextAttribute));

    return (
      attributeEqual &&
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

    return toNumber(this._getRawValue(stateObj));
  }

  _getRawValue(stateObj) {
    if (!stateObj) {
      return undefined;
    }

    const attribute = this.config?.attribute;
    return attribute ? stateObj.attributes?.[attribute] : stateObj.state;
  }

  _getMatchedValueColorRule(stateObj) {
    if (!this.config?.value_coloring_enabled || this.config.rules.length === 0) {
      return null;
    }

    return pickMatchingRule(this.config.rules, this._getRawValue(stateObj));
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

    return (
      stateObj?.attributes?.friendly_name ||
      this.config?.entity ||
      t(getLanguage(this._hass), "card.default_name")
    );
  }

  _getCustomIcon() {
    return this._cachedCustomIcon;
  }

  _getUnit(stateObj) {
    if (this.config.unit) {
      return this.config.unit;
    }

    const unitSystem = this._hass?.config?.unit_system;
    const attribute = this.config.attribute;
    if (attribute) {
      return TEMPERATURE_ATTRIBUTES.has(attribute) ? unitSystem?.temperature || "" : "";
    }

    const unit = stateObj?.attributes?.unit_of_measurement;
    if (unit) {
      return unit;
    }

    // Some numeric entities omit the unit although their device class implies one.
    const deviceClass = stateObj?.attributes?.device_class;
    return DEVICE_CLASS_UNIT_KEYS[deviceClass] ? unitSystem?.[DEVICE_CLASS_UNIT_KEYS[deviceClass]] || "" : "";
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
      return t(getLanguage(this._hass), "card.not_found");
    }

    const raw = this._getRawValue(stateObj);

    if (raw === undefined || raw === null || raw === "") {
      return "—";
    }

    if (toNumber(raw) !== null) {
      return this._formatNumber(raw);
    }

    if (typeof raw === "object") {
      return JSON.stringify(raw);
    }

    // Plain states (on, unavailable, timestamps, ...) are translated/formatted by Home Assistant.
    if (!this.config.attribute && typeof this._hass?.formatEntityState === "function") {
      try {
        return this._hass.formatEntityState(stateObj) || String(raw);
      } catch (err) {
        return String(raw);
      }
    }

    return String(raw);
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

  _getAction(kind) {
    const configured = this.config?.[`${kind}_action`];
    if (configured && typeof configured === "object" && typeof configured.action === "string") {
      return configured;
    }
    if (kind === "tap" && this.config?.entity) {
      return DEFAULT_TAP_ACTION;
    }
    return NO_ACTION;
  }

  _isActionEnabled(kind) {
    return this._getAction(kind).action !== "none";
  }

  _isInteractive() {
    return (
      this._isActionEnabled("tap") ||
      this._isActionEnabled("hold") ||
      this._isActionEnabled("double_tap")
    );
  }

  _fireAction(kind) {
    const action = this._getAction(kind);
    if (action.action === "none") {
      return;
    }

    const entityId = action.entity || this.config.entity;
    if (action.action === "more-info" && entityId) {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId },
          bubbles: true,
          composed: true,
        })
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent("hass-action", {
        detail: {
          action: kind,
          config: {
            entity: this.config.entity,
            tap_action: this._getAction("tap"),
            hold_action: this._getAction("hold"),
            double_tap_action: this._getAction("double_tap"),
          },
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _clearPressTimers() {
    clearTimeout(this._holdTimer);
    clearTimeout(this._tapTimer);
    this._holdTimer = 0;
    this._tapTimer = 0;
  }

  _handlePointerDown(ev) {
    if (ev.button > 0) {
      return;
    }
    this._holdFired = false;
    clearTimeout(this._holdTimer);
    this._holdTimer = 0;
    if (this._isActionEnabled("hold")) {
      this._holdTimer = setTimeout(() => {
        this._holdTimer = 0;
        this._holdFired = true;
        this._fireAction("hold");
      }, HOLD_MS);
    }
  }

  _handlePointerEnd() {
    clearTimeout(this._holdTimer);
    this._holdTimer = 0;
  }

  _handleContextMenu(ev) {
    if (this._isActionEnabled("hold")) {
      ev.preventDefault();
    }
  }

  _handleCardClick() {
    if (this._holdFired) {
      this._holdFired = false;
      return;
    }

    if (this._isActionEnabled("double_tap")) {
      if (this._tapTimer) {
        clearTimeout(this._tapTimer);
        this._tapTimer = 0;
        this._fireAction("double_tap");
        return;
      }
      this._tapTimer = setTimeout(() => {
        this._tapTimer = 0;
        this._fireAction("tap");
      }, DOUBLE_TAP_MS);
      return;
    }

    this._fireAction("tap");
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
    const numericValue = hasEntity ? this._getNumericStateValue(stateObj) : null;
    // A unit only makes sense next to a number (not next to "unavailable" or text).
    const unit = hasEntity && numericValue !== null ? this._getUnit(stateObj) : "";
    const value = hasEntity ? this._getValue(stateObj) : this._getStaticValueText();
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

    // Focusable and pointer-styled only while at least one action is configured.
    const interactive = this._isInteractive();
    this.content.card.classList.toggle("ecc-interactive", interactive);
    if (interactive) {
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

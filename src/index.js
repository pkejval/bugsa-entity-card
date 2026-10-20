import { CARD_TAG } from "./config.js";
import { EntityCustomizableCard } from "./card.js";
import { getLanguage, t } from "./i18n.js";

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, EntityCustomizableCard);

  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === CARD_TAG)) {
    const lang = getLanguage();
    window.customCards.push({
      type: CARD_TAG,
      name: t(lang, "card.picker_name"),
      preview: false,
      description: t(lang, "card.picker_description"),
    });
  }
}

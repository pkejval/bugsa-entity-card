const MESSAGES = {
  cs: {
    "error.no_config": "Je nutné definovat konfiguraci karty.",
    "error.no_entity": "Vyplň entitu, nebo zadej pevný text hodnoty.",
    "error.no_entity_editor":
      "Vyplň entitu, nebo zadej pevný text hodnoty pro režim bez entity.",
    "card.default_name": "Hodnota",
    "card.not_found": "Nenalezeno",
    "card.picker_name": "Entita - přizpůsobitelná",
    "card.picker_description":
      "Entity karta s přizpůsobitelným fontem, rozložením a pozicí prvků.",

    "default.prefix": "Výchozí",
    "default.on": "Zapnuto",
    "default.off": "Vypnuto",

    "pos.top_left": "Vlevo nahoře",
    "pos.top_center": "Nahoře uprostřed",
    "pos.top_right": "Vpravo nahoře",
    "pos.center_left": "Vlevo uprostřed",
    "pos.center": "Střed",
    "pos.center_right": "Vpravo uprostřed",
    "pos.bottom_left": "Vlevo dole",
    "pos.bottom_center": "Dole uprostřed",
    "pos.bottom_right": "Vpravo dole",
    "ppos.inside": "Uvnitř",
    "ppos.above": "Nad",
    "ppos.below": "Pod",
    "ppos.hidden": "Skrýt hodnotu",
    "itc.auto": "Automatická",
    "itc.custom": "Vlastní",
    "ovf.wrap": "Odřádkovat",
    "ovf.shrink": "Auto zmenšit",

    "section.value_section": "Hodnota",
    "section.progress_section": "Progress bar",
    "section.progress_advanced_section": "Progress bar - pokročilé",
    "section.actions_section": "Akce",
    "section.value_coloring_section": "Barva hodnoty",
    "section.typography": "Typografie",
    "section.spacing": "Rozestupy",

    "rule.operator": "Operátor",
    "rule.value": "Hodnota (číslo nebo text)",
    "rule.color": "Barva hodnoty",
    "rule.progress_color": "Barva progress",
    "rule.progress_value_color": "Barva textu progress",

    "label.entity": "Entita",
    "label.attribute": "Atribut",
    "label.name": "Vlastní nadpis",
    "label.unit": "Vlastní jednotka",
    "label.static_value_text": "Pevný text hodnoty",
    "label.show_icon": "Zobrazit ikonu",
    "label.show_title": "Zobrazit nadpis",
    "label.state_color": "Barva ikony podle stavu",
    "label.icon": "Ikona",
    "label.title_position": "Pozice nadpisu",
    "label.value_position": "Pozice hodnoty",
    "label.icon_position": "Pozice ikony",
    "label.tap_action": "Akce při kliknutí",
    "label.hold_action": "Akce při podržení",
    "label.double_tap_action": "Akce při dvojitém kliknutí",
    "label.round_value": "Zaokrouhlit číslo",
    "label.round_decimals": "Počet desetinných míst",
    "label.progress_enabled": "Zapnout progress bar",
    "label.progress_full_card": "Progress přes celou kartu",
    "label.progress_min": "Minimum",
    "label.progress_max": "Maximum",
    "label.progress_length_value": "Délka",
    "label.progress_thickness_value": "Tloušťka",
    "label.progress_radius_value": "Zaoblení",
    "label.unit_suffix": "Jednotka",
    "label.progress_value_position": "Pozice hodnoty",
    "label.progress_use_value_color_rules": "Barva podle pravidel hodnoty",
    "label.progress_color": "Barva výplně",
    "label.progress_track_color": "Barva pozadí",
    "label.progress_inside_text_color_mode": "Barva textu uvnitř",
    "label.progress_inside_text_color": "Vlastní barva textu",
    "label.title_overflow_mode": "Nadpis když se nevejde",
    "label.value_overflow_mode": "Hodnota když se nevejde",
    "label.title_min_scale": "Min. zmenšení nadpisu",
    "label.value_min_scale": "Min. zmenšení hodnoty",
    "label.value_coloring_enabled": "Zapnout pravidla barvy hodnoty",
    "label.rules": "Pravidla barvy",
    "label.title_font_size_value": "Velikost nadpisu",
    "label.title_font_weight": "Tloušťka nadpisu",
    "label.title_color": "Barva nadpisu",
    "label.value_font_size_value": "Velikost hodnoty",
    "label.value_font_weight": "Tloušťka hodnoty",
    "label.unit_font_size_value": "Velikost jednotky",
    "label.unit_font_weight": "Tloušťka jednotky",
    "label.icon_size_value": "Velikost ikony",
    "label.padding_value": "Padding",
    "label.gap_value": "Mezera",

    "helper.entity":
      "Volitelné. Když není vyplněná, karta použije pevný text hodnoty (pokud je zadaný).",
    "helper.attribute":
      "Volitelné. Zobrazí atribut entity místo jejího stavu (používá se i pro pravidla a progress bar).",
    "helper.name": "Když necháš prázdné, použije se název entity.",
    "helper.unit":
      "Volitelné. Přepíše jednotku entity; u atributů je ve výchozím stavu bez jednotky.",
    "helper.static_value_text":
      "Použije se jen pokud není vyplněná entita. Pak se zobrazí místo hodnoty.",
    "helper.round_decimals": "Použije se jen pokud je zapnuté zaokrouhlení.",
    "helper.icon": "Když necháš prázdné, použije se ikona entity.",
    "helper.title_position": "Nastavuje pozici textu nadpisu v kartě.",
    "helper.value_position": "Nastavuje pozici hodnoty a jednotky v kartě.",
    "helper.icon_position": "Nastavuje pozici ikony v celé ploše karty.",
    "helper.tap_action": "Výchozí: otevřít detail entity.",
    "helper.title_color":
      "Volitelná RGB barva nadpisu. Když necháš prázdné, použije se barva tématu.",
    "helper.progress_enabled": "Zobrazuje vodorovný ukazatel pro číselný stav.",
    "helper.progress_full_card":
      "Rychlý režim: progress track zabere celou plochu karty pod texty.",
    "helper.progress_min": "Spodní hranice progress baru.",
    "helper.progress_max": "Horní hranice progress baru.",
    "helper.progress_value_position": "Hodnota může být uvnitř, nad, pod nebo skrytá.",
    "helper.progress_use_value_color_rules":
      "Když je zapnuto, progress bar použije barvu progress z aktivního pravidla; jinak použije Barvu výplně.",
    "helper.progress_inside_text_color_mode":
      "Automatická volí světlou/tmavou barvu podle výplně progress baru.",
    "helper.title_overflow_mode": "Odřádkování nebo automatické zmenšení velikosti nadpisu.",
    "helper.value_overflow_mode": "Odřádkování nebo automatické zmenšení velikosti hodnoty.",
    "helper.title_min_scale": "Např. 0.55 znamená minimálně 55 % původní velikosti.",
    "helper.value_min_scale": "Např. 0.55 znamená minimálně 55 % původní velikosti.",
    "helper.value_coloring_enabled":
      "Zapíná se automaticky, pokud je zadané aspoň jedno pravidlo. Vyhrává pravidlo s nejbližší hranicí (přesná shoda má přednost).",
    "helper.rules":
      "Číselné pravidlo porovnává číslo (>, >=, <, <=, =, !=). Textová hodnota (např. open) funguje s = a !=.",
  },

  en: {
    "error.no_config": "The card configuration is required.",
    "error.no_entity": "Set an entity or a static value text.",
    "error.no_entity_editor": "Set an entity, or enter a static value text for entity-less mode.",
    "card.default_name": "Value",
    "card.not_found": "Not found",
    "card.picker_name": "Entity - customizable",
    "card.picker_description":
      "Entity card with customizable fonts, layout and element positions.",

    "default.prefix": "Default",
    "default.on": "On",
    "default.off": "Off",

    "pos.top_left": "Top left",
    "pos.top_center": "Top center",
    "pos.top_right": "Top right",
    "pos.center_left": "Center left",
    "pos.center": "Center",
    "pos.center_right": "Center right",
    "pos.bottom_left": "Bottom left",
    "pos.bottom_center": "Bottom center",
    "pos.bottom_right": "Bottom right",
    "ppos.inside": "Inside",
    "ppos.above": "Above",
    "ppos.below": "Below",
    "ppos.hidden": "Hide value",
    "itc.auto": "Automatic",
    "itc.custom": "Custom",
    "ovf.wrap": "Wrap",
    "ovf.shrink": "Auto shrink",

    "section.value_section": "Value",
    "section.progress_section": "Progress bar",
    "section.progress_advanced_section": "Progress bar - advanced",
    "section.actions_section": "Actions",
    "section.value_coloring_section": "Value color",
    "section.typography": "Typography",
    "section.spacing": "Spacing",

    "rule.operator": "Operator",
    "rule.value": "Value (number or text)",
    "rule.color": "Value color",
    "rule.progress_color": "Progress color",
    "rule.progress_value_color": "Progress text color",

    "label.entity": "Entity",
    "label.attribute": "Attribute",
    "label.name": "Custom title",
    "label.unit": "Custom unit",
    "label.static_value_text": "Static value text",
    "label.show_icon": "Show icon",
    "label.show_title": "Show title",
    "label.state_color": "Icon color by state",
    "label.icon": "Icon",
    "label.title_position": "Title position",
    "label.value_position": "Value position",
    "label.icon_position": "Icon position",
    "label.tap_action": "Tap action",
    "label.hold_action": "Hold action",
    "label.double_tap_action": "Double tap action",
    "label.round_value": "Round number",
    "label.round_decimals": "Decimal places",
    "label.progress_enabled": "Enable progress bar",
    "label.progress_full_card": "Progress across the whole card",
    "label.progress_min": "Minimum",
    "label.progress_max": "Maximum",
    "label.progress_length_value": "Length",
    "label.progress_thickness_value": "Thickness",
    "label.progress_radius_value": "Corner radius",
    "label.unit_suffix": "Unit",
    "label.progress_value_position": "Value position",
    "label.progress_use_value_color_rules": "Color from value rules",
    "label.progress_color": "Fill color",
    "label.progress_track_color": "Background color",
    "label.progress_inside_text_color_mode": "Inside text color",
    "label.progress_inside_text_color": "Custom text color",
    "label.title_overflow_mode": "Title when it does not fit",
    "label.value_overflow_mode": "Value when it does not fit",
    "label.title_min_scale": "Min. title scale",
    "label.value_min_scale": "Min. value scale",
    "label.value_coloring_enabled": "Enable value color rules",
    "label.rules": "Color rules",
    "label.title_font_size_value": "Title size",
    "label.title_font_weight": "Title weight",
    "label.title_color": "Title color",
    "label.value_font_size_value": "Value size",
    "label.value_font_weight": "Value weight",
    "label.unit_font_size_value": "Unit size",
    "label.unit_font_weight": "Unit weight",
    "label.icon_size_value": "Icon size",
    "label.padding_value": "Padding",
    "label.gap_value": "Gap",

    "helper.entity": "Optional. Without an entity the card shows the static value text (if set).",
    "helper.attribute":
      "Optional. Shows an entity attribute instead of its state (also used for rules and the progress bar).",
    "helper.name": "Leave empty to use the entity name.",
    "helper.unit":
      "Optional. Overrides the entity unit; attributes have no unit by default.",
    "helper.static_value_text":
      "Only used when no entity is set. Shown instead of the value.",
    "helper.round_decimals": "Only used when rounding is enabled.",
    "helper.icon": "Leave empty to use the entity icon.",
    "helper.title_position": "Sets where the title text sits in the card.",
    "helper.value_position": "Sets where the value and unit sit in the card.",
    "helper.icon_position": "Sets where the icon sits in the whole card area.",
    "helper.tap_action": "Default: open the entity more-info dialog.",
    "helper.title_color": "Optional RGB title color. Leave empty to use the theme color.",
    "helper.progress_enabled": "Shows a horizontal bar for numeric states.",
    "helper.progress_full_card":
      "Quick mode: the progress track fills the whole card area under the texts.",
    "helper.progress_min": "Lower bound of the progress bar.",
    "helper.progress_max": "Upper bound of the progress bar.",
    "helper.progress_value_position": "The value can be inside, above, below or hidden.",
    "helper.progress_use_value_color_rules":
      "When enabled, the progress bar uses the progress color of the matching rule; otherwise the Fill color.",
    "helper.progress_inside_text_color_mode":
      "Automatic picks a light/dark color based on the progress fill.",
    "helper.title_overflow_mode": "Wrap the title or automatically shrink it.",
    "helper.value_overflow_mode": "Wrap the value or automatically shrink it.",
    "helper.title_min_scale": "E.g. 0.55 means at least 55 % of the original size.",
    "helper.value_min_scale": "E.g. 0.55 means at least 55 % of the original size.",
    "helper.value_coloring_enabled":
      "Turns on automatically when at least one rule is set. The rule with the nearest threshold wins (an exact match takes priority).",
    "helper.rules":
      "A numeric rule compares the number (>, >=, <, <=, =, !=). A text value (e.g. open) works with = and !=.",
  },
};

/** "cs" for Czech, otherwise "en". Without a hass object it asks the <home-assistant> element. */
export function getLanguage(hass) {
  let language = hass?.locale?.language || hass?.language;
  if (!language && typeof document !== "undefined") {
    const ha = document.querySelector("home-assistant");
    language = ha?.hass?.locale?.language || ha?.hass?.language;
  }
  if (!language && typeof navigator !== "undefined") {
    language = navigator.language;
  }
  return String(language || "en").toLowerCase().startsWith("cs") ? "cs" : "en";
}

export function t(lang, key) {
  return MESSAGES[lang]?.[key] ?? MESSAGES.en[key] ?? key;
}

export function hasMessage(lang, key) {
  return Boolean(MESSAGES[lang]?.[key]);
}

export const MESSAGE_LANGUAGES = Object.keys(MESSAGES);
export function messageKeys(lang) {
  return Object.keys(MESSAGES[lang] || {});
}

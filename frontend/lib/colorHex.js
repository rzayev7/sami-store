/** Maps colour names (RU + EN) → hex for swatches. */
export const COLOR_HEX = {
  // Russian
  "белый": "#f8f6f2", "белая": "#f8f6f2", "белое": "#f8f6f2",
  "черный": "#1c1c1c", "чёрный": "#1c1c1c", "черная": "#1c1c1c", "чёрная": "#1c1c1c",
  "серый": "#9a9a9a", "серая": "#9a9a9a", "светло-серый": "#d0d0d0",
  "красный": "#d93030", "красная": "#d93030",
  "розовый": "#f2a0b4", "розовая": "#f2a0b4",
  "синий": "#2a5dc8", "синяя": "#2a5dc8", "темно-синий": "#102060", "тёмно-синий": "#102060",
  "голубой": "#6ab4dc", "голубая": "#6ab4dc",
  "зеленый": "#3a9858", "зелёный": "#3a9858", "зеленая": "#3a9858", "зелёная": "#3a9858",
  "желтый": "#e8c800", "жёлтый": "#e8c800",
  "оранжевый": "#e87020",
  "фиолетовый": "#7838b8",
  "коричневый": "#7a4830", "коричневая": "#7a4830",
  "бежевый": "#e0ceb0", "бежевая": "#e0ceb0",
  "кремовый": "#f0e8d0", "кремовая": "#f0e8d0",
  "молочный": "#f5f0e4", "молочная": "#f5f0e4",
  "айвори": "#f2ece0",
  "слоновая кость": "#f2ece0",
  "хаки": "#8a8840",
  "оливковый": "#7a8030", "оливковая": "#7a8030",
  "бордо": "#7a1828", "бордовый": "#7a1828", "бордовая": "#7a1828",
  "терракота": "#c06848", "терракотовый": "#c06848", "терракотовая": "#c06848",
  "мятный": "#80d4b8", "мятная": "#80d4b8",
  "пудровый": "#f0d0cc", "пудровая": "#f0d0cc", "пудра": "#f0d0cc",
  "лиловый": "#c8a0d0", "лиловая": "#c8a0d0",
  "сиреневый": "#b8a0d8", "сиреневая": "#b8a0d8",
  "горчичный": "#c8a020", "горчичная": "#c8a020",
  "шоколадный": "#502818", "шоколадная": "#502818",
  "темно-коричневый": "#3a2010", "тёмно-коричневый": "#3a2010", "темно-коричневая": "#3a2010",
  "карамельный": "#c08040", "кэмел": "#c89860", "верблюжий": "#c89860",
  "нюд": "#d8b090", "нюдовый": "#d8b090", "нюдовая": "#d8b090",
  "темно-синяя": "#102060", "темно-синее": "#102060",
  // English — longer phrases first via sorted keys at runtime
  "white": "#f8f6f2", "black": "#1c1c1c", "grey": "#9a9a9a", "gray": "#9a9a9a",
  "red": "#d93030", "pink": "#f2a0b4", "blue": "#2a5dc8", "light blue": "#6ab4dc",
  "green": "#3a9858", "yellow": "#e8c800", "orange": "#e87020", "purple": "#7838b8",
  "brown": "#7a4830", "beige": "#e0ceb0", "cream": "#f0e8d0", "ivory": "#f2ece0",
  "khaki": "#8a8840", "olive": "#7a8030", "burgundy": "#7a1828", "wine": "#7a1828",
  "terracotta": "#c06848", "mint": "#80d4b8", "navy": "#102060",
  "camel": "#c89860", "nude": "#d8b090", "blush": "#f5c0b8",
  "dusty rose": "#d89090", "lavender": "#c0a0d8", "lilac": "#c0a0d8",
  "mustard": "#c8a020", "chocolate": "#502818", "caramel": "#c08040",
  "sand": "#d8c8a0", "stone": "#c0b098", "taupe": "#a89880",
  "ecru": "#f0e8d0", "off-white": "#f5f0e8", "off white": "#f5f0e8",
  "charcoal": "#3c3c3c", "silver": "#c4c4c4", "gold": "#c8a050",
  "sage": "#8faa74", "emerald": "#2a7a50", "cobalt": "#1840a0",
  "dark brown": "#3a2010", "mauve": "#c09090", "dusty pink": "#dca09a",
  "forest green": "#2a5030", "midnight": "#101830", "dark navy": "#0c1428",
  "navy blue": "#102060", "dark blue": "#102060", "royal blue": "#2050c0",
  "baby blue": "#a0c8e8", "sky blue": "#6ab4dc", "light pink": "#f8c8d4",
  "hot pink": "#e04880", "pastel pink": "#f5c0c8", "rose": "#e08090",
  "dark red": "#8a1020", "dark green": "#1a4828", "light green": "#80c890",
  "pale yellow": "#f5e898", "dark grey": "#585858", "dark gray": "#585858",
  "light grey": "#d0d0d0", "light gray": "#d0d0d0",
  "warm white": "#f8f4ec", "pure white": "#ffffff", "snow white": "#f8f8f8",
  "тёмно синий": "#102060", "темно синий": "#102060",
  "светло бежевый": "#f0e8d8", "светло розовый": "#f8c8d4",
};

const COLOR_KEYS_LONGEST_FIRST = Object.keys(COLOR_HEX).sort((a, b) => b.length - a.length);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match colour phrase as a whole token, not inside another word (e.g. "red" in "embroidered"). */
function colorPhraseRegex(mapKey) {
  const escaped = escapeRegex(mapKey).replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|[\\s\\-_/,])${escaped}(?:[\\s\\-_/,]|$)`, "i");
}

/**
 * Resolve a display name or tag to a hex swatch colour.
 * Product titles like "Navy Blue Linen Maxi Dress" → #102060
 */
export function resolveColorHex(name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];

  // Titles usually start with the colour: "Dark Brown Linen..."
  for (const mapKey of COLOR_KEYS_LONGEST_FIRST) {
    if (key.startsWith(mapKey)) return COLOR_HEX[mapKey];
  }

  // Whole-phrase match anywhere in the string (longest keys first)
  for (const mapKey of COLOR_KEYS_LONGEST_FIRST) {
    if (colorPhraseRegex(mapKey).test(key)) return COLOR_HEX[mapKey];
  }

  return null;
}

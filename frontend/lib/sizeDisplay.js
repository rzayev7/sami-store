/** Canonical size for filters (groups synonyms that share one label). */
export function normalizeSizeForFilter(size) {
  if (size == null || size === "") return "";
  const s = String(size).trim();
  if (s === "Свободный" || /^free\s*size$/i.test(s)) return "free size";
  return s;
}

/** Human-readable size for UI; keeps cart/API values unchanged. */
export function formatSizeLabel(size) {
  if (size == null || size === "") return size;
  return size === "Свободный" ? "free size" : size;
}

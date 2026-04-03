/** Human-readable size for UI; keeps cart/API values unchanged. */
export function formatSizeLabel(size) {
  if (size == null || size === "") return size;
  return size === "Свободный" ? "free size" : size;
}

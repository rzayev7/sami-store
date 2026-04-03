export function normalizeVideoAdjustments(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const toPercent = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 100;
    return Math.max(60, Math.min(140, Math.round(n)));
  };

  return {
    brightness: toPercent(source.brightness),
    contrast: toPercent(source.contrast),
    saturation: toPercent(source.saturation),
  };
}

export function videoFilterStyle(raw) {
  const { brightness, contrast, saturation } = normalizeVideoAdjustments(raw);
  return {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };
}

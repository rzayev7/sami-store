const CLOUDINARY_HOST_PATTERN = /(^|\.)cloudinary\.com$/i;
const IMAGE_PRESETS = {
  cart: { width: 240, quality: "auto:good", fit: "limit" },
  thumb: { width: 320, quality: "auto:good", fit: "limit" },
  listing: { width: 900, quality: "auto:good", fit: "limit" },
  product: { width: 1600, quality: "auto:best", fit: "limit" },
  zoom: { width: 2200, quality: "auto:best", fit: "limit" },
};

export function isCloudinaryUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return false;

  try {
    const parsed = new URL(url);
    return CLOUDINARY_HOST_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function cloudinaryOptimizedUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) return url;

  const preset = options.preset ? IMAGE_PRESETS[options.preset] : null;
  const width = Number(options.width ?? preset?.width);
  const requestedQuality = options.quality ?? preset?.quality ?? "auto:good";
  const fitMode = options.fit ?? preset?.fit ?? "limit";

  const transformationParts = ["f_auto", `q_${requestedQuality}`, "dpr_auto"];

  if (Number.isFinite(width) && width > 0) {
    transformationParts.push(`w_${Math.round(width)}`);
    transformationParts.push(`c_${fitMode}`);
  }

  const uploadMarker = "/upload/";
  if (!url.includes(uploadMarker)) return url;

  return url.replace(uploadMarker, `${uploadMarker}${transformationParts.join(",")}/`);
}

export const imagePresets = IMAGE_PRESETS;

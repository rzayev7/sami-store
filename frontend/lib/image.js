const CLOUDINARY_HOST_PATTERN = /(^|\.)cloudinary\.com$/i;

/**
 * Delivery presets — widths are chosen so the largest realistic viewport
 * at 2× retina is covered without over-serving pixels.
 *
 * Rule of thumb used here:
 *   preset width ≈ largest CSS display width × 2 (for retina)
 *
 * dpr_auto is intentionally omitted: it only works when the Cloudinary
 * JavaScript SDK is present on the page. In static delivery URLs it has
 * no effect (resolves to dpr_1.0), so we bake in 2× retina sizing instead.
 */
const IMAGE_PRESETS = {
  // 80px cart/admin thumbnail → 160px covers 2× retina
  cart:    { width: 160,  quality: "auto:good", fit: "limit" },

  // 86–100px gallery strip thumbnail → 200px covers 2× retina
  thumb:   { width: 200,  quality: "auto:good", fit: "limit" },

  // ≤120px admin table/picker thumbnails — not customer-facing
  admin:   { width: 120,  quality: "auto:eco",  fit: "limit" },

  // Catalog grid cards: 25vw–50vw; 360px desktop 2× = 720px → 700 is the sweet spot
  // Was 900 — ~23% file-size saving at no visible quality loss
  listing: { width: 700,  quality: "auto:good", fit: "limit" },

  // Product detail main gallery: ~600px container × 2 DPR = 1200px
  // Was 1600 — ~44% file-size saving
  product: { width: 1200, quality: "auto:best", fit: "limit" },

  // Explicit zoom / lightbox — still large but capped at 1800
  // Was 2200
  zoom:    { width: 1800, quality: "auto:best", fit: "limit" },
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

/**
 * Inject Cloudinary delivery transformations into a raw upload URL.
 *
 * Always adds:  f_auto  q_<quality>  [w_<width>  c_<fit>]
 *
 * Transformations are inserted immediately after /upload/ so they compose
 * correctly with any existing path-based transformations (e.g. named presets
 * like t_hero that Cloudinary resolves server-side).
 */
export function cloudinaryOptimizedUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) return url;

  const preset  = options.preset ? IMAGE_PRESETS[options.preset] : null;
  const width   = Number(options.width ?? preset?.width);
  const quality = options.quality ?? preset?.quality ?? "auto:good";
  const fit     = options.fit     ?? preset?.fit     ?? "limit";

  const parts = ["f_auto", `q_${quality}`];

  if (Number.isFinite(width) && width > 0) {
    parts.push(`w_${Math.round(width)}`, `c_${fit}`);
  }

  const marker = "/upload/";
  if (!url.includes(marker)) return url;

  return url.replace(marker, `${marker}${parts.join(",")}/`);
}

export const imagePresets = IMAGE_PRESETS;

/**
 * next/image-compatible loader for Cloudinary assets.
 *
 * Unlike baking a single fixed width into the URL (what `cloudinaryOptimizedUrl`
 * does), this lets next/image request the asset at each candidate device width
 * and emit a real `srcset`. Combined with a correct `sizes` attribute, mobile
 * devices download a small file instead of the desktop-sized one.
 *
 * Non-Cloudinary `src` (placehold.co, local /public files) is returned unchanged.
 * Existing transform segments (e.g. named presets like t_a) are preserved by
 * chaining our transform in front of them.
 *
 * @param {{ src: string, width: number, quality?: number }} args
 */
export function cloudinaryLoader({ src, width, quality }) {
  if (!isCloudinaryUrl(src)) return src;

  const marker = "/upload/";
  if (!src.includes(marker)) return src;

  const q =
    Number.isFinite(Number(quality)) && Number(quality) > 0
      ? `q_${Math.round(Number(quality))}`
      : "q_auto:good";

  const parts = ["f_auto", q, `w_${Math.round(width)}`, "c_limit"];
  return src.replace(marker, `${marker}${parts.join(",")}/`);
}

/**
 * Build a Cloudinary still-frame poster (.jpg of the first frame) for a raw
 * video URL, so a <video> can show an instant thumbnail without downloading
 * any video bytes until the user presses play.
 *
 *   /video/upload/<id>.mp4 → /video/upload/so_0,f_auto,q_auto:good,w_<n>,c_limit/<id>.jpg
 */
export function getCloudinaryPoster(url, options = {}) {
  if (!isCloudinaryUrl(url)) return undefined;

  const marker = "/upload/";
  if (!url.includes(marker)) return undefined;

  const width = Number(options.width ?? 720);
  const parts = ["so_0", "f_auto", "q_auto:good", `w_${Math.round(width)}`, "c_limit"];

  let out = url.replace(marker, `${marker}${parts.join(",")}/`);
  // Swap the video extension for .jpg (preserve any query string).
  if (/\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?$/i.test(out)) {
    out = out.replace(/\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?$/i, ".jpg$2");
  } else if (!/\.jpe?g(\?|$)/i.test(out)) {
    out = out.replace(/(\?.*)?$/, ".jpg$1");
  }
  return out;
}

const VIDEO_DEFAULTS = {
  // Card hover clips render in small grid slots (≤~320px on desktop, where hover
  // even exists); 400 covers 2× retina for a 200px slot. The product-detail
  // player passes its own larger width. Either way we never approach 1080p.
  width: 400,
  quality: "auto:good",
  fit: "limit",
};

/**
 * Inject Cloudinary delivery transformations into a raw Cloudinary video URL.
 *
 * Typical Cloudinary video URL shape:
 *   https://res.cloudinary.com/<cloud>/video/upload/<optional-transforms>/v<version>/<public_id>.<ext>
 *
 * We only inject transforms when the URL does not already have a transforms segment
 * (i.e. the segment after `/upload/` starts with `v<digits>`).
 */
export function getCloudinaryVideoUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) return url;

  const marker = "/upload/";
  if (!url.includes(marker)) return url;

  const afterUpload = url.split(marker)[1] || "";
  const firstSegment = afterUpload.split("/")[0] || "";
  const alreadyHasTransforms = firstSegment && !/^v\d+$/i.test(firstSegment) && !/^v\d+/.test(firstSegment);
  // If the first segment is a version (v123...), we treat it as "no transforms present".
  if (alreadyHasTransforms) return url;

  const width = Number(options.width ?? VIDEO_DEFAULTS.width);
  const quality = String(options.quality ?? VIDEO_DEFAULTS.quality);
  const fit = String(options.fit ?? VIDEO_DEFAULTS.fit);

  // vc_auto → H.265/HEVC on Safari, VP9 on Chrome/Firefox, H.264 fallback.
  // Reduces video file size by ~30–40% at equal perceptual quality.
  const parts = [`w_${Math.round(width)}`, `c_${fit}`, `q_${quality}`, "f_auto", "vc_auto"];
  return url.replace(marker, `${marker}${parts.join(",")}/`);
}

const {
  fetchImageAsBase64Limited,
  sniffImageMime,
  DEFAULT_MAX_BYTES,
} = require("../utils/safeImageFetch");

const SYSTEM_PROMPT = `You are a fashion product copywriter for SAMÍ, a luxury womenswear brand from Baku. Analyze the clothing item in the image and return JSON only with these fields:
{
  "title": "short product name (e.g. 'Linen Cotton Lace Detail Set')",
  "description": "2-3 sentence elegant product description focusing on fabric, silhouette, and occasion",
  "fabricCare": "one short line: primary fabric composition if you can infer it (e.g. 'Linen blend'); if composition is unclear, give one practical care line (e.g. 'Dry clean recommended'). Use empty string \"\" only if neither is inferable."
}
Be concise, elegant, and consistent with luxury fashion tone.`;

const USER_TEXT =
  "Analyze this product photo. Respond with JSON only (no markdown fences), keys: title, description, fabricCare.";

const ANTHROPIC_TIMEOUT_MS = 120_000;

/**
 * Existing product images may be stored as site-relative paths. The API must fetch absolute URLs.
 * @returns {{ ok: true, url: string } | { ok: false, message: string }}
 */
function resolveImageUrlInput(urlString) {
  const s = String(urlString || "").trim();
  if (!s) return { ok: false, message: "Empty image URL" };
  if (/^https?:\/\//i.test(s)) return { ok: true, url: s };
  const base =
    (process.env.FRONTEND_URL && String(process.env.FRONTEND_URL).trim()) ||
    (process.env.PUBLIC_SITE_URL && String(process.env.PUBLIC_SITE_URL).trim()) ||
    "";
  if (!base) {
    return {
      ok: false,
      message:
        "Image URL is relative; set FRONTEND_URL (or PUBLIC_SITE_URL) on the API server to resolve it.",
    };
  }
  try {
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    return { ok: true, url: new URL(s, normalizedBase).href };
  } catch {
    return { ok: false, message: "Invalid image URL" };
  }
}

/** Strip noise; extract first JSON object; tolerate trailing commas in objects (best-effort). */
function parseModelJson(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Empty model response");

  let candidate = raw;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1].trim();

  const start = candidate.indexOf("{");
  if (start < 0) throw new Error("No JSON object in model response");

  let slice = candidate.slice(start);
  const end = slice.lastIndexOf("}");
  if (end <= 0) throw new Error("No JSON object in model response");
  slice = slice.slice(0, end + 1);

  let parsed;
  try {
    parsed = JSON.parse(slice);
  } catch {
    const relaxed = slice.replace(/,\s*([}\]])/g, "$1");
    try {
      parsed = JSON.parse(relaxed);
    } catch {
      const second = candidate.indexOf("{", start + 1);
      if (second > start) {
        const sub = candidate.slice(second);
        const e2 = sub.lastIndexOf("}");
        if (e2 > 0) {
          try {
            parsed = JSON.parse(sub.slice(0, e2 + 1));
          } catch {
            throw new Error("Could not parse model JSON");
          }
        } else {
          throw new Error("Could not parse model JSON");
        }
      } else {
        throw new Error("Could not parse model JSON");
      }
    }
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Model JSON must be an object");
  }

  return {
    title: String(parsed.title ?? "").trim(),
    description: String(parsed.description ?? "").trim(),
    fabricCare: String(parsed.fabricCare ?? "").trim(),
  };
}

function looksLikeBase64(s) {
  const t = String(s).replace(/\s/g, "");
  if (t.length < 32) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(t);
}

function decodedBase64Length(b64) {
  const t = String(b64).replace(/\s/g, "");
  try {
    return Buffer.from(t, "base64").length;
  } catch {
    return -1;
  }
}

/**
 * POST /api/admin/ai-product-fill
 * Body: { imageBase64?: string, mediaType?: string, imageUrl?: string }
 * One of imageBase64 or imageUrl is required.
 */
const aiProductFill = async (req, res) => {
  const logCtx = { source: "none", model: null, imageBytes: null };

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !String(apiKey).trim()) {
      return res.status(500).json({
        message: "ANTHROPIC_API_KEY is not configured on the server",
      });
    }

    const model =
      (process.env.ANTHROPIC_MODEL && String(process.env.ANTHROPIC_MODEL).trim()) ||
      "claude-3-5-sonnet-20241022";
    logCtx.model = model;

    const { imageBase64, mediaType, imageUrl } = req.body || {};
    let base64 = typeof imageBase64 === "string" ? imageBase64.trim() : "";
    let mime = typeof mediaType === "string" ? mediaType.trim() : "";

    if (base64.includes(",")) {
      const parts = base64.split(",");
      const header = parts[0];
      base64 = parts.slice(1).join(",");
      const m = header.match(/data:([^;]+)/);
      if (m) mime = m[1];
    }

    if (!base64 && imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
      logCtx.source = "imageUrl";
      const resolvedUrl = resolveImageUrlInput(imageUrl);
      if (!resolvedUrl.ok) {
        return res.status(400).json({ message: resolvedUrl.message });
      }
      try {
        const out = await fetchImageAsBase64Limited(resolvedUrl.url, {
          maxBytes: DEFAULT_MAX_BYTES,
        });
        base64 = out.base64;
        mime = out.mime;
        logCtx.imageBytes = out.byteLength;
      } catch (e) {
        return res.status(400).json({
          message: e?.message || "Could not load image from URL",
        });
      }
    } else if (base64) {
      logCtx.source = "imageBase64";
    }

    if (!base64) {
      return res.status(400).json({
        message: "Provide imageBase64 or imageUrl",
      });
    }

    if (!looksLikeBase64(base64)) {
      return res.status(400).json({
        message: "imageBase64 does not look like valid base64 data",
      });
    }

    const binLen = decodedBase64Length(base64);
    if (binLen < 0) {
      return res.status(400).json({ message: "Invalid base64 image data" });
    }
    if (binLen > DEFAULT_MAX_BYTES) {
      return res.status(400).json({
        message: "Image is too large for AI (max ~5 MB). Use a smaller photo or compress before upload.",
      });
    }

    const rawBuf = Buffer.from(String(base64).replace(/\s/g, ""), "base64");
    const sniffed = sniffImageMime(rawBuf);
    if (!sniffed) {
      return res.status(400).json({
        message: "Image must be JPEG, PNG, or WebP",
      });
    }
    mime = sniffed;

    if (!logCtx.imageBytes) logCtx.imageBytes = binLen;

    const anthropicController = new AbortController();
    const anthropicTimer = setTimeout(() => anthropicController.abort(), ANTHROPIC_TIMEOUT_MS);

    let anthropicRes;
    try {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: anthropicController.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          temperature: 0.2,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mime,
                    data: base64.replace(/\s/g, ""),
                  },
                },
                { type: "text", text: USER_TEXT },
              ],
            },
          ],
        }),
      });
    } catch (fetchErr) {
      console.error("[ai-product-fill] fetch to Anthropic failed", fetchErr);
      const aborted = fetchErr?.name === "AbortError";
      return res.status(502).json({
        message: aborted
          ? "Anthropic API request timed out"
          : fetchErr?.message ||
            "Could not reach Anthropic API (network). Check server Node version (18+) and outbound HTTPS.",
        code: aborted ? "ANTHROPIC_TIMEOUT" : "ANTHROPIC_FETCH_FAILED",
      });
    } finally {
      clearTimeout(anthropicTimer);
    }

    const rawJson = await anthropicRes.text();
    if (!anthropicRes.ok) {
      let detail = rawJson;
      try {
        const err = JSON.parse(rawJson);
        detail = err?.error?.message || err?.message || rawJson;
      } catch {
        /* keep text */
      }
      const clientStatus = anthropicRes.status >= 500 ? 502 : 400;
      console.warn("[ai-product-fill] Anthropic error", {
        ...logCtx,
        anthropicStatus: anthropicRes.status,
      });
      return res.status(clientStatus).json({
        message: detail || "Anthropic API error",
        anthropicStatus: anthropicRes.status,
      });
    }

    let data;
    try {
      data = JSON.parse(rawJson);
    } catch (e) {
      return res.status(502).json({
        message: "Invalid JSON from Anthropic (unexpected response shape)",
      });
    }

    const textBlock = data?.content?.find((b) => b.type === "text");
    const text = textBlock?.text || "";
    let fields;
    try {
      fields = parseModelJson(text);
    } catch (e) {
      console.warn("[ai-product-fill] parse model output failed", {
        ...logCtx,
        err: e?.message,
      });
      return res.status(502).json({
        message: e?.message || "Model returned content in an unexpected format",
        code: "MODEL_PARSE_FAILED",
      });
    }

    if (!fields.title || !fields.description) {
      return res.status(422).json({
        message:
          "Model returned empty title or description. Try again or edit fields manually.",
        code: "MODEL_EMPTY_FIELDS",
      });
    }

    console.info("[ai-product-fill] ok", {
      ...logCtx,
      titleLen: fields.title.length,
      descLen: fields.description.length,
      fabricLen: fields.fabricCare.length,
    });

    return res.status(200).json(fields);
  } catch (err) {
    console.error("[ai-product-fill] unexpected error", err);
    if (res.headersSent) return;
    return res.status(500).json({
      message:
        err?.message ||
        String(err) ||
        "Unexpected error while generating product copy",
      code: "AI_FILL_ERROR",
    });
  }
};

module.exports = { aiProductFill };

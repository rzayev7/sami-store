const dns = require("dns").promises;
const net = require("net");
const { URL } = require("url");

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

/** Hostnames that must never be fetched (SSRF / internal probes). */
const BLOCKED_HOSTNAMES = new Set(
  [
    "localhost",
    "metadata.google.internal",
    "metadata",
    "metadata.google",
  ].map((h) => h.toLowerCase()),
);

/**
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateOrBlockedIp(ip) {
  if (!ip || typeof ip !== "string") return true;
  const v = net.isIP(ip);
  if (v === 4) {
    if (ip === "127.0.0.1" || ip === "0.0.0.0") return true;
    if (ip.startsWith("10.")) return true;
    if (ip.startsWith("192.168.")) return true;
    if (ip.startsWith("169.254.")) return true;
    const parts = ip.split(".").map((x) => parseInt(x, 10));
    if (parts.length === 4 && parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) {
      return true;
    }
    if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const v4 = lower.slice(7);
      if (net.isIP(v4) === 4) return isPrivateOrBlockedIp(v4);
    }
    return false;
  }
  return true;
}

/**
 * Optional comma-separated list in env, e.g. `res.cloudinary.com,*.cloudinary.com`
 * If set, hostname must match at least one entry (* prefix = suffix match).
 */
function hostMatchesAllowlist(hostname, allowlistRaw) {
  const raw = String(allowlistRaw || "").trim();
  if (!raw) return true;
  const h = hostname.toLowerCase();
  const entries = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const entry of entries) {
    if (entry.startsWith("*.")) {
      const suffix = entry.slice(1);
      if (h === entry.slice(2) || h.endsWith(suffix)) return true;
    } else if (h === entry) return true;
  }
  return false;
}

/**
 * @param {string} urlString
 * @param {{ allowlist?: string }} [opts]
 * @returns {Promise<URL>}
 */
async function assertSafeImageUrl(urlString, opts = {}) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error("Invalid image URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Image URL must use http or https");
  }

  if (parsed.protocol === "http:" && process.env.NODE_ENV === "production") {
    throw new Error("Image URL must use HTTPS in production");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Image URL host is not allowed");
  }

  const allowlist = opts.allowlist ?? process.env.AI_IMAGE_URL_ALLOWLIST;
  if (!hostMatchesAllowlist(hostname, allowlist)) {
    throw new Error("Image URL host is not on the allowlist (set AI_IMAGE_URL_ALLOWLIST if needed)");
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrBlockedIp(hostname)) {
      throw new Error("Image URL must not point to a private or loopback address");
    }
    return parsed;
  }

  let results;
  try {
    results = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch (e) {
    throw new Error(`Could not resolve image host: ${e?.message || "DNS error"}`);
  }

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Could not resolve image host");
  }

  for (const r of results) {
    if (isPrivateOrBlockedIp(r.address)) {
      throw new Error("Image URL resolves to a private or blocked address");
    }
  }

  return parsed;
}

/**
 * Sniff JPEG / PNG / WebP from magic bytes.
 * @param {Buffer} buf
 * @returns {string | null} mime
 */
function sniffImageMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Download image with timeout, no redirect follow (SSRF), size cap, MIME sniff.
 * @param {string} urlString
 * @param {{ maxBytes?: number, timeoutMs?: number }} [opts]
 * @returns {Promise<{ base64: string, mime: string, byteLength: number }>}
 */
async function fetchImageAsBase64Limited(urlString, opts = {}) {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = opts.timeoutMs ?? FETCH_TIMEOUT_MS;

  await assertSafeImageUrl(urlString);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(urlString, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.1",
      },
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      throw new Error("Image download timed out");
    }
    throw new Error(e?.message || "Image download failed");
  } finally {
    clearTimeout(timer);
  }

  if (res.status >= 300 && res.status < 400) {
    throw new Error("Redirects are not allowed for image URLs (SSRF protection)");
  }

  if (!res.ok) {
    throw new Error(`Could not download image (HTTP ${res.status})`);
  }

  const cl = res.headers.get("content-length");
  if (cl) {
    const n = parseInt(cl, 10);
    if (Number.isFinite(n) && n > maxBytes) {
      throw new Error("Image is too large (Content-Length)");
    }
  }

  const ctHeader = res.headers.get("content-type");
  const headerMime = ctHeader ? ctHeader.split(";")[0].trim().toLowerCase() : "";
  if (headerMime && ALLOWED_MIMES.has(headerMime) === false && headerMime.startsWith("image/")) {
    throw new Error(`Unsupported image Content-Type: ${headerMime}`);
  }

  if (!res.body) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) throw new Error("Image is too large");
    const sniffed = sniffImageMime(buf);
    if (!sniffed) throw new Error("File is not a valid JPEG, PNG, or WebP image");
    return {
      base64: buf.toString("base64"),
      mime: sniffed,
      byteLength: buf.length,
    };
  }

  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.length;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Image is too large while downloading");
      }
      chunks.push(Buffer.from(value));
    }
  } catch (e) {
    await reader.cancel().catch(() => {});
    throw e;
  }

  const buf = Buffer.concat(chunks);
  const sniffed = sniffImageMime(buf);
  if (!sniffed) {
    throw new Error("File is not a valid JPEG, PNG, or WebP image");
  }
  if (headerMime && ALLOWED_MIMES.has(headerMime) && sniffed !== headerMime) {
    throw new Error("Content-Type does not match image data");
  }

  return {
    base64: buf.toString("base64"),
    mime: sniffed,
    byteLength: buf.length,
  };
}

module.exports = {
  assertSafeImageUrl,
  fetchImageAsBase64Limited,
  sniffImageMime,
  isPrivateOrBlockedIp,
  DEFAULT_MAX_BYTES,
  FETCH_TIMEOUT_MS,
  ALLOWED_MIMES,
};

const ADMIN_TOKEN_KEY = "adminToken";

function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isAdminTokenExpired(token) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (!exp || typeof exp !== "number") {
    // If we can't read exp, treat as non-expired to avoid surprise logouts.
    // Backend will still reject invalid/expired tokens via 401.
    return false;
  }
  return Date.now() >= exp * 1000;
}

export function getAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function checkAdminAuth() {
  const token = getAdminToken();
  if (!token) return false;
  if (isAdminTokenExpired(token)) {
    clearAdminAuth();
    return false;
  }
  return true;
}

export function getAdminAuthHeaders() {
  const token = getAdminToken();
  if (token && isAdminTokenExpired(token)) {
    clearAdminAuth();
    return {};
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearAdminAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

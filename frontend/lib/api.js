import axios from "axios";
import { clearAdminAuth, getAdminToken } from "./adminAuth";

/**
 * Production API fallback when NEXT_PUBLIC_API_URL is missing on Vercel
 * (build-time env not set → client requests would otherwise hit relative /api only).
 */
export const getApiBaseURL = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, "");
  }
  return "https://sami-store.onrender.com";
};

const api = axios.create({
  baseURL: getApiBaseURL(),
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug("[api] request", config.method?.toUpperCase(), (config.baseURL || "") + (config.url || ""));
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.debug("[api] response", response.status, response.config?.url, Array.isArray(response.data) ? `array(${response.data?.length})` : typeof response.data);
    }
    return response;
  },
  (error) => {
    if (typeof window !== "undefined") {
      const url = error?.config?.baseURL + (error?.config?.url || "");
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error("[api] error", { url, status, message: error?.message, data });
    }
    try {
      const status = error?.response?.status;
      const hasAdminToken = Boolean(getAdminToken());

      if ((status === 401 || status === 403) && typeof window !== "undefined" && hasAdminToken) {
        clearAdminAuth();
        if (!window.location.pathname.startsWith("/admin/login")) {
          window.location.assign("/admin/login");
        }
      }
    } catch {
      // ignore
    }

    return Promise.reject(error);
  }
);

export default api;

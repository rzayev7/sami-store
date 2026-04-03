import axios from "axios";
import { clearAdminAuth, getAdminToken } from "./adminAuth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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

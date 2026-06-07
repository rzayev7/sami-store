import { getAdminAuthHeaders } from "./adminAuth";

export async function revalidateStoreAfterProductChange(productId) {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        ...getAdminAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: productId ? String(productId) : "",
      }),
    });
  } catch {
    // Non-blocking: client-side listings still refresh from the API.
  }
}

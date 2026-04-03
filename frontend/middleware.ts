// Middleware is currently a no-op to avoid interfering with
// client-side admin auth / redirects handled by AdminLayout
// and AdminGuard. Server-side protections are enforced on the
// backend API routes.
export function middleware() {
  return;
}

export const config = {
  matcher: [],
};



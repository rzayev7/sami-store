"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function GoogleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always render the provider so useGoogleLogin hook is always in context.
  // The button is hidden in AuthModal when clientId is empty.
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

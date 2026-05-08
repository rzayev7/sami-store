export default function AccessRestrictedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render fullscreen — no navbar, footer, or cart drawer.
  return <>{children}</>;
}

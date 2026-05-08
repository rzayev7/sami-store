/**
 * Internal endpoint only reachable via middleware rewrite for geo-blocked visitors.
 * Deliberately generic: no store branding, resembles a plain 404.
 */
export default function RegionBlockGhost404() {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 text-center text-[#333]">
      <p className="font-mono text-[11px] font-medium tracking-[0.25em] text-[#888]">
        ERROR 404
      </p>
      <h1 className="mt-4 text-[1.65rem] font-semibold tracking-tight text-[#1a1a1a] sm:text-[2rem]">
        Page Not Found
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[#666] sm:text-[15px]">
        The page you are looking for does not exist or may have been removed.
      </p>
      <p className="mt-10 text-[12px] text-[#aaa]">
        {/* Intentionally no links or brand */}
        If you typed the URL directly, please check the address and try again.
      </p>
    </div>
  );
}

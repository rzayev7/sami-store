"use client";

import { usePathname } from "next/navigation";

const MSG = "Hi SAMÍ, I have a question about an order.";

function waHref(digits) {
  const enc = encodeURIComponent(MSG);
  return `https://wa.me/${digits}?text=${enc}`;
}

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const digits = String(raw).replace(/\D/g, "");

  if (pathname?.startsWith("/admin")) return null;
  if (!digits) return null;

  return (
    <a
      href={waHref(digits)}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-enter fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/15 md:hidden"
      style={{ backgroundColor: "#25D366" }}
      aria-label="Chat on WhatsApp"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          fill="white"
          d="M20.52 3.48A10.06 10.06 0 0 0 12.06 0C5.93 0 1 4.93 1 11.06c0 1.95.51 3.85 1.48 5.54L0 24l7.55-1.98a10.9 10.9 0 0 0 5.5 1.5h.01c6.13 0 11.06-4.93 11.06-11.06 0-2.95-1.15-5.73-3.6-7.98ZM12.07 20.1h-.01a8.9 8.9 0 0 1-4.54-1.24l-.33-.2-4.12 1.08 1.1-4.01-.21-.34a8.86 8.86 0 0 1-1.36-4.73c0-4.92 4-8.92 8.93-8.92 2.39 0 4.63.93 6.31 2.61a8.86 8.86 0 0 1 2.61 6.31c0 4.93-4 8.93-8.94 8.93Zm4.9-6.8c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.52-.45-.45-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.34.98 2.64 1.12 2.82.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32Z"
        />
      </svg>
    </a>
  );
}

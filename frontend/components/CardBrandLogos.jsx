/** Compact Visa + Mastercard marks for checkout (informational display). */
export function VisaMark({ className = "h-8 w-[3.25rem] shrink-0" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 52 32"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="52" height="32" rx="5" fill="#1434CB" />
      <text
        x="26"
        y="21"
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        fontWeight="700"
        letterSpacing="0.06em"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardMark({ className = "h-8 w-[3.25rem] shrink-0" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 52 32"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="52" height="32" rx="5" fill="#fff" stroke="#e8e4df" strokeWidth="1" />
      <circle cx="21" cy="16" r="9" fill="#EB001B" />
      <circle cx="31" cy="16" r="9" fill="#F79E1B" fillOpacity="0.95" />
      <path
        fill="#FF5F00"
        d="M26 10.5c2.1 1.4 3.3 3.7 3.3 5.5s-1.2 4.1-3.3 5.5c-2.1-1.4-3.3-3.7-3.3-5.5s1.2-4.1 3.3-5.5z"
      />
    </svg>
  );
}

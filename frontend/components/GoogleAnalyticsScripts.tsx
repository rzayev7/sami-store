import Script from "next/script";
import { GA_MEASUREMENT_ID } from "../lib/gtag";

export default function GoogleAnalyticsScripts() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);};
          window.gtag('js', new Date());
          window.gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: true,
            page_path: window.location.pathname + window.location.search,
            page_title: document.title,
            page_location: window.location.href
          });
        `}
      </Script>
    </>
  );
}

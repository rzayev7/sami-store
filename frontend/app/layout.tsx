import type { Metadata } from "next";
import { Cinzel, Inter, Noto_Sans_Arabic } from "next/font/google";
import AnnouncementBars from "../components/AnnouncementBars";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import AuthModal from "../components/AuthModal";
import { CartProvider } from "../context/CartContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SAMÍ",
  description: "Womenswear from Baku. Worn everywhere.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest?v=2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${cinzel.variable} ${notoArabic.variable} antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                <div className="min-h-screen w-full bg-[var(--color-cream)] text-[var(--color-black)]">
                  <Navbar />
                  <AnnouncementBars />
                  <CartDrawer />
                  <AuthModal />
                  <main className="w-full py-6 sm:py-8">
                    <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-12">
                      {children}
                    </div>
                  </main>
                  <Footer />
                  <WhatsAppFloat />
                </div>
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

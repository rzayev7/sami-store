import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import AnnouncementBars from "../components/AnnouncementBars";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import AuthModal from "../components/AuthModal";
import { CartProvider } from "../context/CartContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { AuthProvider } from "../context/AuthContext";
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

export const metadata: Metadata = {
  title: "Sami",
  description: "Sami international fashion store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${cinzel.variable} antialiased`}
      >
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
              </div>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

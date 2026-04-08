import Link from "next/link";
import { SUPPORT_EMAIL } from "../lib/sitePublic";

export default function Footer() {
  return (
    <footer className="mt-10 w-full border-t border-black/10 bg-[#F6F3EF] text-[#1a1a1a] sm:mt-14">
      <div className="mx-auto grid w-full max-w-screen-2xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:gap-10 lg:px-12">
        <div className="lg:col-span-2">
          <Link href="/">
            <h3 className="sami-brand text-4xl leading-none">SAMÍ</h3>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#1a1a1a]/75">
            Womenswear from Baku. Worn everywhere.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#1a1a1a]/55">
            Worldwide shipping
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em]">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">New In</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">Sets</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">Dresses</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">Tops</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">Bottoms</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">Blazers</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">Sale</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">All Products</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em]">Support</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <Link href="/shipping" className="transition-opacity hover:opacity-70">
                Shipping
              </Link>
            </li>
            <li>
              <Link href="/returns" className="transition-opacity hover:opacity-70">
                Returns Policy
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="transition-opacity hover:opacity-70">Track Order</Link>
            </li>
            <li>
              <Link href="/contact" className="transition-opacity hover:opacity-70">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em]">Brand</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <Link href="/about" className="transition-opacity hover:opacity-70">About</Link>
            </li>
            <li>
              <Link href="/terms" className="transition-opacity hover:opacity-70">Terms &amp; Conditions</Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-opacity hover:opacity-70">Privacy Policy</Link>
            </li>
          </ul>
          <h4 className="mt-8 text-xs font-semibold uppercase tracking-[0.16em]">Social</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <a
                href="https://www.instagram.com/sami_boutique_baku/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/10 px-4 py-4 text-center text-[11px] uppercase tracking-[0.14em] text-[#1a1a1a]/55 sm:px-6 lg:px-12">
        © {new Date().getFullYear()} SAMÍ. All rights reserved.
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scale Pixel — WhatsApp CMS",
  description: "Internal WhatsApp conversation management platform for Scale Pixel.",
};

// Runs before React hydrates — reads the saved theme choice and applies
// the .light/.dark class immediately, so there's no flash of the wrong
// theme while JS loads. "system" (or nothing saved) applies no class,
// which is exactly what lets the CSS's prefers-color-scheme fallback take
// over. Kept tiny and inline (not an external file) specifically so it
// blocks paint instead of arriving after the first frame.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") document.documentElement.classList.add(t);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}

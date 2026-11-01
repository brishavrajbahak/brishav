import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/content";
import "./globals.css";

const themeBootstrap = `(() => {
  try {
    const saved = localStorage.getItem("brishav-theme-v1");
    const theme = saved === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();`;

const manrope = localFont({
  src: "./fonts/manrope-latin.woff2",
  variable: "--font-manrope",
  display: "optional",
  preload: true,
  weight: "200 800",
  adjustFontFallback: "Arial"
});

const cormorant = localFont({
  src: "./fonts/cormorant-garamond-latin.woff2",
  variable: "--font-cormorant",
  display: "optional",
  preload: false,
  weight: "400 700",
  adjustFontFallback: "Times New Roman"
});

const isPreview = process.env.NEXT_PUBLIC_PREVIEW_DEPLOYMENT !== "0";
const publicUrl = isPreview ? siteConfig.previewUrl : siteConfig.canonicalUrl;

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: "Brishav Rajbahak | Data analysis with the denominator visible",
  description: siteConfig.description,
  keywords: ["Brishav Rajbahak", "Data Analyst Nepal", "Python", "SQL", "Power BI", "Loan Default Analysis"],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  robots: isPreview ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    title: "Brishav Rajbahak — I need the numbers to hold up",
    description: siteConfig.description,
    url: publicUrl,
    siteName: siteConfig.name,
    type: "website",
    images: [{ url: "/og-v5.png", width: 1200, height: 630, alt: "Brishav Rajbahak and a published loan risk chart" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Brishav Rajbahak — Data analyst in progress",
    description: siteConfig.description,
    images: ["/og-v5.png"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(97.6% 0.014 82)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(18% 0.02 50)" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.canonicalUrl,
    image: `${siteConfig.canonicalUrl}/Brishav.jpg`,
    jobTitle: "Data Analyst and Data Science Aspirant",
    homeLocation: { "@type": "Place", name: siteConfig.location },
    sameAs: [siteConfig.github, siteConfig.linkedin, siteConfig.instagram]
  };

  return (
    <html lang="en" className={`${manrope.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}

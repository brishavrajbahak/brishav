import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/content";
import "./globals.css";
import "./cinematic-v3.css";

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
  preload: true,
  weight: "400 700",
  adjustFontFallback: "Times New Roman"
});

const isPreview = process.env.NEXT_PUBLIC_PREVIEW_DEPLOYMENT === "1";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.canonicalUrl),
  title: "Brishav Rajbahak | Data Analyst & Data Science Aspirant",
  description:
    "Brishav Rajbahak's Himalayan Data Observatory: published data analysis, interactive demos, Python, SQL, Power BI, and cloud delivery.",
  keywords: ["Brishav Rajbahak", "Data Analyst Nepal", "Python", "SQL", "Power BI", "Data Science"],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.ico" },
  robots: isPreview ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    title: "Brishav Rajbahak — Himalayan Data Observatory",
    description: siteConfig.headline,
    url: siteConfig.canonicalUrl,
    siteName: siteConfig.name,
    type: "website",
    images: [{
      url: "/assets/cinematic/summit-dawn-1672.webp",
      width: 1672,
      height: 941,
      alt: "Brishav Rajbahak's Himalayan Data Observatory"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Brishav Rajbahak — Himalayan Data Observatory",
    description: siteConfig.headline,
    images: ["/assets/cinematic/summit-dawn-1672.webp"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "oklch(97.5% 0.015 82)"
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
    <html lang="en" className={`${manrope.variable} ${cormorant.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}

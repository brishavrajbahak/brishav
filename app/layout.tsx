import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { siteConfig } from "@/lib/content";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  preload: false
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false
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
    images: [{ url: "/Brishav.jpg", width: 1200, height: 1200, alt: "Brishav Rajbahak" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Brishav Rajbahak — Himalayan Data Observatory",
    description: siteConfig.headline,
    images: ["/Brishav.jpg"]
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

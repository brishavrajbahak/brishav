import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/content";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.NEXT_PUBLIC_PREVIEW_DEPLOYMENT !== "0";
  const base = isPreview ? siteConfig.previewUrl : siteConfig.canonicalUrl;
  return {
    rules: isPreview ? { userAgent: "*", disallow: "/" } : { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}

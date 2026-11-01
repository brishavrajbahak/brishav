import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const isPreview = process.env.NEXT_PUBLIC_PREVIEW_DEPLOYMENT !== "0";
  const base = isPreview ? siteConfig.previewUrl : siteConfig.canonicalUrl;
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/dashboard/loan-default/`, changeFrequency: "monthly", priority: 0.7 }
  ];
}

import type { MetadataRoute } from "next";

import { publicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ allow: "/", disallow: ["/yonetim", "/api/"], userAgent: "*" }],
    sitemap: new URL("/sitemap.xml", publicSiteUrl).toString(),
  };
}

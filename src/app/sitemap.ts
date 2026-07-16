import type { MetadataRoute } from "next";

import { publicSiteUrl } from "@/lib/site-url";

const publicPaths = ["", "/hakkimda", "/hizmetler", "/surec", "/randevu", "/iletisim", "/kvkk", "/gizlilik"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-16T00:00:00.000Z");
  return publicPaths.map((path) => ({
    changeFrequency: path === "" ? "weekly" : "monthly",
    lastModified,
    priority: path === "" ? 1 : path === "/randevu" ? 0.9 : 0.7,
    url: new URL(path || "/", publicSiteUrl).toString(),
  }));
}

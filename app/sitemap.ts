import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { tenders } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { COUNTRIES, SECTORS } from "@/lib/constants";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getDb();

  // Get all open tender IDs for individual pages
  const rows = await db
    .select({ id: tenders.id, updatedAt: tenders.updatedAt })
    .from(tenders)
    .where(eq(tenders.status, "open"))
    .orderBy(desc(tenders.updatedAt))
    .limit(5000)
    .catch(() => []);

  const tenderUrls: MetadataRoute.Sitemap = rows.map(r => ({
    url: `${BASE}/tenders/${r.id}`,
    lastModified: r.updatedAt || new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const countryUrls: MetadataRoute.Sitemap = Object.keys(COUNTRIES).map(code => ({
    url: `${BASE}/country/${code.toLowerCase()}`,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const sectorUrls: MetadataRoute.Sitemap = Object.keys(SECTORS).map(slug => ({
    url: `${BASE}/sector/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    { url: BASE,                    changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE}/tenders`,       changeFrequency: "hourly", priority: 0.95 },
    { url: `${BASE}/alerts`,        changeFrequency: "weekly", priority: 0.8 },
    ...countryUrls,
    ...sectorUrls,
    ...tenderUrls,
  ];
}

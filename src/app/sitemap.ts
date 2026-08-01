import type { MetadataRoute } from "next";
import { getAllBookIdsForSitemap } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

// New books are added through the app all the time, not just on deploy —
// revalidate hourly so the sitemap picks them up without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getAllBookIdsForSitemap();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/community`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${SITE_URL}/books/${book.id}`,
    lastModified: book.created_at,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...bookRoutes];
}

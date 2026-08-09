import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://insightloop.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/changelog",
        "/dashboards",
      ],
      disallow: [
        "/api/",
        "/dashboards/", // Excludes all user-specific saved dashboard detail pages (e.g., /dashboards/[id])
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

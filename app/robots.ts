import { MetadataRoute } from "next";

const BASE_URL = process.env.BASE_URL || "https://skmint.tech";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/auth/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

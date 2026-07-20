import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

const BASE_URL = process.env.BASE_URL || "https://skmint.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch all public skill IDs for dynamic routes
  const { data: skills } = await supabase
    .from("skills")
    .select("id, updated_at");

  const skillRoutes: MetadataRoute.Sitemap =
    skills?.map((skill) => ({
      url: `${BASE_URL}/skill/${skill.id}`,
      lastModified: skill.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) ?? [];

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/taste`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/brew`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...skillRoutes,
  ];
}

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // Allow AI crawlers explicitly for ChatGPT/Perplexity/Claude web indexing
      { userAgent: "GPTBot",            allow: "/" },
      { userAgent: "ChatGPT-User",      allow: "/" },
      { userAgent: "PerplexityBot",     allow: "/" },
      { userAgent: "ClaudeBot",         allow: "/" },
      { userAgent: "anthropic-ai",      allow: "/" },
      { userAgent: "Googlebot",         allow: "/" },
      { userAgent: "Bingbot",           allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}

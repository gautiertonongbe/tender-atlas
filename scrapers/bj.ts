/**
 * Bénin - ARMP (Autorité de Régulation des Marchés Publics)
 * Portal: https://armp.bj (WordPress site)
 * Tenders published as blog posts in category "appels-doffres"
 */
import { fetchHtml, load, parseDate, saveTenders, type TenderData } from "./base";

const BASE = "https://armp.bj";
const URLS = [
  `${BASE}/category/actualites/appels-doffres/`,
  `${BASE}/category/actualites/avis-de-prequalification/`,
  `${BASE}/category/actualites/appels-doffres-2/`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[BJ] Scraping ARMP Bénin...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // WordPress archive: each post is article.type-post or .post
      $("article, .post, .item, h2.entry-title, h3.entry-title").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.includes("armp.bj") && !href.includes("category") && !href.includes("page");
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("h2, h3, .entry-title").first().text()).trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 80);
        const dateEl = row.find("time, .date, .entry-date, .post-date").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "armp_bj",
          country: "BJ",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl: href,
          sourceType: "government",
          currency: "XOF",
          rawHtml: $.html(el).slice(0, 5000),
        });
      });
    } catch (err: any) {
      console.error(`[BJ] Error (${url}):`, err.message);
    }
  }

  console.log(`[BJ] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

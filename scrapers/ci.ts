/**
 * Côte d'Ivoire - ARCOP (Autorité de Régulation de la Commande Publique)
 * Formerly ANRMP. Rebranded and moved to https://arcop.ci (WordPress site)
 * Tenders: https://arcop.ci/documentation/avis/avis-dappel-doffres/
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://arcop.ci";
const URLS = [
  `${BASE}/documentation/avis/avis-dappel-doffres/`,
  `${BASE}/documentation/avis/avis-a-manifestation-dinteret/`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[CI] Scraping ARCOP Côte d'Ivoire...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // WordPress archive with various post/article selectors
      $("article, .post, h2.entry-title, h3.entry-title, .elementor-post").each((_, el) => {
        const row = $(el);
        const a = row.find("a[href*='arcop.ci']").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return !href.includes("category") && !href.includes("page") && !href.includes("wp-content");
        }).first();

        if (!a.length) return;

        const title = (a.attr("title") || a.text() || row.find("h2, h3, .entry-title, .elementor-heading-title").first().text()).trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 80);
        const dateEl = row.find("time, .date, .entry-date, .post-date, .dce-post-date").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "arcop_ci",
          country: "CI",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl: href,
          sourceType: "government",
          currency: "XOF",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[CI] Error (${url}):`, err.message);
    }
  }

  console.log(`[CI] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

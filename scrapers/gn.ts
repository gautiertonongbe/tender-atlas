/**
 * Guinée - ARMP (Autorité de Régulation des Marchés Publics)
 * Portal: https://armp.gov.gn
 * Tenders published under avis section
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://armp.gov.gn";
const URLS = [
  `${BASE}/avis-dappel-doffres/`,
  `${BASE}/avis-a-manifestation-dinteret/`,
  `${BASE}/demande-de-propositions/`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[GN] Scraping ARMP Guinée...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // WordPress-based portal
      $("article, .post, h2.entry-title, h3.entry-title, .elementor-post").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("armp.gov.gn") || href.startsWith("/")) && !href.includes("category") && !href.includes("page");
        }).first();

        if (!a.length) return;

        const title = (a.attr("title") || a.text() || row.find("h2, h3, .entry-title").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 80);
        const dateEl = row.find("time, .date, .entry-date, .post-date").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId: `gn_${sourceId}`,
          sourcePortal: "armp_gn",
          country: "GN",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl: href,
          sourceType: "government",
          currency: "GNF",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[GN] Error (${url}):`, err.message);
    }
  }

  console.log(`[GN] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

/**
 * DR Congo — ARMP (Autorité de Régulation des Marchés Publics)
 * Portal: https://armp-drc.cd
 *
 * DRC is the largest francophone country in Africa and one of the most
 * resource-rich. ARMP publishes tender notices on their WordPress site.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://armp-drc.cd";
const URLS = [
  `${BASE}/category/appels-doffres/`,
  `${BASE}/category/avis-de-marches/`,
  `${BASE}/avis-dappel-doffres/`,
  `${BASE}/marches-publics/`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[CD] Scraping ARMP DR Congo...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("article, .post, h2.entry-title, h3.entry-title, .elementor-post").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.includes("armp-drc.cd") || href.startsWith("/");
        }).first();

        if (!a.length) return;

        const title = (a.attr("title") || a.text() ||
          row.find("h2, h3, .entry-title, .elementor-heading-title").first().text()).trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = `cd_${href.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
        const dateEl = row.find("time, .date, .entry-date, .post-date").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "armp_cd",
          country: "CD",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl: href.startsWith("http") ? href : `${BASE}${href}`,
          sourceType: "government",
          currency: "CDF",
          rawHtml: $.html(el).slice(0, 3000),
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[CD] Error (${url}):`, err.message);
    }
  }

  console.log(`[CD] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

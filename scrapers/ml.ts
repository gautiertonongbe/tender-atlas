/**
 * Mali - ARMDS (Autorité de Régulation des Marchés Publics et des Délégations de Service Public)
 * Portal: https://www.armds.ml
 * Tenders published under publications/avis section
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.armds.ml";
const URLS = [
  `${BASE}/index.php/publications/avis-d-appel-d-offres`,
  `${BASE}/index.php/publications/demandes-de-propositions`,
  `${BASE}/index.php/publications/avis-a-manifestation-d-interet`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[ML] Scraping ARMDS Mali...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("article, .items-row, li.item, div.item, tr").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("armds.ml") || href.startsWith("/")) && href.length > 5;
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("h2, h3, td").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop()?.split("?")[0] || title.slice(0, 80);
        const dateEl = row.find("time, .date, .created, dd, td:last-child").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId: `ml_${sourceId}`,
          sourcePortal: "armds_ml",
          country: "ML",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl: href,
          sourceType: "government",
          currency: "XOF",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[ML] Error (${url}):`, err.message);
    }
  }

  console.log(`[ML] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

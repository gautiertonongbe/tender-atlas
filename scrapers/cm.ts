/**
 * Cameroun - ARMP (Agence de Régulation des Marchés Publics)
 * Portal: https://www.armp.cm
 */
import { fetchHtml, load, parseDate, parseBudget, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.armp.cm";

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[CM] Scraping ARMP Cameroun...");
  const tenders: TenderData[] = [];

  const urls = [
    `${BASE}/avis-dappels-doffres`,
    `${BASE}/appels-offres`,
    `${BASE}/marches-publics/avis`,
  ];

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("table tbody tr, .avis-item, .views-row, article").each((_, el) => {
        const row = $(el);
        const a = row.find("a").first();
        const title = a.text().trim() || row.find("td").eq(1).text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 50);
        const cols = row.find("td");
        const deadlineRaw = cols.eq(3).text().trim() || cols.eq(2).text().trim();
        const entityRaw   = cols.eq(0).text().trim();

        tenders.push({
          sourceId, sourcePortal: "armp_cm", country: "CM",
          title, entity: entityRaw || undefined,
          deadline: parseDate(deadlineRaw),
          currency: "XAF",
          sourceUrl, rawHtml: $.html(el),
        });
      });

      if (tenders.length > 0) break;
      await sleep(1000);
    } catch (err: any) {
      console.error(`[CM] Error:`, err.message);
    }
  }

  console.log(`[CM] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

/**
 * Sénégal - DCMP (Direction Centrale des Marchés Publics)
 * Portal: https://www.marchespublics.sn
 */
import { fetchHtml, load, parseDate, parseBudget, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.marchespublics.sn";
const LIST = `${BASE}/index.php?option=com_licitaciones&view=licitaciones&Itemid=`;

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[SN] Scraping DCMP Sénégal...");
  const tenders: TenderData[] = [];

  // Try multiple known URL patterns for the portal
  const urls = [
    `${BASE}/index.php?option=com_licitaciones`,
    `${BASE}/avis-dappel-doffres`,
    `${BASE}/appels-offres`,
    BASE,
  ];

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // Parse standard table or list formats
      $("table tbody tr, .licitacion-item, .views-row, .tender-row").each((_, el) => {
        const row = $(el);
        const a = row.find("a").first();
        const title = a.text().trim() || row.find("td").eq(1).text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const sourceId = href.split(/[?=\/]/).filter(Boolean).pop() || title.slice(0, 50);

        const cols = row.find("td");
        const deadlineRaw = cols.eq(3).text().trim() || cols.eq(2).text().trim();
        const entityRaw   = cols.eq(0).text().trim();

        tenders.push({
          sourceId, sourcePortal: "dcmp_sn", country: "SN",
          title, entity: entityRaw || undefined,
          deadline: parseDate(deadlineRaw),
          currency: "XOF",
          sourceUrl, rawHtml: $.html(el),
        });
      });

      if (tenders.length > 0) break;
      await sleep(1000);
    } catch (err: any) {
      console.error(`[SN] Error:`, err.message);
    }
  }

  console.log(`[SN] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

/**
 * Ghana - Public Procurement Authority (PPA)
 * Portal: https://www.ppa.gov.gh
 *
 * The PPA publishes tender adverts and contract awards.
 * Tenders typically appear under "Procurement Notices" or "Tender Adverts".
 */
import { fetchHtml, load, parseDate, parseBudget, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.ppa.gov.gh";

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[GH] Scraping PPA Ghana...");
  const tenders: TenderData[] = [];

  const urls = [
    `${BASE}/procurement-notices`,
    `${BASE}/tenders`,
    `${BASE}/tender-adverts`,
    `${BASE}/index.php/procurement-notices`,
  ];

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("table tbody tr, .tender-item, .procurement-notice, article, li.tender").each((_, el) => {
        const row = $(el);
        const a = row.find("a").first();
        const title = a.text().trim() || row.find("td").eq(1).text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 50);

        const cols = row.find("td");
        const entity   = cols.eq(0).text().trim();
        const dateRaw  = cols.eq(cols.length - 1).text().trim();
        const budgRaw  = cols.find(".budget, .value, .amount").text().trim();
        const { amount, currency } = parseBudget(budgRaw);

        tenders.push({
          sourceId, sourcePortal: "ppa_gh", country: "GH",
          title, entity: entity || undefined,
          deadline: parseDate(dateRaw),
          budgetLocal: amount, currency: currency || "GHS",
          sourceUrl, rawHtml: $.html(el),
        });
      });

      if (tenders.length > 0) break;
      await sleep(1500);
    } catch (err: any) {
      console.error(`[GH] Error (${url}):`, err.message);
    }
  }

  console.log(`[GH] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

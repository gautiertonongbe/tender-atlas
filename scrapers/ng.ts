/**
 * Nigeria - Bureau of Public Procurement (BPP)
 * Primary portal: https://nocopo.bpp.gov.ng (NoCoPo - National Contract Portal)
 * Fallback:       https://www.bpp.gov.ng/procurement-notices
 *
 * NoCoPo is the official contract award and tender system for Federal MDAs.
 */
import { fetchHtml, load, parseDate, parseBudget, saveTenders, sleep, type TenderData } from "./base";

const NOCOPO_BASE = "https://nocopo.bpp.gov.ng";
const BPP_BASE    = "https://www.bpp.gov.ng";

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[NG] Scraping BPP / NoCoPo Nigeria...");
  const tenders: TenderData[] = [];

  // --- Try NoCoPo first ---
  const nocopoUrls = [
    `${NOCOPO_BASE}/public/procurement-notices`,
    `${NOCOPO_BASE}/public/tenders`,
    `${NOCOPO_BASE}/tenders/open`,
  ];

  for (const url of nocopoUrls) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("table tbody tr, .tender-item, .contract-row, .notice-row").each((_, el) => {
        const row = $(el);
        const cols = row.find("td");
        if (cols.length < 2) return;

        const a = row.find("a").first();
        const title = a.text().trim() || cols.eq(1).text().trim() || cols.eq(0).text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${NOCOPO_BASE}${href}`;
        const refNum  = cols.eq(0).text().trim();
        const sourceId = refNum || href.split("/").pop() || title.slice(0, 50);
        const entity  = cols.eq(2).text().trim();
        const dateRaw = cols.eq(cols.length - 1).text().trim();
        const budgRaw = cols.find(".budget, .amount").text().trim();
        const { amount, currency } = parseBudget(budgRaw);

        tenders.push({
          sourceId, sourcePortal: "bpp_ng", country: "NG",
          title, entity: entity || undefined,
          deadline: parseDate(dateRaw),
          budgetLocal: amount, currency: currency || "NGN",
          sourceUrl, rawHtml: $.html(el),
        });
      });

      if (tenders.length > 0) break;
      await sleep(1500);
    } catch (err: any) {
      console.error(`[NG] NoCoPo error (${url}):`, err.message);
    }
  }

  // --- Fallback: BPP procurement notices page ---
  if (tenders.length === 0) {
    const fallbackUrls = [
      `${BPP_BASE}/procurement-notices`,
      `${BPP_BASE}/tenders`,
      `${BPP_BASE}/advertised-tenders`,
    ];
    for (const url of fallbackUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = load(html);
        $("table tbody tr, article, .tender-row, li.notice").each((_, el) => {
          const row = $(el);
          const a = row.find("a").first();
          const title = a.text().trim();
          if (!title || title.length < 5) return;
          const href = a.attr("href") || "";
          const sourceUrl = href.startsWith("http") ? href : `${BPP_BASE}${href}`;
          const dateRaw = row.find(".date, time, td:last-child").text().trim();
          tenders.push({
            sourceId: href.split("/").pop() || title.slice(0, 50),
            sourcePortal: "bpp_ng", country: "NG",
            title, currency: "NGN",
            deadline: parseDate(dateRaw),
            sourceUrl, rawHtml: $.html(el),
          });
        });
        if (tenders.length > 0) break;
        await sleep(1500);
      } catch (err: any) {
        console.error(`[NG] BPP fallback error (${url}):`, err.message);
      }
    }
  }

  console.log(`[NG] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

/**
 * Uganda — Public Procurement and Disposal of Public Assets Authority (PPDA)
 * Portal: https://gpp.ppda.go.ug
 *
 * Uganda's Government Procurement Portal publishes all public tenders.
 * The search endpoint accepts GET with query params and returns HTML.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, BROWSER_UA, type TenderData } from "./base";

// GPP (gpp.ppda.go.ug) is an Angular SPA — results won't render without JS.
// We also try the PPDA WordPress site which has server-rendered pages.
const BASE = "https://gpp.ppda.go.ug";
const URLS = [
  `${BASE}/public/bid-invitations`,
  `${BASE}/public/notices`,
  "https://www.ppda.go.ug/jobs-and-tenders/",
  "https://www.ppda.go.ug/category/tenders/",
];
const FETCH_OPTS = { userAgent: BROWSER_UA };

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[UG] Scraping Uganda PPDA (gpp.ppda.go.ug)...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url, 3, FETCH_OPTS);
      const $ = load(html);

      $("table tbody tr, .bid-row, .tender-row, .views-row, article.procurement").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("ppda.go.ug") || href.startsWith("/")) && !href.includes("#");
        }).first();

        if (!a.length) return;

        const title = a.text().trim() || row.find("td").eq(1).text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const sourceId = `ug_${href.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        const cells = row.find("td");
        const deadlineRaw = cells.eq(4).text().trim() || cells.eq(3).text().trim() ||
          row.find(".deadline, .closing-date").first().text().trim();
        const entity = cells.eq(1).text().trim() || row.find(".entity, .procuring-entity").first().text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "ppda_ug",
          country: "UG",
          title,
          entity: entity || undefined,
          deadline: parseDate(deadlineRaw),
          sourceUrl,
          sourceType: "government",
          currency: "UGX",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[UG] Error (${url}):`, err.message);
    }
  }

  console.log(`[UG] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

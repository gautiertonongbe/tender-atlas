/**
 * Kenya - PPRA (Public Procurement Regulatory Authority)
 * Portal: https://tenders.go.ke (Government e-procurement portal)
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://tenders.go.ke";
const URLS = [
  `${BASE}/tenders`,
  `${BASE}/tenders?status=open`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[KE] Scraping tenders.go.ke (Kenya)...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("table tbody tr, .tender-item, .listing-item, article").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("tenders.go.ke") || href.startsWith("/")) && href.length > 2;
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("td:first-child, h3, h4").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop()?.split("?")[0] || title.slice(0, 80);
        const cells = row.find("td");
        const entity = cells.eq(1).text().trim() || undefined;
        const deadlineRaw = cells.last().text().trim();

        tenders.push({
          sourceId: `ke_${sourceId}`,
          sourcePortal: "ppra_ke",
          country: "KE",
          title,
          entity: entity || undefined,
          deadline: parseDate(deadlineRaw) || undefined,
          sourceUrl: href,
          sourceType: "government",
          currency: "KES",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[KE] Error (${url}):`, err.message);
    }
  }

  console.log(`[KE] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

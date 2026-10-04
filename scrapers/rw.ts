/**
 * Rwanda - RPPA (Rwanda Public Procurement Authority)
 * Portal: https://www.rppa.gov.rw and https://umucyo.gov.rw (e-procurement)
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.rppa.gov.rw";
const URLS = [
  `${BASE}/tenders`,
  `${BASE}/procurement-notices`,
  "https://umucyo.gov.rw/public/tenders",
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[RW] Scraping RPPA Rwanda...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("table tbody tr, .tender-row, article, .post, li.item").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.length > 3 && !href.startsWith("#") && !href.includes("javascript");
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("td, h3, h4").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop()?.split("?")[0] || title.slice(0, 80);
        const dateEl = row.find("time, .date, td:last-child").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId: `rw_${sourceId}`,
          sourcePortal: "rppa_rw",
          country: "RW",
          title,
          publishedAt: parseDate(dateRaw) || undefined,
          sourceUrl: href,
          sourceType: "government",
          currency: "RWF",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[RW] Error (${url}):`, err.message);
    }
  }

  console.log(`[RW] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

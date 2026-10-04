/**
 * Tanzania — Public Procurement Regulatory Authority (PPRA)
 * Portal: https://www.ppra.go.tz
 *
 * Tanzania's primary tender system is NeST (nest.go.tz) which requires
 * JavaScript to render — not scrapeable without a headless browser.
 * We scrape the PPRA regulatory site for public notices and announcements,
 * plus the Tanzania Revenue Authority and ministry-level notice pages.
 *
 * Comprehensive TZ coverage comes from UNGM, AfDB, and WorldBank scrapers
 * which pick up all donor-funded procurement in Tanzania.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, classifySector, type TenderData } from "./base";

const BASE = "https://www.ppra.go.tz";
const URLS = [
  `${BASE}/publications/public-notices`,
  `${BASE}/announcements`,
  "https://www.tenders.go.tz",
  "https://www.trab.go.tz/tenders",
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[TZ] Scraping Tanzania PPRA...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    const baseUrl = (() => { try { return new URL(url).origin; } catch { return BASE; } })();
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // PPRA announcements/notices pattern
      $("a[href]").each((_, el) => {
        const a = $(el);
        const href = a.attr("href") || "";
        // Only pick up links that look like procurement notices, not nav/footer/script
        if (href.startsWith("#") || href.includes("javascript") ||
            href.includes("css") || href.includes("img")) return;

        const title = a.text().trim() ||
          a.attr("title") || "";
        if (!title || title.length < 10) return;

        // Filter out nav links — only keep content that sounds like a tender/notice
        const lower = title.toLowerCase();
        const isTenderLike = lower.includes("tender") || lower.includes("bid") ||
          lower.includes("procurement") || lower.includes("notice") ||
          lower.includes("invitation") || lower.includes("contract") ||
          lower.includes("supply") || lower.includes("works") ||
          lower.includes("service") || lower.includes("request");
        if (!isTenderLike) return;

        const sourceUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
        const sourceId = `tz_${href.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        tenders.push({
          sourceId,
          sourcePortal: "ppra_tz",
          country: "TZ",
          title,
          sourceUrl,
          sourceType: "government",
          currency: "TZS",
        });
      });

      // Also try table rows
      $("table tbody tr").each((_, el) => {
        const row = $(el);
        const a = row.find("a[href]").first();
        if (!a.length) return;

        const title = a.text().trim() || row.find("td").eq(1).text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
        const sourceId = `tz_${href.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        const cells = row.find("td");
        const dateRaw = cells.eq(2).text().trim() || cells.eq(1).text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "ppra_tz",
          country: "TZ",
          title,
          deadline: parseDate(dateRaw),
          sourceUrl,
          sourceType: "government",
          currency: "TZS",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[TZ] Error (${url}):`, err.message);
    }
  }

  console.log(`[TZ] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

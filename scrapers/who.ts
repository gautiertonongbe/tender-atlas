/**
 * WHO (World Health Organization) - Procurement Notices
 * Portal: https://www.who.int/about/finances-accountability/funding/procurement
 * WHO publishes RFPs/RFQs on their procurement page, mainly health sector.
 * Also uses UNGM. We scrape their dedicated procurement notices page.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const URLS = [
  "https://www.who.int/about/finances-accountability/funding/procurement/requests-for-proposals",
  "https://www.who.int/about/finances-accountability/funding/procurement/request-for-quotation",
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[WHO] Scraping WHO procurement notices...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // WHO pages use cards/list items
      $(".sf-list-item, .list-item, article, .item, tr, li").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.length > 3 && !href.startsWith("#") && !href.includes("javascript");
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("h3, h4, td, .title").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `https://www.who.int${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 80);
        const dateEl = row.find("time, .date, .publication-date, td:last-child").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        // WHO procurement is mostly Africa-focused health
        tenders.push({
          sourceId: `who_${sourceId}`,
          sourcePortal: "who",
          country: "ZZ", // Multi-country — use placeholder
          title,
          publishedAt: parseDate(dateRaw) || undefined,
          sourceUrl: href,
          sourceType: "igo",
          sector: "health",
          entity: "World Health Organization (WHO)",
        });
      });

      await sleep(2000);
    } catch (err: any) {
      console.error(`[WHO] Error (${url}):`, err.message);
    }
  }

  console.log(`[WHO] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

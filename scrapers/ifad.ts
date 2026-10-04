/**
 * IFAD (International Fund for Agricultural Development)
 * Portal: https://www.ifad.org/en/procurement
 * IFAD focuses on agriculture, rural development — heavily Africa-focused.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.ifad.org";
const URLS = [
  `${BASE}/en/procurement`,
  `${BASE}/en/procurement/rfps`,
  `${BASE}/en/procurement/rfqs`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[IFAD] Scraping IFAD procurement...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $(".list-item, article, tr, .card, li.item, .result-item").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.length > 3 && !href.startsWith("#") && !href.includes("javascript");
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("h3, h4, td, .title").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 80);
        const dateEl = row.find("time, .date, .published, td:last-child").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId: `ifad_${sourceId}`,
          sourcePortal: "ifad",
          country: "ZZ",
          title,
          publishedAt: parseDate(dateRaw) || undefined,
          sourceUrl: href,
          sourceType: "igo",
          sector: "agriculture",
          entity: "IFAD — International Fund for Agricultural Development",
        });
      });

      await sleep(2000);
    } catch (err: any) {
      console.error(`[IFAD] Error (${url}):`, err.message);
    }
  }

  console.log(`[IFAD] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

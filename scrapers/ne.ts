/**
 * Niger - ARMP (Autorité de Régulation des Marchés Publics)
 * Portal: https://www.armp-niger.org
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.armp-niger.org";
const URLS = [
  `${BASE}/index.php/nos-publications/avis-d-appels-d-offres`,
  `${BASE}/index.php/nos-publications/avis-d-appel-d-offres`,
  `${BASE}/index.php/nos-publications/demandes-de-propositions`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[NE] Scraping ARMP Niger...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("article, .items-row, li.item, div.item, tr").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("armp-niger.org") || href.startsWith("/")) && href.length > 3;
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("h2, h3, td").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop()?.split("?")[0] || title.slice(0, 80);
        const dateEl = row.find("time, .date, .created, dd").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId: `ne_${sourceId}`,
          sourcePortal: "armp_ne",
          country: "NE",
          title,
          publishedAt: parseDate(dateRaw) || undefined,
          sourceUrl: href,
          sourceType: "government",
          currency: "XOF",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[NE] Error (${url}):`, err.message);
    }
  }

  console.log(`[NE] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

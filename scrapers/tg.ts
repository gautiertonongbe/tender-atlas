/**
 * Togo - ARMP (Autorité de Régulation des Marchés Publics)
 * Portal: https://www.armp.tg
 * Tenders published under marchés/appels d'offres section
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.armp.tg";
const URLS = [
  `${BASE}/index.php/nos-publications/avis-d-appel-d-offres`,
  `${BASE}/index.php/nos-publications/demande-de-propositions`,
  `${BASE}/index.php/nos-publications/avis-a-manifestation-d-interet`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[TG] Scraping ARMP Togo...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // Joomla-based portal — articles listed as li/div with links
      $("article, .items-row, .item, li.item, div.item, td").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("armp.tg") || href.startsWith("/")) && !href.includes("category") && !href.includes("page=");
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("h2, h3, .page-header").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("/").filter(Boolean).pop()?.split("?")[0] || title.slice(0, 80);
        const dateEl = row.find("time, .date, .created, dd").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId: `tg_${sourceId}`,
          sourcePortal: "armp_tg",
          country: "TG",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl: href,
          sourceType: "government",
          currency: "XOF",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[TG] Error (${url}):`, err.message);
    }
  }

  console.log(`[TG] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

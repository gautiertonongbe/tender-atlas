/**
 * Burkina Faso - ARMP (Direction Générale du Contrôle des Marchés Publics)
 * Portal: https://www.marchespublics.bf
 * Tenders listed under avis de passation
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const BASE = "https://www.marchespublics.bf";
const URLS = [
  `${BASE}/index.php?option=com_avis&view=avis&type=ao`,
  `${BASE}/index.php?option=com_avis&view=avis&type=ami`,
  `${BASE}/index.php?option=com_avis&view=avis&type=dp`,
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[BF] Scraping ARMP Burkina Faso...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // Joomla-based portal
      $("table tr, .item, article, li.item, .avis-item").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("marchespublics.bf") || href.startsWith("/")) && href.length > 5;
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("td").first().text()).trim();
        if (!title || title.length < 5) return;

        let href = a.attr("href") || "";
        if (href.startsWith("/")) href = `${BASE}${href}`;
        if (seen.has(href)) return;
        seen.add(href);

        const sourceId = href.split("id=").pop()?.split("&")[0] || title.slice(0, 80);
        const dateEl = row.find("td:nth-child(2), time, .date, .created").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId: `bf_${sourceId}`,
          sourcePortal: "armp_bf",
          country: "BF",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl: href,
          sourceType: "government",
          currency: "XOF",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[BF] Error (${url}):`, err.message);
    }
  }

  console.log(`[BF] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

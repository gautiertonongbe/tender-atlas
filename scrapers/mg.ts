/**
 * Madagascar — PRMP (Personne Responsable des Marchés Publics)
 * Portal: http://www.prmp.gov.mg and https://armp.mg
 *
 * Madagascar's procurement authority publishes tender notices on their site.
 * Also covers BIANCO (anti-corruption body) and OMDA portals.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, type TenderData } from "./base";

const URLS = [
  "https://armp.mg/appels-doffres/",
  "https://armp.mg/avis-de-marches/",
  "http://www.prmp.gov.mg/appels-offres",
  "https://armp.mg/actualites/",
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[MG] Scraping Madagascar ARMP...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    const baseUrl = new URL(url).origin;
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("article, .post, h2.entry-title, h3.entry-title, .views-row, table tbody tr").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return !href.startsWith("#") && href.length > 3 &&
            !href.includes("category") && !href.includes("page=");
        }).first();

        if (!a.length) return;

        const title = (a.text() || row.find("h2, h3, .entry-title").first().text()).trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
        const sourceId = `mg_${href.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        const dateEl = row.find("time, .date, .entry-date, .post-date").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "armp_mg",
          country: "MG",
          title,
          publishedAt: parseDate(dateRaw),
          sourceUrl,
          sourceType: "government",
          currency: "MGA",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[MG] Error (${url}):`, err.message);
    }
  }

  console.log(`[MG] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

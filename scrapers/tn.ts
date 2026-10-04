/**
 * Tunisia — Government procurement notices
 * Primary portal: https://www.tuneps.tn (Angular SPA, requires login — not scrapeable)
 *
 * TUNEPS (Tunisian Electronic Procurement System) is fully authenticated.
 * We instead scrape Tunisian ministry and agency websites that publish
 * tender notices as standard HTML pages, plus the STEG (energy) portal.
 *
 * Comprehensive TN coverage comes from AfDB, EIB, and WorldBank scrapers
 * which capture all donor-funded procurement in Tunisia.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, classifySector, BROWSER_UA, type TenderData } from "./base";

const FETCH_OPTS = { rejectUnauthorized: false, userAgent: BROWSER_UA };

const URLS = [
  "https://www.steg.com.tn/fr/institutionnel/appels-offres.html",
  "https://www.steg.com.tn/fr/institutionnel/appels-offres",
  "https://www.anpe.nat.tn/fr/page/appels-d-offres",
  "https://www.sncft.com.tn/fr/appels-doffres",
  "https://www.tunisair.com.tn/fr/appels-offres",
  "https://www.ontt.nat.tn/fr/page/appels-offres",
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[TN] Scraping Tunisia government portals...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    const baseUrl = (() => { try { return new URL(url).origin; } catch { return ""; } })();
    try {
      const html = await fetchHtml(url, 2, FETCH_OPTS);
      const $ = load(html);

      $("article, .post, .tender, .appel-offre, .views-row, table tbody tr, li.offre, .notice-item").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.length > 3 && !href.startsWith("#") && !href.includes("javascript");
        }).first();

        if (!a.length) return;

        const title = (a.attr("title") || a.text() ||
          row.find("h2, h3, h4, .entry-title, td").first().text()).trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
        const sourceId = `tn_${href.split(/[?&/]/).filter(Boolean).pop() || title.slice(0, 80)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        const dateEl = row.find("time, .date, .entry-date, .date-publication, td").last();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();
        const entity = row.find(".entity, .organisme, td").eq(1).text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "tn_gov",
          country: "TN",
          title,
          entity: entity && entity !== title ? entity : undefined,
          sector: classifySector(title),
          publishedAt: parseDate(dateRaw),
          sourceUrl,
          sourceType: "government",
          currency: "TND",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[TN] Error (${url}):`, err.message);
    }
  }

  console.log(`[TN] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

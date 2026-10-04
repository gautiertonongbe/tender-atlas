/**
 * European Investment Bank (EIB) — Corporate procurement calls for tender
 * https://www.eib.org/en/about/procurement/all/index
 *
 * EIB publishes calls for tender for its own operations (IT, consulting,
 * translation, facilities). These are EU-focused but occasionally include
 * technical assistance contracts for Africa programmes.
 *
 * NOTE: The results list is AJAX-rendered — this scraper parses whatever
 * server-side HTML is available and will typically return 0 for Africa-specific
 * notices. Kept as a stub that fails gracefully without blocking the cron.
 *
 * EIB-financed project procurement in Africa is handled by borrowers and
 * published on UNGM, local procurement portals, or by the project promoters.
 * Those are captured by the UNGM, AfDB, and WorldBank scrapers.
 */
import { fetchHtml, load, parseDate, saveTenders, classifySector, BROWSER_UA, type TenderData } from "./base";

const BASE = "https://www.eib.org";

const URLS = [
  `${BASE}/en/about/procurement/all/index?pageNumber=0&itemPerPage=25&pageable=true&language=EN&procurementStatus=open&_g_procurementInformations_type=call`,
  `${BASE}/fr/projets/marches-publics/index`,
];

const AFRICA_MAP: Record<string, string> = {
  benin: "BJ", "côte d'ivoire": "CI", "ivory coast": "CI", senegal: "SN",
  cameroon: "CM", cameroun: "CM", togo: "TG", "burkina faso": "BF",
  mali: "ML", guinea: "GN", guinée: "GN", niger: "NE",
  kenya: "KE", tanzania: "TZ", uganda: "UG", rwanda: "RW",
  "south africa": "ZA", nigeria: "NG", ghana: "GH",
  ethiopia: "ET", mozambique: "MZ", zambia: "ZM",
  madagascar: "MG", morocco: "MA", egypt: "EG", tunisia: "TN",
  gabon: "GA", congo: "CG",
};

function mapCountry(text: string): string {
  const lower = text.toLowerCase();
  for (const [k, v] of Object.entries(AFRICA_MAP)) {
    if (lower.includes(k)) return v;
  }
  return "ZZ";
}

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[EIB] Scraping European Investment Bank procurement...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url, 2, { userAgent: BROWSER_UA });
      const $ = load(html);

      $("article, .eib-card, .procurement-item, table tbody tr").each((_, el) => {
        const row = $(el);
        const a = row.find("a[href]").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return (href.includes("eib.org") || href.startsWith("/")) &&
            !href.includes("login") && !href.includes("#");
        }).first();

        if (!a.length) return;
        const title = a.text().trim() || row.find("h2, h3").first().text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const sourceId = `eib_${href.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        const rowText = row.text();
        const deadlineRaw = row.find(".deadline, time").first().text().trim();

        tenders.push({
          sourceId,
          sourcePortal: "eib",
          country: mapCountry(rowText) || "ZZ",
          title,
          entity: "EIB",
          sector: classifySector(title),
          deadline: parseDate(deadlineRaw),
          sourceUrl,
          sourceType: "igo",
          donor: "European Investment Bank",
          currency: "EUR",
        });
      });
    } catch (err: any) {
      console.error(`[EIB] Error (${url}):`, err.message);
    }
  }

  console.log(`[EIB] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

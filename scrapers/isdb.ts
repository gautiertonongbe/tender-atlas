/**
 * Islamic Development Bank (IsDB) — Project Procurement Notices
 * https://www.isdb.org/project-procurement/tenders
 *
 * IsDB finances projects across 57 member countries including many in Africa.
 * Their Drupal-based procurement portal is at /project-procurement/tenders
 * (not /procurement/notices which returns 404).
 *
 * Structure: .views-row > article with h2 > a for title,
 * .field--name-field-world-country for country, time[datetime] for deadline.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, classifySector, BROWSER_UA, type TenderData } from "./base";

const BASE = "https://www.isdb.org";
const PPROC = `${BASE}/project-procurement`;

const URLS = [
  `${PPROC}/tenders`,
  `${PPROC}/fr/appels-doffres`,
];

const FETCH_OPTS = { userAgent: BROWSER_UA };

// IsDB African member countries
const COUNTRY_MAP: Record<string, string> = {
  senegal: "SN", sénégal: "SN",
  guinea: "GN", guinée: "GN",
  niger: "NE",
  mali: "ML",
  burkina: "BF",
  chad: "TD", tchad: "TD",
  djibouti: "DJ",
  somalia: "SO", somalie: "SO",
  comoros: "KM", comores: "KM",
  egypt: "EG", égypte: "EG",
  morocco: "MA", maroc: "MA",
  tunisia: "TN", tunisie: "TN",
  mozambique: "MZ",
  uganda: "UG",
  cameroon: "CM", cameroun: "CM",
  nigeria: "NG",
  ghana: "GH",
  kenya: "KE",
  tanzania: "TZ",
  "saudi arabia": "SA",
  mauritania: "MR", mauritanie: "MR",
  "côte d'ivoire": "CI", "cote d'ivoire": "CI",
  benin: "BJ", bénin: "BJ",
  togo: "TG",
  "burkina faso": "BF",
};

function mapCountry(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, iso] of Object.entries(COUNTRY_MAP)) {
    if (lower.includes(key)) return iso;
  }
  return "ZZ";
}

// Only save tenders for IsDB African member countries
const AFRICA_ISOS = new Set([
  "BJ","CI","SN","CM","TG","BF","ML","GN","NE","CD","CG","GA","MG",
  "MA","TN","EG","LY","MR","DZ",
  "KE","TZ","UG","RW","MZ","ZM","NG","GH","ET","DJ","SO","TD",
]);

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[IsDB] Scraping Islamic Development Bank procurement...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url, 3, FETCH_OPTS);
      const $ = load(html);

      // Each tender is inside a .views-row > article[about="/project-procurement/tenders/..."]
      $(".views-row article[about*='/project-procurement/tenders/']").each((_, el) => {
        const article = $(el);
        const about = article.attr("about") || "";
        const nid = article.attr("data-nid") || about.split("/").pop() || "";
        if (!nid || seen.has(nid)) return;

        const a = article.find("h2 a").first();
        if (!a.length) return;

        const title = a.text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || about;
        const sourceUrl = href.startsWith("http") ? href : `${BASE}${href}`;

        const countryText = article.find(".field--name-field-world-country").text().trim();
        const country = mapCountry(countryText);

        // Skip non-African countries to stay focused
        if (country !== "ZZ" && !AFRICA_ISOS.has(country)) { seen.add(nid); return; }

        const deadlineEl = article.find("time").first();
        const deadlineRaw = deadlineEl.text().trim() || deadlineEl.attr("datetime") || "";

        seen.add(nid);
        tenders.push({
          sourceId: `isdb_${nid}`,
          sourcePortal: "isdb",
          country,
          title,
          entity: "IsDB",
          sector: classifySector(title),
          deadline: parseDate(deadlineRaw),
          sourceUrl,
          sourceType: "igo",
          donor: "Islamic Development Bank",
          currency: "USD",
        });
      });

      await sleep(1500);
    } catch (err: any) {
      console.error(`[IsDB] Error (${url}):`, err.message);
    }
  }

  console.log(`[IsDB] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

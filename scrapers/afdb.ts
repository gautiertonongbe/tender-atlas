/**
 * African Development Bank (AfDB)
 * https://www.afdb.org/en/projects-and-operations/procurement
 *
 * AfDB uses Drupal with some bot protection. We try multiple URL patterns
 * with browser-like headers and retry logic.
 */
import { fetchHtml, load, parseDate, parseBudget, saveTenders, sleep, classifySector, type TenderData } from "./base";

const BASE = "https://www.afdb.org";

// AfDB Drupal views — try language variants and different node paths
const URLS = [
  `${BASE}/en/projects-and-operations/procurement`,
  `${BASE}/en/projects-operations/procurement`,
  `${BASE}/fr/projets-et-operations/achats`,
  `${BASE}/en/projects-and-operations/procurement/consultancy-opportunities`,
  `${BASE}/en/projects-and-operations/procurement/goods-works-and-non-consulting-services`,
];

function mapCountry(name: string): string | undefined {
  const map: Record<string, string> = {
    "benin":"BJ","bénin":"BJ","côte d'ivoire":"CI","cote d'ivoire":"CI","ivory coast":"CI",
    "senegal":"SN","sénégal":"SN","cameroon":"CM","cameroun":"CM",
    "south africa":"ZA","nigeria":"NG","ghana":"GH",
    "kenya":"KE","ethiopia":"ET","tanzania":"TZ","uganda":"UG","rwanda":"RW",
    "mali":"ML","burkina faso":"BF","niger":"NE","togo":"TG","guinea":"GN",
    "gabon":"GA","congo":"CG","drc":"CD","zambia":"ZM","mozambique":"MZ",
    "egypt":"EG","morocco":"MA","algeria":"DZ","tunisia":"TN",
  };
  return map[name.toLowerCase().trim()];
}

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[AfDB] Scraping African Development Bank...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      $("table tbody tr, .procurement-notice, .views-row, article.tender, .node--type-procurement").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.includes("/en/") || href.includes("/fr/");
        }).first();

        if (!a.length) return;

        const title = a.text().trim() || row.find("td").eq(1).text().trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const sourceId = href.split("/").filter(Boolean).pop() || title.slice(0, 50);
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        const cols = row.find("td");
        const countryRaw = cols.eq(0).text().trim();
        const entity = cols.eq(2).text().trim() || cols.eq(1).text().trim();
        const dateRaw = cols.last().text().trim();
        const budgRaw = cols.filter((_, c) => {
          const t = $(c).text();
          return t.includes("USD") || t.includes("$") || t.includes("UA");
        }).first().text().trim();
        const { amount, currency } = parseBudget(budgRaw);

        tenders.push({
          sourceId, sourcePortal: "afdb",
          country: mapCountry(countryRaw) || "ZZ",
          title,
          entity: entity || "AfDB",
          sector: classifySector(title),
          deadline: parseDate(dateRaw),
          budgetLocal: amount, currency: currency || "USD",
          sourceUrl, sourceType: "igo", donor: "African Development Bank",
        });
      });

      if (tenders.length > 0) break;
      await sleep(2000);
    } catch (err: any) {
      console.error(`[AfDB] Error (${url}):`, err.message);
    }
  }

  console.log(`[AfDB] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

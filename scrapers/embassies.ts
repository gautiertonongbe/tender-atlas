/**
 * Embassy & bilateral donor procurement pages
 *
 * Coverage:
 *   - US Embassy local procurement (all 7 countries)
 *   - French Embassy / AFD (Agence Française de Développement)
 *   - UK FCDO / British High Commission procurement
 *   - German GIZ (Deutsche Gesellschaft für Internationale Zusammenarbeit)
 *   - Canadian IDRC / Global Affairs Canada
 *
 * US Embassy pages follow a standard pattern:
 *   https://{country}.usembassy.gov/doing-business/opportunities/
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, classifySector, type TenderData } from "./base";

const US_EMBASSIES: Array<{ country: string; url: string }> = [
  { country: "BJ", url: "https://bj.usembassy.gov/doing-business/opportunities/" },
  { country: "CI", url: "https://ci.usembassy.gov/doing-business/opportunities/" },
  { country: "SN", url: "https://sn.usembassy.gov/doing-business/opportunities/" },
  { country: "CM", url: "https://cm.usembassy.gov/doing-business/opportunities/" },
  { country: "ZA", url: "https://za.usembassy.gov/doing-business/opportunities/" },
  { country: "NG", url: "https://ng.usembassy.gov/doing-business/opportunities/" },
  { country: "GH", url: "https://gh.usembassy.gov/doing-business/opportunities/" },
];

const AFD_URLS: Array<{ country: string; url: string }> = [
  { country: "BJ", url: "https://www.afd.fr/fr/carte-des-projets/benin" },
  { country: "CI", url: "https://www.afd.fr/fr/carte-des-projets/cote-d-ivoire" },
  { country: "SN", url: "https://www.afd.fr/fr/carte-des-projets/senegal" },
  { country: "CM", url: "https://www.afd.fr/fr/carte-des-projets/cameroun" },
];

const GIZ_URLS: Array<{ country: string; url: string }> = [
  { country: "BJ", url: "https://www.giz.de/en/worldwide/312.html" },
  { country: "CI", url: "https://www.giz.de/en/worldwide/346.html" },
  { country: "SN", url: "https://www.giz.de/en/worldwide/364.html" },
  { country: "NG", url: "https://www.giz.de/en/worldwide/328.html" },
  { country: "GH", url: "https://www.giz.de/en/worldwide/314.html" },
];

async function scrapeEmbassyList(
  sources: Array<{ country: string; url: string }>,
  sourcePortal: string,
  donor: string,
  seen: Set<string>,
): Promise<TenderData[]> {
  const tenders: TenderData[] = [];
  for (const { country, url } of sources) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // Common patterns: table rows, list items, article cards
      $("table tbody tr, .tender-row, .opportunity-item, article, li.solicitation, .views-row").each((_, el) => {
        const row = $(el);
        const a = row.find("a").first();
        const title = a.text().trim() || row.find("h3,h4").text().trim();
        if (!title || title.length < 8) return;
        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : (href ? new URL(href, url).href : url);
        const sourceId = `${sourcePortal}_${country}_${href.split("/").pop()?.slice(0,60) || title.slice(0,50)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);
        const dateRaw = row.find(".date, time, .deadline, td:last-child").first().text().trim();
        tenders.push({
          sourceId, sourcePortal, country,
          title, deadline: parseDate(dateRaw),
          sector: classifySector(title),
          sourceUrl, sourceType: "embassy", donor,
        });
      });

      await sleep(2000);
    } catch (err: any) {
      console.log(`[${sourcePortal}/${country}] ${err.message}`);
    }
  }
  return tenders;
}

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[Embassies] Scraping embassy & bilateral donor tenders...");
  const seen = new Set<string>();
  const all: TenderData[] = [];

  const [usResults, afdResults, gizResults] = await Promise.all([
    scrapeEmbassyList(US_EMBASSIES, "us_embassy", "US Embassy", seen),
    scrapeEmbassyList(AFD_URLS, "afd", "AFD (France)", seen),
    scrapeEmbassyList(GIZ_URLS, "giz", "GIZ (Germany)", seen),
  ]);

  all.push(...usResults, ...afdResults, ...gizResults);

  console.log(`[Embassies] Found ${all.length} tenders`);
  return saveTenders(all);
}

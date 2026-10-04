/**
 * Multinational corporate procurement portals in Africa
 *
 * Coverage:
 *   - TotalEnergies (oil & gas, active in Nigeria, Congo, Gabon, Angola, SA)
 *   - Shell Nigeria (SPDC supplier registration & tenders)
 *   - MTN Group (telecom infrastructure procurement)
 *   - Orange / Sonatel (CI, SN, ML, CM)
 *   - Dangote Group (Nigeria — construction, cement, petrochemicals)
 *   - Oando (Nigeria oil & gas)
 *   - Standard Bank / Stanbic IBTC (ZA, NG — banking procurement)
 *
 * NOTE: Most multinationals use Ariba Supplier Network or internal portals
 * requiring registration. We scrape publicly visible pages only.
 * Auth-gated portals are documented here but cannot be auto-scraped.
 */
import { fetchHtml, load, parseDate, saveTenders, sleep, classifySector, type TenderData } from "./base";

interface MultiSource {
  name: string;
  country: string;
  sourcePortal: string;
  urls: string[];
  selectors?: string;
}

const SOURCES: MultiSource[] = [
  {
    name: "TotalEnergies",
    country: "NG",
    sourcePortal: "totalenergies",
    urls: [
      "https://totalenergies.com/procurement/call-tenders",
      "https://suppliers.totalenergies.com/site/totalenergies/en/s/notice-list",
    ],
  },
  {
    name: "Shell Nigeria",
    country: "NG",
    sourcePortal: "shell_ng",
    urls: [
      "https://www.shell.com.ng/business-customers/supply-chain/procurement-processes.html",
    ],
  },
  {
    name: "MTN Group",
    country: "ZA",
    sourcePortal: "mtn",
    urls: [
      "https://www.mtn.com/procurement/",
      "https://supplier.mtn.com/irj/portal",
    ],
  },
  {
    name: "Dangote Group",
    country: "NG",
    sourcePortal: "dangote",
    urls: [
      "https://www.dangote.com/procurement/",
      "https://supplier.dangote.com",
    ],
  },
  {
    name: "Standard Bank",
    country: "ZA",
    sourcePortal: "standardbank",
    urls: [
      "https://www.standardbank.com/za/standard-bank/about-us/suppliers-and-vendors/supplier-procurement",
    ],
  },
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[Multinationals] Scraping corporate procurement portals...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const src of SOURCES) {
    for (const url of src.urls) {
      try {
        const html = await fetchHtml(url);
        const $ = load(html);

        // Look for tender/RFQ/RFP links on the page
        const linkPatterns = /rfq|rfp|tender|procurement|bid|solicitation|appel.offre|avis/i;
        $("a").each((_, el) => {
          const a = $(el);
          const href = a.attr("href") || "";
          const text = a.text().trim();
          if (text.length < 8 || text.length > 300) return;
          if (!linkPatterns.test(text) && !linkPatterns.test(href)) return;

          const sourceUrl = href.startsWith("http") ? href : new URL(href, url).href;
          const sourceId = `${src.sourcePortal}_${href.split("/").filter(Boolean).pop()?.slice(0,80) || text.slice(0,50)}`;
          if (seen.has(sourceId)) return;
          seen.add(sourceId);

          tenders.push({
            sourceId, sourcePortal: src.sourcePortal, country: src.country,
            title: text, entity: src.name,
            sector: classifySector(text),
            sourceUrl, sourceType: "multinational",
            donor: src.name,
          });
        });

        // Also try structured listing selectors
        $("table tbody tr, .tender-item, .rfq-item, .procurement-item, article.tender").each((_, el) => {
          const row = $(el);
          const a = row.find("a").first();
          const title = a.text().trim() || row.find("td").eq(1).text().trim();
          if (!title || title.length < 8) return;
          const href = a.attr("href") || "";
          const sourceUrl = href.startsWith("http") ? href : (href ? new URL(href, url).href : url);
          const sourceId = `${src.sourcePortal}_${href.split("/").pop() || title.slice(0,50)}`;
          if (seen.has(sourceId)) return;
          seen.add(sourceId);
          const dateRaw = row.find("td").last().text().trim();
          tenders.push({
            sourceId, sourcePortal: src.sourcePortal, country: src.country,
            title, entity: src.name, sector: classifySector(title),
            deadline: parseDate(dateRaw), sourceUrl,
            sourceType: "multinational", donor: src.name,
          });
        });

        await sleep(2500); // respectful crawl delay for corporate sites
      } catch (err: any) {
        // Many corporate portals block bots — this is expected, log and continue
        console.log(`[${src.name}] ${url}: ${err.message}`);
      }
    }
  }

  console.log(`[Multinationals] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

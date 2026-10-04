/**
 * UNDP Procurement Notices
 * https://procurement-notices.undp.org
 *
 * The UNDP site is a ColdFusion app that server-renders all active notices
 * on the homepage. Each row is an <a class="vacanciesTableLink ... region_RAF ...">
 * element for African notices (region_RAF = UNDP Regional Bureau for Africa).
 *
 * The /rest/procurement API endpoint returns HTTP 500 — not usable.
 * We parse the homepage HTML and filter rows by class "region_RAF".
 */
import axios from "axios";
import { load, parseDate, saveTenders, classifySector, type TenderData } from "./base";

const BASE = "https://procurement-notices.undp.org";

// Map UNDP 3-letter office codes and country names to ISO2
const OFFICE_MAP: Record<string, string> = {
  "BEN": "BJ", "BENIN": "BJ",
  "CIV": "CI", "COTE": "CI", "IVORY": "CI",
  "SEN": "SN", "SENEGAL": "SN",
  "CMR": "CM", "CAMEROON": "CM", "CAMEROUN": "CM",
  "TGO": "TG", "TOGO": "TG",
  "BFA": "BF", "BURKINA": "BF",
  "MLI": "ML", "MALI": "ML",
  "GIN": "GN", "GUINEA": "GN", "GUINEE": "GN",
  "NER": "NE", "NIGER": "NE",
  "COD": "CD", "DRC": "CD",
  "MDG": "MG", "MADAGASCAR": "MG",
  "MAR": "MA", "MOROCCO": "MA",
  "TUN": "TN", "TUNISIA": "TN",
  "KEN": "KE", "KENYA": "KE",
  "TZA": "TZ", "TANZANIA": "TZ",
  "UGA": "UG", "UGANDA": "UG",
  "RWA": "RW", "RWANDA": "RW",
  "MOZ": "MZ", "MOZAMBIQUE": "MZ",
  "ZMB": "ZM", "ZAMBIA": "ZM",
  "ZAF": "ZA",
  "NGA": "NG", "NIGERIA": "NG",
  "GHA": "GH", "GHANA": "GH",
  "ETH": "ET", "ETHIOPIA": "ET",
  "GAB": "GA", "GABON": "GA",
  "SOM": "SO", "SOMALIA": "SO",
  "SDN": "SD", "SUDAN": "SD",
  "SSD": "SS",
  "LBR": "LR", "LIBERIA": "LR",
  "GMB": "GM", "GAMBIA": "GM",
  "ERI": "ER", "ERITREA": "ER",
  "DJI": "DJ", "DJIBOUTI": "DJ",
  "MWI": "MW", "MALAWI": "MW",
  "AGO": "AO", "ANGOLA": "AO",
  "NAM": "NA", "NAMIBIA": "NA",
  "BWA": "BW", "BOTSWANA": "BW",
  "TCD": "TD", "CHAD": "TD",
  "CAF": "CF",
  "EGY": "EG", "EGYPT": "EG",
  "LBY": "LY", "LIBYA": "LY",
  "MRT": "MR", "MAURITANIA": "MR",
  "ZWE": "ZW", "ZIMBABWE": "ZW",
  "COG": "CG", "CONGO": "CG",
};

function parseCountryFromOffice(officeText: string): string {
  const upper = officeText.toUpperCase();
  // Match 3-letter code after "UNDP-" prefix: "UNDP-GIN/GUINEA"
  const codeMatch = upper.match(/UNDP-([A-Z]{3})[/\s-]/);
  if (codeMatch && OFFICE_MAP[codeMatch[1]]) return OFFICE_MAP[codeMatch[1]];
  // Fallback: scan country name keywords
  for (const [key, iso] of Object.entries(OFFICE_MAP)) {
    if (key.length > 3 && upper.includes(key)) return iso;
  }
  return "ZZ";
}

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[UNDP] Scraping UNDP Procurement Notices (Africa)...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  try {
    const res = await axios.get(BASE, {
      timeout: 30_000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
      maxRedirects: 5,
    });

    const $ = load(res.data as string);

    // All notices rendered as <a class="vacanciesTableLink vacanciesTable__row region_RAF ...">
    $("a.vacanciesTableLink").each((_, el) => {
      const row = $(el);
      if (!(row.attr("class") || "").includes("region_RAF")) return;

      const href = row.attr("href") || "";
      if (!href) return;

      // Extract numeric ID from href: view_notice.cfm?notice_id=12345 or view_negotiation.cfm?nego_id=12345
      const idMatch = href.match(/(?:notice_id|nego_id)=(\d+)/);
      const id = idMatch ? idMatch[1] : "";
      if (!id || seen.has(id)) return;
      seen.add(id);

      // Parse cells by their label text
      const getCell = (labelSubstr: string): string => {
        let value = "";
        row.find(".vacanciesTable__cell").each((_, cell) => {
          const label = $(cell).find(".vacanciesTable__cell__label").text().trim().toLowerCase();
          if (label.includes(labelSubstr.toLowerCase())) {
            value = $(cell).find("span").first().text().replace(/\s+/g, " ").trim();
          }
        });
        return value;
      };

      const title = getCell("title");
      if (!title || title.length < 5) return;

      const officeText = getCell("undp office");
      const deadlineRaw = getCell("deadline");
      const refNo = getCell("ref no");

      const sourceUrl = href.startsWith("http") ? href : `${BASE}/${href.replace(/^\//, "")}`;

      tenders.push({
        sourceId: `undp_${id}`,
        sourcePortal: "undp",
        country: parseCountryFromOffice(officeText),
        title: refNo ? `${refNo} - ${title}` : title,
        entity: "UNDP",
        sector: classifySector(title),
        deadline: parseDate(deadlineRaw),
        sourceUrl,
        sourceType: "igo",
        donor: "UNDP",
      });
    });

  } catch (err: any) {
    console.error("[UNDP] Error:", err.message);
  }

  console.log(`[UNDP] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

/**
 * UNGM — United Nations Global Marketplace
 * https://www.ungm.org/Public/Notice
 *
 * UNGM aggregates procurement for UNDP, UNICEF, WFP, WHO, UNHCR, IOM, ILO, FAO, UNOPS, UNFPA, and 30+ UN agencies.
 *
 * The search endpoint accepts a POST and returns HTML rows. We scrape those rows.
 * Endpoint: POST /Public/Notice/Search (returns HTML fragment, not JSON)
 */
import axios from "axios";
import * as cheerio from "cheerio";
import { parseDate, saveTenders, sleep, classifySector, type TenderData } from "./base";

const BASE = "https://www.ungm.org";
const SEARCH_URL = `${BASE}/Public/Notice/Search`;

// Country names as expected by UNGM's country filter
const TARGET_COUNTRIES: Record<string, string> = {
  BJ: "Benin", CI: "Côte d'Ivoire", SN: "Senegal",
  CM: "Cameroon", ZA: "South Africa", NG: "Nigeria", GH: "Ghana",
};

const BASE_PAYLOAD = {
  PageIndex: 0,
  PageSize: 50,
  Title: "", Description: "", Reference: "",
  PublishedFrom: "", PublishedTo: "",
  DeadlineFrom: "", DeadlineTo: "",
  Countries: [] as string[],
  Agencies: [], UNSPSCs: [], NoticeTypes: [],
  SortField: "Deadline", SortAscending: true,
  isPicker: false, IsSustainable: false, IsActive: true,
  NoticeDisplayType: "", NoticeSearchTotalLabelId: "noticeSearchTotal",
  TypeOfCompetitions: [],
};

const HEADERS = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Referer": `${BASE}/Public/Notice`,
  "User-Agent": "Mozilla/5.0 (compatible; TenderAtlas/1.0; +https://github.com/gautiertonongbe/tender-atlas)",
};

async function fetchNotices(countries: string[]): Promise<TenderData[]> {
  const tenders: TenderData[] = [];
  try {
    const res = await axios.post(SEARCH_URL, {
      ...BASE_PAYLOAD,
      Countries: countries,
    }, { headers: HEADERS, timeout: 30_000 });

    const $ = cheerio.load(res.data as string);

    $("div.tableRow[data-noticeid]").each((_, el) => {
      const row = $(el);
      const noticeId = row.attr("data-noticeid") || "";
      if (!noticeId) return;

      const title = row.find(".resultTitle, .ungm-title").first().text().trim();
      if (!title || title.length < 5) return;

      const agency = row.find(".resultAgency").first().text().trim();
      const deadlineText = row.find(".deadline").first().text().trim();
      const countryText = row.find(".resultCountry, .country").first().text().trim();

      // Map country name back to ISO2
      const countryCode = Object.entries(TARGET_COUNTRIES)
        .find(([, name]) => countryText.toLowerCase().includes(name.toLowerCase()))?.[0] || "ZZ";

      tenders.push({
        sourceId: noticeId,
        sourcePortal: "ungm",
        country: countryCode,
        title,
        entity: agency || undefined,
        sector: classifySector(title),
        deadline: parseDate(deadlineText),
        sourceUrl: `${BASE}/Public/Notice/${noticeId}`,
        sourceType: "igo",
        donor: agency || "United Nations",
      });
    });
  } catch (err: any) {
    console.error(`[UNGM] Error (countries=${countries.join(",")}):`, err.message);
  }
  return tenders;
}

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[UNGM] Scraping UN Global Marketplace...");
  const allTenders: TenderData[] = [];
  const seen = new Set<string>();

  // Fetch per-country to get targeted results
  for (const [, name] of Object.entries(TARGET_COUNTRIES)) {
    const batch = await fetchNotices([name]);
    for (const t of batch) {
      if (!seen.has(t.sourceId)) { seen.add(t.sourceId); allTenders.push(t); }
    }
    await sleep(1500);
  }

  // Also fetch without country filter (pan-African/global UN tenders)
  const global = await fetchNotices([]);
  for (const t of global) {
    if (!seen.has(t.sourceId)) { seen.add(t.sourceId); allTenders.push(t); }
  }

  console.log(`[UNGM] Found ${allTenders.length} tenders`);
  return saveTenders(allTenders);
}

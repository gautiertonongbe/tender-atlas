/**
 * EU / EuropeAid — Tenders Electronic Daily (TED) filtered for Africa
 * + Individual EU Delegation pages
 *
 * TED API: https://ted.europa.eu/api/v3.0/notices/search
 * Covers EU-funded tenders in Africa (EDF, Horizon, bilateral development aid).
 * Also covers: ECHO, EIB (European Investment Bank).
 */
import axios from "axios";
import { fetchHtml, load, parseDate, saveTenders, sleep, classifySector, type TenderData } from "./base";

const TED_API = "https://ted.europa.eu/api/v3.0/notices/search";

// EU Delegation pages for our target countries
const EU_DELEGATIONS: Array<{ country: string; url: string }> = [
  { country: "BJ", url: "https://www.eeas.europa.eu/delegations/benin_fr" },
  { country: "CI", url: "https://www.eeas.europa.eu/delegations/cote-d-ivoire_fr" },
  { country: "SN", url: "https://www.eeas.europa.eu/delegations/senegal_fr" },
  { country: "CM", url: "https://www.eeas.europa.eu/delegations/cameroon_en" },
  { country: "ZA", url: "https://www.eeas.europa.eu/delegations/south-africa_en" },
  { country: "NG", url: "https://www.eeas.europa.eu/delegations/nigeria_en" },
  { country: "GH", url: "https://www.eeas.europa.eu/delegations/ghana_en" },
];

const ISO3_MAP: Record<string, string> = {
  BJ:"BEN", CI:"CIV", SN:"SEN", CM:"CMR", ZA:"ZAF", NG:"NGA", GH:"GHA",
};

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[EU] Scraping EU/EuropeAid tenders for Africa...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  // --- TED API search for African countries ---
  for (const [iso2, iso3] of Object.entries(ISO3_MAP)) {
    try {
      const res = await axios.post(TED_API, {
        query: `ND=[${iso3}]`,  // Notice Data country filter
        fields: ["ND","TI","AU","DT","DL","TD","PC","TW","DS"],
        pageNum: 1, pageSize: 25,
        reverseOrder: true, sortField: "ND",
      }, {
        headers: {
          "Content-Type": "application/json", "Accept": "application/json",
          "User-Agent": "TenderAtlas/1.0 (+https://github.com/gautiertonongbe/tender-atlas)",
        },
        timeout: 20_000,
      });

      const notices: any[] = res.data?.notices || [];
      for (const n of notices) {
        const sourceId = String(n.ND || n.id || "");
        if (!sourceId || seen.has(sourceId)) continue;
        seen.add(sourceId);

        const title = Array.isArray(n.TI) ? n.TI[0] : (n.TI || "");
        if (!title) continue;

        tenders.push({
          sourceId, sourcePortal: "ted_eu", country: iso2,
          title, entity: Array.isArray(n.AU) ? n.AU[0] : n.AU,
          sector: classifySector(title),
          deadline: parseDate(n.DL || n.DT),
          publishedAt: parseDate(n.DS),
          sourceUrl: `https://ted.europa.eu/udl?uri=TED:NOTICE:${sourceId}:TEXT:EN:HTML`,
          sourceType: "igo",
          donor: "European Union",
        });
      }
      await sleep(1500);
    } catch (err: any) {
      console.error(`[EU/TED] Error (${iso2}):`, err.message);
    }
  }

  // --- EU Delegation pages (HTML fallback) ---
  for (const { country, url } of EU_DELEGATIONS) {
    try {
      const html = await fetchHtml(url);
      const $ = load(html);

      // EU delegation pages typically have a "Calls for tenders" section
      $(".tender-item, .procurement-notice, article.call, .views-row").each((_, el) => {
        const row = $(el);
        const a = row.find("a").first();
        const title = a.text().trim();
        if (!title || title.length < 5) return;
        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `https://www.eeas.europa.eu${href}`;
        const sourceId = href.split("/").pop() || title.slice(0, 50);
        if (seen.has(sourceId)) return;
        seen.add(sourceId);
        const dateRaw = row.find(".date, time, .deadline").text().trim();
        tenders.push({
          sourceId, sourcePortal: "eu_delegation", country,
          title, deadline: parseDate(dateRaw),
          sourceUrl, sourceType: "embassy",
          donor: "European Union",
        });
      });
      await sleep(2000);
    } catch (err: any) {
      console.error(`[EU Delegation] Error (${country}):`, err.message);
    }
  }

  console.log(`[EU] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

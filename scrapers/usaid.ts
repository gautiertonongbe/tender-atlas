/**
 * USAID — US Agency for International Development
 * Procurement notices via SAM.gov API (US Federal contracting system)
 * + USAID-specific pages
 *
 * SAM.gov API: https://api.sam.gov/opportunities/v2/search
 * Requires a free API key from api.data.gov — set in SAMGOV_API_KEY env var.
 * If no key, falls back to HTML scraping of USAID country pages.
 */
import axios from "axios";
import { fetchHtml, load, parseDate, saveTenders, sleep, classifySector, type TenderData } from "./base";

const SAM_API = "https://api.sam.gov/opportunities/v2/search";
const USAID_BASE = "https://www.usaid.gov";

// USAID country mission pages for Africa
const USAID_MISSIONS: Array<{ country: string; url: string }> = [
  { country: "BJ", url: `${USAID_BASE}/benin` },
  { country: "CI", url: `${USAID_BASE}/cote-divoire` },
  { country: "SN", url: `${USAID_BASE}/senegal` },
  { country: "CM", url: `${USAID_BASE}/cameroon` },
  { country: "ZA", url: `${USAID_BASE}/south-africa` },
  { country: "NG", url: `${USAID_BASE}/nigeria` },
  { country: "GH", url: `${USAID_BASE}/ghana` },
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[USAID] Scraping USAID procurement...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  // --- Try SAM.gov API if key is available ---
  const samKey = process.env.SAMGOV_API_KEY;
  if (samKey) {
    for (const { country, url: _ } of USAID_MISSIONS) {
      try {
        const res = await axios.get(SAM_API, {
          params: {
            api_key: samKey,
            ptype: "o,p,r,s,g,i,k,a",  // all opportunity types
            deptname: "AGENCY FOR INTERNATIONAL DEVELOPMENT",
            limit: 25,
            offset: 0,
            postedFrom: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0].replace(/-/g,"/"),
          },
          headers: { "User-Agent": "TenderAtlas/1.0 (+https://github.com/gautiertonongbe/tender-atlas)" },
          timeout: 20_000,
        });

        const opps: any[] = res.data?.opportunitiesData || [];
        for (const o of opps) {
          const sourceId = o.id || o.noticeId || "";
          if (!sourceId || seen.has(sourceId)) continue;
          seen.add(sourceId);
          const title = o.title || o.subject || "";
          if (!title) continue;
          tenders.push({
            sourceId, sourcePortal: "usaid_sam", country,
            title, entity: o.officeAddress?.city || "USAID",
            sector: classifySector(title + " " + (o.naicsCode || "")),
            deadline: parseDate(o.responseDeadLine),
            publishedAt: parseDate(o.postedDate),
            sourceUrl: o.uiLink || `https://sam.gov/opp/${sourceId}/view`,
            sourceType: "igo", donor: "USAID",
          });
        }
        await sleep(1000);
      } catch (err: any) {
        console.error(`[USAID/SAM] Error (${country}):`, err.message);
      }
    }
  }

  // --- Fallback: scrape USAID country mission pages ---
  if (tenders.length === 0) {
    for (const { country, url } of USAID_MISSIONS) {
      try {
        const html = await fetchHtml(url + "/procurement");
        const $ = load(html);
        $("a, .tender, .rfp, .solicitation").each((_, el) => {
          const a = $(el).is("a") ? $(el) : $(el).find("a").first();
          const title = a.text().trim();
          if (!title || title.length < 10) return;
          const href = a.attr("href") || "";
          if (!href.includes("rfp") && !href.includes("rfq") && !href.includes("bid") && !href.includes("tender") && !href.includes("solicitation")) return;
          const sourceUrl = href.startsWith("http") ? href : `${USAID_BASE}${href}`;
          const sourceId = href.split("/").pop() || title.slice(0, 50);
          if (seen.has(sourceId)) return;
          seen.add(sourceId);
          tenders.push({
            sourceId, sourcePortal: "usaid", country,
            title, sourceUrl, sourceType: "igo", donor: "USAID",
          });
        });
        await sleep(2000);
      } catch (err: any) {
        console.error(`[USAID mission] Error (${country}):`, err.message);
      }
    }
  }

  console.log(`[USAID] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

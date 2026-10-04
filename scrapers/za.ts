/**
 * South Africa — National Treasury eTender Publication Portal
 * JSON API: https://www.etenders.gov.za/Home/tenderopportunities
 *
 * The portal exposes a public JSON endpoint that returns all tenders.
 * Fields: id, tender_No, description, category, type, organ_of_State,
 *         status, closing_Date, date_Published, province
 */
import axios from "axios";
import { saveTenders, classifySector, type TenderData } from "./base";

const BASE = "https://www.etenders.gov.za";
const API  = `${BASE}/Home/tenderopportunities`;

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[ZA] Scraping eTenders South Africa (JSON API)...");
  const tenders: TenderData[] = [];

  try {
    const res = await axios.get(API, {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (compatible; TenderAtlas/1.0; +https://github.com/gautiertonongbe/tender-atlas)",
        "Referer": BASE,
      },
      timeout: 30_000,
    });

    const notices: any[] = Array.isArray(res.data) ? res.data : [];
    const seen = new Set<string>();

    for (const n of notices) {
      // Only include open/advertised tenders
      const status = (n.status || "").toLowerCase();
      if (status === "closed" || status === "cancelled" || status === "awarded") continue;

      const sourceId = String(n.id || n.tender_No || "");
      if (!sourceId || seen.has(sourceId)) continue;
      seen.add(sourceId);

      const title = n.description || n.tender_No || "";
      if (!title || title.length < 5) continue;

      tenders.push({
        sourceId,
        sourcePortal: "etenders_za",
        country: "ZA",
        title,
        entity: n.organ_of_State || n.departments || undefined,
        sector: classifySector(title + " " + (n.category || "")),
        deadline: n.closing_Date ? n.closing_Date.split("T")[0] : undefined,
        publishedAt: n.date_Published ? n.date_Published.split("T")[0] : undefined,
        currency: "ZAR",
        sourceUrl: `${BASE}/Home/tenderOpportunity/${n.id}`,
        sourceType: "government",
      });
    }
  } catch (err: any) {
    console.error("[ZA] Error:", err.message);
  }

  console.log(`[ZA] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

/**
 * World Bank — active projects with procurement components
 * API: https://search.worldbank.org/api/v2/projects
 *
 * The old /api/v2/procurement endpoint is retired (404).
 * We now use the Projects API to find active World Bank-financed projects
 * in target African countries and link to their procurement notices page.
 */
import axios from "axios";
import { parseDate, saveTenders, sleep, classifySector, type TenderData } from "./base";

const PROJECTS_API = "https://search.worldbank.org/api/v2/projects";

const TARGET_ISO2: Record<string, string> = {
  BJ: "BJ", CI: "CI", SN: "SN", CM: "CM",
  ZA: "ZA", NG: "NG", GH: "GH",
  KE: "KE", ET: "ET", TZ: "TZ", UG: "UG",
  ML: "ML", BF: "BF", NE: "NE", TG: "TG",
  MZ: "MZ", ZM: "ZM", RW: "RW",
};

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[WorldBank] Scraping World Bank active projects...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  for (const [iso2] of Object.entries(TARGET_ISO2)) {
    try {
      const res = await axios.get(PROJECTS_API, {
        params: {
          format: "json",
          countrycode_exact: iso2,
          status_exact: "Active",
          rows: 50,
          os: 0,
          fl: "id,project_name,totalamt,borrower,boardapprovaldate,url,mjtheme_namecode,country_namecode",
        },
        headers: { "User-Agent": "TenderAtlas/1.0 (+https://github.com/gautiertonongbe/tender-atlas)" },
        timeout: 20_000,
      });

      const projects: Record<string, any> = res.data?.projects || {};

      for (const [pid, p] of Object.entries(projects)) {
        if (pid === "facets" || typeof p !== "object") continue;
        const sourceId = String(p.id || pid);
        if (!sourceId || seen.has(sourceId)) continue;
        seen.add(sourceId);

        const title = p.project_name || "";
        if (!title) continue;

        // World Bank projects link to a procurement notices sub-page
        const projectUrl = p.url || `https://projects.worldbank.org/en/projects-operations/project-detail/${sourceId}`;
        const procurementUrl = `https://projects.worldbank.org/en/projects-operations/procurement/noticeDetail?id=${sourceId}`;

        const sectorHint = Array.isArray(p.mjtheme_namecode)
          ? p.mjtheme_namecode.map((t: any) => t.name || "").join(" ")
          : "";

        tenders.push({
          sourceId,
          sourcePortal: "worldbank",
          country: iso2,
          title: `[WB Project] ${title}`,
          description: `World Bank-financed active project. Procurement notices available at the project page.`,
          entity: p.borrower || undefined,
          sector: classifySector(title + " " + sectorHint),
          budgetLocal: p.totalamt ? parseInt(String(p.totalamt).replace(/,/g, "")) : undefined,
          currency: "USD",
          publishedAt: parseDate(p.boardapprovaldate),
          sourceUrl: procurementUrl,
          sourceType: "igo",
          donor: "World Bank",
        });
      }

      await sleep(800);
    } catch (err: any) {
      console.error(`[WorldBank] Error (${iso2}):`, err.message);
    }
  }

  console.log(`[WorldBank] Found ${tenders.length} projects`);
  return saveTenders(tenders);
}

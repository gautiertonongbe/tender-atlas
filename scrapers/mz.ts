/**
 * Mozambique — UFSA (Unidade Funcional de Supervisão das Aquisições)
 * Portal: https://ufsa.gov.mz
 *
 * UFSA publishes ~200 active tenders on their homepage inside a scrolling
 * marquee. Each entry has: type+ref, object/title, entity, deadline, link.
 * The page uses Latin-1 encoding and has a self-signed SSL certificate.
 */
import axios from "axios";
import https from "https";
import { saveTenders, classifySector, BROWSER_UA, type TenderData } from "./base";

// UFSA uses a self-signed certificate — bypass SSL verification
const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });

const BASE = "https://ufsa.gov.mz";

// Pattern: CONCURSO TYPE: REF, lbl_objecto title, entity, VALIDADE date, href
// \s* after each <br> handles newlines present in the real HTTP response
const TENDER_RE = /CONCURSO[^<]*?:\s*([A-Z0-9/. -]{3,80})<br>\s*<label class=lbl_objecto>(.*?)<\/label><br>\s*([^<\r\n]+)<br>\s*VALIDADE:\s*<u>(\d{4}-\d{2}-\d{2})<\/u><br>\s*<a href='(concurso_detalhes[^']+)'/gi;

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[MZ] Scraping Mozambique UFSA...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  try {
    const res = await axios.get(BASE, {
      timeout: 30_000,
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      maxRedirects: 5,
      responseEncoding: "latin1",
      httpsAgent: HTTPS_AGENT,
    });

    const html: string = res.data;
    let m: RegExpExecArray | null;
    TENDER_RE.lastIndex = 0; // reset in case scraper is called multiple times in the same process

    while ((m = TENDER_RE.exec(html)) !== null) {
      const [, ref, rawTitle, rawEntity, deadline, hrefPath] = m;
      const title = rawTitle.replace(/<[^>]+>/g, "").trim();
      if (!title || title.length < 5) continue;

      const sourceId = `mz_${ref.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 80)}`;
      if (seen.has(sourceId)) continue;
      seen.add(sourceId);

      const entity = rawEntity.replace(/<[^>]+>/g, "").trim();

      tenders.push({
        sourceId,
        sourcePortal: "ufsa_mz",
        country: "MZ",
        title: `${ref.trim()} - ${title}`,
        entity: entity.length > 3 ? entity : undefined,
        sector: classifySector(title),
        deadline,
        sourceUrl: `${BASE}/${hrefPath}`,
        sourceType: "government",
        currency: "MZN",
      });
    }
  } catch (err: any) {
    console.error("[MZ] Error:", err.message);
  }

  console.log(`[MZ] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

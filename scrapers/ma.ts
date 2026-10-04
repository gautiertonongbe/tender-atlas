/**
 * Morocco — Portail des Marchés Publics (marchespublics.gov.ma)
 * Portal: https://www.marchespublics.gov.ma
 *
 * Morocco has one of the best-structured procurement portals in Africa.
 * The main PRADO portal requires JavaScript to render tender lists.
 * We scrape the BDC (Bons de commande) sub-portal which is server-rendered,
 * plus the ONEE (energy/water) and ONCF (rail) sub-portals.
 */
import axios from "axios";
import { load, parseDate, saveTenders, sleep, classifySector, BROWSER_UA, type TenderData } from "./base";

const BASE = "https://www.marchespublics.gov.ma";
const BDC_BASE = "https://www.marchespublics.gov.ma/bdc";

const BROWSER_HEADERS = {
  "User-Agent": BROWSER_UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
};

async function fetchWithBrowserUA(url: string): Promise<string> {
  const res = await axios.get(url, {
    timeout: 30_000,
    headers: BROWSER_HEADERS,
    maxRedirects: 5,
  });
  return res.data as string;
}

// Sub-portals that have server-rendered HTML
const SUBPORTALS: Array<{ url: string; portal: string; entity: string }> = [
  { url: "https://www.onee.ma/fr/appels-offres", portal: "onee_ma", entity: "ONEE" },
  { url: "https://www.oncf.ma/fr/appels-doffres", portal: "oncf_ma", entity: "ONCF" },
  { url: "https://www.onda.ma/fr/appels-doffres", portal: "onda_ma", entity: "ONDA" },
  { url: "https://www.cdg.ma/fr/nos-marches", portal: "cdg_ma", entity: "CDG" },
  { url: "https://www.ram.ma/fr/appels-offres", portal: "ram_ma", entity: "Royal Air Maroc" },
  { url: "https://www.ancfcc.gov.ma/fr/appels-doffres", portal: "ancfcc_ma", entity: "ANCFCC" },
];

export async function scrape(): Promise<{ inserted: number; skipped: number }> {
  console.log("[MA] Scraping Morocco marchespublics.gov.ma...");
  const tenders: TenderData[] = [];
  const seen = new Set<string>();

  // BDC sub-portal (Bons de commande) — server-rendered HTML listing
  try {
    const html = await fetchWithBrowserUA(`${BDC_BASE}/entreprise/consultation/`);
    const $ = load(html);

    // The BDC portal renders a table of tenders with data-label attributes
    $("tr[data-href], tbody tr, .consultation-row").each((_, el) => {
      const row = $(el);
      const href = row.attr("data-href") || "";
      const cells = row.find("td");

      // Try inline link too
      const a = row.find("a[href]").first();
      const linkHref = href || a.attr("href") || "";
      if (!linkHref || linkHref === "#") return;

      const title = cells.filter("[data-label='Objet']").text().trim() ||
        cells.eq(1).text().trim() ||
        a.text().trim();
      if (!title || title.length < 5) return;

      const sourceUrl = linkHref.startsWith("http") ? linkHref : `${BDC_BASE}${linkHref}`;
      const sourceId = `ma_bdc_${linkHref.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
      if (seen.has(sourceId)) return;
      seen.add(sourceId);

      const refNum = cells.filter("[data-label='Référence']").text().trim() || cells.eq(0).text().trim();
      const entity = cells.filter("[data-label='Acheteur']").text().trim() || cells.eq(2).text().trim();
      const deadlineRaw = cells.filter("[data-label='Date limite']").text().trim() ||
        cells.eq(3).text().trim();

      tenders.push({
        sourceId,
        sourcePortal: "marchespublics_ma",
        country: "MA",
        title: refNum ? `${refNum} - ${title}` : title,
        entity: entity || undefined,
        sector: classifySector(title),
        deadline: parseDate(deadlineRaw),
        sourceUrl,
        sourceType: "government",
        currency: "MAD",
      });
    });
    await sleep(1500);
  } catch (err: any) {
    console.error("[MA] BDC portal error:", err.message);
  }

  // Sub-portals
  for (const { url, portal, entity } of SUBPORTALS) {
    try {
      const html = await fetchWithBrowserUA(url);
      const $ = load(html);
      const baseUrl = new URL(url).origin;

      $("article, .post, .appel-offres, .views-row, table tbody tr, .tender-item, li.offre").each((_, el) => {
        const row = $(el);
        const a = row.find("a").filter((_, link) => {
          const href = $(link).attr("href") || "";
          return href.length > 3 && !href.startsWith("#") && !href.includes("javascript");
        }).first();

        if (!a.length) return;
        const title = (a.attr("title") || a.text() ||
          row.find("h2, h3, h4, .title, .entry-title").first().text()).trim();
        if (!title || title.length < 5) return;

        const href = a.attr("href") || "";
        const sourceUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
        const sourceId = `${portal}_${href.split("/").filter(Boolean).pop() || title.slice(0, 80)}`;
        if (seen.has(sourceId)) return;
        seen.add(sourceId);

        const dateEl = row.find("time, .date, .entry-date, .date-publication").first();
        const dateRaw = dateEl.attr("datetime") || dateEl.text().trim();

        tenders.push({
          sourceId,
          sourcePortal: portal,
          country: "MA",
          title,
          entity,
          sector: classifySector(title),
          publishedAt: parseDate(dateRaw),
          sourceUrl,
          sourceType: "government",
          currency: "MAD",
        });
      });
      await sleep(1000);
    } catch (err: any) {
      console.error(`[MA] Sub-portal ${portal} error:`, err.message);
    }
  }

  console.log(`[MA] Found ${tenders.length} tenders`);
  return saveTenders(tenders);
}

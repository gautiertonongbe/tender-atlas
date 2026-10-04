import axios from "axios";
import * as cheerio from "cheerio";
import { randomUUID } from "crypto";
import { classifySector } from "@/lib/constants";
export { classifySector };
import mysql from "mysql2/promise";

export interface TenderData {
  sourceId:     string;
  sourcePortal: string;
  country:      string;
  title:        string;
  description?: string;
  entity?:      string;
  sector?:      string;
  budgetLocal?: number;
  currency?:    string;
  deadline?:    string; // YYYY-MM-DD
  publishedAt?: string; // YYYY-MM-DD
  sourceUrl?:   string;
  rawHtml?:     string;
  sourceType?:  string; // government | igo | ngo | embassy | multinational
  donor?:       string; // World Bank, EU, USAID, UNDP...
}

export const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export const BOT_UA = "TenderAtlas/1.0 (+https://github.com/gautiertonongbe/tender-atlas) procurement-intelligence-bot";

export interface FetchOptions {
  userAgent?: string;
  rejectUnauthorized?: boolean;
  extraHeaders?: Record<string, string>;
}

export async function fetchHtml(url: string, retries = 3, opts: FetchOptions = {}): Promise<string> {
  const { userAgent = BOT_UA, rejectUnauthorized = true, extraHeaders = {} } = opts;
  for (let i = 0; i < retries; i++) {
    try {
      const axiosOpts: any = {
        timeout: 30_000,
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html,application/xhtml+xml,*/*",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          ...extraHeaders,
        },
        maxRedirects: 5,
      };
      if (!rejectUnauthorized) {
        const https = await import("https");
        axiosOpts.httpsAgent = new https.Agent({ rejectUnauthorized: false });
      }
      const res = await axios.get(url, axiosOpts);
      return res.data as string;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await sleep(2000 * (i + 1));
    }
  }
  throw new Error("fetchHtml: max retries exceeded");
}

export function load(html: string) {
  return cheerio.load(html);
}

/** Parse a date string from various formats to YYYY-MM-DD */
export function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/\s+/g, " ");

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;

  // YYYY-MM-DD
  const ymd = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  // DD Month YYYY (French/English month names)
  const months: Record<string, string> = {
    janvier:"01", février:"02", mars:"03", avril:"04", mai:"05", juin:"06",
    juillet:"07", août:"08", septembre:"09", octobre:"10", novembre:"11", décembre:"12",
    january:"01", february:"02", march:"03", april:"04", may:"05", june:"06",
    july:"07", august:"08", september:"09", october:"10", november:"11", december:"12",
  };
  const dmon = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (dmon) {
    const m = months[dmon[2].toLowerCase()];
    if (m) return `${dmon[3]}-${m}-${dmon[1].padStart(2,"0")}`;
  }

  return undefined;
}

/** Parse budget string like "50 000 000 FCFA" or "NGN 25,000,000" */
export function parseBudget(raw: string | undefined): { amount?: number; currency?: string } {
  if (!raw) return {};
  const currencies: Record<string, string> = {
    fcfa:"XOF", xof:"XOF", cfa:"XOF", ngn:"NGN", naira:"NGN",
    ghs:"GHS", cedis:"GHS", zar:"ZAR", rand:"ZAR",
  };
  const currMatch = raw.toLowerCase().match(/(fcfa|xof|cfa|ngn|naira|ghs|cedis|zar|rand)/i);
  const currency = currMatch ? currencies[currMatch[1].toLowerCase()] : undefined;
  const numStr = raw.replace(/[^\d]/g, "");
  const amount = numStr ? parseInt(numStr, 10) : undefined;
  return { amount: amount && amount > 0 ? amount : undefined, currency };
}

/** Upsert tenders into database */
export async function saveTenders(tenders: TenderData[]): Promise<{ inserted: number; skipped: number }> {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true },
  });

  let inserted = 0, skipped = 0;

  for (const t of tenders) {
    const sector = t.sector || classifySector((t.title || "") + " " + (t.description || ""));
    try {
      await conn.execute(
        `INSERT INTO tenders
           (id, source_id, source_portal, country, title, description, entity, sector,
            budget_local, currency, deadline, published_at, source_url, source_type, donor, status, raw_html)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
         ON DUPLICATE KEY UPDATE
           title=VALUES(title), description=VALUES(description), entity=VALUES(entity),
           deadline=VALUES(deadline), sector=VALUES(sector), source_url=VALUES(source_url),
           source_type=VALUES(source_type), donor=VALUES(donor),
           updated_at=CURRENT_TIMESTAMP`,
        [
          randomUUID(), t.sourceId, t.sourcePortal, t.country,
          t.title.slice(0, 1000), (t.description || "").slice(0, 5000),
          (t.entity?.slice(0, 499) ?? null), sector,
          (t.budgetLocal ?? null), (t.currency ?? null),
          (t.deadline ?? null), (t.publishedAt ?? null),
          (t.sourceUrl?.slice(0, 2000) ?? null),
          (t.sourceType ?? null), (t.donor?.slice(0, 200) ?? null),
          (t.rawHtml || "").slice(0, 50000),
        ]
      );
      inserted++;
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") { skipped++; continue; }
      console.error(`Failed to save tender ${t.sourceId}:`, err.message);
      skipped++;
    }
  }

  await conn.end();
  return { inserted, skipped };
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

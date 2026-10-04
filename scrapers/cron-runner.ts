/**
 * Cron runner — called by instrumentation.ts.
 * Separated so it can also be run standalone via: npx tsx scrapers/run.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { scrape as bj }             from "./bj";
import { scrape as ci }             from "./ci";
import { scrape as sn }             from "./sn";
import { scrape as cm }             from "./cm";
import { scrape as tg }             from "./tg";
import { scrape as bf }             from "./bf";
import { scrape as ml }             from "./ml";
import { scrape as gn }             from "./gn";
import { scrape as ne }             from "./ne";
import { scrape as cd }             from "./cd";
import { scrape as mg }             from "./mg";
import { scrape as ma }             from "./ma";
import { scrape as tn }             from "./tn";
import { scrape as mz }             from "./mz";
import { scrape as ke }             from "./ke";
import { scrape as rw }             from "./rw";
import { scrape as tz }             from "./tz";
import { scrape as ug }             from "./ug";
import { scrape as za }             from "./za";
import { scrape as ng }             from "./ng";
import { scrape as gh }             from "./gh";
import { scrape as ungm }           from "./ungm";
import { scrape as afdb }           from "./afdb";
import { scrape as worldbank }      from "./worldbank";
import { scrape as eu }             from "./eu_africa";
import { scrape as usaid }          from "./usaid";
import { scrape as who }            from "./who";
import { scrape as ifad }           from "./ifad";
import { scrape as undp }           from "./undp";
import { scrape as isdb }           from "./isdb";
import { scrape as eib }            from "./eib";
import { scrape as multinationals } from "./multinationals";
import { scrape as embassies }      from "./embassies";

const ALL = [
  // OHADA francophone
  { key: "BJ", fn: bj },
  { key: "CI", fn: ci },
  { key: "SN", fn: sn },
  { key: "CM", fn: cm },
  { key: "TG", fn: tg },
  { key: "BF", fn: bf },
  { key: "ML", fn: ml },
  { key: "GN", fn: gn },
  { key: "NE", fn: ne },
  { key: "CD", fn: cd },   // DR Congo
  // North Africa
  { key: "MA", fn: ma },   // Morocco
  { key: "TN", fn: tn },   // Tunisia
  // East & Southern Africa
  { key: "KE", fn: ke },
  { key: "RW", fn: rw },
  { key: "TZ", fn: tz },   // Tanzania
  { key: "UG", fn: ug },   // Uganda
  { key: "MZ", fn: mz },   // Mozambique
  { key: "MG", fn: mg },   // Madagascar
  { key: "ZA", fn: za },
  { key: "NG", fn: ng },
  { key: "GH", fn: gh },
  // International organizations
  { key: "UNGM",          fn: ungm },
  { key: "AfDB",          fn: afdb },
  { key: "WorldBank",     fn: worldbank },
  { key: "WHO",           fn: who },
  { key: "IFAD",          fn: ifad },
  { key: "EU",            fn: eu },
  { key: "USAID",         fn: usaid },
  { key: "UNDP",          fn: undp },   // NEW — largest UN procurement agency
  { key: "IsDB",          fn: isdb },   // NEW — Islamic Development Bank
  { key: "EIB",           fn: eib },    // NEW — European Investment Bank
  { key: "Multinationals",fn: multinationals },
  { key: "Embassies",     fn: embassies },
];

export default async function run(sources?: string[]) {
  const toRun = sources
    ? ALL.filter(s => sources.includes(s.key))
    : ALL;

  console.log(`\nTenderAtlas scraper — ${toRun.length} sources`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  let totalNew = 0;
  const summary: Record<string, { inserted: number; skipped: number; error?: string }> = {};

  for (const { key, fn } of toRun) {
    try {
      const r = await fn();
      summary[key] = r;
      totalNew += r.inserted;
      console.log(`[${key}] +${r.inserted} new, ${r.skipped} skipped\n`);
    } catch (err: any) {
      summary[key] = { inserted: 0, skipped: 0, error: err.message };
      console.error(`[${key}] FAILED: ${err.message}\n`);
    }
  }

  console.log("Summary:");
  for (const [k, r] of Object.entries(summary)) {
    console.log(`  ${k.padEnd(16)} ${r.error ? `ERROR: ${r.error.slice(0, 60)}` : `+${r.inserted} new`}`);
  }
  console.log(`  TOTAL NEW: ${totalNew}\n`);

  return { totalNew, summary };
}

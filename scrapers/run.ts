/**
 * Standalone scraper entrypoint.
 *
 * Usage:
 *   npx tsx scrapers/run.ts                        — run all
 *   npx tsx scrapers/run.ts --source UNGM,AfDB     — specific sources
 *   npx tsx scrapers/run.ts --country BJ           — alias for --source BJ
 *
 * Daily cron (via instrumentation.ts): 06:00 UTC
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import run from "./cron-runner";

async function main() {
  const args = process.argv.slice(2);

  const sourceIdx = args.indexOf("--source");
  const countryIdx = args.indexOf("--country");

  let sources: string[] | undefined;
  if (sourceIdx !== -1) sources = args[sourceIdx + 1].split(",").map(s => s.trim());
  else if (countryIdx !== -1) sources = [args[countryIdx + 1].trim()];

  await run(sources);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });

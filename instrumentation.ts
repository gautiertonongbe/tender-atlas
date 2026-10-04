/**
 * Next.js Instrumentation — runs once when the server starts.
 * Schedules daily scraper runs using node-cron.
 * This keeps the cron inside the web process: no separate Railway cron service needed.
 *
 * Schedule: 06:00 UTC every day (quiet hours for most African time zones)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Only run in production or when explicitly enabled in dev
  if (process.env.NODE_ENV !== "production" && !process.env.ENABLE_CRON) return;

  try {
    const cron = await import("node-cron");

    cron.schedule("0 6 * * *", async () => {
      console.log(`[Cron] Starting daily scrape at ${new Date().toISOString()}`);
      try {
        // Dynamic import so scrapers don't load at build time
        const { default: run } = await import("./scrapers/cron-runner");
        await run();
      } catch (err: any) {
        console.error("[Cron] Scrape failed:", err.message);
      }
    });

    console.log("[Cron] Daily scraper scheduled for 06:00 UTC");
  } catch (err: any) {
    console.error("[Cron] Failed to initialize scheduler:", err.message);
  }
}

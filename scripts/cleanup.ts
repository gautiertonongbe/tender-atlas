/**
 * Daily cleanup — runs AFTER scrapers to:
 * 1. Mark tenders as 'closed' when their deadline has passed
 * 2. Hard-delete tenders that closed more than 90 days ago (keep DB lean)
 *
 * Railway cron schedule: 0 7 * * *  (07:00 UTC daily, before the digest at 08:00)
 * Usage: npx tsx scripts/cleanup.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });

  // 1. Mark expired tenders as closed
  const [closed] = await conn.execute<any>(
    `UPDATE tenders SET status = 'closed'
     WHERE status = 'open' AND deadline IS NOT NULL AND deadline < CURDATE()`
  );
  console.log(`Marked closed: ${(closed as any).affectedRows} tenders`);

  // 2. Hard-delete tenders closed more than 90 days ago
  const [deleted] = await conn.execute<any>(
    `DELETE FROM tenders
     WHERE status = 'closed'
     AND deadline IS NOT NULL
     AND deadline < DATE_SUB(CURDATE(), INTERVAL 90 DAY)`
  );
  console.log(`Deleted old closed tenders: ${(deleted as any).affectedRows}`);

  // 3. Also delete open tenders with no deadline that are older than 60 days
  //    (these are likely expired but portal didn't publish a deadline)
  const [stale] = await conn.execute<any>(
    `DELETE FROM tenders
     WHERE deadline IS NULL
     AND created_at < DATE_SUB(NOW(), INTERVAL 60 DAY)`
  );
  console.log(`Deleted stale no-deadline tenders: ${(stale as any).affectedRows}`);

  await conn.end();
  console.log("Cleanup complete.");
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });

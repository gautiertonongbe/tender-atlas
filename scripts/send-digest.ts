/**
 * Weekly digest sender — run every Monday at 08:00 UTC
 * Railway cron: 0 8 * * 1
 *
 * Usage: npx tsx scripts/send-digest.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mysql from "mysql2/promise";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function run() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });

  // Fetch all confirmed subscribers
  const [subscribers] = await conn.execute<any[]>(
    "SELECT * FROM alert_subscriptions WHERE confirmed = 1"
  );

  console.log(`Sending digest to ${subscribers.length} subscribers...`);
  let sent = 0, failed = 0;

  for (const sub of subscribers) {
    const countries: string[] = JSON.parse(sub.countries || "[]");
    const sectors:   string[] = JSON.parse(sub.sectors   || "[]");

    // Build WHERE clause for this subscriber
    const countryPlaceholders = countries.map(() => "?").join(",");
    let query = `SELECT id, title, entity, country, sector, deadline, source_url
                 FROM tenders
                 WHERE status = 'open'
                 AND country IN (${countryPlaceholders})
                 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 ORDER BY created_at DESC LIMIT 10`;
    const params: any[] = [...countries];

    if (sectors.length > 0) {
      const sectorPlaceholders = sectors.map(() => "?").join(",");
      query = `SELECT id, title, entity, country, sector, deadline, source_url
               FROM tenders
               WHERE status = 'open'
               AND country IN (${countryPlaceholders})
               AND sector IN (${sectorPlaceholders})
               AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
               ORDER BY created_at DESC LIMIT 10`;
      params.push(...sectors);
    }

    const [tenders] = await conn.execute<any[]>(query, params);

    if (tenders.length === 0) continue; // skip if no matching tenders this week

    const tenderRows = tenders.map(t => {
      const deadline = t.deadline ? new Date(t.deadline).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "TBD";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E2E8F0">
            <a href="${BASE}/tenders/${t.id}" style="color:#2563EB;font-weight:600;font-size:13px;text-decoration:none">
              ${t.title.slice(0, 90)}${t.title.length > 90 ? "..." : ""}
            </a>
            <br>
            <span style="color:#475569;font-size:12px">${t.country} · ${t.sector || "General"} · Deadline: ${deadline}</span>
          </td>
        </tr>`;
    }).join("");

    const unsubUrl = `${BASE}/api/alerts/confirm?unsub=${sub.unsub_token}`;

    try {
      await resend.emails.send({
        from: `TenderAtlas <${process.env.FROM_EMAIL || "alerts@example.com"}>`,
        to: sub.email,
        subject: `${tenders.length} new tender${tenders.length > 1 ? "s" : ""} this week — ${countries.join(", ")}`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#0F172A;font-size:18px;margin-bottom:4px">Your weekly tender digest</h2>
            <p style="color:#475569;font-size:13px;margin-bottom:20px">${tenders.length} new tender${tenders.length > 1 ? "s" : ""} matching your alerts this week</p>
            <table style="width:100%;border-collapse:collapse">
              ${tenderRows}
            </table>
            <p style="color:#94A3B8;font-size:11px;margin-top:20px">
              <a href="${BASE}/tenders" style="color:#2563EB">Browse all tenders</a> ·
              <a href="${unsubUrl}" style="color:#94A3B8">Unsubscribe</a>
            </p>
          </div>
        `,
      });

      await conn.execute("UPDATE alert_subscriptions SET last_digest_at = NOW() WHERE id = ?", [sub.id]);
      sent++;
    } catch (err: any) {
      console.error(`Failed to send to ${sub.email}:`, err.message);
      failed++;
    }
  }

  await conn.end();
  console.log(`Digest complete: sent=${sent} failed=${failed} skipped=${subscribers.length - sent - failed}`);
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });

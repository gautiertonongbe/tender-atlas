import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, countries, sectors } = body;

    if (!email || !Array.isArray(countries) || countries.length === 0) {
      return NextResponse.json({ error: "email and at least one country are required" }, { status: 400 });
    }

    const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
    const id = randomUUID();
    const confirmToken = randomUUID().replace(/-/g, "");
    const unsubToken   = randomUUID().replace(/-/g, "");

    await conn.execute(
      `INSERT INTO alert_subscriptions (id, email, name, company, countries, sectors, confirm_token, unsub_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), company=VALUES(company),
         countries=VALUES(countries), sectors=VALUES(sectors),
         confirm_token=VALUES(confirm_token), confirmed=0`,
      [id, email, name || null, company || null,
       JSON.stringify(countries), JSON.stringify(sectors || []),
       confirmToken, unsubToken]
    );
    await conn.end();

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const confirmUrl = `${base}/api/alerts/confirm?token=${confirmToken}`;

    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: `TenderAtlas <${process.env.FROM_EMAIL || "alerts@example.com"}>`,
      to: email,
      subject: "Confirm your TenderAtlas alerts",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0F172A;font-size:20px;margin-bottom:8px">Confirm your alerts</h2>
          <p style="color:#334155;font-size:14px;line-height:1.6">
            Hi ${name || "there"},<br><br>
            You subscribed to weekly procurement tender alerts for:
            <strong>${countries.join(", ")}</strong>${sectors?.length ? ` in sectors: ${sectors.join(", ")}` : ""}.
          </p>
          <p style="color:#334155;font-size:14px;line-height:1.6">Click below to confirm and start receiving alerts every Monday.</p>
          <a href="${confirmUrl}" style="display:inline-block;background:#2563EB;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
            Confirm my alerts
          </a>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Alert subscription error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

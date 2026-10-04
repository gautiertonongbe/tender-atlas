import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/alerts?error=invalid", req.url));

  try {
    const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
    const [rows] = await conn.execute<any[]>(
      "SELECT id FROM alert_subscriptions WHERE confirm_token = ? LIMIT 1", [token]
    );
    if (!rows.length) {
      await conn.end();
      return NextResponse.redirect(new URL("/alerts?error=expired", req.url));
    }
    await conn.execute("UPDATE alert_subscriptions SET confirmed = 1 WHERE confirm_token = ?", [token]);
    await conn.end();
    return NextResponse.redirect(new URL("/alerts?confirmed=1", req.url));
  } catch (err) {
    console.error("Confirm error:", err);
    return NextResponse.redirect(new URL("/alerts?error=server", req.url));
  }
}

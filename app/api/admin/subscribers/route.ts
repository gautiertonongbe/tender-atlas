import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { alertSubscriptions } from "@/lib/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  const adminKey = process.env.ADMIN_SECRET;

  if (!adminKey || secret !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        id:        alertSubscriptions.id,
        email:     alertSubscriptions.email,
        name:      alertSubscriptions.name,
        company:   alertSubscriptions.company,
        countries: alertSubscriptions.countries,
        sectors:   alertSubscriptions.sectors,
        confirmed: alertSubscriptions.confirmed,
        createdAt: alertSubscriptions.createdAt,
      })
      .from(alertSubscriptions)
      .orderBy(desc(alertSubscriptions.createdAt))
      .limit(1000);

    const confirmed = rows.filter(r => r.confirmed).length;
    return NextResponse.json({ total: rows.length, confirmed, pending: rows.length - confirmed, rows });
  } catch (err: any) {
    console.error("[admin/subscribers]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

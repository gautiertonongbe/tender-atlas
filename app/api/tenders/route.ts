import { NextRequest, NextResponse } from "next/server";
import { getTenders } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  try {
    const result = await getTenders({
      country: searchParams.get("country") || undefined,
      sector:  searchParams.get("sector")  || undefined,
      search:  searchParams.get("q")       || undefined,
      page:    parseInt(searchParams.get("page")  || "1"),
      limit:   parseInt(searchParams.get("limit") || "20"),
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

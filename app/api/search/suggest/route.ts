import { NextRequest, NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/queries";
import { COUNTRIES, SECTORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ tenders: [], entities: [], countries: [], sectors: [] });

  try {
    const lower = q.toLowerCase();

    const [{ tenders, entities }, countries, sectors] = await Promise.all([
      getSearchSuggestions(q),
      Promise.resolve(
        Object.entries(COUNTRIES)
          .filter(([, c]) => c.name.toLowerCase().includes(lower))
          .slice(0, 3)
          .map(([code, c]) => ({ code, name: c.name, flag: c.flag }))
      ),
      Promise.resolve(
        Object.entries(SECTORS)
          .filter(([, s]) => s.label.toLowerCase().includes(lower) || s.labelFr.toLowerCase().includes(lower))
          .slice(0, 3)
          .map(([slug, s]) => ({ slug, label: s.label, labelFr: s.labelFr }))
      ),
    ]);

    return NextResponse.json({ tenders, entities, countries, sectors });
  } catch (err: any) {
    console.error("[suggest]", err);
    return NextResponse.json({ tenders: [], entities: [], countries: [], sectors: [] });
  }
}

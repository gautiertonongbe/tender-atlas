import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { alertSubscriptions } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { key?: string };
}

export default async function AdminAlertsPage({ searchParams }: Props) {
  const key = searchParams.key;
  const adminKey = process.env.ADMIN_SECRET;

  if (!adminKey || key !== adminKey) {
    redirect("/");
  }

  const db = getDb();
  const subs = await db
    .select()
    .from(alertSubscriptions)
    .orderBy(desc(alertSubscriptions.createdAt))
    .limit(500);

  const confirmed = subs.filter(s => s.confirmed);
  const pending   = subs.filter(s => !s.confirmed);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Alert Subscribers</h1>
          <p className="text-subtle text-sm mt-1">
            {confirmed.length} confirmed · {pending.length} pending · {subs.length} total
          </p>
        </div>
        <a
          href={`/admin/alerts?key=${key}&dl=csv`}
          className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-royal transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-rule rounded-xl p-5">
          <p className="text-2xl font-bold text-navy font-display">{subs.length}</p>
          <p className="text-xs text-subtle mt-1">Total subscribers</p>
        </div>
        <div className="bg-white border border-rule rounded-xl p-5">
          <p className="text-2xl font-bold text-green-600 font-display">{confirmed.length}</p>
          <p className="text-xs text-subtle mt-1">Confirmed</p>
        </div>
        <div className="bg-white border border-rule rounded-xl p-5">
          <p className="text-2xl font-bold text-amber-600 font-display">{pending.length}</p>
          <p className="text-xs text-subtle mt-1">Awaiting confirmation</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-rule rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-softbg border-b border-rule">
                <th className="text-left px-4 py-3 text-xs font-bold text-navy uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-navy uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-navy uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-navy uppercase tracking-wider">Countries</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-navy uppercase tracking-wider">Sectors</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-navy uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-navy uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {subs.map(s => {
                const countries = (() => { try { return JSON.parse(s.countries as string) as string[]; } catch { return []; } })();
                const sectors   = (() => { try { return JSON.parse(s.sectors as string) as string[]; } catch { return []; } })();
                return (
                  <tr key={s.id} className="hover:bg-softbg/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-navy">{s.email}</td>
                    <td className="px-4 py-3 text-mute">{s.name || "—"}</td>
                    <td className="px-4 py-3 text-mute">{s.company || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-brand font-semibold">{countries.join(", ") || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-mute">{sectors.join(", ") || "All"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.confirmed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {s.confirmed ? "Confirmed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-subtle whitespace-nowrap">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                );
              })}
              {subs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-subtle text-sm">No subscribers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

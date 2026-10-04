import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenders } from "@/lib/queries";
import { SECTORS } from "@/lib/constants";
import { TenderCard } from "@/components/TenderCard";
import { AlertsBanner } from "@/components/AlertsBanner";
import { getLang } from "@/lib/lang";

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(SECTORS).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = SECTORS[params.slug];
  if (!s) return { title: "Sector not found" };
  return {
    title: `${s.label} Procurement Tenders Africa — Appels d'offres ${s.labelFr}`,
    description: `Browse open ${s.label.toLowerCase()} procurement tenders across Africa including OHADA countries, Nigeria, Ghana, and South Africa.`,
  };
}

export default async function SectorPage({ params }: { params: { slug: string } }) {
  const s = SECTORS[params.slug];
  if (!s) notFound();

  const lang = getLang();
  const isEn = lang === "en";

  const { rows, total } = await getTenders({ sector: params.slug, limit: 24 }).catch(() => ({ rows: [], total: 0, page: 1, pages: 0, limit: 24 }));

  return (
    <>
      <div className="bg-navy text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-2">
            {isEn ? s.label : s.labelFr} {isEn ? "Procurement Tenders" : "— Appels d'offres"} — Africa
          </h1>
          <p className="text-gray-300">
            {isEn ? s.label : s.labelFr} · {total} {isEn ? `open tender${total !== 1 ? "s" : ""}` : `appel${total !== 1 ? "s" : ""} d'offres ouverts`}
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {rows.length === 0 ? (
          <p className="text-center text-subtle py-20">
            {isEn
              ? "No open tenders in this sector right now. Check back after the next daily update."
              : "Aucun appel d'offres ouvert dans ce secteur pour le moment. Revenez après la prochaine mise à jour quotidienne."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map(t => <TenderCard key={t.id} {...t} lang={lang} />)}
          </div>
        )}
        <div className="mt-12"><AlertsBanner lang={lang} /></div>
      </div>
    </>
  );
}

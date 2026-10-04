import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenders } from "@/lib/queries";
import { COUNTRIES } from "@/lib/constants";
import { TenderCard } from "@/components/TenderCard";
import { AlertsBanner } from "@/components/AlertsBanner";
import { getLang } from "@/lib/lang";

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(COUNTRIES).map(code => ({ code: code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const code = params.code.toUpperCase();
  const c = COUNTRIES[code];
  if (!c) return { title: "Country not found" };
  return {
    title: `${c.flag} Procurement Tenders ${c.name} — ${c.lang === "fr" ? "Appels d'offres" : "Open Tenders"}`,
    description: `Browse all open government procurement tenders in ${c.name}. Updated daily from the official procurement portal.`,
  };
}

export default async function CountryPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const c = COUNTRIES[code];
  if (!c) notFound();

  const lang = getLang();
  const isEn = lang === "en";

  const { rows, total } = await getTenders({ country: code, limit: 24 }).catch(() => ({ rows: [], total: 0, page: 1, pages: 0, limit: 24 }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Procurement Tenders — ${c.name}`,
    description: `Open procurement tenders published in ${c.name}`,
    url: `http://localhost:3000/country/${params.code}`,
    about: { "@type": "Country", name: c.name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="bg-navy text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-5xl mb-4">{c.flag}</p>
          <h1 className="font-display text-3xl font-bold mb-2">
            {isEn ? "Open Tenders" : "Appels d'offres"} — {c.name}
          </h1>
          <p className="text-gray-300">
            {total} {isEn ? `open tender${total !== 1 ? "s" : ""} from official government portals` : `appel${total !== 1 ? "s" : ""} d'offres ouverts depuis les portails officiels`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {rows.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-navy mb-2">
              {isEn ? "No open tenders at the moment" : "Aucun appel d'offres ouvert pour le moment"}
            </p>
            <p className="text-sm text-subtle mb-6">
              {isEn
                ? "Check back tomorrow after the daily scrape, or set up an alert."
                : "Revenez demain après la mise à jour quotidienne, ou configurez une alerte."}
            </p>
            <a href="/alerts" className="text-brand font-semibold hover:underline text-sm">
              {isEn ? "Get notified when new tenders are posted" : "Être alerté lors de la publication de nouveaux appels d'offres"}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map(t => <TenderCard key={t.id} {...t} lang={lang} />)}
          </div>
        )}

        <div className="mt-12">
          <AlertsBanner lang={lang} />
        </div>
      </div>
    </>
  );
}

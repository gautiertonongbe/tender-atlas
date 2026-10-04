import Link from "next/link";
import type { Lang } from "@/lib/lang";

/** Promotes the free weekly email alerts. */
export function AlertsBanner({ lang = "en" }: { lang?: Lang }) {
  const isEn = lang === "en";
  return (
    <div className="bg-gradient-to-br from-indigo to-brand rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
      <div>
        <p className="text-white font-semibold text-sm">
          {isEn ? "Never miss a relevant tender." : "Ne manquez plus aucun appel d'offres pertinent."}
        </p>
        <p className="text-blue-100 text-xs mt-0.5">
          {isEn
            ? "Get a free weekly digest of new tenders for the countries and sectors you choose."
            : "Recevez chaque semaine les nouveaux appels d'offres pour vos pays et secteurs."}
        </p>
      </div>
      <Link
        href="/alerts"
        className="bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-white/30"
      >
        {isEn ? "Set up alerts" : "Créer une alerte"}
      </Link>
    </div>
  );
}

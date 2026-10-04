import Link from "next/link";
import { COUNTRIES, SECTORS, PORTAL_LABELS } from "@/lib/constants";
import type { Lang } from "@/lib/lang";

interface Props {
  id: string;
  title: string;
  entity?: string | null;
  country: string;
  sector?: string | null;
  deadline?: Date | string | null;
  publishedAt?: Date | string | null;
  sourcePortal?: string | null;
  sourceType?: string | null;
  donor?: string | null;
  budgetLocal?: number | null;
  currency?: string | null;
  status?: string | null;
  lang?: Lang;
}

function daysLeft(deadline: Date | string | null | undefined) {
  if (!deadline) return null;
  return Math.ceil(((deadline instanceof Date ? deadline : new Date(deadline)).getTime() - Date.now()) / 86_400_000);
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return (d instanceof Date ? d : new Date(d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SOURCE_CONFIG: Record<string, { en: string; fr: string; color: string }> = {
  government:    { en: "Government",  fr: "État",       color: "#2563EB" },
  igo:           { en: "UN / IGO",    fr: "ONU / OIG",  color: "#7C3AED" },
  ngo:           { en: "NGO",         fr: "ONG",        color: "#0D9488" },
  embassy:       { en: "Embassy",     fr: "Ambassade",  color: "#D97706" },
  multinational: { en: "Corporate",   fr: "Entreprise", color: "#DC2626" },
};

export function TenderCard({
  id, title, entity, country, sector, deadline, publishedAt,
  sourceType, sourcePortal, donor, budgetLocal, currency, status, lang = "en",
}: Props) {
  const isEn = lang === "en";
  const days = daysLeft(deadline);
  const c = COUNTRIES[country];
  const s = SECTORS[sector || ""] || SECTORS.other;
  const src = SOURCE_CONFIG[sourceType || ""] || SOURCE_CONFIG.government;
  const displayEntity = donor || entity;

  const expired = days !== null && days < 0;
  const urgent  = days !== null && days >= 0 && days <= 7;
  const isClosed = status === "closed" || expired;

  return (
    <Link href={`/tenders/${id}`} className="block group h-full">
      <div className={`h-full bg-white rounded-xl flex flex-col transition-all duration-200 border
        ${isClosed
          ? "border-gray-100 opacity-55 hover:opacity-75"
          : "border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5"
        }`}
      >
        <div className="p-5 flex flex-col flex-1 gap-3">

          {/* Top row: source type dot + label, country, sector */}
          <div className="flex items-center justify-between gap-2">
            {/* Source type */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isClosed ? "#9CA3AF" : src.color }}
              />
              <span className="text-xs font-semibold text-gray-500">
                {isEn ? src.en : src.fr}
              </span>
            </div>

            {/* Country */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">{c?.flag}</span>
              <span className="text-xs text-gray-500 font-medium">{c?.name || country}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className={`font-semibold text-sm leading-snug line-clamp-3 flex-1 transition-colors
            ${isClosed ? "text-gray-400" : "text-gray-900 group-hover:text-brand"}`}>
            {title}
          </h3>

          {/* Entity */}
          {displayEntity && (
            <p className="text-xs text-gray-400 truncate">
              {displayEntity}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto gap-2">

            {/* Sector chip */}
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md truncate">
              {isEn ? s.label : s.labelFr}
            </span>

            {/* Deadline or budget */}
            {budgetLocal && currency ? (
              <span className="text-xs font-bold text-navy shrink-0 whitespace-nowrap">
                {currency} {Number(budgetLocal).toLocaleString()}
              </span>
            ) : isClosed ? (
              <span className="text-xs text-gray-400 shrink-0">
                {isEn ? "Closed" : "Clôturé"}
              </span>
            ) : days !== null ? (
              <span className={`text-xs font-medium shrink-0 ${urgent ? "text-red-500" : "text-gray-400"}`}>
                {urgent
                  ? (isEn ? `${days}d left` : `${days}j`)
                  : fmtDate(deadline)}
              </span>
            ) : (
              <span className="text-xs text-gray-300 shrink-0">
                {isEn ? "No deadline" : "Sans échéance"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

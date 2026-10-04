import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenderById, getRelatedTenders } from "@/lib/queries";
import { COUNTRIES, SECTORS, PORTAL_LABELS, SOURCE_TYPE_LABELS, PROCUREMENT_TYPE, ELIGIBILITY_NOTES } from "@/lib/constants";
import { TenderCard } from "@/components/TenderCard";
import { AlertsBanner } from "@/components/AlertsBanner";
import { getLang, t } from "@/lib/lang";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tender = await getTenderById(params.id).catch(() => null);
  if (!tender) return { title: "Tender not found" };
  const c = COUNTRIES[tender.country];
  return {
    title: tender.title,
    description: `Open procurement tender in ${c?.name || tender.country}. ${tender.entity ? `Procuring entity: ${tender.entity}.` : ""} ${tender.deadline ? `Deadline: ${tender.deadline}.` : ""} ${tender.budgetLocal ? `Budget: ${tender.currency || ""} ${Number(tender.budgetLocal).toLocaleString()}.` : ""}`,
  };
}

function daysLeft(deadline: Date | string | null | undefined) {
  if (!deadline) return null;
  return Math.ceil(((deadline instanceof Date ? deadline : new Date(deadline)).getTime() - Date.now()) / 86_400_000);
}

function fmtDate(d: Date | string | null | undefined, locale = "en-GB") {
  if (!d) return null;
  return (d instanceof Date ? d : new Date(d)).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function fmtShort(d: Date | string | null | undefined) {
  if (!d) return null;
  return (d instanceof Date ? d : new Date(d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function TenderDetailPage({ params }: { params: { id: string } }) {
  const lang = getLang();
  const isEn = lang === "en";

  const tender = await getTenderById(params.id).catch(() => null);
  if (!tender) notFound();

  const related = await getRelatedTenders(tender.id, tender.sector || null, tender.country, 3).catch(() => []);

  const c = COUNTRIES[tender.country];
  const s = SECTORS[tender.sector || ""] || SECTORS.other;
  const deadline = tender.deadline ? new Date(tender.deadline) : null;
  const published = tender.publishedAt ? new Date(tender.publishedAt) : null;
  const days = daysLeft(deadline);
  const isOpen = days === null || days >= 0;
  const isUrgent = days !== null && days <= 7 && days >= 0;
  const sourceLabel = PORTAL_LABELS[tender.sourcePortal || ""] || (tender.sourcePortal?.replace(/_/g, " ") || "");
  const srcTypeLabel = SOURCE_TYPE_LABELS[tender.sourceType || ""] || { en: "Government", fr: "Marché public" };
  const procType = PROCUREMENT_TYPE[tender.sector || "other"] || PROCUREMENT_TYPE.other;
  const eligibility = ELIGIBILITY_NOTES[tender.sourceType || "government"] || ELIGIBILITY_NOTES.government;

  // Timeline progress (0-100%)
  const timelineProgress = (() => {
    if (!published || !deadline) return null;
    const total = deadline.getTime() - published.getTime();
    const elapsed = Date.now() - published.getTime();
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  })();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: tender.title,
    description: tender.description || tender.title,
    areaServed: { "@type": "Country", name: c?.name || tender.country },
    provider: tender.entity ? { "@type": "GovernmentOrganization", name: tender.entity } : undefined,
    availableChannel: tender.sourceUrl ? { "@type": "ServiceChannel", serviceUrl: tender.sourceUrl } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Closed tender notice */}
        {!isOpen && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {isEn ? "This tender is closed" : "Cet appel d'offres est clôturé"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEn
                  ? "The submission deadline has passed. This page is kept for reference. Browse open opportunities below."
                  : "La date limite de soumission est dépassée. Cette page est conservée à titre de référence. Consultez les opportunités ouvertes ci-dessous."}
              </p>
              <a href="/tenders" className="text-xs font-semibold text-brand hover:underline mt-1.5 inline-block">
                {isEn ? "Browse open tenders →" : "Voir les appels d'offres ouverts →"}
              </a>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="text-sm text-subtle mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/tenders" className="hover:text-brand transition-colors">{isEn ? "Tenders" : "Appels d'offres"}</Link>
          <span className="text-rule">/</span>
          <Link href={`/country/${tender.country.toLowerCase()}`} className="hover:text-brand transition-colors">{c?.name || tender.country}</Link>
          <span className="text-rule">/</span>
          <span className="text-navy truncate max-w-xs">{tender.title.slice(0, 60)}{tender.title.length > 60 ? "…" : ""}</span>
        </nav>

        {/* ── Main card ─────────────────────────────────────────── */}
        <div className={`bg-white border rounded-2xl overflow-hidden mb-6 shadow-sm ${isOpen ? "border-rule" : "border-gray-200 opacity-80"}`}>

          {/* Status header */}
          <div className={`px-8 py-3 flex items-center justify-between ${isOpen ? "bg-green-50 border-b border-green-100" : "bg-gray-50 border-b border-rule"}`}>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-green-500" : "bg-gray-400"}`} />
                {isOpen ? (isEn ? "OPEN" : "OUVERT") : (isEn ? "CLOSED" : "FERMÉ")}
              </span>
              {isUrgent && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  {isEn ? `Closing in ${days} day${days === 1 ? "" : "s"}` : `Ferme dans ${days} jour${days === 1 ? "" : "s"}`}
                </span>
              )}
            </div>
            <span className="text-xs text-subtle">{isEn ? "Ref:" : "Réf :"} {tender.sourceId}</span>
          </div>

          <div className="p-8">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-xl">{c?.flag}</span>
              <Link href={`/country/${tender.country.toLowerCase()}`}
                className="text-xs font-semibold text-brand bg-pale px-3 py-1 rounded-full hover:bg-brand hover:text-white transition-colors">
                {c?.name || tender.country}
              </Link>
              <Link href={`/sector/${tender.sector || "other"}`}
                className="text-xs text-subtle bg-softbg px-3 py-1 rounded-full hover:bg-rule transition-colors">
                {isEn ? s.label : s.labelFr}
              </Link>
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
                {isEn ? srcTypeLabel.en : srcTypeLabel.fr}
              </span>
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                {isEn ? procType.en : procType.fr}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-navy mb-6 leading-snug">{tender.title}</h1>

            {/* ── Key details grid ────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-softbg rounded-xl p-5 mb-6">
              <Detail
                icon={<OrgIcon />}
                label={isEn ? "Procuring entity" : "Entité adjudicatrice"}
                value={tender.entity || (isEn ? "Not specified" : "Non précisé")}
              />
              <Detail
                icon={<CalIcon />}
                label={isEn ? "Deadline" : "Date limite"}
                value={deadline ? fmtDate(deadline) || "" : (isEn ? "Not specified" : "Non précisée")}
                highlight={isUrgent ? "red" : undefined}
              />
              <Detail
                icon={<MoneyIcon />}
                label={isEn ? "Estimated budget" : "Budget estimé"}
                value={tender.budgetLocal ? `${tender.currency || ""} ${Number(tender.budgetLocal).toLocaleString()}` : (isEn ? "Not disclosed" : "Non communiqué")}
              />
              <Detail
                icon={<PubIcon />}
                label={isEn ? "Published" : "Publié le"}
                value={published ? fmtShort(published) || "" : (isEn ? "Not specified" : "Non précisé")}
              />
              <Detail
                icon={<SrcIcon />}
                label={isEn ? "Source portal" : "Source"}
                value={sourceLabel || (isEn ? "Unknown" : "Inconnu")}
              />
              <Detail
                icon={<TypeIcon />}
                label={isEn ? "Procurement type" : "Type de marché"}
                value={isEn ? procType.en : procType.fr}
              />
              <Detail
                icon={<CountryIcon />}
                label={isEn ? "Country" : "Pays"}
                value={c?.name || tender.country}
              />
              <Detail
                icon={<SectorIcon />}
                label={isEn ? "Sector" : "Secteur"}
                value={isEn ? s.label : s.labelFr}
              />
            </div>

            {/* ── Timeline ────────────────────────────────────── */}
            {published && deadline && timelineProgress !== null && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-subtle mb-2">
                  <span>{isEn ? "Published" : "Publié"} · {fmtShort(published)}</span>
                  <span className={isUrgent ? "text-red-600 font-semibold" : "text-subtle"}>
                    {isEn ? "Deadline" : "Clôture"} · {fmtShort(deadline)}
                    {days !== null && days >= 0 ? ` (${days}j)` : ""}
                  </span>
                </div>
                <div className="w-full h-2 bg-rule rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isUrgent ? "bg-red-400" : "bg-brand"}`}
                    style={{ width: `${timelineProgress}%` }}
                  />
                </div>
                <p className="text-xs text-subtle mt-1.5 text-center">
                  {isEn ? `${timelineProgress}% of tender period elapsed` : `${timelineProgress}% de la période d'offre écoulée`}
                </p>
              </div>
            )}

            {/* ── Description ─────────────────────────────────── */}
            {tender.description && tender.description.length > 10 && (
              <div className="mb-6">
                <h2 className="font-semibold text-navy text-sm mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 bg-brand rounded-full inline-block" />
                  {isEn ? "Description" : "Description"}
                </h2>
                <div className="prose prose-sm max-w-none text-mute leading-relaxed whitespace-pre-line bg-softbg rounded-lg p-4">
                  {tender.description}
                </div>
              </div>
            )}

            {/* ── Eligibility & How to apply ───────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border border-rule rounded-xl p-4">
                <h2 className="font-semibold text-navy text-sm mb-2">
                  {isEn ? "Eligibility" : "Éligibilité"}
                </h2>
                <p className="text-xs text-mute leading-relaxed">
                  {isEn ? eligibility.en : eligibility.fr}
                </p>
              </div>
              <div className="border border-rule rounded-xl p-4">
                <h2 className="font-semibold text-navy text-sm mb-2">
                  {isEn ? "How to apply" : "Comment soumissionner"}
                </h2>
                <ol className="text-xs text-mute space-y-1 list-decimal list-inside leading-relaxed">
                  {isEn ? (
                    <>
                      <li>Download the tender documents from the official portal</li>
                      <li>Review all requirements and eligibility criteria</li>
                      <li>Prepare your technical and financial offer</li>
                      <li>Submit before the deadline indicated above</li>
                    </>
                  ) : (
                    <>
                      <li>Télécharger le dossier d'appel d'offres sur le portail officiel</li>
                      <li>Lire toutes les exigences et critères d'éligibilité</li>
                      <li>Préparer votre offre technique et financière</li>
                      <li>Déposer votre offre avant la date limite indiquée ci-dessus</li>
                    </>
                  )}
                </ol>
              </div>
            </div>

            {/* ── Official portal link ─────────────────────────── */}
            {tender.sourceUrl ? (
              <div className="pt-5 border-t border-rule">
                <h2 className="font-semibold text-navy text-sm mb-2">
                  {isEn ? "Official source" : "Source officielle"}
                </h2>
                <a
                  href={tender.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-navy hover:bg-indigo text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  {isEn ? "View on official portal" : "Voir sur le portail officiel"}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p className="text-xs text-subtle mt-2">
                  {isEn
                    ? `Source: ${sourceLabel} — Opens in new tab. External portals may require registration to access tender documents.`
                    : `Source : ${sourceLabel} — Ouvre dans un nouvel onglet. Les portails externes peuvent nécessiter une inscription pour accéder aux documents d'appel d'offres.`}
                </p>
              </div>
            ) : (
              <div className="pt-5 border-t border-rule">
                <p className="text-sm text-subtle flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isEn
                    ? `Visit ${sourceLabel || "the source portal"} directly to access tender documents and submit your bid.`
                    : `Visitez directement ${sourceLabel || "le portail source"} pour accéder aux documents et déposer votre offre.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts banner — only on open tenders */}
        {isOpen && <AlertsBanner lang={lang} />}

        {/* Related tenders */}
        {related.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-navy text-xl">
                  {isOpen
                    ? (isEn ? "Similar open opportunities" : "Opportunités similaires ouvertes")
                    : (isEn ? "Open tenders in the same area" : "Appels d'offres ouverts dans ce domaine")}
                </h2>
                <p className="text-xs text-subtle mt-0.5">
                  {isEn
                    ? `Same sector${s.label !== SECTORS.other?.label ? ` (${s.label})` : ""} · ${c?.name || tender.country}`
                    : `Même secteur${s.labelFr !== SECTORS.other?.labelFr ? ` (${s.labelFr})` : ""} · ${c?.name || tender.country}`}
                </p>
              </div>
              <a href={`/tenders?country=${tender.country.toLowerCase()}`}
                className="text-xs font-semibold text-brand hover:underline whitespace-nowrap">
                {isEn ? `All in ${c?.name || tender.country} →` : `Tout en ${c?.name || tender.country} →`}
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map(t => <TenderCard key={t.id} {...t} lang={lang} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function Detail({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: "red" }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-subtle mb-0.5">
        <span className="w-3.5 h-3.5 shrink-0">{icon}</span>
        <p className="text-xs">{label}</p>
      </div>
      <p className={`text-sm font-semibold ${highlight === "red" ? "text-red-600" : "text-navy"}`}>{value}</p>
    </div>
  );
}

// Minimal inline SVG icons — no emoji, no external deps
const OrgIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-6h6v6" />
  </svg>
);
const CalIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8} />
    <path strokeLinecap="round" strokeWidth={1.8} d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const MoneyIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);
const PubIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const SrcIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
  </svg>
);
const TypeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const CountryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21l6-6m0 0l6.5-6.5M9 15l6.5-6.5M15.5 8.5L19 5m-10.5 10L3 21m6-6l2-2m4-4l4-4" />
  </svg>
);
const SectorIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

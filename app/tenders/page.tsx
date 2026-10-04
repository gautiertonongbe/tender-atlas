import type { Metadata } from "next";
import Link from "next/link";
import { getTenders } from "@/lib/queries";
import { COUNTRIES, SECTORS } from "@/lib/constants";
import { TenderCard } from "@/components/TenderCard";
import { Suspense } from "react";
import { TenderSearch } from "@/components/TenderSearch";
import { getLang } from "@/lib/lang";

interface Props {
  searchParams: { country?: string; sector?: string; q?: string; type?: string; page?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const parts: string[] = [];
  if (searchParams.country) parts.push(COUNTRIES[searchParams.country.toUpperCase()]?.name || "");
  if (searchParams.sector)  parts.push(SECTORS[searchParams.sector]?.label || "");
  if (searchParams.type === "public") parts.push("Public");
  if (searchParams.type === "private") parts.push("Corporate & NGO");
  const title = parts.length ? `${parts.filter(Boolean).join(" · ")} Tenders` : "All Open Procurement Tenders";
  return {
    title,
    description: `Browse open procurement tenders${parts.length ? ` for ${parts.filter(Boolean).join(" and ")}` : ""} across Africa. Updated daily.`,
  };
}

const SOURCE_TABS = (isEn: boolean) => [
  { key: "",        label: isEn ? "All sources"      : "Toutes sources" },
  { key: "public",  label: isEn ? "Public (Gov / UN)": "Public (État / ONU)" },
  { key: "private", label: isEn ? "Corporate & NGO"  : "Entreprises & ONG" },
];

export default async function TendersPage({ searchParams }: Props) {
  const lang = getLang();
  const isEn = lang === "en";

  const page = parseInt(searchParams.page || "1");
  const activeType    = searchParams.type || "";
  const activeCountry = searchParams.country?.toUpperCase();
  const activeSector  = searchParams.sector;
  const activeSearch  = searchParams.q;

  const { rows, total, pages } = await getTenders({
    country: activeCountry,
    sector:  activeSector,
    search:  activeSearch,
    type:    activeType,
    page,
    limit:   24,
  }).catch(() => ({ rows: [], total: 0, page: 1, limit: 24, pages: 0 }));

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { country: activeCountry, sector: activeSector, q: activeSearch, type: activeType || undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    p.delete("page");
    const s = p.toString();
    return `/tenders${s ? `?${s}` : ""}`;
  }

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (activeCountry) params.set("country", activeCountry);
    if (activeSector)  params.set("sector", activeSector);
    if (activeSearch)  params.set("q", activeSearch);
    if (activeType)    params.set("type", activeType);
    params.set("page", String(p));
    return `/tenders?${params}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy mb-1">
              {isEn ? "Open Procurement Tenders" : "Appels d'offres ouverts"}
            </h1>
            <p className="text-subtle text-sm">
              {total.toLocaleString()} {isEn ? `open tenders across ${Object.keys(COUNTRIES).length} African countries` : `appels d'offres dans ${Object.keys(COUNTRIES).length} pays africains`}
            </p>
          </div>
          <Link href="/alerts"
            className="bg-navy hover:bg-indigo text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            {isEn ? "Get weekly alerts" : "Recevoir des alertes"}
          </Link>
        </div>

        {/* Source type tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {SOURCE_TABS(isEn).map(tab => (
            <Link key={tab.key}
              href={buildHref({ type: tab.key || undefined })}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                activeType === tab.key
                  ? tab.key === "private"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-brand text-white border-brand"
                  : "bg-white text-mute border-rule hover:border-brand hover:text-brand"
              }`}>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <Suspense fallback={null}>
          <TenderSearch initialQuery={activeSearch || ""} lang={lang} />
        </Suspense>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20 space-y-6">
            <FilterGroup title={isEn ? "Country" : "Pays"}>
              <FilterLink href={buildHref({ country: undefined })} label={isEn ? "All countries" : "Tous les pays"} active={!activeCountry} />
              {Object.entries(COUNTRIES).map(([code, c]) => (
                <FilterLink key={code} href={buildHref({ country: code })} label={`${c.flag} ${c.name}`} active={activeCountry === code} />
              ))}
            </FilterGroup>
            <FilterGroup title={isEn ? "Sector" : "Secteur"}>
              <FilterLink href={buildHref({ sector: undefined })} label={isEn ? "All sectors" : "Tous les secteurs"} active={!activeSector} />
              {Object.entries(SECTORS).map(([slug, s]) => (
                <FilterLink key={slug} href={buildHref({ sector: slug })} label={isEn ? s.label : s.labelFr} active={activeSector === slug} />
              ))}
            </FilterGroup>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile country pills */}
          <div className="lg:hidden flex gap-2 flex-wrap mb-5">
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <Link key={code} href={buildHref({ country: code })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeCountry === code ? "bg-brand text-white border-brand" : "border-rule text-mute hover:border-brand"}`}>
                {c.flag} {c.name}
              </Link>
            ))}
          </div>

          {/* Active filter chips */}
          {(activeCountry || activeSector || activeSearch) && (
            <div className="flex gap-2 flex-wrap mb-5">
              {activeCountry && <Chip label={`${COUNTRIES[activeCountry]?.flag} ${COUNTRIES[activeCountry]?.name}`} clearHref={buildHref({ country: undefined })} />}
              {activeSector && <Chip label={isEn ? SECTORS[activeSector]?.label : SECTORS[activeSector]?.labelFr} clearHref={buildHref({ sector: undefined })} />}
              {activeSearch && <Chip label={`"${activeSearch}"`} clearHref={buildHref({ q: undefined })} />}
              <Link href="/tenders" className="text-xs text-subtle hover:text-navy px-3 py-1 rounded-full border border-rule hover:border-gray-400 transition-colors">
                {isEn ? "Clear all" : "Tout effacer"}
              </Link>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="bg-softbg rounded-2xl py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-rule flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-navy mb-2">{isEn ? "No tenders found" : "Aucun appel d'offres trouvé"}</p>
              <p className="text-sm text-subtle mb-6">{isEn ? "Try adjusting your search or filters." : "Essayez de modifier votre recherche ou vos filtres."}</p>
              <Link href="/tenders" className="text-brand text-sm font-semibold hover:underline">{isEn ? "Clear filters" : "Effacer les filtres"}</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rows.map(t => <TenderCard key={t.id} {...t} lang={lang} />)}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={pageHref(page - 1)} className="px-4 py-2 border border-rule rounded-xl text-sm hover:border-brand transition-colors">
                      {isEn ? "Previous" : "Précédent"}
                    </Link>
                  )}
                  <span className="text-sm text-subtle px-2">{isEn ? `Page ${page} of ${pages}` : `Page ${page} sur ${pages}`}</span>
                  {page < pages && (
                    <Link href={pageHref(page + 1)} className="px-4 py-2 border border-rule rounded-xl text-sm hover:border-brand transition-colors">
                      {isEn ? "Next" : "Suivant"}
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${active ? "text-brand font-semibold bg-pale" : "text-subtle hover:text-navy hover:bg-softbg"}`}>
      {label}
    </Link>
  );
}

function Chip({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-brand/10 text-brand font-semibold border border-brand/20">
      {label}
      <Link href={clearHref} className="hover:text-navy ml-0.5" aria-label="Remove filter">×</Link>
    </span>
  );
}

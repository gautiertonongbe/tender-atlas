import type { Metadata } from "next";
import Link from "next/link";
import { getStats, getRecentTenders, getHeroStats } from "@/lib/queries";
import { COUNTRIES, SECTORS } from "@/lib/constants";
import { TenderCard } from "@/components/TenderCard";
import { AlertsBanner } from "@/components/AlertsBanner";
import { HeroSearch } from "@/components/HeroSearch";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: "TenderAtlas — African Procurement Tenders & Intelligence Hub",
  description: "Browse open procurement tenders from Bénin, Côte d'Ivoire, Sénégal, Cameroun, Togo, Burkina Faso, Mali, Guinée, South Africa, Nigeria, and Ghana. Daily updates from government portals, UN agencies, World Bank, AfDB, EU, USAID, and multinationals.",
  keywords: [
    "procurement tenders Africa", "appels d'offres Afrique", "marchés publics OHADA",
    "UNDP tenders Africa", "World Bank procurement Africa", "AfDB tenders",
    "procurement Bénin", "procurement Côte d'Ivoire", "procurement Sénégal",
    "procurement Togo", "procurement Burkina Faso", "procurement Mali",
    "procurement Nigeria", "procurement South Africa", "procurement Ghana",
    "UN tenders Africa", "RFQ Africa", "appel d'offres gouvernement",
    "EU tenders Africa", "USAID procurement Africa", "NGO tenders Africa",
    "marchés publics Afrique", "opportunités business Afrique",
  ],
};

export default async function HomePage() {
  const lang = getLang();
  const isEn = lang === "en";

  const [stats, hero, recent] = await Promise.all([
    getStats().catch(() => ({ total: 0, byCountry: [], bySector: [] })),
    getHeroStats().catch(() => ({ total: 0, addedToday: 0, topCountry: null, topSector: null, lastUpdatedAt: null, activePortals: 0 })),
    getRecentTenders(undefined, 6).catch(() => []),
  ]);

  // Format "last updated X ago"
  const lastUpdatedLabel = (() => {
    if (!hero.lastUpdatedAt) return isEn ? "Today" : "Aujourd'hui";
    const mins = Math.round((Date.now() - hero.lastUpdatedAt.getTime()) / 60_000);
    if (mins < 60) return isEn ? `${mins}m ago` : `il y a ${mins}min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return isEn ? `${hrs}h ago` : `il y a ${hrs}h`;
    return isEn ? "Today" : "Aujourd'hui";
  })();

  const topCountryName = hero.topCountry ? (COUNTRIES[hero.topCountry]?.name || hero.topCountry) : null;
  const topSectorLabel = hero.topSector ? (isEn ? SECTORS[hero.topSector]?.label : SECTORS[hero.topSector]?.labelFr) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TenderAtlas",
    url: "http://localhost:3000",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "http://localhost:3000/tenders?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-indigo/40 to-navy pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center px-4 pt-20 pb-10">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
            <span className="live-dot" />
            <span className="text-xs font-semibold text-gray-300">
              {isEn
                ? `Live · ${hero.addedToday > 0 ? `+${hero.addedToday} new today` : "Updated today"} · ${hero.activePortals}+ portals`
                : `En direct · ${hero.addedToday > 0 ? `+${hero.addedToday} aujourd'hui` : "Mis à jour aujourd'hui"} · ${hero.activePortals}+ portails`}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-xs text-gray-400">{lastUpdatedLabel}</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold mb-5 leading-tight animate-fade-in-up delay-100">
            {isEn
              ? <>{`Africa's`} <span className="gold-shimmer">Procurement</span><br />Intelligence Hub</>
              : <>Hub de veille <span className="gold-shimmer">achats</span><br />pour l&apos;Afrique</>}
          </h1>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            {isEn
              ? `${stats.total.toLocaleString()}+ open tenders from government portals, UN agencies, World Bank, AfDB, EU, embassies, and multinationals across ${Object.keys(COUNTRIES).length} African countries.`
              : `${stats.total.toLocaleString()}+ appels d'offres ouverts issus de portails gouvernementaux, agences ONU, Banque mondiale, BAD, UE, ambassades et multinationales dans ${Object.keys(COUNTRIES).length} pays africains.`}
          </p>

          <div className="animate-fade-in-up delay-300">
            <HeroSearch lang={lang} />
          </div>

          {/* Source type pills */}
          <div className="flex items-center justify-center gap-3 flex-wrap mt-6 animate-fade-in delay-500">
            {[
              { key: "",        label: isEn ? "All sources"      : "Toutes sources", dot: "bg-green-400" },
              { key: "public",  label: isEn ? "Public (Gov / UN)": "Public (État / ONU)", dot: "bg-brand" },
              { key: "private", label: isEn ? "Corporate & NGO"  : "Entreprises & ONG", dot: "bg-gold" },
            ].map(s => (
              <Link key={s.key}
                href={`/tenders${s.key ? `?type=${s.key}` : ""}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all text-sm text-gray-300 hover:text-white">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 mt-8">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-10">
            <Stat value={stats.total.toLocaleString()} label={isEn ? "Open tenders" : "Appels d'offres"} />
            <div className="w-px h-8 bg-white/10" />
            <Stat
              value={hero.addedToday > 0 ? `+${hero.addedToday}` : "—"}
              label={isEn ? "Added today" : "Ajoutés aujourd'hui"}
              highlight={hero.addedToday > 0}
            />
            <div className="w-px h-8 bg-white/10" />
            <Stat value={hero.activePortals.toString()} label={isEn ? "Active portals" : "Portails actifs"} />
            <div className="w-px h-8 bg-white/10" />
            <Stat value={Object.keys(COUNTRIES).length.toString()} label={isEn ? "Countries" : "Pays"} />
            {topCountryName && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <Stat value={topCountryName} label={isEn ? "Most active" : "Plus actif"} />
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Country grid */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-navy font-display font-bold text-2xl">{isEn ? "Browse by country" : "Parcourir par pays"}</h2>
              <p className="text-subtle text-sm mt-0.5">{isEn ? "Click any country to see all active opportunities" : "Cliquez sur un pays pour voir toutes les opportunités actives"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(COUNTRIES).map(([code, c]) => {
              const countryStats = stats.byCountry.find(b => b.country === code);
              return (
                <Link key={code} href={`/country/${code.toLowerCase()}`}
                  className="bg-white border border-rule rounded-2xl p-4 text-center hover:border-brand hover:shadow-md transition-all group">
                  <span className="text-3xl">{c.flag}</span>
                  <p className="text-xs font-bold text-navy mt-3 group-hover:text-brand transition-colors leading-tight">{c.name}</p>
                  <p className="text-xs text-subtle mt-1">{countryStats ? `${countryStats.total} ${isEn ? "open" : "ouverts"}` : "—"}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Source type cards */}
        <section className="mb-14">
          <h2 className="text-navy font-display font-bold text-2xl mb-5">{isEn ? "Search by source type" : "Rechercher par type de source"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/tenders?type=public"
              className="group relative overflow-hidden bg-gradient-to-br from-indigo to-brand rounded-2xl p-6 text-white hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-6h6v6" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg mb-1">{isEn ? "Public Tenders" : "Marchés publics"}</p>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    {isEn
                      ? "Government portals, UN agencies (UNDP, UNICEF, WFP), World Bank, AfDB, EU delegations, USAID"
                      : "Portails gouvernementaux, agences ONU (PNUD, UNICEF, PAM), Banque mondiale, BAD, délégations UE, USAID"}
                  </p>
                  <p className="text-white/60 text-xs mt-3 group-hover:text-white/80 transition-colors">
                    {isEn ? "Browse public opportunities →" : "Voir les marchés publics →"}
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/tenders?type=private"
              className="group relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-500 rounded-2xl p-6 text-white hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0H3m0 0h2" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg mb-1">{isEn ? "Corporate & NGO" : "Entreprises & ONG"}</p>
                  <p className="text-amber-100 text-sm leading-relaxed">
                    {isEn
                      ? "Multinationals (TotalEnergies, MTN, Shell), INGOs, embassy procurement pages, AFD, GIZ"
                      : "Multinationales (TotalEnergies, MTN, Shell), ONGI, pages achats ambassades, AFD, GIZ"}
                  </p>
                  <p className="text-white/60 text-xs mt-3 group-hover:text-white/80 transition-colors">
                    {isEn ? "Browse private opportunities →" : "Voir les appels privés →"}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Sector pills */}
        <section className="mb-14">
          <h2 className="text-navy font-display font-bold text-2xl mb-5">{isEn ? "Browse by sector" : "Parcourir par secteur"}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SECTORS).map(([slug, s]) => (
              <Link key={slug} href={`/sector/${slug}`}
                className="bg-white border border-rule text-sm text-mute font-medium hover:text-brand hover:border-brand hover:bg-pale/30 px-4 py-2 rounded-full transition-all">
                {isEn ? s.label : s.labelFr}
              </Link>
            ))}
          </div>
        </section>

        {/* African Procurement Insights */}
        <section className="mb-14">
          <div className="mb-6">
            <h2 className="text-navy font-display font-bold text-2xl">
              {isEn ? "African Procurement: Key Insights" : "Marchés publics africains : chiffres clés"}
            </h2>
            <p className="text-subtle text-sm mt-0.5">
              {isEn ? "What you need to know to win contracts in Africa" : "Ce qu'il faut savoir pour remporter des marchés en Afrique"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                value: "$330B",
                label: isEn ? "SME financing gap in Africa" : "Gap de financement PME en Afrique",
                sub: isEn ? "Source: IFC, 2022" : "Source: IFC, 2022",
                color: "text-brand",
              },
              {
                value: "70%",
                label: isEn ? "of global Mobile Money transactions" : "des transactions Mobile Money mondiales",
                sub: isEn ? "Processed in Africa (GSMA, 2023)" : "Traitées en Afrique (GSMA, 2023)",
                color: "text-gold",
              },
              {
                value: "17",
                label: isEn ? "OHADA member states" : "États membres OHADA",
                sub: isEn ? "~350M people, unified commercial law" : "~350M personnes, droit unifié",
                color: "text-indigo",
              },
              {
                value: "$15-25",
                label: isEn ? "Cost to process one invoice manually" : "Coût de traitement d'une facture manuelle",
                sub: isEn ? "vs <$3 automated (IOFM)" : "vs <3$ automatisé (IOFM)",
                color: "text-brand",
              },
            ].map((s, i) => (
              <div key={i} className={`bg-white border border-rule rounded-2xl p-5 card-lift animate-fade-in-up delay-${(i + 1) * 100}`}>
                <p className={`font-display text-3xl font-bold ${s.color} mb-1`}>{s.value}</p>
                <p className="text-sm font-semibold text-navy leading-snug mb-2">{s.label}</p>
                <p className="text-xs text-subtle">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(isEn ? [
              { title: "Government tenders", body: "African governments publish tenders through national procurement regulatory authorities (ARMP, ARCOP, DCMP, PPA, BPP). Registration with the authority is typically required and tender documents are often free." },
              { title: "UN & Multilateral tenders", body: "UN agencies (UNDP, UNICEF, WFP), World Bank, AfDB, and EU publish hundreds of tenders monthly in Africa. Most are open to international firms. Register on UNGM.org for centralized access." },
              { title: "Corporate & NGO tenders", body: "Multinationals (TotalEnergies, MTN, Shell) and INGOs publish supplier requests on their procurement pages. These are often less competitive than public tenders and offer faster payment cycles." },
            ] : [
              { title: "Marchés publics gouvernementaux", body: "Les gouvernements africains publient leurs appels d'offres via les autorités de régulation (ARMP, ARCOP, DCMP, PPA, BPP). L'inscription auprès de l'autorité est généralement requise. Les documents sont souvent gratuits." },
              { title: "ONU et multilatéraux", body: "Les agences ONU (PNUD, UNICEF, PAM), la Banque Mondiale, la BAD et l'UE publient des centaines d'appels d'offres mensuels en Afrique. Ouverts aux entreprises internationales. Inscription sur UNGM.org recommandée." },
              { title: "Multinationales & ONG", body: "Les multinationales (TotalEnergies, MTN, Shell) et les ONGI publient leurs appels à fournisseurs sur leurs pages achats. Souvent moins concurrentiels que les marchés publics, avec des délais de paiement plus courts." },
            ]).map((c, i) => (
              <div key={i} className={`bg-softbg rounded-xl p-5 animate-fade-in-up delay-${(i + 1) * 150}`}>
                <p className="text-sm font-bold text-navy mb-2">{c.title}</p>
                <p className="text-xs text-mute leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent tenders */}
        {recent.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-navy font-display font-bold text-2xl">{isEn ? "Latest opportunities" : "Dernières opportunités"}</h2>
                <p className="text-subtle text-sm mt-0.5">{isEn ? "Added in the last 24 hours" : "Ajoutées dans les dernières 24h"}</p>
              </div>
              <Link href="/tenders" className="text-brand text-sm font-semibold hover:underline whitespace-nowrap">
                {isEn ? `View all ${stats.total.toLocaleString()} →` : `Voir tout (${stats.total.toLocaleString()}) →`}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map(t => <TenderCard key={t.id} {...t} lang={lang} />)}
            </div>
          </section>
        )}

        <AlertsBanner lang={lang} />
      </div>
    </>
  );
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold font-display ${highlight ? "text-gold" : "text-white"}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

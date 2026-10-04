import type { Metadata } from "next";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: "About TenderAtlas — African Procurement Intelligence Platform",
  description: "TenderAtlas is the most comprehensive aggregator of procurement tenders across Africa, covering government portals, UN agencies, World Bank, AfDB, EU, USAID, embassies, and multinationals.",
};

const REPO_URL = "https://github.com/gautiertonongbe/tender-atlas";

export default function AboutPage() {
  const lang = getLang();
  const isEn = lang === "en";

  const sources = isEn ? [
    {
      category: "Government Portals (7 countries)",
      items: ["ARMP Bénin", "ARCOP Côte d'Ivoire", "DCMP Sénégal", "ARMP Cameroun", "eTenders South Africa", "BPP Nigeria (NoCoPo)", "PPA Ghana"],
    },
    {
      category: "UN & International Organizations",
      items: ["UNGM (30+ UN agencies: UNDP, UNICEF, WFP, WHO, UNHCR, IOM...)", "African Development Bank (AfDB)", "World Bank", "International Finance Corporation (IFC)", "IFAD"],
    },
    {
      category: "Bilateral Donors & Embassies",
      items: ["EU Delegations (7 countries)", "Tenders Electronic Daily (TED)", "US Embassy procurement pages", "AFD — Agence Française de Développement", "GIZ (Germany)", "USAID"],
    },
    {
      category: "Multinationals & Private Sector",
      items: ["TotalEnergies Africa", "Shell Nigeria", "MTN Group", "Orange / Sonatel", "Dangote Group", "Standard Bank / Stanbic"],
    },
  ] : [
    {
      category: "Portails gouvernementaux (7 pays)",
      items: ["ARMP Bénin", "ARCOP Côte d'Ivoire", "DCMP Sénégal", "ARMP Cameroun", "eTenders Afrique du Sud", "BPP Nigeria (NoCoPo)", "PPA Ghana"],
    },
    {
      category: "ONU et organisations internationales",
      items: ["UNGM (30+ agences ONU: PNUD, UNICEF, PAM, OMS, UNHCR, OIM...)", "Banque Africaine de Développement (BAD)", "Banque Mondiale", "Société Financière Internationale (IFC)", "FIDA"],
    },
    {
      category: "Bailleurs bilatéraux et ambassades",
      items: ["Délégations UE (7 pays)", "TED (Journal officiel UE)", "Ambassades américaines", "AFD — Agence Française de Développement", "GIZ (Allemagne)", "USAID"],
    },
    {
      category: "Multinationales et secteur privé",
      items: ["TotalEnergies Afrique", "Shell Nigeria", "Groupe MTN", "Orange / Sonatel", "Groupe Dangote", "Standard Bank / Stanbic"],
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TenderAtlas",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    description: "The most comprehensive African procurement intelligence portal. Aggregates tenders from government portals, UN agencies, World Bank, AfDB, EU, USAID, embassies, and multinationals across 7 African countries.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/tenders?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-navy mb-4">
          {isEn
            ? "The authoritative source for African procurement intelligence"
            : "La référence en matière d'intelligence des marchés africains"}
        </h1>
        <p className="text-mute text-lg mb-10 leading-relaxed">
          {isEn
            ? "TenderAtlas aggregates public procurement tenders from every major source active in Africa. Updated daily. Free to search. Open source."
            : "TenderAtlas agrège les appels d'offres publics de toutes les grandes sources actives en Afrique. Mis à jour quotidiennement. Recherche gratuite. Open source."}
        </p>

        <h2 className="font-bold text-navy text-xl mb-6">
          {isEn ? "Data sources" : "Sources de données"}
        </h2>
        <div className="space-y-6 mb-12">
          {sources.map(s => (
            <div key={s.category} className="bg-softbg rounded-xl p-6">
              <h3 className="font-semibold text-navy text-sm mb-3">{s.category}</h3>
              <ul className="space-y-1">
                {s.items.map(item => (
                  <li key={item} className="text-mute text-sm flex gap-2">
                    <span className="text-brand mt-0.5 shrink-0">+</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-softbg border border-rule rounded-xl p-6 mb-8">
          <h2 className="font-bold text-navy text-lg mb-3">
            {isEn ? "How it works" : "Comment ça marche"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(isEn ? [
              { step: "1", title: "Daily scraping", body: "Our crawlers check each source portal every 24 hours for new and updated tenders." },
              { step: "2", title: "Classification", body: "Each tender is classified by country, sector, source type, and procurement category automatically." },
              { step: "3", title: "Free access", body: "All tenders are free to browse and search. No registration required. Weekly alerts are opt-in." },
            ] : [
              { step: "1", title: "Collecte quotidienne", body: "Nos robots vérifient chaque portail source toutes les 24 heures pour les nouveaux appels d'offres." },
              { step: "2", title: "Classification automatique", body: "Chaque appel d'offre est classifié par pays, secteur, type de source et catégorie d'achat." },
              { step: "3", title: "Accès gratuit", body: "Tous les appels d'offres sont librement consultables et recherchables. Sans inscription. Alertes sur abonnement." },
            ]).map(({ step, title, body }) => (
              <div key={step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy mb-1">{title}</p>
                  <p className="text-xs text-mute leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy rounded-xl p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            {isEn ? "Open source and free to use" : "Open source et gratuit"}
          </h2>
          <p className="text-gray-300 text-sm mb-6 max-w-lg mx-auto">
            {isEn
              ? "TenderAtlas is MIT-licensed. Self-host it, add a scraper for a new source, or report a broken one on GitHub."
              : "TenderAtlas est sous licence MIT. Hébergez-le, ajoutez une nouvelle source ou signalez un problème sur GitHub."}
          </p>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
            className="bg-brand hover:bg-royal text-white font-semibold px-6 py-3 rounded-lg transition-colors inline-block">
            {isEn ? "View on GitHub" : "Voir sur GitHub"}
          </a>
        </div>
      </div>
    </>
  );
}

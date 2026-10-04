import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getLang } from "@/lib/lang";
import { LangSwitcher } from "@/components/LangSwitcher";

const REPO_URL = "https://github.com/gautiertonongbe/tender-atlas";

export const metadata: Metadata = {
  title: {
    default: "TenderAtlas — African Procurement Tender Intelligence",
    template: "%s | TenderAtlas",
  },
  description: "Browse open procurement tenders from Bénin, Côte d'Ivoire, Sénégal, Cameroun, South Africa, Nigeria, and Ghana. Daily updates from official government portals, UN agencies, World Bank, AfDB, EU, and multinationals.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  keywords: [
    "procurement tenders Africa", "appels d'offres Afrique", "marchés publics OHADA",
    "UNDP tenders Africa", "World Bank procurement Africa", "AfDB tenders",
    "procurement Côte d'Ivoire", "procurement Nigeria", "procurement South Africa",
    "RFQ Africa", "RFP Africa", "appel d'offres Bénin", "marchés publics Sénégal",
    "EU tenders Africa", "USAID procurement", "NGO tenders Africa",
  ],
  openGraph: {
    siteName: "TenderAtlas",
    type: "website",
  },
  twitter: { card: "summary" },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const isEn = lang === "en";

  const NAV = [
    { href: "/tenders?type=public",  label: isEn ? "Public"    : "Public" },
    { href: "/tenders?type=private", label: isEn ? "Corporate" : "Entreprises" },
    { href: "/alerts",               label: isEn ? "Alerts"    : "Alertes" },
    { href: "/about",                label: isEn ? "Sources"   : "Sources" },
  ];

  const COUNTRIES_FOOTER = [
    ["bj","Bénin"], ["ci","Côte d'Ivoire"], ["sn","Sénégal"], ["cm","Cameroun"],
    ["tg","Togo"], ["bf","Burkina Faso"], ["ml","Mali"], ["gn","Guinée"],
    ["ne","Niger"], ["ke","Kenya"], ["rw","Rwanda"],
    ["za","South Africa"], ["ng","Nigeria"], ["gh","Ghana"],
  ];

  return (
    <html lang={lang}>
      <body className="min-h-screen flex flex-col">

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="bg-navy text-white sticky top-0 z-50 shadow-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">

            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-white font-bold text-lg tracking-tight">Tender<span className="text-gold">Atlas</span></span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm ml-auto">
              {NAV.map(n => (
                <Link key={n.href} href={n.href} className="text-gray-300 hover:text-white transition-colors whitespace-nowrap font-medium">
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Language switcher */}
            <LangSwitcher lang={lang} />

            {/* CTA */}
            <Link
              href="/alerts"
              className="bg-brand hover:bg-royal text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shrink-0 whitespace-nowrap"
            >
              {isEn ? "Get alerts" : "Recevoir les alertes"}
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="bg-navy text-gray-400 mt-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white font-bold text-sm">Tender<span className="text-gold">Atlas</span></span>
                </div>
                <p className="text-sm leading-relaxed text-gray-500">
                  {isEn
                    ? "Open-source search for public and private procurement tenders across Africa, updated daily."
                    : "Moteur de recherche open source des appels d'offres publics et privés en Afrique, mis à jour chaque jour."}
                </p>
              </div>

              {/* Browse */}
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider mb-4">
                  {isEn ? "Browse" : "Explorer"}
                </p>
                <div className="space-y-2 text-sm">
                  <Link href="/tenders"               className="block hover:text-white transition-colors">{isEn ? "All Tenders"      : "Tous les appels d'offres"}</Link>
                  <Link href="/tenders?type=public"   className="block hover:text-white transition-colors">{isEn ? "Public (Gov / UN)" : "Public (État / ONU)"}</Link>
                  <Link href="/tenders?type=private"  className="block hover:text-white transition-colors">{isEn ? "Corporate & NGO"   : "Entreprises & ONG"}</Link>
                  <Link href="/alerts"                className="block hover:text-white transition-colors">{isEn ? "Email Alerts"      : "Alertes email"}</Link>
                </div>
              </div>

              {/* Countries */}
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider mb-4">
                  {isEn ? "Countries" : "Pays"}
                </p>
                <div className="space-y-2 text-sm">
                  {COUNTRIES_FOOTER.map(([code, name]) => (
                    <Link key={code} href={`/country/${code}`} className="block hover:text-white transition-colors">{name}</Link>
                  ))}
                </div>
              </div>

              {/* Project */}
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider mb-4">{isEn ? "Project" : "Projet"}</p>
                <div className="space-y-2 text-sm">
                  <Link href="/about" className="block hover:text-white transition-colors">{isEn ? "Data sources" : "Sources de données"}</Link>
                  <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors">GitHub</a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-gray-600">
              <p>
                {isEn
                  ? "Tender data is sourced from official government portals, UN agencies, and public procurement databases. TenderAtlas is not affiliated with any government agency. Data is for informational purposes only."
                  : "Les données sont issues de portails gouvernementaux officiels, d'agences ONU et de bases de données publiques. TenderAtlas n'est affilié à aucune administration. Données à titre informatif."}
              </p>
              <p className="shrink-0">© {new Date().getFullYear()} TenderAtlas · MIT License</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

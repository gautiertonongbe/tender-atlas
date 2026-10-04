"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/lang";

interface Suggestion {
  tenders: { id: string; title: string; country: string; sector: string | null }[];
  entities: string[];
  countries: { code: string; name: string; flag: string }[];
  sectors: { slug: string; label: string; labelFr: string }[];
}

export function HeroSearch({ lang = "en" }: { lang?: Lang }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"" | "public" | "private">("");
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isEn = lang === "en";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with 200ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSuggestions(null); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`);
        const data: Suggestion = await res.json();
        const hasResults = data.tenders.length || data.entities.length || data.countries.length || data.sectors.length;
        setSuggestions(data);
        setOpen(!!hasResults);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent, override?: string) {
    e.preventDefault();
    const q = override ?? query;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("type", type);
    setOpen(false);
    router.push(`/tenders${params.toString() ? `?${params}` : ""}`);
  }

  function pickSuggestion(text: string) {
    setQuery(text);
    setOpen(false);
    const params = new URLSearchParams({ q: text });
    if (type) params.set("type", type);
    router.push(`/tenders?${params}`);
  }

  const hasSuggestions = suggestions && (
    suggestions.tenders.length || suggestions.entities.length ||
    suggestions.countries.length || suggestions.sectors.length
  );

  const TABS = [
    { key: "" as const,        label: isEn ? "All sources"       : "Toutes sources" },
    { key: "public" as const,  label: isEn ? "Public (Gov / UN)" : "Public (État / ONU)" },
    { key: "private" as const, label: isEn ? "Corporate & NGO"   : "Entreprises & ONG" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto" ref={containerRef}>
      <div className="flex items-center justify-center gap-1 mb-3">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setType(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              type === tab.key
                ? tab.key === "private" ? "bg-gold text-navy" : "bg-brand text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-2xl">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); }}
              onFocus={() => { if (hasSuggestions) setOpen(true); }}
              placeholder={
                type === "private"
                  ? (isEn ? "Search corporate & NGO tenders..." : "Rechercher entreprises & ONG...")
                  : (isEn ? "Search tenders, sectors, entities..." : "Rechercher appels d'offres, secteurs, entités...")
              }
              className="w-full px-4 py-3 text-navy text-base outline-none bg-transparent placeholder-gray-400"
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="bg-brand hover:bg-royal text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0 text-sm"
          >
            {isEn ? "Search" : "Rechercher"}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {open && hasSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left">

            {/* Countries */}
            {suggestions!.countries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  {isEn ? "Countries" : "Pays"}
                </p>
                {suggestions!.countries.map(c => (
                  <button key={c.code} type="button" onClick={() => router.push(`/country/${c.code.toLowerCase()}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-softbg transition-colors text-left">
                    <span className="text-lg shrink-0">{c.flag}</span>
                    <span className="text-sm font-medium text-navy">{c.name}</span>
                    <span className="ml-auto text-xs text-subtle">{isEn ? "Browse →" : "Voir →"}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sectors */}
            {suggestions!.sectors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  {isEn ? "Sectors" : "Secteurs"}
                </p>
                {suggestions!.sectors.map(s => (
                  <button key={s.slug} type="button" onClick={() => router.push(`/sector/${s.slug}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-softbg transition-colors text-left">
                    <span className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-navy">{isEn ? s.label : s.labelFr}</span>
                    <span className="ml-auto text-xs text-subtle">{isEn ? "Browse →" : "Voir →"}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Entities */}
            {suggestions!.entities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  {isEn ? "Organizations" : "Organisations"}
                </p>
                {suggestions!.entities.map(e => (
                  <button key={e} type="button" onClick={() => pickSuggestion(e)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-softbg transition-colors text-left">
                    <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-6h6v6" />
                      </svg>
                    </span>
                    <span className="text-sm text-navy truncate">{e}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tender titles */}
            {suggestions!.tenders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  {isEn ? "Tenders" : "Appels d'offres"}
                </p>
                {suggestions!.tenders.map(t => (
                  <button key={t.id} type="button" onClick={() => router.push(`/tenders/${t.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-softbg transition-colors text-left group">
                    <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <span className="text-sm text-navy truncate flex-1">{t.title}</span>
                    <span className="text-xs text-subtle shrink-0 ml-2">{t.country}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 px-4 py-2.5">
              <button type="submit" onClick={e => handleSearch(e)}
                className="text-xs text-brand font-semibold hover:underline">
                {isEn ? `Search all results for "${query}" →` : `Voir tous les résultats pour "${query}" →`}
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-gray-500 text-xs mt-3">
        {isEn
          ? <>Try: &ldquo;construction Côte d&apos;Ivoire&rdquo; · &ldquo;UNDP health&rdquo; · &ldquo;TotalEnergies Nigeria&rdquo;</>
          : <>Essayez : &ldquo;travaux Bénin&rdquo; · &ldquo;PNUD santé&rdquo; · &ldquo;TotalEnergies Nigeria&rdquo;</>}
      </p>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lang } from "@/lib/lang";

export function TenderSearch({ initialQuery, lang = "en" }: { initialQuery: string; lang?: Lang }) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEn = lang === "en";

  useEffect(() => { setQ(initialQuery); }, [initialQuery]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    params.delete("page");
    router.push(`/tenders?${params}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2 max-w-xl">
      <div className="flex-1 flex items-center gap-2 bg-white border border-rule rounded-xl px-4 py-2.5 focus-within:border-brand transition-colors shadow-sm">
        <svg className="w-4 h-4 text-subtle shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={isEn ? "Search by title, entity, keyword..." : "Rechercher par titre, entité, mot-clé..."}
          className="flex-1 text-sm text-navy outline-none bg-transparent placeholder-gray-400 min-w-0"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); const p = new URLSearchParams(searchParams.toString()); p.delete("q"); p.delete("page"); router.push(`/tenders?${p}`); }}
            className="text-subtle hover:text-navy text-lg leading-none">×</button>
        )}
      </div>
      <button type="submit"
        className="bg-brand hover:bg-royal text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">
        {isEn ? "Search" : "Rechercher"}
      </button>
    </form>
  );
}

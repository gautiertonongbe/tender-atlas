"use client";
import { useState } from "react";
import { COUNTRIES, SECTORS } from "@/lib/constants";
import type { Lang } from "@/lib/lang";

export function AlertsForm({ lang = "en" }: { lang?: Lang }) {
  const isEn = lang === "en";

  const [form, setForm] = useState({ name: "", email: "", company: "", countries: [] as string[], sectors: [] as string[] });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email) return;
    if (form.countries.length === 0) {
      setErrorMsg(isEn ? "Select at least one country." : "Sélectionnez au moins un pays.");
      return;
    }
    setState("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("success");
    } catch (err: any) {
      setErrorMsg(err.message || (isEn ? "Something went wrong. Please try again." : "Une erreur s'est produite. Réessayez."));
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-navy mb-3">
          {isEn ? "Check your inbox" : "Vérifiez votre boite mail"}
        </h1>
        <p className="text-subtle text-sm">
          {isEn
            ? <><strong>{form.email}</strong> — click the link to activate your alerts.</>
            : <>Cliquez sur le lien dans <strong>{form.email}</strong> pour activer vos alertes.</>}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-navy mb-2">
          {isEn ? "Get weekly tender alerts" : "Recevoir des alertes hebdomadaires"}
        </h1>
        <p className="text-subtle">
          {isEn
            ? "New tenders matching your criteria, delivered to your inbox every Monday. Free."
            : "Les nouveaux appels d'offres correspondant à vos critères, livrés dans votre boite mail chaque lundi. Gratuit."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">{isEn ? "Name" : "Nom"}</label>
            <input type="text" placeholder={isEn ? "Your name" : "Votre nom"} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" placeholder="you@company.com" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-1">{isEn ? "Company" : "Entreprise"}</label>
          <input type="text" placeholder={isEn ? "Your company name" : "Nom de votre entreprise"} value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            {isEn ? "Countries" : "Pays"} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <button type="button" key={code}
                onClick={() => setForm(f => ({ ...f, countries: toggle(f.countries, code) }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  form.countries.includes(code) ? "border-brand bg-pale text-brand font-semibold" : "border-rule text-mute hover:border-brand"
                }`}>
                <span>{c.flag}</span> {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            {isEn ? "Sectors (optional)" : "Secteurs (optionnel)"}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SECTORS).map(([slug, s]) => (
              <button type="button" key={slug}
                onClick={() => setForm(f => ({ ...f, sectors: toggle(f.sectors, slug) }))}
                className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                  form.sectors.includes(slug) ? "border-brand bg-pale text-brand font-semibold" : "border-rule text-subtle hover:border-brand"
                }`}>
                {isEn ? s.label : s.labelFr}
              </button>
            ))}
          </div>
          <p className="text-xs text-subtle mt-1">
            {isEn ? "Leave blank to receive all sectors." : "Laissez vide pour recevoir tous les secteurs."}
          </p>
        </div>

        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

        <button type="submit" disabled={state === "loading"}
          className="w-full bg-brand hover:bg-royal text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60">
          {state === "loading"
            ? (isEn ? "Subscribing..." : "Inscription en cours...")
            : (isEn ? "Subscribe to Alerts" : "S'abonner aux alertes")}
        </button>

        <p className="text-xs text-subtle text-center">
          {isEn
            ? "No spam. Unsubscribe any time. One email per week maximum."
            : "Pas de spam. Désinscription à tout moment. Un email par semaine maximum."}
        </p>
      </form>

    </div>
  );
}

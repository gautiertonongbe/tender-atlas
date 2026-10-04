export const COUNTRIES: Record<string, { name: string; flag: string; lang: "fr" | "en" }> = {
  BJ: { name: "Bénin",          flag: "🇧🇯", lang: "fr" },
  CI: { name: "Côte d'Ivoire",  flag: "🇨🇮", lang: "fr" },
  SN: { name: "Sénégal",        flag: "🇸🇳", lang: "fr" },
  CM: { name: "Cameroun",       flag: "🇨🇲", lang: "fr" },
  TG: { name: "Togo",           flag: "🇹🇬", lang: "fr" },
  BF: { name: "Burkina Faso",   flag: "🇧🇫", lang: "fr" },
  ML: { name: "Mali",           flag: "🇲🇱", lang: "fr" },
  GN: { name: "Guinée",         flag: "🇬🇳", lang: "fr" },
  NE: { name: "Niger",          flag: "🇳🇪", lang: "fr" },
  KE: { name: "Kenya",          flag: "🇰🇪", lang: "en" },
  RW: { name: "Rwanda",         flag: "🇷🇼", lang: "en" },
  ZA: { name: "South Africa",   flag: "🇿🇦", lang: "en" },
  NG: { name: "Nigeria",        flag: "🇳🇬", lang: "en" },
  GH: { name: "Ghana",          flag: "🇬🇭", lang: "en" },
};

export const SECTORS: Record<string, { label: string; labelFr: string }> = {
  health:        { label: "Health",         labelFr: "Santé" },
  construction:  { label: "Construction",   labelFr: "Travaux publics" },
  it:            { label: "IT & Digital",   labelFr: "Numérique" },
  transport:     { label: "Transport",      labelFr: "Transport & logistique" },
  education:     { label: "Education",      labelFr: "Éducation" },
  agriculture:   { label: "Agriculture",    labelFr: "Agriculture" },
  energy:        { label: "Energy",         labelFr: "Énergie & mines" },
  services:      { label: "Services",       labelFr: "Services & conseil" },
  supplies:      { label: "Supplies",       labelFr: "Fournitures" },
  other:         { label: "Other",          labelFr: "Autre" },
};

// Keywords used to classify tenders into sectors
export const SECTOR_KEYWORDS: Record<string, string[]> = {
  health:       ["santé", "médical", "médicament", "hôpital", "health", "medical", "hospital", "pharmaceutical", "pharmacy"],
  construction: ["construction", "bâtiment", "travaux", "routes", "infrastructure", "génie civil", "building", "works", "road"],
  it:           ["informatique", "numérique", "logiciel", "système", "technology", "software", "digital", "network", "it services"],
  transport:    ["transport", "logistique", "véhicule", "camion", "vehicle", "logistics", "fleet"],
  education:    ["éducation", "formation", "école", "université", "education", "training", "school"],
  agriculture:  ["agriculture", "élevage", "semence", "farming", "livestock", "seeds", "food"],
  energy:       ["énergie", "électricité", "mines", "pétrole", "energy", "electricity", "mining", "oil", "gas"],
  services:     ["consultant", "conseil", "audit", "étude", "expertise", "consulting", "advisory"],
  supplies:     ["fourniture", "équipement", "matériel", "mobilier", "supplies", "equipment", "furniture"],
};

export const PORTAL_LABELS: Record<string, string> = {
  armp_bj:       "ARMP Bénin",
  arcop_ci:      "ARCOP Côte d'Ivoire",
  anrmp_ci:      "ARCOP Côte d'Ivoire",
  dcmp_sn:       "DCMP Sénégal",
  armp_cm:       "ARMP Cameroun",
  armp_tg:       "ARMP Togo",
  armp_bf:       "ARMP Burkina Faso",
  armds_ml:      "ARMDS Mali",
  armp_gn:       "ARMP Guinée",
  armp_ne:       "ARMP Niger",
  ppra_ke:       "PPRA Kenya (tenders.go.ke)",
  rppa_rw:       "RPPA Rwanda",
  who:           "WHO — World Health Organization",
  ifad:          "IFAD — Agricultural Development",
  etenders_za:   "eTenders South Africa",
  bpp_ng:        "BPP Nigeria (NoCoPo)",
  ppa_gh:        "PPA Ghana",
  ungm:          "UNGM — UN Global Marketplace",
  worldbank:     "World Bank",
  afdb:          "African Development Bank",
  embassy_us:    "U.S. Embassy",
  embassy_fr:    "Ambassade de France",
  eu_africa:     "EU — International Partnerships",
  usaid_sam:     "USAID",
  totalenergies: "TotalEnergies",
  orange_ci:     "Orange / Sonatel",
};

export const SOURCE_TYPE_LABELS: Record<string, { en: string; fr: string }> = {
  government:    { en: "Government",    fr: "Marché public" },
  igo:           { en: "UN / IGO",      fr: "ONU / OIG" },
  ngo:           { en: "NGO",           fr: "ONG" },
  embassy:       { en: "Embassy",       fr: "Ambassade" },
  multinational: { en: "Corporate",     fr: "Entreprise" },
};

export const PROCUREMENT_TYPE: Record<string, { en: string; fr: string }> = {
  health:       { en: "Goods & Services",    fr: "Fournitures & Services" },
  construction: { en: "Works",               fr: "Travaux" },
  it:           { en: "IT Services",         fr: "Services IT" },
  transport:    { en: "Goods & Logistics",   fr: "Fournitures & Logistique" },
  education:    { en: "Services",            fr: "Services" },
  agriculture:  { en: "Goods & Services",   fr: "Fournitures & Services" },
  energy:       { en: "Works & Services",    fr: "Travaux & Services" },
  services:     { en: "Consulting Services", fr: "Services de conseil" },
  supplies:     { en: "Goods / Supplies",    fr: "Fournitures" },
  other:        { en: "Not specified",       fr: "Non précisé" },
};

export const ELIGIBILITY_NOTES: Record<string, { en: string; fr: string }> = {
  government:    { en: "Open to local and international firms registered in the country. Registration with the national procurement authority may be required.", fr: "Ouvert aux entreprises locales et internationales immatriculées dans le pays. Inscription auprès de l'autorité de passation des marchés peut être requise." },
  igo:           { en: "Open to international firms and consortiums. UNGM registration required for UN tenders. Eligibility criteria vary by agency.", fr: "Ouvert aux entreprises internationales et consortiums. Inscription UNGM requise pour les appels d'offres ONU. Critères d'éligibilité variables selon l'agence." },
  ngo:           { en: "Open to NGOs and civil society organizations meeting the donor's eligibility criteria.", fr: "Ouvert aux ONG et organisations de la société civile répondant aux critères d'éligibilité du bailleur." },
  embassy:       { en: "Open to international and local firms meeting embassy procurement standards. Contact the procurement office for prequalification.", fr: "Ouvert aux entreprises locales et internationales répondant aux normes d'achat de l'ambassade. Contacter le bureau des achats pour la préqualification." },
  multinational: { en: "Open to qualified vendors meeting the company's supplier standards. Prequalification or registration on the supplier portal may be required.", fr: "Ouvert aux fournisseurs qualifiés répondant aux normes du groupe. Une préqualification ou inscription sur le portail fournisseurs peut être requise." },
};

export function classifySector(text: string): string {
  const lower = text.toLowerCase();
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return sector;
  }
  return "other";
}

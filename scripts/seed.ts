/**
 * Seed script — inserts curated sample tenders to make the site functional immediately.
 * Run once: npx tsx scripts/seed.ts
 *
 * Data is representative of real tender types in each country/sector.
 * All tenders include source URLs pointing to real procurement portals.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { saveTenders, type TenderData } from "../scrapers/base";

const today = new Date();
const d = (daysFromNow: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + daysFromNow);
  return dt.toISOString().split("T")[0];
};
const pub = (daysAgo: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().split("T")[0];
};

const TENDERS: TenderData[] = [
  // Bénin — Government
  {
    sourceId: "armp-bj-2026-0142", sourcePortal: "armp_bj", country: "BJ",
    title: "Fourniture et installation de matériels informatiques pour les directions régionales du Trésor",
    entity: "Ministère de l'Économie et des Finances", sector: "IT",
    deadline: d(18), publishedAt: pub(5), currency: "XOF",
    sourceUrl: "https://armp.bj/category/actualites/appels-doffres/",
    sourceType: "government",
  },
  {
    sourceId: "armp-bj-2026-0141", sourcePortal: "armp_bj", country: "BJ",
    title: "Travaux de construction d'un centre de santé communautaire à Parakou",
    entity: "Ministère de la Santé", sector: "Health",
    deadline: d(25), publishedAt: pub(8), currency: "XOF",
    budgetLocal: 180_000_000,
    sourceUrl: "https://armp.bj/category/actualites/appels-doffres/",
    sourceType: "government",
  },
  {
    sourceId: "armp-bj-2026-0138", sourcePortal: "armp_bj", country: "BJ",
    title: "Prestation de services de gardiennage pour les bâtiments administratifs de l'État",
    entity: "Présidence de la République", sector: "Services",
    deadline: d(12), publishedAt: pub(3), currency: "XOF",
    sourceUrl: "https://armp.bj/category/actualites/appels-doffres/",
    sourceType: "government",
  },
  {
    sourceId: "armp-bj-2026-0130", sourcePortal: "armp_bj", country: "BJ",
    title: "Acquisition de médicaments essentiels et consommables médicaux pour les CSSP du Bénin",
    entity: "Centrale d'Achat des Médicaments Essentiels (CAME)", sector: "Health",
    deadline: d(30), publishedAt: pub(12), currency: "XOF", budgetLocal: 450_000_000,
    sourceUrl: "https://armp.bj/category/actualites/appels-doffres/",
    sourceType: "government",
  },

  // Côte d'Ivoire — Government
  {
    sourceId: "anrmp-ci-2026-1053", sourcePortal: "anrmp_ci", country: "CI",
    title: "Construction et équipement de 12 lycées professionnels agricoles en Côte d'Ivoire",
    entity: "Ministère de l'Agriculture", sector: "Agriculture",
    deadline: d(22), publishedAt: pub(7), currency: "XOF", budgetLocal: 2_400_000_000,
    sourceUrl: "https://www.anrmp.ci/index.php/appels-d-offres",
    sourceType: "government",
  },
  {
    sourceId: "anrmp-ci-2026-1049", sourcePortal: "anrmp_ci", country: "CI",
    title: "Fourniture de fournitures de bureau pour les ministères techniques",
    entity: "Primature - Direction Générale du Budget", sector: "Office Supplies",
    deadline: d(8), publishedAt: pub(6), currency: "XOF",
    sourceUrl: "https://www.anrmp.ci/index.php/appels-d-offres",
    sourceType: "government",
  },
  {
    sourceId: "anrmp-ci-2026-1047", sourcePortal: "anrmp_ci", country: "CI",
    title: "Réhabilitation du réseau routier urbain d'Abidjan — Phase III",
    entity: "Agence de Gestion des Routes (AGEROUTE CI)", sector: "Infrastructure",
    deadline: d(35), publishedAt: pub(10), currency: "XOF", budgetLocal: 5_800_000_000,
    sourceUrl: "https://www.anrmp.ci/index.php/appels-d-offres",
    sourceType: "government",
  },

  // Sénégal — Government
  {
    sourceId: "dcmp-sn-2026-0219", sourcePortal: "dcmp_sn", country: "SN",
    title: "Acquisition et déploiement d'un système de gestion des ressources humaines (SIGRHP)",
    entity: "Ministère de la Fonction Publique et du Renouveau du Service Public", sector: "IT",
    deadline: d(28), publishedAt: pub(4), currency: "XOF", budgetLocal: 320_000_000,
    sourceUrl: "https://www.dcmp.sn",
    sourceType: "government",
  },
  {
    sourceId: "dcmp-sn-2026-0215", sourcePortal: "dcmp_sn", country: "SN",
    title: "Travaux de construction d'infrastructures sportives dans les régions",
    entity: "Ministère des Sports", sector: "Infrastructure",
    deadline: d(20), publishedAt: pub(9), currency: "XOF",
    sourceUrl: "https://www.dcmp.sn",
    sourceType: "government",
  },

  // Cameroun — Government
  {
    sourceId: "armp-cm-2026-0873", sourcePortal: "armp_cm", country: "CM",
    title: "Acquisition de 200 camions bennes pour la collecte des ordures ménagères",
    entity: "Communauté Urbaine de Douala", sector: "Environment",
    deadline: d(40), publishedAt: pub(14), currency: "XAF", budgetLocal: 3_200_000_000,
    sourceUrl: "https://www.armp.cm",
    sourceType: "government",
  },
  {
    sourceId: "armp-cm-2026-0868", sourcePortal: "armp_cm", country: "CM",
    title: "Services de consultant pour l'audit des systèmes d'information bancaire",
    entity: "Commission Bancaire de l'Afrique Centrale (COBAC)", sector: "Finance",
    deadline: d(15), publishedAt: pub(6), currency: "XAF",
    sourceUrl: "https://www.armp.cm",
    sourceType: "government",
  },

  // Nigeria — Government
  {
    sourceId: "bpp-ng-2026-F4521", sourcePortal: "bpp_ng", country: "NG",
    title: "Supply of Medical Equipment to Federal Teaching Hospitals — Batch 4",
    entity: "Federal Ministry of Health", sector: "Health",
    deadline: d(21), publishedAt: pub(8), currency: "NGN", budgetLocal: 850_000_000,
    sourceUrl: "https://nocopo.bpp.gov.ng",
    sourceType: "government",
  },
  {
    sourceId: "bpp-ng-2026-F4488", sourcePortal: "bpp_ng", country: "NG",
    title: "Construction of 1,500 Housing Units under the National Housing Programme",
    entity: "Federal Ministry of Works and Housing", sector: "Infrastructure",
    deadline: d(45), publishedAt: pub(12), currency: "NGN", budgetLocal: 12_500_000_000,
    sourceUrl: "https://nocopo.bpp.gov.ng",
    sourceType: "government",
  },
  {
    sourceId: "bpp-ng-2026-F4455", sourcePortal: "bpp_ng", country: "NG",
    title: "Provision of ICT Infrastructure for the Integrated Personnel and Payroll Information System",
    entity: "Office of the Accountant General", sector: "IT",
    deadline: d(17), publishedAt: pub(5), currency: "NGN",
    sourceUrl: "https://nocopo.bpp.gov.ng",
    sourceType: "government",
  },

  // Ghana — Government
  {
    sourceId: "ppa-gh-2026-0341", sourcePortal: "ppa_gh", country: "GH",
    title: "Procurement of Textbooks and Learning Materials for Basic Schools — Ashanti Region",
    entity: "Ghana Education Service", sector: "Education",
    deadline: d(16), publishedAt: pub(7), currency: "GHS", budgetLocal: 4_200_000,
    sourceUrl: "https://www.ppa.gov.gh",
    sourceType: "government",
  },
  {
    sourceId: "ppa-gh-2026-0338", sourcePortal: "ppa_gh", country: "GH",
    title: "Supply and Installation of Solar-Powered Water Systems in Northern Ghana",
    entity: "Ghana Water Company Limited (GWCL)", sector: "Water & Sanitation",
    deadline: d(33), publishedAt: pub(11), currency: "GHS", budgetLocal: 8_500_000,
    sourceUrl: "https://www.ppa.gov.gh",
    sourceType: "government",
  },

  // South Africa — Government
  {
    sourceId: "za-etenders-2026-GT-INF-001", sourcePortal: "etenders_za", country: "ZA",
    title: "Appointment of a Service Provider for the Supply and Delivery of Computers and Peripherals",
    entity: "Gauteng Department of Education", sector: "IT",
    deadline: d(14), publishedAt: pub(4), currency: "ZAR", budgetLocal: 12_000_000,
    sourceUrl: "https://www.etenders.gov.za/content/advertised-bids",
    sourceType: "government",
  },
  {
    sourceId: "za-etenders-2026-NT-ICT-004", sourcePortal: "etenders_za", country: "ZA",
    title: "Development and Maintenance of an Integrated Financial Management System (IFMS)",
    entity: "National Treasury", sector: "IT",
    deadline: d(42), publishedAt: pub(15), currency: "ZAR", budgetLocal: 185_000_000,
    sourceUrl: "https://www.etenders.gov.za/content/advertised-bids",
    sourceType: "government",
  },
  {
    sourceId: "za-etenders-2026-NHI-003", sourcePortal: "etenders_za", country: "ZA",
    title: "Supply of ARV Medicines to Clinics under National Health Insurance Pilot",
    entity: "Department of Health — Western Cape", sector: "Health",
    deadline: d(11), publishedAt: pub(3), currency: "ZAR", budgetLocal: 45_000_000,
    sourceUrl: "https://www.etenders.gov.za/content/advertised-bids",
    sourceType: "government",
  },

  // UNGM / UN Agencies (IGO)
  {
    sourceId: "ungm-undp-bj-2026-031", sourcePortal: "ungm", country: "BJ",
    title: "Procurement of Renewable Energy Equipment for Rural Electrification in Bénin",
    entity: "UNDP Bénin", sector: "Energy",
    deadline: d(24), publishedAt: pub(6), currency: "USD", budgetLocal: 850_000,
    sourceUrl: "https://www.ungm.org/Public/Notice",
    sourceType: "igo", donor: "UNDP",
  },
  {
    sourceId: "ungm-unicef-ng-2026-048", sourcePortal: "ungm", country: "NG",
    title: "Supply of Ready-to-Use Therapeutic Food (RUTF) for Severe Acute Malnutrition Treatment",
    entity: "UNICEF Nigeria", sector: "Health",
    deadline: d(19), publishedAt: pub(9), currency: "USD", budgetLocal: 1_200_000,
    sourceUrl: "https://www.ungm.org/Public/Notice",
    sourceType: "igo", donor: "UNICEF",
  },
  {
    sourceId: "ungm-wfp-ci-2026-022", sourcePortal: "ungm", country: "CI",
    title: "Local Purchase of Fortified Blended Food Commodities for School Feeding Programme",
    entity: "WFP Côte d'Ivoire", sector: "Food & Agriculture",
    deadline: d(13), publishedAt: pub(4), currency: "USD",
    sourceUrl: "https://www.ungm.org/Public/Notice",
    sourceType: "igo", donor: "WFP",
  },
  {
    sourceId: "ungm-who-cm-2026-019", sourcePortal: "ungm", country: "CM",
    title: "Supply of Essential Medicines and Vaccines — WHO Cameroon Country Office",
    entity: "WHO Cameroon", sector: "Health",
    deadline: d(28), publishedAt: pub(5), currency: "USD", budgetLocal: 420_000,
    sourceUrl: "https://www.ungm.org/Public/Notice",
    sourceType: "igo", donor: "WHO",
  },
  {
    sourceId: "ungm-unhcr-cm-2026-015", sourcePortal: "ungm", country: "CM",
    title: "Supply of Shelter and NFI (Non-Food Items) for Refugees in the Far North Region",
    entity: "UNHCR Cameroon", sector: "Humanitarian Aid",
    deadline: d(10), publishedAt: pub(3), currency: "USD", budgetLocal: 680_000,
    sourceUrl: "https://www.ungm.org/Public/Notice",
    sourceType: "igo", donor: "UNHCR",
  },
  {
    sourceId: "ungm-iom-sn-2026-009", sourcePortal: "ungm", country: "SN",
    title: "Consultancy Services: Development of a National Migration Database for Sénégal",
    entity: "IOM Senegal", sector: "IT",
    deadline: d(30), publishedAt: pub(11), currency: "USD",
    sourceUrl: "https://www.ungm.org/Public/Notice",
    sourceType: "igo", donor: "IOM",
  },
  {
    sourceId: "ungm-undp-gh-2026-037", sourcePortal: "ungm", country: "GH",
    title: "Procurement of Vehicles for Electoral Commission Support Programme — Ghana",
    entity: "UNDP Ghana", sector: "Transportation",
    deadline: d(20), publishedAt: pub(8), currency: "USD", budgetLocal: 320_000,
    sourceUrl: "https://www.ungm.org/Public/Notice",
    sourceType: "igo", donor: "UNDP",
  },

  // World Bank (IGO)
  {
    sourceId: "wb-p179802", sourcePortal: "worldbank", country: "BJ",
    title: "[WB Project] Bénin Digital Infrastructure and Financial Services Project",
    description: "World Bank-financed project covering digital infrastructure, payment systems and financial inclusion.",
    entity: "Ministry of Digital Economy", sector: "IT",
    deadline: d(60), publishedAt: pub(30), currency: "USD", budgetLocal: 80_000_000,
    sourceUrl: "https://projects.worldbank.org/en/projects-operations/procurement/noticeDetail?id=P179802",
    sourceType: "igo", donor: "World Bank",
  },
  {
    sourceId: "wb-p171654", sourcePortal: "worldbank", country: "CI",
    title: "[WB Project] Côte d'Ivoire Urban Resilience Project — Road and Drainage Works",
    description: "Urban infrastructure project — procurement of civil works contractors for drainage and road rehabilitation.",
    entity: "District Autonome d'Abidjan", sector: "Infrastructure",
    deadline: d(50), publishedAt: pub(20), currency: "USD", budgetLocal: 200_000_000,
    sourceUrl: "https://projects.worldbank.org/en/projects-operations/procurement/noticeDetail?id=P171654",
    sourceType: "igo", donor: "World Bank",
  },
  {
    sourceId: "wb-p163013", sourcePortal: "worldbank", country: "SN",
    title: "[WB Project] Sénégal Electricity Access Scale-Up Project (SEAS)",
    description: "Procurement for materials, equipment and services for rural electrification across Sénégal.",
    entity: "SENELEC / Ministry of Energy", sector: "Energy",
    deadline: d(45), publishedAt: pub(25), currency: "USD", budgetLocal: 150_000_000,
    sourceUrl: "https://projects.worldbank.org/en/projects-operations/procurement/noticeDetail?id=P163013",
    sourceType: "igo", donor: "World Bank",
  },

  // AfDB (IGO)
  {
    sourceId: "afdb-ci-p-z1-00b-030", sourcePortal: "afdb", country: "CI",
    title: "Consultancy: Feasibility Study for Abidjan–San Pédro Railway Corridor",
    entity: "Ministère des Transports — Côte d'Ivoire", sector: "Infrastructure",
    deadline: d(38), publishedAt: pub(10), currency: "USD", budgetLocal: 1_500_000,
    sourceUrl: "https://www.afdb.org/en/projects-and-operations/procurement",
    sourceType: "igo", donor: "African Development Bank",
  },
  {
    sourceId: "afdb-ng-p-z1-055-002", sourcePortal: "afdb", country: "NG",
    title: "Supply and Installation of Power Transformers — Nigeria Transmission Rehabilitation Project",
    entity: "Transmission Company of Nigeria (TCN)", sector: "Energy",
    deadline: d(32), publishedAt: pub(8), currency: "USD", budgetLocal: 4_800_000,
    sourceUrl: "https://www.afdb.org/en/projects-and-operations/procurement",
    sourceType: "igo", donor: "African Development Bank",
  },

  // USAID (IGO)
  {
    sourceId: "usaid-gh-sra-2026-001", sourcePortal: "usaid_sam", country: "GH",
    title: "Request for Proposals: Strengthening Agricultural Value Chains in Northern Ghana",
    entity: "USAID Ghana Mission", sector: "Agriculture",
    deadline: d(26), publishedAt: pub(7), currency: "USD", budgetLocal: 6_000_000,
    sourceUrl: "https://www.usaid.gov/ghana/work-with-us/procurement",
    sourceType: "igo", donor: "USAID",
  },
  {
    sourceId: "usaid-sn-hss-2026-003", sourcePortal: "usaid_sam", country: "SN",
    title: "Health System Strengthening Program — Procurement of Lab Equipment and Diagnostics",
    entity: "USAID Senegal Mission", sector: "Health",
    deadline: d(22), publishedAt: pub(5), currency: "USD", budgetLocal: 2_500_000,
    sourceUrl: "https://www.usaid.gov/senegal/work-with-us/procurement",
    sourceType: "igo", donor: "USAID",
  },

  // EU Africa (IGO)
  {
    sourceId: "eu-africa-ci-2026-edf-041", sourcePortal: "eu_africa", country: "CI",
    title: "Services d'assistance technique — Programme d'appui à la décentralisation (EDF11)",
    entity: "Délégation de l'UE en Côte d'Ivoire", sector: "Governance",
    deadline: d(35), publishedAt: pub(9), currency: "EUR", budgetLocal: 1_800_000,
    sourceUrl: "https://international-partnerships.ec.europa.eu/funding/funding-opportunities_en",
    sourceType: "igo", donor: "European Union",
  },
  {
    sourceId: "eu-africa-bj-2026-edf-018", sourcePortal: "eu_africa", country: "BJ",
    title: "Fourniture de matériel et équipements pédagogiques pour les centres de formation professionnelle",
    entity: "Délégation de l'UE au Bénin", sector: "Education",
    deadline: d(18), publishedAt: pub(6), currency: "EUR",
    sourceUrl: "https://international-partnerships.ec.europa.eu/funding/funding-opportunities_en",
    sourceType: "igo", donor: "European Union",
  },

  // Multinationals / Embassies (Private)
  {
    sourceId: "totalenergies-ng-2026-089", sourcePortal: "totalenergies", country: "NG",
    title: "Provision of Offshore Inspection and Maintenance Services — Akpo Field Nigeria",
    entity: "TotalEnergies EP Nigeria", sector: "Oil & Gas",
    deadline: d(29), publishedAt: pub(8), currency: "USD", budgetLocal: 3_200_000,
    sourceUrl: "https://suppliers.totalenergies.com/site/totalenergies/en/s/notice-list",
    sourceType: "multinational", donor: "TotalEnergies",
  },
  {
    sourceId: "mtn-za-2026-0112", sourcePortal: "mtn", country: "ZA",
    title: "Supply of Network Equipment: Radio Access Network Upgrade Programme",
    entity: "MTN South Africa", sector: "Telecom",
    deadline: d(37), publishedAt: pub(12), currency: "ZAR", budgetLocal: 85_000_000,
    sourceUrl: "https://www.mtn.com/procurement/",
    sourceType: "multinational", donor: "MTN Group",
  },
  {
    sourceId: "orange-ci-2026-0045", sourcePortal: "orange_ci", country: "CI",
    title: "Travaux de génie civil pour l'extension du réseau fibre optique en Côte d'Ivoire",
    entity: "Orange Côte d'Ivoire", sector: "Telecom",
    deadline: d(24), publishedAt: pub(7), currency: "XOF", budgetLocal: 1_200_000_000,
    sourceUrl: "https://www.orange.ci/fournisseurs",
    sourceType: "multinational", donor: "Orange / Sonatel",
  },
  {
    sourceId: "embassyus-sn-2026-Q-668", sourcePortal: "embassy_us", country: "SN",
    title: "Construction Services: Renovation of U.S. Embassy Compound Annex — Dakar",
    entity: "U.S. Embassy Dakar", sector: "Construction",
    deadline: d(20), publishedAt: pub(5), currency: "USD", budgetLocal: 1_800_000,
    sourceUrl: "https://www.usembassy.gov/dakar/procurement/",
    sourceType: "embassy", donor: "U.S. Embassy",
  },
  {
    sourceId: "embassyfr-ci-2026-MH-2026", sourcePortal: "embassy_fr", country: "CI",
    title: "Marché de services : Nettoyage et entretien des locaux de l'Ambassade de France",
    entity: "Ambassade de France à Abidjan", sector: "Services",
    deadline: d(9), publishedAt: pub(3), currency: "EUR",
    sourceUrl: "https://ci.ambafrance.org/appels-d-offres",
    sourceType: "embassy", donor: "French Embassy",
  },
];

async function main() {
  console.log(`Seeding ${TENDERS.length} tenders...`);
  const result = await saveTenders(TENDERS);
  console.log(`Done: +${result.inserted} inserted, ${result.skipped} skipped`);
}

main().catch(err => { console.error("Seed failed:", err); process.exit(1); });

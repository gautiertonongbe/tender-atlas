import { getDb } from "./db";
import { tenders, alertSubscriptions } from "./schema";
import { and, desc, eq, isNotNull, like, or, count, inArray, sql, gte, max } from "drizzle-orm";

export interface TenderFilters {
  country?: string;
  sector?: string;
  search?: string;
  /** "public" = government + igo | "private" = multinational + embassy + ngo */
  type?: "public" | "private" | string;
  page?: number;
  limit?: number;
}

export async function getTenders(filters: TenderFilters = {}) {
  const db = getDb();
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const offset = (page - 1) * limit;

  const conditions = [
    eq(tenders.status, "open"),
    or(isNotNull(tenders.deadline), sql`1=1`),
  ];

  if (filters.country) conditions.push(eq(tenders.country, filters.country.toUpperCase()));
  if (filters.sector)  conditions.push(eq(tenders.sector, filters.sector));
  if (filters.type === "public")  conditions.push(inArray(tenders.sourceType, ["government", "igo"]));
  if (filters.type === "private") conditions.push(inArray(tenders.sourceType, ["multinational", "embassy", "ngo"]));
  if (filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(or(like(tenders.title, q), like(tenders.entity, q), like(tenders.description, q))!);
  }

  const rows = await db
    .select({
      id: tenders.id, country: tenders.country, title: tenders.title,
      entity: tenders.entity, sector: tenders.sector,
      deadline: tenders.deadline, publishedAt: tenders.publishedAt,
      sourceUrl: tenders.sourceUrl, sourcePortal: tenders.sourcePortal,
      sourceType: tenders.sourceType, donor: tenders.donor,
      currency: tenders.currency, budgetLocal: tenders.budgetLocal,
      status: tenders.status, createdAt: tenders.createdAt,
    })
    .from(tenders)
    .where(and(...conditions))
    .orderBy(desc(tenders.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(tenders)
    .where(and(...conditions));

  return { rows, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getTenderById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
  return row || null;
}

export async function getStats() {
  const db = getDb();
  const [totals] = await db.select({ total: count() }).from(tenders).where(eq(tenders.status, "open"));
  const byCountry = await db
    .select({ country: tenders.country, total: count() })
    .from(tenders).where(eq(tenders.status, "open"))
    .groupBy(tenders.country);
  const bySector = await db
    .select({ sector: tenders.sector, total: count() })
    .from(tenders).where(eq(tenders.status, "open"))
    .groupBy(tenders.sector)
    .orderBy(desc(count()))
    .limit(6);

  return { total: totals.total, byCountry, bySector };
}

export async function getHeroStats() {
  const db = getDb();
  const yesterday = new Date(Date.now() - 86_400_000);

  const [
    [totals],
    [todayRow],
    topCountries,
    topSectors,
    [lastRow],
    [portalRow],
  ] = await Promise.all([
    db.select({ total: count() }).from(tenders).where(eq(tenders.status, "open")),
    db.select({ added: count() }).from(tenders).where(
      and(eq(tenders.status, "open"), gte(tenders.createdAt, yesterday))
    ),
    db.select({ country: tenders.country, total: count() })
      .from(tenders).where(eq(tenders.status, "open"))
      .groupBy(tenders.country).orderBy(desc(count())).limit(1),
    db.select({ sector: tenders.sector, total: count() })
      .from(tenders).where(eq(tenders.status, "open"))
      .groupBy(tenders.sector).orderBy(desc(count())).limit(1),
    db.select({ lastAt: max(tenders.createdAt) }).from(tenders).where(eq(tenders.status, "open")),
    db.select({ portals: sql<number>`COUNT(DISTINCT ${tenders.sourcePortal})` }).from(tenders).where(eq(tenders.status, "open")),
  ]);

  return {
    total: totals.total,
    addedToday: todayRow.added,
    topCountry: topCountries[0]?.country || null,
    topSector: topSectors[0]?.sector || null,
    lastUpdatedAt: lastRow.lastAt ? new Date(lastRow.lastAt) : null,
    activePortals: Number(portalRow.portals) || 0,
  };
}

export async function getSearchSuggestions(q: string) {
  if (!q || q.trim().length < 2) return { tenders: [], entities: [], countries: [] };
  const db = getDb();
  const term = `%${q.trim()}%`;

  const [matchedTenders, matchedEntities] = await Promise.all([
    db.select({ id: tenders.id, title: tenders.title, country: tenders.country, sector: tenders.sector })
      .from(tenders)
      .where(and(eq(tenders.status, "open"), like(tenders.title, term)))
      .orderBy(desc(tenders.createdAt))
      .limit(6),
    db.selectDistinct({ entity: tenders.entity })
      .from(tenders)
      .where(and(eq(tenders.status, "open"), isNotNull(tenders.entity), like(tenders.entity, term)))
      .limit(4),
  ]);

  return {
    tenders: matchedTenders,
    entities: matchedEntities.map(r => r.entity).filter(Boolean) as string[],
  };
}

export async function getRecentTenders(country?: string, limit = 5) {
  const db = getDb();
  const where = country ? eq(tenders.country, country) : undefined;
  return db.select({
    id: tenders.id, title: tenders.title, country: tenders.country,
    sector: tenders.sector, deadline: tenders.deadline, publishedAt: tenders.publishedAt,
    sourcePortal: tenders.sourcePortal, sourceType: tenders.sourceType,
    entity: tenders.entity, donor: tenders.donor, status: tenders.status,
  })
  .from(tenders)
  .where(where)
  .orderBy(desc(tenders.createdAt))
  .limit(limit);
}

export async function getRelatedTenders(tenderId: string, sector: string | null, country: string, limit = 6) {
  const db = getDb();

  // Priority 1: same sector + same country (open only)
  const sameSectorCountry = sector
    ? await db.select({
        id: tenders.id, title: tenders.title, country: tenders.country,
        sector: tenders.sector, deadline: tenders.deadline, sourcePortal: tenders.sourcePortal,
        sourceType: tenders.sourceType, status: tenders.status,
      })
      .from(tenders)
      .where(and(
        eq(tenders.sector, sector),
        eq(tenders.country, country),
        eq(tenders.status, "open"),
        sql`${tenders.id} != ${tenderId}`,
      ))
      .orderBy(desc(tenders.createdAt))
      .limit(limit)
    : [];

  if (sameSectorCountry.length >= limit) return sameSectorCountry;

  // Priority 2: same sector, any country (open only)
  const sameSector = sector && sameSectorCountry.length < limit
    ? await db.select({
        id: tenders.id, title: tenders.title, country: tenders.country,
        sector: tenders.sector, deadline: tenders.deadline, sourcePortal: tenders.sourcePortal,
        sourceType: tenders.sourceType, status: tenders.status,
      })
      .from(tenders)
      .where(and(
        eq(tenders.sector, sector),
        eq(tenders.status, "open"),
        sql`${tenders.id} != ${tenderId}`,
        sql`${tenders.country} != ${country}`,
      ))
      .orderBy(desc(tenders.createdAt))
      .limit(limit - sameSectorCountry.length)
    : [];

  const combined = [...sameSectorCountry, ...sameSector];
  if (combined.length >= limit) return combined;

  // Priority 3: same country, any sector (open only)
  const existingIds = new Set([tenderId, ...combined.map(t => t.id)]);
  const sameCountry = await db.select({
    id: tenders.id, title: tenders.title, country: tenders.country,
    sector: tenders.sector, deadline: tenders.deadline, sourcePortal: tenders.sourcePortal,
    sourceType: tenders.sourceType, status: tenders.status,
  })
  .from(tenders)
  .where(and(
    eq(tenders.country, country),
    eq(tenders.status, "open"),
    sql`${tenders.id} NOT IN (${sql.join(Array.from(existingIds).map(id => sql`${id}`), sql`, `)})`,
  ))
  .orderBy(desc(tenders.createdAt))
  .limit(limit - combined.length);

  return [...combined, ...sameCountry].slice(0, limit);
}

import { mysqlTable, varchar, text, bigint, date, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/mysql-core";

export const tenders = mysqlTable("tenders", {
  id:           varchar("id", { length: 36 }).primaryKey(),
  sourceId:     varchar("source_id", { length: 500 }).notNull(),
  sourcePortal: varchar("source_portal", { length: 50 }).notNull(), // arcop_bj, anrmp_ci, bpp_ng...
  country:      varchar("country", { length: 5 }).notNull(),        // BJ, CI, SN, CM, ZA, NG, GH
  title:        text("title").notNull(),
  description:  text("description"),
  entity:       varchar("entity", { length: 500 }),                 // procuring entity / ministry
  sector:       varchar("sector", { length: 100 }),
  budgetLocal:  bigint("budget_local", { mode: "number" }),
  currency:     varchar("currency", { length: 10 }),
  deadline:     date("deadline"),
  publishedAt:  date("published_at"),
  sourceUrl:    text("source_url"),
  sourceType:   varchar("source_type", { length: 30 }).default("government"), // government | igo | ngo | embassy | multinational
  donor:        varchar("donor", { length: 255 }),                  // World Bank, EU, USAID, UNDP...
  status:       varchar("status", { length: 20 }).default("open"),
  rawHtml:      text("raw_html"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => ({
  dedup:       uniqueIndex("tenders_dedup").on(t.sourcePortal, t.sourceId),
  countryIdx:  index("tenders_country").on(t.country),
  sectorIdx:   index("tenders_sector").on(t.sector),
  deadlineIdx: index("tenders_deadline").on(t.deadline),
  statusIdx:   index("tenders_status").on(t.status),
}));

export const alertSubscriptions = mysqlTable("alert_subscriptions", {
  id:            varchar("id", { length: 36 }).primaryKey(),
  email:         varchar("email", { length: 255 }).notNull(),
  name:          varchar("name", { length: 255 }),
  company:       varchar("company", { length: 255 }),
  countries:     text("countries").notNull(),  // JSON: ["CI","BJ"]
  sectors:       text("sectors").notNull(),    // JSON: ["health","construction"]
  frequency:     varchar("frequency", { length: 20 }).default("weekly"),
  confirmed:     boolean("confirmed").default(false),
  confirmToken:  varchar("confirm_token", { length: 100 }),
  isLead:   boolean("is_lead").default(false),
  unsubToken:    varchar("unsub_token", { length: 100 }),
  lastDigestAt:  timestamp("last_digest_at"),
  createdAt:     timestamp("created_at").defaultNow(),
}, (t) => ({
  emailIdx: index("alerts_email").on(t.email),
}));

export type Tender = typeof tenders.$inferSelect;
export type NewTender = typeof tenders.$inferInsert;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;

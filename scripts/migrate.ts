import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

async function migrate() {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true },
  });

  console.log("Running migrations...");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tenders (
      id            VARCHAR(36)  PRIMARY KEY,
      source_id     VARCHAR(500) NOT NULL,
      source_portal VARCHAR(50)  NOT NULL,
      country       VARCHAR(5)   NOT NULL,
      title         TEXT         NOT NULL,
      description   TEXT,
      entity        VARCHAR(500),
      sector        VARCHAR(100),
      budget_local  BIGINT,
      currency      VARCHAR(10),
      deadline      DATE,
      published_at  DATE,
      source_url    TEXT,
      status        VARCHAR(20)  DEFAULT 'open',
      raw_html      TEXT,
      created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY tenders_dedup (source_portal(50), source_id(255)),
      INDEX tenders_country (country),
      INDEX tenders_sector  (sector),
      INDEX tenders_deadline (deadline),
      INDEX tenders_status  (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS alert_subscriptions (
      id             VARCHAR(36)  PRIMARY KEY,
      email          VARCHAR(255) NOT NULL,
      name           VARCHAR(255),
      company        VARCHAR(255),
      countries      TEXT         NOT NULL,
      sectors        TEXT         NOT NULL,
      frequency      VARCHAR(20)  DEFAULT 'weekly',
      confirmed      TINYINT(1)   DEFAULT 0,
      confirm_token  VARCHAR(100),
      is_lead   TINYINT(1)   DEFAULT 0,
      unsub_token    VARCHAR(100),
      last_digest_at TIMESTAMP    NULL,
      created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      INDEX alerts_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // v2: source_type + donor columns
  await conn.execute("ALTER TABLE tenders ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'government'").catch(()=>{});
  await conn.execute("ALTER TABLE tenders ADD COLUMN IF NOT EXISTS donor VARCHAR(255)").catch(()=>{});

  console.log("Migrations complete.");
  await conn.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });

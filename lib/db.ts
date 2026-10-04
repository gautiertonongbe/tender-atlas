import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL!,
      ssl: { rejectUnauthorized: true },
      connectionLimit: 5,
      waitForConnections: true,
    });
    _db = drizzle(pool, { schema, mode: "default" });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get: (_, prop) => getDb()[prop as keyof ReturnType<typeof drizzle>],
});

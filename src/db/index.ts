import { drizzle } from "drizzle-orm/sqlite-proxy";
import Database from "@tauri-apps/plugin-sql";
import * as schema from "./schema";

let dbInstance: Database | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:petoneai.db");
  }
  return dbInstance;
}

export const db = drizzle(
  async (
    query: string,
    params: any[],
    method: "run" | "all" | "values" | "get",
  ) => {
    const database = await getDb();

    if (method === "all") {
      const result = await database.select<any[]>(query, params);
      return { rows: result.map((row) => Object.values(row)) };
    } else if (method === "get") {
      const result = await database.select<any[]>(query, params);
      const row = result[0] ? Object.values(result[0]) : [];
      return { rows: [row] };
    } else if (method === "run") {
      await database.execute(query, params);
      return { rows: [] };
    } else if (method === "values") {
      const result = await database.select<any[]>(query, params);
      return { rows: result.map((row) => Object.values(row)) };
    }
    return { rows: [] };
  },
  { schema },
);

// ---------------------------------------------------------------------------
// Raw SQL helper
// ---------------------------------------------------------------------------
export async function runRawSql(sql: string) {
  const database = await getDb();
  return database.execute(sql);
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------
import migration0000 from "./migrations/0000_curved_red_hulk.sql?raw";
import migration0001 from "./migrations/0001_product_management.sql?raw";

const migrations = [migration0000, migration0001];

export async function runMigrations() {
  try {
    for (const migrationSql of migrations) {
      const queries = migrationSql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const q of queries) {
        await runRawSql(q);
      }
    }
    console.log("All migrations ran successfully");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

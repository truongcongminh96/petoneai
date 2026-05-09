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

export const db = drizzle(async (query: string, params: any[], method: 'run' | 'all' | 'values' | 'get') => {
  const db = await getDb();
  
  if (method === "all") {
    const result = await db.select<any[]>(query, params);
    return { rows: result.map((row) => Object.values(row)) };
  } else if (method === "get") {
    const result = await db.select<any[]>(query, params);
    const row = result[0] ? Object.values(result[0]) : [];
    return { rows: [row] };
  } else if (method === "run") {
    await db.execute(query, params);
    return { rows: [] };
  } else if (method === "values") {
    const result = await db.select<any[]>(query, params);
    return { rows: result.map((row) => Object.values(row)) };
  }
  return { rows: [] };
}, { schema });

// Helper to run raw SQL (e.g. for migrations)
export async function runRawSql(sql: string) {
  const db = await getDb();
  return db.execute(sql);
}

import migrationSql from "./migrations/0000_curved_red_hulk.sql?raw";

export async function runMigrations() {
  try {
    const queries = migrationSql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
    for (const q of queries) {
      await runRawSql(q);
    }
    console.log("Migrations ran successfully");
  } catch (err) {
    console.error("Migration failed", err);
  }
}


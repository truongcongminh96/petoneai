import { drizzle } from "drizzle-orm/sqlite-proxy";
import Database from "@tauri-apps/plugin-sql";
import * as schema from "./schema";
import { createE2eDatabase } from "./e2eDatabase";

let dbInstance: Database | null = null;

export async function getDb() {
  if (import.meta.env.VITE_E2E === "1") {
    return createE2eDatabase() as unknown as Database;
  }

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
import migration0002 from "./migrations/0002_inventory_workflow.sql?raw";

const migrations = [
  { id: "0000_curved_red_hulk", sql: migration0000 },
  { id: "0001_product_management", sql: migration0001 },
  { id: "0002_inventory_workflow", sql: migration0002 },
];

async function tableExists(name: string) {
  const database = await getDb();
  const result = await database.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [name],
  );
  return result.length > 0;
}

export async function runMigrations() {
  try {
    const hasCoreSchema = await tableExists("product_categories");

    await runRawSql(
      "CREATE TABLE IF NOT EXISTS `__petoneai_migrations` (`id` text PRIMARY KEY NOT NULL, `applied_at` text DEFAULT CURRENT_TIMESTAMP)",
    );

    if (hasCoreSchema) {
      await runRawSql(
        "INSERT OR IGNORE INTO `__petoneai_migrations` (`id`) VALUES ('0000_curved_red_hulk'), ('0001_product_management')",
      );
    }

    const database = await getDb();
    for (const migration of migrations) {
      const applied = await database.select<{ id: string }[]>(
        "SELECT id FROM `__petoneai_migrations` WHERE id = ?",
        [migration.id],
      );
      if (applied.length > 0) continue;

      const queries = migration.sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const q of queries) {
        await runRawSql(q);
      }
      await database.execute(
        "INSERT INTO `__petoneai_migrations` (`id`) VALUES (?)",
        [migration.id],
      );
    }
    console.log("All migrations ran successfully");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

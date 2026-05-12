import { getDb } from "@/db";

const backupTables = [
  "product_categories",
  "products",
  "suppliers",
  "purchase_orders",
  "purchase_order_items",
  "stock_movements",
  "sales",
  "sale_items",
  "expenses",
  "local_users",
] as const;

const restoreOrder = [
  "stock_movements",
  "purchase_order_items",
  "purchase_orders",
  "sale_items",
  "sales",
  "expenses",
  "products",
  "product_categories",
  "suppliers",
  "local_users",
] as const;

export type BackupData = {
  version: 1;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
};

export async function createBackupData(): Promise<BackupData> {
  const database = await getDb();
  const tables: BackupData["tables"] = {};

  for (const table of backupTables) {
    tables[table] = await database.select<Record<string, unknown>[]>(
      `SELECT * FROM ${table}`,
    );
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `petoneai-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function assertKnownTable(table: string) {
  if (!backupTables.includes(table as (typeof backupTables)[number])) {
    throw new Error(`Bảng backup không hợp lệ: ${table}`);
  }
}

export async function restoreBackupData(data: BackupData) {
  if (data.version !== 1 || !data.tables) {
    throw new Error("File backup không đúng định dạng.");
  }

  const database = await getDb();
  await database.execute("BEGIN");
  try {
    for (const table of restoreOrder) {
      await database.execute(`DELETE FROM ${table}`);
    }

    for (const table of backupTables) {
      assertKnownTable(table);
      for (const row of data.tables[table] ?? []) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        const placeholders = columns.map(() => "?").join(", ");
        const columnSql = columns.map((column) => `\`${column}\``).join(", ");
        await database.execute(
          `INSERT INTO ${table} (${columnSql}) VALUES (${placeholders})`,
          columns.map((column) => row[column] ?? null),
        );
      }
    }

    await database.execute("COMMIT");
  } catch (error) {
    await database.execute("ROLLBACK");
    throw error;
  }
}

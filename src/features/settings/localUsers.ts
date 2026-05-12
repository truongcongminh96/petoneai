import { getDb } from "@/db";
import type { LocalUser } from "@/db/schema";

const activeUserKey = "petoneai.activeUserId";

export async function loadLocalUsers() {
  const database = await getDb();
  return database.select<LocalUser[]>(
    "SELECT * FROM local_users ORDER BY id ASC",
  );
}

export async function createLocalUser(name: string, role: string, pin: string) {
  const database = await getDb();
  await database.execute(
    "INSERT INTO local_users (name, role, pin, active) VALUES (?, ?, ?, true)",
    [name.trim(), role, pin.trim()],
  );
}

export async function setUserActive(id: number, active: boolean) {
  const database = await getDb();
  await database.execute("UPDATE local_users SET active = ? WHERE id = ?", [
    active,
    id,
  ]);
}

export function getActiveUserId() {
  const value = window.localStorage.getItem(activeUserKey);
  return value ? Number(value) : null;
}

export function setActiveUserId(id: number) {
  window.localStorage.setItem(activeUserKey, id.toString());
}

export function canManageSensitiveData(user: LocalUser | null) {
  return user?.role === "owner" || user?.role === "manager";
}

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LocalUser } from "@/db/schema";
import { resetDemoData, seedProducts } from "@/db/seed";
import {
  createBackupData,
  downloadBackup,
  restoreBackupData,
  type BackupData,
} from "./backup";
import {
  canManageSensitiveData,
  createLocalUser,
  getActiveUserId,
  loadLocalUsers,
  setActiveUserId,
  setUserActive,
} from "./localUsers";

const roleLabels: Record<string, string> = {
  owner: "Chủ shop",
  manager: "Quản lý",
  cashier: "Thu ngân",
};

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Lỗi không xác định.";
  }
}

export function Settings() {
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [activeUserId, setActiveUserIdState] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("cashier");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  const hasUsers = users.length > 0;
  const hasPrivilegedUser = users.some(
    (user) => user.active && (user.role === "owner" || user.role === "manager"),
  );
  const activeUser =
    users.find((user) => user.id === activeUserId) ?? users[0] ?? null;
  const canManage =
    !hasUsers || !hasPrivilegedUser || canManageSensitiveData(activeUser);
  const effectiveRole = hasUsers ? role : "owner";

  async function reloadUsers() {
    const rows = await loadLocalUsers();
    setUsers(rows);
    const storedId = getActiveUserId();
    const nextActive =
      rows.find((user) => user.id === storedId && user.active)?.id ??
      rows.find((user) => user.active)?.id ??
      null;
    setActiveUserIdState(nextActive);
    if (nextActive) setActiveUserId(nextActive);
  }

  useEffect(() => {
    reloadUsers();
  }, []);

  async function handleExport() {
    const data = await createBackupData();
    downloadBackup(data);
    setMessage("Đã xuất file backup JSON.");
  }

  async function handleRestore(file: File) {
    if (
      !window.confirm(
        "Restore sẽ thay thế dữ liệu hiện tại bằng file backup. Tiếp tục?",
      )
    ) {
      return;
    }
    const text = await file.text();
    await restoreBackupData(JSON.parse(text) as BackupData);
    await reloadUsers();
    setMessage("Đã restore dữ liệu từ backup.");
  }

  async function handleCreateUser() {
    if (!name.trim() || !pin.trim()) {
      setMessage("Tên và PIN không được để trống.");
      return;
    }

    try {
      await createLocalUser(name, effectiveRole, pin);
      setName("");
      setRole("cashier");
      setPin("");
      await reloadUsers();
      setMessage(hasUsers ? "Đã tạo user local." : "Đã tạo chủ shop đầu tiên.");
    } catch (error) {
      setMessage(
        `Không tạo được user: ${formatError(error)}`,
      );
    }
  }

  async function handleSeedDemo() {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      await seedProducts();
      await reloadUsers();
      setMessage("Đã nạp dữ liệu demo. Nếu dữ liệu đã có sẵn, app sẽ không ghi đè.");
    } catch (error) {
      setMessage(
        `Không nạp được dữ liệu demo: ${formatError(error)}`,
      );
    } finally {
      setDemoBusy(false);
    }
  }

  async function handleResetDemo() {
    if (demoBusy) return;
    if (
      !window.confirm(
        "Reset demo sẽ xóa dữ liệu hiện tại và tạo lại dữ liệu mẫu. Tiếp tục?",
      )
    ) {
      return;
    }

    setDemoBusy(true);
    try {
      await resetDemoData();
      await reloadUsers();
      setMessage("Đã reset và nạp lại dữ liệu demo.");
    } catch (error) {
      setMessage(
        `Không reset được dữ liệu demo: ${formatError(error)}`,
      );
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Backup / Restore dữ liệu local</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Backup xuất toàn bộ dữ liệu SQLite quan trọng ra file JSON. Restore
            sẽ ghi đè dữ liệu hiện tại.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} disabled={!canManage}>
              Xuất backup
            </Button>
            <input
              ref={restoreInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleRestore(file);
                event.target.value = "";
              }}
            />
            <Button
              variant="outline"
              disabled={!canManage}
              onClick={() => restoreInputRef.current?.click()}
            >
              Restore backup
            </Button>
          </div>
          {!canManage && (
            <div className="text-sm text-muted-foreground">
              Chọn user Chủ shop hoặc Quản lý để backup/restore.
            </div>
          )}
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dữ liệu demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nạp demo không ghi đè dữ liệu đang có. Reset demo sẽ xóa dữ liệu
            hiện tại rồi tạo lại bộ dữ liệu mẫu.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={demoBusy} onClick={handleSeedDemo}>
              {demoBusy ? "Đang xử lý..." : "Nạp dữ liệu demo"}
            </Button>
            <Button
              variant="destructive"
              disabled={!canManage || demoBusy}
              onClick={handleResetDemo}
            >
              Reset dữ liệu demo
            </Button>
          </div>
          {!canManage && (
            <div className="text-sm text-muted-foreground">
              Reset demo cần user Chủ shop hoặc Quản lý. Nút Nạp demo vẫn dùng
              được để khởi tạo dữ liệu.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân quyền local</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasUsers && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Chưa có user nào. Tạo user đầu tiên bên dưới, hệ thống sẽ gán
              quyền Chủ shop.
            </div>
          )}

          {hasUsers && (
            <div className="space-y-1.5">
              <Label>User đang sử dụng</Label>
              <Select
                value={activeUserId?.toString() ?? ""}
                onValueChange={(value) => {
                  const nextId = Number(value);
                  setActiveUserIdState(nextId);
                  setActiveUserId(nextId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => user.active)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} - {roleLabels[user.role] ?? user.role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tên</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              {hasUsers ? (
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value ?? "cashier")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Chủ shop</SelectItem>
                    <SelectItem value="manager">Quản lý</SelectItem>
                    <SelectItem value="cashier">Thu ngân</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value="Chủ shop" disabled />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>PIN</Label>
              <Input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleCreateUser} disabled={!canManage}>
            {hasUsers ? "Tạo user" : "Tạo chủ shop đầu tiên"}
          </Button>

          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground">
                    {roleLabels[user.role] ?? user.role} - PIN local
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canManage || user.id === activeUserId}
                  onClick={async () => {
                    await setUserActive(user.id, !user.active);
                    await reloadUsers();
                  }}
                >
                  {user.active ? "Tắt" : "Bật"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

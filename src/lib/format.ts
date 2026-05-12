export function formatVND(amount: number | null | undefined) {
  return `${new Intl.NumberFormat("vi-VN").format(amount ?? 0)}đ`;
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

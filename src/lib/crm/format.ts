const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function money(value: number) {
  return currency.format(value);
}

export function compactMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function relativeDays(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}

export function followUpLabel(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${iso}T00:00:00`);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return diff === -1 ? "1 day overdue" : `${Math.abs(diff)} days overdue`;
  if (diff === 0) return "due today";
  if (diff === 1) return "due tomorrow";
  return `due in ${diff} days`;
}

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** ₹15,00,000 (Indian digit grouping). */
export function formatSalary(amount: number): string {
  return currency.format(amount);
}

/** ₹15L, ₹1.2Cr: short form for summary cards. */
export function formatSalaryCompact(amount: number): string {
  return compactCurrency.format(amount);
}

/** "10 Jan 2022" from "2022-01-10". */
export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

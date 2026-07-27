// The database stores dates as ISO (YYYY-MM-DD).
// These helpers convert to and from the US display format (MM/DD/YYYY).

/** ISO date -> "MM/DD/YYYY" for display. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
}

/** "MM/DD/YYYY" (or M/D/YYYY) -> ISO date. Returns null if it isn't a real date. */
export function parseDate(input: string): string | null {
  const match = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const month = match[1].padStart(2, '0');
  const day = match[2].padStart(2, '0');
  const year = match[3];

  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects things like 02/31/2026, which JS would silently roll over
  if (date.getMonth() + 1 !== Number(month) || date.getDate() !== Number(day)) return null;

  return `${year}-${month}-${day}`;
}

/** Today plus N months, as "MM/DD/YYYY". */
export function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}/${d.getFullYear()}`;
}

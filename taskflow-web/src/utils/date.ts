export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) return "—";

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

export function parseDisplayDate(date: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);

  if (!match) return null;

  const [, day, month, year] = match;

  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

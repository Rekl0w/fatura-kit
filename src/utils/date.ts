export function curdate(format: string, modify?: string): string {
  const now = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date()).replace(",", ""),
  );

  if (modify) {
    const match = modify.match(/^([+-]\d+)\s+(day|days|month|months|year|years)$/i);
    if (match) {
      const amount = Number.parseInt(match[1]!, 10);
      const unit = match[2]!.toLowerCase();
      if (unit.startsWith("day")) now.setDate(now.getDate() + amount);
      if (unit.startsWith("month")) now.setMonth(now.getMonth() + amount);
      if (unit.startsWith("year")) now.setFullYear(now.getFullYear() + amount);
    }
  }

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const hh = String(now.getHours()).padStart(2, "0");
  const ii = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return format
    .replace("d", dd)
    .replace("m", mm)
    .replace("Y", yyyy)
    .replace("H", hh)
    .replace("i", ii)
    .replace("s", ss);
}

// Explicit IANA conversion for calendar forms. Ambiguous/nonexistent civil times are refused.
export function localDateTime(iso: string, zone: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function utcFromLocal(value: string, zone: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw Error("Enter a valid local date and time.");
  const naive = Date.parse(value + "Z");
  if (!Number.isFinite(naive)) throw Error("Enter a valid date and time.");
  const offsets = new Set<number>();
  for (const h of [-36, -12, 0, 12, 36]) {
    const d = new Date(naive + h * 3600000);
    offsets.add(
      Date.parse(localDateTime(d.toISOString(), zone) + "Z") - d.getTime(),
    );
  }
  const matches = [...offsets]
    .map((offset) => new Date(naive - offset).toISOString())
    .filter((iso) => localDateTime(iso, zone) === value);
  if (matches.length !== 1)
    throw Error(
      "This local time is ambiguous or does not exist because of a clock change. Choose another time.",
    );
  return matches[0];
}
export function addDays(day: string, n: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

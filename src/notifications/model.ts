import { choice, invalid, object } from "../shared/validation";
export const categories = [
  "OwnedWork",
  "Changes",
  "Mentions",
  "Documents",
] as const;
export const emailModes = ["Immediate", "Digest", "Off"] as const;
export type NotificationPreferences = {
  categories: Record<
    (typeof categories)[number],
    { in_app: true; email: (typeof emailModes)[number] }
  >;
  cadence: "Daily" | "Weekly";
  time: string;
  weekday: number;
  timezone: string;
  quiet_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  grouped: boolean;
};
export const defaultNotificationPreferences: NotificationPreferences = {
  categories: {
    OwnedWork: { in_app: true, email: "Immediate" },
    Changes: { in_app: true, email: "Digest" },
    Mentions: { in_app: true, email: "Immediate" },
    Documents: { in_app: true, email: "Digest" },
  },
  cadence: "Daily",
  time: "08:00",
  weekday: 1,
  timezone: "Australia/Brisbane",
  quiet_enabled: false,
  quiet_start: "18:00",
  quiet_end: "08:00",
  grouped: true,
};
export function parseNotificationPreferences(
  input: unknown,
): NotificationPreferences {
  const b = object(input, [
    "categories",
    "cadence",
    "time",
    "weekday",
    "timezone",
    "quiet_enabled",
    "quiet_start",
    "quiet_end",
    "grouped",
  ]);
  const channels = object(b.categories, [...categories]);
  const parsed = {} as NotificationPreferences["categories"];
  for (const key of categories) {
    const v = object(channels[key], ["in_app", "email"]);
    if (v.in_app !== true)
      invalid("in_app", "In-app notices and required work stay visible.");
    parsed[key] = { in_app: true, email: choice(v.email, "email", emailModes) };
  }
  for (const key of ["time", "quiet_start", "quiet_end"])
    if (
      typeof b[key] !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(b[key]))
    )
      invalid(key, "Use a 24-hour time.");
  for (const key of ["quiet_enabled", "grouped"])
    if (typeof b[key] !== "boolean") invalid(key, "Choose on or off.");
  if (b.quiet_enabled && b.quiet_start === b.quiet_end)
    invalid(
      "quiet_end",
      "Quiet hours must have different start and end times.",
    );
  if (
    !Number.isInteger(b.weekday) ||
    Number(b.weekday) < 0 ||
    Number(b.weekday) > 6
  )
    invalid("weekday", "Choose a weekday.");
  if (typeof b.timezone !== "string" || b.timezone.length > 80)
    invalid("timezone", "Choose an IANA time zone.");
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: String(b.timezone) });
  } catch {
    invalid("timezone", "Choose an IANA time zone.");
  }
  return {
    categories: parsed,
    cadence: choice(b.cadence, "cadence", ["Daily", "Weekly"]),
    time: String(b.time),
    weekday: Number(b.weekday),
    timezone: String(b.timezone),
    quiet_enabled: b.quiet_enabled as boolean,
    quiet_start: String(b.quiet_start),
    quiet_end: String(b.quiet_end),
    grouped: b.grouped as boolean,
  };
}
export function inQuietHours(time: string, p: NotificationPreferences) {
  return (
    p.quiet_enabled &&
    (p.quiet_start < p.quiet_end
      ? time >= p.quiet_start && time < p.quiet_end
      : time >= p.quiet_start || time < p.quiet_end)
  );
}

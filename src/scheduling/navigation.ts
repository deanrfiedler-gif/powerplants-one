const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const plannerZones = [
  "Australia/Brisbane",
  "Australia/Melbourne",
  "UTC",
];
export function plannerContext(query: URLSearchParams) {
  const one = (key: string) =>
    query.getAll(key).length === 1 ? (query.get(key) ?? "") : "";
  const day = one("day");
  const validDay =
    /^20\d{2}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(Date.parse(`${day}T12:00:00Z`)) &&
    new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day;
  return {
    day: validDay ? day : "2031-09-22",
    mode: one("view") === "day" ? ("day" as const) : ("week" as const),
    zone: plannerZones.includes(one("timezone"))
      ? one("timezone")
      : plannerZones[0],
    site: uuid.test(one("site_id")) ? one("site_id") : "",
    resource: uuid.test(one("resource_id")) ? one("resource_id") : "",
    status: ["Proposed", "Confirmed", "Cancelled"].includes(one("status"))
      ? one("status")
      : "",
  };
}
export function plannerHref(c: ReturnType<typeof plannerContext>) {
  return (
    "/schedule?" +
    new URLSearchParams({
      day: c.day,
      view: c.mode,
      timezone: c.zone,
      ...(c.site ? { site_id: c.site } : {}),
      ...(c.resource ? { resource_id: c.resource } : {}),
      ...(c.status ? { status: c.status } : {}),
    })
  );
}
export function safePlannerReturn(value: string | null) {
  if (!value || value.length > 2048) return "/schedule";
  const match = /^\/schedule(\/(?:changes|travel|capacity))?(?:\?(.*))?$/.exec(
    value,
  );
  if (!match) return "/schedule";
  const q = new URLSearchParams(match[2]),
    context = plannerContext(q);
  if (!match[1]) return plannerHref(context);
  const result = new URLSearchParams({
    day: context.day,
    timezone: context.zone,
    ...(context.site ? { site_id: context.site } : {}),
    ...(context.resource ? { resource_id: context.resource } : {}),
  });
  if (
    q.getAll("days").length === 1 &&
    ["7", "28", "90"].includes(q.get("days")!)
  )
    result.set("days", q.get("days")!);
  if (
    match[1] === "/changes" &&
    q.getAll("appointment_id").length === 1 &&
    uuid.test(q.get("appointment_id")!)
  )
    result.set("appointment_id", q.get("appointment_id")!);
  return "/schedule" + match[1] + "?" + result;
}
export function appointmentHref(id: string, returnTo: string) {
  return `/service/appointments/${id}?returnTo=${encodeURIComponent(safePlannerReturn(returnTo))}`;
}
export function safeBookingTarget(value: string | null) {
  if (!value || value.length > 2048) return null;
  const match = /^\/service\/appointments\/([0-9a-f-]+)(?:\?(.*))?$/i.exec(
    value,
  );
  if (!match || !uuid.test(match[1])) return null;
  const params = new URLSearchParams(match[2]);
  return appointmentHref(
    match[1],
    params.getAll("returnTo").length === 1
      ? params.get("returnTo")!
      : "/schedule",
  );
}

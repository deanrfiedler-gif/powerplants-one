import assert from "node:assert/strict";
import { test } from "node:test";
import { readJournal, writeJournal, type JournalEntry, type StoragePort } from "../../src/shared/lib/command-journal";
import { acceptsBookingEntry } from "../../src/scheduling/booking-journal";
import { appointmentHref, plannerContext, plannerHref, plannerToday, safeBookingTarget, safePlannerReturn } from "../../src/scheduling/navigation";

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const scope = { actor_id: id(1), workspace_id: id(2) };
const entry = (): JournalEntry => ({ version: 1, phase: "pending", scope, path: `service/work-orders/${id(3)}/visits`,
  body: { operation_id: id(4), schema_version: 1, id: id(5), expected_version: 3, reason: "SYN reviewed visit" },
  target: appointmentHref(id(5), "/schedule"), record_id: id(5), label: "Proposal" });
function storage() {
  const values = new Map<string, string>();
  return { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } } satisfies StoragePort;
}
test("same-tab journal copies exact original and refuses a replacement until resolved", () => {
  const s = storage(), original = entry();
  const saved = writeJournal(s, "key", original, acceptsBookingEntry);
  original.body.expected_version = 99;
  assert.equal(saved.body.expected_version, 3);
  assert.deepEqual(readJournal(s, "key", scope, acceptsBookingEntry), saved);
  assert.throws(() => writeJournal(s, "key", original, acceptsBookingEntry), /Resolve the original/);
  assert.deepEqual(writeJournal(s, "key", saved, acceptsBookingEntry), saved);
});
test("journal refuses corrupt, oversized, mismatched target and unavailable storage without sending", () => {
  const s = storage();
  for (const raw of ["{", "x".repeat(32769), JSON.stringify({ ...entry(), phase: "sent" }), JSON.stringify({ ...entry(), target: "https://example.org" })]) {
    s.setItem("key", raw);
    assert.throws(() => readJournal(s, "key", scope, acceptsBookingEntry), /unreadable/);
  }
  s.removeItem("key");
  assert.throws(() => writeJournal(s, "key", { ...entry(), record_id: id(9) }, acceptsBookingEntry), /bounds/);
  assert.throws(() => writeJournal({ ...s, setItem: () => { throw Error("denied"); } }, "key", entry(), acceptsBookingEntry), /denied/);
  assert.throws(() => writeJournal({ ...s, setItem: () => {} }, "key", entry(), acceptsBookingEntry), /verified/);
});
test("journal isolates actor and workspace and accepts no credentials or arbitrary endpoints", () => {
  const s = storage();
  for (const different of [{ ...scope, actor_id: id(8) }, { ...scope, workspace_id: id(8) }]) {
    writeJournal(s, "key", entry(), acceptsBookingEntry);
    assert.equal(readJournal(s, "key", different, acceptsBookingEntry), null);
    assert.equal(s.getItem("key"), null);
  }
  assert.equal(acceptsBookingEntry({ ...entry(), body: { ...entry().body, token: "not-a-real-secret" } }), false);
  assert.equal(acceptsBookingEntry({ ...entry(), path: `appointments/${id(3)}/visits` }), false);
  assert.equal(acceptsBookingEntry({ ...entry(), path: "local-session" }), false);
});
test("accepted journal drops command payload and retains original identity and destination", () => {
  const e: JournalEntry = { ...entry(), phase: "accepted", body: { operation_id: id(4), schema_version: 1 } };
  const s = storage();
  writeJournal(s, "saved", e, acceptsBookingEntry);
  assert.deepEqual(readJournal(s, "saved", scope, acceptsBookingEntry), e);
  assert.equal(acceptsBookingEntry({ ...e, body: { ...e.body, expected_version: 2 } }), false);
});
// PRJ-2: without a valid day the planner opens on today in the selected display timezone,
// not on a fixed synthetic date.
test("planner opens on today in the selected display timezone", () => {
  const at = new Date("2026-10-15T13:30:00Z"); // 23:30 in Brisbane, 00:30 next day in Melbourne (AEDT)
  assert.equal(plannerContext(new URLSearchParams(""), undefined, at).day, "2026-10-15");
  assert.equal(plannerContext(new URLSearchParams("timezone=UTC"), undefined, at).day, "2026-10-15");
  assert.equal(plannerContext(new URLSearchParams("timezone=Australia/Melbourne"), undefined, at).day, "2026-10-16");
  assert.equal(plannerContext(new URLSearchParams("day=2031-09-22&timezone=UTC"), undefined, at).day, "2031-09-22");
  assert.equal(plannerToday("Australia/Melbourne", at), "2026-10-16");
});
test("planner return validates destination and every supported criterion", () => {
  const valid = `/schedule?day=2026-10-01&view=day&timezone=UTC&site_id=${id(6)}&resource_id=${id(7)}&status=Confirmed`;
  assert.equal(safePlannerReturn(valid), valid);
  for (const bad of ["https://example.org", "//example.org", "/schedule/../login", "/schedule#bad", "\\example.org"]) assert.equal(safePlannerReturn(bad), "/schedule");
  const c = plannerContext(new URLSearchParams("day=2026-02-31&view=broken&timezone=bogus&site_id=oops&status=Confirmed&status=Proposed"), undefined, new Date("2026-10-15T15:00:00Z"));
  assert.equal(c.day, "2026-10-16"); assert.equal(c.zone, "Australia/Brisbane"); assert.equal(c.site, ""); assert.equal(c.status, "");
  assert.equal(plannerHref(plannerContext(new URLSearchParams(valid.split("?")[1]))), valid);
  assert.equal(safeBookingTarget(`/service/appointments/${id(5)}?returnTo=${encodeURIComponent(valid)}`), appointmentHref(id(5), valid));
  assert.equal(safeBookingTarget(`/service/appointments/${id(5)}/../../auth/logout`), null);
});
// Gate P4: a site-readiness contact restores only its typed purpose and exactly four checks.
test("journal accepts a typed site-readiness contact and refuses malformed checks", () => {
  const confirmed = { status: "Confirmed", note: "" };
  const contact = (body: Record<string, unknown>): JournalEntry => ({
    ...entry(),
    path: `appointments/${id(5)}/contacts`,
    record_id: id(6),
    body: {
      operation_id: id(4), schema_version: 1, id: id(6), expected_version: 3, reason: "Record customer site readiness",
      recipient_id: id(7), channel: "ManualPhone", outcome: "Confirmed", occurred_at: "2026-10-12T01:02:00Z", notes: "", ...body,
    },
  });
  const checks = { access: confirmed, power_water: confirmed, equipment: { status: "NotReady", note: "SYN bench" }, isolation: { status: "NotApplicable", note: "" } };
  assert.equal(acceptsBookingEntry(contact({})), true);
  assert.equal(acceptsBookingEntry(contact({ purpose: "SiteReadiness", site_checks: checks })), true);
  for (const bad of [
    { purpose: "SiteReadiness" },
    { purpose: "DateAgreement", site_checks: checks },
    { purpose: "Marketing", site_checks: checks },
    { purpose: "SiteReadiness", site_checks: { ...checks, extra: confirmed } },
    { purpose: "SiteReadiness", site_checks: { access: confirmed, power_water: confirmed, equipment: confirmed } },
    { purpose: "SiteReadiness", site_checks: { ...checks, access: { status: "Ready", note: "" } } },
    { purpose: "SiteReadiness", site_checks: { ...checks, access: { status: "Confirmed", note: "x".repeat(1001) } } },
    { purpose: "SiteReadiness", site_checks: { ...checks, access: { ...confirmed, token: "not-a-real-secret" } } },
  ])
    assert.equal(acceptsBookingEntry(contact(bad)), false, JSON.stringify(bad).slice(0, 80));
});

import type { Finding } from "../../src/service/findings/model";
export const findingsClock = "2026-10-14T01:30:00.000Z";
const uuid = (n: number) =>
  `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const findingRows: Finding[] = [
  ["inspection", "Torque over the limit on motor M-4", "WaitingReview"],
  ["incident", "Boiler outlet flange gasket replaced", "FollowUpCompleted"],
  ["completion", "Corroded cable gland at the sensor head", "Open"],
  ["inspection", "Firmware check not tested, controller off", "NeedsOwner"],
  ["response", "Customer says valve 4 is still slow", "Open"],
  ["schedule", "Non-slip mats for the plant room floor", "Open"],
  ["inspection", "VA-12 travel fault, 2nd in 30 days", "Open"],
  ["schedule", "Confirmed return visit follow-up", "Closed"],
].map(([source, title, state], i) => ({
  id: `${source}:${uuid(i + 1)}`,
  source: source as Finding["source"],
  source_id: uuid(i + 1),
  source_record: {
    id: uuid(i + 1),
    reference:
      i === 2
        ? "SYN-PPO-RPT-000058"
        : `SYN-PPO-APT-0000${49 + i}${source === "inspection" ? " · DEF-001" : ""}`,
    version: 1,
    href: `/service/appointments/${uuid(20 + i)}`,
  },
  appointment: { id: uuid(20 + i), reference: `SYN-PPO-APT-0000${49 + i}` },
  work_order: { id: uuid(30 + i), reference: "SYN-WO-000027" },
  company_id: uuid(80),
  site: {
    id: uuid(81),
    name: "SYN Nutrient Room",
    timezone: "Australia/Brisbane",
  },
  equipment:
    source === "inspection"
      ? { id: uuid(90 + i), reference: "SYN-EQ-000012" }
      : null,
  what_remains: title,
  native_state: state,
  state: state as Finding["state"],
  overdue: i === 6,
  due_this_week: [0, 2, 6].includes(i),
  action:
    i === 3
      ? null
      : {
          id: uuid(40 + i),
          version: 1,
          summary:
            i === 2
              ? "Replace the gland, then check the level reading"
              : `Investigate ${title}`,
          required_evidence: "A photograph and the corrected reading",
          status: [1, 7].includes(i) ? "Completed" : "Open",
          owner_id: uuid(82),
          owner_name: "SYN Morgan Lee",
          due_at: "2026-10-16T02:00:00Z",
          due_date_only: false,
          outcome: null,
          cancellation_reason: null,
          href: `/work/${uuid(40 + i)}`,
        },
  closes_when:
    source === "schedule"
      ? "Complete the native scheduling follow-up with an outcome."
      : "The source reviewer accepts the evidence and closes it in the owning record. Activity completion alone does not close it.",
  closure_authority:
    source === "inspection" ? "InspectionReview" : "ServiceDisposition",
  updated_at: findingsClock,
  recurrence: {
    basis: source === "inspection" ? "FailedCheck" : "NoStableFaultKey",
    partial: false,
    earlier:
      i === 6
        ? [
            {
              id: `inspection:${uuid(95)}`,
              reference: "SYN-PPO-APT-000016 · DEF-001",
              href: `/service/inspections?appointment_id=${uuid(96)}`,
              occurred_at: "2026-09-14T01:30:00Z",
              state: "Closed",
              correction: "Re-tightened the coupling",
            },
          ]
        : [],
  },
}));

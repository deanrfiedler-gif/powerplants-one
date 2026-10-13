import type { PackRegisterRow } from "../../src/documents/pack-register";
import packRead from "./job-pack-read.json";
const pack = packRead.items[0],
  revision = pack.revisions[0];
export const registerClock = "2026-11-23T00:00:00Z";
export const registerRows: PackRegisterRow[] = [
  "Draft",
  "Returned",
  "Checked",
  "Issued",
  "Issued",
  "Withdrawn",
].map((status, i) => ({
  id:
    i === 0
      ? pack.id
      : `10000000-0000-4000-8000-${String(i + 2).padStart(12, "0")}`,
  display_number: `SYN-PPO-PACK-${String(i + 1).padStart(6, "0")}`,
  status,
  needs_review: i === 4,
  appointment_id: pack.appointment_id,
  appointment_reference: revision.snapshot.appointment.reference,
  current_revision_id: revision.id,
  current_issue_id: i === 3 || i === 4 ? "issue" : null,
  revision: i + 1,
  title: i === 0 ? "SYN Controller inspection" : `SYN Inspection ${i + 1}`,
  visit_at: `2026-11-${24 + i}T00:00:00Z`,
  timezone: "Australia/Brisbane",
  customer: revision.snapshot.customer.name,
  site: i === 5 ? "SYN Second site" : revision.snapshot.site.name,
  site_id: i === 5 ? "second-site" : revision.snapshot.site.id,
  technicians: revision.snapshot.recipients.map((t) => ({
    id: t.user_id,
    name: t.name,
  })),
  prepared_by: "30000000-0000-4000-8000-000000000001",
  prepared_by_name: "SYN Coordinator",
  updated_at: registerClock,
  job_state: i === 2 ? "Failed" : null,
  readiness: { satisfied: i === 0 ? 6 : 8, total: 8 },
  acknowledged: i === 3 ? 1 : null,
  recipients: i === 3 ? 2 : null,
  dispatch_hold: true,
  can_prepare: true,
}));

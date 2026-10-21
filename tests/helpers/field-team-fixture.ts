import type { FieldTeamSchedule } from "../../src/scheduling/field-team-model";
import { reviewWindow } from "../../src/scheduling/field-team-model";
import type {
  ResourceEvidence,
  ResourceWorkspace,
} from "../../src/scheduling/workspace-model";
import type { ScheduleAppointment } from "../../src/scheduling";

// Browser-only synthetic read fixtures. They are never seeded or published as source records.
export const teamId = (n: number) =>
  `a4000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const teamDay = "2026-10-13",
  teamZone = "Australia/Brisbane";
const at = (day: string, hour: string) =>
  new Date(`${day}T${hour}:00+10:00`).toISOString();
const source = at("2026-10-12", "17:15");
export function teamPerson(n = 1, name = "Casey Ward"): ResourceEvidence {
  return {
    id: teamId(n),
    name,
    resource_type: "Technician",
    active: true,
    status: "Active",
    version: 7,
    source_as_at: source,
    base_timezone: teamZone,
    effective_from: at("2026-01-01", "00:00"),
    effective_to: at("2027-01-01", "00:00"),
    calendar: {
      id: teamId(100),
      name: "Field weekdays",
      version: 3,
      timezone: teamZone,
      status: "Published",
      effective_from: at("2026-01-01", "00:00"),
      effective_to: at("2027-01-01", "00:00"),
      source_as_at: source,
      intervals: [1, 2, 3, 4, 5].map((weekday) => ({
        weekday,
        start_minute: 420,
        end_minute: 1080,
      })),
    },
    skills: [
      {
        id: teamId(201 + n * 10),
        skill_code: "SYN-PUMP",
        version: 2,
        active: true,
        status: "Verified",
        valid_from: at("2026-04-01", "00:00"),
        valid_to: at("2027-04-01", "00:00"),
        source_as_at: source,
        evidence_ref: "SYN-EVIDENCE-PUMP-001",
        content_hash: "synthetic-content-hash-".repeat(3),
        reviewer_id: teamId(300),
        reviewed_at: at("2026-10-09", "14:20"),
      },
      {
        id: teamId(202 + n * 10),
        skill_code: "SYN-VALVE",
        version: 1,
        active: true,
        status: "Verified",
        valid_from: at("2026-04-01", "00:00"),
        valid_to: at("2026-10-16", "00:00"),
        source_as_at: source,
        evidence_ref: "SYN-EVIDENCE-VALVE-002",
        content_hash: "synthetic-valve-hash",
        reviewer_id: teamId(300),
        reviewed_at: at("2026-10-09", "14:20"),
      },
      {
        id: teamId(203 + n * 10),
        skill_code: "SYN-ACCESS",
        version: 1,
        active: true,
        status: "Unknown",
        valid_from: at("2026-04-01", "00:00"),
        valid_to: at("2027-04-01", "00:00"),
        source_as_at: source,
        evidence_ref: null,
        content_hash: null,
        reviewer_id: null,
        reviewed_at: null,
      },
    ],
    blocks: [],
    exceptions: [],
    busy: [],
  };
}
export function teamVisit(
  n: number,
  day = teamDay,
  start = "08:30",
  end = "10:30",
  person = 1,
): ScheduleAppointment {
  return {
    id: teamId(400 + n),
    display_number: `AP-SYN-${n}`,
    version: 2,
    assignment_version: 1,
    schedule_version: 2,
    status: "Confirmed",
    start_at: at(day, start),
    end_at: at(day, end),
    site_timezone: teamZone,
    site_id: teamId(500),
    site_name: "North yard",
    scope_revision_id: teamId(600),
    scope_version: 1,
    scope_revision: 1,
    scope_summary: n === 1 ? "Pump check" : "Valve inspection",
    scope_hash: "synthetic-scope",
    scope_review_required: false,
    policy_version_id: teamId(700),
    policy: { id: teamId(700), version: 1, name: "SYN policy" },
    primary_contact_id: null,
    work_order_id: teamId(800),
    work_order_display_number: "WO-SYN-0402",
    work_order_version: 1,
    customer_commitment: "Confirmed",
    preparation_status: "Ready",
    dispatch_hold: false,
    pack_requirement: "Acknowledged",
    requested_window_start: null,
    requested_window_end: null,
    assignments: [
      {
        id: teamId(900 + n),
        resource_id: teamId(person),
        resource_version: 7,
        calendar_version: 3,
        crew_role: "Technician",
        name: "Casey Ward",
        active: true,
        assignment_version: 1,
        travel_before_minutes: 30,
        travel_after_minutes: 30,
        travel_reason: "SYN explicit travel allowance",
      },
    ],
    actions: { can_manage: false, can_request: false, can_contact: false },
    requests: [],
    projection: "ScheduleSummary",
  };
}
export function teamFixture(): FieldTeamSchedule {
  const resources = [
    "Casey Ward",
    "Morgan Lee",
    "Taylor Singh",
    "Jordan Ng",
    "Alex Rivera",
    "Sam Taylor",
    "Chris Patel",
    "Riley Jones",
    "Jamie Chen",
  ].map((name, i) => teamPerson(i + 1, name));
  const items = [
    teamVisit(1),
    teamVisit(2, teamDay, "12:30", "15:00"),
    teamVisit(3, "2026-10-14", "09:00", "11:00"),
    { ...teamVisit(4, "2026-10-16", "10:00", "12:00"), status: "Proposed" },
  ];
  resources[0].busy = items
    .filter((a) => a.status !== "Proposed")
    .map((a) => ({
      start_at: new Date(Date.parse(a.start_at) - 30 * 60000).toISOString(),
      end_at: new Date(Date.parse(a.end_at) + 30 * 60000).toISOString(),
    }));
  resources[0].blocks = [
    {
      id: teamId(1001),
      start_at: at("2026-10-15", "00:00"),
      end_at: at("2026-10-16", "00:00"),
      kind: "Leave",
    },
  ];
  resources[8].blocks = [
    {
      id: teamId(1002),
      start_at: at(teamDay, "00:00"),
      end_at: at("2026-10-14", "00:00"),
      kind: "Leave",
    },
  ];
  return {
    items,
    resources,
    next_cursor: null,
    observed_at: at(teamDay, "08:12"),
    completeness: "Complete",
    display_timezone: teamZone,
    ...reviewWindow(teamDay, teamZone),
  };
}
export function teamWorkspace(id = teamId(1)): ResourceWorkspace {
  const s = teamFixture();
  return {
    resource: s.resources.find((r) => r.id === id)!,
    from: s.from,
    to: s.to,
    observed_at: s.observed_at,
    completeness:
      "Permitted sites and bounded period; other bookings are anonymous busy intervals",
    sites: [
      { id: teamId(500), display_name: "North yard", timezone: teamZone },
      {
        id: teamId(501),
        display_name: "Riverbend greenhouse",
        timezone: teamZone,
      },
    ],
    appointments: s.items.filter((a) =>
      a.assignments.some((x) => x.resource_id === id),
    ),
  };
}

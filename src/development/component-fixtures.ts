import type { ComponentProps } from "react";
import type { Board } from "../components/crm-worklist-board";
import type { Schedule as ProjectSchedule } from "../projects/model";
import type {
  Schedule,
  ScheduleAppointment,
} from "../scheduling/components/client/planner-screens.client";
import { emptyConfiguration } from "../estimating/configuration-definition";

export const fixtureDate = "2026-09-23";
export const fixtureTime = "2026-09-23T00:00:00Z";
export const fixtureId = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const salesFixture: ComponentProps<typeof Board>["data"] = {
  source: "Synthetic",
  observed_at: fixtureTime,
  completeness: "Complete",
  next_cursor: null,
  window: {
    as_of: fixtureTime,
    first_page: true,
    has_more: false,
    count_basis: "ReturnedPage",
  },
  pipelines: [
    { id: fixtureId(90), display_name: "Synthetic catalogue pipeline" },
  ],
  sort: "Reference",
  can_create: false,
  stages: ["Discovery", "Scoping", "Quoting", "Negotiation", "Closing"].map(
    (stage_id, i) => ({
      stage_id: stage_id as "Discovery",
      ordinal: i + 1,
      pipeline_definition_id: fixtureId(90),
      pipeline_label: "Synthetic catalogue pipeline",
      count: i < 3 ? 1 : 0,
    }),
  ),
  items: [
    "Climate upgrade — synthetic example",
    "Propagation irrigation — long customer requirement for review",
    "Seasonal servicing",
  ].map((title, i) => ({
    id: fixtureId(i + 1),
    display_number: `SYN-PPO-DEAL-00${i + 1}`,
    title,
    stage_id: (["Discovery", "Scoping", "Quoting"] as const)[i],
    close_outcome: "Open",
    stage_entered_at: fixtureTime,
    updated_at: fixtureTime,
    version: 1,
    company_id: fixtureId(10),
    company_name: "Synthetic company",
    organisation_name: "Example Grower",
    site_id: fixtureId(11),
    site_name: "Example nursery",
    owner_id: fixtureId(12),
    owner_name: "Example Coordinator",
    primary_person_id: null,
    contact_name: i === 1 ? null : "Example Contact",
    next_action_state: (["Upcoming", "Overdue", "Needed"] as const)[i],
    next_action_id: fixtureId(20 + i),
    next_action_summary: i === 2 ? null : "Confirm scope with the customer",
    action_owner_id: fixtureId(12),
    action_owner_name: "Example Coordinator",
    due_at: i === 2 ? null : "2026-09-22T01:00:00Z",
    due_needed: false,
    value_amount: i === 1 ? null : "12500.00",
    expected_close_date: i === 2 ? null : "2026-10-20",
    can_edit: true,
  })),
};
export const projectFixture: ProjectSchedule = {
  observed_at: fixtureTime,
  project: {
    lifecycle: "Active",
    acceptance_version: 1,
    id: fixtureId(100),
    version: 1,
    display_number: "SYN-PPO-PROJ-001",
    title: "Example greenhouse upgrade",
    company_id: fixtureId(10),
    organisation_id: fixtureId(11),
    site_id: fixtureId(12),
    coordinator_id: fixtureId(13),
    customer_name: "Example Grower",
    site_name: "Synthetic nursery",
    coordinator_name: "Example Coordinator",
    timezone: "Australia/Sydney",
    target_date: "2026-10-09",
    updated_at: fixtureTime,
    can_edit: true,
  },
  tasks: [
    "Confirm scope",
    "Order control equipment",
    "Install and commission",
    "Customer handover",
    "Follow-up — date to be agreed",
  ].map((title, i) => ({
    id: fixtureId(110 + i),
    version: 1,
    title,
    phase: (
      ["Planning", "Procurement", "Delivery", "Handover", "Handover"] as const
    )[i],
    status: (
      ["Complete", "InProgress", "AtRisk", "Planned", "Planned"] as const
    )[i],
    milestone: i === 3,
    start_date:
      i === 4
        ? null
        : ["2026-09-21", "2026-09-23", "2026-09-24", "2026-10-09"][i],
    finish_date:
      i === 4
        ? null
        : ["2026-09-22", "2026-09-29", "2026-10-08", "2026-10-09"][i],
    progress: [100, 40, 10, 0, 0][i],
    note: "Synthetic catalogue fixture",
    owner_id: fixtureId(12),
    external_owner_id: null,
    owner_name: "Example Coordinator",
    dependencies:
      i > 0 && i < 4
        ? [{ task_id: fixtureId(109 + i), kind: "FS" as const }]
        : [],
  })),
};
export const appointmentFixture: ScheduleAppointment = {
  id: fixtureId(200),
  display_number: "SYN-PPO-APT-001",
  version: 1,
  assignment_version: 1,
  schedule_version: 1,
  status: "Confirmed",
  start_at: "2026-09-23T00:00:00Z",
  end_at: "2026-09-23T02:00:00Z",
  site_timezone: "Australia/Sydney",
  site_id: fixtureId(11),
  site_name: "Example nursery",
  scope_revision_id: fixtureId(210),
  scope_version: 1,
  scope_revision: 1,
  scope_summary: "Inspect synthetic climate sensors",
  scope_hash: "synthetic-catalogue-only",
  scope_review_required: false,
  policy_version_id: fixtureId(211),
  policy: { id: fixtureId(211), version: 1, name: "Synthetic policy" },
  primary_contact_id: null,
  work_order_id: fixtureId(212),
  work_order_display_number: "SYN-PPO-WO-001",
  work_order_version: 1,
  customer_commitment: "Proposed",
  preparation_status: "Preparing",
  dispatch_hold: true,
  pack_requirement: "Required",
  requested_window_start: null,
  requested_window_end: null,
  assignments: [
    {
      id: fixtureId(213),
      active: true,
      assignment_version: 1,
      resource_id: fixtureId(220),
      resource_version: 1,
      calendar_version: 1,
      crew_role: "Lead",
      name: "Example Technician",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason: "Synthetic example",
    },
  ],
  actions: { can_manage: true, can_request: true, can_contact: false },
  requests: [],
  projection: "ScheduleSummary",
};
export const plannerFixture: Schedule = {
  items: [appointmentFixture],
  next_cursor: null,
  observed_at: fixtureTime,
  completeness: "Complete",
  display_timezone: "Australia/Sydney",
  from: "2026-09-23T00:00:00Z",
  to: "2026-09-30T00:00:00Z",
  resources: [
    {
      id: fixtureId(220),
      name: "Example Technician",
      version: 1,
      active: true,
      status: "Active",
      base_timezone: "Australia/Sydney",
      source_as_at: fixtureTime,
      calendar: {
        id: fixtureId(230),
        name: "Synthetic weekday calendar",
        version: 1,
        timezone: "Australia/Sydney",
        intervals: [1, 2, 3, 4, 5].map((weekday) => ({
          weekday,
          start_minute: 480,
          end_minute: 1020,
        })),
      },
      skills: [],
      blocks: [
        {
          id: fixtureId(231),
          kind: "Unavailable",
          start_at: "2026-09-23T03:00:00Z",
          end_at: "2026-09-23T05:00:00Z",
        },
      ],
      busy: [
        { start_at: "2026-09-23T00:00:00Z", end_at: "2026-09-23T02:00:00Z" },
      ],
    },
  ],
};
export function areaFixture() {
  const value = emptyConfiguration();
  value.areas = [
    {
      id: fixtureId(300),
      lineage: null,
      label: "Synthetic growing bay",
      facility_id: null,
      purpose: "Growing",
      use: "Propagation",
      stage: null,
      source: "Catalogue fixture",
      evidence_ids: [],
      state: "Answered",
      follow_up: null,
    },
  ];
  return value;
}

// Deterministic synthetic browser source. No operational records or external documents.
export const readinessSite = "70000000-0000-4000-8000-000000000001";
export const readinessId = "ec060000-0000-4000-8000-000000000001";
export function accessReadinessFixture() {
  const owner = "30000000-0000-4000-8000-000000000001",
    reviewer = "30000000-0000-4000-8000-000000000002";
  const visitor = "60000000-0000-4000-8000-000000000001",
    area = "ec060000-0000-4000-8000-000000000002";
  const requirement = {
    id: "ec060000-0000-4000-8000-000000000003",
    revision: 2,
    title: "Individual induction",
    kind: "Induction",
    facility_id: area,
    activity: "Inspection",
    source: "SYN induction source, revision 2",
  };
  const evidence = {
    id: "ec060000-0000-4000-8000-000000000004",
    requirement_id: requirement.id,
    requirement_revision: 2,
    facility_id: area,
    activity: "Inspection",
    person_id: visitor,
    captured_on: "2026-10-14",
    expires_on: "2026-10-15",
    source: "SYN signed induction record",
  };
  const content = {
    schema_version: 1,
    requirements: [requirement],
    evidence: [evidence],
    windows: [],
  };
  const visit = {
    id: "ec060000-0000-4000-8000-000000000005",
    reference: "SYN-VIS-0105",
    work_order_id: "ec060000-0000-4000-8000-000000000006",
    version: 3,
    schedule_version: 2,
    assignment_version: 1,
    scope_version: 1,
    scope_revision_id: null,
    status: "Confirmed",
    starts_at: "2026-10-14T22:00:00.000Z",
    ends_at: "2026-10-15T00:00:00.000Z",
    timezone: "Australia/Brisbane",
  };
  const check = {
    id: "ec060000-0000-4000-8000-000000000007",
    revision: 4,
    kind: "Preparation",
    recorded_by: reviewer,
    recorded_at: "2026-10-14T21:00:00.000Z",
    recheck_required: false,
    basis: {
      content,
      visit,
      preparation: {
        activity: "Inspection",
        facility_ids: [area],
        person_ids: [visitor],
        starts_at: visit.starts_at,
        ends_at: visit.ends_at,
      },
      assessment: {
        status: "Recheck required",
        blockers: [
          `Individual induction · visitor ${visitor}: current, exact reviewed evidence is missing. Captured, expired or superseded evidence does not clear this requirement.`,
          `Facility ${area}: no recorded work window covers the whole attendance interval. Missing windows do not mean unrestricted access.`,
        ],
        checks: [],
        work_authority: "Not granted",
        booking: "Not confirmed",
        resource_reservation: "Not made",
        pack_issue: "Not issued",
        dispatch: "Not cleared",
        timezone: visit.timezone,
      },
    },
  };
  const record = {
    id: readinessId,
    workspace_id: "10000000-0000-4000-8000-000000000001",
    company_id: "20000000-0000-4000-8000-000000000001",
    site_id: readinessSite,
    organisation_id: null,
    name: "SYN Glasshouse access",
    owner_id: owner,
    created_by: owner,
    updated_by: owner,
    updated_at: "2026-10-14T21:00:00.000Z",
    version: 8,
    revision: 4,
    state: "Reviewed",
    content,
  };
  return {
    data: {
      record,
      kind: "Readiness",
      can_edit: true,
      actor_id: reviewer,
      requirements_draft: null,
      visits: [visit],
      visits_scope:
        "Up to 40 permitted visits; use Schedule for the complete register.",
      photos: [],
      reviews: [],
      evidence_status: {
        [evidence.id]: "Captured; independent review required",
      },
      snapshots: [check],
      events: [],
      history: [
        {
          id: "history-1",
          version: 8,
          revision: 4,
          reason: "SYN checked preparation",
          recorded_at: check.recorded_at,
          recorded_by: reviewer,
        },
      ],
      history_scope:
        "Latest permitted retained records; other snapshots may be restricted.",
      observed_at: "2026-10-14T21:30:00.000Z",
    },
    options: {
      context: {
        id: readinessSite,
        name: "SYN Riverbend glasshouse",
        display_name: "SYN Riverbend glasshouse",
        timezone: visit.timezone,
      },
      can_create: true,
      owners: {
        edit: [
          { id: owner, display_name: "SYN Alex Coordinator" },
          { id: reviewer, display_name: "SYN Morgan Reviewer" },
        ],
        engineering: [],
        estimating: [],
      },
      people: [{ id: visitor, display_name: "SYN Jamie Visitor" }],
      facilities: [{ id: area, display_name: "Glasshouse A" }],
      assets: [],
      sites: [],
      activities: [],
      activities_state: "Available",
      completeness: "Bounded permitted choices.",
    },
  };
}

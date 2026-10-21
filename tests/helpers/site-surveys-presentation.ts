export const id = "44000000-0000-4000-8000-000000009901",
  site = "70000000-0000-4000-8000-000000000001",
  owner = "30000000-0000-4000-8000-000000000001",
  reviewer = "30000000-0000-4000-8000-000000000009";
const observed_at = "2026-10-19T00:12:00.000Z";
export const content = {
  schema_version: 1,
  purpose:
    "Confirm the as-found irrigation layout before the upgrade estimate.",
  facility_ids: [],
  asset_ids: [],
  observations: [
    {
      id: "44000000-0000-4000-8000-000000009902",
      title: "Bay 4 clear width",
      kind: "Measured",
      value: "0",
      unit: "mm",
      facility_id: null,
      asset_id: null,
      detail: "",
      observer: "SYN Alex Chen",
      captured_on: "2026-10-19",
      method_source: "SYN tape measure at the clear opening",
      significant: true,
      insignificant_reason: null,
      activity_id: null,
    },
  ],
  visit: {
    planned_at: "2026-10-18T21:30:00.000Z",
    ends_at: "2026-10-19T00:00:00.000Z",
    contact_id: null,
    recorder_id: owner,
  },
};
export const record = {
  id,
  site_id: site,
  company_id: "20000000-0000-4000-8000-000000000001",
  organisation_id: null,
  name: "SYN North glasshouse irrigation upgrade",
  display_number: "SYN-SRV-000127",
  owner_id: owner,
  owner_name: "SYN Alex Chen",
  version: 3,
  revision: 2,
  state: "Submitted",
  content,
};
export const register = () => ({
  items: [
    {
      ...record,
      site_name: "SYN Riverside Nursery",
      timezone: "Australia/Brisbane",
      planned_at: content.visit.planned_at,
      open_gaps: 1,
      observation_count: 1,
      handover: null,
    },
  ],
  owner_options: [{ id: owner, display_name: "SYN Alex Chen" }],
  view_counts: { Submitted: 1 },
  total_count: 1,
  next_cursor: null,
  observed_at,
  actor_id: reviewer,
  completeness: "Bounded permitted view",
});
export const workspace = () => ({
  record: structuredClone(record),
  kind: "Survey",
  actor_id: reviewer,
  can_edit: true,
  photos: [],
  reviews: [],
  evidence_status: {},
  history: [],
  history_scope: "Latest permitted retained records",
  observed_at,
  events: [],
  snapshots: [
    {
      id: "44000000-0000-4000-8000-000000009903",
      revision: 2,
      kind: "Submission",
      recorded_by: owner,
      recorded_at: observed_at,
      content_hash: "a".repeat(64),
      basis: {
        content,
        owner_id: owner,
        dependencies: { ["Site:" + site]: 1 },
      },
      recheck_required: false,
    },
  ],
  survey: {
    site: {
      id: site,
      name: "SYN Riverside Nursery",
      timezone: "Australia/Brisbane",
    },
    organisations: [],
    followups: [],
    contact: null,
    people: [
      { id: owner, display_name: "SYN Alex Chen" },
      { id: reviewer, display_name: "SYN Morgan Lee" },
    ],
    targets: [],
    photo_facts: [],
    captions: [],
    sources: [] as {
      key: string;
      id: string;
      name: string;
      version: number;
      current_version: number;
      changed: boolean;
    }[],
    independent_reviewer: true,
  },
});

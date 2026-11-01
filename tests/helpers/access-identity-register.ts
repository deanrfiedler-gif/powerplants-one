import type {
  IdentityRegisterData,
  IdentityRegisterRow,
} from "../../src/access/identity-register-model";

// Visual-only synthetic projection of accepted Figma register frame 1551:23811.
// No user, grant, team or request is installed by this fixture.
export function identityRegisterFixture(): IdentityRegisterData {
  const names = [
    "Alex Nguyen",
    "Casey Ward",
    "Dean Fiedler",
    "Hosted identity (masked)",
    "Hosted identity (masked)",
    "Jamie Park",
    "Jordan Kim",
    "Kai Morgan",
    "Morgan Lee",
    "Riley Tran",
    "Robin Hale",
    "Sam Patel",
    "Sasha Cole",
    "Taylor Quinn",
  ];
  const counts = [9, 9, 14, 4, 4, 12, 11, 10, 0, 8, 9, 13, 16, 7];
  const items: IdentityRegisterRow[] = names.map((display_name, i) => ({
    id: `30000000-0000-4000-8000-${String(i + 101).padStart(12, "0")}`,
    display_name,
    active: i !== 8,
    masked: i === 3 || i === 4,
    grant_count:
      counts[i] +
      ([1, 11, 12].includes(i) ? 1 : 0) +
      ([7, 12].includes(i) ? 1 : 0),
    current_count: counts[i],
    scheduled_count: [7, 12].includes(i) ? 1 : 0,
    expired_count: [1, 11, 12].includes(i) ? 1 : 0,
    workspace_scope: i === 6 || i === 13,
    company_keys:
      i === 13 ? [] : [2, 10].includes(i) ? ["SYN-A", "SYN-B"] : ["SYN-A"],
    site_count: i === 12 ? 1 : 0,
    teams: [0, 1, 9].includes(i)
      ? ["Field crew North"]
      : [11, 12].includes(i)
        ? ["Service coordination"]
        : [],
    submitted_count: i === 9 ? 1 : 0,
    approved_count: i === 12 ? 1 : 0,
    next_scheduled_at: [7, 12].includes(i) ? "2026-10-19T00:00:00Z" : null,
    last_changed_at: [7, 12].includes(i)
      ? "2026-10-09T04:10:00Z"
      : [3, 4].includes(i)
        ? "2026-10-07T04:10:00Z"
        : "2026-10-02T04:10:00Z",
  }));
  return {
    items,
    total: 14,
    offset: 0,
    has_more: false,
    observed_at: "2026-10-12T23:00:00Z",
    local_details_available: true,
    counts: { all: 14, active: 13, inactive: 1, hosted: 2 },
    companies: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        display_name: "SYN Greenhouse Demonstration",
        erp_company_id: "SYN-A",
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        display_name: "SYN Greenhouse Demonstration",
        erp_company_id: "SYN-B",
      },
    ],
  };
}

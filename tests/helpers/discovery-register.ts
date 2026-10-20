import type {
  DiscoveryRegisterData,
  DiscoveryRegisterRow,
} from "../../src/estimating/discovery-register-model";
const fixtureId = (kind: number, n: number) =>
  `e2000000-0000-4000-${kind}-${String(n).padStart(12, "0")}`;
export const discoveryOwnerIds = {
  "Dean Fiedler": fixtureId(8001, 1),
  "Jordan Kim": fixtureId(8001, 2),
  "Alex Nguyen": fixtureId(8001, 3),
};
// Test-only synthetic story from the live ES-02 reference; no seeded business records.
const stories = [
  [
    340,
    "Propagation house irrigation",
    "SYN Riverbend Nursery",
    "NotRecorded",
    1,
    1,
    "Jordan Kim",
    "2026-10-12",
  ],
  [
    337,
    "Fertigation dosing skid",
    "SYN Isolation Nursery",
    "Complete",
    1,
    1,
    "Dean Fiedler",
    "2026-10-10",
  ],
  [
    331,
    "Greenhouse fertigation upgrade",
    "SYN Greenhouse Demonstration",
    "Complete",
    3,
    1,
    "Jordan Kim",
    "2026-10-08",
  ],
  [
    334,
    "Shade screen replacement, Block B",
    "SYN Systems",
    "Complete",
    2,
    3,
    "Alex Nguyen",
    "2026-10-07",
  ],
  [
    329,
    "Boiler controls and sensors",
    "SYN Systems",
    "Incomplete",
    2,
    1,
    "Dean Fiedler",
    "2026-10-06",
  ],
  [
    322,
    "Climate screen motors",
    "SYN Greenhouse Demonstration",
    "Complete",
    2,
    2,
    "Alex Nguyen",
    "2026-10-05",
  ],
  [
    318,
    "Packhouse cold room monitoring",
    "SYN Greenhouse Demonstration",
    "NotRecorded",
    1,
    1,
    "Jordan Kim",
    "2026-09-29",
  ],
  [
    326,
    "Northbank climate & irrigation upgrade",
    "SYN Northbank Nursery",
    "Incomplete",
    3,
    3,
    "Dean Fiedler",
    "2026-09-20",
  ],
] as const;
export const discoveryFixture = (): DiscoveryRegisterData => ({
  as_at: "2026-10-12T23:00:00.000Z",
  can_create: true,
  limit: 100,
  synthetic: true,
  items: stories.map(
    ([
      number,
      title,
      customer,
      state,
      revision,
      count,
      owner,
      changed,
    ]): DiscoveryRegisterRow => {
      const id = `e2000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
      const selectedIndex = number === 334 ? 1 : 0;
      const options = Array.from({ length: count }, (_, i) => ({
        id: fixtureId(8100, number * 10 + i + 1),
        label: i
          ? i === 1
            ? "Reduced scope"
            : "Staged delivery"
          : "Base scope",
        ordinal: i + 1,
        state: "Active" as const,
        revision_id: fixtureId(
          8200,
          number * 100 + i * 10 + (i === selectedIndex ? revision : 1),
        ),
        revision: i === selectedIndex ? revision : 1,
        kind:
          number === 318 ? ("LegacyManual" as const) : ("Discovery" as const),
        scope_readiness: state,
      }));
      return {
        id,
        title,
        version: 1,
        company_id: "20000000-0000-4000-8000-000000000001",
        opportunity_id: fixtureId(8002, number),
        display_number: `SYN-PPO-OPP-${String(number).padStart(6, "0")}`,
        selected_option_id: options[selectedIndex].id,
        options,
        customer: {
          id: fixtureId(
            8003,
            [
              "SYN Riverbend Nursery",
              "SYN Isolation Nursery",
              "SYN Greenhouse Demonstration",
              "SYN Systems",
              "SYN Northbank Nursery",
            ].indexOf(customer) + 1,
          ),
          name: customer,
        },
        owner: { id: discoveryOwnerIds[owner], name: owner },
        updated_at: `${changed}T05:42:00.000Z`,
        cost:
          number === 340 || number === 318
            ? { status: "NoEstimate" }
            : {
                status: "Available",
                estimate_id: fixtureId(8300, number),
                version_id: fixtureId(8400, number),
                version:
                  number === 326 || number === 329
                    ? 4
                    : number === 331
                      ? 3
                      : number === 337
                        ? 1
                        : 2,
                revision_id: fixtureId(
                  8200,
                  number * 100 +
                    selectedIndex * 10 +
                    ([334, 329].includes(number)
                      ? 1
                      : number === 326
                        ? 2
                        : revision),
                ),
                revision: [334, 329].includes(number)
                  ? 1
                  : number === 326
                    ? 2
                    : revision,
                latest_costed: ![334, 329, 326].includes(number),
                amount: number === 326 ? "58400.00" : "10000.00",
              },
      };
    },
  ),
});

// Only fields consumed by the snapshot are projected; these are HTTP fixture stories.
export function discoverySnapshotFixture() {
  const row = discoveryFixture().items[7],
    selected = row.options[0];
  const history = {
    items: [3, 2, 1].map((version) => ({
      id: fixtureId(8200, 32600 + version),
      version,
      kind: "Discovery",
      scope_readiness: version === 3 ? "Incomplete" : "Complete",
      created_at: "2026-09-20T04:42:00Z",
      author: "Dean Fiedler",
      reason: "SYN saved scope evidence",
    })),
    next: null,
    limit: 20,
  };
  return {
    row,
    history,
    detail: {
      workspace: { selected_option_id: selected.id },
      options: row.options.map((option, i) => ({
        option,
        revision: {
          id: option.revision_id,
          version: option.revision,
          kind: option.kind,
          scope_readiness: option.scope_readiness,
          created_at: "2026-09-20T04:42:00Z",
          reason: "SYN current scope evidence",
          observed_context: { site: { display_name: "Northbank site" } },
          input: {
            scope: {
              systems: [
                { tag: "Climate" },
                { tag: "Irrigation" },
                { tag: "Screening" },
              ],
              facility_ids: [fixtureId(8500, 1), fixtureId(8500, 2)],
            },
          },
        },
        evaluation: {
          open_items: i ? [] : ["SYN follow-up one", "SYN follow-up two"],
        },
        history_count: i ? 1 : 3,
        cost: i
          ? { status: "NoEstimate" }
          : {
              status: "Available",
              version: 4,
              amount: "58400.00",
              basis: { revision: 2 },
            },
      })),
    },
    summary: {
      status: "Available",
      estimate_id: fixtureId(8300, 326),
      estimate_version_id: fixtureId(8400, 326),
      version: 4,
      sell_total: "58400.00",
      currency: "AUD",
      tax_basis: "ExcludingTax",
      tax_calculated: false,
      basis: { revision: 2, revision_id: fixtureId(8200, 32602) },
    },
  };
}

export const discoveryIdentityFixture = {
  actor_id: discoveryOwnerIds["Dean Fiedler"],
  workspace_id: "10000000-0000-4000-8000-000000000001",
  display_name: "Dean Fiedler",
};
export const discoveryShellFixture = {
  preference_scope: "synthetic-discovery-register",
  display_name: "Dean Fiedler",
  actions: [],
  navigation: [
    "work",
    "estimates",
    "intake",
    "wizard",
    "configurations",
    "pricing",
    "quotations",
    "estimate-reviews",
  ],
  can_preview: true,
  conversations: true,
};

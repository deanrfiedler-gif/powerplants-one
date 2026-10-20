import type { Page } from "@playwright/test";
import {
  fields,
  type Facility,
  type Preview,
  type Source,
} from "../../src/shared/facilities/definition";
import type { RegisterRow } from "../../src/shared/facilities/reads";
import {
  detailsToComplete,
  growingUses,
} from "../../src/shared/facilities/presentation";

// UI-only synthetic story from the accepted CS-05 compositions. Never seeded or sent to an adapter.
export const areaId = "c5050020-0000-4000-8000-000000000004";
export const parentId = "c5050020-0000-4000-8000-000000000001";
export const siteId = "c5050021-0000-4000-8000-000000000004";
const companyId = "20000000-0000-4000-8000-000000000001";
const observed = "2026-10-12T23:00:00.000Z";
const source: Source = {
  id: "c5050022-0000-4000-8000-000000000001",
  version: 1,
  kind: "reported_note",
  title: "Grower walkthrough",
  note: "SYN observed with the grower",
  source_date: "2026-10-08",
  recorded_at: observed,
  recorded_by: "SYN Sasha Cole",
  replaces_source_id: null,
};
export const facility: Facility = {
  id: areaId,
  version: 7,
  site_id: siteId,
  company_id: companyId,
  site_name: "SYN Glasshouse 4",
  timezone: "Australia/Brisbane",
  reference: null,
  path: [
    {
      id: parentId,
      name: "Glasshouse 4",
      version: 3,
      parent_relationship: null,
    },
  ],
  can_edit: true,
  counts: { equipment: 3, sources: 1, history: 1 },
  updated_at: "2026-10-11T22:40:00.000Z",
  updated_by: "SYN Sasha Cole",
  updated_by_name: "Sasha Cole",
  pin: {
    latitude: "-27.4",
    longitude: "153.1",
    state: "proposed",
    checked_on: null,
    source,
  },
  details: {
    ...Object.fromEntries(Object.keys(fields).map((k) => [k, null])),
    name: "Bay 4",
    structure_type: "greenhouse",
    parent_facility_id: parentId,
    parent_relationship: "physically_within",
    greenhouse_cladding: "glass",
    bay_count: 1,
    use: "production",
    crop: "Tomatoes",
    on_site_position: "North-east end of Glasshouse 4",
    footprint_m2: "1152",
    length_m: "48",
    width_m: "24",
    maximum_height_m: "6.2",
    measurement_basis: "approximate",
    measurement_observed_on: "2026-10-08",
    measurement_source: source,
    location_source: source,
    season_label: "Spring 2026",
    context_observed_on: "2026-10-08",
    context_source: source,
  },
};
export function designRows(): RegisterRow[] {
  const names = [
    "Glasshouse 4",
    "Bay 3",
    "Bay 4",
    "Pump shed",
    "Fertigation room",
    "North annex",
  ];
  return Array.from({ length: 31 }, (_, i) => ({
    id:
      i === 0
        ? parentId
        : i === 2
          ? areaId
          : `c5050020-0000-4000-8000-${String(i + 10).padStart(12, "0")}`,
    name: names[i] ?? `SYN growing area ${i - 5}`,
    site_id:
      i < 6
        ? siteId
        : `c5050021-0000-4000-8000-${String(5 + Math.floor((i - 6) / 5)).padStart(12, "0")}`,
    company_id: companyId,
    site_name:
      i < 6
        ? "SYN Glasshouse 4"
        : ([
            "SYN Fernvale Nursery",
            "SYN Greenridge Farm",
            "SYN Harbour Growers",
            "SYN Hillside Nursery",
            "SYN Willowbank Nursery",
          ][Math.floor((i - 6) / 5)] ?? "SYN Willowbank Nursery"),
    reference: null,
    parent_facility_id: i === 1 || i === 2 ? parentId : null,
    parent_name: i === 1 || i === 2 ? "Glasshouse 4" : null,
    parent_relationship: i === 1 || i === 2 ? "physically_within" : null,
    structure_type:
      i === 5
        ? "unknown"
        : i === 3 || i === 4 || i >= 20
          ? "non_growing_facility"
          : "greenhouse",
    use:
      i === 5
        ? "unknown"
        : i === 3 || i === 4 || i >= 20
          ? "non_growing"
          : "production",
    crop: i === 3 || i === 4 || i >= 20 ? null : "Tomatoes",
    footprint_m2: [5, 9, 10, 11].includes(i) ? null : i === 2 ? "1152" : "2400",
    measurement_basis: "approximate",
    on_site_position: null,
    updated_at: observed,
    updated_by_name: "Sasha Cole",
    timezone: "Australia/Brisbane",
    installed_equipment_count: i === 2 ? 2 : 0,
    has_children: i === 0,
    ancestor_path:
      i === 1 || i === 2 ? [{ id: parentId, name: "Glasshouse 4" }] : [],
  }));
}
export const envelope = (items: unknown[]) => ({
  items,
  next_cursor: null,
  observed_at: observed,
  completeness: "complete",
});
export async function mockFacilities(
  page: Page,
  options: {
    state?: "loading" | "error" | "denied" | "empty";
    readOnly?: boolean;
    conflict?: boolean;
    uncertain?: boolean;
  } = {},
) {
  let version = 7;
  const sent: Record<string, unknown>[] = [];
  await page.route(/kit\.fontawesome\.com|ka-f\.fontawesome\.com/, (route) =>
    route.abort(),
  );
  await page.route("**/api/v1/facilities/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/register")) {
      if (options.state === "loading") return; // Deliberately pending until the test closes its page.
      if (["error", "denied"].includes(options.state ?? ""))
        return route.fulfill({
          status: options.state === "denied" ? 403 : 503,
          json: { code: "RecordUnavailable", message: "SYN unavailable" },
        });
      const all = designRows();
      let rows = options.state === "empty" ? [] : all;
      if (url.searchParams.get("site_id"))
        rows = rows.filter(
          (r) => r.site_id === url.searchParams.get("site_id"),
        );
      const q = url.searchParams.get("q")?.toLowerCase();
      if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q));
      return route.fulfill({
        json: {
          ...envelope(rows),
          total: rows.length,
          can_create: !options.readOnly,
          view_counts: {
            all: all.length,
            growing: all.filter((r) =>
              (growingUses as readonly string[]).includes(r.use ?? ""),
            ).length,
            non_growing: all.filter((r) => r.use === "non_growing").length,
            incomplete: all.filter(detailsToComplete).length,
          },
        },
      });
    }
    if (url.pathname.endsWith("/workspace"))
      return route.fulfill({
        json: {
          ...facility,
          version,
          can_edit: !options.readOnly,
          details: {
            ...facility.details,
            ...(version > 7 ? { crop: "Capsicum" } : {}),
          },
        },
      });
    if (url.pathname.endsWith("/sources"))
      return route.fulfill({ json: envelope([source]) });
    if (url.pathname.endsWith("/history"))
      return route.fulfill({
        json: envelope([
          {
            id: "synthetic-history",
            reason: "Grower walkthrough",
            actor: "Sasha Cole",
            occurred_at: observed,
            details: { version: 7, changes: [] },
          },
        ]),
      });
    if (url.pathname.endsWith("/equipment")) {
      const items =
        url.searchParams.get("state") === "ended"
          ? [
              {
                id: "ended-link",
                equipment_id: "synthetic-actuator",
                description: "Vent actuator VA-41",
                display_number: "SYN-VA-41",
                installed_name: "Glasshouse 4",
                ended_at: "2026-10-02T00:00:00Z",
                end_reason: "Replaced during the October service",
                ended_by_name: "Sasha Cole",
              },
            ]
          : [
              {
                id: "synthetic-motor",
                description: "Shade screen motor M-4",
                installed: true,
                installed_name: "Bay 4",
                link_id: null,
                serves: [{ id: parentId, name: "Glasshouse 4" }],
              },
              {
                id: "synthetic-sensor",
                description: "Temperature sensor TS-5",
                installed: true,
                installed_name: "Bay 4",
                link_id: "sensor-link",
                serves: [{ id: areaId, name: "Bay 4" }],
              },
              {
                id: "synthetic-valve",
                description: "Irrigation valve bank VB-4",
                installed: false,
                installed_name: "Pump shed",
                link_id: "valve-link",
                serves: [
                  { id: parentId, name: "Glasshouse 4" },
                  { id: areaId, name: "Bay 4" },
                ],
              },
            ];
      return route.fulfill({
        json: { ...envelope(items), can_edit: !options.readOnly },
      });
    }
    if (url.pathname.endsWith("/preview-change")) {
      const body = route.request().postDataJSON();
      const rows = Object.entries(body.changes as Record<string, unknown>)
        .filter(([key, value]) => value !== facility.details[key])
        .map(([field, after]) => ({
          field,
          label: fields[field].label,
          before: facility.details[field],
          after,
        }));
      const result: Preview = {
        target_id: areaId,
        version,
        proposal_hash: JSON.stringify(body.changes),
        dependency_hash: "synthetic",
        acknowledgements: ["clearing"],
        rows,
        clearing: rows.filter((r) => r.after === null),
        proposed: { ...facility.details, ...body.changes },
        equipment_review: false,
        dependencies: {
          parent_before: facility.path,
          parent_after: facility.path,
          equipment: [],
          equipment_more: false,
        },
      };
      return route.fulfill({ json: result });
    }
    if (url.pathname.endsWith("/revise")) {
      sent.push(route.request().postDataJSON());
      if (options.conflict && sent.length === 1) {
        version = 8;
        return route.fulfill({
          status: 409,
          json: { code: "VersionConflict", message: "SYN version changed" },
        });
      }
      if (options.uncertain && sent.length === 1) return route.abort();
      return route.fulfill({
        json: {
          operation_id: sent.at(-1)!.operation_id,
          record_id: areaId,
          record_version: version + 1,
        },
      });
    }
    return route.fallback();
  });
  await page.route(`**/api/v1/sites/${siteId}`, (route) =>
    route.fulfill({
      json: envelope([
        {
          id: siteId,
          company_id: companyId,
          display_name: "SYN Glasshouse 4",
          timezone: "Australia/Brisbane",
        },
      ]),
    }),
  );
  await page.route("**/api/v1/sites?*", (route) =>
    route.fulfill({
      json: envelope([
        {
          id: siteId,
          company_id: companyId,
          display_name: "SYN Glasshouse 4",
          timezone: "Australia/Brisbane",
        },
      ]),
    }),
  );
  await page.route("**/api/v1/operations/**", (route) =>
    route.fulfill({ status: 404, json: { code: "RecordUnavailable" } }),
  );
  return sent;
}

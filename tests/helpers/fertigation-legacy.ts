import { families } from "../../src/estimating/fertigation/definition";
import { legacyContract } from "../../src/estimating/fertigation/legacy-contract";

/** Synthetic issued-field fixture; production import never supplies missing fields. */
export function legacyRecord(
  kind: string,
  values: Record<string, unknown>,
  schema: 1 | 2 = 2,
) {
  const defaults = Object.fromEntries(
    Object.entries(legacyContract[kind].fields)
      .filter(([, field]) => schema === 2 || !field.added_in_schema_2)
      .map(([key, field]) => [
        key,
        field.type === "number"
          ? null
          : ["multi", "allocations"].includes(field.type)
            ? []
            : "",
      ]),
  );
  return { ...defaults, ...values };
}
export function legacyProject(schema: 1 | 2 = 2): Record<string, unknown> {
  const p: Record<string, unknown> = {
    schema_version: schema,
    app_version: "synthetic-issued-contract",
    project_id: "project-1",
    revision: 3,
    updated_at: "2026-09-22T00:00:00.000Z",
    synthetic: true,
    selected_scenario_id: "scenario-1",
    selected_profile_id: null,
    curve_points: [],
    system_curve_points: [],
    snapshots: [],
    activity: [],
    review_history: [],
    review: null,
  };
  for (const [kind, contract] of Object.entries(legacyContract))
    p[kind] = contract.singleton ? legacyRecord(kind, {}, schema) : [];
  p.project = legacyRecord(
    "project",
    {
      name: "Synthetic legacy",
      stage: "Discovery",
      project_type: "New installation",
    },
    schema,
  );
  p.blocks = [
    legacyRecord(
      "blocks",
      { id: "block-1", name: "Block", phase: "Proposed", area_ha: 2 },
      schema,
    ),
  ];
  p.scenarios = [
    legacyRecord(
      "scenarios",
      {
        id: "scenario-1",
        name: "Scenario",
        group_ids: [],
        include_future: "No",
        cycles: null,
        start_time: "06:00",
        end_time: "18:00",
      },
      schema,
    ),
  ];
  p.profiles = families.map((name, i) =>
    legacyRecord("profiles", { id: `profile-${i}`, name }, schema),
  );
  return p;
}
/** Complete deliberately sparse overrides used in mapper tests, before serialization. */
export function legacyJson(value: Record<string, unknown>): string {
  const p = structuredClone(value),
    schema = p.schema_version as 1 | 2;
  for (const [kind, contract] of Object.entries(legacyContract)) {
    if (contract.singleton)
      p[kind] = legacyRecord(kind, p[kind] as Record<string, unknown>, schema);
    else
      p[kind] = (p[kind] as Record<string, unknown>[]).map((row) =>
        legacyRecord(kind, row, schema),
      );
  }
  return JSON.stringify(p);
}

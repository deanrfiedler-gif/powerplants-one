import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { commandPackage } from "../../src/projects/specialist/commands";
import {
  setCommand,
  sourceCommand,
  lineCommand,
  releaseCommand,
} from "../../src/engineering/materials/commands";
import { specialistFixture, packageAction } from "./project-specialist";

export const handoverAction = <T extends Record<string, unknown>>(
  fields: T,
) => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN exact specialist handover",
  ...fields,
});

export async function specialistHandoverFixture(acceptBrief = true) {
  const f = await specialistFixture();
  f.package.content.scope += '\nSYN café / α interface, exact quoted "scope".';
  const receiver = (await createSession("materials-supply")).principal,
    technical = (await createSession("materials-reviewer")).principal,
    releaser = (await createSession("materials-release")).principal;
  // Explicit fixture-only source visibility, never application grants or borrowed write duties.
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
    SELECT g.workspace_id,$2,g.company_id,g.capability,g.scope_type,g.scope_id,g.site_id FROM ppo.permission_grants g
    WHERE g.workspace_id=$1 AND g.user_id=$3 AND g.capability LIKE '%.read'
    AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants r WHERE r.workspace_id=g.workspace_id AND r.user_id=$2 AND r.capability=g.capability AND r.scope_type=g.scope_type AND r.scope_id=g.scope_id)`,
    [f.owner.workspace_id, receiver.actor_id, f.owner.actor_id],
  );
  await commandPackage(f.owner, f.project.id, f.package);
  await commandPackage(
    f.owner,
    f.project.id,
    packageAction(f.package.id, 1, "Submit"),
  );
  if (acceptBrief)
    await commandPackage(
      f.reviewer,
      f.project.id,
      packageAction(f.package.id, 2, "Accept"),
    );
  const engineering = f.engineering.id,
    set = randomUUID(),
    line = randomUUID(),
    release = randomUUID();
  const sources = {
    drawing: randomUUID(),
    basis: randomUUID(),
    demand: randomUUID(),
  };
  for (const [key, kind] of [
    ["drawing", "DrawingIssue"],
    ["basis", "DesignBasis"],
    ["demand", "DemandAuthority"],
  ] as const)
    await sourceCommand(
      f.owner,
      engineering,
      handoverAction({
        action: "publish",
        id: sources[key],
        kind,
        reference: `SYN-R2-${key}`,
        title: `SYN ${key} evidence`,
        revision: "A",
        file_version: "1.0",
        permitted_purpose: "Procurement",
        content: `SYN fictional ${key}, no operational authority`,
      }),
    );
  await setCommand(
    f.owner,
    engineering,
    handoverAction({
      action: "create",
      id: set,
      set_code: "R2",
      revision: 1,
      title: "SYN specialist materials",
    }),
  );
  await lineCommand(
    f.owner,
    engineering,
    handoverAction({
      action: "save",
      line_id: line,
      set_id: set,
      line_number: "010",
      description: "SYN tubing",
      category: "Pipe and tube",
      specification: "SYN exact drawing requirement",
      discipline: "Hydraulics",
      system_name: "SYN irrigation",
      location: "SYN site",
      served_areas: ["SYN area"],
      quantity: "120",
      unit: "M",
      quantity_basis: "SYN drawing measured length",
      required_by: null,
      purpose: "TechnicalReleaseForProcurement",
      manufacturer: "SYN",
      model: "SYN tube",
      supplier_part: "SYN-T",
      product_ref: "SYN-T",
      kit_role: "Independent",
      drawing_source_id: sources.drawing,
      basis_source_id: sources.basis,
      scope_decision_needed: false,
      next_owner_id: f.owner.actor_id,
      next_action: "SYN independent review",
      action_due: null,
    }),
  );
  await lineCommand(
    f.owner,
    engineering,
    handoverAction({
      action: "binding",
      line_id: line,
      expected_version: 1,
      mapping: "Verified",
      mapping_configuration: "SYN-ITEMS-2026",
      mapping_entity: "SYN-A",
      mapping_item_key: "SYN-T",
      mapping_item_description: "SYN tubing pack",
      target_unit: "PACK",
      conversion_numerator: 30,
      conversion_denominator: 1,
      whole_units_only: true,
      target_precision: 0,
      conversion_evidence: "SYN 30 M per PACK",
    }),
  );
  for (const [actor, fields] of [
    [
      f.owner,
      {
        action: "prepare",
        id: release,
        set_id: set,
        purpose: "TechnicalReleaseForProcurement",
        audience: "SYN Supply",
        selection: [{ line_id: line, quantity: "120" }],
      },
    ],
    [f.owner, { action: "submit", release_id: release, expected_version: 1 }],
    [
      technical,
      {
        action: "review",
        release_id: release,
        expected_version: 2,
        result: "Accepted",
        rationale: "SYN exact technical check",
      },
    ],
    [
      releaser,
      { action: "authorise", release_id: release, expected_version: 3 },
    ],
    [releaser, { action: "issue", release_id: release, expected_version: 4 }],
  ] as const)
    assert.equal(
      (await releaseCommand(actor, engineering, handoverAction(fields)))
        .replayed,
      false,
    );
  const prepare = handoverAction({
    action: "prepare",
    id: randomUUID(),
    release_id: release,
    requested_action: "ProcurementReady",
    demand_basis: "Approved",
    demand_source_id: sources.demand,
    receiver_id: receiver.actor_id,
    required_by: null,
    predecessor_id: null,
    specialist: { id: f.package.id, version: 3 },
  });
  return {
    ...f,
    receiver,
    technical,
    releaser,
    set,
    line,
    release,
    sources,
    prepare,
  };
}

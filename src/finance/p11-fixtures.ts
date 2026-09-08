import type { PoolClient } from "pg";
import { insert } from "../documents/packs";
import { hash, travelBasis } from "./context";

export async function seedP11Finance(c: PoolClient) {
  const workspace = "10000000-0000-4000-8000-000000000001";
  const current = (
    await c.query(
      "SELECT d.*,p.version AS policy_version FROM ppo.finance_policy p JOIN ppo.finance_definitions d ON (d.workspace_id,d.id)=(p.workspace_id,p.definition_id) WHERE p.workspace_id=$1 FOR UPDATE OF p",
      [workspace],
    )
  ).rows[0];
  if (
    !current ||
    current.id !== "f1000000-0000-4000-8000-000000000001" ||
    current.version !== 1 ||
    current.policy_version !== 1 ||
    hash(current.definition) !== current.content_hash
  )
    throw new Error(
      "P11 seed requires the exact original P10 synthetic definition and policy. Preserve the database and inspect newer policy authority.",
    );
  const definition = {
    ...current.definition,
    name: "P11 F-01–F-07 with separately non-billable Travel",
    predecessor: {
      id: current.id,
      version: current.version,
      content_hash: current.content_hash,
    },
    quantity: {
      ...current.definition.quantity,
      directions: [...current.definition.quantity.directions, "Travel"],
      travel: travelBasis,
    },
  };
  const id = "f1000000-0000-4000-8000-000000000002";
  await insert(c, "finance_definitions", {
    id,
    workspace_id: workspace,
    version: 2,
    definition,
    content_hash: hash(definition),
  });
  await c.query(
    "UPDATE ppo.finance_policy SET definition_id=$2,version=version+1 WHERE workspace_id=$1",
    [workspace, id],
  );
}

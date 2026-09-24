import { randomUUID } from "node:crypto";
import {
  MATERIALS,
  scenarioIds,
  seedMaterialsContext,
  type SignIn,
} from "./engineering-materials";
export const command = (fields: Record<string, unknown>) => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN-PPO retained technical evidence",
  ...fields,
});
export async function seedControlContext(as: SignIn, tag = "") {
  const ids = scenarioIds(false),
    coordinator = await seedMaterialsContext(as, ids, tag),
    source = randomUUID();
  const result = await coordinator(
    `engineering/${ids.package}/materials/sources`,
    command({
      action: "publish",
      id: source,
      kind: "DesignBasis",
      reference: `SYN-PPO-INPUT-${source.slice(0, 8)}`,
      title: "SYN-PPO verified fictional brief",
      revision: "A",
      file_version: "7.2",
      permitted_purpose: "DesignCoordination",
      content:
        "SYNTHETIC input reference. No actual engineering calculation or certified design.",
    }),
  );
  if (result.status !== 201) throw Error(JSON.stringify(result));
  return {
    ids,
    source,
    base: `engineering/${ids.package}/control`,
    coordinator,
  };
}
export const basisContent = (source: string) => ({
  schema_version: 1 as const,
  purpose: "DesignPreparation" as const,
  summary: "SYN-PPO irrigation layout design basis",
  exclusions: "No purchase, installation or statutory certification.",
  facility_ids: [],
  source_ids: [source],
  requirements: [
    {
      id: randomUUID(),
      title: "SYN-PPO interface definition",
      owner_id: MATERIALS.author.id,
      criterion: "Fictional interface evidence retained",
      source_ids: [source],
      deliverable_ids: [],
    },
  ],
  inputs: [],
  interfaces: [],
  calculations: [],
});
export const saveFields = (
  kind: string,
  content: unknown,
  extra: Record<string, unknown> = {},
) => ({
  kind,
  action: "save",
  id: randomUUID(),
  reference: `SYN-PPO-${kind.toUpperCase()}-${randomUUID().slice(0, 8)}`,
  title: `SYN-PPO ${kind}`,
  owner_id: MATERIALS.author.id,
  due_date: "2031-10-02",
  expected_version: null,
  predecessor_id: null,
  content,
  ...extra,
});

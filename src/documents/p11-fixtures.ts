import type { PoolClient } from "pg";
import { supportedTemplateDefinition, type OutputFamily } from "./p11-template";
import { rendererVersion } from "./render";
import { digest } from "./store";

// Called once inside the existing guarded seed transaction. Definitions and
// issued evidence are immutable; only the independently versioned policy moves.
export async function seedP11Templates(c: PoolClient) {
  const workspace = "10000000-0000-4000-8000-000000000001";
  const families: {
    family: OutputFamily;
    table: string;
    policy: string;
    prefix: string;
  }[] = [
    {
      family: "OUT-09",
      table: "pack_templates",
      policy: "pack_policy",
      prefix: "c1000000",
    },
    {
      family: "OUT-10",
      table: "report_templates",
      policy: "report_template_policy",
      prefix: "e1000000",
    },
    {
      family: "OUT-14",
      table: "finance_templates",
      policy: "finance_template_policy",
      prefix: "f3000000",
    },
  ];
  for (const { family, table, policy, prefix } of families) {
    const original = `${prefix}-0000-4000-8000-000000000001`,
      successor = `${prefix}-0000-4000-8000-000000000002`;
    const current = (
      await c.query(
        `SELECT p.version AS policy_version,t.* FROM ppo.${policy} p JOIN ppo.${table} t ON (t.workspace_id,t.id)=(p.workspace_id,p.template_id) WHERE p.workspace_id=$1 FOR UPDATE OF p`,
        [workspace],
      )
    ).rows[0];
    if (
      !current ||
      current.id !== original ||
      current.version !== 1 ||
      current.policy_version !== 1 ||
      current.definition !== (await supportedTemplateDefinition(family, 1)) ||
      current.content_hash !== digest(current.definition)
    )
      throw Error(
        `Preserve and review the existing ${family} template policy before the P11 seed; expected exact original version 1.`,
      );
    const definition = await supportedTemplateDefinition(family, 2);
    if (!definition) throw Error("P11 template definition unavailable");
    if (family === "OUT-09")
      await c.query(
        `INSERT INTO ppo.${table}(id,workspace_id,version,name,renderer_version,definition,content_hash) VALUES($1,$2,2,'P11 branded technician job pack',$3,$4,$5)`,
        [successor, workspace, rendererVersion, definition, digest(definition)],
      );
    else
      await c.query(
        `INSERT INTO ppo.${table}(id,workspace_id,version,definition,content_hash) VALUES($1,$2,2,$3,$4)`,
        [successor, workspace, definition, digest(definition)],
      );
    await c.query(
      `UPDATE ppo.${policy} SET template_id=$2,version=version+1 WHERE workspace_id=$1`,
      [workspace, successor],
    );
  }
}

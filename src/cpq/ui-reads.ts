import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { object, uuid } from "../shared/validation";
import { hasPermission } from "../platform/permissions";
import { duty, run } from "./context";
import { definition } from "./validation";
import { testIsolated } from "./runner";
import { hash } from "./hash";
import { tableCoverage } from "./design-runtime";
import { costBindings } from "./costs";
import { productBindings } from "./products";

export async function validateDraft(p: Principal, value: unknown) {
  const q = object(value, ["company_id", "definition"]);
  const company = uuid(q.company_id, "company_id");
  await transaction((c) => duty(c, p, company, "cpq.author"));
  const content = definition(q.definition);
  if (content.schema_version === 4)
    await transaction(async (c) => {
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      await costBindings(c, p, company, content, true);
      await productBindings(c, p, company, content, true);
    });
  return {
    content_hash: hash(content),
    results: await testIsolated(content),
    coverage: tableCoverage(content),
    synthetic: true,
  };
}

// One row per selected option. Every result passes the same source authority as
// an exact run read before any commercial field is returned.
export async function configurationRegister(
  p: Principal,
  query: Record<string, string>,
) {
  const q = object(query, ["company_id"]);
  const company = uuid(q.company_id, "company_id");
  return transaction(async (c) => {
    await duty(c, p, company);
    const candidates = (
      await c.query<{
        id: string;
        title: string;
        option_label: string;
        customer: string;
        owner_id: string;
        created_at: string;
      }>(
        `SELECT DISTINCT ON (r.estimating_workspace_id,r.option_id) r.id,
      o.title, eo.label AS option_label, org.display_name AS customer,
      w.owner_id, r.created_at
      FROM ppo.cpq_runs r
      JOIN ppo.estimating_workspaces w ON (w.workspace_id,w.id)=(r.workspace_id,r.estimating_workspace_id)
      JOIN ppo.estimating_options eo ON (eo.workspace_id,eo.id)=(r.workspace_id,r.option_id)
      JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(w.workspace_id,w.opportunity_id)
      JOIN ppo.organisations org ON (org.workspace_id,org.id)=(o.workspace_id,o.organisation_id)
      WHERE r.workspace_id=$1 AND r.company_id=$2
      ORDER BY r.estimating_workspace_id,r.option_id,r.created_at DESC,r.id DESC LIMIT 100`,
        [p.workspace_id, company],
      )
    ).rows;
    const items = [];
    for (const candidate of candidates) {
      try {
        const saved = await run(c, p, candidate.id);
        items.push({
          ...candidate,
          estimating_workspace_id: saved.estimating_workspace_id,
          option_id: saved.option_id,
          discovery_revision_id: saved.discovery_revision_id,
          state: saved.state,
          totals: saved.result.totals,
          diagnostic_count: saved.result.diagnostics.length,
          release_revision_id: saved.release_revision_id,
        });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    return {
      items,
      limit: 100,
      scanned: candidates.length,
      can_calculate: await hasPermission(c, p, "cpq.calculate", company),
      synthetic: true,
    };
  });
}

export async function ruleRegister(
  p: Principal,
  query: Record<string, string>,
) {
  const q = object(query, ["company_id"]),
    company = uuid(q.company_id, "company_id");
  return transaction(async (c) => {
    await duty(c, p, company);
    const items = (
      await c.query<{
        release_id: string;
        label: string;
        state: string;
        revision_id: string;
        release_version: number;
        rule: import("./types").Rule;
        rule_version: number | null;
        is_active: boolean;
        is_current: boolean;
        updated_at: string;
      }>(
        `SELECT r.id AS release_id,v.definition->>'label' AS label,
      CASE WHEN v.id=r.current_revision_id THEN r.state ELSE 'Published' END AS state,
      v.id AS revision_id,v.version AS release_version,entry AS rule,rv.version AS rule_version,
      COALESCE(v.id=a.revision_id,false) AS is_active,v.id=r.current_revision_id AS is_current,v.created_at AS updated_at
      FROM ppo.cpq_releases r
      LEFT JOIN ppo.cpq_heads h ON (h.workspace_id,h.company_id)=(r.workspace_id,r.company_id)
      LEFT JOIN ppo.cpq_activations a ON (a.workspace_id,a.id)=(h.workspace_id,h.activation_id)
      JOIN ppo.cpq_revisions v ON (v.workspace_id,v.release_id)=(r.workspace_id,r.id)
        AND (v.id=r.current_revision_id OR v.id=a.revision_id)
      CROSS JOIN LATERAL jsonb_array_elements(v.definition->'rules') entry
      LEFT JOIN ppo.cpq_release_members m ON m.workspace_id=v.workspace_id AND m.revision_id=v.id AND m.rule_key=entry->>'key'
      LEFT JOIN ppo.cpq_rule_versions rv ON (rv.workspace_id,rv.id)=(m.workspace_id,m.rule_version_id)
      WHERE r.workspace_id=$1 AND r.company_id=$2
      ORDER BY is_active DESC,r.updated_at DESC,r.id,v.version DESC,entry->>'key' LIMIT 100`,
        [p.workspace_id, company],
      )
    ).rows;
    return {
      items,
      limit: 100,
      can_author: await hasPermission(c, p, "cpq.author", company),
      synthetic: true,
    };
  });
}

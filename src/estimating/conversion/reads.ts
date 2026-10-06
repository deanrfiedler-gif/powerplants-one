import { conversionReadClient } from "./source-authority";
import { followupContext } from "../supply-followup/context";
import { followupAvailable } from "../supply-followup/authority";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { object } from "../../shared/validation";
import { conversionScope, conversionContext } from "./context";
import { conversionPolicy } from "./model";
import {
  dispositionTarget,
  dispositionHistoryAuthority,
} from "../disposition/context";
export async function readConversion(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (client) => {
    await client.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const c = await conversionReadClient(client, p);
    const d = await conversionContext(c, p, id);
    const originalRevision = d.executions[0]?.revision_id ?? id;
    const original =
      originalRevision === id
        ? d
        : await conversionContext(c, p, originalRevision);
    // This actor has just read both source revisions in this locked read.
    // Historical links are checked once each; the set never survives the request.
    const checked = {
      revisions: new Set([id, originalRevision]),
      records: new Set<string>(),
      credits: new Set<string>(),
    };
    const dispositions = [];
    const followups = [];
    const supplySchema = await followupAvailable(c);
    const dispositionSchema = (
      await c.query(
        "SELECT to_regclass('ppo.quote_disposition_events') present",
      )
    ).rows[0].present;
    for (const target of dispositionSchema ? original.targets : []) {
      await dispositionHistoryAuthority(c, p, target.target_id, checked);
      const disposition = await dispositionTarget(
        c,
        p,
        original,
        target.target_id,
        checked,
      );
      dispositions.push(disposition);
      if (supplySchema) {
        const { supply_followup: _returned, ...basis } =
          disposition.basis as typeof disposition.basis & {
            supply_followup?: unknown;
          };
        void _returned;
        followups.push(
          await followupContext(c, p, originalRevision, target.target_id, {
            context: original,
            basis,
            resolved: disposition.status === "Resolved",
            checked,
            history_checked: true,
          }),
        );
      }
    }
    let canWrite = false;
    try {
      await conversionScope(c, p, d, true);
      canWrite = true;
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
    await conversionScope(c, p, d);
    return {
      revision: {
        id: d.q.id,
        quote_id: d.q.quote_id,
        version: d.q.version,
        snapshot: d.q.safe_snapshot,
      },
      issue: { id: d.issue.id, output_hash: d.issue.output_hash! },
      company_id: d.e.company_id,
      preparation: d.state.preparation,
      response: d.state.response,
      current: d.current,
      sequence: d.conversion_sequence,
      events: d.events,
      receiving: d.receiving,
      plan: d.plan,
      source_lines: d.source_lines,
      lines: d.lines,
      holds: d.holds,
      basis: d.basis,
      basis_hash: d.basis_hash,
      plan_applicable: d.plan_applicable,
      executions: d.executions,
      targets: d.targets,
      dispositions,
      followups,
      original_conversion_revision: originalRevision,
      policy: conversionPolicy,
      can_write: canWrite,
      synthetic: true,
    };
  });
}

import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { object } from "../../shared/validation";
import { conversionAuthority, conversionContext } from "./context";
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
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const d = await conversionContext(c, p, id);
    const originalRevision = d.executions[0]?.revision_id ?? id;
    const original =
      originalRevision === id
        ? d
        : await conversionContext(c, p, originalRevision);
    const dispositions = [];
    const dispositionSchema = (
      await c.query(
        "SELECT to_regclass('ppo.quote_disposition_events') present",
      )
    ).rows[0].present;
    for (const target of dispositionSchema ? original.targets : []) {
      await dispositionHistoryAuthority(c, p, target.target_id);
      dispositions.push(
        await dispositionTarget(c, p, original, target.target_id),
      );
    }
    let canWrite = false;
    try {
      await conversionAuthority(c, p, id, true);
      canWrite = true;
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
    await conversionAuthority(c, p, id);
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
      original_conversion_revision: originalRevision,
      policy: conversionPolicy,
      can_write: canWrite,
      synthetic: true,
    };
  });
}

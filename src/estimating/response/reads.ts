import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { object } from "../../shared/validation";
import { responseAuthority, responseContext } from "./context";
import { responsePolicy } from "./model";
export async function readResponse(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const d = await responseContext(c, p, id);
    let canRecord = false;
    try {
      await responseAuthority(c, p, id, true);
      canRecord = true;
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
    await responseAuthority(c, p, id);
    return {
      revision: {
        id: d.q.id,
        quote_id: d.q.quote_id,
        version: d.q.version,
        estimate_id: d.q.estimate_id,
        estimate_version_id: d.q.estimate_version_id,
        snapshot: d.q.safe_snapshot,
        template_version: d.q.template_version,
        template_hash: d.q.template_hash,
      },
      issue: {
        id: d.issue.id,
        output_hash: d.issue.output_hash!,
        issued_at: d.issue.created_at,
        issued_by: d.issue.created_by,
        html_hash: d.issue.manifest!.html_hash,
        pdf_hash: d.issue.manifest!.pdf_hash,
      },
      base: d.base,
      current: d.current,
      sequence: d.sequence,
      events: d.events,
      state: d.state,
      policy: responsePolicy,
      owner_id: d.e.owner_id,
      can_record: canRecord,
      synthetic: true,
    };
  });
}

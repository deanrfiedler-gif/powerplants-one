import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import type { Binding, Run } from "./context";
import type { Calculation, CalculationInput } from "./types";
import { hash } from "./hash";

// Both ordinary calculation and explicit rebase use the same immutable writer.
export async function storeRun(
  c: QueryClient,
  p: Principal,
  input: {
    id: string;
    company_id: string;
    parent_id: string | null;
    reason: string;
    binding: Binding;
    proposal: CalculationInput;
    result: Calculation;
  },
) {
  const { binding, proposal, result } = input;
  const content_hash = hash({ binding, input: proposal, result });
  const saved = (
    await c.query<Run>(
      `INSERT INTO ppo.cpq_runs(id,workspace_id,company_id,display_number,estimating_workspace_id,option_id,discovery_revision_id,release_revision_id,activation_id,parent_id,binding,input,result,content_hash,state,reason,created_by,updated_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17) RETURNING *`,
      [
        input.id,
        p.workspace_id,
        input.company_id,
        null,
        binding.estimating_workspace_id,
        binding.option_id,
        binding.revision_id,
        binding.release_revision_id,
        binding.activation_id,
        input.parent_id,
        binding,
        proposal,
        result,
        content_hash,
        result.ready ? "Ready" : "Blocked",
        input.reason,
        p.actor_id,
      ],
    )
  ).rows[0];
  return {
    ...saved,
    audit_details: {
      content_hash,
      release_revision_id: binding.release_revision_id,
      discovery_revision_id: binding.revision_id,
      parent_id: input.parent_id,
      result_hash: result.result_hash,
      ...(binding.rebase ? { cpq_rebase: binding.rebase } : {}),
    },
  };
}
